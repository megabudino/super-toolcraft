import type {
  ToolcraftCanonicalLegacyTargetedIterationVerification,
  ToolcraftLegacyTargetedIterationVerification,
  ToolcraftTargetedIterationVerification,
  ToolcraftVerificationFileEntry,
  ToolcraftVerificationTier,
} from "./toolcraft-verification-receipt.mjs";

export const TOOLCRAFT_DELIVERY_RECEIPT_VERSION: 4;

type ToolcraftDeliveryReceiptFields = Readonly<{
  completedAt: string;
  files: readonly ToolcraftVerificationFileEntry[];
  kind: "delivery-verification";
  runner: "protected-delivery";
  sourceHash: string;
  status: "passed";
}>;

type ToolcraftCurrentDeliveryReceiptBase = ToolcraftDeliveryReceiptFields &
  Readonly<{ version: typeof TOOLCRAFT_DELIVERY_RECEIPT_VERSION }>;
type ToolcraftLegacyDeliveryReceiptBase = ToolcraftDeliveryReceiptFields &
  Readonly<{ version: 2 }>;
type ToolcraftCanonicalLegacyDeliveryReceiptBase =
  ToolcraftDeliveryReceiptFields & Readonly<{ version: 3 }>;

type ToolcraftPrototypeChecks = readonly [
  "integrity",
  "ai-check",
  "test",
  "build",
  "playwright-functional",
  "playwright-smoke",
];

type ToolcraftFullPerformanceChecks = readonly [
  "integrity",
  "ai-check",
  "test",
  "build",
  "playwright-functional",
  "playwright-performance",
];

export const TOOLCRAFT_PROTOTYPE_DELIVERY_CHECKS: ToolcraftPrototypeChecks;
export const TOOLCRAFT_FULL_PERFORMANCE_DELIVERY_CHECKS: ToolcraftFullPerformanceChecks;

export type ToolcraftPerformanceSmokeEvidence = Readonly<{
  completedAt: string;
  fixtureSelector: "development";
  kind: "performance-smoke";
  runner: "protected-playwright-smoke";
  sourceHash: string;
  testName: "browser smoke: toolcraft prototype responsiveness";
  version: 1;
}>;

type ToolcraftPrototypeFields = Readonly<{
  baselineEvidenceHash?: never;
  baselineSourceHash?: never;
  changedFiles?: never;
  checks: ToolcraftPrototypeChecks;
  comparisonFiles?: never;
  comparisonSourceHash?: never;
  mode: "prototype";
  smokeEvidence: ToolcraftPerformanceSmokeEvidence;
  verification?: never;
  verificationTier?: never;
}>;

export type ToolcraftPrototypeDeliveryReceipt =
  ToolcraftCurrentDeliveryReceiptBase & ToolcraftPrototypeFields;
export type ToolcraftLegacyPrototypeDeliveryReceipt =
  | (ToolcraftLegacyDeliveryReceiptBase & ToolcraftPrototypeFields)
  | (ToolcraftCanonicalLegacyDeliveryReceiptBase & ToolcraftPrototypeFields);

type ToolcraftExplicitPerformanceFields = Readonly<{
  baselineEvidenceHash: string;
  baselineSourceHash: string;
  changedFiles?: never;
  checks: ToolcraftFullPerformanceChecks;
  comparisonFiles?: never;
  comparisonSourceHash?: never;
  mode: "explicit-performance";
  smokeEvidence?: never;
  verification?: never;
  verificationTier?: never;
}>;

export type ToolcraftExplicitPerformanceDeliveryReceipt =
  ToolcraftCurrentDeliveryReceiptBase & ToolcraftExplicitPerformanceFields;
export type ToolcraftLegacyExplicitPerformanceDeliveryReceipt =
  | (ToolcraftLegacyDeliveryReceiptBase & ToolcraftExplicitPerformanceFields)
  | (ToolcraftCanonicalLegacyDeliveryReceiptBase &
      ToolcraftExplicitPerformanceFields);

type ToolcraftTargetedFields<Mode, Verification> = Readonly<{
  changedFiles: readonly string[];
  checks: readonly string[];
  comparisonFiles: readonly ToolcraftVerificationFileEntry[];
  comparisonSourceHash: string;
  mode: Mode;
  smokeEvidence?: never;
  verification: Verification;
  verificationTier: ToolcraftVerificationTier;
}>;

type ToolcraftOptionalBaselineLinkage =
  | Readonly<{
      baselineEvidenceHash?: never;
      baselineSourceHash?: never;
    }>
  | Readonly<{
      baselineEvidenceHash: string;
      baselineSourceHash: string;
    }>;

export type ToolcraftOrdinaryDeliveryReceipt =
  ToolcraftCurrentDeliveryReceiptBase &
    ToolcraftTargetedFields<
      "ordinary",
      ToolcraftTargetedIterationVerification
    > &
    ToolcraftOptionalBaselineLinkage;

export type ToolcraftPerformanceIterationDeliveryReceipt =
  ToolcraftCurrentDeliveryReceiptBase &
    ToolcraftTargetedFields<
      "performance-iteration",
      ToolcraftTargetedIterationVerification
    > &
    ToolcraftOptionalBaselineLinkage;

export type ToolcraftLegacyOrdinaryDeliveryReceipt =
  | (ToolcraftLegacyDeliveryReceiptBase &
      ToolcraftTargetedFields<
        "ordinary",
        ToolcraftLegacyTargetedIterationVerification
      > &
      ToolcraftOptionalBaselineLinkage)
  | (ToolcraftCanonicalLegacyDeliveryReceiptBase &
      ToolcraftTargetedFields<
        "ordinary",
        ToolcraftCanonicalLegacyTargetedIterationVerification
      > &
      ToolcraftOptionalBaselineLinkage);

export type ToolcraftLegacyPerformanceIterationDeliveryReceipt =
  | (ToolcraftLegacyDeliveryReceiptBase &
      ToolcraftTargetedFields<
        "performance-iteration",
        ToolcraftLegacyTargetedIterationVerification
      > &
      ToolcraftOptionalBaselineLinkage)
  | (ToolcraftCanonicalLegacyDeliveryReceiptBase &
      ToolcraftTargetedFields<
        "performance-iteration",
        ToolcraftCanonicalLegacyTargetedIterationVerification
      > &
      ToolcraftOptionalBaselineLinkage);

export type ToolcraftDeliveryReceipt =
  | ToolcraftPrototypeDeliveryReceipt
  | ToolcraftLegacyPrototypeDeliveryReceipt
  | ToolcraftOrdinaryDeliveryReceipt
  | ToolcraftLegacyOrdinaryDeliveryReceipt
  | ToolcraftPerformanceIterationDeliveryReceipt
  | ToolcraftLegacyPerformanceIterationDeliveryReceipt
  | ToolcraftExplicitPerformanceDeliveryReceipt
  | ToolcraftLegacyExplicitPerformanceDeliveryReceipt;

export function isToolcraftTargetedDeliveryMode(
  mode: unknown,
): mode is "ordinary" | "performance-iteration";

export function getToolcraftDeliveryReceiptShapeError(
  receipt: unknown,
): string | undefined;
export function readToolcraftDeliveryReceipt(rootDir: string): Promise<{
  error?: string;
  missing?: boolean;
  receipt?: ToolcraftDeliveryReceipt;
}>;
export function validateToolcraftDeliveryReceipt(options: {
  rootDir: string;
}): Promise<string[]>;
