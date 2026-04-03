import { decodeJwt, decodeProtectedHeader } from "jose";
import { z } from "zod";

import {
	type OpenId4VpRequestInput,
	OpenId4VpRequestSchema,
	type VerifierClientMetadata,
} from "../schemas.ts";
import { WalletError } from "../wallet.ts";

const openid4vpAuthorizationUrlSchema = z.string().min(1);

const requestObjectHeaderSchema = z.object({
	typ: z.literal("oauth-authz-req+jwt"),
});

const requestObjectClaimsSchema = z
	.object({
		client_id: z.string().min(1).optional(),
		nonce: z.string().min(1).optional(),
		state: z.string().min(1).optional(),
		response_type: z.literal("vp_token").optional(),
		response_mode: z.string().min(1).optional(),
		response_uri: z.string().min(1).optional(),
		client_metadata: z.unknown().optional(),
		dcql_query: z.unknown().optional(),
		scope: z.unknown().optional(),
		presentation_definition: z.unknown().optional(),
	})
	.passthrough();

const openId4VpRawRequestSchema = z
	.object({
		client_id: z.string().min(1).optional(),
		nonce: z.string().min(1).optional(),
		state: z.string().min(1).optional(),
		response_type: z.literal("vp_token").optional(),
		response_mode: z.string().optional(),
		response_uri: z.string().min(1).optional(),
		client_metadata: z.unknown().optional(),
		dcql_query: z.unknown().optional(),
		request: z.string().min(1).optional(),
		request_uri: z.string().min(1).optional(),
		request_uri_method: z.string().optional(),
		scope: z.unknown().optional(),
		presentation_definition: z.unknown().optional(),
	})
	.passthrough()
	.superRefine((value, ctx) => {
		if (value.request && value.request_uri) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Use only one of request or request_uri",
				path: ["request"],
			});
		}

		if (value.request_uri_method && !value.request_uri) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "request_uri_method requires request_uri",
				path: ["request_uri_method"],
			});
		}

		if (
			(value.request || value.request_uri) &&
			value.dcql_query !== undefined
		) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message:
					"Inline dcql_query cannot be combined with request or request_uri",
				path: ["dcql_query"],
			});
		}
	});

type RequestObjectClaims = z.infer<typeof requestObjectClaimsSchema>;
type OpenId4VpRawRequest = z.infer<typeof openId4VpRawRequestSchema>;

export async function parseOpenid4VpAuthorizationUrl(
	input: string,
): Promise<OpenId4VpRequestInput> {
	const value = openid4vpAuthorizationUrlSchema.parse(input).trim();

	let url: URL;
	try {
		url = new URL(value);
	} catch {
		throw new WalletError("Invalid openid4vp authorization URL");
	}

	if (url.protocol !== "openid4vp:") {
		throw new WalletError("Authorization URL must use the openid4vp:// scheme");
	}

	return resolveOpenId4VpRequest({
		client_id: getSingleSearchParam(url, "client_id"),
		nonce: getOptionalSingleSearchParam(url, "nonce"),
		state: getOptionalSingleSearchParam(url, "state"),
		response_type: getOptionalSingleSearchParam(url, "response_type"),
		response_mode: getOptionalSingleSearchParam(url, "response_mode"),
		response_uri: getOptionalSingleSearchParam(url, "response_uri"),
		client_metadata: parseJsonParam(
			getOptionalSingleSearchParam(url, "client_metadata"),
			"client_metadata",
		),
		dcql_query: parseDcqlQueryParam(
			getOptionalSingleSearchParam(url, "dcql_query"),
		),
		request: getOptionalSingleSearchParam(url, "request"),
		request_uri: getOptionalSingleSearchParam(url, "request_uri"),
		request_uri_method: getOptionalSingleSearchParam(url, "request_uri_method"),
		scope: getOptionalSingleSearchParam(url, "scope"),
		presentation_definition: getOptionalSingleSearchParam(
			url,
			"presentation_definition",
		),
	});
}

export async function resolveOpenId4VpRequest(
	input: unknown,
): Promise<OpenId4VpRequestInput> {
	const request = openId4VpRawRequestSchema.parse(input) as OpenId4VpRawRequest;
	const requestUriMethod = request.request_uri_method;
	if (
		requestUriMethod !== undefined &&
		requestUriMethod !== "get" &&
		requestUriMethod !== "post"
	) {
		throw new WalletError("invalid_request_uri_method");
	}

	const requestObject = request.request_uri
		? await fetchRequestObject(request.request_uri, request.client_id)
		: request.request
			? parseRequestObject(request.request)
			: undefined;

	return OpenId4VpRequestSchema.parse({
		client_id: request.client_id ?? requestObject?.client_id,
		nonce: request.nonce ?? requestObject?.nonce,
		state: request.state ?? requestObject?.state,
		response_type: request.response_type ?? requestObject?.response_type,
		response_mode: request.response_mode ?? requestObject?.response_mode,
		response_uri: request.response_uri ?? requestObject?.response_uri,
		client_metadata: parseClientMetadata(
			request.client_metadata ?? requestObject?.client_metadata,
		),
		dcql_query: request.dcql_query ?? requestObject?.dcql_query,
		scope: request.scope ?? requestObject?.scope,
		presentation_definition:
			request.presentation_definition ?? requestObject?.presentation_definition,
	});
}

