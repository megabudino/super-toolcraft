import { readToolcraftDurablePerformanceBaseline } from "./toolcraft-verification-receipt-core.mjs";

function hasBaselineLinkage(receipt) {
  return (
    receipt.baselineSourceHash !== undefined ||
    receipt.baselineEvidenceHash !== undefined
  );
}

export async function getToolcraftDeliveryBaselineError({ receipt, rootDir }) {
  const baseline = await readToolcraftDurablePerformanceBaseline(rootDir);
  const receiptHasBaseline = hasBaselineLinkage(receipt);

  if (baseline.missing) {
    return receiptHasBaseline
      ? "Toolcraft delivery receipt references a missing durable baseline."
      : undefined;
  }
  if (baseline.error) return baseline.error;
  if (!receiptHasBaseline) {
    return "Toolcraft delivery receipt omits the existing durable baseline.";
  }
  if (
    receipt.baselineSourceHash !== baseline.receipt.sourceHash ||
    receipt.baselineEvidenceHash !== baseline.receipt.performanceEvidence.reportHash
  ) {
    return "Toolcraft delivery receipt does not match the durable performance baseline.";
  }
  if (
    receipt.mode === "explicit-performance" &&
    baseline.receipt.checkpointReason !== "explicit-performance-work"
  ) {
    return "Toolcraft explicit performance delivery requires an explicit-performance-work durable baseline.";
  }
  return undefined;
}
