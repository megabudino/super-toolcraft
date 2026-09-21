// Applies pending migrations from db/migrations. Runs locally (pnpm db:migrate) and on every deploy.
import path from "node:path";

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

const url = process.env.DATABASE_URL ?? "file:local.db";
if (process.env.VERCEL && url.startsWith("file:")) {
  console.error("db:migrate: DATABASE_URL is not set on Vercel. Add the Turso URL and token to the project env vars.");
  process.exit(1);
}

const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN || undefined });
await migrate(drizzle(client), { migrationsFolder: path.join(import.meta.dirname, "migrations") });
client.close();
console.log(`db:migrate: up to date (${url.replace(/\?.*$/, "")}).`);