async function fetchRequestObject(
	requestUri: string,
	clientId?: string,
): Promise<RequestObjectClaims> {
	let url: URL;
	try {
		url = new URL(requestUri);
	} catch {
		throw new WalletError("request_uri must be a valid URL");
	}

	if (url.protocol !== "https:") {
		throw new WalletError("request_uri must use https");
	}

	assertRequestUriMatchesClientId(url, clientId);

	let response: Response;
	try {
		response = await fetch(url, {
			headers: { accept: "application/oauth-authz-req+jwt" },
		});
	} catch {
		throw new WalletError("Failed to fetch request_uri");
	}

	if (!response.ok) {
		throw new WalletError(
			`request_uri fetch failed with status ${response.status}`,
		);
	}

	const contentType = response.headers.get("content-type")?.toLowerCase();
	if (!contentType?.startsWith("application/oauth-authz-req+jwt")) {
		throw new WalletError(
			"request_uri response must use content-type application/oauth-authz-req+jwt",
		);
	}

	return parseRequestObject(await response.text());
}

function parseRequestObject(compactJwt: string): RequestObjectClaims {
	const value = z.string().min(1).parse(compactJwt).trim();
	if (value.split(".").length !== 3) {
		throw new WalletError(
			"Only compact JWS request objects are supported in the demo wallet",
		);
	}

	try {
		requestObjectHeaderSchema.parse(decodeProtectedHeader(value));
		return requestObjectClaimsSchema.parse(decodeJwt(value));
	} catch {
		throw new WalletError(
			"Request object must be a valid JWT with typ=oauth-authz-req+jwt",
		);
	}
}

function parseDcqlQueryParam(value: string | undefined): unknown {
	if (value === undefined) {
		return undefined;
	}

	try {
		return JSON.parse(value);
	} catch {
		throw new WalletError(
			"dcql_query must be valid JSON in the openid4vp:// URL",
		);
	}
}

function parseJsonParam(value: string | undefined, label: string): unknown {
	if (value === undefined) {
		return undefined;
	}

	try {
		return JSON.parse(value);
	} catch {
		throw new WalletError(
			`${label} must be valid JSON in the openid4vp:// URL`,
		);
	}
}

function parseClientMetadata(
	value: unknown,
): VerifierClientMetadata | undefined {
	if (value === undefined) {
		return undefined;
	}

	return z
		.object({
			jwks: z
				.object({
					keys: z.array(z.record(z.string(), z.unknown())).min(1),
				})
				.optional(),
			encrypted_response_enc_values_supported: z
				.array(z.string().min(1))
				.min(1)
				.optional(),
			vp_formats_supported: z.unknown().optional(),
		})
		.passthrough()
		.parse(value) as VerifierClientMetadata;
}

function assertRequestUriMatchesClientId(url: URL, clientId?: string) {
	const clientIdHostname = getClientIdHostname(clientId);
	if (!clientIdHostname) {
		return;
	}

	if (url.hostname !== clientIdHostname) {
		throw new WalletError("request_uri hostname must match client_id hostname");
	}
}

function getClientIdHostname(clientId?: string): string | undefined {
	if (!clientId) {
		return undefined;
	}

	try {
		return new URL(clientId).hostname;
	} catch {
		// noop
	}

	if (clientId.startsWith("x509_san_dns:")) {
		return clientId.slice("x509_san_dns:".length) || undefined;
	}

	const separator = clientId.indexOf(":");
	if (separator > 0) {
		try {
			return new URL(clientId.slice(separator + 1)).hostname;
		} catch {
			return undefined;
		}
	}

	return undefined;
}

function getSingleSearchParam(url: URL, key: string): string {
	const values = url.searchParams.getAll(key);
	if (values.length === 0 || values[0]?.length === 0) {
		throw new WalletError(`Authorization URL is missing ${key}`);
	}
	if (values.length > 1) {
		throw new WalletError(`Authorization URL must include only one ${key}`);
	}
	return values[0] as string;
}

function getOptionalSingleSearchParam(
	url: URL,
	key: string,
): string | undefined {
	const values = url.searchParams.getAll(key);
	if (values.length === 0) {
		return undefined;
	}
	if (values.length > 1) {
		throw new WalletError(`Authorization URL must include only one ${key}`);
	}
	return values[0] || undefined;
}
