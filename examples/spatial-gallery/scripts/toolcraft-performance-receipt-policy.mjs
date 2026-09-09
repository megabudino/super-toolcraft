import { TOOLCRAFT_PERFORMANCE_PROFILE_MANIFEST } from "../src/toolcraft/runtime/performance/profile-catalog-manifest.mjs";

import { getToolcraftVerificationInventoryError } from "./toolcraft-verification-inventory.mjs";
import {
  getLegacyResolvedTargetedEvidenceError,
  getResolvedTargetedEvidenceError,
} from "./toolcraft-targeted-evidence-policy.mjs";
import { getToolcraftPerformanceIterationComparisonError } from "./toolcraft-performance-iteration-comparison.mjs";

export const TOOLCRAFT_PERFORMANCE_RECEIPT_VERSION = 4;
const TOOLCRAFT_LEGACY_PERFORMANCE_RECEIPT_VERSION = 3;
export const TOOLCRAFT_EXPLICIT_PERFORMANCE_REASON =
  "explicit-performance-work";
export const TOOLCRAFT_PERFORMANCE_ITERATION_REASON =
  "post-first-working-targeted-verification";

const acceptedRunners = new Set(["protected-playwright"]);
const acceptedVerificationTiers = new Set([0, 1, 2, 3, 4]);
const acceptedCheckpointReasons = new Set([
  TOOLCRAFT_EXPLICIT_PERFORMANCE_REASON,
  // Migration-only: current protected runners never create this reason.
  "first-working-version",
]);
const acceptedIterationChecks = new Set([
  "build",
  "playwright-targeted-functional",
  "playwright-targeted-performance",
  "typecheck",
  "vitest-targeted",
]);

function getReceiptInventoryError(receipt) {
  return getToolcraftVerificationInventoryError({
    entries: receipt.files,
    label: "Toolcraft performance receipt file inventory",
    sourceHash: receipt.sourceHash,
  });
}

function isUniqueStringArray(value) {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === "string" && item.length > 0) &&
    new Set(value).size === value.length
  );
}

function getPerformanceEvidenceError(evidence) {
  if (
    typeof evidence !== "object" ||
    evidence === null ||
    Array.isArray(evidence) ||
    !/^[a-f0-9]{64}$/u.test(evidence.reportHash ?? "") ||
    !/^[a-f0-9]{64}$/u.test(evidence.matrixHash ?? "") ||
    evidence.profileCatalogVersion !==
      TOOLCRAFT_PERFORMANCE_PROFILE_MANIFEST.version ||
    typeof evidence.environment !== "object" ||
    evidence.environment === null ||
    !Array.isArray(evidence.measurements) ||
    evidence.measurements.length === 0 ||
    !Array.isArray(evidence.pipelineSummaries)
  ) {
    return "Toolcraft performance checkpoint evidence is malformed.";
  }
  return undefined;
}

