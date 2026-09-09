import assert from "node:assert/strict";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import spawn from "cross-spawn";

import { installToolcraftPlaywrightTestShim } from "./playwright-test-shim-fixture.mjs";
import { runToolcraftPerformanceIteration } from "./run-performance-iteration.mjs";
import {
  copyLocalModuleClosure,
  installToolcraftRuntimeFixtureDependency,
  projectDir,
} from "./run-browser-performance-test-helpers.mjs";

import {
  readToolcraftCheckpointBundle,
} from "./toolcraft-checkpoint-bundle.mjs";
import { writePassedCheckpointFixture } from "./toolcraft-verification-receipt-test-helpers.mjs";

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
  copyLocalModuleClosure(fixtureScriptsDir, ["run-performance-iteration.mjs"]);
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
  await writePassedCheckpointFixture(rootDir);
}

test("compatibility command rejects a functional-only iteration", async (t) => {
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

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /requires at least one exact --performance-test selector/iu,
  );
  const bundle = (await readToolcraftCheckpointBundle(rootDir)).bundle;
  assert.equal(bundle.delivery.mode, "ordinary");
  assert.equal(bundle.currentPerformance.kind, "performance-checkpoint");
});

test("imported compatibility command uses the same performance-only boundary", async (t) => {
  const rootDir = createFixture();
  t.after(() => rmSync(rootDir, { force: true, recursive: true }));
  await writeBaseline(rootDir);
  writeFileSync(path.join(rootDir, "src/app/app.ts"), "export const value = 2;\n");
  const testName = "browser: exact targeted run";

  await assert.rejects(
    runToolcraftPerformanceIteration({
      arguments_: ["--tier=2", `--browser-test=${testName}`],
      projectDir: rootDir,
    }),
    /requires at least one exact --performance-test selector/iu,
  );
});
