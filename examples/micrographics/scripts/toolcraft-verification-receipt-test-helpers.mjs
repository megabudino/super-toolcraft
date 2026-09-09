import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  createToolcraftCheckpointBundle,
  writeToolcraftCheckpointBundle,
} from "./toolcraft-checkpoint-bundle.mjs";
import { getToolcraftLegacyCheckpointReceiptPaths } from "./toolcraft-checkpoint-paths.mjs";
import {
  TOOLCRAFT_DELIVERY_RECEIPT_VERSION,
  TOOLCRAFT_PROTOTYPE_DELIVERY_CHECKS,
} from "./toolcraft-delivery-receipt.mjs";
import {
  TOOLCRAFT_PERFORMANCE_RECEIPT_VERSION,
  collectToolcraftVerificationInputs,
} from "./toolcraft-verification-receipt-core.mjs";
import {
  createToolcraftTargetedPerformanceReport,
  createToolcraftTargetedPerformanceReportHash,
} from "./toolcraft-targeted-performance-report.mjs";

export async function createReceiptFixture() {
  const rootDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "toolcraft-receipt-"),
  );
  await fs.mkdir(path.join(rootDir, "src", "app"), { recursive: true });
  await fs.mkdir(path.join(rootDir, "e2e"), { recursive: true });
  await fs.writeFile(
    path.join(rootDir, "src", "app", "app-schema.ts"),
    'export const schema = { mode: "initial" };\n',
  );
  await fs.writeFile(
    path.join(rootDir, "src", "app", "app-performance-impact.json"),
    `${JSON.stringify(
      {
        modules: [{ kind: "functional", path: "src/app/app-schema.ts" }],
        version: 1,
      },
      null,
      2,
    )}\n`,
  );
  await fs.writeFile(
    path.join(rootDir, "e2e", "app-performance.spec.ts"),
    'export const scenario = "heavy";\n',
  );
  await fs.writeFile(
    path.join(rootDir, "package.json"),
    JSON.stringify({ name: "receipt-fixture", private: true }),
  );
  return rootDir;
}

export function createTargetedMeasurementFixture(pathIds) {
  const metrics = {
    droppedFrameCount: 0,
    droppedFrameRatio: 0,
    durationMs: 10,
    frameGapP50Ms: 10,
    frameGapP95Ms: 16,
    frameGapP99Ms: 16,
    longTaskCount: 0,
    longTaskMaxMs: 0,
    maxFrameGapMs: 16,
    sampleCount: 3,
  };
  return pathIds.flatMap((pathId) =>
    ["cold", "warm", "sustained"].map((phase) => ({
      evidenceType: "performance-measurement-metrics",
      kind: "interaction",
      metrics,
      pathId,
      phase,
      profile: "direct-manipulation",
      profileCatalogVersion: 1,
      version: 1,
    })),
  );
}

export function createIterationVerification(
  verificationTier,
  { sourceHash = "c".repeat(64) } = {},
) {
  const performancePassIds = verificationTier >= 3 ? ["composite"] : [];
  const performancePathIds =
    verificationTier >= 3 ? ["control-drag:composite"] : [];
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
      performanceTests: [],
      performancePassIds,
      performancePathIds,
      runner: "protected-iteration",
      unitTests: [],
    };
  }
  if (verificationTier === 1) {
    return {
      browserTests: [],
      ...emptyResolvedEvidence,
      checks: ["typecheck", "vitest-targeted"],
      performanceTests: [],
      performancePassIds,
      performancePathIds,
      runner: "protected-iteration",
      unitTests: ["src/app/app-schema.test.ts"],
    };
  }
  if (verificationTier === 2) {
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
      performanceTests: [],
      performanceTestEvidence: [],
      performanceTestTitles: [],
      performancePassIds,
      performanceComparison: null,
      performancePathIds,
      runner: "protected-iteration",
      targetedPerformanceReport: null,
      targetedPerformanceReportHash: null,
      unitTests: [],
    };
  }
  const performanceTests = ["browser perf: focused workload"];
  const performanceTestTitles = [
    "app-controls.spec.ts › browser perf: focused workload",
  ];
  const targetedPerformanceReport = createToolcraftTargetedPerformanceReport({
    fixtureResolutionMode: "strict-development",
    fixtureSelector: "development",
    nonce: "fixture-targeted-report",
    measurements: createTargetedMeasurementFixture(performancePathIds),
    performancePassIds,
    performancePathIds,
    requestAuthorityHash: "d".repeat(64),
    sourceHash,
    testNames: performanceTests,
  });
  return {
    browserTests: [],
    browserTestEvidence: [],
    browserTestTitles: [],
    checks: ["typecheck", "build", "playwright-targeted-performance"],
    performanceTests,
    performanceTestEvidence: [
      {
        fullTitle: performanceTestTitles[0],
        leafTitle: performanceTests[0],
      },
    ],
    performanceTestTitles,
    performancePassIds,
    performanceComparison: {
      reason: "previous-delivery-has-no-compatible-targeted-measurements",
      status: "not-comparable",
    },
    performancePathIds,
    runner: "protected-iteration",
    targetedPerformanceReport,
    targetedPerformanceReportHash: createToolcraftTargetedPerformanceReportHash(
      {
        report: targetedPerformanceReport,
        testEvidence: [
          {
            fullTitle: performanceTestTitles[0],
            leafTitle: performanceTests[0],
          },
        ],
      },
    ),
    unitTests: [],
  };
}

