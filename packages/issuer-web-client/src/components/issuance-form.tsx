import {
	ACTIVE_TOKEN_STATUS,
	REVOKED_TOKEN_STATUS,
	SUSPENDED_TOKEN_STATUS,
} from "@vidos-id/openid4vc-issuer-web-shared";
import { Button } from "./ui/button.tsx";
import { Textarea } from "./ui/textarea.tsx";

export function IssuanceForm(props: {
	name: string;
	vct: string;
	claims: string;
	status: 0 | 1 | 2;
	onClaimsChange: (value: string) => void;
	onStatusChange: (value: 0 | 1 | 2) => void;
	onSubmit: () => void;
}) {
	return (
		<form
			className="space-y-4"
			onSubmit={(event) => {
				event.preventDefault();
				props.onSubmit();
			}}
		>
			<div>
				<p className="text-sm font-medium">{props.name}</p>
				<p className="text-xs text-muted-foreground">
					Verifiable Credential Type (vct): {props.vct}
				</p>
			</div>
			<Textarea
				label="Claims to issue"
				rows={10}
				value={props.claims}
				onChange={(event) => props.onClaimsChange(event.target.value)}
			/>
			<div className="space-y-1.5">
				<label
					htmlFor="initial-status"
					className="text-sm font-medium leading-none"
				>
					Initial credential status
				</label>
				<select
					id="initial-status"
					value={String(props.status)}
					onChange={(event) =>
						props.onStatusChange(Number(event.target.value) as 0 | 1 | 2)
					}
					className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
				>
					<option value={String(ACTIVE_TOKEN_STATUS)}>Active</option>
					<option value={String(SUSPENDED_TOKEN_STATUS)}>Suspended</option>
					<option value={String(REVOKED_TOKEN_STATUS)}>Revoked</option>
				</select>
			</div>
			<Button type="submit">Create issuance offer</Button>
		</form>
	);
}
