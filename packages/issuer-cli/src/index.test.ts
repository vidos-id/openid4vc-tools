import { beforeEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServerApp } from "../../issuer-web-server/src/app.ts";
import { createAppContext } from "../../issuer-web-server/src/context.ts";
import {
	authSignInAction,
	authSignOutAction,
	authSignUpAction,
	authWhoAmIAction,
	createIssuanceAction,
	createTemplateAction,
	listIssuancesAction,
	listTemplatesAction,
	showIssuanceAction,
	updateIssuanceStatusAction,
} from "./index.ts";

const TEST_SECRET = "0123456789abcdef0123456789abcdef";

function createTestEnv(name: string) {
	return {
		ISSUER_WEB_DATABASE_PATH: `./.tmp/${name}.sqlite`,
		ISSUER_WEB_AUTH_SECRET: TEST_SECRET,
		ISSUER_WEB_ORIGIN: "http://localhost:3001",
		ISSUER_WEB_CLIENT_ORIGIN: "http://localhost:5174",
	};
}

function createCookieFetch(app: Awaited<ReturnType<typeof createServerApp>>) {
	let cookieHeader = "";
	return (async (input: RequestInfo | URL, init?: RequestInit) => {
		const headers = new Headers(init?.headers);
		if (cookieHeader) {
			headers.set("cookie", cookieHeader);
		}
		const request =
			input instanceof Request
				? new Request(input, { ...init, headers })
				: new Request(typeof input === "string" ? input : input.toString(), {
						...init,
						headers,
					});
		const response = await app.fetch(request);
		const setCookie = response.headers.get("set-cookie");
		if (setCookie) {
			cookieHeader = setCookie
				.split(", ")
				.map((part) => part.split(";")[0])
				.join("; ");
		}
		return response;
	}) as typeof fetch;
}

describe("issuer-cli", () => {
	beforeEach(async () => {
		await mkdir("./.tmp", { recursive: true });
		await rm("./.tmp/issuer-cli-actions.sqlite", { force: true });
		await rm("./.tmp/issuer-cli-anon.sqlite", { force: true });
	});

	test("supports username signup plus template and issuance management", async () => {
		const context = await createAppContext(createTestEnv("issuer-cli-actions"));
		const app = await createServerApp(context);
		const fetchImpl = createCookieFetch(app);
		const sessionDir = await mkdtemp(join(tmpdir(), "issuer-cli-session-"));
		const sessionFile = join(sessionDir, "session.json");

		try {
			const signedUp = await authSignUpAction(
				{
					serverUrl: "http://localhost:3001",
					sessionFile,
					username: "ada",
					password: "very-secure-password",
				},
				{ fetchImpl },
			);
			expect(signedUp.user.username).toBe("ada");

			const whoAmI = await authWhoAmIAction(
				{ serverUrl: "http://localhost:3001", sessionFile },
				{ fetchImpl },
			);
			expect(whoAmI.user.name).toBe("ada");

			const templateCreated = await createTemplateAction(
				{
					serverUrl: "http://localhost:3001",
					sessionFile,
					name: "Conference Pass",
					vct: "https://issuer.example/credentials/conference-pass",
					claims: JSON.stringify({ given_name: "Ada", pass_level: "speaker" }),
				},
				{ fetchImpl },
			);
			expect(templateCreated.template.name).toBe("Conference Pass");

			const templates = await listTemplatesAction(
				{ serverUrl: "http://localhost:3001", sessionFile },
				{ fetchImpl },
			);
			expect(
				templates.templates.some(
					(item) => item.id === templateCreated.template.id,
				),
			).toBe(true);

			const issuanceCreated = await createIssuanceAction(
				{
					serverUrl: "http://localhost:3001",
					sessionFile,
					templateId: templateCreated.template.id,
					claims: JSON.stringify({ seat: "A-12" }),
					status: "active",
				},
				{ fetchImpl },
			);
			expect(issuanceCreated.detail.issuance.offerUri).toContain(
				"openid-credential-offer://",
			);
			expect(issuanceCreated.detail.issuance.claims).toMatchObject({
				seat: "A-12",
			});

			const listedIssuances = await listIssuancesAction(
				{ serverUrl: "http://localhost:3001", sessionFile },
				{ fetchImpl },
			);
			expect(listedIssuances.issuances).toHaveLength(1);

			const shownIssuance = await showIssuanceAction(
				{
					serverUrl: "http://localhost:3001",
					sessionFile,
					issuanceId: issuanceCreated.detail.issuance.id,
				},
				{ fetchImpl },
			);
			expect(shownIssuance.detail.issuance.id).toBe(
				issuanceCreated.detail.issuance.id,
			);

			const updatedIssuance = await updateIssuanceStatusAction(
				{
					serverUrl: "http://localhost:3001",
					sessionFile,
					issuanceId: issuanceCreated.detail.issuance.id,
					status: "suspended",
				},
				{ fetchImpl },
			);
			expect(updatedIssuance.detail.issuance.status).toBe(2);

			await authSignOutAction(
				{ serverUrl: "http://localhost:3001", sessionFile },
				{ fetchImpl },
			);
			await expect(
				authWhoAmIAction(
					{ serverUrl: "http://localhost:3001", sessionFile },
					{ fetchImpl },
				),
			).rejects.toThrow("No saved issuer session");
		} finally {
			await rm(sessionDir, { recursive: true, force: true });
		}
	});

	test("supports anonymous sign-in", async () => {
		const context = await createAppContext(createTestEnv("issuer-cli-anon"));
		const app = await createServerApp(context);
		const fetchImpl = createCookieFetch(app);
		const sessionDir = await mkdtemp(
			join(tmpdir(), "issuer-cli-anon-session-"),
		);
		const sessionFile = join(sessionDir, "session.json");

		try {
			const signedIn = await authSignInAction(
				{
					serverUrl: "http://localhost:3001",
					sessionFile,
					anonymous: true,
				},
				{ fetchImpl },
			);
			expect(signedIn.user.isAnonymous).toBe(true);

			const whoAmI = await authWhoAmIAction(
				{ serverUrl: "http://localhost:3001", sessionFile },
				{ fetchImpl },
			);
			expect(whoAmI.user.isAnonymous).toBe(true);
		} finally {
			await rm(sessionDir, { recursive: true, force: true });
		}
	});
});
