import assert from "node:assert/strict";
import test from "node:test";

import {
  createToolcraftDeliveryPlan,
  getToolcraftDeliveryDiagnosticTier,
  getToolcraftDeliveryPlanError,
} from "./toolcraft-delivery-plan.mjs";
import {
  EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
} from "./toolcraft-delivery-lifecycle-state.mjs";
import {
  createToolcraftPerformanceRequestAuthorityHash,
} from "./toolcraft-performance-authority-policy.mjs";
import {
  createToolcraftVerificationSourceHash,
} from "./toolcraft-verification-inventory.mjs";

const hash = (character) => character.repeat(64);
const pathId =
  "performance-path:%5B%22interactive-discrete%22%2C%22control-change%22%2C%5B%22preview-composite%22%5D%2C%5B%22main%22%5D%2C%5B%5D%5D";
const performanceTestName = `browser perf: toolcraft path ${pathId}`;
const authoritySource = Object.freeze({
  heading: "Delivery 2 - Slow preview",
  pathIds: [pathId],
  request: "The preview is still slow.",
  requestEvidence: "The preview is still slow.",
});
const authority = Object.freeze({
  hash: createToolcraftPerformanceRequestAuthorityHash(authoritySource),
  ...authoritySource,
});
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
  performance: [{
    passIds: ["preview-composite"],
    pathId,
    testName: performanceTestName,
  }],
  version: 1,
};
const allProductTestFiles = ["src/features/output.test.tsx"];
const fullFunctionalSteps = [
  { kind: "docs" },
  { kind: "code-health" },
  { kind: "product-tests", files: allProductTestFiles },
  { kind: "build" },
  {
    kind: "browser-functional",
    testNames: ["browser: output updates", "browser: settings persist"],
  },
];
const performanceStep = {
  kind: "browser-performance",
  passIds: ["preview-composite"],
  pathIds: [pathId],
  testNames: [performanceTestName],
};

function inventory(digit) {
  const entries = [{
    path: "src/features/output.tsx",
    sha256: hash(digit),
  }];
  return {
    entries,
    sourceHash: createToolcraftVerificationSourceHash(entries),
  };
}

function inputs({ initial = false, requestAuthority = null } = {}) {
  const comparisonInventory = initial ? null : inventory("1");
  const currentInventory = inventory("2");
  const impact = initial ? null : {
    acceptanceIds: ["output.updates"],
    browserTestNames: ["browser: output updates"],
    performanceCandidates: {
      passIds: ["preview-composite"],
      pathIds: [pathId],
      testNames: [performanceTestName],
    },
    productTestFiles: allProductTestFiles,
  };
  return {
    allProductTestFiles,
    authority: requestAuthority,
    catalog,
    changeSet: {
      dependencyChanged: false,
      docsChanged: false,
      impact,
      platformChanged: false,
      productInputsChanged: impact !== null,
    },
    comparisonInventory,
    currentInventory,
    integrity: {
      manifestHash: hash("a"),
      sourceHash: currentInventory.sourceHash,
    },
    packageManager: "pnpm",
    previousLifecycle: EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
    previousPerformance: { kind: "none" },
  };
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

test("creates initial and changed functional plans with one exact basis", () => {
  const initialInputs = inputs({ initial: true });
  const initial = createToolcraftDeliveryPlan(initialInputs);
  assert.deepEqual(initial, {
    basis: { kind: "initial" },
    kind: "functional",
    lifecycle: EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
    manifestHash: hash("a"),
    sourceHash: initialInputs.currentInventory.sourceHash,
    steps: fullFunctionalSteps,
  });
  assert.equal(getToolcraftDeliveryDiagnosticTier(initial), 4);

  const changedInputs = inputs();
  const changed = createToolcraftDeliveryPlan(changedInputs);
  assert.deepEqual(changed.basis, {
    changedFiles: ["src/features/output.tsx"],
    comparisonInventory: changedInputs.comparisonInventory,
    kind: "changed",
  });
  assert.equal(changed.kind, "functional");
  assert.equal(
    changed.steps.some(({ kind }) => kind === "browser-performance"),
    false,
  );
  assert.equal(getToolcraftDeliveryDiagnosticTier(changed), 2);
});

test("rejects performance authority before the first functional receipt", () => {
  assert.throws(
    () => createToolcraftDeliveryPlan(inputs({
      initial: true,
      requestAuthority: authority,
    })),
    /first delivery must be functional/iu,
  );
});

test("creates a changed authorized iteration with exact affected proof", () => {
  const planningInputs = inputs({ requestAuthority: authority });
  const plan = createToolcraftDeliveryPlan(planningInputs);
  assert.deepEqual(plan.basis, {
    changedFiles: ["src/features/output.tsx"],
    comparisonInventory: planningInputs.comparisonInventory,
    kind: "changed",
  });
  assert.equal(plan.kind, "performance-iteration");
  assert.deepEqual(plan.steps, [
    { kind: "code-health" },
    { kind: "product-tests", files: allProductTestFiles },
    { kind: "build" },
    {
      kind: "browser-functional",
      testNames: ["browser: output updates"],
    },
    performanceStep,
  ]);
  assert.equal(getToolcraftDeliveryDiagnosticTier(plan), 3);
});

test("rejects malformed basis and functional performance proof", () => {
  const valid = createToolcraftDeliveryPlan(inputs());
  for (const basis of [
    { kind: "initial", changedFiles: valid.basis.changedFiles },
    { kind: "changed", changedFiles: valid.basis.changedFiles },
    {
      ...valid.basis,
      comparisonInventory: {
        ...valid.basis.comparisonInventory,
        sourceHash: valid.sourceHash,
      },
    },
  ]) {
    const malformed = deepFreeze({ ...valid, basis });
    assert.match(
      getToolcraftDeliveryPlanError(malformed),
      /basis|inventory|provenance/iu,
    );
  }

  const withPerformance = deepFreeze({
    ...valid,
    steps: [...valid.steps, performanceStep],
  });
  assert.match(
    getToolcraftDeliveryPlanError(withPerformance),
    /functional.*performance/iu,
  );

  const performance = createToolcraftDeliveryPlan(
    inputs({ requestAuthority: authority }),
  );
  const initialPerformance = deepFreeze({
    ...performance,
    basis: { kind: "initial" },
  });
  assert.match(
    getToolcraftDeliveryPlanError(initialPerformance),
    /performance iteration requires a previous successful delivery/iu,
  );
});
