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
import { createToolcraftVerificationSourceHash } from "./toolcraft-verification-inventory.mjs";

const hash = (character) => character.repeat(64);
const pathId =
  "performance-path:%5B%22interactive-discrete%22%2C%22control-change%22%2C%5B%22preview-composite%22%5D%2C%5B%22main%22%5D%2C%5B%5D%5D";
const performanceTestName = `browser perf: toolcraft path ${pathId}`;
const smokeTestName = "browser smoke: toolcraft prototype responsiveness";
const catalog = {
  acceptance: [
    {
      acceptanceId: "output.updates",
      file: "app-output.spec.ts",
      testName: "browser: output updates",
    },
    {
      acceptanceId: "settings.persist",
      file: "app-settings.spec.ts",
      testName: "browser: settings persist",
    },
  ],
  performance: [
    {
      passIds: ["preview-composite"],
      pathId,
      testName: performanceTestName,
    },
  ],
  version: 1,
};
const allProductTestFiles = [
  "src/features/output.test.tsx",
  "src/features/settings.test.tsx",
];

function inventory(files) {
  const entries = Object.entries(files)
    .map(([path, sha256]) => ({ path, sha256 }))
    .sort((left, right) => left.path.localeCompare(right.path));
  return {
    entries,
    sourceHash: createToolcraftVerificationSourceHash(entries),
  };
}

function impact({
  acceptanceIds = [],
  browserTestNames = [],
  kind = "presentation",
  performancePassIds = [],
  performancePathIds = [],
  performanceTestNames = [],
  productTestFiles = [],
} = {}) {
  return {
    acceptanceIds,
    browserTestNames,
    kind,
    performancePassIds,
    performancePathIds,
    performanceTestNames,
    productTestFiles,
  };
}

function planningInputs({
  authority = null,
  changedFiles = ["src/features/output.tsx"],
  changeSet = {},
  comparisonInventory,
  previousPerformance = { kind: "none" },
  resolvedImpact = impact({
    acceptanceIds: ["output.updates"],
    browserTestNames: ["browser: output updates"],
    productTestFiles: ["src/features/output.test.tsx"],
  }),
} = {}) {
  const before = Object.fromEntries(
    changedFiles.map((file, index) => [file, hash(String((index + 1) % 10))]),
  );
  const after = Object.fromEntries(
    changedFiles.map((file, index) => [file, hash(String((index + 5) % 10))]),
  );
  const comparison = comparisonInventory ?? inventory(before);
  const current = inventory(after);
  return {
    allProductTestFiles,
    authority,
    catalog,
    changeSet: {
      dependencyChanged: false,
      docsChanged: false,
      impact: resolvedImpact,
      platformChanged: false,
      productInputsChanged: resolvedImpact !== null,
      ...changeSet,
    },
    comparisonInventory: comparison,
    currentInventory: current,
    integrity: {
      manifestHash: hash("a"),
      sourceHash: current.sourceHash,
    },
    packageManager: "pnpm",
    previousLifecycle: EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
    previousPerformance,
  };
}

const fullSteps = [
  { kind: "docs" },
  { kind: "code-health" },
  { kind: "product-tests", files: allProductTestFiles },
  { kind: "build" },
  {
    kind: "browser-functional-smoke",
    smokeTestName,
    testNames: ["browser: output updates", "browser: settings persist"],
  },
];

