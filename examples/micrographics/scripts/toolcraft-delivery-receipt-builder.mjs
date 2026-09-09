import {
  TOOLCRAFT_DELIVERY_RECEIPT_VERSION,
  TOOLCRAFT_FULL_PERFORMANCE_DELIVERY_CHECKS,
  TOOLCRAFT_PROTOTYPE_DELIVERY_CHECKS,
  getToolcraftDeliveryReceiptShapeError,
  isToolcraftTargetedDeliveryMode,
} from "./toolcraft-delivery-receipt.mjs";
import { TOOLCRAFT_PERFORMANCE_RECEIPT_VERSION } from "./toolcraft-performance-receipt-policy.mjs";

function assertDeliveryReceiptShape(receipt) {
  const shapeError = getToolcraftDeliveryReceiptShapeError(receipt);
  if (shapeError) throw new Error(shapeError);
  return receipt;
}

export function createPrototypeDeliveryReceipt({ inventory, smokeEvidence }) {
  return assertDeliveryReceiptShape({
    checks: [...TOOLCRAFT_PROTOTYPE_DELIVERY_CHECKS],
    completedAt: new Date().toISOString(),
    files: inventory.entries,
    kind: "delivery-verification",
    mode: "prototype",
    runner: "protected-delivery",
    smokeEvidence,
    sourceHash: inventory.sourceHash,
    status: "passed",
    version: TOOLCRAFT_DELIVERY_RECEIPT_VERSION,
  });
}

export function createExplicitPerformanceDeliveryReceipt({
  baseline,
  inventory,
}) {
  return assertDeliveryReceiptShape({
    baselineEvidenceHash: baseline.performanceEvidence.reportHash,
    baselineSourceHash: baseline.sourceHash,
    checks: [...TOOLCRAFT_FULL_PERFORMANCE_DELIVERY_CHECKS],
    completedAt: new Date().toISOString(),
    files: inventory.entries,
    kind: "delivery-verification",
    mode: "explicit-performance",
    runner: "protected-delivery",
    sourceHash: inventory.sourceHash,
    status: "passed",
    version: TOOLCRAFT_DELIVERY_RECEIPT_VERSION,
  });
}

export function createTargetedDeliveryReceipt({
  baseline,
  comparisonReceipt,
  mode,
  result,
}) {
  if (!isToolcraftTargetedDeliveryMode(mode)) {
    throw new Error("Toolcraft targeted delivery mode is unsupported.");
  }
  return assertDeliveryReceiptShape({
    ...(baseline?.receipt
      ? {
          baselineEvidenceHash:
            baseline.receipt.performanceEvidence.reportHash,
          baselineSourceHash: baseline.receipt.sourceHash,
        }
      : {}),
    changedFiles: result.context.changedFiles,
    checks: ["integrity", "ai-check", "docs-check", ...result.verification.checks],
    comparisonFiles: comparisonReceipt.files,
    comparisonSourceHash: comparisonReceipt.sourceHash,
    completedAt: new Date().toISOString(),
    files: result.verifiedInventory.entries,
    kind: "delivery-verification",
    mode,
    runner: "protected-delivery",
    sourceHash: result.verifiedInventory.sourceHash,
    status: "passed",
    verification: result.verification,
    verificationTier: result.verificationTier,
    version: TOOLCRAFT_DELIVERY_RECEIPT_VERSION,
  });
}

export function createPerformanceCheckpointReceipt({ evidence, inventory }) {
  return {
    checkpointReason: "explicit-performance-work",
    completedAt: new Date().toISOString(),
    files: inventory.entries,
    kind: "performance-checkpoint",
    performanceEvidence: evidence,
    runner: "protected-playwright",
    sourceHash: inventory.sourceHash,
    status: "passed",
    version: TOOLCRAFT_PERFORMANCE_RECEIPT_VERSION,
  };
}

function receiptHasBaselineLinkage(receipt) {
  return (
    receipt.baselineSourceHash !== undefined ||
    receipt.baselineEvidenceHash !== undefined
  );
}

export function assertOptionalBaselineCoherence({ baseline, delivery }) {
  if (baseline.error && !baseline.missing) throw new Error(baseline.error);
  if (delivery.error) throw new Error(delivery.error);

  const receipt = delivery.receipt;
  const hasLinkage = receiptHasBaselineLinkage(receipt);
  if (baseline.missing) {
    if (hasLinkage) {
      throw new Error(
        "Toolcraft delivery receipt references a missing durable performance baseline.",
      );
    }
    return;
  }

  if (
    !hasLinkage ||
    receipt.baselineSourceHash !== baseline.receipt.sourceHash ||
    receipt.baselineEvidenceHash !==
      baseline.receipt.performanceEvidence.reportHash
  ) {
    throw new Error(
      "Toolcraft delivery receipt does not match the durable performance baseline. An operator must run pnpm verify:perf to restore one coherent delivery state.",
    );
  }
}
