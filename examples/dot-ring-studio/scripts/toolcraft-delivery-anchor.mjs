import { readToolcraftCheckpointBundle } from "./toolcraft-checkpoint-bundle.mjs";
import { createToolcraftDeliveryAnchorState } from "./toolcraft-delivery-lifecycle-state.mjs";
import { TOOLCRAFT_DELIVERY_RECEIPT_VERSION, getToolcraftDeliveryReceiptShapeError } from "./toolcraft-delivery-receipt.mjs";
import { getToolcraftPerformanceSmokeEvidenceError } from "./toolcraft-performance-smoke-evidence.mjs";
import {
  getToolcraftLegacyBaselineCoherenceError,
  getToolcraftLegacyIterationVerificationError,
} from "./toolcraft-delivery-anchor-verification.mjs";
import { createToolcraftTargetedPerformanceReportHash } from "./toolcraft-targeted-performance-report.mjs";
import { collectToolcraftVerificationInputs, getToolcraftChangedVerificationFiles as changedFiles, getToolcraftVerificationInventoryError } from "./toolcraft-verification-inventory.mjs";
import { arraysEqual, deepFreeze, hasExactKeys } from "./toolcraft-delivery-anchor-utils.mjs";
export const TOOLCRAFT_LEGACY_DELIVERY_RECEIPT_VERSION = 4;
const LEGACY_DELIVERY_RECEIPT_VERSIONS = new Set([2, 3, TOOLCRAFT_LEGACY_DELIVERY_RECEIPT_VERSION]);
export const TOOLCRAFT_LEGACY_PROTOTYPE_DELIVERY_CHECKS = Object.freeze([
  "integrity", "ai-check", "test", "build", "playwright-functional", "playwright-smoke",
]);
export const TOOLCRAFT_LEGACY_FULL_PERFORMANCE_DELIVERY_CHECKS = Object.freeze([
  "integrity", "ai-check", "test", "build", "playwright-functional", "playwright-performance",
]);
const commonKeys = Object.freeze([
  "checks", "completedAt", "files", "kind", "mode", "runner", "sourceHash", "status", "version",
]);
const prototypeKeys = Object.freeze([...commonKeys, "smokeEvidence"]);
const explicitPerformanceKeys = Object.freeze([...commonKeys, "baselineEvidenceHash", "baselineSourceHash"]);
const targetedKeys = Object.freeze([
  ...commonKeys, "changedFiles", "comparisonFiles", "comparisonSourceHash", "verification", "verificationTier",
]);
const targetedBaselineKeys = Object.freeze(
  [...targetedKeys, "baselineEvidenceHash", "baselineSourceHash"],
);
const v2VerificationKeys = Object.freeze([
  "browserTests", "checks", "performancePassIds", "performancePathIds",
  "performanceTests", "runner", "unitTests",
]);
const resolvedVerificationKeys = Object.freeze([
  "browserTestEvidence", "browserTests", "browserTestTitles", "checks",
  "performancePassIds", "performancePathIds", "performanceTestEvidence",
  "performanceTests", "performanceTestTitles", "runner",
  "targetedPerformanceReport", "targetedPerformanceReportHash", "unitTests",
]);
const hashPattern = /^[a-f0-9]{64}$/u;
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function hasBaselineLinkage(receipt) {
  return receipt.baselineSourceHash !== undefined ||
    receipt.baselineEvidenceHash !== undefined;
}
function getLegacyCommonError(receipt, version) {
  if (
    !isRecord(receipt) ||
    receipt.version !== version ||
    receipt.kind !== "delivery-verification" ||
    receipt.runner !== "protected-delivery" ||
    receipt.status !== "passed" ||
    typeof receipt.completedAt !== "string" ||
    !hashPattern.test(receipt.sourceHash ?? "") ||
    !Array.isArray(receipt.files) ||
    !Array.isArray(receipt.checks) ||
    !receipt.checks.every((check) => typeof check === "string")
  ) {
    return "Toolcraft legacy delivery receipt is malformed or uses an unsupported version.";
  }
  return getToolcraftVerificationInventoryError({
    entries: receipt.files, label: "Toolcraft legacy delivery receipt file inventory",
    sourceHash: receipt.sourceHash,
  });
}
function getBaselineError(receipt, required) {
  const hasSource = receipt.baselineSourceHash !== undefined;
  const hasEvidence = receipt.baselineEvidenceHash !== undefined;
  if (hasSource !== hasEvidence || (required && !hasSource)) {
    return "Toolcraft legacy delivery baseline linkage is malformed.";
  }
  if (hasSource && (!hashPattern.test(receipt.baselineSourceHash) ||
    !hashPattern.test(receipt.baselineEvidenceHash))) {
    return "Toolcraft legacy delivery baseline linkage is malformed.";
  }
  return undefined;
}
function getPrototypeError(receipt) {
  if (
    !hasExactKeys(receipt, prototypeKeys) ||
    !arraysEqual(receipt.checks, TOOLCRAFT_LEGACY_PROTOTYPE_DELIVERY_CHECKS)
  ) {
    return "Toolcraft legacy prototype delivery receipt has malformed or unsupported fields.";
  }
  const smokeError = getToolcraftPerformanceSmokeEvidenceError(receipt.smokeEvidence);
  if (smokeError) return smokeError;
  return receipt.smokeEvidence.sourceHash === receipt.sourceHash
    ? undefined
    : "Toolcraft legacy prototype smoke evidence does not match its source.";
}
function getExplicitPerformanceError(receipt) {
  const baselineError = getBaselineError(receipt, true);
  if (
    !hasExactKeys(receipt, explicitPerformanceKeys) ||
    baselineError ||
    receipt.sourceHash !== receipt.baselineSourceHash ||
    !arraysEqual(receipt.checks, TOOLCRAFT_LEGACY_FULL_PERFORMANCE_DELIVERY_CHECKS)
  ) {
    return baselineError ??
      "Toolcraft legacy explicit performance delivery receipt is malformed.";
  }
  return undefined;
}
function getVerificationSchemaError(receipt) {
  const verification = receipt.verification;
  if (receipt.version === 2) {
    return hasExactKeys(verification, v2VerificationKeys)
      ? undefined : "Toolcraft legacy version 2 verification schema is malformed.";
  }
  const reportVersion = verification?.targetedPerformanceReport?.version;
  const v4Keys = [...resolvedVerificationKeys, "performanceComparison"];
  const validSchema =
    hasExactKeys(verification, receipt.version === 4 && reportVersion === 3
      ? v4Keys : resolvedVerificationKeys) ||
    (receipt.version === 4 && reportVersion !== 3 &&
      hasExactKeys(verification, v4Keys));
  if (!validSchema) {
    return `Toolcraft legacy version ${receipt.version} verification schema is malformed.`;
  }
  if (receipt.version === 3 && reportVersion !== undefined &&
    reportVersion !== null && reportVersion !== 1) {
    return "Toolcraft legacy version 3 targeted performance report is malformed.";
  }
  if (receipt.version === 4 && reportVersion !== undefined &&
    reportVersion !== null && ![2, 3].includes(reportVersion)) {
    return "Toolcraft legacy version 4 targeted performance report is malformed.";
  }
  if (receipt.version === 4 && reportVersion === 3 &&
    (receipt.mode === "performance-iteration") !==
      hashPattern.test(verification.targetedPerformanceReport.requestAuthorityHash ?? "")) {
    return "Toolcraft legacy version 4 performance request authority is malformed.";
  }
  return undefined;
}
function getTargetedError(receipt) {
  const modeLabel =
    receipt.mode === "ordinary" ? "ordinary" : "performance-iteration";
  const baselineError = getBaselineError(receipt, false);
  const expectedKeys = hasBaselineLinkage(receipt) ? targetedBaselineKeys : targetedKeys;
  if (baselineError || !hasExactKeys(receipt, expectedKeys)) {
    return baselineError ??
      `Toolcraft legacy ${modeLabel} delivery receipt has malformed or unsupported fields.`;
  }
  if (
    !Number.isInteger(receipt.verificationTier) ||
    receipt.verificationTier < 0 ||
    receipt.verificationTier > 4 ||
    !hashPattern.test(receipt.comparisonSourceHash ?? "") ||
    !Array.isArray(receipt.comparisonFiles) ||
    !Array.isArray(receipt.changedFiles) ||
    !receipt.changedFiles.every((item) => typeof item === "string")
  ) {
    return `Toolcraft legacy ${modeLabel} comparison evidence is malformed.`;
  }
  const inventoryError = getToolcraftVerificationInventoryError({
    entries: receipt.comparisonFiles, label: `Toolcraft legacy ${modeLabel} comparison inventory`,
    sourceHash: receipt.comparisonSourceHash,
  });
  if (inventoryError) return inventoryError;
  if (
    !arraysEqual(receipt.changedFiles, changedFiles(receipt.comparisonFiles, receipt.files))
  ) {
    return `Toolcraft legacy ${modeLabel} changed-file evidence is malformed.`;
  }
  const requiredPerformanceFields = [
    "performanceTests", "performancePassIds", "performancePathIds",
  ];
  if (
    receipt.mode === "performance-iteration" &&
    (!isRecord(receipt.verification) ||
      requiredPerformanceFields.some(
        (field) => !Array.isArray(receipt.verification[field]) ||
          !receipt.verification[field].length,
      ))
  ) {
    return "Toolcraft performance-iteration delivery requires non-empty performance test, pass, and path inventories.";
  }
  const schemaError = getVerificationSchemaError(receipt);
  if (schemaError) return schemaError;
  const reportVersion = receipt.verification.targetedPerformanceReport?.version;
  const verificationError = getToolcraftLegacyIterationVerificationError(
    receipt.verification,
    receipt.verificationTier,
    {
      legacyResolvedEvidence: receipt.version === 2,
      reportExpectation:
        receipt.version >= 3 && reportVersion !== undefined &&
          reportVersion !== null
          ? {
              ...(reportVersion >= 2 ? { fixtureSelector: "development" } : {}),
              ...(reportVersion >= 2
                ? { fixtureResolutionMode: receipt.mode === "performance-iteration"
                    ? "strict-development" : "default" }
                : {}),
              version: reportVersion,
            }
          : undefined,
      requireResolvedEvidence: receipt.version >= 3,
      sourceHash: receipt.sourceHash,
    },
  );
  if (verificationError) return verificationError;
  const expectedChecks = ["integrity", "ai-check", "docs-check", ...receipt.verification.checks];
  return arraysEqual(receipt.checks, expectedChecks)
    ? undefined
    : `Toolcraft legacy ${modeLabel} checks do not match its evidence.`;
}
function getLegacyToolcraftDeliveryReceiptError(receipt, version) {
  const commonError = getLegacyCommonError(receipt, version);
  if (commonError) return commonError;
  if (receipt.mode === "prototype") return getPrototypeError(receipt);
  if (receipt.mode === "ordinary" || receipt.mode === "performance-iteration") {
    return getTargetedError(receipt);
  }
  if (receipt.mode === "explicit-performance") {
    return getExplicitPerformanceError(receipt);
  }
  return "Toolcraft legacy delivery receipt mode is unsupported.";
}
export const isToolcraftLegacyTargetedDeliveryMode = (mode) =>
  mode === "ordinary" || mode === "performance-iteration";
