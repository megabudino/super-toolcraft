"use server";

import { sql } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db, schema } from "@/db/client";
import type { FormState } from "@/lib/form-state";
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { isValidEmail, normalizeEmail, safeEqual } from "@/lib/auth/tokens";
import { clientIp, hasAnyUser } from "@/lib/auth/users";
import { SLUG_PATTERN } from "@/lib/slug";


export async function setupAction(_state: FormState, formData: FormData): Promise<FormState> {
  const expected = process.env.SETUP_TOKEN;
  if (!expected || (await hasAnyUser())) return { error: "Setup is not available." };
  if (!(await consumeRateLimit(`setup:${await clientIp()}`, 10))) return { error: "Too many attempts." };
  if (!safeEqual(String(formData.get("token") ?? ""), expected)) return { error: "Invalid setup token." };

  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const workspaceName = String(formData.get("workspaceName") ?? "").trim();
  const workspaceSlug = String(formData.get("workspaceSlug") ?? "").trim().toLowerCase();
  const values = { name, email, workspaceName, workspaceSlug };
  if (!isValidEmail(email)) return { error: "Invalid email.", values };
  if (!name) return { error: "Enter your name.", values };
  const weak = validatePasswordStrength(password);
  if (weak) return { error: weak, values };
  if (workspaceSlug && !SLUG_PATTERN.test(workspaceSlug)) return { error: "Workspace URL: lowercase letters, digits and dashes.", values };

  const userId = crypto.randomUUID();
  const passwordHash = await hashPassword(password);
  // Atomic: only inserts while the users table is still empty (guards concurrent setups).
  const result = await db.run(sql`
    INSERT INTO users (id, email, name, password_hash, is_admin)
    SELECT ${userId}, ${email}, ${name}, ${passwordHash}, 1
    WHERE NOT EXISTS (SELECT 1 FROM users)
  `);
  if (result.rowsAffected !== 1) return { error: "Setup has already been completed." };

  if (workspaceSlug) {
    const workspaceId = crypto.randomUUID();
    await db
      .insert(schema.workspaces)
      .values({ id: workspaceId, slug: workspaceSlug, name: workspaceName || workspaceSlug })
      .onConflictDoNothing({ target: schema.workspaces.slug });
  }

  await setSessionCookie(await createSession(userId));
  redirect(workspaceSlug ? `/w/${workspaceSlug}` : "/");
}
