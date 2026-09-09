import { readToolcraftCheckpointBundle } from "./toolcraft-checkpoint-bundle.mjs";
import { getToolcraftDeliveryBaselineError } from "./toolcraft-delivery-baseline-policy.mjs";
import { getToolcraftPerformanceSmokeEvidenceError } from "./toolcraft-performance-smoke-evidence.mjs";
import { getToolcraftPerformanceIterationVerificationError } from "./toolcraft-performance-receipt-policy.mjs";
import {
  getChangedFiles,
  getToolcraftTargetedImpactVerificationError,
  getToolcraftTargetedVerificationContext,
} from "./toolcraft-verification-receipt-core.mjs";
import {
  collectToolcraftVerificationInputs,
  getToolcraftVerificationInventoryError,
} from "./toolcraft-verification-inventory.mjs";

export const TOOLCRAFT_DELIVERY_RECEIPT_VERSION = 4;
const TOOLCRAFT_LEGACY_DELIVERY_RECEIPT_VERSIONS = new Set([2, 3]);

export const TOOLCRAFT_PROTOTYPE_DELIVERY_CHECKS = Object.freeze([
  "integrity",
  "ai-check",
  "test",
  "build",
  "playwright-functional",
  "playwright-smoke",
]);
export const TOOLCRAFT_FULL_PERFORMANCE_DELIVERY_CHECKS = Object.freeze([
  "integrity",
  "ai-check",
  "test",
  "build",
  "playwright-functional",
  "playwright-performance",
]);
const commonKeys = Object.freeze([
  "checks",
  "completedAt",
  "files",
  "kind",
  "mode",
  "runner",
  "sourceHash",
  "status",
  "version",
]);
const prototypeKeys = Object.freeze([...commonKeys, "smokeEvidence"]);
const explicitPerformanceKeys = Object.freeze([
  ...commonKeys,
  "baselineEvidenceHash",
  "baselineSourceHash",
]);
const targetedKeys = Object.freeze([
  ...commonKeys,
  "changedFiles",
  "comparisonFiles",
  "comparisonSourceHash",
  "verification",
  "verificationTier",
]);
const targetedBaselineKeys = Object.freeze([
  ...targetedKeys,
  "baselineEvidenceHash",
  "baselineSourceHash",
]);

function arraysEqual(left, right) {
  return (
    left.length === right.length &&
    left.every((item, index) => item === right[index])
  );
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/u.test(value);
}

function hasExactKeys(value, expectedKeys) {
  const actualKeys = Object.keys(value).sort();
  const sortedExpectedKeys = [...expectedKeys].sort();
  return arraysEqual(actualKeys, sortedExpectedKeys);
}

function hasBaselineLinkage(receipt) {
  return (
    receipt.baselineSourceHash !== undefined ||
    receipt.baselineEvidenceHash !== undefined
  );
}

export function isToolcraftTargetedDeliveryMode(mode) {
  return mode === "ordinary" || mode === "performance-iteration";
}

function getCommonShapeError(receipt) {
  if (
    !isRecord(receipt) ||
    ![
      ...TOOLCRAFT_LEGACY_DELIVERY_RECEIPT_VERSIONS,
      TOOLCRAFT_DELIVERY_RECEIPT_VERSION,
    ].includes(receipt.version) ||
    receipt.kind !== "delivery-verification" ||
    receipt.runner !== "protected-delivery" ||
    receipt.status !== "passed" ||
    typeof receipt.completedAt !== "string" ||
    !isSha256(receipt.sourceHash) ||
    !Array.isArray(receipt.files) ||
    !Array.isArray(receipt.checks) ||
    !receipt.checks.every((check) => typeof check === "string")
  ) {
    return "Toolcraft delivery receipt is malformed or uses an unsupported version.";
  }
  return getToolcraftVerificationInventoryError({
    entries: receipt.files,
    label: "Toolcraft delivery receipt file inventory",
    sourceHash: receipt.sourceHash,
  });
}

