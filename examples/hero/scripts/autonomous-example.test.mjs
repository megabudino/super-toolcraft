import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

test("example exposes no Apply action", () => {
  assert.equal(read("src/app/app-schema.ts").includes("website.apply"), false);
});

test("Reset only dispatches the local runtime reset", () => {
  const source = read("src/app/hero-panel-actions.ts");
  assert.equal(/dispatch\(\{ type: ["']controls\.reset["'] \}\)/.test(source), true);
  assert.equal(/save.*Settings|isApply|reportProgress|appliedSettings/.test(source), false);
});

test("native scene assets honor the hosting base", () => {
  assert.equal(read("src/section/shared/config/base-path.ts").includes("import.meta.env.BASE_URL"), true);
  assert.equal(read("src/app/app-composition.tsx").includes("NativePreview"), true);
});

test("preview protocol has no external website or settings-save dependency", () => {
  const source = read("src/app/hero-preview-protocol.ts");
  assert.equal(/save-settings|save-result|http:\/\/localhost|WebsiteSettingsSave/.test(source), false);
});
