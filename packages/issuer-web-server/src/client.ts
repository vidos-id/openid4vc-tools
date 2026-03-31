import { hc } from "hono/client";
import type { createServerApp } from "./app.ts";

export type AppType = Awaited<ReturnType<typeof createServerApp>>;
export type Client = ReturnType<typeof hc<AppType>>;

export const hcWithType = (...args: Parameters<typeof hc>): Client =>
	hc<AppType>(...args);