function createPerformanceAnchor(receipt, mode) {
  const evidence =
    mode === "current"
      ? receipt.evidence.find(({ kind }) => kind === "browser-performance")
      : receipt.verification?.targetedPerformanceReport
        ? { report: receipt.verification.targetedPerformanceReport,
            reportHash: receipt.verification.targetedPerformanceReportHash }
        : undefined;
  if (!evidence) return { kind: "none" };
  const reportHash = evidence.report.version === 3
    ? createToolcraftTargetedPerformanceReportHash({
        report: evidence.report,
        testTitles: evidence.report.testNames,
      })
    : evidence.reportHash;
  const performanceIteration = mode === "current"
    ? receipt.plan.kind === "performance-iteration" : receipt.mode === "performance-iteration";
  const requestAuthorityHash =
    mode === "current"
      ? receipt.plan.requestAuthorityHash
      : evidence.report.requestAuthorityHash;
  if (!performanceIteration || !hashPattern.test(requestAuthorityHash ?? "")) {
    return { kind: "ordinary-targeted-report", report: evidence.report,
      reportHash };
  }
  return { kind: "performance-iteration-report", report: evidence.report,
    reportHash, requestAuthorityHash };
}
function createAnchor(receipt, mode) {
  const performance = createPerformanceAnchor(receipt, mode);
  return createToolcraftDeliveryAnchorState({ currentLifecycle: mode === "current"
    ? receipt.plan.lifecycle : null, files: receipt.files, performance,
    sourceHash: receipt.sourceHash });
}
export function getToolcraftDeliveryCompatibility(receipt) {
  if (!LEGACY_DELIVERY_RECEIPT_VERSIONS.has(receipt?.version)) {
    throw new Error(
      "Toolcraft delivery compatibility accepts only legacy versions 2, 3, and 4.",
    );
  }
  const anchor = normalizeToolcraftDeliveryAnchor(receipt);
  return deepFreeze({
    anchor,
    baseline: hasBaselineLinkage(receipt)
      ? { evidenceHash: receipt.baselineEvidenceHash,
          sourceHash: receipt.baselineSourceHash }
      : null,
    fullPerformanceCommit: receipt.mode === "explicit-performance",
    targeted: isToolcraftLegacyTargetedDeliveryMode(receipt.mode)
      ? {
          changedFiles: receipt.changedFiles,
          comparison: { entries: receipt.comparisonFiles,
            sourceHash: receipt.comparisonSourceHash },
          comparisonResult: receipt.verification.performanceComparison,
          evidence: receipt.verification,
          finalInventory: { entries: receipt.files, sourceHash: receipt.sourceHash },
          tier: receipt.verificationTier,
        }
      : null,
  });
}
export function assertToolcraftLegacyDeliveryBaselineCoherence({
  baseline,
  delivery,
}) {
  if (baseline.error && !baseline.missing) throw new Error(baseline.error);
  if (delivery.error) throw new Error(delivery.error);
  const linkage = getToolcraftDeliveryCompatibility(delivery.receipt).baseline;
  const error = getToolcraftLegacyBaselineCoherenceError({
    baseline,
    linkage,
  });
  if (error) throw new Error(error);
}
export function normalizeToolcraftDeliveryAnchor(receipt) {
  if (receipt?.version === TOOLCRAFT_DELIVERY_RECEIPT_VERSION) {
    const error = getToolcraftDeliveryReceiptShapeError(receipt);
    if (error) throw new Error(error);
    return createAnchor(receipt, "current");
  }
  if (LEGACY_DELIVERY_RECEIPT_VERSIONS.has(receipt?.version)) {
    const error = getLegacyToolcraftDeliveryReceiptError(
      receipt,
      receipt.version,
    );
    if (error) throw new Error(error);
    return createAnchor(receipt, "legacy");
  }
  throw new Error(
    "Toolcraft delivery receipt is malformed or uses an unsupported version.",
  );
}
export function getToolcraftDeliveryAnchorShapeError(receipt) {
  try {
    normalizeToolcraftDeliveryAnchor(receipt);
    return undefined;
  } catch (error) { return error instanceof Error ? error.message : String(error); }
}
export async function readToolcraftDeliveryAnchor(rootDir) {
  const loaded = await readToolcraftCheckpointBundle(rootDir);
  if (loaded.missing || loaded.error) return loaded;
  try {
    return {
      anchor: normalizeToolcraftDeliveryAnchor(loaded.bundle.delivery),
      receipt: loaded.bundle.delivery,
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}
export async function validateToolcraftDeliveryAnchor({ rootDir }) {
  const loaded = await readToolcraftDeliveryAnchor(rootDir);
  if (loaded.missing) return ["Toolcraft delivery receipt is missing."];
  if (loaded.error) return [loaded.error];
  const inventory = await collectToolcraftVerificationInputs(rootDir);
  return loaded.anchor.sourceHash === inventory.sourceHash
    ? []
    : ["Toolcraft delivery receipt is stale for the current source."];
}
