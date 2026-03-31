import { stdout } from "node:process";
import {
	formatDeletedTemplate,
	formatIssuanceList,
	formatIssuanceSummary,
	formatSessionSummary,
	formatSignedOut,
	formatTemplateList,
	formatTemplateSummary,
} from "../format.ts";
import { PromptSession } from "../prompts.ts";
import type { BaseCliOptions, StoredSession } from "../schemas.ts";
import { interactiveOptionsSchema } from "../schemas.ts";
import { readStoredSession, resolveServerUrl } from "../session.ts";
import {
	authSignInAction,
	authSignOutAction,
	authSignUpAction,
	authWhoAmIAction,
} from "./auth.ts";
import {
	createIssuanceAction,
	listIssuancesAction,
	showIssuanceAction,
	updateIssuanceStatusAction,
} from "./issuances.ts";
import {
	createTemplateAction,
	deleteTemplateAction,
	listTemplatesAction,
} from "./templates.ts";

type ActionDeps = {
	fetchImpl?: typeof fetch;
};

export async function interactiveAction(
	rawOptions: unknown,
	deps: ActionDeps = {},
) {
	if (!process.stdin.isTTY || !process.stdout.isTTY) {
		throw new Error(
			"Interactive mode requires a TTY. Use an explicit subcommand for non-interactive usage.",
		);
	}
	const options = interactiveOptionsSchema.parse(rawOptions);
	const prompt = new PromptSession();
	let serverUrl = await resolveInteractiveServerUrl(prompt, options);

	try {
		while (true) {
			const session = await readStoredSession(options);
			if (!session || session.serverUrl !== serverUrl) {
				await authenticateInteractive(prompt, { ...options, serverUrl }, deps);
			}

			const choice = await prompt.choose("Issuer CLI", [
				{ label: "Who am I", value: "whoami" },
				{ label: "List templates", value: "templates-list" },
				{ label: "Create template", value: "templates-create" },
				{ label: "Delete template", value: "templates-delete" },
				{ label: "List issuances", value: "issuances-list" },
				{ label: "Create issuance", value: "issuances-create" },
				{ label: "Show issuance", value: "issuances-show" },
				{ label: "Update issuance status", value: "issuances-status" },
				{ label: "Switch server", value: "switch-server" },
				{ label: "Sign out", value: "signout" },
				{ label: "Exit", value: "exit" },
			]);

			stdout.write("\n");

			if (choice === "exit") {
				return;
			}

			if (choice === "switch-server") {
				serverUrl = await resolveInteractiveServerUrl(prompt, {
					...options,
					serverUrl,
				});
				continue;
			}

			if (choice === "whoami") {
				const result = await authWhoAmIAction({ ...options, serverUrl }, deps);
				stdout.write(`${formatSessionSummary(result)}\n\n`);
				continue;
			}

			if (choice === "templates-list") {
				const result = await listTemplatesAction(
					{ ...options, serverUrl },
					deps,
				);
				stdout.write(`${formatTemplateList(result.templates)}\n\n`);
				continue;
			}

			if (choice === "templates-create") {
				const name = await prompt.text("Template name");
				const vct = await prompt.text("VCT");
				const claims = await prompt.text("Default claims JSON", {
					defaultValue: "{}",
				});
				const result = await createTemplateAction(
					{ ...options, serverUrl, name, vct, claims },
					deps,
				);
				stdout.write(`${formatTemplateSummary(result.template)}\n\n`);
				continue;
			}

			if (choice === "templates-delete") {
				const result = await listTemplatesAction(
					{ ...options, serverUrl },
					deps,
				);
				if (result.templates.length === 0) {
					stdout.write("No templates found.\n\n");
					continue;
				}
				const selectable = result.templates.filter(
					(template) => template.kind === "custom",
				);
				if (selectable.length === 0) {
					stdout.write("No custom templates can be deleted.\n\n");
					continue;
				}
				const templateId = await prompt.choose(
					"Select a template to delete",
					selectable.map((template) => ({
						label: `${template.name} (${template.id})`,
						value: template.id,
					})),
				);
				const confirmed = await prompt.confirm(
					`Delete template ${templateId}?`,
					false,
				);
				if (!confirmed) {
					stdout.write("Cancelled.\n\n");
					continue;
				}
				const deleted = await deleteTemplateAction(
					{ ...options, serverUrl, templateId },
					deps,
				);
				stdout.write(`${formatDeletedTemplate(deleted.templateId)}\n\n`);
				continue;
			}

			if (choice === "issuances-list") {
				const result = await listIssuancesAction(
					{ ...options, serverUrl },
					deps,
				);
				stdout.write(`${formatIssuanceList(result.issuances)}\n\n`);
				continue;
			}

			if (choice === "issuances-create") {
				const templates = await listTemplatesAction(
					{ ...options, serverUrl },
					deps,
				);
				if (templates.templates.length === 0) {
					stdout.write("No templates available. Create one first.\n\n");
					continue;
				}
				const templateId = await prompt.choose(
					"Select a template",
					templates.templates.map((template) => ({
						label: `${template.name} (${template.vct})`,
						value: template.id,
					})),
				);
				const claims = await prompt.text("Issuance claims JSON", {
					defaultValue: "{}",
				});
				const status = await prompt.choose("Initial status", [
					{ label: "active", value: "active" },
					{ label: "suspended", value: "suspended" },
					{ label: "revoked", value: "revoked" },
				]);
				const created = await createIssuanceAction(
					{ ...options, serverUrl, templateId, claims, status },
					deps,
				);
				stdout.write(`${formatIssuanceSummary(created.detail)}\n\n`);
				continue;
			}

			if (choice === "issuances-show") {
				const issuanceId = await prompt.text("Issuance id");
				const result = await showIssuanceAction(
					{ ...options, serverUrl, issuanceId },
					deps,
				);
				stdout.write(`${formatIssuanceSummary(result.detail)}\n\n`);
				continue;
			}

			if (choice === "issuances-status") {
				const issuanceId = await prompt.text("Issuance id");
				const status = await prompt.choose("New status", [
					{ label: "active", value: "active" },
					{ label: "suspended", value: "suspended" },
					{ label: "revoked", value: "revoked" },
				]);
				const result = await updateIssuanceStatusAction(
					{ ...options, serverUrl, issuanceId, status },
					deps,
				);
				stdout.write(`${formatIssuanceSummary(result.detail)}\n\n`);
				continue;
			}

			if (choice === "signout") {
				const result = await authSignOutAction({ ...options, serverUrl }, deps);
				stdout.write(`${formatSignedOut(result.serverUrl)}\n\n`);
			}
		}
	} finally {
		prompt.close();
	}
}

