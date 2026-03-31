import { Wallet } from "@vidos-id/wallet";
import { showOptionsSchema } from "../schemas.ts";
import { FileSystemWalletStorage } from "../storage.ts";

export async function showCredentialAction(rawOptions: unknown) {
	const options = showOptionsSchema.parse(rawOptions);
	const storage = new FileSystemWalletStorage(options.walletDir);
	const wallet = new Wallet(storage);
	const credential = await storage.getCredential(options.credentialId);
	if (!credential) {
		throw new Error(`Credential ${options.credentialId} not found`);
	}
	try {
		const status = await wallet.getCredentialStatus(options.credentialId);
		return { credential, status, statusWarning: undefined };
	} catch (error) {
		return {
			credential,
			status: null,
			statusWarning: error instanceof Error ? error.message : String(error),
		};
	}
}
