import { anonymousClient, usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { env } from "../env.ts";

function createGeneratedEmail() {
	return `temp-${crypto.randomUUID()}@issuer-web.local`;
}

export const authClient = createAuthClient({
	baseURL: env.VITE_ISSUER_WEB_AUTH_URL,
	plugins: [anonymousClient(), usernameClient()],
	fetchOptions: {
		credentials: "include",
	},
});

const signIn = authClient.signIn as unknown as {
	username: (input: { username: string; password: string }) => Promise<{
		error: { message?: string } | null;
	}>;
	anonymous: () => Promise<{
		error: { message?: string } | null;
	}>;
};

const signUp = authClient.signUp as unknown as {
	email: (input: {
		email: string;
		password: string;
		name: string;
		username: string;
	}) => Promise<{ error: { message?: string } | null }>;
};

export function signInWithUsername(input: {
	username: string;
	password: string;
}) {
	return signIn.username(input);
}

export function signUpWithUsername(input: {
	username: string;
	password: string;
}) {
	const username = input.username.trim();
	return signUp.email({
		email: createGeneratedEmail(),
		password: input.password,
		name: username,
		username,
	});
}

export function signInAnonymously() {
	return signIn.anonymous();
}

export function linkAnonymousAccount(input: {
	username: string;
	password: string;
}) {
	const username = input.username.trim();
	return signUp.email({
		email: createGeneratedEmail(),
		password: input.password,
		name: username,
		username,
	});
}
