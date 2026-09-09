import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeToolcraftDeliveryAnchor,
} from "./toolcraft-delivery-anchor.mjs";
import {
  executeToolcraftDeliveryLifecycleCore,
} from "./toolcraft-delivery-lifecycle.mjs";
import {
  EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
} from "./toolcraft-delivery-lifecycle-state.mjs";
import {
  createToolcraftDeliveryPlan,
} from "./toolcraft-delivery-plan.mjs";
import {
  createToolcraftDeliveryReceipt,
} from "./toolcraft-delivery-receipt.mjs";
import {
  createToolcraftPerformanceRequestAuthorityHash,
} from "./toolcraft-performance-authority-policy.mjs";
import {
  createToolcraftTargetedPerformanceReport,
  createToolcraftTargetedPerformanceEvidenceHash,
} from "./toolcraft-targeted-performance-report.mjs";
import {
  createTargetedMeasurementFixture,
} from "./toolcraft-verification-receipt-test-helpers.mjs";
import {
  createToolcraftVerificationSourceHash,
} from "./toolcraft-verification-inventory.mjs";

const hash = (character) => character.repeat(64);
const pathId =
  "performance-path:%5B%22interactive-discrete%22%2C%22control-change%22%2C%5B%22composite%22%5D%2C%5B%22main%22%5D%2C%5B%5D%5D";
const performanceTestName = `browser perf: toolcraft path ${pathId}`;
const catalog = Object.freeze({
  acceptance: Object.freeze([Object.freeze({
    acceptanceId: "output.updates",
    file: "app-controls.spec.ts",
    testName: "browser: output updates",
  })]),
  performance: Object.freeze([Object.freeze({
    passIds: Object.freeze(["composite"]),
    pathId,
    testName: performanceTestName,
  })]),
  version: 1,
});

function inventory(character) {
  const entries = Object.freeze([
    Object.freeze({
      path: "src/app/output.tsx",
      sha256: hash(character),
    }),
  ]);
  return Object.freeze({
    entries,
    sourceHash: createToolcraftVerificationSourceHash(entries),
  });
}

function createFixture({
  authorityRequest = "The preview is still slow.",
  current = inventory("2"),
} = {}) {
  const comparison = inventory("1");
  const previousPerformance = Object.freeze({ kind: "none" });
  const previous = Object.freeze({
    anchor: Object.freeze({
      files: comparison.entries,
      lifecycle: EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
      performance: previousPerformance,
      sourceHash: comparison.sourceHash,
    }),
    receipt: Object.freeze({ version: 6 }),
  });
  const authoritySource = Object.freeze({
    heading: "Delivery 2 - Slow preview",
    pathIds: Object.freeze([pathId]),
    request: authorityRequest,
    requestEvidence: authorityRequest,
  });
  const planningInputs = Object.freeze({
    allProductTestFiles: Object.freeze(["src/app/output.test.tsx"]),
    authority: Object.freeze({
      hash: createToolcraftPerformanceRequestAuthorityHash(authoritySource),
      ...authoritySource,
    }),
    catalog,
    changeSet: Object.freeze({
      dependencyChanged: false,
      docsChanged: true,
      impact: Object.freeze({
        acceptanceIds: Object.freeze(["output.updates"]),
        browserTestNames: Object.freeze(["browser: output updates"]),
        performanceCandidates: Object.freeze({
          passIds: Object.freeze(["composite"]),
          pathIds: Object.freeze([pathId]),
          testNames: Object.freeze([performanceTestName]),
        }),
        productTestFiles: Object.freeze(["src/app/output.test.tsx"]),
      }),
      platformChanged: false,
      productInputsChanged: true,
    }),
    comparisonInventory: comparison,
    currentInventory: current,
    integrity: Object.freeze({
      manifestHash: hash("a"),
      sourceHash: current.sourceHash,
    }),
    packageManager: "pnpm",
    previousLifecycle: EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
    previousPerformance,
  });
  return { current, planningInputs, previous };
}

function dependencies(fixture, {
  onCommit,
  onEscalation,
  onExecute,
} = {}) {
  return Object.freeze({
    collectInventory: async () => fixture.current,
    commit: async (value) => onCommit?.(value),
    createPlan: createToolcraftDeliveryPlan,
    createReceipt: ({ plan, result }) =>
      Object.freeze({
        evidence: result.evidence,
        plan,
        version: 6,
      }),
    evaluateIntegrity: async () => fixture.planningInputs.integrity,
    executePlan: async (options) => {
      onExecute?.(options);
      return Object.freeze({
        evidence: Object.freeze([]),
        finalInventory: fixture.current,
        planExecutionAuthority: Object.freeze(Object.create(null)),
      });
    },
    formatEscalationRecommendation: () => "offer full audit",
    getEscalationRecommendation: (value) => {
      onEscalation?.(value);
      return null;
    },
    loadPlanningInputs: async () => fixture.planningInputs,
    readDeliveryAnchor: async () => fixture.previous,
  });
}

function createResult(plan, finalInventory) {
  const performance = plan.steps.find(
    ({ kind }) => kind === "browser-performance",
  );
  const testEvidence = [{
    fullTitle: `app-controls.spec.ts › ${performanceTestName}`,
    leafTitle: performanceTestName,
  }];
  const report = performance && createToolcraftTargetedPerformanceReport({
    fixtureResolutionMode: "strict-development",
    fixtureSelector: "development",
    measurements: createTargetedMeasurementFixture(performance.pathIds),
    nonce: `fixture-${plan.sourceHash}`,
    performancePassIds: performance.passIds,
    performancePathIds: performance.pathIds,
    requestAuthorityHash:
      plan.kind === "performance-iteration"
        ? plan.requestAuthorityHash
        : null,
    sourceHash: finalInventory.sourceHash,
    testNames: performance.testNames,
  });
  const evidence = plan.steps.map((step) => {
    if (step.kind !== "browser-performance") return { ...step };
    return {
      ...step,
      report,
      evidenceHash: createToolcraftTargetedPerformanceEvidenceHash({
        report,
        testEvidence,
      }),
      testEvidence,
    };
  });
  return { evidence, finalInventory };
}

