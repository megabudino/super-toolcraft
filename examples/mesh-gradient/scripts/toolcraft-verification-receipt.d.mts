export const TOOLCRAFT_PERFORMANCE_RECEIPT_VERSION: 3;
export const TOOLCRAFT_PERFORMANCE_ITERATION_REASON:
  "post-first-working-targeted-verification";

import type { ToolcraftPerformanceReportEvidence } from "./toolcraft-performance-report.mjs";

export type ToolcraftVerificationFileEntry = Readonly<{
  path: string;
  sha256: string;
}>;

export type ToolcraftPerformanceCheckpointReceipt = Readonly<{
  checkpointReason: "explicit-performance-work" | "first-working-version";
  completedAt: string;
  files: readonly ToolcraftVerificationFileEntry[];
  kind: "performance-checkpoint";
  performanceEvidence: ToolcraftPerformanceReportEvidence;
  runner: "protected-playwright";
  sourceHash: string;
  status: "passed";
  version: typeof TOOLCRAFT_PERFORMANCE_RECEIPT_VERSION;
}>;

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

export function getToolcraftPerformanceReceiptPath(rootDir: string): string;
export function getToolcraftPerformanceBaselineReceiptPath(rootDir: string): string;

export type ToolcraftTargetedIterationVerification = {
  browserTests: string[];
  checks: string[];
  performancePassIds: string[];
  performancePathIds: string[];
  performanceTests: string[];
  runner: "protected-iteration";
  unitTests: string[];
};

export function getChangedFiles(
  previousFiles: readonly ToolcraftVerificationFileEntry[],
  currentFiles: readonly ToolcraftVerificationFileEntry[],
): string[];

export function getToolcraftPerformanceIterationContext(rootDir: string): Promise<{
  baseline: ToolcraftPerformanceCheckpointReceipt;
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

export function getToolcraftTargetedVerificationContext(options: {
  comparisonInventory: Readonly<{
    entries: readonly ToolcraftVerificationFileEntry[];
    sourceHash: string;
  }>;
  rootDir: string;
}): Promise<{
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

export function readToolcraftDurablePerformanceBaseline(rootDir: string): Promise<{
  error?: string;
  missing?: boolean;
  receipt?: ToolcraftPerformanceCheckpointReceipt;
}>;

export function getToolcraftTargetedImpactVerificationError(
  verification: ToolcraftTargetedIterationVerification,
  verificationTier: 0 | 1 | 2 | 3 | 4,
  impact: Readonly<{
    minimumTier: number;
    performancePassIds: readonly string[];
    requiresFunctionalBrowser: boolean;
  }>,
): string | undefined;

export type ToolcraftPerformanceIterationReceipt = Readonly<{
  baselineEvidenceHash: string;
  baselineSourceHash: string;
  changedFiles: readonly string[];
  completedAt: string;
  files: readonly ToolcraftVerificationFileEntry[];
  kind: "performance-iteration";
  reasonCode: "post-first-working-targeted-verification";
  sourceHash: string;
  status: "passed-targeted";
  verification: ToolcraftTargetedIterationVerification;
  verificationTier: 0 | 1 | 2 | 3 | 4;
  version: typeof TOOLCRAFT_PERFORMANCE_RECEIPT_VERSION;
}>;

export type ToolcraftPerformanceReceipt =
  | ToolcraftPerformanceCheckpointReceipt
  | ToolcraftPerformanceIterationReceipt;

export function getToolcraftPerformanceIterationVerificationError(
  verification: ToolcraftTargetedIterationVerification,
  verificationTier: 0 | 1 | 2 | 3 | 4,
): string | undefined;

export function writeToolcraftPerformanceIteration(options: {
  reasonCode: "post-first-working-targeted-verification";
  rootDir: string;
  verification: ToolcraftTargetedIterationVerification;
  verificationTier: 0 | 1 | 2 | 3 | 4;
}): Promise<ToolcraftPerformanceReceipt>;
