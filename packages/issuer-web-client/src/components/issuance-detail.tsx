import type { IssuanceDetail } from "@vidos-id/issuer-web-shared";
import {
	ACTIVE_TOKEN_STATUS,
	getTokenStatusLabel,
} from "@vidos-id/issuer-web-shared";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { BadgeVariant } from "./ui/badge.tsx";
import { Badge } from "./ui/badge.tsx";
import { Textarea } from "./ui/textarea.tsx";

function statusVariant(status: number) {
	const label = getTokenStatusLabel(status as 0 | 1 | 2);
	if (label === "active") return "active" as const;
	if (label === "suspended") return "suspended" as const;
	if (label === "revoked") return "revoked" as const;
	return "default" as const;
}

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

/** True when the issuance lifecycle is complete — no more wallet interaction possible. */
function isTerminalState(state: IssuanceState): boolean {
	return (
		state === "redeemed" || state === "expired" || state === "redemption_failed"
	);
}

export function IssuanceDetailCard(props: { detail: IssuanceDetail }) {
	const { issuance } = props.detail;
	const terminal = isTerminalState(issuance.state);
	const showCredentialStatus = issuance.status !== ACTIVE_TOKEN_STATUS;

	return (
		<div className="grid gap-8 lg:grid-cols-2">
			{/* Left column: wallet handoff OR redeemed confirmation */}
			<div className="space-y-4">
				{issuance.state === "redeemed" ? (
					<RedeemedPresentation />
				) : issuance.state === "expired" ? (
					<ExpiredPresentation />
				) : issuance.state === "redemption_failed" ? (
					<FailedPresentation />
				) : (
					<>
						<h3 className="text-sm font-medium">Wallet handoff</h3>
						<div className="inline-flex rounded-lg border p-4">
							<QRCodeSVG
								bgColor="transparent"
								fgColor="currentColor"
								size={200}
								value={props.detail.qrPayload}
							/>
						</div>
						<Textarea
							label="Offer URI"
							readOnly
							rows={5}
							value={issuance.offerUri}
						/>
					</>
				)}
			</div>

			{/* Right column: status & claims */}
			<div className="space-y-6">
				<div className="space-y-3">
					<h3 className="text-sm font-medium">Status</h3>
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant={STATE_BADGE_VARIANTS[issuance.state]}>
							{ISSUANCE_STATE_LABELS[issuance.state]}
						</Badge>
						{showCredentialStatus ? (
							<Badge variant={statusVariant(issuance.status)}>
								{getTokenStatusLabel(issuance.status)}
							</Badge>
						) : null}
					</div>
					{!terminal && (
						<p className="text-sm text-muted-foreground">
							This view refreshes automatically while the wallet redeems the
							offer. Credential status is still managed from the overview page.
						</p>
					)}
				</div>

				<div className="space-y-2">
					<h3 className="text-sm font-medium">Claims</h3>
					<pre className="overflow-auto rounded-md border bg-muted p-4 font-mono text-xs">
						{JSON.stringify(issuance.claims, null, 2)}
					</pre>
				</div>

				{terminal && (
					<a
						href="/"
						className="mt-2 inline-flex items-center gap-1.5 rounded-md border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
					>
						<ArrowLeft className="h-3.5 w-3.5" />
						Back to overview
					</a>
				)}
			</div>
		</div>
	);
}

function RedeemedPresentation() {
	return (
		<div className="flex flex-col items-center justify-center rounded-lg border border-state-redeemed/20 bg-state-redeemed/5 px-6 py-10 text-center">
			<CheckCircle2 className="mb-3 h-10 w-10 text-state-redeemed" />
			<p className="text-sm font-medium">Credential redeemed</p>
			<p className="mt-1 max-w-xs text-xs text-muted-foreground">
				The wallet has successfully claimed this credential. The offer QR code
				is no longer valid.
			</p>
		</div>
	);
}

function ExpiredPresentation() {
	return (
		<div className="flex flex-col items-center justify-center rounded-lg border border-state-expired/20 bg-state-expired/5 px-6 py-10 text-center">
			<p className="text-sm font-medium">Offer expired</p>
			<p className="mt-1 max-w-xs text-xs text-muted-foreground">
				This credential offer was not redeemed in time and has expired.
			</p>
		</div>
	);
}

function FailedPresentation() {
	return (
		<div className="flex flex-col items-center justify-center rounded-lg border border-state-failed/20 bg-state-failed/5 px-6 py-10 text-center">
			<p className="text-sm font-medium">Redemption failed</p>
			<p className="mt-1 max-w-xs text-xs text-muted-foreground">
				Something went wrong while the wallet tried to redeem this credential.
			</p>
		</div>
	);
}