async function authenticateInteractive(
	prompt: PromptSession,
	options: BaseCliOptions,
	deps: ActionDeps,
) {
	stdout.write(`No saved session for ${options.serverUrl}.\n`);
	const choice = await prompt.choose("Choose authentication mode", [
		{ label: "Continue as guest", value: "guest" },
		{ label: "Sign in", value: "signin" },
		{ label: "Create account", value: "signup" },
	]);

	if (choice === "guest") {
		const result = await authSignInAction(
			{ ...options, anonymous: true },
			deps,
		);
		stdout.write(`${formatSessionSummary(result)}\n\n`);
		return;
	}

	const username = await prompt.text("Username");
	const password = await prompt.text("Password", { password: true });
	if (choice === "signup") {
		const result = await authSignUpAction(
			{ ...options, username, password },
			deps,
		);
		stdout.write(`${formatSessionSummary(result)}\n\n`);
		return;
	}
	const result = await authSignInAction(
		{ ...options, username, password },
		deps,
	);
	stdout.write(`${formatSessionSummary(result)}\n\n`);
}

async function resolveInteractiveServerUrl(
	prompt: PromptSession,
	options: BaseCliOptions,
) {
	const saved = await readStoredSession(options);
	return prompt.text("Issuer web server URL", {
		defaultValue: resolveServerUrl(
			options,
			(saved as StoredSession | null) ?? undefined,
		),
	});
}
