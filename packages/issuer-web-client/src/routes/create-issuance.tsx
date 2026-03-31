import { Link, useNavigate, useParams } from "@tanstack/react-router";
import type { IssuanceDetail, Template } from "@vidos-id/issuer-web-shared";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { IssuanceForm } from "../components/issuance-form.tsx";
import { PageHeader } from "../components/layout.tsx";
import { api } from "../lib/api.ts";
import { loadDashboardData } from "../lib/app-state.ts";
import { authClient } from "../lib/auth.ts";

export function CreateIssuancePage() {
	const navigate = useNavigate();
	const { templateId } = useParams({ from: "/issuances/create/$templateId" });
	const { data, isPending } = authClient.useSession();
	const [template, setTemplate] = useState<Template | null>(null);
	const [loaded, setLoaded] = useState(false);
	const [issuanceClaims, setIssuanceClaims] = useState("{}");
	const [initialStatus, setInitialStatus] = useState<0 | 1 | 2>(0);

	useEffect(() => {
		if (isPending) {
			return;
		}
		if (!data?.user) {
			void navigate({ to: "/signin" });
			return;
		}
		void (async () => {
			setLoaded(false);
			const next = await loadDashboardData();
			const selectedTemplate = next.templates.find(
				(item) => item.id === templateId,
			);
			setTemplate(selectedTemplate ?? null);
			setIssuanceClaims(
				JSON.stringify(selectedTemplate?.defaultClaims ?? {}, null, 2),
			);
			setLoaded(true);
		})();
	}, [data?.user, isPending, navigate, templateId]);

	if (isPending || !data?.user || !loaded) {
		return <p className="text-sm text-muted-foreground">Loading...</p>;
	}

	if (!template) {
		return (
			<>
				<Link
					to="/"
					className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
				>
					<ArrowLeft className="h-3.5 w-3.5" />
					Back to overview
				</Link>
				<PageHeader
					title="Create issuance"
					description="The selected template could not be found."
				/>
			</>
		);
	}

	return (
		<>
			<Link
				to="/"
				className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft className="h-3.5 w-3.5" />
				Back to overview
			</Link>
			<PageHeader
				title="Create issuance"
				description="Review the template defaults, adjust claims, then issue the credential offer."
			/>
			<IssuanceForm
				claims={issuanceClaims}
				name={template.name}
				onClaimsChange={setIssuanceClaims}
				onStatusChange={setInitialStatus}
				onSubmit={() => {
					void (async () => {
						const response = await api.createIssuance({
							templateId: template.id,
							claims: JSON.parse(issuanceClaims),
							status: initialStatus,
						});
						if (response.ok) {
							const detail = (await response.json()) as IssuanceDetail;
							void navigate({
								to: "/issuances/$issuanceId",
								params: { issuanceId: detail.issuance.id },
							});
						}
					})();
				}}
				status={initialStatus}
				vct={template.vct}
			/>
		</>
	);
}
