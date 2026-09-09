import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";

import {
  TOOLCRAFT_DELIVERY_RECEIPT_VERSION,
  createToolcraftDeliveryReceipt,
  getToolcraftDeliveryReceiptShapeError,
  validateToolcraftDeliveryReceipt,
} from "./toolcraft-delivery-receipt.mjs";
import {
  createPlanReceiptFixture,
  writeDeliveryReceiptFixture,
} from "./toolcraft-delivery-receipt-test-helpers.mjs";
import { createReceiptFixture } from "./toolcraft-verification-receipt-test-helpers.mjs";

function assertDeeplyFrozen(value) {
  if (!value || typeof value !== "object") return;
  assert.equal(Object.isFrozen(value), true);
  Object.values(value).forEach(assertDeeplyFrozen);
}

test("constructs the exact deeply frozen version 5 receipt", () => {
  const { plan, result } = createPlanReceiptFixture();
  const receipt = createToolcraftDeliveryReceipt({ plan, result });

  assert.equal(TOOLCRAFT_DELIVERY_RECEIPT_VERSION, 5);
  assert.deepEqual(Object.keys(receipt).sort(), [
    "completedAt",
    "evidence",
    "files",
    "kind",
    "manifestHash",
    "plan",
    "planHash",
    "planVersion",
    "runner",
    "sourceHash",
    "status",
    "version",
  ]);
  assert.equal(receipt.plan, plan);
  assert.deepEqual(receipt.evidence, result.evidence);
  assert.deepEqual(receipt.files, result.finalInventory.entries);
  assert.equal(getToolcraftDeliveryReceiptShapeError(receipt), undefined);
  assertDeeplyFrozen(receipt);
});

test("constructs prototype proof with exact combined smoke evidence", () => {
  const fixture = createPlanReceiptFixture("prototype");
  const receipt = createToolcraftDeliveryReceipt(fixture);

  assert.equal(getToolcraftDeliveryReceiptShapeError(receipt), undefined);
  assert.deepEqual(
    receipt.evidence.at(-1),
    fixture.result.evidence.at(-1),
  );
});

test("validates only the current receipt source and ignores full-performance state", async (t) => {
  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  const { plan, result } = createPlanReceiptFixture();
  const receipt = createToolcraftDeliveryReceipt({ plan, result });
  await writeDeliveryReceiptFixture(rootDir, receipt);

  const bundlePath = `${rootDir}/.toolcraft/verification/checkpoint.json`;
  const bundle = JSON.parse(await fs.readFile(bundlePath, "utf8"));
  bundle.currentPerformance = { malformed: true };
  bundle.performanceBaseline = { malformed: true };
  await fs.writeFile(bundlePath, `${JSON.stringify(bundle)}\n`);

  assert.deepEqual(await validateToolcraftDeliveryReceipt({
    collectInventory: async () => result.finalInventory,
    rootDir,
  }), []);
  assert.deepEqual(await validateToolcraftDeliveryReceipt({
    collectInventory: async () => ({
      ...result.finalInventory,
      sourceHash: "0".repeat(64),
    }),
    rootDir,
  }), ["Toolcraft delivery receipt is stale for the current source."]);
});

test("rejects excess fields outside the plan-backed receipt model", () => {
  const fixture = createPlanReceiptFixture();
  const receipt = createToolcraftDeliveryReceipt(fixture);
  for (const extra of [
    { unexpectedAuthority: true },
    { mode: "ordinary" },
    { baselineSourceHash: "a".repeat(64) },
    { baselineEvidenceHash: "b".repeat(64) },
    { checks: ["docs"] },
    { changedFiles: [] },
  ]) {
    assert.match(
      getToolcraftDeliveryReceiptShapeError({ ...receipt, ...extra }),
      /malformed|unsupported fields/iu,
    );
  }
});
