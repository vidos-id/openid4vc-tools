import { Database } from "bun:sqlite";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import * as schema from "./schema.ts";

const migrationsFolder = fileURLToPath(
	new URL("../../drizzle", import.meta.url),
);

export async function createDatabase(databasePath: string) {
	const dbDir = path.dirname(databasePath);
	if (dbDir !== ".") {
		await mkdir(dbDir, { recursive: true });
	}

	const sqlite = new Database(databasePath);
	sqlite.run("PRAGMA foreign_keys = ON");
	const db = drizzle(sqlite, { schema });
	migrate(db, { migrationsFolder });
	return db;
}

export type IssuerWebDatabase = Awaited<ReturnType<typeof createDatabase>>;
export { schema };
