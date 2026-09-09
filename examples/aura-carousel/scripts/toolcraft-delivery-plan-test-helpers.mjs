import {
  EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
} from "./toolcraft-delivery-lifecycle-state.mjs";
import {
  createInventory,
} from "./toolcraft-delivery-receipt-test-helpers.mjs";
import {
  createToolcraftFunctionalProofModel,
  createToolcraftFunctionalProofModelHash,
} from "./toolcraft-functional-proof-model.mjs";

export const hash = (character) => character.repeat(64);
export const pathId =
  "performance-path:%5B%22interactive-discrete%22%2C%22control-change%22%2C%5B%22preview-composite%22%5D%2C%5B%22main%22%5D%2C%5B%5D%5D";
export const performanceTestName = `browser perf: toolcraft path ${pathId}`;
export const catalog = {
  acceptance: [
    {
      acceptanceId: "output.updates",
      contractHash: hash("b"),
      domainId: "output",
      file: "app-output.spec.ts",
      testName: "browser: output updates",
    },
    {
      acceptanceId: "settings.persist",
      contractHash: hash("c"),
      domainId: "settings",
      file: "app-settings.spec.ts",
      testName: "browser: settings persist",
    },
  ],
  performance: [{ passIds: ["preview-composite"], pathId, testName: performanceTestName }],
  version: 2,
};
export const allProductTestFiles = [
  "src/features/output.test.tsx",
  "src/features/settings.test.tsx",
];

export function impact({
  acceptanceIds = [],
  browserTestNames = [],
  performanceCandidates = { passIds: [], pathIds: [], testNames: [] },
  productTestFiles = [],
  buildRequired = browserTestNames.length > 0,
} = {}) {
  return {
    acceptanceIds,
    browserTestNames,
    buildRequired,
    performanceCandidates,
    productTestFiles,
  };
}

function proofModel(ownerPath = "src/features/output.tsx") {
  return createToolcraftFunctionalProofModel({
    catalog,
    inventory: {
      owners: [{
        acceptanceIds: ["output.updates", "settings.persist"],
        kind: "functional",
        path: ownerPath,
      }],
      version: 3,
    },
  });
}

export function planningInputs({
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
  const comparison = comparisonInventory ?? createInventory(before);
  const current = createInventory(after);
  const currentFunctionalProofModel = proofModel();
  const previousFunctionalProofModel = proofModel(
    "src/features/previous-output.tsx",
  );
  return {
    allProductTestFiles,
    authority,
    catalog,
    changeSet: {
      dependencyChanged: false,
      docsChanged: false,
      frameworkChanged: false,
      impact: resolvedImpact,
      platformChanged: false,
      productInputsChanged: resolvedImpact !== null,
      ...changeSet,
    },
    comparisonInventory: comparison,
    currentFunctionalProofModel,
    currentInventory: current,
    integrity: { manifestHash: hash("a"), sourceHash: current.sourceHash },
    packageManager: "pnpm",
    previousFunctionalProofModel,
    previousLifecycle: EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
    previousPerformance,
  };
}

export const fullSteps = [
  { kind: "docs" },
  { kind: "code-health" },
  { acceptanceIds: null, kind: "product-tests", files: allProductTestFiles },
  { kind: "build" },
  {
    kind: "browser-functional",
    testNames: ["browser: output updates", "browser: settings persist"],
  },
];

export function changedBasis(inputs, changedFiles) {
  const completeProofReason = inputs.changeSet.dependencyChanged
    ? "dependency"
    : inputs.changeSet.platformChanged
      ? "platform"
      : undefined;
  return {
    changedFiles,
    ...(completeProofReason === undefined ? {} : { completeProofReason }),
    comparisonFunctionalProofModelHash:
      createToolcraftFunctionalProofModelHash(
        inputs.previousFunctionalProofModel,
      ),
    comparisonInventory: inputs.comparisonInventory,
    kind: "changed",
  };
}
