import type {
  ToolcraftDeliveryCatalog,
  ToolcraftVerificationImpact,
} from "./toolcraft-verification-impact.d.mts";
import type {
  ToolcraftTargetedPerformanceComparisonHash,
  ToolcraftTargetedPerformanceReport,
} from "./toolcraft-targeted-performance-report.d.mts";
import type {
  ToolcraftPerformanceRequestAuthority,
} from "./toolcraft-performance-authority-policy.d.mts";

export type ToolcraftPackageManager = "npm" | "pnpm" | "yarn" | "bun";

export type ToolcraftVerificationInventoryEntry = Readonly<{
  path: string;
  sha256: string;
}>;

export type ToolcraftVerificationInventory = Readonly<{
  entries: readonly ToolcraftVerificationInventoryEntry[];
  sourceHash: string;
}>;

export type ToolcraftDeliveryLifecycleState = Readonly<{
  consumedPerformanceRequestAuthorityHashes: readonly string[];
  performanceEscalationOffered: boolean;
}>;

export type ToolcraftFunctionalProofStep =
  | Readonly<{
      kind: "dependencies";
      packageManager: ToolcraftPackageManager;
    }>
  | Readonly<{ kind: "docs" }>
  | Readonly<{ kind: "code-health" }>
  | Readonly<{ kind: "product-tests"; files: readonly string[] }>
  | Readonly<{ kind: "build" }>
  | Readonly<{
      kind: "browser-functional";
      testNames: readonly string[];
    }>;

export type ToolcraftBrowserPerformanceProofStep = Readonly<{
  kind: "browser-performance";
  testNames: readonly string[];
  pathIds: readonly string[];
  passIds: readonly string[];
}>;

export type ToolcraftProofStep =
  | ToolcraftFunctionalProofStep
  | ToolcraftBrowserPerformanceProofStep;

export type ToolcraftDeliveryPerformanceComparison =
  | Readonly<{ kind: "none" }>
  | Readonly<{
      kind: "compatible-targeted-report";
      report: ToolcraftTargetedPerformanceReport;
      comparisonHash: ToolcraftTargetedPerformanceComparisonHash;
    }>;

export type ToolcraftInitialDeliveryBasis = Readonly<{
  kind: "initial";
}>;

export type ToolcraftChangedDeliveryBasis = Readonly<{
  kind: "changed";
  comparisonInventory: ToolcraftVerificationInventory;
  changedFiles: readonly string[];
}>;

export type ToolcraftDeliveryBasis =
  | ToolcraftInitialDeliveryBasis
  | ToolcraftChangedDeliveryBasis;

export type FunctionalDeliveryPlan = Readonly<{
  basis: ToolcraftDeliveryBasis;
  kind: "functional";
  lifecycle: ToolcraftDeliveryLifecycleState;
  sourceHash: string;
  manifestHash: string;
  steps: readonly ToolcraftFunctionalProofStep[];
}>;

export type PerformanceIterationPlan = Readonly<{
  basis: ToolcraftChangedDeliveryBasis;
  kind: "performance-iteration";
  lifecycle: ToolcraftDeliveryLifecycleState;
  sourceHash: string;
  manifestHash: string;
  requestAuthorityHash: string;
  performanceComparison: ToolcraftDeliveryPerformanceComparison;
  steps: readonly [
    ...ToolcraftFunctionalProofStep[],
    ToolcraftBrowserPerformanceProofStep,
  ];
}>;

export type ToolcraftDeliveryPlan =
  | FunctionalDeliveryPlan
  | PerformanceIterationPlan;

export type ToolcraftDeliveryPlanningInputs = Readonly<{
  allProductTestFiles: readonly string[];
  authority: ToolcraftPerformanceRequestAuthority | null;
  catalog: ToolcraftDeliveryCatalog;
  changeSet: Readonly<{
    dependencyChanged: boolean;
    docsChanged: boolean;
    impact: ToolcraftVerificationImpact | null;
    platformChanged: boolean;
    productInputsChanged: boolean;
  }>;
  comparisonInventory: ToolcraftVerificationInventory | null;
  currentInventory: ToolcraftVerificationInventory;
  integrity: Readonly<{ manifestHash: string; sourceHash: string }>;
  packageManager: ToolcraftPackageManager;
  previousLifecycle: ToolcraftDeliveryLifecycleState;
  previousPerformance:
    | Readonly<{ kind: "none" }>
    | Readonly<{
        kind: "performance-iteration-report";
        requestAuthorityHash: string;
        report: ToolcraftTargetedPerformanceReport;
        comparisonHash: ToolcraftTargetedPerformanceComparisonHash;
      }>;
}>;

export const TOOLCRAFT_DELIVERY_PLAN_VERSION: 3;

export function createToolcraftDeliveryPlan(
  inputs: ToolcraftDeliveryPlanningInputs,
): ToolcraftDeliveryPlan;

export function getToolcraftDeliveryPlanError(
  plan: unknown,
): string | undefined;

export function createToolcraftDeliveryPlanHash(
  plan: ToolcraftDeliveryPlan,
): string;

export function getToolcraftDeliveryDiagnosticTier(
  plan: ToolcraftDeliveryPlan,
): 0 | 1 | 2 | 3 | 4;
