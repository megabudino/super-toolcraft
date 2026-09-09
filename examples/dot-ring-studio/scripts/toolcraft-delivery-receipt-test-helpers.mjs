import {
  createToolcraftCheckpointBundle,
  readToolcraftCheckpointBundle,
  writeToolcraftCheckpointBundle,
} from "./toolcraft-checkpoint-bundle.mjs";
import { createToolcraftVerificationSourceHash } from "./toolcraft-verification-inventory.mjs";
import {
  createTargetedMeasurementFixture,
} from "./toolcraft-verification-receipt-test-helpers.mjs";
import {
  EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
  createToolcraftDeliveryLifecycleState,
} from "./toolcraft-delivery-lifecycle-state.mjs";
import {
  createToolcraftTargetedPerformanceReport,
  createToolcraftTargetedPerformanceReportHash,
} from "./toolcraft-targeted-performance-report.mjs";

const hash = (character) => character.repeat(64);
const performancePathId = "control-drag:composite";
const performanceTestName = "browser perf: focused workload";

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

export function createInventory(files) {
  const entries = Object.entries(files)
    .map(([path, sha256]) => ({ path, sha256 }))
    .sort((left, right) => left.path.localeCompare(right.path));
  return {
    entries,
    sourceHash: createToolcraftVerificationSourceHash(entries),
  };
}

export function createPlanReceiptFixture(kind = "ordinary") {
  const comparisonInventory = createInventory({
    "src/app/app-schema.ts": hash("1"),
  });
  const finalInventory = createInventory({
    "src/app/app-schema.ts": hash("2"),
  });
  const common = {
    changedFiles: ["src/app/app-schema.ts"],
    comparisonInventory,
    lifecycle: EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
    manifestHash: hash("a"),
    sourceHash: finalInventory.sourceHash,
  };
  if (kind === "prototype") {
    const plan = deepFreeze({
      kind,
      lifecycle: EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
      manifestHash: hash("a"),
      sourceHash: finalInventory.sourceHash,
      steps: [
        { kind: "docs" },
        { kind: "code-health" },
        {
          files: ["src/app/app-schema.test.ts"],
          kind: "product-tests",
        },
        { kind: "build" },
        {
          kind: "browser-functional-smoke",
          smokeTestName: "browser smoke: toolcraft prototype responsiveness",
          testNames: ["browser: focused acceptance"],
        },
      ],
    });
    return {
      plan,
      result: {
        evidence: [
          { kind: "docs" },
          { kind: "code-health" },
          {
            files: ["src/app/app-schema.test.ts"],
            kind: "product-tests",
          },
          { kind: "build" },
          {
            kind: "browser-functional-smoke",
            smokeEvidence: {
              fixtureSelector: "development",
              kind: "performance-smoke",
              sourceHash: plan.sourceHash,
              testName: "browser smoke: toolcraft prototype responsiveness",
            },
            testNames: ["browser: focused acceptance"],
          },
        ],
        finalInventory,
      },
    };
  }
  if (kind === "ordinary") {
    return {
      plan: deepFreeze({
        kind,
        ...common,
        steps: [{ kind: "docs" }],
      }),
      result: {
        evidence: [{ kind: "docs" }],
        finalInventory,
      },
    };
  }
  const requestAuthorityHash = hash("d");
  const targetedPerformanceReport = createToolcraftTargetedPerformanceReport({
    fixtureResolutionMode: "strict-development",
    fixtureSelector: "development",
    measurements: createTargetedMeasurementFixture([performancePathId]),
    nonce: "fixture-targeted-report",
    performancePassIds: ["composite"],
    performancePathIds: [performancePathId],
    requestAuthorityHash,
    sourceHash: finalInventory.sourceHash,
    testNames: [performanceTestName],
  });
  const testEvidence = [{
    fullTitle: `app-controls.spec.ts › ${performanceTestName}`,
    leafTitle: performanceTestName,
  }];
  const plan = deepFreeze({
    kind: "performance-iteration",
    ...common,
    lifecycle: createToolcraftDeliveryLifecycleState({
      requestAuthorityHash,
    }),
    performanceComparison: { kind: "none" },
    requestAuthorityHash,
    steps: [
      { kind: "build" },
      {
        kind: "browser-functional",
        testNames: ["browser: focused acceptance"],
      },
      {
        kind: "browser-performance",
        passIds: ["composite"],
        pathIds: [performancePathId],
        testNames: [performanceTestName],
      },
    ],
  });
  return {
    plan,
    result: {
      evidence: [
        { kind: "build" },
        {
          kind: "browser-functional",
          testNames: ["browser: focused acceptance"],
        },
        {
          kind: "browser-performance",
          passIds: ["composite"],
          pathIds: [performancePathId],
          report: targetedPerformanceReport,
          reportHash: createToolcraftTargetedPerformanceReportHash({
            report: targetedPerformanceReport,
            testEvidence,
          }),
          testEvidence,
          testNames: [performanceTestName],
        },
      ],
      finalInventory,
    },
  };
}

export async function writeDeliveryReceiptFixture(rootDir, receipt) {
  const loaded = await readToolcraftCheckpointBundle(rootDir);
  if (loaded.error) throw new Error(loaded.error);
  const bundle = loaded.missing
    ? createToolcraftCheckpointBundle({ delivery: receipt })
    : { ...loaded.bundle, delivery: receipt };
  await writeToolcraftCheckpointBundle({ bundle, rootDir });
}
