import assert from "node:assert/strict";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { installToolcraftPlaywrightTestShim } from "./playwright-test-shim-fixture.mjs";
import {
  TOOLCRAFT_PERFORMANCE_SMOKE_TEST_NAME,
  getToolcraftPerformanceSmokeEvidenceError,
} from "./toolcraft-performance-smoke-evidence.mjs";
import { runToolcraftPerformanceSmoke } from "./toolcraft-performance-smoke-runner.mjs";
import { collectToolcraftVerificationInputs } from "./toolcraft-verification-inventory.mjs";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.dirname(scriptsDir);

function writeExecutable(filePath, source) {
  writeFileSync(filePath, source);
  if (process.platform !== "win32") chmodSync(filePath, 0o755);
}

function createFixture({ exitCode = 0, mutateSource = false } = {}) {
  const rootDir = mkdtempSync(path.join(tmpdir(), "toolcraft-smoke-runner-"));
  const sourcePath = path.join(rootDir, "src", "app.ts");
  const capturePath = path.join(rootDir, ".toolcraft", "smoke-command.json");
  const fakePlaywrightPath = path.join(
    rootDir,
    "node_modules",
    ".toolcraft-playwright-test-shim",
    "fake-playwright.mjs",
  );
  mkdirSync(path.dirname(sourcePath), { recursive: true });
  mkdirSync(path.dirname(fakePlaywrightPath), { recursive: true });
  mkdirSync(path.join(rootDir, "node_modules"), { recursive: true });
  writeFileSync(sourcePath, "export const value = 1;\n");
  symlinkSync(
    realpathSync(path.join(projectDir, "node_modules", "cross-spawn")),
    path.join(rootDir, "node_modules", "cross-spawn"),
    process.platform === "win32" ? "junction" : "dir",
  );
  writeExecutable(
    fakePlaywrightPath,
    [
      "#!/usr/bin/env node",
      'import { mkdirSync, writeFileSync } from "node:fs";',
      'import path from "node:path";',
      `const capturePath = ${JSON.stringify(capturePath)};`,
      `const sourcePath = ${JSON.stringify(sourcePath)};`,
      "mkdirSync(path.dirname(capturePath), { recursive: true });",
      ...(mutateSource
        ? ['writeFileSync(sourcePath, "export const value = 2;\\n");']
        : []),
      "writeFileSync(capturePath, JSON.stringify({",
      "  args: process.argv.slice(2),",
      "  fixtureSelector: process.env.TOOLCRAFT_PERFORMANCE_FIXTURE_SELECTOR,",
      "  serverMode: process.env.TOOLCRAFT_BROWSER_SERVER_MODE,",
      "}));",
      `process.exitCode = ${exitCode};`,
      "",
    ].join("\n"),
  );
  const shim = installToolcraftPlaywrightTestShim({
    realPlaywrightBin: fakePlaywrightPath,
    rootDir,
  });
  return { capturePath, rootDir, shim, sourcePath };
}

function readEvents(eventsPath) {
  return readFileSync(eventsPath, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function writeEvidenceSentinels(rootDir) {
  const directory = path.join(rootDir, ".toolcraft", "verification");
  const sentinels = {
    "checkpoint.json": "checkpoint sentinel\n",
    "performance-report.json": "report sentinel\n",
  };
  mkdirSync(directory, { recursive: true });
  for (const [fileName, contents] of Object.entries(sentinels)) {
    writeFileSync(path.join(directory, fileName), contents);
  }
  return { directory, sentinels };
}

function assertSentinelsUnchanged({ directory, sentinels }) {
  assert.deepEqual(readdirSync(directory).sort(), Object.keys(sentinels).sort());
  for (const [fileName, contents] of Object.entries(sentinels)) {
    assert.equal(readFileSync(path.join(directory, fileName), "utf8"), contents);
  }
}

test("protected smoke runner executes only the exact development smoke against preview", async (t) => {
  const fixture = createFixture();
  t.after(() => rmSync(fixture.rootDir, { force: true, recursive: true }));
  const sentinels = writeEvidenceSentinels(fixture.rootDir);
  const baselineInventory = await collectToolcraftVerificationInputs(
    fixture.rootDir,
  );

  const evidence = await runToolcraftPerformanceSmoke({
    baselineInventory,
    projectDir: fixture.rootDir,
  });

  assert.equal(getToolcraftPerformanceSmokeEvidenceError(evidence), undefined);
  assert.equal(evidence.sourceHash, baselineInventory.sourceHash);
  assert.deepEqual(JSON.parse(readFileSync(fixture.capturePath, "utf8")), {
    args: [
      "test",
      "e2e/app-performance-smoke.spec.ts",
      "--grep",
      `${TOOLCRAFT_PERFORMANCE_SMOKE_TEST_NAME}$`,
      "--workers=1",
    ],
    fixtureSelector: "development",
    serverMode: "preview",
  });
  assert.deepEqual(readEvents(fixture.shim.eventsPath), [
    {
      args: [
        "test",
        "e2e/app-performance-smoke.spec.ts",
        "--grep",
        `${TOOLCRAFT_PERFORMANCE_SMOKE_TEST_NAME}$`,
        "--workers=1",
      ],
      event: "delegated",
      fixtureSelector: "development",
    },
  ]);
  assertSentinelsUnchanged(sentinels);
});

test("failed Playwright produces no smoke evidence or performance artifacts", async (t) => {
  const fixture = createFixture({ exitCode: 1 });
  t.after(() => rmSync(fixture.rootDir, { force: true, recursive: true }));
  const sentinels = writeEvidenceSentinels(fixture.rootDir);
  const baselineInventory = await collectToolcraftVerificationInputs(
    fixture.rootDir,
  );

  await assert.rejects(
    runToolcraftPerformanceSmoke({
      baselineInventory,
      projectDir: fixture.rootDir,
    }),
    /playwright.*code 1/iu,
  );
  assertSentinelsUnchanged(sentinels);
});

test("source mutation during Playwright rejects smoke evidence", async (t) => {
  const fixture = createFixture({ mutateSource: true });
  t.after(() => rmSync(fixture.rootDir, { force: true, recursive: true }));
  const sentinels = writeEvidenceSentinels(fixture.rootDir);
  const baselineInventory = await collectToolcraftVerificationInputs(
    fixture.rootDir,
  );

  await assert.rejects(
    runToolcraftPerformanceSmoke({
      baselineInventory,
      projectDir: fixture.rootDir,
    }),
    /verification inputs changed during the protected performance smoke/iu,
  );
  assertSentinelsUnchanged(sentinels);
});
