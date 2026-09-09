import type {
  ToolcraftDeliveryReceipt,
  ToolcraftDeliveryStepEvidence,
} from "./toolcraft-delivery-receipt.mjs";
import type {
  ToolcraftDeliveryLifecycleState,
  ToolcraftDeliveryPlan,
  ToolcraftDeliveryPlanningInputs,
} from "./toolcraft-delivery-plan.mjs";

const files = [{ path: "src/app/app-schema.ts", sha256: "a".repeat(64) }];
const comparisonFiles = [
  { path: "src/app/app-schema.ts", sha256: "b".repeat(64) },
];
const lifecycle: ToolcraftDeliveryLifecycleState = {
  consumedPerformanceRequestAuthorityHashes: ["e".repeat(64)],
  performanceEscalationOffered: true,
};
const plan: ToolcraftDeliveryPlan = {
  changedFiles: ["src/app/app-schema.ts"],
  comparisonInventory: {
    entries: comparisonFiles,
    sourceHash: "b".repeat(64),
  },
  kind: "ordinary",
  lifecycle,
  manifestHash: "c".repeat(64),
  sourceHash: "a".repeat(64),
  steps: [{ kind: "docs" }],
};
const evidence: readonly ToolcraftDeliveryStepEvidence[] = [
  { kind: "docs" },
];
const receipt: ToolcraftDeliveryReceipt = {
  completedAt: "2026-07-24T00:00:00.000Z",
  evidence,
  files,
  kind: "delivery-verification",
  manifestHash: plan.manifestHash,
  plan,
  planHash: "d".repeat(64),
  planVersion: 2,
  runner: "protected-delivery",
  sourceHash: plan.sourceHash,
  status: "passed",
  version: 5,
};

const withLegacyMode = { ...receipt, mode: "ordinary" as const };
// @ts-expect-error Current delivery receipts cannot carry a legacy mode.
const invalidMode: ToolcraftDeliveryReceipt = withLegacyMode;
const withBaseline = {
  ...receipt,
  baselineEvidenceHash: "e".repeat(64),
  baselineSourceHash: "f".repeat(64),
};
// @ts-expect-error Current delivery receipts cannot carry baseline linkage.
const invalidBaseline: ToolcraftDeliveryReceipt = withBaseline;
const withOldPlanVersion = { ...receipt, planVersion: 1 as const };
// @ts-expect-error Current delivery receipts require plan version 2.
const invalidPlanVersion: ToolcraftDeliveryReceipt = withOldPlanVersion;
const { lifecycle: _lifecycle, ...withoutLifecycle } = plan;
// @ts-expect-error Every current delivery plan requires lifecycle metadata.
const invalidPlan: ToolcraftDeliveryPlan = withoutLifecycle;
// @ts-expect-error Lifecycle authority history is immutable.
plan.lifecycle.consumedPerformanceRequestAuthorityHashes.push("f".repeat(64));
declare const planningInputs: ToolcraftDeliveryPlanningInputs;
const previousLifecycle: ToolcraftDeliveryLifecycleState =
  planningInputs.previousLifecycle;

void [
  receipt,
  invalidMode,
  invalidBaseline,
  invalidPlanVersion,
  invalidPlan,
  previousLifecycle,
];
