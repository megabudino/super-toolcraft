import { randomUUID } from "node:crypto";
import { access, rm } from "node:fs/promises";
import path from "node:path";

import spawn from "cross-spawn";

import {
  collectToolcraftPlaywrightTestTitles,
  getToolcraftPlaywrightExactGrepPattern,
  resolveToolcraftPlaywrightTestTitles,
} from "./playwright-test-title-selection.mjs";
import { readToolcraftTargetedPerformanceReport } from "./toolcraft-targeted-performance-report.mjs";
import {
  assertToolcraftVerificationInputsUnchanged,
  collectToolcraftVerificationInputs,
  getToolcraftPerformanceIterationVerificationError,
} from "./toolcraft-verification-receipt.mjs";

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
    throw new Error(
      `Unsupported Toolcraft targeted verification argument: ${argument}`,
    );
  }
  return { ...values, verificationTier };
}

function getBinaryPath(projectDir, name) {
  return path.join(
    projectDir,
    "node_modules",
    ".bin",
    process.platform === "win32" ? `${name}.cmd` : name,
  );
}

function runBinary(binaryPath, args, { cwd, env = process.env } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(binaryPath, args, { cwd, env, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) {
        reject(
          new Error(`${path.basename(binaryPath)} exited after signal ${signal}.`),
        );
      } else if (code !== 0) {
        reject(
          new Error(`${path.basename(binaryPath)} exited with code ${code ?? 1}.`),
        );
      } else {
        resolve();
      }
    });
  });
}

function runBinaryCapture(binaryPath, args, { cwd, env = process.env } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(binaryPath, args, {
      cwd,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });
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

export async function executeToolcraftTargetedVerification({
  arguments_ = [],
  context,
  projectDir,
}) {
  const resolvedProjectDir = path.resolve(projectDir);
  const { browserTests, performanceTests, unitTests, verificationTier } =
    readArguments(arguments_);
  let performancePathIds = [];
  if (
    typeof verificationTier !== "number" ||
    !Number.isInteger(verificationTier) ||
    verificationTier < context.impact.minimumTier
  ) {
    throw new Error(
      `Toolcraft changed implementation requires verification Tier ${context.impact.minimumTier} or higher; received ${String(verificationTier)}.`,
    );
  }
  if (context.impact.requiresFunctionalBrowser && browserTests.length === 0) {
    throw new Error(
      "Toolcraft functional product changes require a targeted functional browser test.",
    );
  }
  if (
    context.impact.performancePassIds.length > 0 &&
    performanceTests.length === 0
  ) {
    throw new Error(
      "Toolcraft performance-impacting changes require targeted canonical browser performance tests.",
    );
  }

  const hasBrowserChecks =
    browserTests.length > 0 || performanceTests.length > 0;
  const checks = [
    "typecheck",
    ...(unitTests.length > 0 ? ["vitest-targeted"] : []),
    ...(hasBrowserChecks ? ["build"] : []),
    ...(browserTests.length > 0 ? ["playwright-targeted-functional"] : []),
    ...(performanceTests.length > 0
      ? ["playwright-targeted-performance"]
      : []),
  ];
  const protectedInventory = context.inventory;
  const playwrightBin = getBinaryPath(resolvedProjectDir, "playwright");
  const tscBin = getBinaryPath(resolvedProjectDir, "tsc");
  const viteBin = getBinaryPath(resolvedProjectDir, "vite");
  const vitestBin = getBinaryPath(resolvedProjectDir, "vitest");
  await Promise.all(
    [
      tscBin,
      ...(unitTests.length > 0 ? [vitestBin] : []),
      ...(hasBrowserChecks ? [viteBin, playwrightBin] : []),
    ].map((filePath) => access(filePath)),
  );

  let browserSelections = [];
  let performanceSelections = [];
  if (hasBrowserChecks) {
    const listOutput = await runBinaryCapture(
      playwrightBin,
      ["test", "--list", "--reporter=json"],
      { cwd: resolvedProjectDir },
    );
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

  await runBinary(tscBin, ["-p", "tsconfig.json", "--noEmit"], {
    cwd: resolvedProjectDir,
  });
  if (unitTests.length > 0) {
    await runBinary(vitestBin, ["run", ...unitTests], {
      cwd: resolvedProjectDir,
    });
  }
  if (hasBrowserChecks) {
    await runBinary(viteBin, ["build"], { cwd: resolvedProjectDir });
    await runBinary(playwrightBin, ["install", "chromium"], {
      cwd: resolvedProjectDir,
    });
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
        cwd: resolvedProjectDir,
        env: {
          ...process.env,
          TOOLCRAFT_BROWSER_SERVER_MODE: "preview",
          TOOLCRAFT_PERFORMANCE_FIXTURE_SELECTOR: "development",
        },
      },
    );
  }
  if (performanceTests.length > 0) {
    const targetedReportNonce = randomUUID();
    const targetedReportPath = path.join(
      resolvedProjectDir,
      ".toolcraft",
      "verification",
      `targeted-performance-${randomUUID()}.json`,
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
          cwd: resolvedProjectDir,
          env: {
            ...process.env,
            TOOLCRAFT_BROWSER_SERVER_MODE: "preview",
            TOOLCRAFT_PERFORMANCE_FIXTURE_SELECTOR: "development",
            TOOLCRAFT_TARGETED_PERFORMANCE_PASS_IDS: JSON.stringify(
              context.impact.performancePassIds,
            ),
            TOOLCRAFT_TARGETED_PERFORMANCE_REPORT_NONCE: targetedReportNonce,
            TOOLCRAFT_TARGETED_PERFORMANCE_REPORT_PATH: targetedReportPath,
            TOOLCRAFT_TARGETED_PERFORMANCE_REPORT_SOURCE_HASH:
              protectedInventory.sourceHash,
          },
        },
      );
      const targetedReport = await readToolcraftTargetedPerformanceReport(
        targetedReportPath,
        {
          nonce: targetedReportNonce,
          performancePassIds: context.impact.performancePassIds,
          sourceHash: protectedInventory.sourceHash,
          testNames: performanceSelections.map(({ leafTitle }) => leafTitle),
        },
      );
      performancePathIds = [...targetedReport.performancePathIds];
    } finally {
      await rm(targetedReportPath, { force: true });
    }
  }

  const verifiedInventory =
    await collectToolcraftVerificationInputs(resolvedProjectDir);
  assertToolcraftVerificationInputsUnchanged({
    baseline: protectedInventory,
    current: verifiedInventory,
    phase: "during targeted delivery verification",
  });
  const verification = {
    browserTests,
    checks,
    performancePassIds: [...context.impact.performancePassIds],
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
  return { verification, verificationTier, verifiedInventory };
}
