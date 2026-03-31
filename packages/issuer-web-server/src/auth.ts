import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { anonymous, username } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { getAllowedClientOrigins, type IssuerWebEnv } from "./config.ts";
import type { IssuerWebDatabase } from "./db/index.ts";
import * as schema from "./db/schema.ts";

export function createAuth(db: IssuerWebDatabase, env: IssuerWebEnv) {
	return betterAuth({
		baseURL: env.ISSUER_WEB_ORIGIN,
		basePath: "/api/auth",
		secret: env.ISSUER_WEB_AUTH_SECRET,
		trustedOrigins: [env.ISSUER_WEB_ORIGIN, ...getAllowedClientOrigins(env)],
		database: drizzleAdapter(db, {
			provider: "sqlite",
			schema,
		}),
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: false,
		},
		user: {
			changeEmail: {
				enabled: false,
			},
		},
		plugins: [
			anonymous({
				emailDomainName: "issuer-web.local",
				generateName: () => "Guest",
				onLinkAccount: async ({ anonymousUser, newUser }) => {
					const anonymousUserId = anonymousUser.user.id;
					const linkedUserId = newUser.user.id;
					await db
						.update(schema.credentialTemplates)
						.set({ ownerUserId: linkedUserId })
						.where(eq(schema.credentialTemplates.ownerUserId, anonymousUserId));
					await db
						.update(schema.issuances)
						.set({ ownerUserId: linkedUserId })
						.where(eq(schema.issuances.ownerUserId, anonymousUserId));
				},
			}),
			username({
				minUsernameLength: 3,
				maxUsernameLength: 32,
			}),
		],
	});
}

export type IssuerWebAuth = ReturnType<typeof createAuth>;
