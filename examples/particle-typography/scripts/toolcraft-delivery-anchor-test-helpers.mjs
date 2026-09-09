import {
  createPerformanceSmokeEvidenceFixture,
  createTargetedMeasurementFixture,
} from "./toolcraft-verification-receipt-test-helpers.mjs";
import {
  createToolcraftTargetedPerformanceReport,
  createToolcraftTargetedPerformanceReportHash,
} from "./toolcraft-targeted-performance-report.mjs";

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
      performancePassIds,
      performancePathIds,
      performanceTests: [],
      runner: "protected-iteration",
      unitTests: [],
    };
  }
  if (verificationTier === 1) {
    return {
      browserTests: [],
      ...emptyResolvedEvidence,
      checks: ["typecheck", "vitest-targeted"],
      performancePassIds,
      performancePathIds,
      performanceTests: [],
      runner: "protected-iteration",
      unitTests: ["src/app/app-schema.test.ts"],
    };
  }
  if (verificationTier === 2) {
    return {
      browserTests: ["browser: focused acceptance"],
      browserTestEvidence: [{
        fullTitle: "app-controls.spec.ts › browser: focused acceptance",
        leafTitle: "browser: focused acceptance",
      }],
      browserTestTitles: ["app-controls.spec.ts › browser: focused acceptance"],
      checks: ["typecheck", "build", "playwright-targeted-functional"],
      performanceComparison: null,
      performancePassIds,
      performancePathIds,
      performanceTestEvidence: [],
      performanceTestTitles: [],
      performanceTests: [],
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
    measurements: createTargetedMeasurementFixture(performancePathIds),
    nonce: "fixture-targeted-report",
    performancePassIds,
    performancePathIds,
    requestAuthorityHash: "d".repeat(64),
    sourceHash,
    testNames: performanceTests,
  });
  const performanceTestEvidence = [{
    fullTitle: performanceTestTitles[0],
    leafTitle: performanceTests[0],
  }];
  return {
    browserTestEvidence: [],
    browserTestTitles: [],
    browserTests: [],
    checks: ["typecheck", "build", "playwright-targeted-performance"],
    performanceComparison: {
      reason: "previous-delivery-has-no-compatible-targeted-measurements",
      status: "not-comparable",
    },
    performancePassIds,
    performancePathIds,
    performanceTestEvidence,
    performanceTestTitles,
    performanceTests,
    runner: "protected-iteration",
    targetedPerformanceReport,
    targetedPerformanceReportHash: createToolcraftTargetedPerformanceReportHash({
      report: targetedPerformanceReport,
      testEvidence: performanceTestEvidence,
    }),
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

const LEGACY_PROTOTYPE_CHECKS = Object.freeze([
  "integrity",
  "ai-check",
  "test",
  "build",
  "playwright-functional",
  "playwright-smoke",
]);
const LEGACY_FULL_PERFORMANCE_CHECKS = Object.freeze([
  "integrity",
  "ai-check",
  "test",
  "build",
  "playwright-functional",
  "playwright-performance",
]);

export function createCommonDeliveryReceipt(inventory, overrides = {}) {
  return {
    checks: [...LEGACY_PROTOTYPE_CHECKS],
    completedAt: "2026-07-20T00:00:00.000Z",
    files: inventory.entries,
    kind: "delivery-verification",
    mode: "prototype",
    runner: "protected-delivery",
    sourceHash: inventory.sourceHash,
    status: "passed",
    version: 4,
    ...overrides,
  };
}

export function createPrototypeDeliveryReceipt(inventory, overrides = {}) {
  return createCommonDeliveryReceipt(inventory, {
    smokeEvidence: createPerformanceSmokeEvidenceFixture(inventory.sourceHash),
    ...overrides,
  });
}

export function createOrdinaryDeliveryReceipt({
  baseline,
  comparisonInventory,
  inventory,
  verificationTier = 0,
  ...overrides
}) {
  const verification = createIterationVerification(verificationTier, {
    sourceHash: inventory.sourceHash,
  });
  return createCommonDeliveryReceipt(inventory, {
    ...(baseline
      ? {
          baselineEvidenceHash: baseline.performanceEvidence.reportHash,
          baselineSourceHash: baseline.sourceHash,
        }
      : {}),
    changedFiles: [],
    checks: ["integrity", "ai-check", "docs-check", ...verification.checks],
    comparisonFiles: comparisonInventory.entries,
    comparisonSourceHash: comparisonInventory.sourceHash,
    mode: "ordinary",
    verification,
    verificationTier,
    ...overrides,
  });
}

export function createExplicitPerformanceDeliveryReceipt(
  inventory,
  baseline,
  overrides = {},
) {
  return createCommonDeliveryReceipt(inventory, {
    baselineEvidenceHash: baseline.performanceEvidence.reportHash,
    baselineSourceHash: baseline.sourceHash,
    checks: [...LEGACY_FULL_PERFORMANCE_CHECKS],
    mode: "explicit-performance",
    ...overrides,
  });
}
