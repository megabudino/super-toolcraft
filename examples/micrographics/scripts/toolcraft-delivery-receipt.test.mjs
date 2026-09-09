import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";

import {
  TOOLCRAFT_DELIVERY_RECEIPT_VERSION,
  TOOLCRAFT_FULL_PERFORMANCE_DELIVERY_CHECKS,
  TOOLCRAFT_PROTOTYPE_DELIVERY_CHECKS,
  getToolcraftDeliveryReceiptShapeError,
  validateToolcraftDeliveryReceipt,
} from "./toolcraft-delivery-receipt.mjs";
import {
  createOrdinaryDeliveryReceipt,
  createPrototypeDeliveryReceipt,
  writeDeliveryReceiptFixture,
} from "./toolcraft-delivery-receipt-test-helpers.mjs";
import { collectToolcraftVerificationInputs } from "./toolcraft-verification-receipt.mjs";
import { createToolcraftTargetedPerformanceReportHash } from "./toolcraft-targeted-performance-report.mjs";
import {
  createIterationVerification,
  createPerformanceSmokeEvidenceFixture,
  createReceiptFixture,
  writePassedCheckpointFixture,
} from "./toolcraft-verification-receipt-test-helpers.mjs";

test("does not expose a reusable passed-delivery writer", async () => {
  const module = await import("./toolcraft-delivery-receipt.mjs");
  assert.equal("writeToolcraftDeliveryReceipt" in module, false);
});

test("exports one immutable source of delivery check definitions", () => {
  assert.equal(Object.isFrozen(TOOLCRAFT_PROTOTYPE_DELIVERY_CHECKS), true);
  assert.equal(
    Object.isFrozen(TOOLCRAFT_FULL_PERFORMANCE_DELIVERY_CHECKS),
    true,
  );
  assert.deepEqual(TOOLCRAFT_PROTOTYPE_DELIVERY_CHECKS, [
    "integrity",
    "ai-check",
    "test",
    "build",
    "playwright-functional",
    "playwright-smoke",
  ]);
  assert.deepEqual(TOOLCRAFT_FULL_PERFORMANCE_DELIVERY_CHECKS, [
    "integrity",
    "ai-check",
    "test",
    "build",
    "playwright-functional",
    "playwright-performance",
  ]);
});

test("accepts a closed current-version prototype receipt with protected smoke evidence", async (t) => {
  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  const inventory = await collectToolcraftVerificationInputs(rootDir);
  const receipt = createPrototypeDeliveryReceipt(inventory);

  assert.equal(TOOLCRAFT_DELIVERY_RECEIPT_VERSION, 4);
  assert.equal(getToolcraftDeliveryReceiptShapeError(receipt), undefined);
  await writeDeliveryReceiptFixture(rootDir, receipt);
  assert.deepEqual(await validateToolcraftDeliveryReceipt({ rootDir }), []);
  assert.match(
    getToolcraftDeliveryReceiptShapeError({ ...receipt, productClaim: "fast" }),
    /malformed|exact|unsupported/iu,
  );
});

test("keeps legacy version 2 targeted receipts readable without current resolved evidence", async (t) => {
  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  const inventory = await collectToolcraftVerificationInputs(rootDir);
  const receipt = createOrdinaryDeliveryReceipt({
    comparisonInventory: inventory,
    inventory,
  });
  const legacyVerification = { ...receipt.verification };
  for (const field of [
    "browserTestEvidence",
    "browserTestTitles",
    "performanceTestEvidence",
    "performanceTestTitles",
    "targetedPerformanceReport",
    "targetedPerformanceReportHash",
  ]) {
    delete legacyVerification[field];
  }
  const legacyReceipt = {
    ...receipt,
    verification: legacyVerification,
    version: 2,
  };

  assert.equal(getToolcraftDeliveryReceiptShapeError(legacyReceipt), undefined);
  await writeDeliveryReceiptFixture(rootDir, legacyReceipt);
  assert.deepEqual(await validateToolcraftDeliveryReceipt({ rootDir }), []);
});

