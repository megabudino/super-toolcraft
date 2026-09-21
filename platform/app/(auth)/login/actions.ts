"use server";

import { redirect } from "next/navigation";

import type { FormState } from "@/lib/form-state";
import { verifyPassword } from "@/lib/auth/password";
import { consumeRateLimit, resetRateLimit } from "@/lib/auth/rate-limit";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { normalizeEmail } from "@/lib/auth/tokens";
import { clientIp, findUserByEmail, safeNextPath } from "@/lib/auth/users";

// Compared against when the email does not exist, so timing does not reveal accounts.
const DUMMY_HASH = "scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";

export async function loginAction(_state: FormState, formData: FormData): Promise<FormState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(formData.get("next"));
  const values = { email };
  if (!email || !password) return { error: "Enter your email and password.", values };

  const ip = await clientIp();
  const allowed = (await consumeRateLimit(`login:${email}:${ip}`, 8)) && (await consumeRateLimit(`login-ip:${ip}`, 40));
  if (!allowed) return { error: "Too many attempts. Try again in a few minutes.", values };

  const user = await findUserByEmail(email);
  const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid || user.disabledAt) return { error: "Incorrect email or password.", values };

  await resetRateLimit(`login:${email}:${ip}`);
  await setSessionCookie(await createSession(user.id));
  redirect(next);
}
