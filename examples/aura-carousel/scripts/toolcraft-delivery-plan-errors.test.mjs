import assert from "node:assert/strict";
import test from "node:test";

import {
  createToolcraftDeliveryPlan,
} from "./toolcraft-delivery-plan.mjs";
import {
  absentCanonicalPath,
  hash,
  inputs,
  requestAuthority,
  validReport,
} from "./toolcraft-delivery-plan-error-test-helpers.mjs";
import {
  createToolcraftTargetedPerformanceComparisonHash,
} from "./toolcraft-targeted-performance-report.mjs";

test("rejects unchanged and unrepresented changed inputs", () => {
  const unchanged = inputs();
  unchanged.currentInventory = unchanged.comparisonInventory;
  unchanged.integrity.sourceHash = unchanged.currentInventory.sourceHash;
  assert.throws(() => createToolcraftDeliveryPlan(unchanged), /changed/iu);

  const extra = inputs();
  extra.changeSet.untrusted = true;
  assert.throws(() => createToolcraftDeliveryPlan(extra), /change set/iu);

  const unknown = inputs({ changedPath: "arbitrary.txt", resolvedImpact: null });
  assert.throws(() => createToolcraftDeliveryPlan(unknown), /represented/iu);
});

test("rejects malformed catalogs and inconsistent exact impact relations", () => {
  for (const mutate of [
    (value) => value.changeSet.impact.acceptanceIds = ["stale.id"],
    (value) => value.changeSet.impact.browserTestNames = ["browser: stale"],
    (value) => value.changeSet.impact.performanceCandidates.passIds = ["unknown-pass"],
    (value) => value.changeSet.impact.performanceCandidates.pathIds = ["unknown-path"],
    (value) => value.changeSet.impact.performanceCandidates.testNames = ["browser perf: stale"],
    (value) => value.catalog.acceptance[0].extra = true,
  ]) {
    const value = structuredClone(inputs());
    mutate(value);
    assert.throws(() => createToolcraftDeliveryPlan(value));
  }
});

test("impact cannot omit both functional and performance proof", () => {
  const value = inputs();
  value.changeSet.impact.acceptanceIds = [];
  value.changeSet.impact.browserTestNames = [];
  value.changeSet.impact.productTestFiles = [];
  value.changeSet.impact.performanceCandidates = {
    passIds: [],
    pathIds: [],
    testNames: [],
  };
  assert.throws(
    () => createToolcraftDeliveryPlan(value),
    /functional or performance proof/iu,
  );
});

test("rejects malformed inventory, integrity, hashes, and previous reports", () => {
  for (const mutate of [
    (value) => value.currentInventory.sourceHash = hash("f"),
    (value) => value.comparisonInventory.entries[0].sha256 = "bad",
    (value) => value.integrity.sourceHash = hash("e"),
    (value) => value.integrity.manifestHash = "bad",
    (value) => value.allProductTestFiles = [],
    (value) => value.allProductTestFiles = ["../escape.test.ts"],
    (value) => value.allProductTestFiles = ["C:/escape.test.ts"],
    (value) => value.packageManager = "unknown",
    (value) => value.previousPerformance = {
      kind: "performance-iteration-report",
      requestAuthorityHash: hash("c"),
      report: {},
      comparisonHash: hash("c"),
    },
    (value) => value.previousPerformance = {
      kind: "performance-iteration-report",
      requestAuthorityHash: hash("c"),
      report: validReport(value.comparisonInventory.sourceHash, hash("c")),
      comparisonHash: "bad",
    },
  ]) {
    const value = structuredClone(inputs());
    mutate(value);
    assert.throws(() => createToolcraftDeliveryPlan(value));
  }
});

test("rejects missing, reused, empty, unknown, and incompatible authority", () => {
  const authority = requestAuthority();
  assert.throws(
    () => createToolcraftDeliveryPlan(
      inputs({ authority: requestAuthority([absentCanonicalPath]) }),
    ),
    /unknown path/iu,
  );
  for (const mutate of [
    (value) => value.authority = { ...authority, pathIds: [] },
    (value) => value.authority = { ...authority, requestEvidence: "" },
    (value) => value.changeSet.productInputsChanged = false,
    (value) => value.changeSet.impact.performanceCandidates.pathIds = [],
  ]) {
    const value = inputs({ authority });
    mutate(value);
    assert.throws(() => createToolcraftDeliveryPlan(value));
  }

  const reused = inputs({ authority });
  const report = validReport(
    reused.comparisonInventory.sourceHash,
    authority.hash,
  );
  reused.previousPerformance = {
    kind: "performance-iteration-report",
    requestAuthorityHash: authority.hash,
    report,
    comparisonHash:
      createToolcraftTargetedPerformanceComparisonHash(report),
  };
  reused.previousLifecycle = {
    consumedPerformanceRequestAuthorityHashes: [authority.hash],
    performanceEscalationOffered: false,
  };
  assert.throws(() => createToolcraftDeliveryPlan(reused), /already/iu);
});

test("retains only a compatible previous authorized comparison", () => {
  const authority = requestAuthority();
  const value = inputs({ authority });
  const iterationReport = validReport(
    value.comparisonInventory.sourceHash,
    hash("c"),
  );
  const iterationComparisonHash =
    createToolcraftTargetedPerformanceComparisonHash(iterationReport);
  value.previousPerformance = {
    kind: "performance-iteration-report",
    requestAuthorityHash: hash("c"),
    report: iterationReport,
    comparisonHash: iterationComparisonHash,
  };
  value.previousLifecycle = {
    consumedPerformanceRequestAuthorityHashes: [hash("c")],
    performanceEscalationOffered: false,
  };
  const compatiblePlan = createToolcraftDeliveryPlan(value);
  assert.deepEqual(
    compatiblePlan.performanceComparison,
    {
      kind: "compatible-targeted-report",
      report: iterationReport,
      comparisonHash: iterationComparisonHash,
    },
  );
  assert.deepEqual(compatiblePlan.lifecycle, {
    consumedPerformanceRequestAuthorityHashes: [
      authority.hash,
      hash("c"),
    ].sort(),
    performanceEscalationOffered: true,
  });

  const incompatible = validReport(hash("d"), hash("c"));
  value.previousPerformance = {
    kind: "performance-iteration-report",
    requestAuthorityHash: hash("c"),
    report: incompatible,
    comparisonHash:
      createToolcraftTargetedPerformanceComparisonHash(incompatible),
  };
  assert.deepEqual(
    createToolcraftDeliveryPlan(value).performanceComparison,
    { kind: "none" },
  );
});