test("keeps legacy version 3 canonical receipts with version 1 reports readable", async (t) => {
  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  const inventory = await collectToolcraftVerificationInputs(rootDir);
  const verification = createIterationVerification(3, {
    sourceHash: inventory.sourceHash,
  });
  const {
    fixtureResolutionMode: _fixtureResolutionMode,
    fixtureSelector: _fixtureSelector,
    measurements: _measurements,
    requestAuthorityHash: _requestAuthorityHash,
    ...legacyReportFields
  } = verification.targetedPerformanceReport;
  const targetedPerformanceReport = {
    ...legacyReportFields,
    version: 1,
  };
  const legacyVerification = {
    ...verification,
    performanceComparison: undefined,
    targetedPerformanceReport,
    targetedPerformanceReportHash:
      createToolcraftTargetedPerformanceReportHash({
        report: targetedPerformanceReport,
        testEvidence: verification.performanceTestEvidence,
      }),
  };
  delete legacyVerification.performanceComparison;
  const receipt = createOrdinaryDeliveryReceipt({
    comparisonInventory: inventory,
    inventory,
    verificationTier: 3,
    checks: ["integrity", "ai-check", "docs-check", ...legacyVerification.checks],
    verification: legacyVerification,
    version: 3,
  });

  assert.equal(getToolcraftDeliveryReceiptShapeError(receipt), undefined);
});

test("current targeted receipts require canonical resolved evidence fields", async (t) => {
  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  const inventory = await collectToolcraftVerificationInputs(rootDir);
  const receipt = createOrdinaryDeliveryReceipt({
    comparisonInventory: inventory,
    inventory,
  });
  const verification = { ...receipt.verification };
  delete verification.browserTestEvidence;

  assert.match(
    getToolcraftDeliveryReceiptShapeError({ ...receipt, verification }),
    /canonical test evidence|resolved test evidence/iu,
  );
});

test("prototype requires matching smoke authority and forbids baseline linkage", async (t) => {
  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  const inventory = await collectToolcraftVerificationInputs(rootDir);
  const receipt = createPrototypeDeliveryReceipt(inventory);

  const withoutSmoke = { ...receipt };
  delete withoutSmoke.smokeEvidence;
  assert.match(
    getToolcraftDeliveryReceiptShapeError(withoutSmoke),
    /smoke|malformed/iu,
  );
  assert.match(
    getToolcraftDeliveryReceiptShapeError({
      ...receipt,
      smokeEvidence: {
        ...receipt.smokeEvidence,
        sourceHash: "0".repeat(64),
      },
    }),
    /smoke|source/iu,
  );
  assert.match(
    getToolcraftDeliveryReceiptShapeError({
      ...receipt,
      baselineEvidenceHash: "a".repeat(64),
      baselineSourceHash: "b".repeat(64),
    }),
    /baseline|malformed|unsupported/iu,
  );
});

test("baseline-free delivery is rejected once a durable baseline exists", async (t) => {
  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  await writePassedCheckpointFixture(rootDir);
  const inventory = await collectToolcraftVerificationInputs(rootDir);
  for (const receipt of [
    createPrototypeDeliveryReceipt(inventory),
    createOrdinaryDeliveryReceipt({
      comparisonInventory: inventory,
      inventory,
    }),
  ]) {
    await writeDeliveryReceiptFixture(rootDir, receipt);
    assert.match(
      (await validateToolcraftDeliveryReceipt({ rootDir }))[0],
      /omits the existing durable baseline/iu,
    );
  }
});

test("accepts an ordinary targeted receipt before a baseline exists", async (t) => {
  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  const inventory = await collectToolcraftVerificationInputs(rootDir);
  const receipt = createOrdinaryDeliveryReceipt({
    comparisonInventory: inventory,
    inventory,
  });

  assert.equal(getToolcraftDeliveryReceiptShapeError(receipt), undefined);
  await writeDeliveryReceiptFixture(rootDir, receipt);
  assert.deepEqual(await validateToolcraftDeliveryReceipt({ rootDir }), []);
});

test("accepts an ordinary targeted receipt linked to an existing baseline", async (t) => {
  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  const baseline = await writePassedCheckpointFixture(rootDir);
  const inventory = await collectToolcraftVerificationInputs(rootDir);
  const receipt = createOrdinaryDeliveryReceipt({
    baseline,
    comparisonInventory: inventory,
    inventory,
  });

  assert.equal(getToolcraftDeliveryReceiptShapeError(receipt), undefined);
  await writeDeliveryReceiptFixture(rootDir, receipt);
  assert.deepEqual(await validateToolcraftDeliveryReceipt({ rootDir }), []);
});

test("rejects every receipt with partial baseline linkage", async (t) => {
  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  const inventory = await collectToolcraftVerificationInputs(rootDir);
  const ordinary = createOrdinaryDeliveryReceipt({
    comparisonInventory: inventory,
    inventory,
  });

  for (const partial of [
    { baselineSourceHash: "a".repeat(64) },
    { baselineEvidenceHash: "b".repeat(64) },
  ]) {
    assert.match(
      getToolcraftDeliveryReceiptShapeError({ ...ordinary, ...partial }),
      /baseline|malformed/iu,
    );
  }
});
