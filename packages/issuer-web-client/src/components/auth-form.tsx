import { Button } from "./ui/button.tsx";
import { Input } from "./ui/input.tsx";

type AuthMode = "signin" | "signup";

export function AuthForm(props: {
	mode: AuthMode;
	name: string;
	password: string;
	confirmPassword?: string;
	message: string | null;
	disabled?: boolean;
	alternateHref?: "/signin" | "/signup";
	alternateLabel?: string;
	submitLabel?: string;
	onNameChange: (value: string) => void;
	onPasswordChange: (value: string) => void;
	onConfirmPasswordChange?: (value: string) => void;
	onSubmit: () => void;
}) {
	const disabled = props.disabled ?? false;

	return (
		<form
			className="space-y-4"
			onSubmit={(event) => {
				event.preventDefault();
				if (!disabled) {
					props.onSubmit();
				}
			}}
		>
			<Input
				label="Username"
				value={props.name}
				autoComplete="username"
				disabled={disabled}
				onChange={(event) => props.onNameChange(event.target.value)}
			/>
			<Input
				label="Password"
				type="password"
				value={props.password}
				disabled={disabled}
				autoComplete={
					props.mode === "signup" ? "new-password" : "current-password"
				}
				onChange={(event) => props.onPasswordChange(event.target.value)}
			/>
			{props.mode === "signup" ? (
				<Input
					label="Confirm password"
					type="password"
					value={props.confirmPassword ?? ""}
					autoComplete="new-password"
					disabled={disabled}
					onChange={(event) =>
						props.onConfirmPasswordChange?.(event.target.value)
					}
				/>
			) : null}
			<div className="flex items-center justify-between pt-2">
				<Button type="submit" disabled={disabled}>
					{disabled
						? "Saving..."
						: (props.submitLabel ??
							(props.mode === "signup" ? "Create account" : "Sign in"))}
				</Button>
				{props.alternateHref && props.alternateLabel ? (
					<a
						href={props.alternateHref}
						className="text-sm text-muted-foreground underline-offset-4 hover:underline"
					>
						{props.alternateLabel}
					</a>
				) : null}
			</div>
			{props.message ? (
				<p className="text-sm text-destructive">{props.message}</p>
			) : null}
		</form>
	);
}
