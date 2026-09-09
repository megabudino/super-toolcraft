import type {
  ToolcraftExplicitPerformanceDeliveryReceipt,
  ToolcraftLegacyOrdinaryDeliveryReceipt,
  ToolcraftOrdinaryDeliveryReceipt,
  ToolcraftPerformanceIterationDeliveryReceipt,
  ToolcraftPerformanceSmokeEvidence,
  ToolcraftPrototypeDeliveryReceipt,
} from "./toolcraft-delivery-receipt.mjs";
import type {
  ToolcraftCanonicalLegacyTargetedIterationVerification,
  ToolcraftLegacyPerformanceIterationReceipt,
  ToolcraftLegacyTargetedIterationVerification,
  ToolcraftPerformanceIterationReceipt,
  ToolcraftTargetedIterationVerification,
} from "./toolcraft-verification-receipt.mjs";

const files = [{ path: "src/app/app-schema.ts", sha256: "a".repeat(64) }];
const smokeEvidence: ToolcraftPerformanceSmokeEvidence = {
  completedAt: "2026-07-20T00:00:00.000Z",
  fixtureSelector: "development",
  kind: "performance-smoke",
  runner: "protected-playwright-smoke",
  sourceHash: "a".repeat(64),
  testName: "browser smoke: toolcraft prototype responsiveness",
  version: 1,
};
const verification: ToolcraftTargetedIterationVerification = {
  browserTestEvidence: [],
  browserTests: [],
  browserTestTitles: [],
  checks: ["typecheck"],
  performancePassIds: [],
  performanceComparison: null,
  performancePathIds: [],
  performanceTestEvidence: [],
  performanceTests: [],
  performanceTestTitles: [],
  runner: "protected-iteration",
  targetedPerformanceReport: null,
  targetedPerformanceReportHash: null,
  unitTests: [],
};
const common = {
  completedAt: "2026-07-20T00:00:00.000Z",
  files,
  kind: "delivery-verification" as const,
  runner: "protected-delivery" as const,
  sourceHash: "a".repeat(64),
  status: "passed" as const,
  version: 4 as const,
};

const prototype: ToolcraftPrototypeDeliveryReceipt = {
  ...common,
  checks: [
    "integrity",
    "ai-check",
    "test",
    "build",
    "playwright-functional",
    "playwright-smoke",
  ],
  mode: "prototype",
  smokeEvidence,
};
const prototypeWithOrdinaryFields = {
  ...prototype,
  changedFiles: [],
  comparisonFiles: files,
  comparisonSourceHash: "a".repeat(64),
  verification,
  verificationTier: 0 as const,
};
// @ts-expect-error Prototype authority cannot carry ordinary comparison fields.
const invalidPrototype: ToolcraftPrototypeDeliveryReceipt =
  prototypeWithOrdinaryFields;

const explicitPerformance: ToolcraftExplicitPerformanceDeliveryReceipt = {
  ...common,
  baselineEvidenceHash: "b".repeat(64),
  baselineSourceHash: "a".repeat(64),
  checks: [
    "integrity",
    "ai-check",
    "test",
    "build",
    "playwright-functional",
    "playwright-performance",
  ],
  mode: "explicit-performance",
};
const explicitWithOrdinaryFields = {
  ...explicitPerformance,
  changedFiles: [],
  comparisonFiles: files,
  comparisonSourceHash: "a".repeat(64),
  verification,
  verificationTier: 0 as const,
};
// @ts-expect-error Full performance authority cannot carry ordinary fields.
const invalidExplicit: ToolcraftExplicitPerformanceDeliveryReceipt =
  explicitWithOrdinaryFields;
const explicitWithSmoke = { ...explicitPerformance, smokeEvidence };
// @ts-expect-error Full performance authority cannot carry smoke evidence.
const invalidExplicitSmoke: ToolcraftExplicitPerformanceDeliveryReceipt =
  explicitWithSmoke;

const ordinary: ToolcraftOrdinaryDeliveryReceipt = {
  ...common,
  changedFiles: [],
  checks: ["integrity", "ai-check", "docs-check", "typecheck"],
  comparisonFiles: files,
  comparisonSourceHash: "a".repeat(64),
  mode: "ordinary",
  verification,
  verificationTier: 0,
};
const ordinaryWithSmoke = { ...ordinary, smokeEvidence };
// @ts-expect-error Ordinary targeted authority cannot carry smoke evidence.
const invalidOrdinary: ToolcraftOrdinaryDeliveryReceipt = ordinaryWithSmoke;

const performanceIteration: ToolcraftPerformanceIterationDeliveryReceipt = {
  ...ordinary,
  mode: "performance-iteration",
};

const legacyVerification: ToolcraftLegacyTargetedIterationVerification = {
  browserTests: [],
  checks: ["typecheck"],
  performancePassIds: [],
  performancePathIds: [],
  performanceTests: [],
  runner: "protected-iteration",
  unitTests: [],
};
const legacyOrdinary: ToolcraftLegacyOrdinaryDeliveryReceipt = {
  ...ordinary,
  verification: legacyVerification,
  version: 2,
};
const canonicalLegacyVerification: ToolcraftCanonicalLegacyTargetedIterationVerification = {
  browserTestEvidence: [],
  browserTests: [],
  browserTestTitles: [],
  checks: ["typecheck", "build", "playwright-targeted-performance"],
  performancePassIds: ["composite"],
  performancePathIds: ["control-drag:composite"],
  performanceTestEvidence: [
    {
      fullTitle: "app-controls.spec.ts › browser perf: focused workload",
      leafTitle: "browser perf: focused workload",
    },
  ],
  performanceTests: ["browser perf: focused workload"],
  performanceTestTitles: [
    "app-controls.spec.ts › browser perf: focused workload",
  ],
  runner: "protected-iteration",
  targetedPerformanceReport: {
    nonce: "legacy-report",
    performancePassIds: ["composite"],
    performancePathIds: ["control-drag:composite"],
    sourceHash: common.sourceHash,
    testNames: ["browser perf: focused workload"],
    version: 1,
  },
  targetedPerformanceReportHash: "b".repeat(64),
  unitTests: [],
};
const canonicalLegacyOrdinary: ToolcraftLegacyOrdinaryDeliveryReceipt = {
  ...ordinary,
  verification: canonicalLegacyVerification,
  version: 3,
};
const performanceReceiptFields = {
  baselineEvidenceHash: "b".repeat(64),
  baselineSourceHash: "a".repeat(64),
  changedFiles: ["src/app/app-schema.ts"],
  completedAt: common.completedAt,
  files,
  kind: "performance-iteration" as const,
  reasonCode: "post-first-working-targeted-verification" as const,
  sourceHash: common.sourceHash,
  status: "passed-targeted" as const,
  verificationTier: 2 as const,
};
const currentPerformanceIteration: ToolcraftPerformanceIterationReceipt = {
  ...performanceReceiptFields,
  verification,
  version: 4,
};
const legacyPerformanceIteration: ToolcraftLegacyPerformanceIterationReceipt = {
  ...performanceReceiptFields,
  verification: legacyVerification,
  version: 3,
};

void [
  prototype,
  explicitPerformance,
  ordinary,
  performanceIteration,
  legacyOrdinary,
  canonicalLegacyOrdinary,
  currentPerformanceIteration,
  legacyPerformanceIteration,
  invalidPrototype,
  invalidExplicit,
  invalidExplicitSmoke,
  invalidOrdinary,
];
