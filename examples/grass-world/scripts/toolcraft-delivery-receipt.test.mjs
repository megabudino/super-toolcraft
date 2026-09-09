import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";

import { getToolcraftDeliveryReceiptShapeError } from "./toolcraft-delivery-receipt.mjs";
import { collectToolcraftVerificationInputs } from "./toolcraft-verification-receipt.mjs";
import {
  createReceiptFixture,
  writePassedCheckpointFixture,
} from "./toolcraft-verification-receipt-test-helpers.mjs";

test("does not expose a reusable passed-delivery writer", async () => {
  const module = await import("./toolcraft-delivery-receipt.mjs");
  assert.equal("writeToolcraftDeliveryReceipt" in module, false);
});

test("rejects aggregate receipts that omit a required delivery check", async () => {
  const rootDir = await createReceiptFixture();
  try {
    const baseline = await writePassedCheckpointFixture(rootDir);
    const inventory = await collectToolcraftVerificationInputs(rootDir);
    const receipt = {
      baselineEvidenceHash: baseline.performanceEvidence.reportHash,
      baselineSourceHash: baseline.sourceHash,
      checks: [
        "integrity",
        "ai-check",
        "test",
        "build",
        "playwright-functional",
        "playwright-performance",
      ],
      completedAt: new Date().toISOString(),
      files: inventory.entries,
      kind: "delivery-verification",
      mode: "first-stable",
      runner: "protected-delivery",
      sourceHash: inventory.sourceHash,
      status: "passed",
      version: 1,
    };
    receipt.checks.pop();

    assert.match(
      getToolcraftDeliveryReceiptShapeError(receipt),
      /does not prove the complete functional and performance gate/iu,
    );
  } finally {
    await fs.rm(rootDir, { force: true, recursive: true });
  }
});
