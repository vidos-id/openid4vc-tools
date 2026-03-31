import { access } from "node:fs/promises";
import { stdout } from "node:process";
import {
	formatCredentialDetails,
	formatCredentialList,
	formatCredentialSummary,
	formatInitResult,
	formatPresentationSummary,
} from "../format.ts";
import { PromptSession } from "../prompts.ts";
import { importCredentialAction } from "./import.ts";
import { initWalletAction } from "./init.ts";
import { listCredentialsAction } from "./list.ts";
import { presentCredentialAction } from "./present.ts";
import { receiveCredentialAction } from "./receive.ts";
import { showCredentialAction } from "./show.ts";

export async function interactiveWalletAction(rawOptions: unknown) {
	if (!process.stdin.isTTY || !process.stdout.isTTY) {
		throw new Error(
			"Interactive mode requires a TTY. Use an explicit subcommand for non-interactive usage.",
		);
	}

	const options = (rawOptions ?? {}) as { walletDir?: string };
	const prompt = new PromptSession();
	let walletDir = await prompt.text("Wallet directory", {
		defaultValue: options.walletDir ?? "./wallet-data",
	});

	try {
		while (true) {
			await ensureWalletReady(prompt, walletDir);
			const choice = await prompt.choose("Wallet CLI", [
				{ label: "Receive credential offer", value: "receive" },
				{ label: "List credentials", value: "list" },
				{ label: "Show credential", value: "show" },
				{ label: "Present credential", value: "present" },
				{ label: "Import raw credential", value: "import" },
				{ label: "Reinitialize wallet", value: "init" },
				{ label: "Switch wallet directory", value: "switch" },
				{ label: "Exit", value: "exit" },
			]);

			stdout.write("\n");

			switch (choice) {
				case "exit":
					return;
				case "switch": {
					walletDir = await prompt.text("Wallet directory", {
						defaultValue: walletDir,
					});
					stdout.write(`Using wallet ${walletDir}.\n\n`);
					break;
				}
				case "init": {
					const alg = await prompt.choose("Holder key algorithm", [
						{ label: "ES256", value: "ES256" },
						{ label: "ES384", value: "ES384" },
						{ label: "EdDSA", value: "EdDSA" },
					]);
					const result = await initWalletAction({ walletDir, alg });
					stdout.write(
						`${formatInitResult({ walletDir, holderKey: result.holderKey, imported: result.imported })}\n\n`,
					);
					break;
				}
				case "receive": {
					const offer = await prompt.text("Credential offer or offer URI");
					const result = await receiveCredentialAction({ walletDir, offer });
					stdout.write(
						`${formatCredentialSummary("Received", result.credential)}\n\n`,
					);
					break;
				}
				case "import": {
					const credential = await prompt.text("Compact dc+sd-jwt credential");
					const result = await importCredentialAction({
						walletDir,
						credential,
					});
					stdout.write(
						`${formatCredentialSummary("Imported", result.credential)}\n\n`,
					);
					break;
				}
				case "list": {
					const result = await listCredentialsAction({ walletDir });
					stdout.write(`${formatCredentialList(result.credentials)}\n\n`);
					break;
				}
				case "show": {
					const list = await listCredentialsAction({ walletDir });
					if (list.credentials.length === 0) {
						stdout.write("0 credentials found\n\n");
						break;
					}
					const credentialId = await prompt.choose(
						"Select a credential",
						list.credentials.map((credential) => ({
							label: `${credential.id} | ${credential.vct} | ${credential.issuer}`,
							value: credential.id,
						})),
					);
					const result = await showCredentialAction({
						walletDir,
						credentialId,
					});
					if (result.statusWarning) {
						process.stderr.write(
							`Warning: failed to resolve credential status: ${result.statusWarning}\n`,
						);
					}
					stdout.write(
						`${formatCredentialDetails({
							credential: result.credential,
							status: result.status,
							statusWarning: result.statusWarning,
						})}\n\n`,
					);
					break;
				}
				case "present": {
					const request = await prompt.text(
						"OpenID4VP request JSON or openid4vp:// URL",
					);
					const dryRun = await prompt.confirm(
						"Build the presentation without submitting it?",
						false,
					);
					const result = await presentCredentialAction({
						walletDir,
						request,
						dryRun,
					});
					stdout.write(`${formatPresentationSummary(result)}\n\n`);
					break;
				}
			}
		}
	} finally {
		prompt.close();
	}
}

async function ensureWalletReady(prompt: PromptSession, walletDir: string) {
	if (await walletExists(walletDir)) {
		return;
	}
	stdout.write(`Wallet ${walletDir} is not initialized yet.\n`);
	const createNow = await prompt.confirm("Create it now?", true);
	if (!createNow) {
		throw new Error(`Wallet ${walletDir} is required to continue.`);
	}
	const alg = await prompt.choose("Holder key algorithm", [
		{ label: "ES256", value: "ES256" },
		{ label: "ES384", value: "ES384" },
		{ label: "EdDSA", value: "EdDSA" },
	]);
	const result = await initWalletAction({ walletDir, alg });
	stdout.write(
		`${formatInitResult({ walletDir, holderKey: result.holderKey, imported: result.imported })}\n\n`,
	);
}

async function walletExists(walletDir: string) {
	try {
		await access(walletDir);
		await access(`${walletDir}/wallet.json`);
		await access(`${walletDir}/holder-key.json`);
		return true;
	} catch {
		return false;
	}
}
