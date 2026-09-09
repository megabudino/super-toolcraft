import assert from "node:assert/strict";
import test from "node:test";

import {
  createToolcraftDeliveryPlan,
  getToolcraftDeliveryPlanError,
} from "./toolcraft-delivery-plan.mjs";
import {
  deepFreeze,
  hash,
  inputs,
  requestAuthority,
} from "./toolcraft-delivery-plan-error-test-helpers.mjs";
import {
  createPlanReceiptFixture,
} from "./toolcraft-delivery-receipt-test-helpers.mjs";

test("plan validator rejects weakened, malformed, mutable, and noncanonical plans", () => {
  const valid = createToolcraftDeliveryPlan(inputs());
  const cases = [
    { ...valid, authority: hash("b") },
    { ...valid, steps: valid.steps.filter((step) => step.kind !== "build") },
    { ...valid, steps: [...valid.steps, valid.steps[0]] },
    {
      ...valid,
      steps: valid.steps.map((step) =>
        step.kind === "browser-functional"
          ? { ...step, testNames: [] }
          : step
      ),
    },
    { ...valid, steps: [...valid.steps].reverse() },
    { ...valid, kind: "performance-iteration", requestAuthorityHash: hash("b") },
  ];
  for (const plan of cases) {
    assert.equal(typeof getToolcraftDeliveryPlanError(deepFreeze(plan)), "string");
  }
  assert.equal(
    typeof getToolcraftDeliveryPlanError(structuredClone(valid)),
    "string",
  );
});

test("browser performance plans require functional browser proof", () => {
  const iteration = createToolcraftDeliveryPlan(
    inputs({ authority: requestAuthority() }),
  );
  const withoutFunctional = {
    ...iteration,
    steps: iteration.steps.filter((step) => step.kind !== "browser-functional"),
  };
  assert.match(
    getToolcraftDeliveryPlanError(deepFreeze(withoutFunctional)),
    /functional browser proof/iu,
  );
});

test("rejects an unknown browser proof step", () => {
  const plan = createToolcraftDeliveryPlan(inputs());
  const obsolete = deepFreeze({
    ...plan,
    steps: [
      ...plan.steps,
      {
        kind: "browser-functional-legacy",
        legacyTestName: "browser: obsolete",
        testNames: ["browser: output updates"],
      },
    ],
  });
  assert.equal(
    getToolcraftDeliveryPlanError(obsolete),
    "Delivery proof step is malformed.",
  );
});

test("plan creation rejects acceptance selection outside impact authority", () => {
  const forged = inputs();
  forged.changeSet.impact.acceptanceIds = ["forged.requirement"];
  assert.throws(
    () => createToolcraftDeliveryPlan(forged),
    /delivery catalog/iu,
  );
});

test("complete dependency proof and browser build ordering cannot be weakened", () => {
  const dependency = inputs({
    changedPath: "package.json",
    resolvedImpact: null,
  });
  dependency.changeSet.dependencyChanged = true;
  const valid = createToolcraftDeliveryPlan(dependency);
  for (const kind of ["docs", "code-health", "product-tests", "build"]) {
    const weakened = {
      ...valid,
      steps: valid.steps.filter((step) => step.kind !== kind),
    };
    assert.equal(
      typeof getToolcraftDeliveryPlanError(deepFreeze(weakened)),
      "string",
    );
  }
  const beforeBuild = {
    ...valid,
    steps: [
      ...valid.steps.filter((step) => step.kind !== "build"),
      { kind: "build" },
    ],
  };
  assert.equal(
    typeof getToolcraftDeliveryPlanError(deepFreeze(beforeBuild)),
    "string",
  );
});

test("full and targeted product-test selections cannot impersonate each other", () => {
  const initial = structuredClone(
    createPlanReceiptFixture("functional-initial").plan,
  );
  initial.steps.find(({ kind }) => kind === "product-tests").acceptanceIds = [];
  assert.match(
    getToolcraftDeliveryPlanError(deepFreeze(initial)),
    /initial.*full automated runtime selection|complete.*acceptance/iu,
  );

  const targeted = createToolcraftDeliveryPlan(inputs());
  const targetedWithFullSelection = structuredClone(targeted);
  targetedWithFullSelection.steps.find(
    ({ kind }) => kind === "product-tests",
  ).acceptanceIds = null;
  assert.match(
    getToolcraftDeliveryPlanError(deepFreeze(targetedWithFullSelection)),
    /targeted.*acceptance|full automated runtime selection/iu,
  );

  const dependencyInputs = inputs({
    changedPath: "package.json",
    resolvedImpact: null,
  });
  dependencyInputs.changeSet.dependencyChanged = true;
  const dependency = createToolcraftDeliveryPlan(dependencyInputs);
  const weakenedDependency = structuredClone(dependency);
  weakenedDependency.steps.find(
    ({ kind }) => kind === "product-tests",
  ).acceptanceIds = [];
  assert.match(
    getToolcraftDeliveryPlanError(deepFreeze(weakenedDependency)),
    /dependency.*full automated runtime selection|complete.*acceptance/iu,
  );

  const platformInputs = inputs({
    changedPath: "vite.config.ts",
    resolvedImpact: null,
  });
  platformInputs.changeSet.platformChanged = true;
  const weakenedPlatform = structuredClone(
    createToolcraftDeliveryPlan(platformInputs),
  );
  weakenedPlatform.steps.find(
    ({ kind }) => kind === "product-tests",
  ).acceptanceIds = [];
  assert.match(
    getToolcraftDeliveryPlanError(deepFreeze(weakenedPlatform)),
    /changed complete.*full automated runtime selection|complete.*acceptance/iu,
  );

  const forgedFullTargeted = structuredClone(targeted);
  forgedFullTargeted.steps = dependency.steps.filter(
    ({ kind }) => kind !== "dependencies",
  );
  assert.match(
    getToolcraftDeliveryPlanError(deepFreeze(forgedFullTargeted)),
    /targeted.*acceptance|complete proof authority/iu,
  );
});
