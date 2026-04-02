import {
	getTokenStatusLabel,
	type Issuance,
	type IssuanceDetail,
	type Template,
} from "@vidos-id/issuer-web-shared";
import type { IssuerMetadata } from "./schemas.ts";

function section(title: string, lines: string[]) {
	return [title, ...lines.map((line) => `  ${line}`)].join("\n");
}

function jsonBlock(value: unknown) {
	return JSON.stringify(value, null, 2)
		.split("\n")
		.map((line) => `  ${line}`)
		.join("\n");
}

function x5cToPem(x5c: string) {
	const lines = ["-----BEGIN CERTIFICATE-----"];
	for (let i = 0; i < x5c.length; i += 64) {
		lines.push(x5c.slice(i, i + 64));
	}
	lines.push("-----END CERTIFICATE-----");
	return lines.join("\n");
}

export function formatSessionSummary(input: {
	serverUrl: string;
	user: NonNullable<{
		id: string;
		username: string | null;
		name: string;
		isAnonymous: boolean;
		createdAt: string;
	}>;
}) {
	return section("Session", [
		`server: ${input.serverUrl}`,
		`user: ${input.user.username ?? input.user.name}`,
		`name: ${input.user.name}`,
		`mode: ${input.user.isAnonymous ? "guest" : "username"}`,
		`user id: ${input.user.id}`,
	]);
}

export function formatTemplateList(templates: Template[]) {
	if (templates.length === 0) {
		return "No templates found.";
	}
	return [
		`Templates (${templates.length})`,
		...templates.flatMap((template, index) => [
			`${index + 1}. ${template.name} [${template.kind}]`,
			`   id: ${template.id}`,
			`   vct: ${template.vct}`,
			`   configuration: ${template.credentialConfigurationId}`,
		]),
	].join("\n");
}

export function formatTemplateSummary(template: Template) {
	return [
		section("Template", [
			`name: ${template.name}`,
			`id: ${template.id}`,
			`kind: ${template.kind}`,
			`vct: ${template.vct}`,
			`configuration: ${template.credentialConfigurationId}`,
		]),
		"",
		"Default claims",
		jsonBlock(template.defaultClaims),
	].join("\n");
}

export function formatIssuanceList(issuances: Issuance[]) {
	if (issuances.length === 0) {
		return "No issuances found.";
	}
	return [
		`Issuances (${issuances.length})`,
		...issuances.flatMap((issuance, index) => [
			`${index + 1}. ${issuance.vct}`,
			`   id: ${issuance.id}`,
			`   state: ${issuance.state}`,
			`   status: ${getTokenStatusLabel(issuance.status)}`,
			`   created: ${issuance.createdAt}`,
		]),
	].join("\n");
}

export function formatIssuanceSummary(detail: IssuanceDetail) {
	const { issuance } = detail;
	return [
		section("Issuance", [
			`id: ${issuance.id}`,
			`template: ${issuance.templateId}`,
			`vct: ${issuance.vct}`,
			`state: ${issuance.state}`,
			`status: ${getTokenStatusLabel(issuance.status)}`,
			`created: ${issuance.createdAt}`,
		]),
		"",
		"Offer URI",
		`  ${issuance.offerUri}`,
		"",
		"Claims",
		jsonBlock(issuance.claims),
	].join("\n");
}

export function formatDeletedTemplate(templateId: string) {
	return `Deleted template ${templateId}.`;
}

export function formatSignedOut(serverUrl?: string) {
	return serverUrl ? `Signed out from ${serverUrl}.` : "Signed out.";
}

export function formatIssuerMetadata(metadata: IssuerMetadata) {
	const endpointLines = [
		`credential issuer: ${metadata.credential_issuer}`,
		`token endpoint: ${metadata.token_endpoint}`,
		`credential endpoint: ${metadata.credential_endpoint}`,
	];
	if (metadata.nonce_endpoint) {
		endpointLines.push(`nonce endpoint: ${metadata.nonce_endpoint}`);
	}

	const signingKeyLines = metadata.jwks.keys.flatMap((key, index) => {
		const lines = [
			`Key ${index + 1}`,
			`  kid: ${typeof key.kid === "string" ? key.kid : "-"}`,
			`  alg: ${typeof key.alg === "string" ? key.alg : "-"}`,
			`  kty: ${typeof key.kty === "string" ? key.kty : "-"}`,
			"  jwk:",
			jsonBlock(
				Object.fromEntries(
					Object.entries(key).filter(([name]) => name !== "x5c"),
				),
			),
		];

		const x5cValues = Array.isArray(key.x5c)
			? key.x5c.filter((value): value is string => typeof value === "string")
			: [];
		if (x5cValues.length === 0) {
			lines.push("  x5c: none");
			return lines;
		}

		for (const [certIndex, cert] of x5cValues.entries()) {
			lines.push(`  certificate ${certIndex + 1}:`);
			lines.push(
				...x5cToPem(cert)
					.split("\n")
					.map((line) => `    ${line}`),
			);
		}
		return lines;
	});

	const credentialConfigurationLines = Object.entries(
		metadata.credential_configurations_supported,
	).flatMap(([configId, config]) => [configId, jsonBlock(config)]);

	return [
		section("Endpoints", endpointLines),
		"",
		section("Signing Keys", signingKeyLines),
		"",
		section(
			"Credential Configurations Supported",
			credentialConfigurationLines,
		),
	].join("\n");
}
