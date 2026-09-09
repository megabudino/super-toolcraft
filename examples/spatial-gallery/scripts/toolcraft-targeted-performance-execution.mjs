import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import path from "node:path";

import { getToolcraftPlaywrightExactGrepPattern } from "./playwright-test-title-selection.mjs";
import {
  createToolcraftTargetedPerformanceReportHash,
  readToolcraftTargetedPerformanceReport,
} from "./toolcraft-targeted-performance-report.mjs";
import { runToolcraftTargetedBinary } from "./toolcraft-targeted-process-adapter.mjs";

export async function executeToolcraftTargetedPerformanceVerification({
  fixtureResolutionMode,
  performancePassIds,
  performanceSelections,
  performanceTestEvidence,
  performanceTestNames,
  playwrightBin,
  projectDir,
  requestAuthorityHash = null,
  sourceHash,
}) {
  if (!["default", "strict-development"].includes(fixtureResolutionMode)) {
    throw new Error(
      "Toolcraft targeted performance fixture resolution mode is unsupported.",
    );
  }
  const targetedReportNonce = randomUUID();
  const targetedReportPath = path.join(
    projectDir,
    ".toolcraft",
    "verification",
    `targeted-performance-${randomUUID()}.json`,
  );
  await rm(targetedReportPath, { force: true });
  try {
    await runToolcraftTargetedBinary(
      playwrightBin,
      [
        "test",
        "--grep",
        getToolcraftPlaywrightExactGrepPattern(performanceSelections),
        "--workers=1",
      ],
      {
        cwd: projectDir,
        env: {
          ...process.env,
          TOOLCRAFT_BROWSER_SERVER_MODE: "preview",
          TOOLCRAFT_PERFORMANCE_FIXTURE_RESOLUTION_MODE:
            fixtureResolutionMode,
          TOOLCRAFT_PERFORMANCE_FIXTURE_SELECTOR: "development",
          TOOLCRAFT_TARGETED_PERFORMANCE_PASS_IDS:
            JSON.stringify(performancePassIds),
          TOOLCRAFT_TARGETED_PERFORMANCE_REPORT_NONCE: targetedReportNonce,
          TOOLCRAFT_TARGETED_PERFORMANCE_REPORT_PATH: targetedReportPath,
          TOOLCRAFT_TARGETED_PERFORMANCE_REPORT_SOURCE_HASH: sourceHash,
          ...(requestAuthorityHash
            ? {
                TOOLCRAFT_PERFORMANCE_REQUEST_AUTHORITY_HASH:
                  requestAuthorityHash,
              }
            : {}),
        },
      },
    );
    const targetedPerformanceReport =
      await readToolcraftTargetedPerformanceReport(targetedReportPath, {
        fixtureResolutionMode,
        fixtureSelector: "development",
        nonce: targetedReportNonce,
        performancePassIds,
        requestAuthorityHash,
        sourceHash,
        testNames: performanceTestNames,
        version: 3,
      });
    return {
      performancePathIds: [...targetedPerformanceReport.performancePathIds],
      targetedPerformanceReport,
      targetedPerformanceReportHash:
        createToolcraftTargetedPerformanceReportHash({
          report: targetedPerformanceReport,
          testEvidence: performanceTestEvidence,
        }),
    };
  } finally {
    await rm(targetedReportPath, { force: true });
  }
}
