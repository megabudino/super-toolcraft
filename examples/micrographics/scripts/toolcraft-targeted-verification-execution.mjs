import { access } from "node:fs/promises";
import path from "node:path";

import {
  collectToolcraftPlaywrightTestTitles,
  getToolcraftPlaywrightExactGrepPattern,
  resolveToolcraftPlaywrightTestTitles,
} from "./playwright-test-title-selection.mjs";
import {
  executeToolcraftTargetedPerformanceVerification,
} from "./toolcraft-targeted-performance-execution.mjs";
import {
  getToolcraftTargetedBinaryPath,
  runToolcraftTargetedBinary,
  runToolcraftTargetedBinaryCapture,
} from "./toolcraft-targeted-process-adapter.mjs";
import {
  createToolcraftCanonicalTestEvidence,
  getToolcraftCanonicalLeafTitles,
  readToolcraftTargetedVerificationArguments,
  sortToolcraftPlaywrightSelections,
} from "./toolcraft-targeted-verification-selection.mjs";
import {
  assertToolcraftVerificationInputsUnchanged,
  collectToolcraftVerificationInputs,
  getToolcraftPerformanceIterationVerificationError,
} from "./toolcraft-verification-receipt.mjs";
import { createToolcraftPerformanceIterationComparison } from "./toolcraft-performance-iteration-comparison.mjs";

export async function executeToolcraftTargetedVerificationCore({
  arguments_ = [],
  comparisonPerformanceReport = null,
  comparisonPerformanceReportHash = null,
  context,
  fixtureResolutionMode = "default",
  projectDir,
  requestAuthorityHash = null,
}) {
  const resolvedProjectDir = path.resolve(projectDir);
  const {
    browserTests: requestedBrowserTests,
    performanceTests: requestedPerformanceTests,
    unitTests,
    verificationTier,
  } = readToolcraftTargetedVerificationArguments(arguments_);
  let performancePathIds = [];
  let targetedPerformanceReport = null;
  let targetedPerformanceReportHash = null;
  let performanceComparison = null;
  if (
    typeof verificationTier !== "number" ||
    !Number.isInteger(verificationTier) ||
    verificationTier < context.impact.minimumTier
  ) {
    throw new Error(
      `Toolcraft changed implementation requires verification Tier ${context.impact.minimumTier} or higher; received ${String(verificationTier)}.`,
    );
  }
  if (
    context.impact.requiresFunctionalBrowser &&
    requestedBrowserTests.length === 0
  ) {
    throw new Error(
      "Toolcraft functional product changes require a targeted functional browser test.",
    );
  }
  if (
    context.impact.performancePassIds.length > 0 &&
    requestedPerformanceTests.length === 0
  ) {
    throw new Error(
      "Toolcraft performance-impacting changes require targeted canonical browser performance tests.",
    );
  }

  const hasBrowserChecks =
    requestedBrowserTests.length > 0 || requestedPerformanceTests.length > 0;
  const checks = [
    "typecheck",
    ...(unitTests.length > 0 ? ["vitest-targeted"] : []),
    ...(hasBrowserChecks ? ["build"] : []),
    ...(requestedBrowserTests.length > 0
      ? ["playwright-targeted-functional"]
      : []),
    ...(requestedPerformanceTests.length > 0
      ? ["playwright-targeted-performance"]
      : []),
  ];
  const protectedInventory = context.inventory;
  const playwrightBin = getToolcraftTargetedBinaryPath(resolvedProjectDir, "playwright");
  const tscBin = getToolcraftTargetedBinaryPath(resolvedProjectDir, "tsc");
  const viteBin = getToolcraftTargetedBinaryPath(resolvedProjectDir, "vite");
  const vitestBin = getToolcraftTargetedBinaryPath(resolvedProjectDir, "vitest");
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
    const listOutput = await runToolcraftTargetedBinaryCapture(
      playwrightBin,
      ["test", "--list", "--reporter=json"],
      { cwd: resolvedProjectDir },
    );
    const availableTitles = collectToolcraftPlaywrightTestTitles(
      JSON.parse(listOutput),
    );
    browserSelections = sortToolcraftPlaywrightSelections(
      resolveToolcraftPlaywrightTestTitles(
        availableTitles,
        requestedBrowserTests,
      ),
    );
    performanceSelections = sortToolcraftPlaywrightSelections(
      resolveToolcraftPlaywrightTestTitles(
        availableTitles,
        requestedPerformanceTests,
      ),
    );
  }
  const browserTestEvidence = createToolcraftCanonicalTestEvidence(
    browserSelections,
  );
  const performanceTestEvidence = createToolcraftCanonicalTestEvidence(
    performanceSelections,
  );

  await runToolcraftTargetedBinary(tscBin, ["-p", "tsconfig.json", "--noEmit"], {
    cwd: resolvedProjectDir,
  });
  if (unitTests.length > 0) {
    await runToolcraftTargetedBinary(vitestBin, ["run", ...unitTests], {
      cwd: resolvedProjectDir,
    });
  }
  if (hasBrowserChecks) {
    await runToolcraftTargetedBinary(viteBin, ["build"], {
      cwd: resolvedProjectDir,
    });
    await runToolcraftTargetedBinary(playwrightBin, ["install", "chromium"], {
      cwd: resolvedProjectDir,
    });
  }
  if (requestedBrowserTests.length > 0) {
    await runToolcraftTargetedBinary(
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
  if (requestedPerformanceTests.length > 0) {
    const performanceResult =
      await executeToolcraftTargetedPerformanceVerification({
        fixtureResolutionMode,
        performancePassIds: context.impact.performancePassIds,
        performanceSelections,
        performanceTestEvidence,
        performanceTestNames:
          getToolcraftCanonicalLeafTitles(performanceTestEvidence),
        playwrightBin,
        projectDir: resolvedProjectDir,
        requestAuthorityHash,
        sourceHash: protectedInventory.sourceHash,
      });
    performancePathIds = performanceResult.performancePathIds;
    targetedPerformanceReport = performanceResult.targetedPerformanceReport;
    targetedPerformanceReportHash =
      performanceResult.targetedPerformanceReportHash;
    if (requestAuthorityHash) {
      performanceComparison = createToolcraftPerformanceIterationComparison({
        currentReport: targetedPerformanceReport,
        previousReport: comparisonPerformanceReport,
        previousReportHash: comparisonPerformanceReportHash,
      });
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
    browserTestEvidence,
    browserTests: getToolcraftCanonicalLeafTitles(browserTestEvidence),
    browserTestTitles: browserTestEvidence.map(({ fullTitle }) => fullTitle),
    checks,
    performancePassIds: [...context.impact.performancePassIds],
    performanceComparison,
    performancePathIds,
    performanceTestEvidence,
    performanceTests: getToolcraftCanonicalLeafTitles(performanceTestEvidence),
    performanceTestTitles: performanceTestEvidence.map(
      ({ fullTitle }) => fullTitle,
    ),
    runner: "protected-iteration",
    targetedPerformanceReport,
    targetedPerformanceReportHash,
    unitTests,
  };
  const verificationError = getToolcraftPerformanceIterationVerificationError(
    verification,
    verificationTier,
    {
      requireResolvedEvidence: true,
      sourceHash: protectedInventory.sourceHash,
    },
  );
  if (verificationError) throw new Error(verificationError);
  return {
    verification,
    verificationTier,
    verifiedInventory,
  };
}
