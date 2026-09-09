import assert from "node:assert/strict";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import spawn from "cross-spawn";

import { installToolcraftPlaywrightTestShim } from "./playwright-test-shim-fixture.mjs";
import { getToolcraftCheckpointBundlePath } from "./toolcraft-checkpoint-paths.mjs";
import { writePassedCheckpointFixture as writeCanonicalCheckpointFixture } from "./toolcraft-verification-receipt-test-helpers.mjs";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
export const projectDir = path.dirname(scriptsDir);
export const runnerPath = path.join(scriptsDir, "run-browser-performance.mjs");
export const iterationRunnerFileName = "run-performance-iteration.mjs";

export function writePerformanceIterationWorklog(
  rootDir,
  requestId = "1",
  testNames = "browser perf: focused renderer path",
  tier = 3,
) {
  const selectors = Array.isArray(testNames) ? testNames : [testNames];
  const command =
    `pnpm verify:delivery -- --reason=performance-iteration --tier=${tier} ` +
    selectors.map((testName) => `--performance-test="${testName}"`).join(" ");
  const docsDir = path.join(rootDir, "docs", "toolcraft");
  mkdirSync(docsDir, { recursive: true });
  writeFileSync(
    path.join(docsDir, "agent-worklog.md"),
    `# Agent Worklog

## Decision Trail

### Performance iteration ${requestId}
- Request: The app is still slow in performance request ${requestId}.
- Performance intent: performance-iteration — Request evidence: "The app is still slow in performance request ${requestId}."
- Verification: ${command}.

## Verification
- Run: ${command}
`,
  );
}

