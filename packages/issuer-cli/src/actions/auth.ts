import type { SessionResponse } from "@vidos-id/openid4vc-issuer-web-shared";
import { IssuerWebClient } from "../client.ts";
import {
	authSignInOptionsSchema,
	authSignUpOptionsSchema,
	baseCliOptionsSchema,
} from "../schemas.ts";
import {
	assertSessionMatchesServerUrl,
	clearStoredSession,
	requireStoredSession,
	resolveServerUrl,
	writeStoredSession,
} from "../session.ts";

type ActionDeps = {
	fetchImpl?: typeof fetch;
};

export async function authSignInAction(
	rawOptions: unknown,
	deps: ActionDeps = {},
) {
	const options = authSignInOptionsSchema.parse(rawOptions);
	const serverUrl = resolveServerUrl(options);
	const client = new IssuerWebClient({ serverUrl, fetchImpl: deps.fetchImpl });
	const session = options.anonymous
		? await client.signInAnonymous()
		: await client.signInUsername({
				username: options.username!,
				password: options.password!,
			});
	const user = requireUser(session);
	await writeStoredSession(
		{
			serverUrl,
			cookieHeader: client.getCookieHeader(),
			user,
		},
		options,
	);
	return { serverUrl, user };
}

export async function authSignUpAction(
	rawOptions: unknown,
	deps: ActionDeps = {},
) {
	const options = authSignUpOptionsSchema.parse(rawOptions);
	const serverUrl = resolveServerUrl(options);
	const client = new IssuerWebClient({ serverUrl, fetchImpl: deps.fetchImpl });
	const session = await client.signUpUsername({
		username: options.username,
		password: options.password,
	});
	const user = requireUser(session);
	await writeStoredSession(
		{
			serverUrl,
			cookieHeader: client.getCookieHeader(),
			user,
		},
		options,
	);
	return { serverUrl, user };
}

export async function authWhoAmIAction(
	rawOptions: unknown,
	deps: ActionDeps = {},
) {
	const options = baseCliOptionsSchema.parse(rawOptions);
	const stored = await requireStoredSession(options);
	const serverUrl = resolveServerUrl(options, stored);
	assertSessionMatchesServerUrl(serverUrl, stored);
	const client = new IssuerWebClient({
		serverUrl,
		fetchImpl: deps.fetchImpl,
		session: stored,
	});
	const session = await client.getSession();
	const user = requireUser(session);
	await writeStoredSession(
		{
			serverUrl,
			cookieHeader: client.getCookieHeader(),
			user,
		},
		options,
	);
	return { serverUrl, user };
}

export async function authSignOutAction(
	rawOptions: unknown,
	deps: ActionDeps = {},
) {
	const options = baseCliOptionsSchema.parse(rawOptions);
	const stored = await requireStoredSession(options);
	const serverUrl = resolveServerUrl(options, stored);
	assertSessionMatchesServerUrl(serverUrl, stored);
	const client = new IssuerWebClient({
		serverUrl,
		fetchImpl: deps.fetchImpl,
		session: stored,
	});
	try {
		await client.signOut();
	} finally {
		await clearStoredSession(options);
	}
	return { serverUrl };
}

function requireUser(session: SessionResponse) {
	if (!session.user) {
		throw new Error(
			"Authentication succeeded but no active session was returned.",
		);
	}
	return session.user;
}
