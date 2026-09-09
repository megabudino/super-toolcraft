import type { ToolcraftVerificationInventoryEntry } from "./toolcraft-delivery-plan.mjs";
import type { ToolcraftTargetedPerformanceReport } from "./toolcraft-targeted-performance-report.mjs";

export type ToolcraftDeliveryAnchor = Readonly<{
  files: readonly ToolcraftVerificationInventoryEntry[];
  performance:
    | Readonly<{ kind: "none" }>
    | Readonly<{
        kind: "ordinary-targeted-report";
        report: ToolcraftTargetedPerformanceReport;
        reportHash: string;
      }>
    | Readonly<{
        kind: "performance-iteration-report";
        report: ToolcraftTargetedPerformanceReport;
        reportHash: string;
        requestAuthorityHash: string;
      }>;
  sourceHash: string;
}>;

export const TOOLCRAFT_LEGACY_DELIVERY_RECEIPT_VERSION: 4;
export const TOOLCRAFT_LEGACY_PROTOTYPE_DELIVERY_CHECKS: readonly string[];
export const TOOLCRAFT_LEGACY_FULL_PERFORMANCE_DELIVERY_CHECKS: readonly string[];

export function getToolcraftDeliveryCompatibility(receipt: unknown): Readonly<{
  anchor: ToolcraftDeliveryAnchor;
  baseline: Readonly<{ evidenceHash: string; sourceHash: string }> | null;
  fullPerformanceCommit: boolean;
  targeted: Readonly<{
    changedFiles: readonly string[];
    comparison: Readonly<{
      entries: readonly ToolcraftVerificationInventoryEntry[];
      sourceHash: string;
    }>;
    comparisonResult: unknown;
    evidence: unknown;
    finalInventory: Readonly<{
      entries: readonly ToolcraftVerificationInventoryEntry[];
      sourceHash: string;
    }>;
    tier: number;
  }> | null;
}>;

export function assertToolcraftLegacyDeliveryBaselineCoherence(
  options: Record<string, unknown>,
): void;

export function normalizeToolcraftDeliveryAnchor(
  receipt: unknown,
): ToolcraftDeliveryAnchor;

export function getToolcraftDeliveryAnchorShapeError(
  receipt: unknown,
): string | undefined;

export function isToolcraftLegacyTargetedDeliveryMode(
  mode: unknown,
): mode is "ordinary" | "performance-iteration";

export function readToolcraftDeliveryAnchor(rootDir: string): Promise<{
  anchor?: ToolcraftDeliveryAnchor;
  error?: string;
  missing?: boolean;
  receipt?: unknown;
}>;

export function validateToolcraftDeliveryAnchor(options: {
  rootDir: string;
}): Promise<string[]>;
