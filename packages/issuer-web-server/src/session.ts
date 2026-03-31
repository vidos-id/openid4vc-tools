import type { Context, MiddlewareHandler } from "hono";
import type { AppContext } from "./context.ts";
import { unauthorized } from "./errors.ts";

type SessionData = {
	session: {
		id: string;
		userId: string;
		expiresAt: Date;
		token: string;
	};
	user: {
		id: string;
		username?: string | null;
		name: string;
		isAnonymous?: boolean | null;
		createdAt: Date;
	};
};

export type HonoEnv = {
	Variables: {
		app: AppContext;
		session: SessionData;
	};
};

export async function getSession(c: Context<HonoEnv>) {
	const app = c.get("app");
	const headers = new Headers(c.req.raw.headers);
	const result = await app.auth.api.getSession({ headers });
	return result ?? null;
}

export const requireSession: MiddlewareHandler<HonoEnv> = async (c, next) => {
	const session = await getSession(c);
	if (!session) {
		throw unauthorized();
	}
	c.set("session", session);
	await next();
};

export function getRequiredSession(c: Context<HonoEnv>) {
	const session = c.get("session");
	if (!session) {
		throw unauthorized();
	}
	return session;
}
