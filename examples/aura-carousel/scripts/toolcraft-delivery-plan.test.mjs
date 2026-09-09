import assert from "node:assert/strict";
import test from "node:test";

import {
  createToolcraftDeliveryPlan,
  createToolcraftDeliveryPlanHash,
  getToolcraftDeliveryDiagnosticTier,
} from "./toolcraft-delivery-plan.mjs";
import {
  EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
} from "./toolcraft-delivery-lifecycle-state.mjs";
import {
  createToolcraftFunctionalProofModelHash,
} from "./toolcraft-functional-proof-model.mjs";
import {
  allProductTestFiles,
  catalog,
  changedBasis,
  fullSteps,
  hash,
  impact,
  pathId,
  performanceTestName,
  planningInputs,
} from "./toolcraft-delivery-plan-test-helpers.mjs";
import {
  createInventory,
} from "./toolcraft-delivery-receipt-test-helpers.mjs";

test("creates the fixed initial functional delivery plan", () => {
  const currentInventory = createInventory({
    "src/features/output.tsx": hash("5"),
  });
  const inputs = {
    ...planningInputs(),
    authority: null,
    changeSet: {
      dependencyChanged: false,
      docsChanged: false,
      frameworkChanged: false,
      impact: null,
      platformChanged: false,
      productInputsChanged: false,
    },
    comparisonInventory: null,
    currentInventory,
    integrity: {
      manifestHash: hash("a"),
      sourceHash: currentInventory.sourceHash,
    },
    previousFunctionalProofModel: null,
  };
  const plan = createToolcraftDeliveryPlan(inputs);
  assert.deepEqual(plan, {
    basis: { kind: "initial" },
    functionalProofModelHash: createToolcraftFunctionalProofModelHash(
      inputs.currentFunctionalProofModel,
    ),
    kind: "functional",
    lifecycle: EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
    sourceHash: currentInventory.sourceHash,
    manifestHash: hash("a"),
    steps: fullSteps,
  });
  assert.equal(getToolcraftDeliveryDiagnosticTier(plan), 4);
  assert.match(createToolcraftDeliveryPlanHash(plan), /^[a-f0-9]{64}$/u);
  const visit = (value) => {
    if (value && typeof value === "object") {
      assert.equal(Object.isFrozen(value), true);
      Object.values(value).forEach(visit);
    }
  };
  visit(plan);
});

test("creates a docs-only changed functional plan", () => {
  const inputs = planningInputs({
    changedFiles: ["docs/product.md"],
    changeSet: { docsChanged: true },
    resolvedImpact: null,
  });
  assert.deepEqual(createToolcraftDeliveryPlan(inputs), {
    basis: changedBasis(inputs, ["docs/product.md"]),
    functionalProofModelHash: createToolcraftFunctionalProofModelHash(
      inputs.currentFunctionalProofModel,
    ),
    kind: "functional",
    lifecycle: EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
    sourceHash: inputs.currentInventory.sourceHash,
    manifestHash: hash("a"),
    steps: [{ kind: "docs" }],
  });
});

test("keeps a signed framework refresh on exact changed product proof", () => {
  const changedFiles = [
    "scripts/toolcraft-verification-impact-resolution.mjs",
    "src/features/output.tsx",
    "src/toolcraft/.toolcraft-manifest.json",
  ];
  const inputs = planningInputs({
    changedFiles,
    changeSet: { frameworkChanged: true },
  });
  assert.deepEqual(createToolcraftDeliveryPlan(inputs), {
    basis: changedBasis(inputs, changedFiles),
    functionalProofModelHash: createToolcraftFunctionalProofModelHash(
      inputs.currentFunctionalProofModel,
    ),
    kind: "functional",
    lifecycle: EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
    sourceHash: inputs.currentInventory.sourceHash,
    manifestHash: hash("a"),
    steps: [
      { kind: "code-health" },
      {
        acceptanceIds: ["output.updates"],
        kind: "product-tests",
        files: ["src/features/output.test.tsx"],
      },
      { kind: "build" },
      {
        kind: "browser-functional",
        testNames: ["browser: output updates"],
      },
    ],
  });
});

