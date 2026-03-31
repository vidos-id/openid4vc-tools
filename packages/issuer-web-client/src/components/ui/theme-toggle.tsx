import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "../../lib/cn.ts";
import { useTheme } from "../../lib/theme.tsx";

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();

	return (
		<div className="inline-flex h-8 items-center rounded-md border p-0.5">
			<ToggleItem
				active={theme === "light"}
				onClick={() => setTheme("light")}
				label="Light"
			>
				<Sun className="h-3.5 w-3.5" />
			</ToggleItem>
			<ToggleItem
				active={theme === "system"}
				onClick={() => setTheme("system")}
				label="System"
			>
				<Monitor className="h-3.5 w-3.5" />
			</ToggleItem>
			<ToggleItem
				active={theme === "dark"}
				onClick={() => setTheme("dark")}
				label="Dark"
			>
				<Moon className="h-3.5 w-3.5" />
			</ToggleItem>
		</div>
	);
}

function ToggleItem(props: {
	active: boolean;
	onClick: () => void;
	label: string;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={props.onClick}
			title={props.label}
			className={cn(
				"inline-flex h-6 w-7 items-center justify-center rounded-sm transition-colors",
				props.active
					? "bg-accent text-accent-foreground"
					: "text-muted-foreground hover:text-foreground",
			)}
		>
			{props.children}
		</button>
	);
}
