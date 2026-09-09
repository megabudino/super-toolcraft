import {
  createToolcraftTargetedPerformanceReportHash,
  type ToolcraftTargetedPerformanceReport,
} from "./toolcraft-targeted-performance-report.mjs";

const report: ToolcraftTargetedPerformanceReport = {
  fixtureResolutionMode: "strict-development",
  fixtureSelector: "development",
  measurements: ["cold", "warm", "sustained"].map((phase) => ({
    evidenceType: "performance-measurement-metrics" as const,
    kind: "interaction" as const,
    metrics: {
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
    },
    pathId: "performance-path:composite",
    phase: phase as "cold" | "warm" | "sustained",
    profile: "direct-manipulation",
    profileCatalogVersion: 1,
    version: 1 as const,
  })),
  nonce: "runner-nonce",
  performancePassIds: ["composite"],
  performancePathIds: ["performance-path:composite"],
  requestAuthorityHash: "b".repeat(64),
  sourceHash: "a".repeat(64),
  testNames: ["browser perf: focused renderer path"],
  version: 3,
};
const testEvidence = [
  {
    fullTitle: "app-controls.spec.ts › browser perf: focused renderer path",
    leafTitle: "browser perf: focused renderer path",
  },
];
const testTitles = [
  "app-controls.spec.ts › browser perf: focused renderer path",
];

const canonicalHash: string = createToolcraftTargetedPerformanceReportHash({
  report,
  testEvidence,
});
const legacyHash: string = createToolcraftTargetedPerformanceReportHash({
  report,
  testTitles,
});
// @ts-expect-error Hash identity requires canonical evidence or legacy titles.
createToolcraftTargetedPerformanceReportHash({ report });
// @ts-expect-error Canonical evidence and legacy titles are mutually exclusive.
createToolcraftTargetedPerformanceReportHash({
  report,
  testEvidence,
  testTitles,
});

void [canonicalHash, legacyHash];
