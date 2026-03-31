import { cn } from "../../lib/cn.ts";

export type BadgeVariant =
	| "default"
	| "secondary"
	| "active"
	| "suspended"
	| "revoked"
	| "state-offered"
	| "state-redeeming"
	| "state-redeemed"
	| "state-expired"
	| "state-failed";

const variantStyles: Record<BadgeVariant, string> = {
	default: "border bg-background text-foreground",
	secondary: "border-transparent bg-secondary text-secondary-foreground",
	active: "border-transparent bg-status-active/15 text-status-active",
	suspended: "border-transparent bg-status-suspended/15 text-status-suspended",
	revoked: "border-transparent bg-status-revoked/15 text-status-revoked",
	"state-offered": "border-transparent bg-state-offered/12 text-state-offered",
	"state-redeeming":
		"border-transparent bg-state-redeeming/12 text-state-redeeming",
	"state-redeemed":
		"border-transparent bg-state-redeemed/12 text-state-redeemed",
	"state-expired": "border-transparent bg-state-expired/12 text-state-expired",
	"state-failed": "border-transparent bg-state-failed/12 text-state-failed",
};

export function Badge(props: {
	variant?: BadgeVariant;
	children: React.ReactNode;
	className?: string;
}) {
	const { variant = "default", className, children } = props;
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize",
				variantStyles[variant],
				className,
			)}
		>
			{children}
		</span>
	);
}
