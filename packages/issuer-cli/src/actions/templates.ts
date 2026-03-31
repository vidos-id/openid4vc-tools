import { readTextInput } from "@vidos-id/cli-common";
import { IssuerWebClient } from "../client.ts";
import {
	type BaseCliOptions,
	baseCliOptionsSchema,
	templateCreateOptionsSchema,
	templateDeleteOptionsSchema,
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

export async function listTemplatesAction(
	rawOptions: unknown,
	deps: ActionDeps = {},
) {
	const { client, options, serverUrl, session } = await getAuthenticatedClient(
		baseCliOptionsSchema.parse(rawOptions),
		deps,
	);
	const templates = await client.listTemplates();
	await writeStoredSession(
		{ ...session, serverUrl, cookieHeader: client.getCookieHeader() },
		options,
	);
	return { serverUrl, templates };
}

export async function createTemplateAction(
	rawOptions: unknown,
	deps: ActionDeps = {},
) {
	const options = templateCreateOptionsSchema.parse(rawOptions);
	const { client, serverUrl, session } = await getAuthenticatedClient(
		options,
		deps,
	);
	const claimsText =
		options.claims !== undefined || options.claimsFile !== undefined
			? await readTextInput(options.claims, options.claimsFile)
			: undefined;
	const template = await client.createTemplate({
		name: options.name,
		vct: options.vct,
		defaultClaims: claimsText
			? parseJsonObject(claimsText, "template claims")
			: {},
	});
	await writeStoredSession(
		{ ...session, serverUrl, cookieHeader: client.getCookieHeader() },
		options,
	);
	return { serverUrl, template };
}

export async function deleteTemplateAction(
	rawOptions: unknown,
	deps: ActionDeps = {},
) {
	const options = templateDeleteOptionsSchema.parse(rawOptions);
	const { client, serverUrl, session } = await getAuthenticatedClient(
		options,
		deps,
	);
	await client.deleteTemplate(options.templateId);
	await writeStoredSession(
		{ ...session, serverUrl, cookieHeader: client.getCookieHeader() },
		options,
	);
	return { serverUrl, templateId: options.templateId };
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
