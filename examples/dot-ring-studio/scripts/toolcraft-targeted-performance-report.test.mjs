import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  createToolcraftTargetedPerformanceReport,
  createToolcraftTargetedPerformanceReportHash,
  getToolcraftTargetedPerformanceReportError,
  readToolcraftTargetedPerformanceReport,
  writeToolcraftTargetedPerformanceReport,
} from "./toolcraft-targeted-performance-report.mjs";

const sourceHash = "a".repeat(64);
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
const measurements = ["cold", "warm", "sustained"].map((phase) => ({
  evidenceType: "performance-measurement-metrics",
  kind: "interaction",
  metrics,
  pathId: "control-drag:composite",
  phase,
  profile: "interactive-discrete",
  profileCatalogVersion: 1,
  version: 1,
}));
const value = {
  fixtureResolutionMode: "strict-development",
  fixtureSelector: "development",
  nonce: "runner-nonce",
  measurements,
  performancePassIds: ["composite"],
  performancePathIds: ["control-drag:composite"],
  requestAuthorityHash: "b".repeat(64),
  sourceHash,
  testNames: ["browser perf: control-drag composite"],
};

test("normalizes and validates exact targeted evidence", () => {
  assert.deepEqual(createToolcraftTargetedPerformanceReport(value), {
    ...value,
    version: 3,
  });
});

test("hashes source-bound report and resolved selector identity", () => {
  const report = createToolcraftTargetedPerformanceReport(value);
  const testEvidence = [
    {
      fullTitle: "app-controls.spec.ts › browser perf: control-drag composite",
      leafTitle: "browser perf: control-drag composite",
    },
  ];
  const reportHash = createToolcraftTargetedPerformanceReportHash({
    report,
    testEvidence,
  });

  assert.match(reportHash, /^[a-f0-9]{64}$/u);
  assert.notEqual(
    createToolcraftTargetedPerformanceReportHash({
      report: {
        ...report,
        fixtureResolutionMode: "default",
        requestAuthorityHash: null,
      },
      testEvidence,
    }),
    reportHash,
  );
  assert.throws(
    () =>
      createToolcraftTargetedPerformanceReportHash({
        report: { ...report, fixtureSelector: "maximum" },
        testEvidence,
      }),
    /malformed/iu,
  );
  assert.notEqual(
    createToolcraftTargetedPerformanceReportHash({
      report,
      testEvidence: [
        {
          fullTitle: "other.spec.ts › browser perf: control-drag composite",
          leafTitle: "browser perf: control-drag composite",
        },
      ],
    }),
    reportHash,
  );
});

test("rejects malformed or mismatched targeted evidence", async () => {
  assert.throws(
    () =>
      createToolcraftTargetedPerformanceReport({
        ...value,
        performancePathIds: [],
      }),
    /malformed/iu,
  );

  const rootDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "toolcraft-targeted-report-"),
  );
  const reportPath = path.join(rootDir, "report.json");
  await writeToolcraftTargetedPerformanceReport(reportPath, value);
  await assert.rejects(
    readToolcraftTargetedPerformanceReport(reportPath, {
      fixtureResolutionMode: "default",
    }),
    /fixtureResolutionMode does not match/iu,
  );
  await fs.rm(rootDir, { force: true, recursive: true });
});

test("keeps version 1 and 2 reports readable only as explicit legacy evidence", () => {
  const legacy = {
    nonce: value.nonce,
    performancePassIds: value.performancePassIds,
    performancePathIds: value.performancePathIds,
    sourceHash: value.sourceHash,
    testNames: value.testNames,
    version: 1,
  };

  assert.equal(
    getToolcraftTargetedPerformanceReportError(legacy, { version: 1 }),
    undefined,
  );
  assert.match(
    getToolcraftTargetedPerformanceReportError(legacy, { version: 3 }),
    /version does not match/iu,
  );
  const versionTwo = {
    fixtureResolutionMode: value.fixtureResolutionMode,
    fixtureSelector: value.fixtureSelector,
    ...legacy,
    version: 2,
  };
  assert.equal(
    getToolcraftTargetedPerformanceReportError(versionTwo, { version: 2 }),
    undefined,
  );
});

test("requires measurements and request authority for strict reports", () => {
  assert.match(
    getToolcraftTargetedPerformanceReportError({
      ...createToolcraftTargetedPerformanceReport(value),
      measurements: [],
    }),
    /malformed/iu,
  );
  assert.match(
    getToolcraftTargetedPerformanceReportError({
      ...createToolcraftTargetedPerformanceReport(value),
      requestAuthorityHash: null,
    }),
    /malformed/iu,
  );
});
