import { IssuerWebClient } from "../client.ts";
import { baseCliOptionsSchema } from "../schemas.ts";
import { resolveServerUrl } from "../session.ts";

type ActionDeps = {
	fetchImpl?: typeof fetch;
};

export async function metadataAction(
	rawOptions: unknown,
	deps: ActionDeps = {},
) {
	const options = baseCliOptionsSchema.parse(rawOptions);
	const serverUrl = resolveServerUrl(options);
	const client = new IssuerWebClient({ serverUrl, fetchImpl: deps.fetchImpl });
	const metadata = await client.getMetadata();
	return { serverUrl, metadata };
}
