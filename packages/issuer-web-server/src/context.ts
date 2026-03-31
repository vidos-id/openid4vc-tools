import { generateIssuerTrustMaterial } from "@vidos-id/issuer";
import { and, desc, eq } from "drizzle-orm";
import { createAuth, type IssuerWebAuth } from "./auth.ts";
import { type IssuerWebEnv, readIssuerWebEnv } from "./config.ts";
import { createDatabase, type IssuerWebDatabase } from "./db/index.ts";
import {
	credentialTemplates,
	issuerConfig,
	issuerSigningKeys,
	statusLists,
	users,
} from "./db/schema.ts";
import { signStatusList } from "./services/support.ts";

export type AppContext = {
	env: IssuerWebEnv;
	db: IssuerWebDatabase;
	auth: IssuerWebAuth;
};

export async function createAppContext(
	envInput: Record<string, string | undefined> = process.env,
): Promise<AppContext> {
	const env = readIssuerWebEnv(envInput);
	const db = await createDatabase(env.ISSUER_WEB_DATABASE_PATH);
	await ensureBootstrapState(db, env);
	const auth = createAuth(db, env);
	return { env, db, auth };
}

async function ensureBootstrapState(db: IssuerWebDatabase, env: IssuerWebEnv) {
	const now = new Date();
	const issuerConfigRow = await db.query.issuerConfig.findFirst();
	if (!issuerConfigRow) {
		await db.insert(issuerConfig).values({
			id: "default",
			issuerUrl: env.ISSUER_WEB_ORIGIN,
			name: env.ISSUER_WEB_NAME,
			createdAt: now,
			updatedAt: now,
		});
	} else if (
		issuerConfigRow.issuerUrl !== env.ISSUER_WEB_ORIGIN ||
		issuerConfigRow.name !== env.ISSUER_WEB_NAME
	) {
		await db
			.update(issuerConfig)
			.set({
				issuerUrl: env.ISSUER_WEB_ORIGIN,
				name: env.ISSUER_WEB_NAME,
				updatedAt: now,
			})
			.where(eq(issuerConfig.id, issuerConfigRow.id));
	}

	const activeSigningKey = await db.query.issuerSigningKeys.findFirst({
		where: eq(issuerSigningKeys.isActive, true),
	});
	if (!activeSigningKey) {
		const trust = await generateIssuerTrustMaterial({
			alg: env.ISSUER_WEB_DEFAULT_SIGNING_ALG,
		});
		await db.insert(issuerSigningKeys).values({
			id: crypto.randomUUID(),
			alg: trust.alg,
			privateJwkJson: JSON.stringify(trust.privateJwk),
			publicJwkJson: JSON.stringify(trust.publicJwk),
			isActive: true,
			createdAt: now,
			updatedAt: now,
		});
	}

	const predefinedTemplates = await db.query.credentialTemplates.findMany({
		where: and(
			eq(credentialTemplates.kind, "predefined"),
			eq(credentialTemplates.isActive, true),
		),
		orderBy: desc(credentialTemplates.createdAt),
	});
	if (predefinedTemplates.length === 0) {
		const systemUserId = "system-user";
		const systemUser = await db.query.users.findFirst({
			where: eq(users.id, systemUserId),
		});
		if (!systemUser) {
			await db.insert(users).values({
				id: systemUserId,
				name: "System",
				email: "system@issuer-web.local",
				username: "system",
				isAnonymous: false,
				emailVerified: true,
				image: null,
				createdAt: now,
				updatedAt: now,
			});
		}

		await db.insert(credentialTemplates).values([
			{
				id: crypto.randomUUID(),
				ownerUserId: systemUserId,
				name: "EUDI PID (SD-JWT)",
				kind: "predefined",
				credentialConfigurationId: "eu.europa.ec.eudi.pid.1",
				vct: "eu.europa.ec.eudi.pid.1",
				defaultClaimsJson: JSON.stringify({
					family_name: "Lovelace",
					given_name: "Ada",
					birth_date: "1815-12-10",
					age_over_18: true,
					family_name_birth: "Byron",
					given_name_birth: "Augusta Ada",
					birth_country: "GB",
					birth_city: "London",
					resident_address: "12 St. James's Square, London",
					resident_country: "GB",
					resident_city: "London",
					resident_postal_code: "SW1Y 4LB",
					resident_street: "St. James's Square",
					resident_house_number: "12",
					gender: 2,
					nationality: "GB",
					issuance_date: "2026-01-01",
					expiry_date: "2031-01-01",
					issuing_authority: "GB",
					issuing_country: "GB",
					document_number: "PID-GB-1815-ADA-01",
					administrative_number: "GB-ADM-0001",
				}),
				isActive: true,
				createdAt: now,
				updatedAt: now,
			},
		]);
	}

	const bootstrapApp = { env, db, auth: null as never };
	const existingStatusList = await db.query.statusLists.findFirst({
		where: eq(statusLists.isActive, true),
	});
	const defaultStatusListUri = new URL(
		"/status-lists/default",
		env.ISSUER_WEB_ORIGIN,
	).toString();
	if (!existingStatusList) {
		const statusListJwt = await signStatusList(bootstrapApp, {
			uri: defaultStatusListUri,
			bits: 2,
			statuses: [],
			ttl: 300,
		});
		await db.insert(statusLists).values({
			id: "default",
			uri: defaultStatusListUri,
			bits: 2,
			statusesJson: "[]",
			statusListJwt,
			isActive: true,
			ttl: 300,
			createdAt: now,
			updatedAt: now,
		});
	} else if (existingStatusList.id === "default") {
		if (
			existingStatusList.uri !== defaultStatusListUri ||
			existingStatusList.statusListJwt.length === 0
		) {
			const statusListJwt = await signStatusList(bootstrapApp, {
				uri: defaultStatusListUri,
				bits: existingStatusList.bits as 1 | 2 | 4 | 8,
				statuses: JSON.parse(existingStatusList.statusesJson) as number[],
				ttl: existingStatusList.ttl ?? undefined,
				expiresAt: existingStatusList.expiresAt
					? Math.floor(existingStatusList.expiresAt.getTime() / 1000)
					: undefined,
			});
			await db
				.update(statusLists)
				.set({
					uri: defaultStatusListUri,
					statusListJwt,
					updatedAt: now,
				})
				.where(eq(statusLists.id, existingStatusList.id));
		}
	}
}