test("creates the fixed prototype delivery plan", () => {
  const currentInventory = inventory({
    "src/features/output.tsx": hash("5"),
  });
  const inputs = {
    ...planningInputs(),
    authority: null,
    changeSet: {
      dependencyChanged: false,
      docsChanged: false,
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
  };
  const plan = createToolcraftDeliveryPlan(inputs);
  assert.deepEqual(plan, {
    kind: "prototype",
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

test("creates a docs-only ordinary plan", () => {
  const inputs = planningInputs({
    changedFiles: ["docs/product.md"],
    changeSet: { docsChanged: true },
    resolvedImpact: null,
  });
  assert.deepEqual(createToolcraftDeliveryPlan(inputs), {
    kind: "ordinary",
    lifecycle: EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
    comparisonInventory: inputs.comparisonInventory,
    sourceHash: inputs.currentInventory.sourceHash,
    changedFiles: ["docs/product.md"],
    manifestHash: hash("a"),
    steps: [{ kind: "docs" }],
  });
});

test("creates exact presentation proof", () => {
  const inputs = planningInputs();
  assert.deepEqual(createToolcraftDeliveryPlan(inputs), {
    kind: "ordinary",
    lifecycle: EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
    comparisonInventory: inputs.comparisonInventory,
    sourceHash: inputs.currentInventory.sourceHash,
    changedFiles: ["src/features/output.tsx"],
    manifestHash: hash("a"),
    steps: [
      { kind: "code-health" },
      {
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
      kind: "functional",
    }),
  });
  assert.deepEqual(createToolcraftDeliveryPlan(inputs), {
    kind: "ordinary",
    lifecycle: EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
    comparisonInventory: inputs.comparisonInventory,
    sourceHash: inputs.currentInventory.sourceHash,
    changedFiles: ["src/features/settings.ts"],
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

test("keeps an ordinary performance change ordinary without authority", () => {
  const inputs = planningInputs({
    resolvedImpact: impact({
      acceptanceIds: ["output.updates"],
      browserTestNames: ["browser: output updates"],
      kind: "performance",
      performancePassIds: ["preview-composite"],
      performancePathIds: [pathId],
      performanceTestNames: [performanceTestName],
      productTestFiles: ["src/features/output.test.tsx"],
    }),
  });
  assert.deepEqual(createToolcraftDeliveryPlan(inputs), {
    kind: "ordinary",
    lifecycle: EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
    comparisonInventory: inputs.comparisonInventory,
    sourceHash: inputs.currentInventory.sourceHash,
    changedFiles: ["src/features/output.tsx"],
    manifestHash: hash("a"),
    steps: [
      { kind: "code-health" },
      {
        kind: "product-tests",
        files: ["src/features/output.test.tsx"],
      },
      { kind: "build" },
      {
        kind: "browser-functional",
        testNames: ["browser: output updates"],
      },
      {
        kind: "browser-performance",
        testNames: [performanceTestName],
        pathIds: [pathId],
        passIds: ["preview-composite"],
      },
    ],
  });
});

test("makes dependency and lock changes prototype-equivalent", () => {
  const inputs = planningInputs({
    changedFiles: ["package.json", "pnpm-lock.yaml"],
    changeSet: { dependencyChanged: true },
    resolvedImpact: null,
  });
  assert.deepEqual(createToolcraftDeliveryPlan(inputs), {
    kind: "ordinary",
    lifecycle: EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
    comparisonInventory: inputs.comparisonInventory,
    sourceHash: inputs.currentInventory.sourceHash,
    changedFiles: ["package.json", "pnpm-lock.yaml"],
    manifestHash: hash("a"),
    steps: [{ kind: "dependencies", packageManager: "pnpm" }, ...fullSteps],
  });
});

test("makes editable platform configuration prototype-equivalent", () => {
  const inputs = planningInputs({
    changedFiles: ["classified/platform-input"],
    changeSet: { platformChanged: true },
    resolvedImpact: null,
  });
  assert.deepEqual(createToolcraftDeliveryPlan(inputs), {
    kind: "ordinary",
    lifecycle: EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
    comparisonInventory: inputs.comparisonInventory,
    sourceHash: inputs.currentInventory.sourceHash,
    changedFiles: ["classified/platform-input"],
    manifestHash: hash("a"),
    steps: fullSteps,
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
    kind: "ordinary",
    lifecycle: EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
    comparisonInventory: inputs.comparisonInventory,
    sourceHash: inputs.currentInventory.sourceHash,
    changedFiles: ["src/features/output.test.tsx"],
    manifestHash: hash("a"),
    steps: [
      { kind: "code-health" },
      {
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
      kind: "functional",
    }),
  });
  assert.deepEqual(createToolcraftDeliveryPlan(inputs), {
    kind: "ordinary",
    lifecycle: EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
    comparisonInventory: inputs.comparisonInventory,
    sourceHash: inputs.currentInventory.sourceHash,
    changedFiles: ["e2e/app-output.spec.ts"],
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

test("unions mixed proof in canonical step order", () => {
  const inputs = planningInputs({
    changedFiles: [
      "docs/product.md",
      "package.json",
      "src/features/output.tsx",
    ],
    changeSet: { dependencyChanged: true, docsChanged: true },
    resolvedImpact: impact({
      acceptanceIds: ["output.updates"],
      browserTestNames: ["browser: output updates"],
      kind: "performance",
      performancePassIds: ["preview-composite"],
      performancePathIds: [pathId],
      performanceTestNames: [performanceTestName],
      productTestFiles: ["src/features/output.test.tsx"],
    }),
  });
  assert.deepEqual(createToolcraftDeliveryPlan(inputs), {
    kind: "ordinary",
    lifecycle: EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
    comparisonInventory: inputs.comparisonInventory,
    sourceHash: inputs.currentInventory.sourceHash,
    changedFiles: [
      "docs/product.md",
      "package.json",
      "src/features/output.tsx",
    ],
    manifestHash: hash("a"),
    steps: [
      { kind: "dependencies", packageManager: "pnpm" },
      ...fullSteps,
      {
        kind: "browser-performance",
        testNames: [performanceTestName],
        pathIds: [pathId],
        passIds: ["preview-composite"],
      },
    ],
  });
});

test("creates one authority-bound performance iteration", () => {
  const requestAuthorityHash = hash("b");
  const inputs = planningInputs({
    authority: {
      hash: requestAuthorityHash,
      pathIds: [pathId],
      requestEvidence: "The preview is still slow.",
    },
    resolvedImpact: impact({
      acceptanceIds: ["output.updates"],
      browserTestNames: ["browser: output updates"],
      kind: "performance",
      performancePassIds: ["preview-composite"],
      performancePathIds: [pathId],
      performanceTestNames: [performanceTestName],
      productTestFiles: ["src/features/output.test.tsx"],
    }),
  });
  assert.deepEqual(createToolcraftDeliveryPlan(inputs), {
    kind: "performance-iteration",
    comparisonInventory: inputs.comparisonInventory,
    sourceHash: inputs.currentInventory.sourceHash,
    changedFiles: ["src/features/output.tsx"],
    manifestHash: hash("a"),
    lifecycle: {
      consumedPerformanceRequestAuthorityHashes: [requestAuthorityHash],
      performanceEscalationOffered: false,
    },
    requestAuthorityHash,
    performanceComparison: { kind: "none" },
    steps: [
      { kind: "code-health" },
      {
        kind: "product-tests",
        files: ["src/features/output.test.tsx"],
      },
      { kind: "build" },
      {
        kind: "browser-functional",
        testNames: ["browser: output updates"],
      },
      {
        kind: "browser-performance",
        testNames: [performanceTestName],
        pathIds: [pathId],
        passIds: ["preview-composite"],
      },
    ],
  });
  assert.equal(getToolcraftDeliveryDiagnosticTier(
    createToolcraftDeliveryPlan(inputs),
  ), 3);
});
