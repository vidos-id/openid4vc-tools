import {
	type createIssuanceInputSchema,
	type createTemplateInputSchema,
	type issuanceDetailSchema,
	issuanceSchema,
	sessionResponseSchema,
	templateSchema,
	type updateIssuanceStatusInputSchema,
} from "@vidos-id/openid4vc-issuer-web-shared";
import { z } from "zod";

export const serverUrlSchema = z.url();

export const sessionFileSchema = z.object({
	serverUrl: serverUrlSchema,
	cookieHeader: z.string().min(1),
	user: sessionResponseSchema.shape.user,
});

export const baseCliOptionsSchema = z.object({
	serverUrl: serverUrlSchema.optional(),
	sessionFile: z.string().min(1).optional(),
});

export const authSignInOptionsSchema = baseCliOptionsSchema
	.extend({
		anonymous: z.boolean().optional(),
		username: z.string().min(1).optional(),
		password: z.string().min(1).optional(),
	})
	.superRefine((value, ctx) => {
		if (value.anonymous) {
			if (value.username || value.password) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message:
						"Anonymous sign-in cannot be combined with --username or --password",
					path: ["anonymous"],
				});
			}
			return;
		}

		if (!value.username || !value.password) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Provide --anonymous or both --username and --password",
				path: ["username"],
			});
		}
	});

export const authSignUpOptionsSchema = baseCliOptionsSchema.extend({
	username: z.string().min(1),
	password: z.string().min(1),
});

export const claimsInputSchema = z
	.object({
		claims: z.string().optional(),
		claimsFile: z.string().min(1).optional(),
	})
	.superRefine((value, ctx) => {
		if (value.claims && value.claimsFile) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Use only one of --claims or --claims-file",
				path: ["claims"],
			});
		}
	});

export const templateCreateOptionsSchema = baseCliOptionsSchema
	.extend({
		name: z.string().min(1),
		vct: z.string().min(1),
	})
	.and(claimsInputSchema);

export const templateDeleteOptionsSchema = baseCliOptionsSchema.extend({
	templateId: z.string().min(1),
});

export const issuanceStatusLabelSchema = z.enum([
	"active",
	"revoked",
	"suspended",
]);

export const issuanceCreateOptionsSchema = baseCliOptionsSchema
	.extend({
		templateId: z.string().min(1),
		status: issuanceStatusLabelSchema.optional(),
	})
	.and(claimsInputSchema);

export const issuanceIdOptionsSchema = baseCliOptionsSchema.extend({
	issuanceId: z.string().min(1),
});

export const issuanceStatusUpdateOptionsSchema = issuanceIdOptionsSchema.extend(
	{
		status: issuanceStatusLabelSchema,
	},
);

export const interactiveOptionsSchema = baseCliOptionsSchema;

export const authApiResponseSchema = z.object({
	token: z.string().nullable().optional(),
	user: z.record(z.string(), z.unknown()).optional(),
	message: z.string().optional(),
	error: z.string().optional(),
	code: z.string().optional(),
});

export const appErrorResponseSchema = z.object({
	error: z.string().optional(),
	message: z.string().optional(),
	code: z.string().optional(),
});

export const templateListSchema = z.array(templateSchema);

export const issuanceListSchema = z.array(issuanceSchema);

export const issuerMetadataSchema = z.object({
	credential_issuer: z.string().url(),
	token_endpoint: z.string().url(),
	credential_endpoint: z.string().url(),
	nonce_endpoint: z.string().url().optional(),
	jwks: z.object({
		keys: z.array(z.record(z.string(), z.unknown())).min(1),
	}),
	credential_configurations_supported: z.record(
		z.string(),
		z.record(z.string(), z.unknown()),
	),
});

export type BaseCliOptions = z.infer<typeof baseCliOptionsSchema>;
export type StoredSession = z.infer<typeof sessionFileSchema>;
export type TemplateCreateOptions = z.infer<typeof templateCreateOptionsSchema>;
export type TemplateDeleteOptions = z.infer<typeof templateDeleteOptionsSchema>;
export type IssuanceCreateOptions = z.infer<typeof issuanceCreateOptionsSchema>;
export type IssuanceIdOptions = z.infer<typeof issuanceIdOptionsSchema>;
export type IssuanceStatusUpdateOptions = z.infer<
	typeof issuanceStatusUpdateOptionsSchema
>;
export type SessionResponse = z.infer<typeof sessionResponseSchema>;
export type IssuanceDetail = z.infer<typeof issuanceDetailSchema>;
export type CreateTemplateInput = z.infer<typeof createTemplateInputSchema>;
export type CreateIssuanceInput = z.infer<typeof createIssuanceInputSchema>;
export type UpdateIssuanceStatusInput = z.infer<
	typeof updateIssuanceStatusInputSchema
>;
export type IssuerMetadata = z.infer<typeof issuerMetadataSchema>;
