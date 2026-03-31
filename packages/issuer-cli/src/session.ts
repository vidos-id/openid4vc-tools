import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { verbose } from "@vidos-id/cli-common";
import type { BaseCliOptions, StoredSession } from "./schemas.ts";
import { sessionFileSchema } from "./schemas.ts";

const DEFAULT_SERVER_URL = "http://localhost:3001";

export function resolveDefaultSessionFilePath() {
	return join(homedir(), ".config", "vidos-id", "issuer-cli-session.json");
}

export function resolveSessionFilePath(options?: BaseCliOptions) {
	return options?.sessionFile ?? resolveDefaultSessionFilePath();
}

export async function readStoredSession(
	options?: BaseCliOptions,
): Promise<StoredSession | null> {
	const filePath = resolveSessionFilePath(options);
	try {
		const raw = JSON.parse(await readFile(filePath, "utf8")) as unknown;
		return sessionFileSchema.parse(raw);
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") {
			return null;
		}
		throw error;
	}
}

export async function writeStoredSession(
	session: StoredSession,
	options?: BaseCliOptions,
) {
	const filePath = resolveSessionFilePath(options);
	await mkdir(dirname(filePath), { recursive: true });
	await writeFile(filePath, `${JSON.stringify(session, null, 2)}\n`, "utf8");
	verbose(`Saved issuer-cli session to ${filePath}`);
	return filePath;
}

export async function clearStoredSession(options?: BaseCliOptions) {
	const filePath = resolveSessionFilePath(options);
	await rm(filePath, { force: true });
	verbose(`Cleared issuer-cli session at ${filePath}`);
	return filePath;
}

export async function requireStoredSession(options?: BaseCliOptions) {
	const session = await readStoredSession(options);
	if (!session) {
		throw new Error(
			"No saved issuer session. Run `issuer-cli auth signin` or `issuer-cli interactive` first.",
		);
	}
	return session;
}

export function resolveServerUrl(
	options?: BaseCliOptions,
	session?: StoredSession,
) {
	return options?.serverUrl ?? session?.serverUrl ?? DEFAULT_SERVER_URL;
}

export function assertSessionMatchesServerUrl(
	serverUrl: string,
	session: StoredSession,
) {
	if (session.serverUrl !== serverUrl) {
		throw new Error(
			`Saved session targets ${session.serverUrl}. Sign in again for ${serverUrl} or omit --server-url.`,
		);
	}
}
