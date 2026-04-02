import { serializeCredentialOfferUri } from "@vidos-id/openid4vc-issuer";
import type {
	CreateIssuanceInput,
	Issuance,
	IssuanceDetail,
	UpdateIssuanceStatusInput,
} from "@vidos-id/openid4vc-issuer-web-shared";
import {
	createIssuanceInputSchema,
	issuanceDetailSchema,
	issuanceSchema,
	updateIssuanceStatusInputSchema,
} from "@vidos-id/openid4vc-issuer-web-shared";
import { and, desc, eq } from "drizzle-orm";
import type { AppContext } from "../context.ts";
import {
	accessTokens,
	issuances,
	nonces,
	preAuthorizedGrants,
	statusLists,
} from "../db/schema.ts";
import { forbidden, notFound } from "../errors.ts";
import { asIsoString, jsonParse, mergeClaims, now } from "../utils.ts";
import { StatusListService } from "./status-lists.ts";
import { buildIssuerInstance } from "./support.ts";
import { TemplateService } from "./templates.ts";

type IssuanceState = Issuance["state"];

export class IssuanceService {
	private readonly templates: TemplateService;
	private readonly statusLists: StatusListService;

	constructor(private readonly app: AppContext) {
		this.templates = new TemplateService(app.db);
		this.statusLists = new StatusListService(app);
	}

	private async buildIssuance(row: typeof issuances.$inferSelect) {
		const status = await this.statusLists.getStatus(
			row.statusListId,
			row.statusListIndex,
		);
		const resolvedState = row.state === "issued" ? "redeemed" : row.state;

		return issuanceSchema.parse({
			id: row.id,
			ownerUserId: row.ownerUserId,
			templateId: row.templateId,
			credentialConfigurationId: row.credentialConfigurationId,
			vct: row.vct,
			claims: jsonParse(row.claimsJson),
			state: resolvedState,
			status,
			offerUri: row.offerUri,
			statusListId: row.statusListId,
			statusListIndex: row.statusListIndex,
			credential: row.credential ?? null,
			createdAt: asIsoString(row.createdAt),
			updatedAt: asIsoString(row.updatedAt),
		});
	}

	private async toResolvedIssuance(row: typeof issuances.$inferSelect) {
		const issuance = await this.buildIssuance(row);
		if (row.state !== "offered") {
			return issuance;
		}

		const grant = await this.app.db.query.preAuthorizedGrants.findFirst({
			where: eq(preAuthorizedGrants.issuanceId, row.id),
		});

		if (grant && grant.expiresAt.getTime() <= now().getTime()) {
			return issuanceSchema.parse({
				...issuance,
				state: "expired",
			});
		}

		return issuance;
	}

	private async updateState(issuanceId: string, state: IssuanceState) {
		await this.app.db
			.update(issuances)
			.set({ state, updatedAt: now() })
			.where(eq(issuances.id, issuanceId));
	}

	async listForUser(userId: string) {
		const rows = await this.app.db.query.issuances.findMany({
			where: eq(issuances.ownerUserId, userId),
			orderBy: desc(issuances.createdAt),
		});
		return Promise.all(rows.map((row) => this.toResolvedIssuance(row)));
	}

	async getOwned(userId: string, issuanceId: string): Promise<IssuanceDetail> {
		const row = await this.app.db.query.issuances.findFirst({
			where: eq(issuances.id, issuanceId),
		});
		if (!row) {
			throw notFound("Issuance not found");
		}
		if (row.ownerUserId !== userId) {
			throw forbidden();
		}
		return issuanceDetailSchema.parse({
			issuance: await this.toResolvedIssuance(row),
			qrPayload: row.offerUri,
		});
	}

