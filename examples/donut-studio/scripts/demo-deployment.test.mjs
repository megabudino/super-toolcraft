import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const rootDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const demoPath = "/demos/donut-studio";

test("can evaluate Donut defaults outside the Vite runtime", async () => {
  const referenceModule = await import(
    new URL("../src/app/donut/donut-reference.ts", import.meta.url)
  );

  assert.equal(
    referenceModule.DONUT_ASSETS.model,
    "/donut-studio/donut-reference.glb",
  );
});

test("keeps the generated Vite base dynamic and builds the canonical Vercel base", () => {
  const viteConfig = fs.readFileSync(
    path.join(rootDirectory, "vite.config.ts"),
    "utf8",
  );
  const routerSource = fs.readFileSync(
    path.join(rootDirectory, "src/router.tsx"),
    "utf8",
  );
  const assetSource = fs.readFileSync(
    path.join(rootDirectory, "src/app/donut/donut-reference.ts"),
    "utf8",
  );
  const vercelConfig = JSON.parse(
    fs.readFileSync(path.join(rootDirectory, "vercel.json"), "utf8"),
  );

  assert.doesNotMatch(
    viteConfig,
    /demoBasePath|\bbase:\s*["']\/demos\/donut\//,
  );
  assert.match(routerSource, /import\.meta\.env\.BASE_URL/);
  assert.match(routerSource, /\bbasepath:\s*routerBasePath/);
  assert.match(assetSource, /import\.meta\.env(?:\?\.|\.)BASE_URL/);
  assert.doesNotMatch(assetSource, /:\s*["']\/donut\//);
  assert.equal(
    vercelConfig.buildCommand,
    "npm run build -- --base /demos/donut-studio/",
  );
});

test("rewrites the canonical demo path and generated and public assets", () => {
  const vercelConfigPath = path.join(rootDirectory, "vercel.json");

  assert.equal(fs.existsSync(vercelConfigPath), true, "Missing vercel.json.");

  const config = JSON.parse(fs.readFileSync(vercelConfigPath, "utf8"));

  assert.deepEqual(config.rewrites, [
    {
      source: `${demoPath}/assets/:path*`,
      destination: "/assets/:path*",
    },
    {
      source: `${demoPath}/donut-studio/:path*`,
      destination: "/donut-studio/:path*",
    },
    { source: demoPath, destination: "/" },
    { source: `${demoPath}/:path*`, destination: "/" },
  ]);
});
