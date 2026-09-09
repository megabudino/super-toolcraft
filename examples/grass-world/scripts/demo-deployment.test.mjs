import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const demoPath = "/demos/grass-world";

test("keeps generated Vite config intact and builds the canonical base through Vercel", () => {
  const viteConfig = fs.readFileSync(path.join(rootDirectory, "vite.config.ts"), "utf8");
  const vercelConfig = JSON.parse(
    fs.readFileSync(path.join(rootDirectory, "vercel.json"), "utf8"),
  );

  assert.doesNotMatch(viteConfig, /demoBasePath|\bbase:\s*["']\/demos\/grass\//);
  assert.equal(vercelConfig.buildCommand, "npm run build -- --base /demos/grass-world/");
});

test("rewrites the canonical demo path in the standalone Vercel project", () => {
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
