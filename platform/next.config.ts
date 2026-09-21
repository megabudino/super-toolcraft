import path from "node:path";
import type { NextConfig } from "next";

const repoRoot = path.join(import.meta.dirname, "..");

const nextConfig: NextConfig = {
  outputFileTracingRoot: repoRoot,
  turbopack: { root: repoRoot },
  // App builds are served by an authenticated route handler, never from public/.
  outputFileTracingIncludes: {
    "/a/**": ["./.app-builds/**/*"],
    "/*": ["./.app-builds/manifest.json"],
  },
  poweredByHeader: false,
};

export default nextConfig;
