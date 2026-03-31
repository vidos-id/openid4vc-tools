import {
	getTokenStatusLabel,
	type Issuance,
	type IssuanceDetail,
	type Template,
} from "@vidos-id/issuer-web-shared";

function section(title: string, lines: string[]) {
	return [title, ...lines.map((line) => `  ${line}`)].join("\n");
}

function jsonBlock(value: unknown) {
	return JSON.stringify(value, null, 2)
		.split("\n")
		.map((line) => `  ${line}`)
		.join("\n");
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
