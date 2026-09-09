import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  TOOLCRAFT_DELIVERY_RECEIPT_VERSION,
  TOOLCRAFT_FULL_PERFORMANCE_DELIVERY_CHECKS,
} from "./toolcraft-delivery-receipt.mjs";
import {
  TOOLCRAFT_PERFORMANCE_RECEIPT_VERSION,
  collectToolcraftVerificationInputs,
} from "./toolcraft-verification-receipt.mjs";
import {
  createPerformanceEvidenceFixture,
  createReceiptFixture,
} from "./toolcraft-verification-receipt-test-helpers.mjs";

export async function createCheckpointFixture() {
  const rootDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "toolcraft-checkpoint-transaction-"),
  );
  const verificationDir = path.join(rootDir, ".toolcraft", "verification");
  await fs.mkdir(verificationDir, { recursive: true });
  return { rootDir, verificationDir };
}

export async function createExplicitCheckpointFixture() {
  const rootDir = await createReceiptFixture();
  const inventory = await collectToolcraftVerificationInputs(rootDir);
  const performanceCheckpoint = {
    checkpointReason: "explicit-performance-work",
    completedAt: "2026-07-20T00:00:00.000Z",
    files: inventory.entries,
    kind: "performance-checkpoint",
    performanceEvidence: createPerformanceEvidenceFixture(),
    runner: "protected-playwright",
    sourceHash: inventory.sourceHash,
    status: "passed",
    version: TOOLCRAFT_PERFORMANCE_RECEIPT_VERSION,
  };
  const deliveryReceipt = {
    baselineEvidenceHash:
      performanceCheckpoint.performanceEvidence.reportHash,
    baselineSourceHash: performanceCheckpoint.sourceHash,
    checks: [...TOOLCRAFT_FULL_PERFORMANCE_DELIVERY_CHECKS],
    completedAt: "2026-07-20T00:00:00.000Z",
    files: inventory.entries,
    kind: "delivery-verification",
    mode: "explicit-performance",
    runner: "protected-delivery",
    sourceHash: inventory.sourceHash,
    status: "passed",
    version: TOOLCRAFT_DELIVERY_RECEIPT_VERSION,
  };
  return { deliveryReceipt, performanceCheckpoint, rootDir };
}
