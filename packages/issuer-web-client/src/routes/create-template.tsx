import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "../components/layout.tsx";
import { TemplateForm } from "../components/template-form.tsx";
import { api } from "../lib/api.ts";
import { authClient } from "../lib/auth.ts";

export function CreateTemplatePage() {
	const navigate = useNavigate();
	const { data, isPending } = authClient.useSession();
	const [templateName, setTemplateName] = useState("");
	const [templateVct, setTemplateVct] = useState("");
	const [templateClaims, setTemplateClaims] = useState(
		JSON.stringify({ given_name: "Ada", family_name: "Lovelace" }, null, 2),
	);

	useEffect(() => {
		if (isPending) {
			return;
		}
		if (!data?.user) {
			void navigate({ to: "/signin" });
		}
	}, [data?.user, isPending, navigate]);

	if (isPending || !data?.user) {
		return <p className="text-sm text-muted-foreground">Loading...</p>;
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
				title="Create template"
				description="Define a reusable credential template and default claims for future issuances."
			/>
			<TemplateForm
				claims={templateClaims}
				name={templateName}
				onClaimsChange={setTemplateClaims}
				onNameChange={setTemplateName}
				onSubmit={() => {
					void (async () => {
						const response = await api.createTemplate({
							name: templateName,
							vct: templateVct,
							defaultClaims: JSON.parse(templateClaims),
						});
						if (response.ok) {
							void navigate({ to: "/" });
						}
					})();
				}}
				onVctChange={setTemplateVct}
				vct={templateVct}
			/>
		</>
	);
}
