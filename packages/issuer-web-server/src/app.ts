import { zValidator } from "@hono/zod-validator";
import { credentialRequestSchema, tokenRequestSchema } from "@vidos-id/issuer";
import {
	appErrorSchema,
	createIssuanceInputSchema,
	createTemplateInputSchema,
	sessionResponseSchema,
	updateIssuanceStatusInputSchema,
	updateTemplateInputSchema,
} from "@vidos-id/issuer-web-shared";
import { Hono } from "hono";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { getAllowedClientOrigins } from "./config.ts";
import type { AppContext } from "./context.ts";
import { createAppContext } from "./context.ts";
import { IssuanceService } from "./services/issuances.ts";
import { StatusListService } from "./services/status-lists.ts";
import { buildIssuerInstance } from "./services/support.ts";
import { TemplateService } from "./services/templates.ts";
import type { HonoEnv } from "./session.ts";
import { getRequiredSession, getSession, requireSession } from "./session.ts";

type AppBindings = HonoEnv;

function createBaseApp(context: AppContext) {
	const templates = new TemplateService(context.db);
	const issuances = new IssuanceService(context);
	const statusLists = new StatusListService(context);
	const allowedOrigins = new Set([
		context.env.ISSUER_WEB_ORIGIN,
		...getAllowedClientOrigins(context.env),
	]);

	return new Hono<AppBindings>()
		.use(
			cors({
				origin: (origin) => {
					if (!origin) {
						return origin;
					}
					return allowedOrigins.has(origin) ? origin : "";
				},
				credentials: true,
			}),
		)
		.use(compress())
		.use("*", async (c, next) => {
			c.set("app", context);
			await next();
		})
		.onError((error, c) => {
			const status = (error as { status?: number }).status;
			return c.json(
				appErrorSchema.parse({
					error: "request_failed",
					message: error instanceof Error ? error.message : "Request failed",
				}),
				status === 400 ||
					status === 401 ||
					status === 403 ||
					status === 404 ||
					status === 500
					? status
					: 500,
			);
		})
		.all("/api/auth/*", async (c) => context.auth.handler(c.req.raw))
		.get("/api/session", async (c) => {
			const session = await getSession(c);
			return c.json(
				sessionResponseSchema.parse({
					user: session
						? {
								id: session.user.id,
								username: session.user.username ?? session.user.name,
								name: session.user.name,
								isAnonymous: session.user.isAnonymous ?? false,
								createdAt: session.user.createdAt.toISOString(),
							}
						: null,
				}),
			);
		})
		.get("/.well-known/openid-credential-issuer", async (c) => {
			const issuer = await buildIssuerInstance(context);
			return c.json(issuer.getMetadata());
		})
		.post("/token", async (c) => {
			const formData = await c.req.formData();
			const form = Object.fromEntries(Array.from(formData.entries()));
			const tokenRequest = tokenRequestSchema.parse(form);
			const token = await issuances.exchangePreAuthorizedCode(
				tokenRequest["pre-authorized_code"],
			);
			return c.json(token);
		})
		.post("/nonce", async (c) => {
			const authorization = c.req.header("authorization");
			const accessToken = authorization?.replace(/^Bearer\s+/i, "");
			if (!accessToken) {
				throw new Error("Bearer token is required");
			}
			const nonce = await issuances.createNonce(accessToken);
			return c.json({
				c_nonce: nonce.c_nonce,
				c_nonce_expires_in: nonce.c_nonce_expires_in,
			});
		})
		.post(
			"/credential",
			zValidator("json", credentialRequestSchema),
			async (c) => {
				const authorization = c.req.header("authorization");
				const accessToken = authorization?.replace(/^Bearer\s+/i, "");
				if (!accessToken) {
					throw new Error("Bearer token is required");
				}
				const request = c.req.valid("json");
				const proofJwt = request.proofs.jwt[0]?.jwt;
				if (!proofJwt) {
					throw new Error("JWT proof is required");
				}
				const response = await issuances.issueCredential(
					accessToken,
					proofJwt,
					request.credential_configuration_id,
				);
				return c.json(response);
			},
		)
		.get("/status-lists/:id", async (c) => {
			const jwt = await statusLists.getStatusListJwt(c.req.param("id"));
			c.header("content-type", "application/statuslist+jwt");
			return c.body(jwt);
		})
		.use("/api/*", requireSession)
		.get("/api/templates", async (c) => {
			const session = getRequiredSession(c);
			return c.json(await templates.listForUser(session.user.id));
		})
		.post(
			"/api/templates",
			zValidator("json", createTemplateInputSchema),
			async (c) => {
				const session = getRequiredSession(c);
				return c.json(
					await templates.create(session.user.id, c.req.valid("json")),
				);
			},
		)
		.patch(
			"/api/templates/:id",
			zValidator("json", updateTemplateInputSchema),
			async (c) => {
				const session = getRequiredSession(c);
				return c.json(
					await templates.update(
						session.user.id,
						c.req.param("id"),
						c.req.valid("json"),
					),
				);
			},
		)
		.delete("/api/templates/:id", async (c) => {
			const session = getRequiredSession(c);
			await templates.delete(session.user.id, c.req.param("id"));
			return c.json({ ok: true });
		})
		.get("/api/issuances", async (c) => {
			const session = getRequiredSession(c);
			return c.json(await issuances.listForUser(session.user.id));
		})
		.post(
			"/api/issuances",
			zValidator("json", createIssuanceInputSchema),
			async (c) => {
				const session = getRequiredSession(c);
				return c.json(
					await issuances.create(session.user.id, c.req.valid("json")),
				);
			},
		)
		.get("/api/issuances/:id", async (c) => {
			const session = getRequiredSession(c);
			return c.json(
				await issuances.getOwned(session.user.id, c.req.param("id")),
			);
		})
		.patch(
			"/api/issuances/:id/status",
			zValidator("json", updateIssuanceStatusInputSchema),
			async (c) => {
				const session = getRequiredSession(c);
				return c.json(
					await issuances.updateStatus(
						session.user.id,
						c.req.param("id"),
						c.req.valid("json"),
					),
				);
			},
		);
}

export async function createServerApp(context?: AppContext) {
	const resolved = context ?? (await createAppContext());
	return createBaseApp(resolved);
}
