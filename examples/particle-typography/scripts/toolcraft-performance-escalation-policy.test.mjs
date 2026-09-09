import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeToolcraftDeliveryAnchor,
} from "./toolcraft-delivery-anchor.mjs";
import {
  createToolcraftDeliveryReceipt,
} from "./toolcraft-delivery-receipt.mjs";
import {
  createToolcraftDeliveryPlan,
} from "./toolcraft-delivery-plan.mjs";
import {
  EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
} from "./toolcraft-delivery-lifecycle-state.mjs";
import {
  createInventory,
  createPlanReceiptFixture,
} from "./toolcraft-delivery-receipt-test-helpers.mjs";
import {
  formatToolcraftPerformanceEscalationRecommendation,
  getToolcraftPerformanceEscalationRecommendation,
} from "./toolcraft-performance-escalation-policy.mjs";
import {
  TOOLCRAFT_FULL_PERFORMANCE_VERIFICATION_COMMAND,
} from "./toolcraft-performance-authority-policy.mjs";
import {
  createToolcraftTargetedPerformanceReport,
  createToolcraftTargetedPerformanceReportHash,
} from "./toolcraft-targeted-performance-report.mjs";
import {
  createTargetedMeasurementFixture,
} from "./toolcraft-verification-receipt-test-helpers.mjs";

const hash = (character) => character.repeat(64);
const pathId =
  "performance-path:%5B%22interactive-discrete%22%2C%22control-change%22%2C%5B%22composite%22%5D%2C%5B%22main%22%5D%2C%5B%5D%5D";
const performanceTestName = `browser perf: toolcraft path ${pathId}`;
const functionalTestName = "browser: focused acceptance";
const expectedRecommendation = {
  command: TOOLCRAFT_FULL_PERFORMANCE_VERIFICATION_COMMAND,
  kind: "offer-full-performance-audit",
  reason: "two-consecutive-compatible-performance-iterations",
  requiresExplicitUserConsent: true,
};

function createFirstPlannerReceipt() {
  const comparisonInventory = createInventory({
    "src/app/app-schema.ts": hash("1"),
  });
  const finalInventory = createInventory({
    "src/app/app-schema.ts": hash("2"),
  });
  const requestAuthorityHash = hash("d");
  const plan = createToolcraftDeliveryPlan({
    allProductTestFiles: ["src/app/app-schema.test.ts"],
    authority: {
      hash: requestAuthorityHash,
      pathIds: [pathId],
      requestEvidence: "The preview is slow.",
    },
    catalog: {
      acceptance: [{
        acceptanceId: "output.updates",
        file: "app-controls.spec.ts",
        testName: functionalTestName,
      }],
      performance: [{
        passIds: ["composite"],
        pathId,
        testName: performanceTestName,
      }],
      version: 1,
    },
    changeSet: {
      dependencyChanged: false,
      docsChanged: false,
      impact: {
        acceptanceIds: ["output.updates"],
        browserTestNames: [functionalTestName],
        kind: "performance",
        performancePassIds: ["composite"],
        performancePathIds: [pathId],
        performanceTestNames: [performanceTestName],
        productTestFiles: [],
      },
      platformChanged: false,
      productInputsChanged: true,
    },
    comparisonInventory,
    currentInventory: finalInventory,
    integrity: {
      manifestHash: hash("a"),
      sourceHash: finalInventory.sourceHash,
    },
    packageManager: "pnpm",
    previousLifecycle: EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
    previousPerformance: { kind: "none" },
  });
  const testEvidence = [{
    fullTitle: `app-controls.spec.ts › ${performanceTestName}`,
    leafTitle: performanceTestName,
  }];
  const report = createToolcraftTargetedPerformanceReport({
    fixtureResolutionMode: "strict-development",
    fixtureSelector: "development",
    measurements: createTargetedMeasurementFixture([pathId]),
    nonce: "first-planner-receipt",
    performancePassIds: ["composite"],
    performancePathIds: [pathId],
    requestAuthorityHash,
    sourceHash: finalInventory.sourceHash,
    testNames: [performanceTestName],
  });
  return createToolcraftDeliveryReceipt({
    plan,
    result: {
      evidence: plan.steps.map((step) =>
        step.kind === "browser-performance"
          ? {
              ...step,
              report,
              reportHash: createToolcraftTargetedPerformanceReportHash({
                report,
                testEvidence,
              }),
              testEvidence,
            }
          : { ...step }
      ),
      finalInventory,
    },
  });
}

