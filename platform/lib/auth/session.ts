import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { cache } from "react";

import { db, schema } from "@/db/client";
import type { User } from "@/db/schema";

import { SESSION_COOKIE, SESSION_DURATION_MS, SESSION_RENEW_THRESHOLD_MS } from "./constants";
import { generateToken, hashToken } from "./tokens";

export type SessionUser = Pick<User, "id" | "email" | "name" | "isAdmin">;

export async function createSession(userId: string): Promise<string> {
  const token = generateToken();
  await db.insert(schema.sessions).values({
    id: hashToken(token),
    userId,
    expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
  });
  return token;
}

export async function validateSessionToken(token: string): Promise<SessionUser | null> {
  const id = hashToken(token);
  const [row] = await db
    .select({ session: schema.sessions, user: schema.users })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
    .where(eq(schema.sessions.id, id))
    .limit(1);
  if (!row) return null;

  const now = Date.now();
  if (row.session.expiresAt.getTime() <= now || row.user.disabledAt) {
    await db.delete(schema.sessions).where(eq(schema.sessions.id, id));
    return null;
  }
  if (row.session.expiresAt.getTime() - now < SESSION_RENEW_THRESHOLD_MS) {
    await db
      .update(schema.sessions)
      .set({ expiresAt: new Date(now + SESSION_DURATION_MS) })
      .where(eq(schema.sessions.id, id));
  }
  const { id: userId, email, name, isAdmin } = row.user;
  return { id: userId, email, name, isAdmin };
}

export async function invalidateSessionToken(token: string): Promise<void> {
  await db.delete(schema.sessions).where(eq(schema.sessions.id, hashToken(token)));
}

export async function invalidateUserSessions(userId: string): Promise<void> {
  await db.delete(schema.sessions).where(eq(schema.sessions.userId, userId));
}

/** Only callable from server actions and route handlers (it writes a cookie). */
export async function setSessionCookie(token: string): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? validateSessionToken(token) : null;
});
