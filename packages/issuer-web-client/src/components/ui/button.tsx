import { cn } from "../../lib/cn.ts";

type ButtonVariant =
	| "default"
	| "secondary"
	| "outline"
	| "ghost"
	| "destructive";
type ButtonSize = "default" | "sm";

const variantStyles: Record<ButtonVariant, string> = {
	default: "bg-primary text-primary-foreground hover:bg-primary/90",
	secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
	outline: "border bg-background hover:bg-accent hover:text-accent-foreground",
	ghost: "hover:bg-accent hover:text-accent-foreground",
	destructive:
		"bg-destructive text-destructive-foreground hover:bg-destructive/90",
};

const sizeStyles: Record<ButtonSize, string> = {
	default: "h-9 px-4 py-2 text-sm",
	sm: "h-8 px-3 text-xs",
};

export function Button(
	props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
		variant?: ButtonVariant;
		size?: ButtonSize;
	},
) {
	const { variant = "default", size = "default", className, ...rest } = props;
	return (
		<button
			className={cn(
				"inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
				variantStyles[variant],
				sizeStyles[size],
				className,
			)}
			{...rest}
		/>
	);
}