export function copyLocalModuleClosure(destinationDir, entryFileNames) {
  const pending = [...entryFileNames];
  const copied = new Set();
  while (pending.length > 0) {
    const fileName = pending.pop();
    if (copied.has(fileName)) continue;
    const sourcePath = path.join(scriptsDir, fileName);
    const source = readFileSync(sourcePath, "utf8");
    copyFileSync(sourcePath, path.join(destinationDir, fileName));
    copied.add(fileName);
    for (const match of source.matchAll(/["']\.\/(.+?\.mjs)["']/gu)) {
      pending.push(match[1]);
    }
  }
}

export function createFullPerformanceFixture() {
  const rootDir = createProtectedRunnerFixture();
  const fixtureScriptsDir = path.join(rootDir, "scripts");
  writeFileSync(
    path.join(fixtureScriptsDir, "check-toolcraft-integrity.mjs"),
    "process.exitCode = 0;\n",
  );
  writeFileSync(
    path.join(fixtureScriptsDir, "noop.mjs"),
    "process.exitCode = 0;\n",
  );
  writeFileSync(
    path.join(rootDir, "package.json"),
    `${JSON.stringify({
      name: "toolcraft-full-performance-fixture",
      private: true,
      scripts: {
        "ai:check": "node scripts/noop.mjs",
        build: "node scripts/noop.mjs",
        "test:delivery": "node scripts/noop.mjs",
      },
    })}\n`,
  );
  return rootDir;
}

export function installToolcraftRuntimeFixtureDependency(rootDir) {
  const generatedRuntimeDir = path.join(
    projectDir,
    "src",
    "toolcraft",
    "runtime",
  );
  if (existsSync(generatedRuntimeDir)) {
    const relativeManifestPath = path.join(
      "performance",
      "profile-catalog-manifest.mjs",
    );
    const fixtureRuntimeDir = path.join(rootDir, "src", "toolcraft", "runtime");
    mkdirSync(path.join(fixtureRuntimeDir, "performance"), { recursive: true });
    copyFileSync(
      path.join(generatedRuntimeDir, relativeManifestPath),
      path.join(fixtureRuntimeDir, relativeManifestPath),
    );
    return;
  }

  mkdirSync(path.join(rootDir, "node_modules", "@repo"), { recursive: true });
  symlinkSync(
    realpathSync(path.join(projectDir, "..", "packages", "toolcraft-runtime")),
    path.join(rootDir, "node_modules", "@repo", "toolcraft-runtime"),
    process.platform === "win32" ? "junction" : "dir",
  );
}

export function createVerificationFixture(prefix) {
  const rootDir = mkdtempSync(path.join(tmpdir(), `toolcraft-${prefix}-`));
  mkdirSync(path.join(rootDir, "src", "app"), { recursive: true });
  mkdirSync(path.join(rootDir, "src", "toolcraft"), { recursive: true });
  writeFileSync(
    path.join(rootDir, "src", "app.ts"),
    "export const value = 1;\n",
  );
  writeFileSync(
    path.join(rootDir, "src", "app", "app-performance-impact.json"),
    `${JSON.stringify({
      modules: [{ kind: "functional", path: "src/app.ts" }],
      version: 1,
    })}\n`,
  );
  writeFileSync(
    path.join(rootDir, "src", "toolcraft", ".toolcraft-manifest.json"),
    '{"protectedFiles":{}}\n',
  );
  return rootDir;
}

export function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

export function readCheckpointBundle(rootDir) {
  return readJson(getToolcraftCheckpointBundlePath(rootDir));
}

export function readPlaywrightShimEvents(rootDir) {
  const eventsPath = path.join(
    rootDir,
    "node_modules/.toolcraft-playwright-test-shim/events.jsonl",
  );
  return readFileSync(eventsPath, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

export function createIterationVerification(verificationTier) {
  const emptyResolvedEvidence = {
    browserTestEvidence: [],
    browserTestTitles: [],
    performanceTestEvidence: [],
    performanceTestTitles: [],
    performanceComparison: null,
    targetedPerformanceReport: null,
    targetedPerformanceReportHash: null,
  };
  if (verificationTier === 0) {
    return {
      browserTests: [],
      ...emptyResolvedEvidence,
      checks: ["typecheck"],
      performancePassIds: [],
      performancePathIds: [],
      performanceTests: [],
      runner: "protected-iteration",
      unitTests: [],
    };
  }
  return {
    browserTests: ["browser: focused acceptance"],
    browserTestEvidence: [
      {
        fullTitle: "app-controls.spec.ts › browser: focused acceptance",
        leafTitle: "browser: focused acceptance",
      },
    ],
    browserTestTitles: ["app-controls.spec.ts › browser: focused acceptance"],
    checks: ["typecheck", "build", "playwright-targeted-functional"],
    performancePassIds: [],
    performanceComparison: null,
    performancePathIds: [],
    performanceTests: [],
    performanceTestEvidence: [],
    performanceTestTitles: [],
    runner: "protected-iteration",
    targetedPerformanceReport: null,
    targetedPerformanceReportHash: null,
    unitTests: [],
  };
}

export async function writePassedCheckpointFixture(rootDir) {
  return writeCanonicalCheckpointFixture(rootDir);
}

export function createProtectedRunnerFixture(
  playwrightListReport = {
    errors: [],
    suites: [
      {
        title: "app-controls.spec.ts",
        specs: [
          {
            title: "browser perf: focused renderer path",
            tags: [],
            tests: [{ projectName: "" }],
          },
        ],
      },
    ],
  },
) {
  const rootDir = createVerificationFixture("protected-runner");
  writeFileSync(
    path.join(rootDir, "src", "app", "app-performance-impact.json"),
    `${JSON.stringify({
      modules: [
        { kind: "performance", passIds: ["composite"], path: "src/app.ts" },
      ],
      version: 1,
    })}\n`,
  );
  const fixtureScriptsDir = path.join(rootDir, "scripts");
  const binDir = path.join(rootDir, "node_modules", ".bin");
  mkdirSync(fixtureScriptsDir, { recursive: true });
  mkdirSync(binDir, { recursive: true });
  copyLocalModuleClosure(fixtureScriptsDir, [
    "run-browser-performance.mjs",
    iterationRunnerFileName,
  ]);
  writeFileSync(
    path.join(fixtureScriptsDir, "check-toolcraft-integrity.mjs"),
    "process.exitCode = 0;\n",
  );
  writeFileSync(
    path.join(fixtureScriptsDir, "noop.mjs"),
    "process.exitCode = 0;\n",
  );
  writeFileSync(
    path.join(rootDir, "package.json"),
    `${JSON.stringify({
      name: "toolcraft-protected-runner-fixture",
      private: true,
      scripts: {
        "ai:check": "node scripts/noop.mjs",
        "docs:check": "node scripts/noop.mjs",
        "test:delivery": "node scripts/noop.mjs",
      },
    })}\n`,
  );
  symlinkSync(
    realpathSync(path.join(projectDir, "node_modules", "cross-spawn")),
    path.join(rootDir, "node_modules", "cross-spawn"),
    process.platform === "win32" ? "junction" : "dir",
  );
  installToolcraftRuntimeFixtureDependency(rootDir);
  installToolcraftPlaywrightTestShim({
    listReport: playwrightListReport,
    rootDir,
  });
  const performanceTestName = (playwrightListReport.suites ?? [])
    .flatMap((suite) => suite.specs ?? [])
    .map((spec) => spec.title)
    .find((title) => title.startsWith("browser perf:"));
  if (performanceTestName) {
    writePerformanceIterationWorklog(rootDir, "1", performanceTestName);
  }
  for (const binary of ["tsc", "vite"]) {
    const binaryPath = path.join(
      binDir,
      process.platform === "win32" ? `${binary}.cmd` : binary,
    );
    writeFileSync(
      binaryPath,
      process.platform === "win32"
        ? "@echo off\r\nexit /b 0\r\n"
        : "#!/usr/bin/env node\nprocess.exitCode = 0;\n",
    );
    if (process.platform !== "win32") chmodSync(binaryPath, 0o755);
  }
  return rootDir;
}

export function invokeRunner(rootDir, fileName, args = [], env = process.env) {
  return spawn.sync(
    process.execPath,
    [path.join(rootDir, "scripts", fileName), ...args],
    { cwd: rootDir, encoding: "utf8", env, timeout: 10_000 },
  );
}

export function runProtectedRunner(rootDir, args = []) {
  const result = invokeRunner(rootDir, "run-browser-performance.mjs", args);
  assert.equal(result.signal, null);
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
}
