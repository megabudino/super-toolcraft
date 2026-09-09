#!/usr/bin/env node

import { randomUUID } from "node:crypto";
import { access, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import spawn from "cross-spawn";

import {
  TOOLCRAFT_PERFORMANCE_ITERATION_REASON,
  assertToolcraftVerificationInputsUnchanged,
  collectToolcraftVerificationInputs,
  getToolcraftPerformanceIterationContext,
  getToolcraftPerformanceIterationVerificationError,
  writeToolcraftPerformanceIteration,
} from "./toolcraft-verification-receipt.mjs";
import { readToolcraftTargetedPerformanceReport } from "./toolcraft-targeted-performance-report.mjs";
import {
  collectToolcraftPlaywrightTestTitles,
  getToolcraftPlaywrightExactGrepPattern,
  resolveToolcraftPlaywrightTestTitles,
} from "./playwright-test-title-selection.mjs";

const projectDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

function readArguments(arguments_) {
  const values = { browserTests: [], performanceTests: [], unitTests: [] };
  let verificationTier;
  for (const argument of arguments_) {
    if (argument === "--") continue;
    if (argument.startsWith("--tier=")) {
      if (verificationTier !== undefined) {
        throw new Error("Toolcraft targeted verification accepts one --tier.");
      }
      verificationTier = Number(argument.slice("--tier=".length));
      continue;
    }
    const testArgument = [
      ["--unit-test=", values.unitTests],
      ["--browser-test=", values.browserTests],
      ["--performance-test=", values.performanceTests],
    ].find(([prefix]) => argument.startsWith(prefix));
    if (testArgument) {
      const [prefix, target] = testArgument;
      target.push(argument.slice(prefix.length));
      continue;
    }
    throw new Error(`Unsupported Toolcraft targeted verification argument: ${argument}`);
  }
  return { ...values, verificationTier };
}

function getBinaryPath(name) {
  return path.join(
    projectDir,
    "node_modules",
    ".bin",
    process.platform === "win32" ? `${name}.cmd` : name,
  );
}

function runBinary(binaryPath, args, env = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawn(binaryPath, args, { env, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`${path.basename(binaryPath)} exited after signal ${signal}.`));
      } else if (code !== 0) {
        reject(new Error(`${path.basename(binaryPath)} exited with code ${code ?? 1}.`));
      } else {
        resolve();
      }
    });
  });
}

function runBinaryCapture(binaryPath, args, env = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawn(binaryPath, args, { env, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal || code !== 0) {
        reject(
          new Error(
            `${path.basename(binaryPath)} list failed${signal ? ` after signal ${signal}` : ` with code ${code ?? 1}`}\n${stdout}\n${stderr}`,
          ),
        );
      } else {
        resolve(stdout);
      }
    });
  });
}

const { browserTests, performanceTests, unitTests, verificationTier } =
  readArguments(process.argv.slice(2));
const iterationContext = await getToolcraftPerformanceIterationContext(projectDir);
let performancePathIds = [];
if (
  typeof verificationTier !== "number" ||
  !Number.isInteger(verificationTier) ||
  verificationTier < iterationContext.impact.minimumTier
) {
  throw new Error(
    `Toolcraft changed implementation requires verification Tier ${iterationContext.impact.minimumTier} or higher; received ${String(verificationTier)}.`,
  );
}
if (
  iterationContext.impact.requiresFunctionalBrowser &&
  browserTests.length === 0
) {
  throw new Error(
    "Toolcraft functional product changes require a targeted functional browser test.",
  );
}
if (
  iterationContext.impact.performancePassIds.length > 0 &&
  performanceTests.length === 0
) {
  throw new Error(
    "Toolcraft performance-impacting changes require targeted canonical browser performance tests.",
  );
}
const hasBrowserChecks = browserTests.length > 0 || performanceTests.length > 0;
const checks = [
  "typecheck",
  ...(unitTests.length > 0 ? ["vitest-targeted"] : []),
  ...(hasBrowserChecks ? ["build"] : []),
  ...(browserTests.length > 0 ? ["playwright-targeted-functional"] : []),
  ...(performanceTests.length > 0 ? ["playwright-targeted-performance"] : []),
];
const baselineInventory = iterationContext.inventory;
const playwrightBin = getBinaryPath("playwright");
const tscBin = getBinaryPath("tsc");
const viteBin = getBinaryPath("vite");
const vitestBin = getBinaryPath("vitest");
await Promise.all(
  [tscBin, ...(unitTests.length > 0 ? [vitestBin] : []), ...(hasBrowserChecks ? [viteBin, playwrightBin] : [])].map(
    (filePath) => access(filePath),
  ),
);

