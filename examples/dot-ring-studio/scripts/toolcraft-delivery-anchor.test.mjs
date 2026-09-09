import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";

import {
  getToolcraftDeliveryCompatibility,
  normalizeToolcraftDeliveryAnchor,
  readToolcraftDeliveryAnchor,
} from "./toolcraft-delivery-anchor.mjs";
import {
  EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
} from "./toolcraft-delivery-lifecycle-state.mjs";
import {
  createCommonDeliveryReceipt,
  createIterationVerification,
  createOrdinaryDeliveryReceipt,
  createPrototypeDeliveryReceipt,
} from "./toolcraft-delivery-anchor-test-helpers.mjs";
import {
  createPlanReceiptFixture,
  writeDeliveryReceiptFixture,
} from "./toolcraft-delivery-receipt-test-helpers.mjs";
import {
  createToolcraftDeliveryReceipt,
} from "./toolcraft-delivery-receipt.mjs";
import {
  createToolcraftTargetedPerformanceReport,
  createToolcraftTargetedPerformanceReportHash,
} from "./toolcraft-targeted-performance-report.mjs";
import {
  createReceiptFixture,
} from "./toolcraft-verification-receipt-test-helpers.mjs";
import { collectToolcraftVerificationInputs } from "./toolcraft-verification-inventory.mjs";

const forbiddenAnchorKeys = [
  "baselineEvidenceHash",
  "baselineSourceHash",
  "mode",
  "verificationTier",
  "version",
];

function assertClosedAnchor(anchor) {
  for (const key of forbiddenAnchorKeys) {
    assert.equal(Object.hasOwn(anchor, key), false);
  }
  assert.deepEqual(Object.keys(anchor).sort(), [
    "files",
    "lifecycle",
    "performance",
    "sourceHash",
  ]);
}

function legacyV2Verification() {
  const verification = { ...createIterationVerification(0) };
  for (const field of [
    "browserTestEvidence",
    "browserTestTitles",
    "performanceComparison",
    "performanceTestEvidence",
    "performanceTestTitles",
    "targetedPerformanceReport",
    "targetedPerformanceReportHash",
  ]) {
    delete verification[field];
  }
  return verification;
}

function historicalV4OrdinaryVerification() {
  return {
    browserTestEvidence: [],
    browserTests: [],
    browserTestTitles: [],
    checks: ["typecheck"],
    performanceComparison: null,
    performancePassIds: [], performancePathIds: [],
    performanceTestEvidence: [],
    performanceTests: [],
    performanceTestTitles: [],
    runner: "protected-iteration",
    targetedPerformanceReport: null,
    targetedPerformanceReportHash: null,
    unitTests: [],
  };
}

function currentOrdinaryPerformanceVerification(sourceHash) {
  const current = createIterationVerification(3, { sourceHash });
  const report = createToolcraftTargetedPerformanceReport({
    ...current.targetedPerformanceReport,
    fixtureResolutionMode: "default",
    requestAuthorityHash: null,
  });
  return {
    ...current,
    performanceComparison: null,
    targetedPerformanceReport: report,
    targetedPerformanceReportHash:
      createToolcraftTargetedPerformanceReportHash({
        report,
        testEvidence: current.performanceTestEvidence,
      }),
  };
}

function historicalV3IterationVerification(sourceHash) {
  const current = createIterationVerification(3, { sourceHash });
  const {
    fixtureResolutionMode: _fixtureResolutionMode,
    fixtureSelector: _fixtureSelector,
    measurements: _measurements,
    requestAuthorityHash: _requestAuthorityHash,
    ...reportFields
  } = current.targetedPerformanceReport;
  const report = { ...reportFields, version: 1 };
  const {
    performanceComparison: _performanceComparison,
    ...verification
  } = current;
  return {
    ...verification,
    targetedPerformanceReport: report,
    targetedPerformanceReportHash:
      createToolcraftTargetedPerformanceReportHash({
        report,
        testEvidence: current.performanceTestEvidence,
      }),
  };
}

