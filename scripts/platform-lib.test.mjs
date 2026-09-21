import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { parseArgs, readAppIdentity, readPlatformConfig, SLUG_PATTERN, toTitle, validateApps } from "./platform-lib.mjs";
import { resolveTemplate } from "./new-app.mjs";

function makeApp(root, slug, { id = slug, platform } = {}) {
  const dir = path.join(root, "apps", slug);
  fs.mkdirSync(path.join(dir, "src/app"), { recursive: true });
  fs.writeFileSync(path.join(dir, "package.json"), "{}");
  fs.writeFileSync(path.join(dir, "src/app/app-identity.ts"), `export const appIdentity = {\n  id: "${id}",\n  title: "T",\n} as const;\n`);
  if (platform) fs.writeFileSync(path.join(dir, "platform.json"), JSON.stringify(platform));
  return dir;
}

test("parseArgs handles positionals, repeated and boolean options", () => {
  const { positionals, options } = parseArgs(["acme", "--workspace", "a", "--workspace=b", "--dry-run", "--title", "X Y"], {
    multiple: ["workspace"],
    boolean: ["dry-run"],
  });
  assert.deepEqual(positionals, ["acme"]);
  assert.deepEqual(options, { workspace: ["a", "b"], "dry-run": true, title: "X Y" });
});

test("slug rules and titles", () => {
  assert.ok(SLUG_PATTERN.test("acme-configurator"));
  assert.ok(!SLUG_PATTERN.test("Acme"));
  assert.ok(!SLUG_PATTERN.test("../x"));
  assert.equal(toTitle("acme-configurator"), "Acme Configurator");
});

test("reads identity and platform config, validating workspaces", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "platform-lib-"));
  const dir = makeApp(root, "acme", { platform: { title: "Acme", workspaces: ["acme"] } });
  assert.equal(readAppIdentity(dir).id, "acme");
  assert.deepEqual(readPlatformConfig(dir, "acme"), { title: "Acme", description: "", workspaces: ["acme"] });
  const bad = makeApp(root, "bad", { platform: { workspaces: ["Not Valid"] } });
  assert.throws(() => readPlatformConfig(bad, "bad"), /invalid workspace/);
});

test("validateApps warns on duplicate identities and errors on bad config", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "platform-lib-"));
  makeApp(root, "one", { id: "neon-globe-2" });
  makeApp(root, "two", { id: "neon-globe-2" });
  let result = validateApps(path.join(root, "apps"));
  assert.equal(result.errors.length, 0);
  assert.equal(result.warnings.length, 1);
  makeApp(root, "three", { platform: { workspaces: [42] } });
  result = validateApps(path.join(root, "apps"));
  assert.equal(result.errors.length, 1);
});

test("resolveTemplate finds examples and apps, rejects unknown", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "platform-lib-"));
  fs.mkdirSync(path.join(root, "examples/neon-globe"), { recursive: true });
  fs.writeFileSync(path.join(root, "examples/neon-globe/package.json"), "{}");
  assert.equal(resolveTemplate(undefined, root), undefined);
  assert.equal(resolveTemplate("starter", root), undefined);
  assert.equal(resolveTemplate("neon-globe", root), path.join(root, "examples/neon-globe"));
  assert.throws(() => resolveTemplate("missing", root), /not found/);
});
