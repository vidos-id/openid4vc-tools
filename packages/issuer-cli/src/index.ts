import {
	handleCliError,
	resolveCliVersion,
	resolvePackageJsonPath,
} from "@vidos-id/openid4vc-cli-common";
import { createProgram } from "./program.ts";

export {
	authSignInAction,
	authSignOutAction,
	authSignUpAction,
	authWhoAmIAction,
} from "./actions/auth.ts";
export { interactiveAction } from "./actions/interactive.ts";
export {
	createIssuanceAction,
	listIssuancesAction,
	showIssuanceAction,
	updateIssuanceStatusAction,
} from "./actions/issuances.ts";
export { metadataAction } from "./actions/metadata.ts";
export {
	createTemplateAction,
	deleteTemplateAction,
	listTemplatesAction,
} from "./actions/templates.ts";
export { createProgram };

export async function runCli(argv = process.argv): Promise<void> {
	const version = await resolveCliVersion(
		resolvePackageJsonPath(import.meta.url),
	);
	try {
		await createProgram(version).parseAsync(argv);
	} catch (error) {
		handleCliError(error);
	}
}
