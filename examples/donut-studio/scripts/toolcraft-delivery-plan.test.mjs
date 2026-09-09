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
  performanceCandidates = {
    passIds: [],
    pathIds: [],
    testNames: [],
  },
  productTestFiles = [],
} = {}) {
  return {
    acceptanceIds,
    browserTestNames,
    performanceCandidates,
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
    kind: "browser-functional",
    testNames: ["browser: output updates", "browser: settings persist"],
  },
];

const changedBasis = (inputs, changedFiles) => ({
  changedFiles,
  comparisonInventory: inputs.comparisonInventory,
  kind: "changed",
});

test("creates the fixed initial functional delivery plan", () => {
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
    basis: { kind: "initial" },
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
    kind: "functional",
    lifecycle: EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
    sourceHash: inputs.currentInventory.sourceHash,
    manifestHash: hash("a"),
    steps: [{ kind: "docs" }],
  });
});

test("creates exact presentation proof", () => {
  const inputs = planningInputs();
  assert.deepEqual(createToolcraftDeliveryPlan(inputs), {
    basis: changedBasis(inputs, ["src/features/output.tsx"]),
    kind: "functional",
    lifecycle: EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
    sourceHash: inputs.currentInventory.sourceHash,
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
    }),
  });
  assert.deepEqual(createToolcraftDeliveryPlan(inputs), {
    basis: changedBasis(inputs, ["src/features/settings.ts"]),
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
    kind: "functional",
    lifecycle: EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
    sourceHash: inputs.currentInventory.sourceHash,
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

test("makes dependency and lock changes complete functional proof", () => {
  const inputs = planningInputs({
    changedFiles: ["package.json", "pnpm-lock.yaml"],
    changeSet: { dependencyChanged: true },
    resolvedImpact: null,
  });
  assert.deepEqual(createToolcraftDeliveryPlan(inputs), {
    basis: changedBasis(inputs, ["package.json", "pnpm-lock.yaml"]),
    kind: "functional",
    lifecycle: EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
    sourceHash: inputs.currentInventory.sourceHash,
    manifestHash: hash("a"),
    steps: [{ kind: "dependencies", packageManager: "pnpm" }, ...fullSteps],
  });
});

test("makes editable platform configuration complete functional proof", () => {
  const inputs = planningInputs({
    changedFiles: ["classified/platform-input"],
    changeSet: { platformChanged: true },
    resolvedImpact: null,
  });
  assert.deepEqual(createToolcraftDeliveryPlan(inputs), {
    basis: changedBasis(inputs, ["classified/platform-input"]),
    kind: "functional",
    lifecycle: EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
    sourceHash: inputs.currentInventory.sourceHash,
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
    basis: changedBasis(inputs, ["src/features/output.test.tsx"]),
    kind: "functional",
    lifecycle: EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
    sourceHash: inputs.currentInventory.sourceHash,
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
    }),
  });
  assert.deepEqual(createToolcraftDeliveryPlan(inputs), {
    basis: changedBasis(inputs, ["e2e/app-output.spec.ts"]),
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
      performanceCandidates: {
        passIds: ["preview-composite"],
        pathIds: [pathId],
        testNames: [performanceTestName],
      },
      productTestFiles: ["src/features/output.test.tsx"],
    }),
  });
  assert.deepEqual(createToolcraftDeliveryPlan(inputs), {
    basis: changedBasis(inputs, [
      "docs/product.md",
      "package.json",
      "src/features/output.tsx",
    ]),
    kind: "functional",
    lifecycle: EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
    sourceHash: inputs.currentInventory.sourceHash,
    manifestHash: hash("a"),
    steps: [
      { kind: "dependencies", packageManager: "pnpm" },
      ...fullSteps,
    ],
  });
});