	async create(
		userId: string,
		input: CreateIssuanceInput,
	): Promise<IssuanceDetail> {
		const parsed = createIssuanceInputSchema.parse(input);
		const template = await this.templates.getAccessibleById(
			userId,
			parsed.templateId,
		);
		const claims = mergeClaims(template.defaultClaims, parsed.claims);
		const allocated = await this.statusLists.allocate();
		if (parsed.status !== 0) {
			await this.statusLists.updateStatus(
				allocated.statusListId,
				allocated.statusListIndex,
				parsed.status,
			);
		}
		const issuer = await buildIssuerInstance(this.app);
		const offer = issuer.createCredentialOffer({
			credential_configuration_id: template.credentialConfigurationId,
			claims,
		});
		const offerUri = serializeCredentialOfferUri(offer);
		const createdAt = now();
		const issuanceId = crypto.randomUUID();
		await this.app.db.insert(issuances).values({
			id: issuanceId,
			ownerUserId: userId,
			templateId: template.id,
			credentialConfigurationId: template.credentialConfigurationId,
			vct: template.vct,
			claimsJson: JSON.stringify(claims),
			state: "offered",
			offerUri,
			preAuthorizedCode: offer.preAuthorizedGrant.preAuthorizedCode,
			accessToken: null,
			credential: null,
			statusListId: allocated.statusListId,
			statusListIndex: allocated.statusListIndex,
			createdAt,
			updatedAt: createdAt,
		});
		await this.app.db.insert(preAuthorizedGrants).values({
			id: crypto.randomUUID(),
			issuanceId,
			preAuthorizedCode: offer.preAuthorizedGrant.preAuthorizedCode,
			credentialConfigurationId: template.credentialConfigurationId,
			claimsJson: JSON.stringify(claims),
			expiresAt: new Date(offer.preAuthorizedGrant.expiresAt * 1000),
			used: false,
		});
		return this.getOwned(userId, issuanceId);
	}

	async updateStatus(
		userId: string,
		issuanceId: string,
		input: UpdateIssuanceStatusInput,
	) {
		const parsed = updateIssuanceStatusInputSchema.parse(input);
		const detail = await this.getOwned(userId, issuanceId);
		await this.statusLists.updateStatus(
			detail.issuance.statusListId,
			detail.issuance.statusListIndex,
			parsed.status,
		);
		await this.app.db
			.update(issuances)
			.set({ updatedAt: now() })
			.where(eq(issuances.id, issuanceId));
		return this.getOwned(userId, issuanceId);
	}

	async getByPreAuthorizedCode(preAuthorizedCode: string) {
		const row = await this.app.db.query.issuances.findFirst({
			where: eq(issuances.preAuthorizedCode, preAuthorizedCode),
		});
		if (!row) {
			throw notFound("Issuance not found");
		}
		return row;
	}

	async getByAccessToken(accessToken: string) {
		const row = await this.app.db.query.issuances.findFirst({
			where: eq(issuances.accessToken, accessToken),
		});
		if (!row) {
			throw notFound("Issuance not found");
		}
		return row;
	}

	private async createAndStoreNonce(issuanceId: string) {
		const issuer = await buildIssuerInstance(this.app);
		const nonce = issuer.createNonce();
		await this.app.db
			.update(nonces)
			.set({ used: true })
			.where(and(eq(nonces.issuanceId, issuanceId), eq(nonces.used, false)));
		await this.app.db.insert(nonces).values({
			id: crypto.randomUUID(),
			issuanceId,
			cNonce: nonce.c_nonce,
			expiresAt: new Date(nonce.nonce.expiresAt * 1000),
			used: false,
		});
		return nonce;
	}