function createCompatibleReceipt(
  previousReceipt,
  requestAuthorityHash,
  inventoryCharacter,
) {
  const previousAnchor =
    normalizeToolcraftDeliveryAnchor(previousReceipt);
  const finalInventory = createInventory({
    "src/app/app-schema.ts": hash(inventoryCharacter),
  });
  const previousEvidence = previousReceipt.evidence.at(-1);
  const previousPerformanceStep = previousReceipt.plan.steps.find(
    ({ kind }) => kind === "browser-performance",
  );
  const previousFunctionalStep = previousReceipt.plan.steps.find(
    ({ kind }) => kind === "browser-functional",
  );
  const report = createToolcraftTargetedPerformanceReport({
    ...previousEvidence.report,
    requestAuthorityHash,
    sourceHash: finalInventory.sourceHash,
  });
  const reportHash = createToolcraftTargetedPerformanceReportHash({
    report,
    testEvidence: previousEvidence.testEvidence,
  });
  const plan = createToolcraftDeliveryPlan({
    allProductTestFiles: ["src/app/app-schema.test.ts"],
    authority: {
      hash: requestAuthorityHash,
      pathIds: previousPerformanceStep.pathIds,
      requestEvidence: "The preview is still slow.",
    },
    catalog: {
      acceptance: [{
        acceptanceId: "output.updates",
        file: "app-controls.spec.ts",
        testName: previousFunctionalStep.testNames[0],
      }],
      performance: [{
        passIds: previousPerformanceStep.passIds,
        pathId: previousPerformanceStep.pathIds[0],
        testName: previousPerformanceStep.testNames[0],
      }],
      version: 1,
    },
    changeSet: {
      dependencyChanged: false,
      docsChanged: false,
      impact: {
        acceptanceIds: ["output.updates"],
        browserTestNames: previousFunctionalStep.testNames,
        kind: "performance",
        performancePassIds: previousPerformanceStep.passIds,
        performancePathIds: previousPerformanceStep.pathIds,
        performanceTestNames: previousPerformanceStep.testNames,
        productTestFiles: [],
      },
      platformChanged: false,
      productInputsChanged: true,
    },
    comparisonInventory: {
      entries: previousReceipt.files,
      sourceHash: previousReceipt.sourceHash,
    },
    currentInventory: finalInventory,
    integrity: {
      manifestHash: previousReceipt.manifestHash,
      sourceHash: finalInventory.sourceHash,
    },
    packageManager: "pnpm",
    previousLifecycle: previousAnchor.lifecycle,
    previousPerformance: previousAnchor.performance,
  });
  return createToolcraftDeliveryReceipt({
    plan,
    result: {
      evidence: plan.steps.map((step) =>
        step.kind === "browser-performance"
          ? {
              ...step,
              report,
              reportHash,
              testEvidence: previousEvidence.testEvidence,
            }
          : { ...step }
      ),
      finalInventory,
    },
  });
}

function createCompatiblePair() {
  const firstReceipt = createFirstPlannerReceipt();
  const previousAnchor = normalizeToolcraftDeliveryAnchor(firstReceipt);
  const currentReceipt = createCompatibleReceipt(
    firstReceipt,
    hash("e"),
    "3",
  );
  return { currentReceipt, previousAnchor };
}

test("does not recommend a full audit after the first performance iteration", () => {
  const currentReceipt = createToolcraftDeliveryReceipt(
    createPlanReceiptFixture("performance-iteration"),
  );
  const previousAnchor = normalizeToolcraftDeliveryAnchor(
    createToolcraftDeliveryReceipt(createPlanReceiptFixture("ordinary")),
  );
  assert.equal(
    getToolcraftPerformanceEscalationRecommendation({
      currentReceipt,
      previousAnchor,
    }),
    null,
  );
});

test("recommends but never invokes a full audit after two compatible iterations", () => {
  const pair = createCompatiblePair();
  assert.deepEqual(
    getToolcraftPerformanceEscalationRecommendation(pair),
    expectedRecommendation,
  );
  const message = formatToolcraftPerformanceEscalationRecommendation(
    expectedRecommendation,
  );
  assert.match(message, /offer.*complete performance audit/iu);
  assert.match(
    message,
    new RegExp(
      `do not run ${TOOLCRAFT_FULL_PERFORMANCE_VERIFICATION_COMMAND.replace(
        /[.*+?^${}()|[\]\\]/gu,
        "\\$&",
      )} without explicit user consent`,
      "iu",
    ),
  );
  assert.equal(
    Object.hasOwn(expectedRecommendation, "execute"),
    false,
  );
});

test("three compatible iterations produce exactly one durable offer", () => {
  const second = createCompatiblePair();
  const thirdReceipt = createCompatibleReceipt(
    second.currentReceipt,
    hash("f"),
    "4",
  );
  const third = {
    currentReceipt: thirdReceipt,
    previousAnchor: normalizeToolcraftDeliveryAnchor(
      second.currentReceipt,
    ),
  };

  assert.equal(
    second.previousAnchor.lifecycle.performanceEscalationOffered,
    false,
  );
  assert.equal(
    second.currentReceipt.plan.lifecycle.performanceEscalationOffered,
    true,
  );
  assert.equal(
    third.currentReceipt.plan.lifecycle.performanceEscalationOffered,
    true,
  );
  assert.deepEqual(
    getToolcraftPerformanceEscalationRecommendation(second),
    expectedRecommendation,
  );
  assert.equal(
    getToolcraftPerformanceEscalationRecommendation(third),
    null,
  );
});

test("rejects a comparison not bound to the previous protected report", () => {
  const { currentReceipt, previousAnchor } = createCompatiblePair();
  assert.equal(
    getToolcraftPerformanceEscalationRecommendation({
      currentReceipt,
      previousAnchor: {
        ...previousAnchor,
        performance: {
          ...previousAnchor.performance,
          reportHash: hash("0"),
        },
      },
    }),
    null,
  );
});

test("rejects malformed current receipts without interpreting legacy policy", () => {
  const { previousAnchor } = createCompatiblePair();
  assert.equal(
    getToolcraftPerformanceEscalationRecommendation({
      currentReceipt: { version: 4 },
      previousAnchor,
    }),
    null,
  );
});