test("normalizes valid v2, v3, and v4 receipts to closed delivery anchors", async (t) => {
  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  const inventory = await collectToolcraftVerificationInputs(rootDir);
  const v2 = createOrdinaryDeliveryReceipt({
    comparisonInventory: inventory,
    inventory,
    verification: legacyV2Verification(),
    version: 2,
  });
  const v3Verification = historicalV3IterationVerification(
    inventory.sourceHash,
  );
  const v3 = createOrdinaryDeliveryReceipt({
    comparisonInventory: inventory,
    inventory,
    verification: v3Verification,
    verificationTier: 3,
    checks: ["integrity", "ai-check", "docs-check", ...v3Verification.checks],
    version: 3,
  });
  const v4Verification = currentOrdinaryPerformanceVerification(
    inventory.sourceHash,
  );
  const v4 = createOrdinaryDeliveryReceipt({
    baselineEvidenceHash: "b".repeat(64),
    baselineSourceHash: inventory.sourceHash,
    comparisonInventory: inventory,
    inventory,
    verification: v4Verification,
    verificationTier: 3,
    checks: ["integrity", "ai-check", "docs-check", ...v4Verification.checks],
    version: 4,
  });

  const anchors = [v2, v3, v4].map(normalizeToolcraftDeliveryAnchor);
  assert.deepEqual(anchors.map(({ performance }) => performance.kind), [
    "none",
    "ordinary-targeted-report",
    "ordinary-targeted-report",
  ]);
  for (const anchor of anchors) assertClosedAnchor(anchor);
  for (const anchor of anchors) {
    assert.deepEqual(
      anchor.lifecycle,
      EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
    );
  }
  assert.deepEqual(anchors[2].performance, {
    kind: "ordinary-targeted-report",
    report: v4Verification.targetedPerformanceReport,
    reportHash: createToolcraftTargetedPerformanceReportHash({
      report: v4Verification.targetedPerformanceReport,
      testTitles: v4Verification.targetedPerformanceReport.testNames,
    }),
  });
});

test("preserves exact authority only for a valid legacy performance iteration", async (t) => {
  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  const inventory = await collectToolcraftVerificationInputs(rootDir);
  const verification = createIterationVerification(3, {
    sourceHash: inventory.sourceHash,
  });
  const receipt = createOrdinaryDeliveryReceipt({
    comparisonInventory: inventory,
    inventory,
    mode: "performance-iteration",
    verification,
    verificationTier: 3,
  });
  const anchor = normalizeToolcraftDeliveryAnchor(receipt);

  assertClosedAnchor(anchor);
  assert.deepEqual(anchor.performance, {
    kind: "performance-iteration-report",
    report: verification.targetedPerformanceReport,
    reportHash: createToolcraftTargetedPerformanceReportHash({
      report: verification.targetedPerformanceReport,
      testTitles: verification.targetedPerformanceReport.testNames,
    }),
    requestAuthorityHash:
      verification.targetedPerformanceReport.requestAuthorityHash,
  });
  assert.deepEqual(anchor.lifecycle, {
    consumedPerformanceRequestAuthorityHashes: [
      verification.targetedPerformanceReport.requestAuthorityHash,
    ],
    performanceEscalationOffered: true,
  });
});

test("accepts a historical v3 performance iteration without inventing request authority", async (t) => {
  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  const inventory = await collectToolcraftVerificationInputs(rootDir);
  const verification = historicalV3IterationVerification(inventory.sourceHash);
  const receipt = createOrdinaryDeliveryReceipt({
    comparisonInventory: inventory,
    inventory,
    mode: "performance-iteration",
    verification,
    verificationTier: 3,
    checks: ["integrity", "ai-check", "docs-check", ...verification.checks],
    version: 3,
  });

  assert.deepEqual(normalizeToolcraftDeliveryAnchor(receipt).performance, {
    kind: "ordinary-targeted-report",
    report: verification.targetedPerformanceReport,
    reportHash: verification.targetedPerformanceReportHash,
  });
});

