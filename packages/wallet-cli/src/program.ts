import { printResult, setVerbose, verbose } from "@vidos-id/cli-common";
import { Command } from "commander";
import { importCredentialAction } from "./actions/import.ts";
import { initWalletAction } from "./actions/init.ts";
import { listCredentialsAction } from "./actions/list.ts";
import { presentCredentialAction } from "./actions/present.ts";
import { receiveCredentialAction } from "./actions/receive.ts";
import { showCredentialAction } from "./actions/show.ts";
import {
	formatCredentialDetails,
	formatCredentialList,
	formatCredentialSummary,
	formatInitResult,
	formatPresentationSummary,
} from "./format.ts";

export function createProgram(version: string): Command {
	const program = new Command()
		.name("wallet-cli")
		.version(version)
		.description(
			"Demo wallet CLI for dc+sd-jwt import, OpenID4VCI receipt, credential status resolution, and OpenID4VP presentation",
		)
		.option("--verbose", "Enable verbose logging to stderr", false)
		.hook("preAction", (_thisCommand, actionCommand) => {
			const opts = actionCommand.optsWithGlobals();
			if (opts.verbose) {
				setVerbose(true);
			}
		});

	program
		.command("init")
		.description("Initialize a wallet directory and create a holder key")
		.requiredOption(
			"--wallet-dir <dir>",
			"Path to the wallet storage directory (created if it does not exist)",
		)
		.option(
			"--alg <algorithm>",
			"Holder key algorithm: ES256, ES384, or EdDSA (default: ES256)",
		)
		.option(
			"--holder-key-file <file>",
			"Import an existing holder key from a JWK JSON file instead of generating one",
		)
		.option("--output <format>", "Output format: text or json", "text")
		.addHelpText(
			"after",
			`
Examples:
  $ wallet-cli init --wallet-dir ./my-wallet
  $ wallet-cli init --wallet-dir ./my-wallet --alg EdDSA
  $ wallet-cli init --wallet-dir ./my-wallet --holder-key-file ./existing-key.jwk.json
  $ wallet-cli init --wallet-dir ./my-wallet --output json

Notes:
  - Default output is a concise text summary; use --output json for full details
  - --holder-key-file accepts either a bare private JWK or an object with privateJwk/publicJwk fields
  - If the key algorithm cannot be inferred from the JWK, pass --alg explicitly`,
		)
		.action(async (options) => {
			verbose(`Initializing wallet in ${options.walletDir}`);
			const result = await initWalletAction(options);
			if (options.output === "json") {
				printResult(result, "json");
				return;
			}
			printResult(
				formatInitResult({
					walletDir: options.walletDir,
					holderKey: result.holderKey,
					imported: result.imported,
				}),
				"text",
			);
		});

	program
		.command("import")
		.description("Import an issued dc+sd-jwt credential into the wallet")
		.requiredOption(
			"--wallet-dir <dir>",
			"Path to the wallet storage directory",
		)
		.option(
			"--credential <value>",
			"Inline credential text (compact dc+sd-jwt)",
		)
		.option(
			"--credential-file <file>",
			"Path to a credential file (compact dc+sd-jwt text)",
		)
		.option("--output <format>", "Output format: text or json", "text")
		.addHelpText(
			"after",
			`
Examples:
  $ wallet-cli import \\
      --wallet-dir ./my-wallet \\
      --credential-file ./issuer/credential.txt

  $ wallet-cli import \\
      --wallet-dir ./my-wallet \\
      --credential 'eyJ...'

  $ wallet-cli import \
      --wallet-dir ./my-wallet \
      --credential-file ./issuer/credential.txt \
      --output json

Notes:
  - Default output is a concise text summary; use --output json for full details
  - Provide exactly one of --credential or --credential-file
  - This command imports an already-issued compact dc+sd-jwt; it does not resolve credential offers`,
		)
		.action(async (options) => {
			verbose(`Importing credential`);
			const result = await importCredentialAction(options);
			if (options.output === "json") {
				printResult(result, "json");
				return;
			}
			printResult(
				formatCredentialSummary("Imported", result.credential),
				"text",
			);
		});

	program
		.command("receive")
		.description(
			"Receive and store a credential from an OpenID4VCI credential offer using issuer metadata discovery",
		)
		.requiredOption(
			"--wallet-dir <dir>",
			"Path to the wallet storage directory",
		)
		.requiredOption(
			"--offer <value>",
			"Credential offer JSON or an openid-credential-offer:// URI",
		)
		.option("--output <format>", "Output format: text or json", "text")
		.addHelpText(
			"after",
			`
Examples:
  $ wallet-cli receive \
      --wallet-dir ./my-wallet \
      --offer 'openid-credential-offer://?credential_offer=...'

  $ wallet-cli receive \
      --wallet-dir ./my-wallet \
      --offer '{"credential_issuer":"https://issuer.example",...}'

  $ wallet-cli receive \
      --wallet-dir ./my-wallet \
      --offer 'openid-credential-offer://?credential_offer=...' \
      --output json

Notes:
  - Default output is a concise text summary; use --output json for full details
  - Supports by-value credential_offer and by-reference credential_offer_uri inputs
  - Resolves issuer metadata from credential_issuer via /.well-known/openid-credential-issuer[issuer-path]
  - Uses token_endpoint, credential_endpoint, and optional nonce_endpoint from the fetched metadata
  - Does not hardcode endpoint paths and does not expose manual endpoint overrides
  - Current flow covers the minimal OpenID4VCI subset: pre-authorized code, JWT proof, and single dc+sd-jwt issuance
  - A credential_offer_uri is fetched first, then redeemed like an inline offer`,
		)
		.action(async (options) => {
			verbose(`Receiving credential into ${options.walletDir}`);
			const result = await receiveCredentialAction(options);
			if (options.output === "json") {
				printResult(result, "json");
				return;
			}
			printResult(
				formatCredentialSummary("Received", result.credential),
				"text",
			);
		});

	program
		.command("list")
		.description("List stored credentials in the wallet")
		.requiredOption(
			"--wallet-dir <dir>",
			"Path to the wallet storage directory",
		)
		.option(
			"--vct <uri>",
			"Filter by Verifiable Credential Type URI (e.g. urn:eudi:pid:1)",
		)
		.option(
			"--issuer <url>",
			"Filter by issuer identifier URL (e.g. https://issuer.example)",
		)
		.option("--output <format>", "Output format: text or json", "text")
		.addHelpText(
			"after",
			`
Examples:
  $ wallet-cli list --wallet-dir ./my-wallet
  $ wallet-cli list --wallet-dir ./my-wallet --vct urn:eudi:pid:1
  $ wallet-cli list --wallet-dir ./my-wallet --issuer https://issuer.example
  $ wallet-cli list --wallet-dir ./my-wallet --output json`,
		)
		.action(async (options) => {
			verbose(`Listing credentials in ${options.walletDir}`);
			const result = await listCredentialsAction(options);
			if (options.output === "json") {
				printResult(result, "json");
				return;
			}
			printResult(formatCredentialList(result.credentials), "text");
		});

	program
		.command("show")
		.description("Show a single stored credential by id")
		.requiredOption(
			"--wallet-dir <dir>",
			"Path to the wallet storage directory",
		)
		.requiredOption(
			"--credential-id <id>",
			"Credential id (from list output) to display",
		)
		.option(
			"--output <format>",
			"Output format: text, json, or raw (compact sd-jwt text)",
			"text",
		)
		.addHelpText(
			"after",
			`
Examples:
  $ wallet-cli show --wallet-dir ./my-wallet --credential-id <id>
  $ wallet-cli show --wallet-dir ./my-wallet --credential-id <id> --output raw
  $ wallet-cli show --wallet-dir ./my-wallet --credential-id <id> --output json

Notes:
  - Status resolution runs automatically when the stored credential has a status reference
  - If status resolution fails, the credential is still shown and a warning is printed
  - Default output is a sectioned text view; use --output json for full details
  - --output raw prints only the compact sd-jwt credential text
		`,
		)
		.action(async (options) => {
			verbose(`Showing credential ${options.credentialId}`);
			const result = await showCredentialAction(options);
			if (options.output === "raw") {
				process.stdout.write(`${result.credential.compactSdJwt}\n`);
				return;
			}
			if (result.statusWarning) {
				process.stderr.write(
					`Warning: failed to resolve credential status: ${result.statusWarning}\n`,
				);
			}
			if (options.output === "text") {
				printResult(
					formatCredentialDetails({
						credential: result.credential,
						status: result.status,
						statusWarning: result.statusWarning,
					}),
					"text",
				);
				return;
			}
			printResult(result, options.output);
		});

	program
		.command("present")
		.description(
			"Create a DCQL-based OpenID4VP presentation from wallet credentials",
		)
		.requiredOption(
			"--wallet-dir <dir>",
			"Path to the wallet storage directory",
		)
		.requiredOption(
			"--request <value>",
			"OpenID4VP request JSON or an openid4vp:// authorization URL",
		)
		.option(
			"--credential-id <id>",
			"Use a specific credential for the presentation (skip selection prompt)",
		)
		.option(
			"--dry-run",
			"Build the VP response but do not submit it to the verifier",
		)
		.option(
			"--output <format>",
			"Output format: text, json, or raw (vp_token text only)",
			"text",
		)
		.addHelpText(
			"after",
			`
Examples:
  $ wallet-cli present \
      --wallet-dir ./my-wallet \
      --request 'openid4vp://authorize?...'

  $ wallet-cli present \
      --wallet-dir ./my-wallet \
      --request '{"client_id":"https://verifier.example","nonce":"...","dcql_query":{...}}' \
      --credential-id <id> \
      --dry-run

  $ wallet-cli present \
      --wallet-dir ./my-wallet \
      --request 'openid4vp://authorize?...' \
      --output raw

  $ wallet-cli present \
      --wallet-dir ./my-wallet \
      --request 'openid4vp://authorize?...' \
      --output json

Notes:
  - Default output is a concise text summary; use --output json for full details
  - --output raw prints only the vp_token
  - direct_post and direct_post.jwt requests are auto-submitted unless --dry-run is set
  - If multiple credentials match and --credential-id is omitted, the CLI prompts in a TTY and errors in non-interactive environments`,
		)
		.action(async (options) => {
			verbose(`Creating presentation from ${options.walletDir}`);
			const result = await presentCredentialAction(options);
			if (options.output === "raw") {
				process.stdout.write(`${result.vpToken}\n`);
				return;
			}
			if (options.output === "text") {
				printResult(formatPresentationSummary(result), "text");
				return;
			}
			printResult(result, options.output);
		});

	return program;
}
