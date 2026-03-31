import inquirer from "inquirer";

export type Choice<T extends string> = {
	label: string;
	value: T;
};

export class PromptSession {
	close() {
		return;
	}

	async text(
		label: string,
		options?: {
			defaultValue?: string;
			allowEmpty?: boolean;
			password?: boolean;
		},
	) {
		const { value } = await inquirer.prompt<{ value: string }>([
			{
				type: options?.password ? "password" : "input",
				name: "value",
				message: label,
				default: options?.defaultValue,
				mask: options?.password ? "*" : undefined,
				validate: (input: string) => {
					if (
						input.trim() ||
						options?.allowEmpty ||
						options?.defaultValue !== undefined
					) {
						return true;
					}
					return "A value is required";
				},
			},
		]);
		return value.trim() || options?.defaultValue || "";
	}

	async choose<T extends string>(label: string, choices: Choice<T>[]) {
		const { value } = await inquirer.prompt<{ value: T }>([
			{
				type: "list",
				name: "value",
				message: label,
				choices: choices.map((choice) => ({
					name: choice.label,
					value: choice.value,
				})),
			},
		]);
		return value;
	}

	async confirm(label: string, defaultValue = true) {
		const { value } = await inquirer.prompt<{ value: boolean }>([
			{
				type: "confirm",
				name: "value",
				message: label,
				default: defaultValue,
			},
		]);
		return value;
	}
}
