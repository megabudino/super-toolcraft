import { NextResponse, type NextRequest } from "next/server";

import { LAST_WORKSPACE_COOKIE, SESSION_COOKIE, SESSION_DURATION_MS } from "@/lib/auth/constants";

const PUBLIC_PATHS = ["/login", "/setup", "/invite/"];

// Cheap gate only: real validation happens in pages, actions and the /a route handler.
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const isPublic = PUBLIC_PATHS.some((prefix) => pathname === prefix || pathname.startsWith(prefix));

  if (!token && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();
  // Sliding cookie expiry on navigations; the database expiry is renewed in validateSessionToken.
  if (token && request.method === "GET" && request.headers.get("sec-fetch-dest") === "document") {
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION_MS / 1000,
    });
  }
  // Remember the last workspace so "/" (and the in-app back button) return to it.
  const workspace = pathname.match(/^\/w\/([a-z][a-z0-9-]{0,47})(?:\/|$)/)?.[1];
  if (token && workspace) {
    response.cookies.set(LAST_WORKSPACE_COOKIE, workspace, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
