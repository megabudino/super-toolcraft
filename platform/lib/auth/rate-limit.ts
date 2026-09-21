import { eq, lt, sql } from "drizzle-orm";

import { db, schema } from "@/db/client";

const WINDOW_MS = 15 * 60 * 1000;

/** Fixed-window limiter stored in the database (works across serverless instances). */
export async function consumeRateLimit(key: string, limit: number): Promise<boolean> {
  const now = Date.now();
  const windowFloor = new Date(now - WINDOW_MS);
  const [row] = await db
    .insert(schema.loginAttempts)
    .values({ key, count: 1, windowStart: new Date(now) })
    .onConflictDoUpdate({
      target: schema.loginAttempts.key,
      set: {
        count: sql`CASE WHEN ${schema.loginAttempts.windowStart} < ${windowFloor.getTime()} THEN 1 ELSE ${schema.loginAttempts.count} + 1 END`,
        windowStart: sql`CASE WHEN ${schema.loginAttempts.windowStart} < ${windowFloor.getTime()} THEN ${now} ELSE ${schema.loginAttempts.windowStart} END`,
      },
    })
    .returning({ count: schema.loginAttempts.count });
  if (Math.random() < 0.02) {
    await db.delete(schema.loginAttempts).where(lt(schema.loginAttempts.windowStart, windowFloor));
  }
  return (row?.count ?? 1) <= limit;
}

export async function resetRateLimit(key: string): Promise<void> {
  await db.delete(schema.loginAttempts).where(eq(schema.loginAttempts.key, key));
}
