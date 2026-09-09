import type { ToolcraftPerformanceReportEvidence } from "./toolcraft-performance-report.mjs";
import type {
  ToolcraftLegacyTargetedPerformanceReport,
  ToolcraftTargetedPerformanceReport as ToolcraftCurrentTargetedPerformanceReport,
} from "./toolcraft-targeted-performance-report.mjs";

export const TOOLCRAFT_PERFORMANCE_RECEIPT_VERSION: 4;
export const TOOLCRAFT_EXPLICIT_PERFORMANCE_REASON: "explicit-performance-work";
export const TOOLCRAFT_PERFORMANCE_ITERATION_REASON: "post-first-working-targeted-verification";

export type ToolcraftVerificationTier = 0 | 1 | 2 | 3 | 4;

export type ToolcraftVerificationFileEntry = Readonly<{
  path: string;
  sha256: string;
}>;

export type ToolcraftResolvedTestEvidence = Readonly<{
  fullTitle: string;
  leafTitle: string;
}>;

export type ToolcraftTargetedPerformanceReport =
  | ToolcraftCurrentTargetedPerformanceReport
  | ToolcraftLegacyTargetedPerformanceReport;

export type ToolcraftLegacyTargetedIterationVerification = Readonly<{
  browserTests: readonly string[];
  browserTestTitles?: readonly string[];
  checks: readonly string[];
  performancePassIds: readonly string[];
  performanceComparison?: ToolcraftPerformanceIterationComparison | null;
  performancePathIds: readonly string[];
  performanceTests: readonly string[];
  performanceTestTitles?: readonly string[];
  runner: "protected-iteration";
  targetedPerformanceReport?: ToolcraftTargetedPerformanceReport | null;
  targetedPerformanceReportHash?: string | null;
  unitTests: readonly string[];
}>;

type ToolcraftResolvedTargetedIterationVerification<PerformanceReport> = Readonly<{
  browserTestEvidence: readonly ToolcraftResolvedTestEvidence[];
  browserTests: readonly string[];
  browserTestTitles: readonly string[];
  checks: readonly string[];
  performancePassIds: readonly string[];
  performancePathIds: readonly string[];
  performanceTestEvidence: readonly ToolcraftResolvedTestEvidence[];
  performanceTests: readonly string[];
  performanceTestTitles: readonly string[];
  runner: "protected-iteration";
  targetedPerformanceReport: PerformanceReport | null;
  targetedPerformanceReportHash: string | null;
  unitTests: readonly string[];
}>;

export type ToolcraftPerformanceIterationComparison =
  | Readonly<{
      reason: "previous-delivery-has-no-compatible-targeted-measurements";
      status: "not-comparable";
    }>
  | Readonly<{
      measurements: readonly Readonly<{
        metrics: Readonly<Record<string, number>>;
        pathId: string;
        phase: "cold" | "warm" | "sustained";
      }>[];
      previousReportHash: string;
      status: "compared";
    }>;

export type ToolcraftCanonicalLegacyTargetedIterationVerification =
  ToolcraftResolvedTargetedIterationVerification<ToolcraftTargetedPerformanceReport> &
    Readonly<{
      performanceComparison?: ToolcraftPerformanceIterationComparison | null;
    }>;

export type ToolcraftTargetedIterationVerification =
  ToolcraftResolvedTargetedIterationVerification<ToolcraftCurrentTargetedPerformanceReport> &
    Readonly<{
      performanceComparison: ToolcraftPerformanceIterationComparison | null;
    }>;

type ToolcraftPerformanceCheckpointReceiptFields = Readonly<{
  checkpointReason: "explicit-performance-work" | "first-working-version";
  completedAt: string;
  files: readonly ToolcraftVerificationFileEntry[];
  kind: "performance-checkpoint";
  performanceEvidence: ToolcraftPerformanceReportEvidence;
  runner: "protected-playwright";
  sourceHash: string;
  status: "passed";
}>;

export type ToolcraftPerformanceCheckpointReceipt =
  ToolcraftPerformanceCheckpointReceiptFields &
    Readonly<{ version: typeof TOOLCRAFT_PERFORMANCE_RECEIPT_VERSION }>;

export type ToolcraftLegacyPerformanceCheckpointReceipt =
  ToolcraftPerformanceCheckpointReceiptFields & Readonly<{ version: 3 }>;

