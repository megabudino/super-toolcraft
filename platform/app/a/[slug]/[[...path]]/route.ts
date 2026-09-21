import fs from "node:fs/promises";
import path from "node:path";

import { APP_BUILDS_DIR, canAccessApp, ensureManifestSynced } from "@/lib/apps";
import { getCurrentUser } from "@/lib/auth/session";
import { contentTypeFor, isImmutableAsset, resolveInside } from "@/lib/static-files";
import { injectIntoHtml } from "@/lib/storage-shim";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SLUG_PATTERN = /^[a-z][a-z0-9-]{0,47}$/;

async function readFileOrNull(filePath: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(filePath);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT" || code === "EISDIR" || code === "ENOTDIR") return null;
    throw error;
  }
}

async function serveIndex(appRoot: string, slug: string): Promise<Response> {
  const html = await readFileOrNull(path.join(appRoot, "index.html"));
  if (!html) return new Response("App not found", { status: 404 });
  return new Response(injectIntoHtml(html.toString("utf8"), slug), {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

export async function GET(request: Request, { params }: { params: Promise<{ slug: string; path?: string[] }> }) {
  const { slug, path: segments = [] } = await params;
  if (!SLUG_PATTERN.test(slug)) return new Response("Not found", { status: 404 });

  const user = await getCurrentUser();
  if (!user) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", new URL(request.url).pathname);
    return Response.redirect(url, 302);
  }
  await ensureManifestSynced();
  if (!(await canAccessApp(user, slug))) return new Response("You do not have access to this app.", { status: 403 });

  const appRoot = path.join(APP_BUILDS_DIR, slug);
  if (segments.length === 0 || (segments.length === 1 && segments[0] === "index.html")) return serveIndex(appRoot, slug);

  const filePath = resolveInside(appRoot, segments);
  if (!filePath) return new Response("Not found", { status: 404 });

  const file = await readFileOrNull(filePath);
  if (!file) {
    // Missing file with an extension → real 404; otherwise it's a client-side route.
    if (path.extname(filePath)) return new Response("Not found", { status: 404 });
    return serveIndex(appRoot, slug);
  }

  const relativePath = segments.join("/");
  return new Response(new Uint8Array(file), {
    headers: {
      "content-type": contentTypeFor(filePath),
      "cache-control": isImmutableAsset(relativePath) ? "private, max-age=31536000, immutable" : "private, no-cache",
      "x-content-type-options": "nosniff",
    },
  });
}
