import {
  getToolcraftDeliveryReceiptShapeError,
  isToolcraftTargetedDeliveryMode,
} from "./toolcraft-delivery-receipt.mjs";
import { getToolcraftPerformanceReceiptShapeError } from "./toolcraft-performance-receipt-policy.mjs";
import {
  assertToolcraftVerificationInputsUnchanged,
  collectToolcraftVerificationInputs,
  getToolcraftTargetedImpactVerificationError,
  getToolcraftTargetedVerificationContext,
} from "./toolcraft-verification-receipt.mjs";

function assertPerformanceCheckpointShape(receipt, label) {
  const shapeError = getToolcraftPerformanceReceiptShapeError(receipt);
  if (shapeError) throw new Error(`${label}: ${shapeError}`);
  if (receipt.kind !== "performance-checkpoint") {
    throw new Error(`${label} must be a protected performance checkpoint.`);
  }
}

function hasBaselineLinkage(receipt) {
  return (
    receipt.baselineSourceHash !== undefined ||
    receipt.baselineEvidenceHash !== undefined
  );
}

function inventoriesEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function assertTargetedComparisonAnchor({
  deliveryReceipt,
  previousDeliveryReceipt,
}) {
  if (!isToolcraftTargetedDeliveryMode(deliveryReceipt.mode)) return;
  const previousShapeError = getToolcraftDeliveryReceiptShapeError(
    previousDeliveryReceipt,
  );
  if (
    previousShapeError ||
    deliveryReceipt.comparisonSourceHash !==
      previousDeliveryReceipt.sourceHash ||
    !inventoriesEqual(
      deliveryReceipt.comparisonFiles,
      previousDeliveryReceipt.files,
    )
  ) {
    throw new Error(
      "Toolcraft targeted delivery comparison must match the immediately previous successful delivery.",
    );
  }
}

function assertBaselineLinkage({ baselineReceipt, deliveryReceipt }) {
  const hasLinkage = hasBaselineLinkage(deliveryReceipt);
  if (baselineReceipt === undefined) {
    if (hasLinkage) {
      throw new Error(
        "Toolcraft delivery receipt references a missing durable performance baseline.",
      );
    }
    return;
  }
  if (
    !hasLinkage ||
    deliveryReceipt.baselineSourceHash !== baselineReceipt.sourceHash ||
    deliveryReceipt.baselineEvidenceHash !==
      baselineReceipt.performanceEvidence.reportHash
  ) {
    throw new Error(
      "Toolcraft delivery receipt does not match its durable performance baseline.",
    );
  }
  if (
    deliveryReceipt.mode === "explicit-performance" &&
    baselineReceipt.checkpointReason !== "explicit-performance-work"
  ) {
    throw new Error(
      "Toolcraft explicit performance delivery requires an explicit-performance-work baseline.",
    );
  }
}

export async function assertDeliveryCheckpointState({
  baselineReceipt,
  currentPerformanceReceipt,
  deliveryReceipt,
  previousDeliveryReceipt,
  projectDir,
  writesPerformanceCheckpoint,
}) {
  const deliveryShapeError =
    getToolcraftDeliveryReceiptShapeError(deliveryReceipt);
  if (deliveryShapeError) throw new Error(deliveryShapeError);

  if (baselineReceipt !== undefined) {
    assertPerformanceCheckpointShape(
      baselineReceipt,
      "Toolcraft performance baseline",
    );
  }
  if (writesPerformanceCheckpoint) {
    assertPerformanceCheckpointShape(
      currentPerformanceReceipt,
      "Toolcraft current performance receipt",
    );
    if (deliveryReceipt.mode !== "explicit-performance") {
      throw new Error(
        "Toolcraft performance checkpoints may only be committed by an explicit performance delivery.",
      );
    }
    if (
      currentPerformanceReceipt.sourceHash !== baselineReceipt.sourceHash ||
      currentPerformanceReceipt.performanceEvidence.reportHash !==
        baselineReceipt.performanceEvidence.reportHash
    ) {
      throw new Error(
        "Toolcraft current performance receipt does not match its baseline.",
      );
    }
  } else if (deliveryReceipt.mode === "explicit-performance") {
    throw new Error(
      "Toolcraft explicit performance delivery requires a measured performance checkpoint.",
    );
  }

  assertBaselineLinkage({ baselineReceipt, deliveryReceipt });
  assertTargetedComparisonAnchor({
    deliveryReceipt,
    previousDeliveryReceipt,
  });
  const inventory = await collectToolcraftVerificationInputs(projectDir);
  assertToolcraftVerificationInputsUnchanged({
    baseline: {
      entries: deliveryReceipt.files,
      sourceHash: deliveryReceipt.sourceHash,
    },
    current: inventory,
    phase: "while committing delivery authority",
  });

  if (isToolcraftTargetedDeliveryMode(deliveryReceipt.mode)) {
    const context = await getToolcraftTargetedVerificationContext({
      comparisonInventory: {
        entries: deliveryReceipt.comparisonFiles,
        sourceHash: deliveryReceipt.comparisonSourceHash,
      },
      rootDir: projectDir,
    });
    const impactError = getToolcraftTargetedImpactVerificationError(
      deliveryReceipt.verification,
      deliveryReceipt.verificationTier,
      context.impact,
    );
    if (impactError) throw new Error(impactError);
  }
}
