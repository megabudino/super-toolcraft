import type {
  ToolcraftTargetedIterationVerification,
  ToolcraftVerificationFileEntry,
} from "./toolcraft-verification-receipt.mjs";

export const TOOLCRAFT_DELIVERY_RECEIPT_VERSION: 1;

export type ToolcraftDeliveryReceipt = Readonly<{
  baselineEvidenceHash: string;
  baselineSourceHash: string;
  changedFiles?: readonly string[];
  checks: readonly string[];
  comparisonFiles?: readonly ToolcraftVerificationFileEntry[];
  comparisonSourceHash?: string;
  completedAt: string;
  files: readonly ToolcraftVerificationFileEntry[];
  kind: "delivery-verification";
  mode: "explicit-performance" | "first-stable" | "ordinary";
  runner: "protected-delivery";
  sourceHash: string;
  status: "passed";
  verification?: ToolcraftTargetedIterationVerification;
  verificationTier?: 0 | 1 | 2 | 3 | 4;
  version: typeof TOOLCRAFT_DELIVERY_RECEIPT_VERSION;
}>;

export function getToolcraftDeliveryReceiptPath(rootDir: string): string;
export function readToolcraftDeliveryReceipt(rootDir: string): Promise<{
  error?: string;
  missing?: boolean;
  receipt?: ToolcraftDeliveryReceipt;
}>;
export function validateToolcraftDeliveryReceipt(options: {
  rootDir: string;
}): Promise<string[]>;
