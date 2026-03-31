import { createServerApp } from "./app.ts";

const app = await createServerApp();

export default {
	port: Number(process.env.ISSUER_WEB_PORT ?? 3001),
	fetch: app.fetch,
};