test("validates exact historical version schemas before normalization", async (t) => {
  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  const inventory = await collectToolcraftVerificationInputs(rootDir);
  const v2Verification = {
    ...legacyV2Verification(),
    performanceComparison: null,
  };
  const v2 = createOrdinaryDeliveryReceipt({
    comparisonInventory: inventory,
    inventory,
    verification: v2Verification,
    version: 2,
  });
  const v3Verification = historicalV3IterationVerification(
    inventory.sourceHash,
  );
  const reportV2 = {
    fixtureResolutionMode: "strict-development",
    fixtureSelector: "development",
    ...v3Verification.targetedPerformanceReport,
    version: 2,
  };
  const invalidV3Verification = {
    ...v3Verification,
    targetedPerformanceReport: reportV2,
    targetedPerformanceReportHash:
      createToolcraftTargetedPerformanceReportHash({
        report: reportV2,
        testEvidence: v3Verification.performanceTestEvidence,
      }),
  };
  const v3 = createOrdinaryDeliveryReceipt({
    comparisonInventory: inventory,
    inventory,
    mode: "performance-iteration",
    verification: invalidV3Verification,
    verificationTier: 3,
    checks: [
      "integrity",
      "ai-check",
      "docs-check",
      ...invalidV3Verification.checks,
    ],
    version: 3,
  });

  assert.throws(() => normalizeToolcraftDeliveryAnchor(v2), /version 2|schema/iu);
  assert.throws(() => normalizeToolcraftDeliveryAnchor(v3), /version 3|schema|report/iu);
});

test("accepts a historical v4 ordinary null comparison without accepting a claim", async (t) => {
  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  const inventory = await collectToolcraftVerificationInputs(rootDir);
  const receipt = createOrdinaryDeliveryReceipt({
    comparisonInventory: inventory,
    inventory,
    verification: historicalV4OrdinaryVerification(),
    version: 4,
  });
  assert.deepEqual(normalizeToolcraftDeliveryAnchor(receipt).performance, { kind: "none" });
  assert.throws(
    () => normalizeToolcraftDeliveryAnchor({
      ...receipt,
      verification: {
        ...receipt.verification,
        performanceComparison: {
          reason: "previous-delivery-has-no-compatible-targeted-measurements",
          status: "not-comparable",
        },
      },
    }),
    /cannot claim a performance iteration comparison/iu,
  );
});

test("validates every raw legacy receipt before reducing it", async (t) => {
  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  const inventory = await collectToolcraftVerificationInputs(rootDir);
  const valid = createPrototypeDeliveryReceipt(inventory);
  for (const receipt of [
    { ...valid, unexpected: true },
    { ...valid, sourceHash: "0".repeat(64) },
    {
      ...valid,
      files: valid.files.map((entry, index) =>
        index === 0 ? { ...entry, unexpected: true } : entry),
    },
    createCommonDeliveryReceipt(inventory, { mode: "invented" }),
    { ...valid, version: 1 },
  ]) {
    assert.throws(
      () => normalizeToolcraftDeliveryAnchor(receipt),
      /malformed|unsupported|inventory|mode/iu,
    );
  }
});

test("normalizes and reads a current version 5 receipt through the same anchor", async (t) => {
  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  const fixture = createPlanReceiptFixture("performance-iteration");
  const receipt = createToolcraftDeliveryReceipt(fixture);
  await writeDeliveryReceiptFixture(rootDir, receipt);

  const normalized = normalizeToolcraftDeliveryAnchor(receipt);
  assertClosedAnchor(normalized);
  assert.equal(normalized.performance.kind, "performance-iteration-report");
  assert.deepEqual(normalized.lifecycle, receipt.plan.lifecycle);
  const loaded = await readToolcraftDeliveryAnchor(rootDir);
  assert.deepEqual(loaded, { anchor: normalized, receipt });
});

test("legacy compatibility rejects current version 5 receipts", () => {
  const receipt = createToolcraftDeliveryReceipt(createPlanReceiptFixture());
  assert.throws(
    () => getToolcraftDeliveryCompatibility(receipt),
    /legacy|version 5|unsupported/iu,
  );
});
