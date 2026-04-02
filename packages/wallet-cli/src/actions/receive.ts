import { receiveCredentialFromOffer, Wallet } from "@vidos-id/openid4vc-wallet";
import { receiveOptionsSchema } from "../schemas.ts";
import { FileSystemWalletStorage } from "../storage.ts";

export async function receiveCredentialAction(rawOptions: unknown) {
	const options = receiveOptionsSchema.parse(rawOptions);
	const wallet = new Wallet(new FileSystemWalletStorage(options.walletDir));
	const credential = await receiveCredentialFromOffer(wallet, options.offer);
	return { credential };
}
