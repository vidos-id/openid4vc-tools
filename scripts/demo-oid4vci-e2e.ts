import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	type AccessTokenRecord,
	createIssuer,
	generateIssuerTrustMaterial,
	jwkSchema,
	type NonceRecord,
	type PreAuthorizedGrantRecord,
	serializeCredentialOfferUri,
} from "../packages/issuer/src/index.ts";
import { receiveCredentialAction } from "../packages/wallet-cli/src/index.ts";

async function withMockedFetch(
	mock: (
		input: RequestInfo | URL,
		init?: RequestInit | BunFetchRequestInit,
	) => Promise<Response>,
	run: () => Promise<void>,
): Promise<void> {
	const originalFetch = globalThis.fetch;
	globalThis.fetch = mock as typeof fetch;
	try {
		await run();
	} finally {
		globalThis.fetch = originalFetch;
	}
}

const workspace = await mkdtemp(join(tmpdir(), "oid4vci-e2e-demo-"));
const outputDir = join(workspace, "demo-output");
const walletDir = join(outputDir, "wallet");

await mkdir(walletDir, { recursive: true });

const trust = await generateIssuerTrustMaterial({
	alg: "ES256",
	kid: "demo-issuer-key",
	subject: "/CN=Demo OID4VCI Issuer/O=oid4vp-cli-utils",
});

const issuer = createIssuer(
	{
		issuer: "https://issuer.example",
		signingKey: {
			alg: trust.alg,
			privateJwk: jwkSchema.parse(trust.privateJwk),
			publicJwk: jwkSchema.parse(trust.publicJwk),
		},
		credentialConfigurationsSupported: {
			person: {
				format: "dc+sd-jwt",
				vct: "https://example.com/PersonCredential",
				scope: "PersonCredential",
			},
		},
	},
	{
		now: () => 1_700_000_000,
		idGenerator: (() => {
			const ids = [
				"grant-code-1",
				"access-token-1",
				"nonce-1",
				"issued-nonce-1",
			];
			let index = 0;
			return () => ids[index++] as string;
		})(),
	},
);

const offer = issuer.createCredentialOffer({
	credential_configuration_id: "person",
	claims: {
		given_name: "Ada",
		family_name: "Lovelace",
		birth_date: "1815-12-10",
	},
});
const offerUri = serializeCredentialOfferUri(offer);

let currentGrant: PreAuthorizedGrantRecord = offer.preAuthorizedGrant;
let currentAccessToken: AccessTokenRecord | null = null;
let currentNonce: NonceRecord | null = null;

await withMockedFetch(
	async (input, init) => {
		const url = String(input);
		if (url === "https://issuer.example/.well-known/openid-credential-issuer") {
			return Response.json(issuer.getMetadata());
		}
		if (url === "https://issuer.example/token") {
			const body = new URLSearchParams(String(init?.body));
			const tokenResponse = issuer.exchangePreAuthorizedCode({
				tokenRequest: {
					grant_type: "urn:ietf:params:oauth:grant-type:pre-authorized_code",
					"pre-authorized_code": body.get("pre-authorized_code") ?? "",
				},
				preAuthorizedGrant: currentGrant,
			});
			currentGrant = tokenResponse.updatedPreAuthorizedGrant;
			currentAccessToken = tokenResponse.accessTokenRecord;
			return Response.json(tokenResponse);
		}
		if (url === "https://issuer.example/nonce") {
			const nonce = issuer.createNonce();
			currentNonce = nonce.nonce;
			return Response.json({
				c_nonce: nonce.c_nonce,
				c_nonce_expires_in: nonce.c_nonce_expires_in,
			});
		}
		if (url === "https://issuer.example/credential") {
			if (!currentAccessToken || !currentNonce) {
				throw new Error("Missing token or nonce state");
			}
			const request = JSON.parse(String(init?.body)) as {
				credential_configuration_id: string;
				proofs: { jwt: Array<{ jwt: string }> };
			};
			const proof = await issuer.validateProofJwt({
				jwt: request.proofs.jwt[0]?.jwt ?? "",
				nonce: currentNonce,
			});
			const issued = await issuer.issueCredential({
				accessToken: currentAccessToken,
				credential_configuration_id: request.credential_configuration_id,
				proof,
			});
			currentAccessToken = issued.updatedAccessToken;
			return Response.json(issued);
		}
		throw new Error(`Unexpected fetch ${url}`);
	},
	async () => {
		const result = await receiveCredentialAction({
			walletDir,
			offer: offerUri,
		});

		await writeFile(
			join(outputDir, "issuer-metadata.json"),
			`${JSON.stringify(issuer.getMetadata(), null, 2)}\n`,
			"utf8",
		);
		await writeFile(
			join(outputDir, "credential-offer.txt"),
			`${offerUri}\n`,
			"utf8",
		);
		await writeFile(
			join(outputDir, "stored-credential.json"),
			`${JSON.stringify(result.credential, null, 2)}\n`,
			"utf8",
		);

		const summary = {
			workspace,
			outputDir,
			walletDir,
			credentialId: result.credential.id,
			issuer: result.credential.issuer,
			vct: result.credential.vct,
			claims: result.credential.claims,
		};

		process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
	},
);
