"use server";

import { redirect } from "next/navigation";

import { hashPassword, validatePasswordStrength, verifyPassword } from "@/lib/auth/password";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { createSession, getCurrentUser, setSessionCookie } from "@/lib/auth/session";
import { isValidEmail, normalizeEmail } from "@/lib/auth/tokens";
import { clientIp, findUserByEmail } from "@/lib/auth/users";
import type { FormState } from "@/lib/form-state";
import { findValidInvite, redeemInvite } from "@/lib/invites";

const INVALID = { error: "This invite is invalid or has expired." };

function destination(workspaceSlug: string | undefined) {
  return workspaceSlug ? `/w/${workspaceSlug}` : "/";
}

/** Logged-in user joins with the current account. */
export async function joinWithCurrentAccount(_state: FormState, formData: FormData): Promise<FormState> {
  const token = String(formData.get("token") ?? "");
  const user = await getCurrentUser();
  const found = await findValidInvite(token);
  if (!user || !found) return INVALID;
  if (found.invite.email && found.invite.email !== user.email) return { error: `This invite is for ${found.invite.email}. Sign out and use that account.` };
  if (!(await redeemInvite(found.invite.id, user.id))) return INVALID;
  redirect(destination(found.workspace?.slug));
}

/** mode=new creates an account; mode=existing signs in with an existing one. Both redeem the invite. */
export async function acceptInvite(_state: FormState, formData: FormData): Promise<FormState> {
  const token = String(formData.get("token") ?? "");
  const mode = formData.get("mode") === "existing" ? "existing" : "new";
  const found = await findValidInvite(token);
  if (!found) return INVALID;
  if (!(await consumeRateLimit(`invite:${await clientIp()}`, 20))) return { error: "Too many attempts. Try again later." };

  const email = normalizeEmail(found.invite.email ?? String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const values = { email, name, mode };
  if (!isValidEmail(email)) return { error: "Enter a valid email.", values };

  const existing = await findUserByEmail(email);
  let userId: string;
  let newUser: { email: string; name: string; passwordHash: string } | undefined;

  if (mode === "existing") {
    if (!existing || existing.disabledAt || !(await verifyPassword(password, existing.passwordHash))) {
      return { error: "Incorrect email or password.", values };
    }
    userId = existing.id;
  } else {
    if (existing) return { error: "An account with this email already exists. Choose “I have an account” to sign in.", values: { ...values, mode: "existing" } };
    if (!name) return { error: "Enter your name.", values };
    const weak = validatePasswordStrength(password);
    if (weak) return { error: weak, values };
    userId = crypto.randomUUID();
    newUser = { email, name, passwordHash: await hashPassword(password) };
  }

  if (!(await redeemInvite(found.invite.id, userId, newUser))) return INVALID;
  await setSessionCookie(await createSession(userId));
  redirect(destination(found.workspace?.slug));
}
