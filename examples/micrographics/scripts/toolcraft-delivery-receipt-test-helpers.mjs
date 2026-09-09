import {
  TOOLCRAFT_DELIVERY_RECEIPT_VERSION,
  TOOLCRAFT_FULL_PERFORMANCE_DELIVERY_CHECKS,
  TOOLCRAFT_PROTOTYPE_DELIVERY_CHECKS,
} from "./toolcraft-delivery-receipt.mjs";
import {
  createToolcraftCheckpointBundle,
  readToolcraftCheckpointBundle,
  writeToolcraftCheckpointBundle,
} from "./toolcraft-checkpoint-bundle.mjs";
import {
  createIterationVerification,
  createPerformanceSmokeEvidenceFixture,
} from "./toolcraft-verification-receipt-test-helpers.mjs";

export function createCommonDeliveryReceipt(inventory, overrides = {}) {
  return {
    checks: [...TOOLCRAFT_PROTOTYPE_DELIVERY_CHECKS],
    completedAt: "2026-07-20T00:00:00.000Z",
    files: inventory.entries,
    kind: "delivery-verification",
    mode: "prototype",
    runner: "protected-delivery",
    sourceHash: inventory.sourceHash,
    status: "passed",
    version: TOOLCRAFT_DELIVERY_RECEIPT_VERSION,
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
  const verification = createIterationVerification(verificationTier);
  return createCommonDeliveryReceipt(inventory, {
    changedFiles: [],
    checks: ["integrity", "ai-check", "docs-check", ...verification.checks],
    comparisonFiles: comparisonInventory.entries,
    comparisonSourceHash: comparisonInventory.sourceHash,
    mode: "ordinary",
    verification,
    verificationTier,
    ...(baseline
      ? {
          baselineEvidenceHash: baseline.performanceEvidence.reportHash,
          baselineSourceHash: baseline.sourceHash,
        }
      : {}),
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
    checks: [...TOOLCRAFT_FULL_PERFORMANCE_DELIVERY_CHECKS],
    mode: "explicit-performance",
    ...overrides,
  });
}

export async function writeDeliveryReceiptFixture(rootDir, receipt) {
  const loaded = await readToolcraftCheckpointBundle(rootDir);
  if (loaded.error) throw new Error(loaded.error);
  const bundle = loaded.missing
    ? createToolcraftCheckpointBundle({ delivery: receipt })
    : { ...loaded.bundle, delivery: receipt };
  await writeToolcraftCheckpointBundle({ bundle, rootDir });
}
