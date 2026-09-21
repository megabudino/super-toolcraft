import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Each test file gets its own throwaway SQLite database and app-builds folder.
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "platform-test-"));
process.env.DATABASE_URL = `file:${path.join(dir, "test.db")}`;
process.env.PLATFORM_APP_BUILDS_DIR = path.join(dir, "app-builds");
fs.mkdirSync(process.env.PLATFORM_APP_BUILDS_DIR, { recursive: true });

const { createClient } = await import("@libsql/client");
const { drizzle } = await import("drizzle-orm/libsql");
const { migrate } = await import("drizzle-orm/libsql/migrator");
const client = createClient({ url: process.env.DATABASE_URL });
await migrate(drizzle(client), { migrationsFolder: path.join(import.meta.dirname, "../db/migrations") });
client.close();
