import type { Template } from "@vidos-id/openid4vc-issuer-web-shared";
import { Button } from "./ui/button.tsx";

export function TemplateList(props: {
	templates: Template[];
	onUseTemplate?: (templateId: string) => void;
	onDelete?: (templateId: string) => void;
	showDelete?: boolean;
}) {
	if (props.templates.length === 0) {
		return (
			<p className="py-6 text-center text-sm text-muted-foreground">
				No templates yet.
			</p>
		);
	}

	return (
		<div className="divide-y rounded-md border">
			{props.templates.map((template) => (
				<div
					key={template.id}
					className="flex items-center justify-between gap-4 px-4 py-3"
				>
					<div className="min-w-0">
						<p className="text-sm font-medium">{template.name}</p>
						<p className="truncate text-xs text-muted-foreground">
							{template.vct}
						</p>
					</div>
					<div className="flex shrink-0 gap-2">
						{props.onUseTemplate ? (
							<Button
								variant="outline"
								size="sm"
								onClick={() => props.onUseTemplate?.(template.id)}
								type="button"
							>
								Use template
							</Button>
						) : null}
						{props.showDelete &&
						props.onDelete &&
						template.kind === "custom" ? (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => props.onDelete?.(template.id)}
								type="button"
								className="text-destructive hover:text-destructive"
							>
								Delete
							</Button>
						) : null}
					</div>
				</div>
			))}
		</div>
	);
}
