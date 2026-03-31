import { cn } from "../lib/cn.ts";

export function PageHeader(props: {
	title: string;
	description?: string;
	actions?: React.ReactNode;
}) {
	return (
		<div className="mb-8">
			<div className="flex items-center justify-between gap-4">
				<h1 className="text-2xl font-semibold tracking-tight">{props.title}</h1>
				{props.actions ? (
					<div className="flex gap-2">{props.actions}</div>
				) : null}
			</div>
			{props.description ? (
				<p className="mt-1 text-sm text-muted-foreground">
					{props.description}
				</p>
			) : null}
		</div>
	);
}

export function Section(props: {
	title: string;
	description?: string;
	actions?: React.ReactNode;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<section className={cn("space-y-4", props.className)}>
			<div className="flex items-center justify-between gap-4">
				<div>
					<h2 className="text-lg font-semibold tracking-tight">
						{props.title}
					</h2>
					{props.description ? (
						<p className="text-sm text-muted-foreground">{props.description}</p>
					) : null}
				</div>
				{props.actions ? (
					<div className="flex gap-2">{props.actions}</div>
				) : null}
			</div>
			{props.children}
		</section>
	);
}
