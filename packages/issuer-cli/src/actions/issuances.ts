import { readTextInput } from "@vidos-id/cli-common";
import { IssuerWebClient, statusLabelToValue } from "../client.ts";
import {
	type BaseCliOptions,
	baseCliOptionsSchema,
	issuanceCreateOptionsSchema,
	issuanceIdOptionsSchema,
	issuanceStatusUpdateOptionsSchema,
} from "../schemas.ts";
import {
	assertSessionMatchesServerUrl,
	requireStoredSession,
	resolveServerUrl,
	writeStoredSession,
} from "../session.ts";

type ActionDeps = {
	fetchImpl?: typeof fetch;
};

export async function listIssuancesAction(
	rawOptions: unknown,
	deps: ActionDeps = {},
) {
	const { client, options, serverUrl, session } = await getAuthenticatedClient(
		baseCliOptionsSchema.parse(rawOptions),
		deps,
	);
	const issuances = await client.listIssuances();
	await writeStoredSession(
		{ ...session, serverUrl, cookieHeader: client.getCookieHeader() },
		options,
	);
	return { serverUrl, issuances };
}

export async function createIssuanceAction(
	rawOptions: unknown,
	deps: ActionDeps = {},
) {
	const options = issuanceCreateOptionsSchema.parse(rawOptions);
	const { client, serverUrl, session } = await getAuthenticatedClient(
		options,
		deps,
	);
	const claimsText = await readTextInput(
		options.claims,
		options.claimsFile,
	).catch(() => undefined);
	const input: Parameters<IssuerWebClient["createIssuance"]>[0] = {
		templateId: options.templateId,
	};
	if (claimsText) {
		input.claims = parseJsonObject(claimsText, "issuance claims");
	}
	if (options.status) {
		input.status = statusLabelToValue(options.status);
	}
	const detail = await client.createIssuance(input);
	await writeStoredSession(
		{ ...session, serverUrl, cookieHeader: client.getCookieHeader() },
		options,
	);
	return { serverUrl, detail };
}

export async function showIssuanceAction(
	rawOptions: unknown,
	deps: ActionDeps = {},
) {
	const options = issuanceIdOptionsSchema.parse(rawOptions);
	const { client, serverUrl, session } = await getAuthenticatedClient(
		options,
		deps,
	);
	const detail = await client.getIssuance(options.issuanceId);
	await writeStoredSession(
		{ ...session, serverUrl, cookieHeader: client.getCookieHeader() },
		options,
	);
	return { serverUrl, detail };
}

export async function updateIssuanceStatusAction(
	rawOptions: unknown,
	deps: ActionDeps = {},
) {
	const options = issuanceStatusUpdateOptionsSchema.parse(rawOptions);
	const { client, serverUrl, session } = await getAuthenticatedClient(
		options,
		deps,
	);
	const detail = await client.updateIssuanceStatus(options.issuanceId, {
		status: statusLabelToValue(options.status),
	});
	await writeStoredSession(
		{ ...session, serverUrl, cookieHeader: client.getCookieHeader() },
		options,
	);
	return { serverUrl, detail };
}

async function getAuthenticatedClient(
	options: BaseCliOptions,
	deps: ActionDeps,
) {
	const session = await requireStoredSession(options);
	const serverUrl = resolveServerUrl(options, session);
	assertSessionMatchesServerUrl(serverUrl, session);
	return {
		client: new IssuerWebClient({
			serverUrl,
			fetchImpl: deps.fetchImpl,
			session,
		}),
		options,
		serverUrl,
		session,
	};
}

function parseJsonObject(value: string, label: string) {
	let parsed: unknown;
	try {
		parsed = JSON.parse(value);
	} catch {
		throw new Error(`${label} must be valid JSON`);
	}
	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
		throw new Error(`${label} must be a JSON object`);
	}
	return parsed as Record<string, unknown>;
}
