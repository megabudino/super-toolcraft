import assert from "node:assert/strict";
import test from "node:test";

import {
  createToolcraftPerformanceIterationComparison,
  getToolcraftPerformanceIterationComparisonError,
} from "./toolcraft-performance-iteration-comparison.mjs";

const metrics = {
  droppedFrameCount: 0,
  droppedFrameRatio: 0,
  durationMs: 10,
  frameGapP50Ms: 10,
  frameGapP95Ms: 16,
  frameGapP99Ms: 16,
  longTaskCount: 0,
  longTaskMaxMs: 0,
  maxFrameGapMs: 16,
  sampleCount: 3,
};
const report = {
  fixtureResolutionMode: "strict-development",
  fixtureSelector: "development",
  measurements: [
    {
      metrics,
      pathId: "control-drag:composite",
      phase: "cold",
      profile: "direct-manipulation",
    },
  ],
  performancePathIds: ["control-drag:composite"],
  version: 3,
};

test("records numeric deltas for compatible repeated iterations", () => {
  const comparison = createToolcraftPerformanceIterationComparison({
    currentReport: {
      ...report,
      measurements: [
        { ...report.measurements[0], metrics: { ...metrics, durationMs: 8 } },
      ],
    },
    previousReport: report,
    previousReportHash: "a".repeat(64),
  });

  assert.equal(comparison.status, "compared");
  assert.equal(comparison.measurements[0].metrics.durationMs, -2);
  assert.equal(
    getToolcraftPerformanceIterationComparisonError(comparison, report),
    undefined,
  );
});

test("records an explicit non-comparable result without inventing progress", () => {
  const comparison = createToolcraftPerformanceIterationComparison({
    currentReport: report,
    previousReport: null,
    previousReportHash: null,
  });

  assert.deepEqual(comparison, {
    reason: "previous-delivery-has-no-compatible-targeted-measurements",
    status: "not-comparable",
  });
  assert.equal(
    getToolcraftPerformanceIterationComparisonError(comparison, report),
    undefined,
  );
});