type ToolcraftPerformanceIterationReceiptFields<Verification> = Readonly<{
  baselineEvidenceHash: string;
  baselineSourceHash: string;
  changedFiles: readonly string[];
  completedAt: string;
  files: readonly ToolcraftVerificationFileEntry[];
  kind: "performance-iteration";
  reasonCode: "post-first-working-targeted-verification";
  sourceHash: string;
  status: "passed-targeted";
  verification: Verification;
  verificationTier: ToolcraftVerificationTier;
}>;

export type ToolcraftPerformanceIterationReceipt =
  ToolcraftPerformanceIterationReceiptFields<ToolcraftTargetedIterationVerification> &
    Readonly<{ version: typeof TOOLCRAFT_PERFORMANCE_RECEIPT_VERSION }>;

export type ToolcraftLegacyPerformanceIterationReceipt =
  ToolcraftPerformanceIterationReceiptFields<ToolcraftLegacyTargetedIterationVerification> &
    Readonly<{ version: 3 }>;

export type ToolcraftPerformanceReceipt =
  | ToolcraftPerformanceCheckpointReceipt
  | ToolcraftLegacyPerformanceCheckpointReceipt
  | ToolcraftPerformanceIterationReceipt
  | ToolcraftLegacyPerformanceIterationReceipt;

export function validateToolcraftPerformanceReceipt(options: {
  rootDir: string;
}): Promise<string[]>;

export function assertToolcraftVerificationInputsUnchanged(options: {
  baseline: { sourceHash: string };
  current: { sourceHash: string };
  phase: string;
}): void;

export function collectToolcraftVerificationInputs(rootDir: string): Promise<{
  entries: readonly ToolcraftVerificationFileEntry[];
  sourceHash: string;
}>;

export function validateToolcraftCurrentPerformanceImpactInventory(options: {
  knownPassIds?: readonly string[];
  rootDir: string;
}): Promise<unknown>;

export function getChangedFiles(
  previousFiles: readonly ToolcraftVerificationFileEntry[],
  currentFiles: readonly ToolcraftVerificationFileEntry[],
): string[];

type ToolcraftTargetedVerificationContext = Readonly<{
  changedFiles: string[];
  impact: Readonly<{
    minimumTier: number;
    performancePassIds: readonly string[];
    requiresFunctionalBrowser: boolean;
  }>;
  inventory: Readonly<{
    entries: readonly ToolcraftVerificationFileEntry[];
    sourceHash: string;
  }>;
}>;

export function getToolcraftPerformanceIterationContext(
  rootDir: string,
): Promise<
  ToolcraftTargetedVerificationContext & {
    baseline:
      | ToolcraftPerformanceCheckpointReceipt
      | ToolcraftLegacyPerformanceCheckpointReceipt;
  }
>;

export function getToolcraftTargetedVerificationContext(options: {
  comparisonInventory: Readonly<{
    entries: readonly ToolcraftVerificationFileEntry[];
    sourceHash: string;
  }>;
  rootDir: string;
}): Promise<ToolcraftTargetedVerificationContext>;

export function readToolcraftDurablePerformanceBaseline(
  rootDir: string,
): Promise<{
  error?: string;
  missing?: boolean;
  receipt?:
    | ToolcraftPerformanceCheckpointReceipt
    | ToolcraftLegacyPerformanceCheckpointReceipt;
}>;

export function getToolcraftTargetedImpactVerificationError(
  verification:
    | ToolcraftTargetedIterationVerification
    | ToolcraftLegacyTargetedIterationVerification,
  verificationTier: ToolcraftVerificationTier,
  impact: Readonly<{
    minimumTier: number;
    performancePassIds: readonly string[];
    requiresFunctionalBrowser: boolean;
  }>,
): string | undefined;

export function getToolcraftPerformanceIterationVerificationError(
  verification:
    | ToolcraftTargetedIterationVerification
    | ToolcraftLegacyTargetedIterationVerification,
  verificationTier: ToolcraftVerificationTier,
  options?: {
    legacyResolvedEvidence?: boolean;
    reportExpectation?: Partial<ToolcraftTargetedPerformanceReport>;
    requireResolvedEvidence?: boolean;
    sourceHash?: string;
  },
): string | undefined;
