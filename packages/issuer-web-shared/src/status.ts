export const TOKEN_STATUS = {
	active: 0,
	revoked: 1,
	suspended: 2,
} as const;

export const TOKEN_STATUS_LABELS = {
	[TOKEN_STATUS.active]: "active",
	[TOKEN_STATUS.revoked]: "revoked",
	[TOKEN_STATUS.suspended]: "suspended",
} as const;

export type TokenStatusLabel =
	(typeof TOKEN_STATUS_LABELS)[keyof typeof TOKEN_STATUS_LABELS];
