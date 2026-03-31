import { cn } from "../../lib/cn.ts";

export function Input(
	props: React.InputHTMLAttributes<HTMLInputElement> & { label?: string },
) {
	const { label, className, id, ...rest } = props;
	const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

	if (label) {
		return (
			<div className="space-y-1.5">
				<label htmlFor={inputId} className="text-sm font-medium leading-none">
					{label}
				</label>
				<input
					id={inputId}
					className={cn(
						"flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
						className,
					)}
					{...rest}
				/>
			</div>
		);
	}

	return (
		<input
			id={inputId}
			className={cn(
				"flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
				className,
			)}
			{...rest}
		/>
	);
}
