import type { StatusListRecord } from "@vidos-id/openid4vc-issuer";
import { ACTIVE_TOKEN_STATUS } from "@vidos-id/openid4vc-issuer-web-shared";
import { eq } from "drizzle-orm";
import type { AppContext } from "../context.ts";
import { statusLists } from "../db/schema.ts";
import { notFound } from "../errors.ts";
import { jsonParse } from "../utils.ts";
import { buildIssuerInstance, signStatusList } from "./support.ts";

function rowToStatusList(
	row: typeof statusLists.$inferSelect,
): StatusListRecord {
	return {
		uri: row.uri,
		bits: row.bits as 1 | 2 | 4 | 8,
		statuses: jsonParse<number[]>(row.statusesJson),
		ttl: row.ttl ?? undefined,
		expiresAt: row.expiresAt
			? Math.floor(row.expiresAt.getTime() / 1000)
			: undefined,
	};
}

export class StatusListService {
	constructor(private readonly app: AppContext) {}

	async getActiveRow() {
		const row = await this.app.db.query.statusLists.findFirst({
			where: eq(statusLists.isActive, true),
		});
		if (!row) {
			throw notFound("Active status list not found");
		}
		return row;
	}

	async allocate() {
		const row = await this.getActiveRow();
		const issuer = await buildIssuerInstance(this.app);
		const allocated = issuer.allocateCredentialStatus({
			statusList: rowToStatusList(row),
			status: ACTIVE_TOKEN_STATUS,
		});
		const statusListJwt = await signStatusList(
			this.app,
			allocated.updatedStatusList,
		);
		await this.app.db
			.update(statusLists)
			.set({
				statusesJson: JSON.stringify(allocated.updatedStatusList.statuses),
				statusListJwt,
				updatedAt: new Date(),
			})
			.where(eq(statusLists.id, row.id));
		return {
			statusListId: row.id,
			statusListIndex: allocated.credentialStatus.status_list.idx,
			credentialStatus: allocated.credentialStatus,
		};
	}

	async updateStatus(statusListId: string, idx: number, status: number) {
		const row = await this.app.db.query.statusLists.findFirst({
			where: eq(statusLists.id, statusListId),
		});
		if (!row) {
			throw notFound("Status list not found");
		}
		const issuer = await buildIssuerInstance(this.app);
		const updated = issuer.updateCredentialStatus({
			statusList: rowToStatusList(row),
			idx,
			status,
		});
		const statusListJwt = await signStatusList(this.app, updated);
		await this.app.db
			.update(statusLists)
			.set({
				statusesJson: JSON.stringify(updated.statuses),
				statusListJwt,
				updatedAt: new Date(),
			})
			.where(eq(statusLists.id, row.id));
	}

	async getStatus(statusListId: string, idx: number) {
		const row = await this.app.db.query.statusLists.findFirst({
			where: eq(statusLists.id, statusListId),
		});
		if (!row) {
			throw notFound("Status list not found");
		}
		const statusList = rowToStatusList(row);
		const status = statusList.statuses[idx];
		if (status === undefined) {
			throw notFound("Status list entry not found");
		}
		return status;
	}

	async getStatusListJwt(statusListId: string) {
		const row = await this.app.db.query.statusLists.findFirst({
			where: eq(statusLists.id, statusListId),
		});
		if (!row) {
			throw notFound("Status list not found");
		}
		return row.statusListJwt;
	}
}
