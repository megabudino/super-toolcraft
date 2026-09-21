import path from "node:path";

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".wasm": "application/wasm",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
  ".hdr": "application/octet-stream",
  ".ktx2": "image/ktx2",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
};

export function contentTypeFor(filePath: string): string {
  return CONTENT_TYPES[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

/** Resolves a request path inside `rootDir`, or returns null if it escapes it. */
export function resolveInside(rootDir: string, segments: string[]): string | null {
  const decoded = segments.map((segment) => {
    try {
      return decodeURIComponent(segment);
    } catch {
      return "\0";
    }
  });
  if (decoded.some((segment) => segment.includes("\0") || segment.includes("\\"))) return null;
  const resolved = path.resolve(rootDir, ...decoded);
  const root = path.resolve(rootDir);
  return resolved === root || resolved.startsWith(root + path.sep) ? resolved : null;
}

/** Vite emits content-hashed file names under assets/. */
export function isImmutableAsset(relativePath: string): boolean {
  return /(^|\/)assets\/.+[-.][A-Za-z0-9_-]{8,}\.[a-z0-9]+$/i.test(relativePath);
}
