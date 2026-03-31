import { z } from "zod";

function parseOrigins(value: string | undefined) {
	if (!value) {
		return [];
	}
	return value
		.split(",")
		.map((origin) => origin.trim())
		.filter((origin) => origin.length > 0);
}

const envSchema = z.object({
	ISSUER_WEB_DATABASE_PATH: z
		.string()
		.min(1)
		.default("./.data/issuer-web.sqlite"),
	ISSUER_WEB_PORT: z.coerce.number().int().positive().default(3001),
	ISSUER_WEB_ORIGIN: z.string().url().default("http://localhost:3001"),
	ISSUER_WEB_CLIENT_ORIGIN: z.string().url().default("http://localhost:5174"),
	ISSUER_WEB_CLIENT_ORIGINS: z
		.string()
		.optional()
		.transform((value, ctx) => {
			const origins = parseOrigins(value);
			for (const origin of origins) {
				if (!z.url().safeParse(origin).success) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: `Invalid client origin: ${origin}`,
					});
				}
			}
			return origins;
		}),
	ISSUER_WEB_AUTH_SECRET: z.string().min(16).default("issuer-web-demo-secret"),
	ISSUER_WEB_NAME: z.string().min(1).default("Issuer Web"),
	ISSUER_WEB_DEFAULT_SIGNING_ALG: z
		.enum(["ES256", "ES384", "EdDSA"])
		.default("EdDSA"),
	ISSUER_WEB_PRE_AUTHORIZED_CODE_TTL_SECONDS: z.coerce
		.number()
		.int()
		.positive()
		.default(3600),
});

export function readIssuerWebEnv(input: Record<string, string | undefined>) {
	return envSchema.parse(input);
}

export type IssuerWebEnv = ReturnType<typeof readIssuerWebEnv>;

export function getAllowedClientOrigins(env: IssuerWebEnv) {
	return Array.from(
		new Set([env.ISSUER_WEB_CLIENT_ORIGIN, ...env.ISSUER_WEB_CLIENT_ORIGINS]),
	);
}
