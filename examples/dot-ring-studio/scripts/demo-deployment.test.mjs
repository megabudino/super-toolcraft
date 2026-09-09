import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const rootDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const demoPath = "/demos/dot-ring-studio";

test("keeps the generated Vite base dynamic and builds the canonical Vercel base", () => {
  const viteConfig = fs.readFileSync(
    path.join(rootDirectory, "vite.config.ts"),
    "utf8",
  );
  const routerSource = fs.readFileSync(
    path.join(rootDirectory, "src/router.tsx"),
    "utf8",
  );
  const vercelConfig = JSON.parse(
    fs.readFileSync(path.join(rootDirectory, "vercel.json"), "utf8"),
  );

  assert.doesNotMatch(
    viteConfig,
    /demoBasePath|\bbase:\s*["']\/demos\/dot-ring-studio\//,
  );
  assert.match(routerSource, /import\.meta\.env\.BASE_URL/);
  assert.match(routerSource, /\bbasepath:\s*routerBasePath/);
  assert.equal(
    vercelConfig.buildCommand,
    "npm run build -- --base /demos/dot-ring-studio/",
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