	async exchangePreAuthorizedCode(preAuthorizedCode: string) {
		const issuance = await this.getByPreAuthorizedCode(preAuthorizedCode);
		if (issuance.accessToken && issuance.state !== "redeemed") {
			const accessTokenRow = await this.app.db.query.accessTokens.findFirst({
				where: eq(accessTokens.accessToken, issuance.accessToken),
			});
			if (
				accessTokenRow &&
				!accessTokenRow.used &&
				accessTokenRow.expiresAt.getTime() > now().getTime()
			) {
				const nonce = await this.createAndStoreNonce(issuance.id);
				return {
					access_token: accessTokenRow.accessToken,
					token_type: "Bearer" as const,
					expires_in: Math.max(
						1,
						Math.floor(
							(accessTokenRow.expiresAt.getTime() - now().getTime()) / 1000,
						),
					),
					credential_configuration_id: accessTokenRow.credentialConfigurationId,
					c_nonce: nonce.c_nonce,
					c_nonce_expires_in: nonce.c_nonce_expires_in,
				};
			}
		}
		const grant = await this.app.db.query.preAuthorizedGrants.findFirst({
			where: eq(preAuthorizedGrants.preAuthorizedCode, preAuthorizedCode),
		});
		if (!grant) {
			throw notFound("Pre-authorized grant not found");
		}
		if (grant.expiresAt.getTime() <= now().getTime()) {
			await this.updateState(issuance.id, "expired");
			throw new Error("Pre-authorized grant has expired");
		}
		await this.updateState(issuance.id, "redeeming");
		try {
			const issuer = await buildIssuerInstance(this.app);
			const token = issuer.exchangePreAuthorizedCode({
				tokenRequest: {
					grant_type: "urn:ietf:params:oauth:grant-type:pre-authorized_code",
					"pre-authorized_code": preAuthorizedCode,
				},
				preAuthorizedGrant: {
					preAuthorizedCode: grant.preAuthorizedCode,
					credentialConfigurationId: grant.credentialConfigurationId,
					claims: jsonParse(grant.claimsJson),
					expiresAt: Math.floor(grant.expiresAt.getTime() / 1000),
					used: grant.used,
				},
			});
			await this.app.db
				.update(preAuthorizedGrants)
				.set({ used: true })
				.where(eq(preAuthorizedGrants.id, grant.id));
			await this.app.db.insert(accessTokens).values({
				id: crypto.randomUUID(),
				issuanceId: issuance.id,
				accessToken: token.access_token,
				credentialConfigurationId: token.credential_configuration_id,
				claimsJson: JSON.stringify(token.accessTokenRecord.claims),
				expiresAt: new Date(token.accessTokenRecord.expiresAt * 1000),
				used: false,
			});
			const nonce = await this.createAndStoreNonce(issuance.id);
			await this.app.db
				.update(issuances)
				.set({
					accessToken: token.access_token,
					state: "redeeming",
					updatedAt: now(),
				})
				.where(eq(issuances.id, issuance.id));
			return {
				...token,
				c_nonce: nonce.c_nonce,
				c_nonce_expires_in: nonce.c_nonce_expires_in,
			};
		} catch (error) {
			await this.updateState(
				issuance.id,
				grant.expiresAt.getTime() <= now().getTime()
					? "expired"
					: "redemption_failed",
			);
			throw error;
		}
	}

	async createNonce(accessToken: string) {
		const issuance = await this.getByAccessToken(accessToken);
		return this.createAndStoreNonce(issuance.id);
	}

	async issueCredential(
		accessToken: string,
		proofJwt: string,
		credentialConfigurationId: string,
	) {
		const issuance = await this.getByAccessToken(accessToken);
		await this.updateState(issuance.id, "redeeming");
		try {
			const accessTokenRow = await this.app.db.query.accessTokens.findFirst({
				where: eq(accessTokens.accessToken, accessToken),
			});
			if (!accessTokenRow) {
				throw notFound("Access token not found");
			}
			const nonceRow = await this.app.db.query.nonces.findFirst({
				where: and(eq(nonces.issuanceId, issuance.id), eq(nonces.used, false)),
				orderBy: desc(nonces.expiresAt),
			});
			if (!nonceRow) {
				throw notFound("Nonce not found");
			}
			const issuer = await buildIssuerInstance(this.app);
			const validatedProof = await issuer.validateProofJwt({
				jwt: proofJwt,
				nonce: {
					c_nonce: nonceRow.cNonce,
					expiresAt: Math.floor(nonceRow.expiresAt.getTime() / 1000),
					used: nonceRow.used,
				},
			});
			await this.app.db
				.update(nonces)
				.set({ used: true })
				.where(eq(nonces.id, nonceRow.id));
			const issued = await issuer.issueCredential({
				accessToken: {
					accessToken: accessTokenRow.accessToken,
					credentialConfigurationId: accessTokenRow.credentialConfigurationId,
					claims: jsonParse(accessTokenRow.claimsJson),
					expiresAt: Math.floor(accessTokenRow.expiresAt.getTime() / 1000),
					used: accessTokenRow.used,
				},
				credential_configuration_id: credentialConfigurationId,
				proof: validatedProof,
				status: {
					status_list: {
						idx: issuance.statusListIndex,
						uri:
							(
								await this.app.db.query.statusLists.findFirst({
									where: eq(statusLists.id, issuance.statusListId),
								})
							)?.uri ?? "",
					},
				},
			});
			await this.app.db
				.update(accessTokens)
				.set({ used: true })
				.where(eq(accessTokens.id, accessTokenRow.id));
			await this.app.db
				.update(issuances)
				.set({
					state: "redeemed",
					credential: issued.credential,
					updatedAt: now(),
				})
				.where(eq(issuances.id, issuance.id));
			return issued;
		} catch (error) {
			await this.updateState(issuance.id, "redemption_failed");
			throw error;
		}
	}
}
