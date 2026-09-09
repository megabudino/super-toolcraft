import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const rootDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const demoPath = "/demos/dither-lab";

test("keeps the generated Vite base dynamic and builds the canonical Vercel base", () => {
  const viteConfig = fs.readFileSync(
    path.join(rootDirectory, "vite.config.ts"),
    "utf8",
  );
  const router = fs.readFileSync(
    path.join(rootDirectory, "src/router.tsx"),
    "utf8",
  );
  const defaults = fs.readFileSync(
    path.join(rootDirectory, "src/app/dither-defaults.ts"),
    "utf8",
  );
  const vercelConfig = JSON.parse(
    fs.readFileSync(path.join(rootDirectory, "vercel.json"), "utf8"),
  );

  assert.doesNotMatch(
    viteConfig,
    /demoBasePath|\bbase:\s*["']\/demos\/dither\//,
  );
  assert.match(router, /import\.meta\.env\.BASE_URL/u);
  assert.match(router, /basepath:\s*routerBasePath/u);
  assert.match(defaults, /import\.meta\.env\.BASE_URL/u);
  assert.doesNotMatch(defaults, /dataUrl:\s*["']\/assets\//u);
  assert.equal(
    vercelConfig.buildCommand,
    "npm run build -- --base /demos/dither-lab/",
  );
});

test("rewrites the canonical demo path and generated assets", () => {
  const vercelConfigPath = path.join(rootDirectory, "vercel.json");

  assert.equal(fs.existsSync(vercelConfigPath), true, "Missing vercel.json.");

  const config = JSON.parse(fs.readFileSync(vercelConfigPath, "utf8"));

  assert.deepEqual(config.rewrites, [
    {
      source: `${demoPath}/assets/:path*`,
      destination: "/assets/:path*",
    },
    { source: demoPath, destination: "/" },
    { source: `${demoPath}/:path*`, destination: "/" },
  ]);
});
