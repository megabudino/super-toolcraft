import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "./schema";

function createDb() {
  const client = createClient({
    url: process.env.DATABASE_URL ?? "file:local.db",
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  });
  return drizzle(client, { schema });
}

const globalForDb = globalThis as unknown as { platformDb?: ReturnType<typeof createDb> };

export const db = globalForDb.platformDb ?? createDb();
if (process.env.NODE_ENV !== "production") globalForDb.platformDb = db;

export { schema };