export function getToolcraftPerformanceIterationVerificationError(
  verification,
  verificationTier,
  {
    legacyResolvedEvidence = false,
    reportExpectation,
    requireResolvedEvidence = false,
    sourceHash,
  } = {},
) {
  if (!acceptedVerificationTiers.has(verificationTier)) {
    return "Toolcraft post-first-working iteration tier must be 0, 1, 2, 3, or 4.";
  }
  if (
    typeof verification !== "object" ||
    verification === null ||
    Array.isArray(verification) ||
    verification.runner !== "protected-iteration" ||
    !isUniqueStringArray(verification.checks) ||
    !verification.checks.every((check) => acceptedIterationChecks.has(check)) ||
    !isUniqueStringArray(verification.unitTests) ||
    !isUniqueStringArray(verification.browserTests) ||
    !isUniqueStringArray(verification.performanceTests) ||
    !Array.isArray(verification.performancePassIds) ||
    !verification.performancePassIds.every(
      (item) => typeof item === "string" && item.length > 0,
    ) ||
    new Set(verification.performancePassIds).size !==
      verification.performancePassIds.length ||
    !Array.isArray(verification.performancePathIds) ||
    !verification.performancePathIds.every(
      (item) => typeof item === "string" && item.length > 0,
    ) ||
    new Set(verification.performancePathIds).size !==
      verification.performancePathIds.length ||
    !verification.browserTests.every(
      (name) => !name.startsWith("browser perf:"),
    ) ||
    !verification.performanceTests.every((name) =>
      name.startsWith("browser perf:"),
    )
  ) {
    return "Toolcraft targeted iteration verification evidence is malformed.";
  }

  const hasResolvedEvidence =
    verification.browserTestEvidence !== undefined ||
    verification.browserTestTitles !== undefined ||
    verification.performanceTestEvidence !== undefined ||
    verification.performanceTestTitles !== undefined ||
    verification.targetedPerformanceReport !== undefined ||
    verification.targetedPerformanceReportHash !== undefined;
  if (requireResolvedEvidence || hasResolvedEvidence) {
    const resolvedEvidenceError = legacyResolvedEvidence
      ? getLegacyResolvedTargetedEvidenceError(verification, sourceHash)
      : getResolvedTargetedEvidenceError(verification, sourceHash, {
          reportExpectation,
        });
    if (resolvedEvidenceError) return resolvedEvidenceError;
  }
  const currentReport = verification.targetedPerformanceReport;
  if (
    currentReport?.version === 3 &&
    currentReport.requestAuthorityHash !== null
  ) {
    const comparisonError = getToolcraftPerformanceIterationComparisonError(
      verification.performanceComparison,
      currentReport,
    );
    if (comparisonError) return comparisonError;
  } else if (
    verification.performanceComparison !== undefined &&
    verification.performanceComparison !== null
  ) {
    return "Toolcraft ordinary or legacy targeted verification cannot claim a performance iteration comparison.";
  }

  const checks = new Set(verification.checks);
  if (!checks.has("typecheck")) {
    return "Toolcraft targeted iteration evidence must include typecheck.";
  }
  if (
    verification.unitTests.length > 0 !== checks.has("vitest-targeted") ||
    verification.browserTests.length > 0 !==
      checks.has("playwright-targeted-functional") ||
    verification.performanceTests.length > 0 !==
      checks.has("playwright-targeted-performance")
  ) {
    return "Toolcraft targeted iteration test inventories must match their executed checks.";
  }
  if (
    (verification.browserTests.length > 0 ||
      verification.performanceTests.length > 0) !== checks.has("build")
  ) {
    return "Toolcraft targeted browser iteration evidence must include the production build check.";
  }
  if (
    verificationTier === 1 &&
    verification.unitTests.length === 0 &&
    verification.browserTests.length === 0
  ) {
    return "Toolcraft Tier 1 iteration must include a targeted unit or functional browser test.";
  }
  if (verificationTier === 2 && verification.browserTests.length === 0) {
    return "Toolcraft Tier 2 iteration must include a targeted functional browser test.";
  }
  if (
    verificationTier >= 3 &&
    verification.performancePassIds.length > 0 &&
    verification.performanceTests.length === 0
  ) {
    return `Toolcraft Tier ${verificationTier} iteration must include at least one targeted browser perf: test.`;
  }
  if (
    (verification.performancePassIds.length === 0) !==
    (verification.performancePathIds.length === 0)
  ) {
    return "Toolcraft targeted iteration pass and path evidence must either both be empty or both be present.";
  }
  if (
    verification.performancePathIds.length > 0 &&
    verification.performanceTests.length === 0
  ) {
    return "Toolcraft targeted iteration path evidence requires protected browser performance tests.";
  }
  return undefined;
}

export function getToolcraftPerformanceReceiptShapeError(receipt) {
  if (
    typeof receipt !== "object" ||
    receipt === null ||
    Array.isArray(receipt) ||
    ![
      TOOLCRAFT_LEGACY_PERFORMANCE_RECEIPT_VERSION,
      TOOLCRAFT_PERFORMANCE_RECEIPT_VERSION,
    ].includes(receipt.version) ||
    typeof receipt.completedAt !== "string" ||
    !/^[a-f0-9]{64}$/u.test(receipt.sourceHash ?? "") ||
    !Array.isArray(receipt.files)
  ) {
    return "Toolcraft performance receipt is malformed or uses an unsupported version.";
  }
  if (receipt.kind === "performance-checkpoint") {
    if (
      receipt.status !== "passed" ||
      !acceptedRunners.has(receipt.runner) ||
      !acceptedCheckpointReasons.has(receipt.checkpointReason)
    ) {
      return "Toolcraft performance checkpoint receipt must be passed and name a supported runner and checkpoint reason.";
    }
    return (
      getPerformanceEvidenceError(receipt.performanceEvidence) ??
      getReceiptInventoryError(receipt)
    );
  }
  if (receipt.kind === "performance-iteration") {
    if (
      receipt.status !== "passed-targeted" ||
      receipt.reasonCode !== TOOLCRAFT_PERFORMANCE_ITERATION_REASON ||
      !acceptedVerificationTiers.has(receipt.verificationTier) ||
      !/^[a-f0-9]{64}$/u.test(receipt.baselineSourceHash ?? "") ||
      !/^[a-f0-9]{64}$/u.test(receipt.baselineEvidenceHash ?? "") ||
      !Array.isArray(receipt.changedFiles) ||
      !receipt.changedFiles.every((item) => typeof item === "string")
    ) {
      return "Toolcraft post-first-working performance iteration receipt is malformed.";
    }
    const verificationError = getToolcraftPerformanceIterationVerificationError(
      receipt.verification,
      receipt.verificationTier,
      {
        legacyResolvedEvidence:
          receipt.version === TOOLCRAFT_LEGACY_PERFORMANCE_RECEIPT_VERSION,
        reportExpectation:
          receipt.version === TOOLCRAFT_PERFORMANCE_RECEIPT_VERSION
            ? {
                fixtureResolutionMode: "strict-development",
                fixtureSelector: "development",
                version: 3,
              }
            : undefined,
        requireResolvedEvidence:
          receipt.version === TOOLCRAFT_PERFORMANCE_RECEIPT_VERSION,
        sourceHash: receipt.sourceHash,
      },
    );
    return verificationError ?? getReceiptInventoryError(receipt);
  }
  return "Toolcraft performance receipt kind is unsupported.";
}
