import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";

declare const __CLI_VERSION__: string | undefined;

export async function readPackageVersion(
	packageJsonPath: string,
): Promise<string> {
	try {
		const content = JSON.parse(
			await readFile(packageJsonPath, "utf8"),
		) as Record<string, unknown>;
		return typeof content.version === "string" ? content.version : "0.0.0";
	} catch {
		return "0.0.0";
	}
}

export async function resolveCliVersion(
	packageJsonPath: string,
): Promise<string> {
	if (typeof __CLI_VERSION__ === "string" && __CLI_VERSION__.length > 0) {
		return __CLI_VERSION__;
	}

	return readPackageVersion(packageJsonPath);
}

/**
 * Resolve the package.json path relative to the caller's directory.
 * Pass `import.meta.url` from the entry point.
 */
export function resolvePackageJsonPath(importMetaUrl: string): string {
	const dir = dirname(new URL(importMetaUrl).pathname);
	return join(dir, "..", "package.json");
}