function getBaselineLinkageShapeError(receipt, required) {
  const hasSourceHash = receipt.baselineSourceHash !== undefined;
  const hasEvidenceHash = receipt.baselineEvidenceHash !== undefined;
  if (hasSourceHash !== hasEvidenceHash) {
    return "Toolcraft delivery receipt baseline linkage must contain both hashes or neither hash.";
  }
  if (required && !hasSourceHash) {
    return "Toolcraft delivery receipt requires durable performance baseline linkage.";
  }
  if (
    hasSourceHash &&
    (!isSha256(receipt.baselineSourceHash) ||
      !isSha256(receipt.baselineEvidenceHash))
  ) {
    return "Toolcraft delivery receipt baseline linkage is malformed.";
  }
  return undefined;
}

function getPrototypeShapeError(receipt) {
  if (!hasExactKeys(receipt, prototypeKeys)) {
    return "Toolcraft prototype delivery receipt has malformed or unsupported fields.";
  }
  if (!arraysEqual(receipt.checks, TOOLCRAFT_PROTOTYPE_DELIVERY_CHECKS)) {
    return "Toolcraft prototype delivery receipt does not prove the complete functional and smoke gate.";
  }
  const smokeError = getToolcraftPerformanceSmokeEvidenceError(
    receipt.smokeEvidence,
  );
  if (smokeError) return smokeError;
  return receipt.smokeEvidence.sourceHash === receipt.sourceHash
    ? undefined
    : "Toolcraft prototype smoke evidence does not match the delivery source.";
}

function getExplicitPerformanceShapeError(receipt) {
  if (!hasExactKeys(receipt, explicitPerformanceKeys)) {
    return "Toolcraft explicit performance delivery receipt has malformed or unsupported fields.";
  }
  const baselineError = getBaselineLinkageShapeError(receipt, true);
  if (baselineError) return baselineError;
  if (receipt.sourceHash !== receipt.baselineSourceHash) {
    return "Toolcraft explicit performance baseline source must match the current source.";
  }
  return arraysEqual(receipt.checks, TOOLCRAFT_FULL_PERFORMANCE_DELIVERY_CHECKS)
    ? undefined
    : "Toolcraft explicit performance delivery receipt does not prove the complete functional and performance gate.";
}

function getTargetedShapeError(receipt) {
  const modeLabel =
    receipt.mode === "ordinary" ? "ordinary" : "performance-iteration";
  const baselineError = getBaselineLinkageShapeError(receipt, false);
  if (baselineError) return baselineError;
  const expectedKeys = hasBaselineLinkage(receipt)
    ? targetedBaselineKeys
    : targetedKeys;
  if (!hasExactKeys(receipt, expectedKeys)) {
    return `Toolcraft ${modeLabel} delivery receipt has malformed or unsupported fields.`;
  }
  if (
    !Number.isInteger(receipt.verificationTier) ||
    receipt.verificationTier < 0 ||
    receipt.verificationTier > 4 ||
    !isSha256(receipt.comparisonSourceHash) ||
    !Array.isArray(receipt.comparisonFiles) ||
    !Array.isArray(receipt.changedFiles) ||
    !receipt.changedFiles.every((item) => typeof item === "string")
  ) {
    return `Toolcraft ${modeLabel} delivery receipt comparison evidence is malformed.`;
  }
  const comparisonInventoryError = getToolcraftVerificationInventoryError({
    entries: receipt.comparisonFiles,
    label: `Toolcraft ${modeLabel} delivery comparison inventory`,
    sourceHash: receipt.comparisonSourceHash,
  });
  if (comparisonInventoryError) return comparisonInventoryError;
  const expectedChangedFiles = getChangedFiles(
    receipt.comparisonFiles,
    receipt.files,
  );
  if (!arraysEqual(receipt.changedFiles, expectedChangedFiles)) {
    return `Toolcraft ${modeLabel} delivery changed-file inventory does not match its comparison and current inventories.`;
  }
  if (
    receipt.mode === "performance-iteration" &&
    (!isRecord(receipt.verification) ||
      !Array.isArray(receipt.verification.performanceTests) ||
      receipt.verification.performanceTests.length === 0 ||
      !Array.isArray(receipt.verification.performancePassIds) ||
      receipt.verification.performancePassIds.length === 0 ||
      !Array.isArray(receipt.verification.performancePathIds) ||
      receipt.verification.performancePathIds.length === 0)
  ) {
    return "Toolcraft performance-iteration delivery requires non-empty performance test, pass, and path inventories.";
  }
  const verificationError = getToolcraftPerformanceIterationVerificationError(
    receipt.verification,
    receipt.verificationTier,
    {
      legacyResolvedEvidence:
        receipt.version === 2,
      reportExpectation:
        receipt.version === TOOLCRAFT_DELIVERY_RECEIPT_VERSION
          ? {
              fixtureSelector: "development",
              ...(receipt.mode === "performance-iteration"
                ? { fixtureResolutionMode: "strict-development" }
                : {}),
              version: 3,
            }
          : undefined,
      requireResolvedEvidence:
        receipt.version >= 3,
      sourceHash: receipt.sourceHash,
    },
  );
  if (verificationError) return verificationError;
  const expectedChecks = [
    "integrity",
    "ai-check",
    "docs-check",
    ...receipt.verification.checks,
  ];
  return arraysEqual(receipt.checks, expectedChecks)
    ? undefined
    : `Toolcraft ${modeLabel} delivery checks do not match its targeted verification evidence.`;
}

