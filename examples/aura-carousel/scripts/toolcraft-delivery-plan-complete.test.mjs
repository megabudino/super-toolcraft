import assert from "node:assert/strict";
import test from "node:test";

import {
  createToolcraftDeliveryPlan,
} from "./toolcraft-delivery-plan.mjs";
import {
  EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
} from "./toolcraft-delivery-lifecycle-state.mjs";
import {
  changedBasis,
  fullSteps,
  hash,
  impact,
  pathId,
  performanceTestName,
  planningInputs,
} from "./toolcraft-delivery-plan-test-helpers.mjs";
import {
  createToolcraftFunctionalProofModelHash,
} from "./toolcraft-functional-proof-model.mjs";

function expectedCompletePlan(inputs, changedFiles, steps) {
  return {
    basis: changedBasis(inputs, changedFiles),
    functionalProofModelHash: createToolcraftFunctionalProofModelHash(
      inputs.currentFunctionalProofModel,
    ),
    kind: "functional",
    lifecycle: EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
    sourceHash: inputs.currentInventory.sourceHash,
    manifestHash: hash("a"),
    steps,
  };
}

test("makes dependency and lock changes complete functional proof", () => {
  const changedFiles = ["package.json", "pnpm-lock.yaml"];
  const inputs = planningInputs({
    changedFiles,
    changeSet: { dependencyChanged: true },
    resolvedImpact: null,
  });
  assert.deepEqual(
    createToolcraftDeliveryPlan(inputs),
    expectedCompletePlan(inputs, changedFiles, [
      { kind: "dependencies", packageManager: "pnpm" },
      ...fullSteps,
    ]),
  );
});

test("makes editable platform configuration complete functional proof", () => {
  const changedFiles = ["classified/platform-input"];
  const inputs = planningInputs({
    changedFiles,
    changeSet: { platformChanged: true },
    resolvedImpact: null,
  });
  assert.deepEqual(
    createToolcraftDeliveryPlan(inputs),
    expectedCompletePlan(inputs, changedFiles, fullSteps),
  );
});

test("unions mixed proof in canonical complete step order", () => {
  const changedFiles = [
    "docs/product.md",
    "package.json",
    "src/features/output.tsx",
  ];
  const inputs = planningInputs({
    changedFiles,
    changeSet: { dependencyChanged: true, docsChanged: true },
    resolvedImpact: impact({
      acceptanceIds: ["output.updates"],
      browserTestNames: ["browser: output updates"],
      performanceCandidates: {
        passIds: ["preview-composite"],
        pathIds: [pathId],
        testNames: [performanceTestName],
      },
      productTestFiles: ["src/features/output.test.tsx"],
    }),
  });
  assert.deepEqual(
    createToolcraftDeliveryPlan(inputs),
    expectedCompletePlan(inputs, changedFiles, [
      { kind: "dependencies", packageManager: "pnpm" },
      ...fullSteps,
    ]),
  );
});
