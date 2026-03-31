import { z } from "zod";

const envSchema = z.object({
	VITE_ISSUER_WEB_SERVER_URL: z.string().url(),
	VITE_ISSUER_WEB_AUTH_URL: z.string().url(),
});

export const env = envSchema.parse({
	VITE_ISSUER_WEB_SERVER_URL: import.meta.env.VITE_ISSUER_WEB_SERVER_URL,
	VITE_ISSUER_WEB_AUTH_URL: import.meta.env.VITE_ISSUER_WEB_AUTH_URL,
});
