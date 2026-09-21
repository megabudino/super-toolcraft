import { count, eq } from "drizzle-orm";
import { headers } from "next/headers";

import { db, schema } from "@/db/client";

export async function hasAnyUser(): Promise<boolean> {
  const [row] = await db.select({ value: count() }).from(schema.users);
  return (row?.value ?? 0) > 0;
}

export async function findUserByEmail(email: string) {
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  return user;
}

export async function clientIp(): Promise<string> {
  const list = await headers();
  return list.get("x-forwarded-for")?.split(",")[0]?.trim() || list.get("x-real-ip") || "unknown";
}

/** Only same-site relative paths are allowed as post-login destinations. */
export function safeNextPath(value: unknown): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\") ? value : "/";
}