export function createLegacyV3IterationVerification(
  verificationTier,
  { sourceHash = "c".repeat(64) } = {},
) {
  const current = createIterationVerification(verificationTier, { sourceHash });
  const {
    browserTestEvidence: _browserTestEvidence,
    performanceComparison: _performanceComparison,
    performanceTestEvidence: _performanceTestEvidence,
    ...legacy
  } = current;
  if (legacy.targetedPerformanceReport === null) return legacy;

  const {
    fixtureResolutionMode: _fixtureResolutionMode,
    fixtureSelector: _fixtureSelector,
    measurements: _measurements,
    requestAuthorityHash: _requestAuthorityHash,
    ...legacyReportFields
  } = legacy.targetedPerformanceReport;
  const targetedPerformanceReport = {
    ...legacyReportFields,
    version: 1,
  };
  return {
    ...legacy,
    targetedPerformanceReport,
    targetedPerformanceReportHash: createToolcraftTargetedPerformanceReportHash({
      report: targetedPerformanceReport,
      testTitles: legacy.performanceTestTitles,
    }),
  };
}

export function createPerformanceEvidenceFixture() {
  return {
    environment: {
      browser: { name: "chromium", version: "1" },
      calibration: { durationMs: 1, iterations: 1 },
      cpuThrottling: { mode: "none", rate: 1 },
      evidenceType: "performance-environment",
      hardwareConcurrency: 4,
      version: 1,
      viewport: { height: 720, width: 1280 },
    },
    matrixHash: "b".repeat(64),
    measurements: [{ pathId: "initial", phase: "cold" }],
    pipelineSummaries: [],
    profileCatalogVersion: 1,
    reportHash: "a".repeat(64),
  };
}

export function createPerformanceSmokeEvidenceFixture(sourceHash) {
  return {
    completedAt: "2026-07-20T00:00:00.000Z",
    fixtureSelector: "development",
    kind: "performance-smoke",
    runner: "protected-playwright-smoke",
    sourceHash,
    testName: "browser smoke: toolcraft prototype responsiveness",
    version: 1,
  };
}

export async function writePassedCheckpointFixture(
  rootDir,
  {
    checkpointReason = "first-working-version",
    legacy = false,
    runner = "protected-playwright",
    writeBaseline = true,
  } = {},
) {
  const inventory = await collectToolcraftVerificationInputs(rootDir);
  const receipt = {
    checkpointReason,
    completedAt: new Date().toISOString(),
    files: inventory.entries,
    kind: "performance-checkpoint",
    performanceEvidence: createPerformanceEvidenceFixture(),
    runner,
    sourceHash: inventory.sourceHash,
    status: "passed",
    version: legacy ? 3 : TOOLCRAFT_PERFORMANCE_RECEIPT_VERSION,
  };
  const verification = createIterationVerification(0);
  const delivery = writeBaseline
    ? {
        baselineEvidenceHash: receipt.performanceEvidence.reportHash,
        baselineSourceHash: receipt.sourceHash,
        changedFiles: [],
        checks: ["integrity", "ai-check", "docs-check", ...verification.checks],
        comparisonFiles: inventory.entries,
        comparisonSourceHash: inventory.sourceHash,
        completedAt: receipt.completedAt,
        files: inventory.entries,
        kind: "delivery-verification",
        mode: "ordinary",
        runner: "protected-delivery",
        sourceHash: inventory.sourceHash,
        status: "passed",
        verification,
        verificationTier: 0,
        version: legacy ? 2 : TOOLCRAFT_DELIVERY_RECEIPT_VERSION,
      }
    : {
        checks: [...TOOLCRAFT_PROTOTYPE_DELIVERY_CHECKS],
        completedAt: receipt.completedAt,
        files: inventory.entries,
        kind: "delivery-verification",
        mode: "prototype",
        runner: "protected-delivery",
        smokeEvidence: createPerformanceSmokeEvidenceFixture(
          inventory.sourceHash,
        ),
        sourceHash: inventory.sourceHash,
        status: "passed",
        version: legacy ? 2 : TOOLCRAFT_DELIVERY_RECEIPT_VERSION,
      };
  const bundle = createToolcraftCheckpointBundle({
    currentPerformance: receipt,
    delivery,
    performanceBaseline: writeBaseline ? receipt : null,
  });
  if (legacy) {
    const paths = getToolcraftLegacyCheckpointReceiptPaths(rootDir);
    await fs.mkdir(path.dirname(paths.delivery), { recursive: true });
    await fs.writeFile(
      paths.delivery,
      `${JSON.stringify(delivery, null, 2)}\n`,
    );
    await fs.writeFile(
      paths.currentPerformance,
      `${JSON.stringify(receipt, null, 2)}\n`,
    );
    if (writeBaseline) {
      await fs.writeFile(
        paths.performanceBaseline,
        `${JSON.stringify(receipt, null, 2)}\n`,
      );
    }
  } else {
    await writeToolcraftCheckpointBundle({ bundle, rootDir });
  }
  return receipt;
}
