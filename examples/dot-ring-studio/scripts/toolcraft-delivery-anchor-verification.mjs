import {
  getLegacyResolvedTargetedEvidenceError,
  getResolvedTargetedEvidenceError,
} from "./toolcraft-legacy-targeted-evidence.mjs";
import {
  TOOLCRAFT_FULL_PERFORMANCE_VERIFICATION_COMMAND,
} from "./toolcraft-performance-authority-policy.mjs";
import { getToolcraftPerformanceIterationComparisonError } from "./toolcraft-performance-iteration-comparison.mjs";

const acceptedVerificationTiers = new Set([0, 1, 2, 3, 4]);
const acceptedIterationChecks = new Set([
  "build",
  "playwright-targeted-functional",
  "playwright-targeted-performance",
  "typecheck",
  "vitest-targeted",
]);

export function getToolcraftLegacyBaselineCoherenceError({
  baseline,
  linkage,
}) {
  if (baseline.missing && linkage) {
    return "Toolcraft delivery receipt references a missing durable performance baseline.";
  }
  if (
    !baseline.missing &&
    (!linkage ||
      linkage.sourceHash !== baseline.receipt.sourceHash ||
      linkage.evidenceHash !== baseline.receipt.performanceEvidence.reportHash)
  ) {
    return `Toolcraft delivery receipt does not match the durable performance baseline. An operator must run ${TOOLCRAFT_FULL_PERFORMANCE_VERIFICATION_COMMAND} to restore one coherent delivery state.`;
  }
  return undefined;
}

function isUniqueStringArray(value) {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === "string" && item.length > 0) &&
    new Set(value).size === value.length
  );
}

export function getToolcraftLegacyIterationVerificationError(
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
    !isUniqueStringArray(verification.performancePassIds) ||
    !isUniqueStringArray(verification.performancePathIds) ||
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
    const error = legacyResolvedEvidence
      ? getLegacyResolvedTargetedEvidenceError(verification, sourceHash)
      : getResolvedTargetedEvidenceError(verification, sourceHash, {
          reportExpectation,
        });
    if (error) return error;
  }

  const currentReport = verification.targetedPerformanceReport;
  if (
    currentReport?.version === 3 &&
    currentReport.requestAuthorityHash !== null
  ) {
    const error = getToolcraftPerformanceIterationComparisonError(
      verification.performanceComparison,
      currentReport,
    );
    if (error) return error;
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
