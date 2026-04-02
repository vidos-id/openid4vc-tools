import { verbose } from "@vidos-id/openid4vc-cli-common";
import {
	createOpenId4VpAuthorizationResponse,
	type OpenId4VpRequestInput,
	parseOpenid4VpAuthorizationUrl,
	type QueryCredentialMatches,
	resolveOpenId4VpRequest,
	submitOpenId4VpAuthorizationResponse,
	Wallet,
	type WalletStorage,
} from "@vidos-id/openid4vc-wallet";
import { PromptSession } from "../prompts.ts";
import { presentOptionsSchema } from "../schemas.ts";
import { SelectedCredentialStorage } from "../selected-storage.ts";
import { FileSystemWalletStorage } from "../storage.ts";

export async function presentCredentialAction(rawOptions: unknown) {
	const options = presentOptionsSchema.parse(rawOptions);
	const request = await parsePresentationRequest(options.request);
	const storage = new FileSystemWalletStorage(options.walletDir);
	const wallet = options.credentialId
		? await createSelectedWallet(storage, options.credentialId)
		: new Wallet(storage);
	const selectedCredentials = options.credentialId
		? undefined
		: await maybeSelectCredentials(
				wallet,
				request,
				(rawOptions as { prompt?: CredentialPrompt }).prompt,
			);
	const presentation = await wallet.createPresentation(request, {
		selectedCredentials,
	});
	const authorizationResponse = createOpenId4VpAuthorizationResponse(
		request,
		presentation,
	);
	const submission =
		!options.dryRun &&
		(request.response_mode === "direct_post" ||
			request.response_mode === "direct_post.jwt")
			? await submitOpenId4VpAuthorizationResponse(
					request,
					authorizationResponse,
				)
			: undefined;
	return {
		...presentation,
		submitted: submission !== undefined,
		submission,
	};
}

type CredentialPrompt = (queryMatch: QueryCredentialMatches) => Promise<string>;

async function parsePresentationRequest(
	value: string,
): Promise<OpenId4VpRequestInput> {
	const trimmed = unwrapQuotedInput(value.trim());
	if (trimmed.startsWith("openid4vp:")) {
		verbose("Parsing openid4vp:// authorization URL");
		return parseOpenid4VpAuthorizationUrl(trimmed);
	}

	verbose("Parsing inline OpenID4VP request JSON");
	return resolveOpenId4VpRequest(JSON.parse(trimmed) as OpenId4VpRequestInput);
}

function unwrapQuotedInput(value: string): string {
	if (value.length < 2) {
		return value;
	}
	const quote = value[0];
	if ((quote === '"' || quote === "'") && value.at(-1) === quote) {
		return value.slice(1, -1).trim();
	}
	return value;
}

async function maybeSelectCredentials(
	wallet: Wallet,
	request: OpenId4VpRequestInput,
	prompt?: CredentialPrompt,
): Promise<Record<string, string> | undefined> {
	const inspected = await wallet.inspectDcqlQuery(request);
	const ambiguousQueries = inspected.queries.filter(
		(queryMatch) => queryMatch.credentials.length > 1,
	);

	if (ambiguousQueries.length === 0) {
		return undefined;
	}

	const selections: Record<string, string> = {};
	for (const queryMatch of ambiguousQueries) {
		selections[queryMatch.queryId] = prompt
			? await prompt(queryMatch)
			: await promptForCredentialSelection(queryMatch);
	}

	return selections;
}

async function promptForCredentialSelection(
	queryMatch: QueryCredentialMatches,
): Promise<string> {
	if (!process.stdin.isTTY || !process.stdout.isTTY) {
		const candidates = queryMatch.credentials
			.map((c) => `  ${c.credentialId} (${c.vct}, ${c.issuer})`)
			.join("\n");
		throw new Error(
			`Multiple credentials match query "${queryMatch.queryId}":\n${candidates}\n\nRerun with --credential-id to select one, for example:\n  openid4vc-wallet present --wallet-dir <dir> --request <value> --credential-id ${queryMatch.credentials[0]?.credentialId ?? "<id>"}`,
		);
	}

	const prompt = new PromptSession();
	try {
		return await prompt.choose(
			`Multiple credentials match query ${queryMatch.queryId}`,
			queryMatch.credentials.map((credential) => ({
				label: `${credential.credentialId} | ${credential.vct} | ${credential.issuer} | ${formatClaimPreview(credential.claims)}`,
				value: credential.credentialId,
			})),
		);
	} finally {
		prompt.close();
	}
}

function formatClaimPreview(claims: Record<string, unknown>): string {
	const preview = Object.entries(claims)
		.slice(0, 2)
		.map(([key, value]) => `${key}=${formatClaimValue(value)}`)
		.join(", ");
	return preview.length > 0 ? preview : "no disclosed claims";
}

function formatClaimValue(value: unknown): string {
	if (typeof value === "string" || typeof value === "number") {
		return String(value);
	}
	if (typeof value === "boolean") {
		return value ? "true" : "false";
	}
	if (value && typeof value === "object") {
		return JSON.stringify(value);
	}
	return "?";
}

async function createSelectedWallet(
	storage: WalletStorage,
	credentialId: string,
): Promise<Wallet> {
	const credential = await storage.getCredential(credentialId);
	if (!credential) {
		throw new Error(`Credential ${credentialId} not found`);
	}
	return new Wallet(new SelectedCredentialStorage(storage, credential));
}
