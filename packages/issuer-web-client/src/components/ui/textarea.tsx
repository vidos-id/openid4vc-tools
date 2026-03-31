import { cn } from "../../lib/cn.ts";

export function Textarea(
	props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
		label?: string;
	},
) {
	const { label, className, id, ...rest } = props;
	const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

	if (label) {
		return (
			<div className="space-y-1.5">
				<label htmlFor={inputId} className="text-sm font-medium leading-none">
					{label}
				</label>
				<textarea
					id={inputId}
					className={cn(
						"flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
						className,
					)}
					{...rest}
				/>
			</div>
		);
	}

	return (
		<textarea
			id={inputId}
			className={cn(
				"flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
				className,
			)}
			{...rest}
		/>
	);
}
