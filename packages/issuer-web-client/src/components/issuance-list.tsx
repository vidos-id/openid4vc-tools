import { Link } from "@tanstack/react-router";
import type { IssuanceDetail } from "@vidos-id/issuer-web-shared";
import { TOKEN_STATUS_LABELS } from "@vidos-id/issuer-web-shared";
import type { BadgeVariant } from "./ui/badge.tsx";
import { Badge } from "./ui/badge.tsx";

const ISSUANCE_STATE_LABELS = {
	offered: "Offered",
	redeeming: "Redeeming",
	redeemed: "Redeemed",
	expired: "Expired",
	redemption_failed: "Redemption failed",
} as const;

type IssuanceState = keyof typeof ISSUANCE_STATE_LABELS;

const STATE_BADGE_VARIANTS: Record<IssuanceState, BadgeVariant> = {
	offered: "state-offered",
	redeeming: "state-redeeming",
	redeemed: "state-redeemed",
	expired: "state-expired",
	redemption_failed: "state-failed",
};

function statusVariant(status: number) {
	const label = TOKEN_STATUS_LABELS[status as keyof typeof TOKEN_STATUS_LABELS];
	if (label === "active") return "active" as const;
	if (label === "suspended") return "suspended" as const;
	if (label === "revoked") return "revoked" as const;
	return "default" as const;
}

export function IssuanceList(props: {
	issuances: IssuanceDetail["issuance"][];
}) {
	if (props.issuances.length === 0) {
		return (
			<p className="py-6 text-center text-sm text-muted-foreground">
				No issuances yet.
			</p>
		);
	}

	return (
		<div className="divide-y rounded-md border">
			{props.issuances.map((issuance) => (
				<Link
					key={issuance.id}
					to="/issuances/$issuanceId"
					params={{ issuanceId: issuance.id }}
					className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/50"
				>
					<div className="min-w-0">
						<p className="text-sm font-medium">{issuance.vct}</p>
					</div>
					<div className="flex shrink-0 items-center gap-1.5">
						<Badge variant={STATE_BADGE_VARIANTS[issuance.state]}>
							{ISSUANCE_STATE_LABELS[issuance.state]}
						</Badge>
						<Badge variant={statusVariant(issuance.status)}>
							{TOKEN_STATUS_LABELS[issuance.status]}
						</Badge>
					</div>
				</Link>
			))}
		</div>
	);
}
