import assert from "node:assert/strict";
import test from "node:test";

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
  createToolcraftVerificationSourceHash,
} from "./toolcraft-verification-inventory.mjs";

const hash = (character) => character.repeat(64);
const catalog = Object.freeze({
  acceptance: Object.freeze([Object.freeze({
    acceptanceId: "output.updates",
    file: "app-controls.spec.ts",
    testName: "browser: output updates",
  })]),
  performance: Object.freeze([]),
  version: 1,
});

function inventory(contents = "1") {
  const entries = Object.freeze([
    Object.freeze({
      path: "src/app/schema.test.ts",
      sha256: hash(contents),
    }),
  ]);
  return Object.freeze({
    entries,
    sourceHash: createToolcraftVerificationSourceHash(entries),
  });
}

function prototypeInputs(currentInventory) {
  return Object.freeze({
    allProductTestFiles: Object.freeze([
      "src/app/schema.test.ts",
    ]),
    authority: null,
    catalog,
    changeSet: Object.freeze({
      dependencyChanged: false,
      docsChanged: false,
      impact: null,
      platformChanged: false,
      productInputsChanged: false,
    }),
    comparisonInventory: null,
    currentInventory,
    integrity: Object.freeze({
      manifestHash: hash("a"),
      sourceHash: currentInventory.sourceHash,
    }),
    packageManager: "pnpm",
    previousLifecycle: EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
    previousPerformance: Object.freeze({ kind: "none" }),
  });
}

function exactPrototypeResult(plan, finalInventory) {
  return Object.freeze({
    evidence: Object.freeze(plan.steps.map((step) => {
      if (step.kind === "product-tests") {
        return Object.freeze({ files: step.files, kind: step.kind });
      }
      if (step.kind === "browser-functional-smoke") {
        return Object.freeze({
          kind: step.kind,
          smokeEvidence: Object.freeze({
            fixtureSelector: "development",
            kind: "performance-smoke",
            sourceHash: plan.sourceHash,
            testName: step.smokeTestName,
          }),
          testNames: step.testNames,
        });
      }
      return Object.freeze({ kind: step.kind });
    })),
    finalInventory,
    planExecutionAuthority: Object.freeze(Object.create(null)),
  });
}

function dependencies({
  currentInventory,
  executePlan,
  onCommit = () => {},
}) {
  return Object.freeze({
    collectInventory: async () => currentInventory,
    commit: async (value) => onCommit(value),
    createPlan: createToolcraftDeliveryPlan,
    createReceipt: createToolcraftDeliveryReceipt,
    evaluateIntegrity: async () =>
      prototypeInputs(currentInventory).integrity,
    executePlan,
    formatEscalationRecommendation: () => "",
    getEscalationRecommendation: () => null,
    loadPlanningInputs: async () => prototypeInputs(currentInventory),
    readDeliveryAnchor: async () => ({ missing: true }),
  });
}

test("first delivery creates one plan-backed combined functional and smoke receipt", async () => {
  const currentInventory = inventory();
  let committed;
  let executedPlan;
  const receipt = await executeToolcraftDeliveryLifecycleCore({
    dependencies: dependencies({
      currentInventory,
      executePlan: async ({ plan }) => {
        executedPlan = plan;
        return exactPrototypeResult(plan, currentInventory);
      },
      onCommit: (value) => { committed = value; },
    }),
    projectDir: "/tmp/toolcraft-prototype",
  });

  assert.equal(receipt.version, 5);
  assert.equal(receipt.plan.kind, "prototype");
  assert.deepEqual(
    executedPlan.steps.map(({ kind }) => kind),
    [
      "docs",
      "code-health",
      "product-tests",
      "build",
      "browser-functional-smoke",
    ],
  );
  assert.deepEqual(
    executedPlan.steps.find(({ kind }) => kind === "product-tests").files,
    ["src/app/schema.test.ts"],
  );
  assert.equal(
    executedPlan.steps.filter(({ kind }) =>
      kind.startsWith("browser-")).length,
    1,
  );
  assert.equal(
    receipt.evidence.at(-1).smokeEvidence.fixtureSelector,
    "development",
  );
  assert.equal(Object.hasOwn(receipt, "performanceBaseline"), false);
  assert.equal(committed.receipt, receipt);
  assert.equal(committed.result.finalInventory, currentInventory);
});

test("executor failure writes no prototype receipt", async () => {
  const currentInventory = inventory();
  let commits = 0;
  await assert.rejects(
    executeToolcraftDeliveryLifecycleCore({
      dependencies: dependencies({
        currentInventory,
        executePlan: async () => {
          throw new Error("combined browser proof failed");
        },
        onCommit: () => { commits += 1; },
      }),
      projectDir: "/tmp/toolcraft-prototype-failure",
    }),
    /combined browser proof failed/iu,
  );
  assert.equal(commits, 0);
});

test("final inventory mutation cannot create a prototype receipt", async () => {
  const currentInventory = inventory();
  let commits = 0;
  await assert.rejects(
    executeToolcraftDeliveryLifecycleCore({
      dependencies: dependencies({
        currentInventory,
        executePlan: async ({ plan }) =>
          exactPrototypeResult(plan, inventory("2")),
        onCommit: () => { commits += 1; },
      }),
      projectDir: "/tmp/toolcraft-prototype-mutation",
    }),
    /final inventory.*source|execution evidence/iu,
  );
  assert.equal(commits, 0);
});