let browserSelections = [];
let performanceSelections = [];
if (hasBrowserChecks) {
  const listOutput = await runBinaryCapture(playwrightBin, [
    "test",
    "--list",
    "--reporter=json",
  ]);
  const availableTitles = collectToolcraftPlaywrightTestTitles(
    JSON.parse(listOutput),
  );
  browserSelections = resolveToolcraftPlaywrightTestTitles(
    availableTitles,
    browserTests,
  );
  performanceSelections = resolveToolcraftPlaywrightTestTitles(
    availableTitles,
    performanceTests,
  );
}

await runBinary(tscBin, ["-p", "tsconfig.json", "--noEmit"]);
if (unitTests.length > 0) {
  await runBinary(vitestBin, ["run", ...unitTests]);
}
if (hasBrowserChecks) {
  await runBinary(viteBin, ["build"]);
  await runBinary(playwrightBin, ["install", "chromium"]);
}
if (browserTests.length > 0) {
  await runBinary(
    playwrightBin,
    [
      "test",
      "--grep",
      getToolcraftPlaywrightExactGrepPattern(browserSelections),
      "--workers=1",
    ],
    {
      ...process.env,
      TOOLCRAFT_BROWSER_SERVER_MODE: "preview",
      TOOLCRAFT_PERFORMANCE_FIXTURE_SELECTOR: "development",
    },
  );
}
if (performanceTests.length > 0) {
  const targetedReportNonce = randomUUID();
  const targetedReportPath = path.join(
    projectDir,
    ".toolcraft",
    "verification",
    `targeted-performance-${process.pid}.json`,
  );
  await rm(targetedReportPath, { force: true });
  try {
    await runBinary(
      playwrightBin,
      [
        "test",
        "--grep",
        getToolcraftPlaywrightExactGrepPattern(performanceSelections),
        "--workers=1",
      ],
      {
        ...process.env,
        TOOLCRAFT_BROWSER_SERVER_MODE: "preview",
        TOOLCRAFT_PERFORMANCE_FIXTURE_SELECTOR: "development",
        TOOLCRAFT_TARGETED_PERFORMANCE_PASS_IDS: JSON.stringify(
          iterationContext.impact.performancePassIds,
        ),
        TOOLCRAFT_TARGETED_PERFORMANCE_REPORT_NONCE: targetedReportNonce,
        TOOLCRAFT_TARGETED_PERFORMANCE_REPORT_PATH: targetedReportPath,
        TOOLCRAFT_TARGETED_PERFORMANCE_REPORT_SOURCE_HASH:
          baselineInventory.sourceHash,
      },
    );
    const targetedReport = await readToolcraftTargetedPerformanceReport(
      targetedReportPath,
      {
        nonce: targetedReportNonce,
        performancePassIds: iterationContext.impact.performancePassIds,
        sourceHash: baselineInventory.sourceHash,
        testNames: performanceSelections.map(({ leafTitle }) => leafTitle),
      },
    );
    performancePathIds = [...targetedReport.performancePathIds];
  } finally {
    await rm(targetedReportPath, { force: true });
  }
}

const verifiedInventory = await collectToolcraftVerificationInputs(projectDir);
assertToolcraftVerificationInputsUnchanged({
  baseline: baselineInventory,
  current: verifiedInventory,
  phase: "during targeted post-first-working verification",
});
const verification = {
  browserTests,
  checks,
  performancePassIds: [...iterationContext.impact.performancePassIds],
  performancePathIds,
  performanceTests,
  runner: "protected-iteration",
  unitTests,
};
const verificationError = getToolcraftPerformanceIterationVerificationError(
  verification,
  verificationTier,
);
if (verificationError) throw new Error(verificationError);
await writeToolcraftPerformanceIteration({
  reasonCode: TOOLCRAFT_PERFORMANCE_ITERATION_REASON,
  rootDir: projectDir,
  verification,
  verificationTier,
});
console.log("Recorded current-source Toolcraft targeted performance iteration.");
