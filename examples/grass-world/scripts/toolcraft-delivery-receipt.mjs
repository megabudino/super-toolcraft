import fs from "node:fs/promises";
import path from "node:path";

import { getToolcraftPerformanceIterationVerificationError } from "./toolcraft-performance-receipt-policy.mjs";
import {
  getChangedFiles,
  getToolcraftTargetedImpactVerificationError,
  getToolcraftTargetedVerificationContext,
  readToolcraftDurablePerformanceBaseline,
} from "./toolcraft-verification-receipt.mjs";
import {
  collectToolcraftVerificationInputs,
  createToolcraftVerificationSourceHash,
} from "./toolcraft-verification-inventory.mjs";

export const TOOLCRAFT_DELIVERY_RECEIPT_VERSION = 1;
const aggregateChecks = [
  "integrity",
  "ai-check",
  "test",
  "build",
  "playwright-functional",
  "playwright-performance",
];
const acceptedModes = new Set([
  "explicit-performance",
  "first-stable",
  "ordinary",
]);

function arraysEqual(left, right) {
  return (
    left.length === right.length &&
    left.every((item, index) => item === right[index])
  );
}

function isInventoryEntry(value) {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof value.path === "string" &&
    /^[a-f0-9]{64}$/u.test(value.sha256 ?? "")
  );
}

function hasExactAggregateChecks(checks) {
  return arraysEqual(checks, aggregateChecks);
}

export function getToolcraftDeliveryReceiptPath(rootDir) {
  return path.join(
    path.resolve(rootDir),
    ".toolcraft",
    "verification",
    "delivery.json",
  );
}

export function getToolcraftDeliveryReceiptShapeError(receipt) {
  if (
    typeof receipt !== "object" ||
    receipt === null ||
    Array.isArray(receipt) ||
    receipt.version !== TOOLCRAFT_DELIVERY_RECEIPT_VERSION ||
    receipt.kind !== "delivery-verification" ||
    receipt.runner !== "protected-delivery" ||
    receipt.status !== "passed" ||
    !acceptedModes.has(receipt.mode) ||
    typeof receipt.completedAt !== "string" ||
    !/^[a-f0-9]{64}$/u.test(receipt.sourceHash ?? "") ||
    !/^[a-f0-9]{64}$/u.test(receipt.baselineSourceHash ?? "") ||
    !/^[a-f0-9]{64}$/u.test(receipt.baselineEvidenceHash ?? "") ||
    !Array.isArray(receipt.files) ||
    !receipt.files.every(isInventoryEntry) ||
    createToolcraftVerificationSourceHash(receipt.files) !== receipt.sourceHash ||
    !Array.isArray(receipt.checks) ||
    !receipt.checks.every((check) => typeof check === "string")
  ) {
    return "Toolcraft delivery receipt is malformed or uses an unsupported version.";
  }
  if (receipt.mode !== "ordinary") {
    return hasExactAggregateChecks(receipt.checks)
      ? undefined
      : "Toolcraft aggregate delivery receipt does not prove the complete functional and performance gate.";
  }
  if (
    !Number.isInteger(receipt.verificationTier) ||
    receipt.verificationTier < 0 ||
    receipt.verificationTier > 4 ||
    !/^[a-f0-9]{64}$/u.test(receipt.comparisonSourceHash ?? "") ||
    !Array.isArray(receipt.comparisonFiles) ||
    !receipt.comparisonFiles.every(isInventoryEntry) ||
    createToolcraftVerificationSourceHash(receipt.comparisonFiles) !==
      receipt.comparisonSourceHash ||
    !Array.isArray(receipt.changedFiles) ||
    !receipt.changedFiles.every((item) => typeof item === "string")
  ) {
    return "Toolcraft ordinary delivery receipt comparison evidence is malformed.";
  }
  const verificationError = getToolcraftPerformanceIterationVerificationError(
    receipt.verification,
    receipt.verificationTier,
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
    : "Toolcraft ordinary delivery checks do not match its targeted verification evidence.";
}

export async function readToolcraftDeliveryReceipt(rootDir) {
  let source;
  try {
    source = await fs.readFile(getToolcraftDeliveryReceiptPath(rootDir), "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return { missing: true };
    throw error;
  }
  let receipt;
  try {
    receipt = JSON.parse(source);
  } catch {
    return { error: "Toolcraft delivery receipt is malformed JSON." };
  }
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
  const baseline = await readToolcraftDurablePerformanceBaseline(rootDir);
  if (baseline.error) return [baseline.error];
  if (
    receipt.baselineSourceHash !== baseline.receipt.sourceHash ||
    receipt.baselineEvidenceHash !== baseline.receipt.performanceEvidence.reportHash
  ) {
    return [
      "Toolcraft delivery receipt does not match the durable performance baseline.",
    ];
  }

  const inventory = await collectToolcraftVerificationInputs(rootDir);
  if (receipt.sourceHash !== inventory.sourceHash) {
    return [
      "Toolcraft delivery receipt is stale because product or verification inputs changed after delivery.",
    ];
  }
  if (receipt.mode === "ordinary") {
    const expectedChangedFiles = getChangedFiles(
      receipt.comparisonFiles,
      receipt.files,
    );
    if (!arraysEqual(receipt.changedFiles, expectedChangedFiles)) {
      return [
        "Toolcraft ordinary delivery changed-file evidence does not match its comparison anchor.",
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
