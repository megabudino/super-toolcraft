import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const rootDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const demoPath = "/demos/spatial-gallery";

test("keeps the generated Vite base dynamic and builds the canonical Vercel base", () => {
  const viteConfig = fs.readFileSync(
    path.join(rootDirectory, "vite.config.ts"),
    "utf8",
  );
  const routerSource = fs.readFileSync(
    path.join(rootDirectory, "src/router.tsx"),
    "utf8",
  );
  const schemaSource = fs.readFileSync(
    path.join(rootDirectory, "src/app/app-schema.ts"),
    "utf8",
  );
  const vercelConfig = JSON.parse(
    fs.readFileSync(path.join(rootDirectory, "vercel.json"), "utf8"),
  );

  assert.doesNotMatch(
    viteConfig,
    /demoBasePath|\bbase:\s*["']\/demos\/spatial-gallery\//,
  );
  assert.match(routerSource, /import\.meta\.env\.BASE_URL/);
  assert.match(routerSource, /\bbasepath:\s*routerBasePath/);
  assert.match(
    schemaSource,
    /resolveGalleryPresetUrl\(\s*import\.meta\.env\.BASE_URL/,
  );
  assert.doesNotMatch(
    schemaSource,
    /dataUrl:\s*["']\/gallery-presets\//,
  );
  assert.equal(
    vercelConfig.buildCommand,
    "npm run build -- --base /demos/spatial-gallery/",
  );
});

test("rewrites the canonical demo path and generated and preset assets", () => {
  const vercelConfigPath = path.join(rootDirectory, "vercel.json");

  assert.equal(fs.existsSync(vercelConfigPath), true, "Missing vercel.json.");

  const config = JSON.parse(fs.readFileSync(vercelConfigPath, "utf8"));

  assert.deepEqual(config.rewrites, [
    {
      source: `${demoPath}/assets/:path*`,
      destination: "/assets/:path*",
    },
    {
      source: `${demoPath}/gallery-presets/:path*`,
      destination: "/gallery-presets/:path*",
    },
    { source: demoPath, destination: "/" },
    { source: `${demoPath}/:path*`, destination: "/" },
  ]);
});
