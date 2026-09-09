import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  readToolcraftCheckpointBundle,
  writeToolcraftCheckpointBundle,
} from "./toolcraft-checkpoint-bundle.mjs";
import { TOOLCRAFT_PROTOTYPE_DELIVERY_CHECKS } from "./toolcraft-delivery-receipt.mjs";
import { writeDeliveryReceiptFixture } from "./toolcraft-delivery-receipt-test-helpers.mjs";
import {
  collectToolcraftVerificationInputs,
} from "./toolcraft-verification-receipt.mjs";
import * as receiptModule from "./toolcraft-verification-receipt.mjs";
import {
  createIterationVerification,
  createPerformanceSmokeEvidenceFixture,
  createReceiptFixture,
  writePassedCheckpointFixture,
} from "./toolcraft-verification-receipt-test-helpers.mjs";

test("does not expose a reusable passed-checkpoint writer", () => {
  assert.equal("writeToolcraftPerformanceReceipt" in receiptModule, false);
});

test("full performance recovery points only to the operator command", async (t) => {
  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));

  assert.deepEqual(await receiptModule.readToolcraftDurablePerformanceBaseline(rootDir), {
    error:
      "Toolcraft performance baseline receipt is missing. An operator must run pnpm verify:perf to create one.",
    missing: true,
  });
  assert.deepEqual(await receiptModule.validateToolcraftPerformanceReceipt({ rootDir }), [
    "Toolcraft performance receipt is missing. An operator must run pnpm verify:perf to create a full checkpoint before targeted iteration evidence can be recorded.",
  ]);
});

test("verify receipt accepts baseline-free prototype delivery authority", async (t) => {
  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  const inventory = await collectToolcraftVerificationInputs(rootDir);
  await writeDeliveryReceiptFixture(rootDir, {
    checks: [...TOOLCRAFT_PROTOTYPE_DELIVERY_CHECKS],
    completedAt: "2026-07-20T00:00:00.000Z",
    files: inventory.entries,
    kind: "delivery-verification",
    mode: "prototype",
    runner: "protected-delivery",
    smokeEvidence: createPerformanceSmokeEvidenceFixture(inventory.sourceHash),
    sourceHash: inventory.sourceHash,
    status: "passed",
    version: 2,
  });

  assert.equal(typeof receiptModule.validateToolcraftVerificationReceipt, "function");
  assert.deepEqual(
    await receiptModule.validateToolcraftVerificationReceipt({ rootDir }),
    [],
  );
});

test("verify receipt strictly validates linked current performance authority", async (t) => {
  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  const baseline = await writePassedCheckpointFixture(rootDir, {
    checkpointReason: "explicit-performance-work",
  });
  await writeDeliveryReceiptFixture(rootDir, {
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
    completedAt: "2026-07-20T00:00:00.000Z",
    files: baseline.files,
    kind: "delivery-verification",
    mode: "explicit-performance",
    runner: "protected-delivery",
    sourceHash: baseline.sourceHash,
    status: "passed",
    version: 2,
  });

  assert.deepEqual(
    await receiptModule.validateToolcraftVerificationReceipt({ rootDir }),
    [],
  );
  const loaded = await readToolcraftCheckpointBundle(rootDir);
  const current = loaded.bundle.currentPerformance;
  current.performanceEvidence.reportHash = "f".repeat(64);
  await writeToolcraftCheckpointBundle({
    bundle: { ...loaded.bundle, currentPerformance: current },
    rootDir,
  });
  assert.match(
    (await receiptModule.validateToolcraftVerificationReceipt({ rootDir }))[0],
    /current performance|baseline|evidence|match/iu,
  );
});

test("verify receipt accepts ordinary delivery linked to historical full authority", async (t) => {
  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  const baseline = await writePassedCheckpointFixture(rootDir, {
    checkpointReason: "explicit-performance-work",
  });
  await fs.writeFile(
    path.join(rootDir, "src", "app", "app-schema.ts"),
    'export const schema = { mode: "ordinary-after-baseline" };\n',
  );
  const inventory = await collectToolcraftVerificationInputs(rootDir);
  const verification = createIterationVerification(2);
  await writeDeliveryReceiptFixture(rootDir, {
    baselineEvidenceHash: baseline.performanceEvidence.reportHash,
    baselineSourceHash: baseline.sourceHash,
    changedFiles: receiptModule.getChangedFiles(baseline.files, inventory.entries),
    checks: ["integrity", "ai-check", "docs-check", ...verification.checks],
    comparisonFiles: baseline.files,
    comparisonSourceHash: baseline.sourceHash,
    completedAt: "2026-07-20T00:00:00.000Z",
    files: inventory.entries,
    kind: "delivery-verification",
    mode: "ordinary",
    runner: "protected-delivery",
    sourceHash: inventory.sourceHash,
    status: "passed",
    verification,
    verificationTier: 2,
    version: 2,
  });

  assert.deepEqual(
    await receiptModule.validateToolcraftVerificationReceipt({ rootDir }),
    [],
  );
  const loaded = await readToolcraftCheckpointBundle(rootDir);
  await writeToolcraftCheckpointBundle({
    bundle: { ...loaded.bundle, currentPerformance: null },
    rootDir,
  });
  assert.match(
    (await receiptModule.validateToolcraftVerificationReceipt({ rootDir }))[0],
    /current performance receipt is missing/iu,
  );
});
