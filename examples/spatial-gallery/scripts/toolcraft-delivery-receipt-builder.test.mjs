import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";

import {
  assertOptionalBaselineCoherence,
  createExplicitPerformanceDeliveryReceipt,
  createPerformanceCheckpointReceipt,
  createPrototypeDeliveryReceipt,
} from "./toolcraft-delivery-receipt-builder.mjs";
import { getToolcraftDeliveryReceiptShapeError } from "./toolcraft-delivery-receipt.mjs";
import {
  collectToolcraftVerificationInputs,
} from "./toolcraft-verification-receipt.mjs";
import {
  createPerformanceEvidenceFixture,
  createPerformanceSmokeEvidenceFixture,
  createReceiptFixture,
} from "./toolcraft-verification-receipt-test-helpers.mjs";

test("receipt builder creates coherent prototype and explicit authority", async (t) => {
  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  const inventory = await collectToolcraftVerificationInputs(rootDir);
  const prototype = createPrototypeDeliveryReceipt({
    inventory,
    smokeEvidence: createPerformanceSmokeEvidenceFixture(inventory.sourceHash),
  });
  const baseline = createPerformanceCheckpointReceipt({
    evidence: createPerformanceEvidenceFixture(),
    inventory,
  });
  const explicit = createExplicitPerformanceDeliveryReceipt({
    baseline,
    inventory,
  });

  assert.equal(getToolcraftDeliveryReceiptShapeError(prototype), undefined);
  assert.equal(getToolcraftDeliveryReceiptShapeError(explicit), undefined);
  assert.equal("baselineSourceHash" in prototype, false);
  assert.equal(explicit.baselineSourceHash, baseline.sourceHash);
  assert.equal(
    explicit.baselineEvidenceHash,
    baseline.performanceEvidence.reportHash,
  );
});

test("baseline coherence accepts absent linkage only while baseline is absent", () => {
  const delivery = {
    receipt: {
      mode: "prototype",
    },
  };
  assert.doesNotThrow(() =>
    assertOptionalBaselineCoherence({
      baseline: { missing: true },
      delivery,
    }),
  );
  assert.throws(
    () =>
      assertOptionalBaselineCoherence({
        baseline: {
          receipt: {
            performanceEvidence: { reportHash: "b".repeat(64) },
            sourceHash: "a".repeat(64),
          },
        },
        delivery,
      }),
    {
      message:
        "Toolcraft delivery receipt does not match the durable performance baseline. An operator must run pnpm verify:perf to restore one coherent delivery state.",
    },
  );
});

test("baseline coherence rejects missing or mismatched linked authority", () => {
  const linkedReceipt = {
    baselineEvidenceHash: "b".repeat(64),
    baselineSourceHash: "a".repeat(64),
  };
  assert.throws(
    () =>
      assertOptionalBaselineCoherence({
        baseline: { missing: true },
        delivery: { receipt: linkedReceipt },
      }),
    /references a missing durable performance baseline/iu,
  );
  assert.doesNotThrow(() =>
    assertOptionalBaselineCoherence({
      baseline: {
        receipt: {
          performanceEvidence: { reportHash: "b".repeat(64) },
          sourceHash: "a".repeat(64),
        },
      },
      delivery: { receipt: linkedReceipt },
    }),
  );
});
