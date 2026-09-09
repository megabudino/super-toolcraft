import { readToolcraftCheckpointBundle } from "./toolcraft-checkpoint-bundle.mjs";
import { getToolcraftPerformanceReceiptShapeError } from "./toolcraft-performance-receipt-policy.mjs";
import {
  readToolcraftDurablePerformanceBaseline,
  validateToolcraftPerformanceReceipt,
} from "./toolcraft-verification-receipt-core.mjs";

export function hasToolcraftDeliveryBaselineLinkage(receipt) {
  return (
    receipt.baselineSourceHash !== undefined ||
    receipt.baselineEvidenceHash !== undefined
  );
}

export async function validateToolcraftLinkedPerformanceAuthority({
  deliveryReceipt,
  rootDir,
}) {
  const loaded = await readToolcraftCheckpointBundle(rootDir);
  if (loaded.error) return [loaded.error];
  if (loaded.missing || loaded.bundle.currentPerformance === null) {
    return [
      "Toolcraft current performance receipt is missing for a baseline-linked delivery.",
    ];
  }
  const current = loaded.bundle.currentPerformance;
  const shapeError = getToolcraftPerformanceReceiptShapeError(current);
  if (shapeError) return [shapeError];

  const baseline = await readToolcraftDurablePerformanceBaseline(rootDir);
  if (baseline.error) return [baseline.error];
  if (
    deliveryReceipt.baselineSourceHash !== baseline.receipt.sourceHash ||
    deliveryReceipt.baselineEvidenceHash !==
      baseline.receipt.performanceEvidence.reportHash
  ) {
    return [
      "Toolcraft delivery receipt does not match the durable performance baseline.",
    ];
  }

  if (current.kind === "performance-checkpoint") {
    if (
      current.sourceHash !== baseline.receipt.sourceHash ||
      current.performanceEvidence.reportHash !==
        baseline.receipt.performanceEvidence.reportHash
    ) {
      return [
        "Toolcraft current performance checkpoint does not match the durable performance baseline.",
      ];
    }
    if (
      deliveryReceipt.mode === "explicit-performance" &&
      current.sourceHash !== deliveryReceipt.sourceHash
    ) {
      return [
        "Toolcraft current performance checkpoint does not match the explicit delivery source.",
      ];
    }
    return [];
  }

  if (
    current.baselineSourceHash !== baseline.receipt.sourceHash ||
    current.baselineEvidenceHash !==
      baseline.receipt.performanceEvidence.reportHash
  ) {
    return [
      "Toolcraft current performance iteration does not match the durable baseline authority.",
    ];
  }
  if (current.sourceHash !== deliveryReceipt.sourceHash) {
    return [
      "Toolcraft current performance iteration does not match the delivery source.",
    ];
  }
  return validateToolcraftPerformanceReceipt({ rootDir });
}