test("creates exact presentation proof", () => {
  const inputs = planningInputs();
  assert.deepEqual(createToolcraftDeliveryPlan(inputs), {
    basis: changedBasis(inputs, ["src/features/output.tsx"]),
    functionalProofModelHash: createToolcraftFunctionalProofModelHash(
      inputs.currentFunctionalProofModel,
    ),
    kind: "functional",
    lifecycle: EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
    sourceHash: inputs.currentInventory.sourceHash,
    manifestHash: hash("a"),
    steps: [
      { kind: "code-health" },
      {
        acceptanceIds: ["output.updates"],
        kind: "product-tests",
        files: ["src/features/output.test.tsx"],
      },
      { kind: "build" },
      {
        kind: "browser-functional",
        testNames: ["browser: output updates"],
      },
    ],
  });
});

test("creates exact functional proof", () => {
  const inputs = planningInputs({
    changedFiles: ["src/features/settings.ts"],
    resolvedImpact: impact({
      acceptanceIds: ["settings.persist"],
      browserTestNames: ["browser: settings persist"],
    }),
  });
  assert.deepEqual(createToolcraftDeliveryPlan(inputs), {
    basis: changedBasis(inputs, ["src/features/settings.ts"]),
    functionalProofModelHash: createToolcraftFunctionalProofModelHash(
      inputs.currentFunctionalProofModel,
    ),
    kind: "functional",
    lifecycle: EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
    sourceHash: inputs.currentInventory.sourceHash,
    manifestHash: hash("a"),
    steps: [
      { kind: "code-health" },
      { kind: "build" },
      {
        kind: "browser-functional",
        testNames: ["browser: settings persist"],
      },
    ],
  });
});

test("keeps a performance-owned change functional without authority", () => {
  const inputs = planningInputs({
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
  assert.deepEqual(createToolcraftDeliveryPlan(inputs), {
    basis: changedBasis(inputs, ["src/features/output.tsx"]),
    functionalProofModelHash: createToolcraftFunctionalProofModelHash(
      inputs.currentFunctionalProofModel,
    ),
    kind: "functional",
    lifecycle: EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
    sourceHash: inputs.currentInventory.sourceHash,
    manifestHash: hash("a"),
    steps: [
      { kind: "code-health" },
      {
        acceptanceIds: ["output.updates"],
        kind: "product-tests",
        files: ["src/features/output.test.tsx"],
      },
      { kind: "build" },
      {
        kind: "browser-functional",
        testNames: ["browser: output updates"],
      },
    ],
  });
});

test("changed product tests select only their graph-derived unit proof", () => {
  const inputs = planningInputs({
    changedFiles: ["src/features/output.test.tsx"],
    resolvedImpact: impact({
      productTestFiles: ["src/features/output.test.tsx"],
    }),
  });
  assert.deepEqual(createToolcraftDeliveryPlan(inputs), {
    basis: changedBasis(inputs, ["src/features/output.test.tsx"]),
    functionalProofModelHash: createToolcraftFunctionalProofModelHash(
      inputs.currentFunctionalProofModel,
    ),
    kind: "functional",
    lifecycle: EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
    sourceHash: inputs.currentInventory.sourceHash,
    manifestHash: hash("a"),
    steps: [
      { kind: "code-health" },
      {
        acceptanceIds: [],
        kind: "product-tests",
        files: ["src/features/output.test.tsx"],
      },
    ],
  });
});

test("changed browser tests select their catalog-backed browser proof", () => {
  const inputs = planningInputs({
    changedFiles: ["e2e/app-output.spec.ts"],
    resolvedImpact: impact({
      acceptanceIds: ["output.updates"],
      browserTestNames: ["browser: output updates"],
    }),
  });
  assert.deepEqual(createToolcraftDeliveryPlan(inputs), {
    basis: changedBasis(inputs, ["e2e/app-output.spec.ts"]),
    functionalProofModelHash: createToolcraftFunctionalProofModelHash(
      inputs.currentFunctionalProofModel,
    ),
    kind: "functional",
    lifecycle: EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
    sourceHash: inputs.currentInventory.sourceHash,
    manifestHash: hash("a"),
    steps: [
      { kind: "code-health" },
      { kind: "build" },
      {
        kind: "browser-functional",
        testNames: ["browser: output updates"],
      },
    ],
  });
});
