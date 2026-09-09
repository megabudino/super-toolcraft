import type {
  ToolcraftDeliveryCatalog,
  ToolcraftVerificationImpact,
} from "./toolcraft-verification-impact.d.mts";
import type { ToolcraftTargetedPerformanceReport } from "./toolcraft-targeted-performance-report.d.mts";

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

export type ToolcraftProofStep =
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
    }>
  | Readonly<{
      kind: "browser-functional-smoke";
      testNames: readonly string[];
      smokeTestName: string;
    }>
  | Readonly<{
      kind: "browser-performance";
      testNames: readonly string[];
      pathIds: readonly string[];
      passIds: readonly string[];
    }>;

export type ToolcraftDeliveryPerformanceComparison =
  | Readonly<{ kind: "none" }>
  | Readonly<{
      kind: "compatible-targeted-report";
      report: ToolcraftTargetedPerformanceReport;
      reportHash: string;
    }>;

export type ToolcraftDeliveryPlan =
  | Readonly<{
      kind: "prototype";
      lifecycle: ToolcraftDeliveryLifecycleState;
      sourceHash: string;
      manifestHash: string;
      steps: readonly ToolcraftProofStep[];
    }>
  | Readonly<{
      kind: "ordinary";
      comparisonInventory: ToolcraftVerificationInventory;
      lifecycle: ToolcraftDeliveryLifecycleState;
      sourceHash: string;
      changedFiles: readonly string[];
      manifestHash: string;
      steps: readonly ToolcraftProofStep[];
    }>
  | Readonly<{
      kind: "performance-iteration";
      comparisonInventory: ToolcraftVerificationInventory;
      lifecycle: ToolcraftDeliveryLifecycleState;
      sourceHash: string;
      changedFiles: readonly string[];
      manifestHash: string;
      requestAuthorityHash: string;
      performanceComparison: ToolcraftDeliveryPerformanceComparison;
      steps: readonly ToolcraftProofStep[];
    }>;

export type ToolcraftDeliveryPlanningInputs = Readonly<{
  allProductTestFiles: readonly string[];
  authority:
    | Readonly<{
        hash: string;
        pathIds: readonly string[];
        requestEvidence: string;
      }>
    | null;
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
        kind: "ordinary-targeted-report";
        report: ToolcraftTargetedPerformanceReport;
        reportHash: string;
      }>
    | Readonly<{
        kind: "performance-iteration-report";
        requestAuthorityHash: string;
        report: ToolcraftTargetedPerformanceReport;
        reportHash: string;
      }>;
}>;

export const TOOLCRAFT_DELIVERY_PLAN_VERSION: 2;

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
