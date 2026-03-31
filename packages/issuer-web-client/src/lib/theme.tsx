import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContext {
	theme: Theme;
	setTheme: (theme: Theme) => void;
}

const themeContext = createContext<ThemeContext>({
	theme: "system",
	setTheme: () => undefined,
});

const STORAGE_KEY = "vidos-theme";

function applyTheme(theme: Theme) {
	const root = document.documentElement;
	if (theme === "system") {
		const prefersDark = window.matchMedia(
			"(prefers-color-scheme: dark)",
		).matches;
		root.classList.toggle("dark", prefersDark);
	} else {
		root.classList.toggle("dark", theme === "dark");
	}
}

export function ThemeProvider(props: { children: React.ReactNode }) {
	const [theme, setThemeState] = useState<Theme>(() => {
		if (typeof window === "undefined") return "system";
		return (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "system";
	});

	const setTheme = useCallback((next: Theme) => {
		localStorage.setItem(STORAGE_KEY, next);
		setThemeState(next);
		applyTheme(next);
	}, []);

	useEffect(() => {
		applyTheme(theme);

		if (theme !== "system") return;

		const media = window.matchMedia("(prefers-color-scheme: dark)");
		const handler = () => applyTheme("system");
		media.addEventListener("change", handler);
		return () => media.removeEventListener("change", handler);
	}, [theme]);

	return (
		<themeContext.Provider value={{ theme, setTheme }}>
			{props.children}
		</themeContext.Provider>
	);
}

export function useTheme() {
	return useContext(themeContext);
}
