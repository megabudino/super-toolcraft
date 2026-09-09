export type ToolcraftTargetedPerformanceMetrics = Readonly<{
  droppedFrameCount: number;
  droppedFrameRatio: number;
  durationMs: number;
  frameGapP50Ms: number;
  frameGapP95Ms: number;
  frameGapP99Ms: number;
  longTaskCount: number;
  longTaskMaxMs: number;
  maxFrameGapMs: number;
  sampleCount: number;
}>;

export type ToolcraftTargetedPerformanceMeasurement = Readonly<{
  evidenceType: "performance-measurement-metrics";
  kind: "animation-frames" | "interaction";
  metrics: ToolcraftTargetedPerformanceMetrics;
  pathId: string;
  phase: "cold" | "warm" | "sustained";
  profile: string;
  profileCatalogVersion: number;
  version: 1;
}>;

export type ToolcraftTargetedPerformanceReport = Readonly<{
  fixtureResolutionMode: "default" | "strict-development";
  fixtureSelector: "development";
  measurements: readonly ToolcraftTargetedPerformanceMeasurement[];
  nonce: string;
  performancePassIds: readonly string[];
  performancePathIds: readonly string[];
  requestAuthorityHash: string | null;
  sourceHash: string;
  testNames: readonly string[];
  version: 3;
}>;

export type ToolcraftVersionTwoTargetedPerformanceReport = Readonly<{
  fixtureResolutionMode: "default" | "strict-development";
  fixtureSelector: "development";
  nonce: string;
  performancePassIds: readonly string[];
  performancePathIds: readonly string[];
  sourceHash: string;
  testNames: readonly string[];
  version: 2;
}>;

export type ToolcraftVersionOneTargetedPerformanceReport = Readonly<{
  nonce: string;
  performancePassIds: readonly string[];
  performancePathIds: readonly string[];
  sourceHash: string;
  testNames: readonly string[];
  version: 1;
}>;

export type ToolcraftLegacyTargetedPerformanceReport =
  | ToolcraftVersionOneTargetedPerformanceReport
  | ToolcraftVersionTwoTargetedPerformanceReport;

export type ToolcraftTargetedResolvedTestEvidence = Readonly<{
  fullTitle: string;
  leafTitle: string;
}>;

export const TOOLCRAFT_TARGETED_PERFORMANCE_REPORT_VERSION: 3;

export function getToolcraftTargetedPerformanceReportError(
  report: unknown,
  expected?: Partial<
    ToolcraftTargetedPerformanceReport | ToolcraftLegacyTargetedPerformanceReport
  >,
): string | undefined;

export function createToolcraftTargetedPerformanceReport(
  value: Omit<ToolcraftTargetedPerformanceReport, "version">,
): ToolcraftTargetedPerformanceReport;

export function createToolcraftTargetedPerformanceReportHash(
  options:
    | Readonly<{
        report:
          | ToolcraftTargetedPerformanceReport
          | ToolcraftLegacyTargetedPerformanceReport;
        testEvidence: readonly ToolcraftTargetedResolvedTestEvidence[];
        testTitles?: never;
      }>
    | Readonly<{
        report:
          | ToolcraftTargetedPerformanceReport
          | ToolcraftLegacyTargetedPerformanceReport;
        testEvidence?: never;
        testTitles: readonly string[];
      }>,
): string;

export function writeToolcraftTargetedPerformanceReport(
  filePath: string,
  value: Omit<ToolcraftTargetedPerformanceReport, "version">,
): Promise<ToolcraftTargetedPerformanceReport>;

export function writeToolcraftTargetedPerformanceReportSync(
  filePath: string,
  value: Omit<ToolcraftTargetedPerformanceReport, "version">,
): ToolcraftTargetedPerformanceReport;

export function readToolcraftTargetedPerformanceReport(
  filePath: string,
  expected?: Partial<
    ToolcraftTargetedPerformanceReport | ToolcraftLegacyTargetedPerformanceReport
  >,
): Promise<
  ToolcraftTargetedPerformanceReport | ToolcraftLegacyTargetedPerformanceReport
>;
