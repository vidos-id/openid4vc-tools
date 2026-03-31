import { z } from "zod";
import { TOKEN_STATUS } from "./status.ts";

export const jsonObjectSchema = z.record(z.string(), z.unknown());

export const sessionUserSchema = z.object({
	id: z.string().min(1),
	username: z.string().min(1).nullable(),
	name: z.string().min(1),
	isAnonymous: z.boolean(),
	createdAt: z.string().datetime(),
});

export const sessionResponseSchema = z.object({
	user: sessionUserSchema.nullable(),
});

export const templateKindSchema = z.enum(["predefined", "custom"]);

export const templateSchema = z.object({
	id: z.string().min(1),
	ownerUserId: z.string().min(1),
	name: z.string().min(1),
	kind: templateKindSchema,
	credentialConfigurationId: z.string().min(1),
	vct: z.string().min(1),
	defaultClaims: jsonObjectSchema,
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

export const createTemplateInputSchema = z.object({
	name: z.string().min(1),
	vct: z.string().min(1),
	defaultClaims: jsonObjectSchema,
});

export const deleteResponseSchema = z.object({
	ok: z.literal(true),
});

export const updateTemplateInputSchema = createTemplateInputSchema
	.partial()
	.refine(
		(value) => Object.keys(value).length > 0,
		"At least one field is required",
	);

export const issuanceStateSchema = z.enum([
	"offered",
	"redeeming",
	"redeemed",
	"expired",
	"redemption_failed",
]);

export const issuanceStatusValueSchema = z.union([
	z.literal(TOKEN_STATUS.active),
	z.literal(TOKEN_STATUS.revoked),
	z.literal(TOKEN_STATUS.suspended),
]);

export const issuanceSchema = z.object({
	id: z.string().min(1),
	ownerUserId: z.string().min(1),
	templateId: z.string().min(1),
	credentialConfigurationId: z.string().min(1),
	vct: z.string().min(1),
	claims: jsonObjectSchema,
	state: issuanceStateSchema,
	status: issuanceStatusValueSchema,
	offerUri: z.string().min(1),
	statusListId: z.string().min(1),
	statusListIndex: z.number().int().nonnegative(),
	credential: z.string().min(1).nullable(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

export const createIssuanceInputSchema = z.object({
	templateId: z.string().min(1),
	claims: jsonObjectSchema.optional(),
	status: issuanceStatusValueSchema.default(TOKEN_STATUS.active),
});

export const updateIssuanceStatusInputSchema = z.object({
	status: issuanceStatusValueSchema,
});

export const issuanceDetailSchema = z.object({
	issuance: issuanceSchema,
	qrPayload: z.string().min(1),
});

export const appErrorSchema = z.object({
	error: z.string().min(1),
	message: z.string().min(1),
});

export type SessionResponse = z.infer<typeof sessionResponseSchema>;
export type Template = z.infer<typeof templateSchema>;
export type CreateTemplateInput = z.infer<typeof createTemplateInputSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateInputSchema>;
export type Issuance = z.infer<typeof issuanceSchema>;
export type CreateIssuanceInput = z.infer<typeof createIssuanceInputSchema>;
export type UpdateIssuanceStatusInput = z.infer<
	typeof updateIssuanceStatusInputSchema
>;
export type IssuanceDetail = z.infer<typeof issuanceDetailSchema>;
export type DeleteResponse = z.infer<typeof deleteResponseSchema>;
