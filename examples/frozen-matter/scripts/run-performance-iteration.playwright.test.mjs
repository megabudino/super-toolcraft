import assert from "node:assert/strict";
import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import spawn from "cross-spawn";

import { installToolcraftPlaywrightTestShim } from "./playwright-test-shim-fixture.mjs";
import { installToolcraftRuntimeFixtureDependency } from "./run-browser-performance-test-helpers.mjs";

import {
  TOOLCRAFT_PERFORMANCE_RECEIPT_VERSION,
  collectToolcraftVerificationInputs,
  getToolcraftPerformanceBaselineReceiptPath,
  getToolcraftPerformanceReceiptPath,
} from "./toolcraft-verification-receipt.mjs";
import { createPerformanceEvidenceFixture } from "./toolcraft-verification-receipt-test-helpers.mjs";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.dirname(scriptsDir);

function writeExecutable(filePath, source) {
  writeFileSync(filePath, source);
  if (process.platform !== "win32") chmodSync(filePath, 0o755);
}

function createFixture() {
  const rootDir = mkdtempSync(path.join(tmpdir(), "toolcraft-real-playwright-"));
  const fixtureScriptsDir = path.join(rootDir, "scripts");
  const binDir = path.join(rootDir, "node_modules", ".bin");
  mkdirSync(path.join(rootDir, "src", "app"), { recursive: true });
  mkdirSync(path.join(rootDir, "src", "toolcraft"), { recursive: true });
  mkdirSync(path.join(rootDir, "e2e"), { recursive: true });
  mkdirSync(fixtureScriptsDir, { recursive: true });
  mkdirSync(binDir, { recursive: true });
  writeFileSync(path.join(rootDir, "src/app/app.ts"), "export const value = 1;\n");
  writeFileSync(
    path.join(rootDir, "src/toolcraft/.toolcraft-manifest.json"),
    '{"protectedFiles":{}}\n',
  );
  writeFileSync(
    path.join(rootDir, "src/app/app-performance-impact.json"),
    `${JSON.stringify({
      modules: [{ kind: "functional", path: "src/app/app.ts" }],
      version: 1,
    })}\n`,
  );
  for (const fileName of [
    "run-performance-iteration.mjs",
    "playwright-test-title-selection.mjs",
    "toolcraft-performance-receipt-policy.mjs",
    "toolcraft-performance-impact.mjs",
    "toolcraft-source-inventory.mjs",
    "toolcraft-source-ownership.mjs",
    "toolcraft-targeted-performance-report.mjs",
    "toolcraft-verification-inventory.mjs",
    "toolcraft-verification-receipt.mjs",
  ]) {
    copyFileSync(path.join(scriptsDir, fileName), path.join(fixtureScriptsDir, fileName));
  }
  for (const packageName of ["cross-spawn", "@playwright"]) {
    symlinkSync(
      realpathSync(path.join(projectDir, "node_modules", packageName)),
      path.join(rootDir, "node_modules", packageName),
      process.platform === "win32" ? "junction" : "dir",
    );
  }
  installToolcraftRuntimeFixtureDependency(rootDir);
  writeFileSync(
    path.join(rootDir, "playwright.config.mjs"),
    'export default { testDir: "./e2e" };\n',
  );
  writeFileSync(
    path.join(rootDir, "e2e/targeted.spec.mjs"),
    [
      'import { test } from "@playwright/test";',
      'test("browser: exact targeted run", () => {});',
      'test("prefix browser: exact targeted run", () => {});',
      "",
    ].join("\n"),
  );
  const realPlaywrightBin = path.join(
    projectDir,
    "node_modules/.bin",
    process.platform === "win32" ? "playwright.cmd" : "playwright",
  );
  installToolcraftPlaywrightTestShim({ realPlaywrightBin, rootDir });
  for (const binary of ["tsc", "vite"]) {
    writeExecutable(
      path.join(binDir, process.platform === "win32" ? `${binary}.cmd` : binary),
      process.platform === "win32"
        ? "@echo off\r\nexit /b 0\r\n"
        : "#!/usr/bin/env node\nprocess.exitCode = 0;\n",
    );
  }
  return rootDir;
}

async function writeBaseline(rootDir) {
  const inventory = await collectToolcraftVerificationInputs(rootDir);
  const receipt = {
    checkpointReason: "first-working-version",
    completedAt: "2026-07-14T00:00:00.000Z",
    files: inventory.entries,
    kind: "performance-checkpoint",
    performanceEvidence: createPerformanceEvidenceFixture(),
    runner: "protected-playwright",
    sourceHash: inventory.sourceHash,
    status: "passed",
    version: TOOLCRAFT_PERFORMANCE_RECEIPT_VERSION,
  };
  for (const receiptPath of [
    getToolcraftPerformanceBaselineReceiptPath(rootDir),
    getToolcraftPerformanceReceiptPath(rootDir),
  ]) {
    mkdirSync(path.dirname(receiptPath), { recursive: true });
    writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  }
}

test("targeted runner executes one exact test with a real unnamed project", async (t) => {
  const rootDir = createFixture();
  t.after(() => rmSync(rootDir, { force: true, recursive: true }));
  await writeBaseline(rootDir);
  writeFileSync(path.join(rootDir, "src/app/app.ts"), "export const value = 2;\n");
  const testName = "browser: exact targeted run";

  const result = spawn.sync(
    process.execPath,
    [
      path.join(rootDir, "scripts/run-performance-iteration.mjs"),
      "--tier=2",
      `--browser-test=${testName}`,
    ],
    { cwd: rootDir, encoding: "utf8", timeout: 10_000 },
  );

  assert.equal(result.signal, null);
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const receipt = JSON.parse(
    readFileSync(getToolcraftPerformanceReceiptPath(rootDir), "utf8"),
  );
  assert.equal(receipt.status, "passed-targeted");
  assert.deepEqual(receipt.verification.browserTests, [testName]);
});
