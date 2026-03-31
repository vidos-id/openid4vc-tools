export type TokenStatusValue = 0 | 1 | 2;

export const ACTIVE_TOKEN_STATUS = 0;
export const REVOKED_TOKEN_STATUS = 1;
export const SUSPENDED_TOKEN_STATUS = 2;

const TOKEN_STATUS_LABELS_BY_VALUE = {
	[ACTIVE_TOKEN_STATUS]: "active",
	[REVOKED_TOKEN_STATUS]: "revoked",
	[SUSPENDED_TOKEN_STATUS]: "suspended",
} as const;

export type TokenStatusLabel =
	(typeof TOKEN_STATUS_LABELS_BY_VALUE)[keyof typeof TOKEN_STATUS_LABELS_BY_VALUE];

export function getTokenStatusLabel(status: TokenStatusValue): string {
	return (
		TOKEN_STATUS_LABELS_BY_VALUE[
			status as keyof typeof TOKEN_STATUS_LABELS_BY_VALUE
		] ?? String(status)
	);
}

export const KNOWN_TOKEN_STATUSES = [
	ACTIVE_TOKEN_STATUS,
	REVOKED_TOKEN_STATUS,
	SUSPENDED_TOKEN_STATUS,
] as const;
