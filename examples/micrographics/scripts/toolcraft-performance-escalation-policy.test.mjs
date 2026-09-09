import assert from "node:assert/strict";
import test from "node:test";

import {
  formatToolcraftPerformanceEscalationRecommendation,
  getToolcraftPerformanceEscalationRecommendation,
} from "./toolcraft-performance-escalation-policy.mjs";

const hash = (character) => character.repeat(64);

function createReceipt({
  comparisonStatus = "compared",
  mode = "performance-iteration",
  reportHash = hash("b"),
  requestAuthorityHash = hash("a"),
} = {}) {
  return {
    mode,
    verification: {
      performanceComparison:
        comparisonStatus === "compared"
          ? {
              measurements: [],
              previousReportHash: hash("c"),
              status: "compared",
            }
          : {
              reason:
                "previous-delivery-has-no-compatible-targeted-measurements",
              status: "not-comparable",
            },
      targetedPerformanceReport: {
        requestAuthorityHash,
        version: 3,
      },
      targetedPerformanceReportHash: reportHash,
    },
  };
}

test("does not recommend a full audit after the first performance iteration", () => {
  const recommendation = getToolcraftPerformanceEscalationRecommendation({
    currentReceipt: createReceipt({ comparisonStatus: "not-comparable" }),
    previousReceipt: { mode: "ordinary", verification: {} },
  });

  assert.equal(recommendation, null);
});

test("does not recommend a full audit for an incompatible repeated iteration", () => {
  const recommendation = getToolcraftPerformanceEscalationRecommendation({
    currentReceipt: createReceipt({ comparisonStatus: "not-comparable" }),
    previousReceipt: createReceipt(),
  });

  assert.equal(recommendation, null);
});

test("does not treat an ordinary targeted report as a previous complaint", () => {
  const previousReceipt = createReceipt({
    mode: "ordinary",
    requestAuthorityHash: null,
  });
  const currentReceipt = createReceipt();
  currentReceipt.verification.performanceComparison.previousReportHash =
    previousReceipt.verification.targetedPerformanceReportHash;

  assert.equal(
    getToolcraftPerformanceEscalationRecommendation({
      currentReceipt,
      previousReceipt,
    }),
    null,
  );
});

test("recommends an explicitly authorized full audit after two compatible iterations", () => {
  const previousReceipt = createReceipt({ reportHash: hash("c") });
  const currentReceipt = createReceipt({ reportHash: hash("d") });
  currentReceipt.verification.performanceComparison.previousReportHash =
    previousReceipt.verification.targetedPerformanceReportHash;

  const recommendation = getToolcraftPerformanceEscalationRecommendation({
    currentReceipt,
    previousReceipt,
  });

  assert.deepEqual(recommendation, {
    command: "pnpm verify:perf",
    kind: "offer-full-performance-audit",
    reason: "two-consecutive-compatible-performance-iterations",
    requiresExplicitUserConsent: true,
  });
  assert.match(
    formatToolcraftPerformanceEscalationRecommendation(recommendation),
    /offer.*complete performance audit/iu,
  );
  assert.match(
    formatToolcraftPerformanceEscalationRecommendation(recommendation),
    /do not run pnpm verify:perf without explicit user consent/iu,
  );
  assert.match(
    formatToolcraftPerformanceEscalationRecommendation(recommendation),
    /does not need to know the command name/iu,
  );
});

test("rejects a comparison that is not bound to the previous protected report", () => {
  const recommendation = getToolcraftPerformanceEscalationRecommendation({
    currentReceipt: createReceipt(),
    previousReceipt: createReceipt({ reportHash: hash("d") }),
  });

  assert.equal(recommendation, null);
});
