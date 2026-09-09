import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  TOOLCRAFT_PROTOTYPE_DELIVERY_CHECKS,
  getToolcraftDeliveryReceiptShapeError,
  validateToolcraftDeliveryReceipt,
} from "./toolcraft-delivery-receipt.mjs";
import {
  createExplicitPerformanceDeliveryReceipt,
  writeDeliveryReceiptFixture,
} from "./toolcraft-delivery-receipt-test-helpers.mjs";
import { collectToolcraftVerificationInputs } from "./toolcraft-verification-receipt.mjs";
import {
  createPerformanceSmokeEvidenceFixture,
  createReceiptFixture,
  writePassedCheckpointFixture,
} from "./toolcraft-verification-receipt-test-helpers.mjs";

test("accepts explicit performance only with full checks and matching baseline", async (t) => {
  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  const baseline = await writePassedCheckpointFixture(rootDir, {
    checkpointReason: "explicit-performance-work",
  });
  const inventory = await collectToolcraftVerificationInputs(rootDir);
  const receipt = createExplicitPerformanceDeliveryReceipt(inventory, baseline);

  assert.equal(getToolcraftDeliveryReceiptShapeError(receipt), undefined);
  await writeDeliveryReceiptFixture(rootDir, receipt);
  assert.deepEqual(await validateToolcraftDeliveryReceipt({ rootDir }), []);
  assert.match(
    getToolcraftDeliveryReceiptShapeError({
      ...receipt,
      checks: [...TOOLCRAFT_PROTOTYPE_DELIVERY_CHECKS],
      smokeEvidence: createPerformanceSmokeEvidenceFixture(inventory.sourceHash),
    }),
    /performance|smoke|malformed|unsupported/iu,
  );
});

test("explicit performance rejects a stale baseline for changed current source", async (t) => {
  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  const baseline = await writePassedCheckpointFixture(rootDir, {
    checkpointReason: "explicit-performance-work",
  });
  await fs.writeFile(
    path.join(rootDir, "src", "app", "app-schema.ts"),
    'export const schema = { mode: "changed-after-baseline" };\n',
  );
  const inventory = await collectToolcraftVerificationInputs(rootDir);
  const receipt = createExplicitPerformanceDeliveryReceipt(inventory, baseline);

  assert.match(
    getToolcraftDeliveryReceiptShapeError(receipt),
    /baseline.*current source|source.*baseline/iu,
  );
  await writeDeliveryReceiptFixture(rootDir, receipt);
  assert.match(
    (await validateToolcraftDeliveryReceipt({ rootDir }))[0],
    /baseline.*current source|source.*baseline/iu,
  );
});

test("explicit performance rejects legacy first-working baseline authority", async (t) => {
  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  const baseline = await writePassedCheckpointFixture(rootDir);
  const inventory = await collectToolcraftVerificationInputs(rootDir);
  await writeDeliveryReceiptFixture(
    rootDir,
    createExplicitPerformanceDeliveryReceipt(inventory, baseline),
  );

  assert.match(
    (await validateToolcraftDeliveryReceipt({ rootDir }))[0],
    /explicit-performance-work/iu,
  );
});

test("baseline-linked delivery rejects missing and mismatched durable authority", async (t) => {
  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  const inventory = await collectToolcraftVerificationInputs(rootDir);
  const missingBaselineReceipt = createExplicitPerformanceDeliveryReceipt(
    inventory,
    {
      performanceEvidence: { reportHash: "a".repeat(64) },
      sourceHash: inventory.sourceHash,
    },
  );
  await writeDeliveryReceiptFixture(rootDir, missingBaselineReceipt);
  assert.match(
    (await validateToolcraftDeliveryReceipt({ rootDir }))[0],
    /references a missing durable baseline/iu,
  );

  const baseline = await writePassedCheckpointFixture(rootDir);
  await writeDeliveryReceiptFixture(rootDir, {
    ...createExplicitPerformanceDeliveryReceipt(inventory, baseline),
    baselineEvidenceHash: "0".repeat(64),
  });
  assert.match(
    (await validateToolcraftDeliveryReceipt({ rootDir }))[0],
    /does not match the durable performance baseline/iu,
  );
});