export function getToolcraftDeliveryReceiptShapeError(receipt) {
  const commonError = getCommonShapeError(receipt);
  if (commonError) return commonError;
  if (receipt.mode === "prototype") return getPrototypeShapeError(receipt);
  if (isToolcraftTargetedDeliveryMode(receipt.mode)) {
    return getTargetedShapeError(receipt);
  }
  if (receipt.mode === "explicit-performance") {
    return getExplicitPerformanceShapeError(receipt);
  }
  return "Toolcraft delivery receipt mode is unsupported.";
}

export async function readToolcraftDeliveryReceipt(rootDir) {
  const loaded = await readToolcraftCheckpointBundle(rootDir);
  if (loaded.missing || loaded.error) return loaded;
  const receipt = loaded.bundle.delivery;
  const shapeError = getToolcraftDeliveryReceiptShapeError(receipt);
  return shapeError ? { error: shapeError } : { receipt };
}

export async function validateToolcraftDeliveryReceipt({ rootDir }) {
  const loaded = await readToolcraftDeliveryReceipt(rootDir);
  if (loaded.missing) {
    return [
      "Toolcraft delivery receipt is missing. Run pnpm verify:delivery at the delivery boundary.",
    ];
  }
  if (loaded.error) return [loaded.error];
  const receipt = loaded.receipt;
  const baselineError = await getToolcraftDeliveryBaselineError({ receipt, rootDir });
  if (baselineError) return [baselineError];

  const inventory = await collectToolcraftVerificationInputs(rootDir);
  if (receipt.sourceHash !== inventory.sourceHash) {
    return [
      "Toolcraft delivery receipt is stale because product or verification inputs changed after delivery.",
    ];
  }
  if (isToolcraftTargetedDeliveryMode(receipt.mode)) {
    const expectedChangedFiles = getChangedFiles(
      receipt.comparisonFiles,
      receipt.files,
    );
    if (!arraysEqual(receipt.changedFiles, expectedChangedFiles)) {
      return [
        `Toolcraft ${receipt.mode} delivery changed-file evidence does not match its comparison anchor.`,
      ];
    }
    let context;
    try {
      context = await getToolcraftTargetedVerificationContext({
        comparisonInventory: {
          entries: receipt.comparisonFiles,
          sourceHash: receipt.comparisonSourceHash,
        },
        rootDir,
      });
    } catch (error) {
      return [error instanceof Error ? error.message : String(error)];
    }
    const impactError = getToolcraftTargetedImpactVerificationError(
      receipt.verification,
      receipt.verificationTier,
      context.impact,
    );
    if (impactError) return [impactError];
  }
  return [];
}
