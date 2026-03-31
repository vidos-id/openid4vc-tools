import type { IssuanceDetail, Template } from "@vidos-id/issuer-web-shared";
import { api } from "./api.ts";

export async function loadDashboardData() {
	const [templatesResponse, issuancesResponse] = await Promise.all([
		api.listTemplates(),
		api.listIssuances(),
	]);

	return {
		templates: templatesResponse.ok
			? ((await templatesResponse.json()) as Template[])
			: [],
		issuances: issuancesResponse.ok
			? ((await issuancesResponse.json()) as IssuanceDetail["issuance"][])
			: [],
	};
}
