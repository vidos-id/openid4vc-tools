import { Button } from "./ui/button.tsx";
import { Input } from "./ui/input.tsx";
import { Textarea } from "./ui/textarea.tsx";

export function TemplateForm(props: {
	name: string;
	vct: string;
	claims: string;
	onNameChange: (value: string) => void;
	onVctChange: (value: string) => void;
	onClaimsChange: (value: string) => void;
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
			<div className="grid gap-4 sm:grid-cols-2">
				<Input
					label="Name"
					placeholder="e.g. Employee Badge"
					value={props.name}
					onChange={(event) => props.onNameChange(event.target.value)}
				/>
				<Input
					label="Verifiable Credential Type (vct)"
					placeholder="e.g. EmployeeBadge"
					value={props.vct}
					onChange={(event) => props.onVctChange(event.target.value)}
				/>
			</div>
			<Textarea
				label="Default claims (JSON)"
				rows={8}
				value={props.claims}
				onChange={(event) => props.onClaimsChange(event.target.value)}
			/>
			<Button type="submit">Create template</Button>
		</form>
	);
}
