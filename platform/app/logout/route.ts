import { cookies } from "next/headers";

import { SESSION_COOKIE } from "@/lib/auth/constants";
import { invalidateSessionToken } from "@/lib/auth/session";
import { safeNextPath } from "@/lib/auth/users";

export async function POST(request: Request) {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await invalidateSessionToken(token);
  store.delete(SESSION_COOKIE);
  const next = safeNextPath((await request.formData().catch(() => null))?.get("next"));
  return Response.redirect(new URL(next === "/" ? "/login" : next, request.url), 303);
}
