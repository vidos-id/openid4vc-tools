import { EncryptJWT, importJWK } from "jose";

import {
	type OpenId4VpRequestInput,
	OpenId4VpRequestSchema,
} from "../schemas.ts";
import { WalletError } from "../wallet.ts";
import type { OpenId4VpAuthorizationResponse } from "./response.ts";

export type PreparedOpenId4VpAuthorizationResponseSubmission = {
	responseMode: ResponseMode;
	url: string;
	method: "POST";
	headers: Record<string, string>;
	body: URLSearchParams;
};

export type OpenId4VpResponseTransport = (
	submission: PreparedOpenId4VpAuthorizationResponseSubmission,
) => Promise<Response>;

export type OpenId4VpResponseSubmissionResult = {
	responseMode: ResponseMode;
	url: string;
	status: number;
	body?: unknown;
	redirectUri?: string;
};

type ResponseMode = OpenId4VpRequestInput["response_mode"] extends infer T
	? Exclude<T, undefined>
	: never;

export async function prepareOpenId4VpAuthorizationResponseSubmission(
	request: OpenId4VpRequestInput,
	response: OpenId4VpAuthorizationResponse,
): Promise<PreparedOpenId4VpAuthorizationResponseSubmission> {
	const parsedRequest = OpenId4VpRequestSchema.parse(request);
	if (!parsedRequest.response_mode) {
		throw new WalletError("response_mode is required for submission");
	}

	const responseUrl = parseHttpsUrl(
		parsedRequest.response_uri,
		"response_uri must use https",
	);
	const body =
		parsedRequest.response_mode === "direct_post"
			? createDirectPostBody(response)
			: await createDirectPostJwtBody(parsedRequest, response);

	return {
		responseMode: parsedRequest.response_mode,
		url: responseUrl.toString(),
		method: "POST",
		headers: {
			"content-type": "application/x-www-form-urlencoded",
		},
		body,
	};
}

export async function submitPreparedOpenId4VpAuthorizationResponse(
	submission: PreparedOpenId4VpAuthorizationResponseSubmission,
	options?: { transport?: OpenId4VpResponseTransport },
): Promise<OpenId4VpResponseSubmissionResult> {
	const transport = options?.transport ?? defaultOpenId4VpResponseTransport;

	let response: Response;
	try {
		response = await transport(submission);
	} catch {
		throw new WalletError("Failed to submit authorization response");
	}

	const parsedBody = await parseSubmissionBody(response);
	return {
		responseMode: submission.responseMode,
		url: submission.url,
		status: response.status,
		body: parsedBody,
		redirectUri: readRedirectUri(parsedBody),
	};
}

export function defaultOpenId4VpResponseTransport(
	submission: PreparedOpenId4VpAuthorizationResponseSubmission,
): Promise<Response> {
	return fetch(submission.url, {
		method: submission.method,
		headers: submission.headers,
		body: submission.body,
	});
}

function parseHttpsUrl(value: string | undefined, errorMessage: string): URL {
	if (!value) {
		throw new WalletError(errorMessage);
	}

	let url: URL;
	try {
		url = new URL(value);
	} catch {
		throw new WalletError(errorMessage);
	}

	if (url.protocol !== "https:") {
		throw new WalletError(errorMessage);
	}

	return url;
}

function createDirectPostBody(
	response: OpenId4VpAuthorizationResponse,
): URLSearchParams {
	const body = new URLSearchParams({ vp_token: response.vp_token });
	if (response.state) {
		body.set("state", response.state);
	}
	return body;
}

async function createDirectPostJwtBody(
	request: OpenId4VpRequestInput,
	response: OpenId4VpAuthorizationResponse,
): Promise<URLSearchParams> {
	const jwt = await encryptAuthorizationResponse(request, response);
	return new URLSearchParams({ response: jwt });
}

async function encryptAuthorizationResponse(
	request: OpenId4VpRequestInput,
	response: OpenId4VpAuthorizationResponse,
): Promise<string> {
	const parsedRequest = OpenId4VpRequestSchema.parse(request);
	const jwk = parsedRequest.client_metadata?.jwks?.keys[0];
	if (!jwk) {
		throw new WalletError(
			"direct_post.jwt requires client_metadata.jwks with one encryption key",
		);
	}

	const alg = resolveJweAlg(jwk as Record<string, unknown>);
	const enc =
		parsedRequest.client_metadata
			?.encrypted_response_enc_values_supported?.[0] ?? "A128GCM";
	return new EncryptJWT(response)
		.setProtectedHeader({ alg, enc, typ: "oauth-authz-resp+jwt" })
		.setAudience(parsedRequest.client_id)
		.setIssuedAt()
		.encrypt(await importJWK(jwk as Record<string, unknown>, alg));
}

function resolveJweAlg(jwk: Record<string, unknown>): string {
	if (typeof jwk.alg === "string" && jwk.alg.length > 0) {
		return jwk.alg;
	}

	if (jwk.kty === "RSA") {
		return "RSA-OAEP-256";
	}

	if (jwk.kty === "EC" || jwk.kty === "OKP") {
		return "ECDH-ES";
	}

	throw new WalletError("Unsupported verifier encryption key");
}

async function parseSubmissionBody(response: Response): Promise<unknown> {
	const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
	const body = await response.text();
	if (body.length === 0) {
		return undefined;
	}

	if (contentType.startsWith("application/json")) {
		return JSON.parse(body) as unknown;
	}

	return body;
}

function readRedirectUri(body: unknown): string | undefined {
	if (!body || typeof body !== "object" || Array.isArray(body)) {
		return undefined;
	}

	const value = (body as Record<string, unknown>).redirect_uri;
	return typeof value === "string" && value.length > 0 ? value : undefined;
}
