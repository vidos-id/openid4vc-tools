#!/usr/bin/env bun

import {
	handleCliError,
	resolveCliVersion,
	resolvePackageJsonPath,
} from "@vidos-id/cli-common";
import { createProgram } from "./program.ts";

export { importCredentialAction } from "./actions/import.ts";
export { initWalletAction } from "./actions/init.ts";
export { interactiveWalletAction } from "./actions/interactive.ts";
export { listCredentialsAction } from "./actions/list.ts";
export { presentCredentialAction } from "./actions/present.ts";
export { receiveCredentialAction } from "./actions/receive.ts";
export { showCredentialAction } from "./actions/show.ts";
export { createProgram };

export async function runCli(argv = process.argv): Promise<void> {
	const version = await resolveCliVersion(
		resolvePackageJsonPath(import.meta.url),
	);
	const program = createProgram(version);
	try {
		await program.parseAsync(argv);
	} catch (error) {
		handleCliError(error);
	}
}

if (import.meta.main) {
	await runCli();
}
