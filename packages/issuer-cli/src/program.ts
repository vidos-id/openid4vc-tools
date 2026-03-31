import { printResult, setVerbose, verbose } from "@vidos-id/cli-common";
import { Command } from "commander";
import {
	authSignInAction,
	authSignOutAction,
	authSignUpAction,
	authWhoAmIAction,
} from "./actions/auth.ts";
import { interactiveAction } from "./actions/interactive.ts";
import {
	createIssuanceAction,
	listIssuancesAction,
	showIssuanceAction,
	updateIssuanceStatusAction,
} from "./actions/issuances.ts";
import {
	createTemplateAction,
	deleteTemplateAction,
	listTemplatesAction,
} from "./actions/templates.ts";
import {
	formatDeletedTemplate,
	formatIssuanceList,
	formatIssuanceSummary,
	formatSessionSummary,
	formatSignedOut,
	formatTemplateList,
	formatTemplateSummary,
} from "./format.ts";

function withCommonOptions(command: Command) {
	return command
		.option(
			"--server-url <url>",
			"Issuer web server base URL (default: saved session, ISSUER_WEB_SERVER_URL, or http://localhost:3001)",
		)
		.option(
			"--session-file <file>",
			"Override the saved session file location",
		);
}

export function createProgram(version: string): Command {
	const program = withCommonOptions(
		new Command()
			.name("issuer-cli")
			.version(version)
			.description(
				"Terminal client for issuer-web-server. Run without a subcommand to start interactive mode.",
			)
			.addHelpText(
				"after",
				"\nInteractive mode:\n  Run `issuer-cli` without a subcommand to open the prompt-driven workflow.",
			)
			.showHelpAfterError()
			.option("--verbose", "Enable verbose logging to stderr", false)
			.hook("preAction", (_thisCommand, actionCommand) => {
				const opts = actionCommand.optsWithGlobals();
				if (opts.verbose) {
					setVerbose(true);
				}
			}),
	).action(async (options) => {
		await interactiveAction(options);
	});

	const auth = program
		.command("auth")
		.description("Authenticate and inspect the current session");

	withCommonOptions(
		auth
			.command("signin")
			.description("Sign in with a guest session or username/password")
			.option("--anonymous", "Start a guest session")
			.option("--username <name>", "Username for sign-in")
			.option("--password <password>", "Password for sign-in")
			.addHelpText(
				"after",
				`\nExamples:\n  $ issuer-cli auth signin --anonymous\n  $ issuer-cli auth signin --server-url http://localhost:3001 --username ada --password secret`,
			),
	).action(async (options) => {
		verbose(`Signing in to ${options.serverUrl ?? "saved/default server"}`);
		const result = await authSignInAction(options);
		printResult(formatSessionSummary(result), "text");
	});

	withCommonOptions(
		auth
			.command("signup")
			.description("Create an account and save the resulting session")
			.requiredOption("--username <name>", "Username for the new account")
			.requiredOption("--password <password>", "Password for the new account"),
	).action(async (options) => {
		const result = await authSignUpAction(options);
		printResult(formatSessionSummary(result), "text");
	});

	withCommonOptions(
		auth.command("whoami").description("Show the currently saved session"),
	).action(async (options) => {
		const result = await authWhoAmIAction(options);
		printResult(formatSessionSummary(result), "text");
	});

	withCommonOptions(
		auth.command("signout").description("Sign out and clear the saved session"),
	).action(async (options) => {
		const result = await authSignOutAction(options);
		printResult(formatSignedOut(result.serverUrl), "text");
	});

	const templates = program
		.command("templates")
		.description("Manage credential templates through issuer-web-server");

	withCommonOptions(
		templates
			.command("list")
			.description("List templates visible to the current user"),
	).action(async (options) => {
		const result = await listTemplatesAction(options);
		printResult(formatTemplateList(result.templates), "text");
	});

	withCommonOptions(
		templates
			.command("create")
			.description("Create a custom template")
			.requiredOption("--name <value>", "Template name")
			.requiredOption("--vct <value>", "Verifiable Credential Type")
			.option("--claims <json>", "Inline JSON object for default claims")
			.option("--claims-file <file>", "Path to a JSON file with default claims")
			.addHelpText(
				"after",
				`\nExamples:\n  $ issuer-cli templates create --name "Conference Pass" --vct https://issuer.example/credentials/conference-pass --claims '{"given_name":"Ada"}'\n  $ issuer-cli templates create --name "PID" --vct urn:eudi:pid:1 --claims-file ./claims.json`,
			),
	).action(async (options) => {
		const result = await createTemplateAction(options);
		printResult(formatTemplateSummary(result.template), "text");
	});

	withCommonOptions(
		templates
			.command("delete")
			.description("Delete a custom template by id")
			.requiredOption("--template-id <id>", "Template id"),
	).action(async (options) => {
		const result = await deleteTemplateAction(options);
		printResult(formatDeletedTemplate(result.templateId), "text");
	});

	const issuances = program
		.command("issuances")
		.description("Create and manage credential offers");

	withCommonOptions(
		issuances
			.command("list")
			.description("List issuances for the current user"),
	).action(async (options) => {
		const result = await listIssuancesAction(options);
		printResult(formatIssuanceList(result.issuances), "text");
	});

	withCommonOptions(
		issuances
			.command("create")
			.description("Create a new issuance offer from a template")
			.requiredOption("--template-id <id>", "Template id")
			.option("--claims <json>", "Inline JSON object with issuance claims")
			.option(
				"--claims-file <file>",
				"Path to a JSON file with issuance claims",
			)
			.option(
				"--status <value>",
				"Initial credential status: active, suspended, or revoked",
			)
			.addHelpText(
				"after",
				`\nExample:\n  $ issuer-cli issuances create --template-id <template-id> --claims '{"seat":"A-12"}' --status active`,
			),
	).action(async (options) => {
		const result = await createIssuanceAction(options);
		printResult(formatIssuanceSummary(result.detail), "text");
	});

	withCommonOptions(
		issuances
			.command("show")
			.description("Show one issuance including the offer URI")
			.requiredOption("--issuance-id <id>", "Issuance id"),
	).action(async (options) => {
		const result = await showIssuanceAction(options);
		printResult(formatIssuanceSummary(result.detail), "text");
	});

	withCommonOptions(
		issuances
			.command("status")
			.description("Update the credential status for an issuance")
			.requiredOption("--issuance-id <id>", "Issuance id")
			.requiredOption(
				"--status <value>",
				"New credential status: active, suspended, or revoked",
			),
	).action(async (options) => {
		const result = await updateIssuanceStatusAction(options);
		printResult(formatIssuanceSummary(result.detail), "text");
	});

	return program;
}