test("one bare delivery turns domain authority into one targeted performance plan", async () => {
  const fixture = createFixture();
  let executed;
  let committed;
  let escalation;
  await executeToolcraftDeliveryLifecycleCore({
    dependencies: dependencies(fixture, {
      onCommit: (value) => { committed = value; },
      onEscalation: (value) => { escalation = value; },
      onExecute: (value) => { executed = value; },
    }),
    projectDir: "/tmp/toolcraft-performance-iteration",
  });

  assert.equal(executed.plan.kind, "performance-iteration");
  assert.equal(
    executed.plan.requestAuthorityHash,
    fixture.planningInputs.authority.hash,
  );
  assert.deepEqual(
    executed.plan.steps.find(({ kind }) => kind === "browser-performance"),
    {
      kind: "browser-performance",
      passIds: ["composite"],
      pathIds: [pathId],
      testNames: [performanceTestName],
    },
  );
  assert.deepEqual(Object.keys(executed), ["plan", "projectDir"]);
  assert.equal(committed.plan, executed.plan);
  assert.equal(escalation.previousAnchor, fixture.previous.anchor);
  assert.equal(escalation.currentReceipt, committed.receipt);
});

test("performance authority remains consumed across a changed functional delivery", () => {
  const first = createFixture({
    authorityRequest: "The preview remains slow after the first fix.",
  });
  const firstPlan = createToolcraftDeliveryPlan(first.planningInputs);
  const firstReceipt = createToolcraftDeliveryReceipt({
    plan: firstPlan,
    result: createResult(firstPlan, first.current),
  });
  const firstAnchor = normalizeToolcraftDeliveryAnchor(firstReceipt);

  const functionalCurrent = inventory("3");
  const functionalInputs = {
    ...first.planningInputs,
    authority: null,
    changeSet: {
      dependencyChanged: false,
      docsChanged: true,
      impact: null,
      platformChanged: false,
      productInputsChanged: false,
    },
    comparisonInventory: {
      entries: firstAnchor.files,
      sourceHash: firstAnchor.sourceHash,
    },
    currentInventory: functionalCurrent,
    integrity: {
      manifestHash: hash("a"),
      sourceHash: functionalCurrent.sourceHash,
    },
    previousPerformance: firstAnchor.performance,
    previousLifecycle: firstAnchor.lifecycle,
  };
  const functionalPlan = createToolcraftDeliveryPlan(functionalInputs);
  const functionalReceipt = createToolcraftDeliveryReceipt({
    plan: functionalPlan,
    result: createResult(functionalPlan, functionalCurrent),
  });
  const functionalAnchor = normalizeToolcraftDeliveryAnchor(functionalReceipt);

  const replayCurrent = inventory("4");
  assert.throws(
    () => createToolcraftDeliveryPlan({
      ...first.planningInputs,
      comparisonInventory: {
        entries: functionalAnchor.files,
        sourceHash: functionalAnchor.sourceHash,
      },
      currentInventory: replayCurrent,
      integrity: {
        manifestHash: hash("a"),
        sourceHash: replayCurrent.sourceHash,
      },
      previousLifecycle: functionalAnchor.lifecycle,
      previousPerformance: functionalAnchor.performance,
    }),
    /authority has already been used/iu,
  );
});

test("initial performance authority fails before proof execution", async () => {
  const fixture = createFixture();
  const noPreviousInputs = Object.freeze({
    ...fixture.planningInputs,
    changeSet: Object.freeze({
      dependencyChanged: false,
      docsChanged: false,
      impact: null,
      platformChanged: false,
      productInputsChanged: false,
    }),
    comparisonInventory: null,
    previousPerformance: Object.freeze({ kind: "none" }),
  });
  let commits = 0;
  let executions = 0;
  await assert.rejects(
    executeToolcraftDeliveryLifecycleCore({
      dependencies: Object.freeze({
        ...dependencies(fixture, {
          onCommit: () => { commits += 1; },
          onExecute: () => { executions += 1; },
        }),
        loadPlanningInputs: async () => noPreviousInputs,
        readDeliveryAnchor: async () => ({ missing: true }),
      }),
      projectDir: "/tmp/toolcraft-initial-performance-authority",
    }),
    /first delivery must be functional/iu,
  );
  assert.equal(executions, 0);
  assert.equal(commits, 0);
});

test("failed performance execution neither commits nor recommends a full audit", async () => {
  const fixture = createFixture();
  let commits = 0;
  let recommendations = 0;
  await assert.rejects(
    executeToolcraftDeliveryLifecycleCore({
      dependencies: Object.freeze({
        ...dependencies(fixture, {
          onCommit: () => { commits += 1; },
          onEscalation: () => { recommendations += 1; },
        }),
        executePlan: async () => {
          throw new Error("measured path failed");
        },
      }),
      projectDir: "/tmp/toolcraft-performance-failure",
    }),
    /measured path failed/iu,
  );
  assert.equal(commits, 0);
  assert.equal(recommendations, 0);
});
