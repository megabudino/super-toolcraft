import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveToolcraftChangedVerificationImpact,
  validateToolcraftVerificationImpactInventory,
} from "./toolcraft-verification-impact.mjs";

const catalog = {
  acceptance: [
    {
      acceptanceId: "appearance.background",
      file: "e2e/app-controls.spec.ts",
      testName: "browser: background",
    },
    {
      acceptanceId: "persistence.reload",
      file: "e2e/app-controls.spec.ts",
      testName: "browser: persistence",
    },
  ],
  performance: [
    {
      passIds: ["preview-composite"],
      pathId:
        "performance-path:%5B%22interactive-discrete%22%2C%22control-change%22%2C%5B%22preview-composite%22%5D%2C%5B%22main%22%5D%2C%5B%5D%5D",
      testName:
        "browser perf: toolcraft path performance-path:%5B%22interactive-discrete%22%2C%22control-change%22%2C%5B%22preview-composite%22%5D%2C%5B%22main%22%5D%2C%5B%5D%5D",
    },
  ],
  version: 1,
};
const productPaths = [
  "src/app/app-schema.ts",
  "src/features/product-output.tsx",
];
const validInventory = {
  owners: [
    {
      acceptanceIds: ["persistence.reload"],
      kind: "functional",
      path: "src/app/app-schema.ts",
    },
    {
      acceptanceIds: ["appearance.background"],
      kind: "performance",
      passIds: ["preview-composite"],
      path: "src/features/product-output.tsx",
    },
  ],
  version: 2,
};

function graph(entries, reverse = {}) {
  return Object.freeze({
    entries: Object.freeze(entries),
    reverse: new Map(
      entries.map(({ repoPath }) => [
        repoPath,
        Object.freeze([...(reverse[repoPath] ?? [])]),
      ]),
    ),
  });
}

function assertCompleteCurrentProof(result, expectedTestFiles) {
  assert.deepEqual(result, {
    acceptanceIds: ["appearance.background", "persistence.reload"],
    browserTestNames: ["browser: background", "browser: persistence"],
    performanceCandidates: {
      passIds: ["preview-composite"],
      pathIds: [catalog.performance[0].pathId],
      testNames: [catalog.performance[0].testName],
    },
    productTestFiles: [...expectedTestFiles].sort(),
  });
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.performanceCandidates), true);
}

function validatedInventory() {
  return validateToolcraftVerificationImpactInventory(validInventory, {
    catalog,
    requiredProductModulePaths: productPaths,
  }).inventory;
}

test("test support routes only reverse-reachable executable unit and catalog proof", () => {
  const supportPath = "src/test-support/browser-fixture.ts";
  const unitPath = "src/features/browser-fixture.test.ts";
  const browserPath = "e2e/app-controls.spec.ts";
  const unrelatedUnitPath = "src/features/unrelated.test.ts";
  const dependencyGraph = graph(
    [
      { owner: "product", repoPath: supportPath, role: "test-support" },
      { owner: "product", repoPath: unitPath, role: "test" },
      { owner: "product", repoPath: browserPath, role: "test" },
      { owner: "product", repoPath: unrelatedUnitPath, role: "test" },
      { owner: "product", repoPath: "src/app/app-schema.ts", role: "production" },
      {
        owner: "product",
        repoPath: "src/features/product-output.tsx",
        role: "production",
      },
    ],
    {
      [supportPath]: [browserPath, unitPath],
    },
  );

  const result = resolveToolcraftChangedVerificationImpact({
    catalog,
    changedFiles: [supportPath],
    graph: dependencyGraph,
    inventory: validatedInventory(),
  });

  assert.deepEqual(result.productTestFiles, [unitPath]);
  assert.deepEqual(result.browserTestNames, [
    "browser: background",
    "browser: persistence",
  ]);
  assert.deepEqual(result.performanceCandidates.passIds, []);
  assert.deepEqual(result.performanceCandidates.testNames, []);
  assert.equal(result.productTestFiles.includes(supportPath), false);
  assert.equal(result.productTestFiles.includes(browserPath), false);

  const mixed = resolveToolcraftChangedVerificationImpact({
    catalog,
    changedFiles: [supportPath, "src/features/product-output.tsx"],
    graph: dependencyGraph,
    inventory: validatedInventory(),
  });
  assert.deepEqual(mixed.productTestFiles, [unitPath]);
  assert.equal(mixed.productTestFiles.includes(unrelatedUnitPath), false);
  assert.deepEqual(mixed.browserTestNames, result.browserTestNames);
  assert.deepEqual(mixed.performanceCandidates.passIds, ["preview-composite"]);
  assert.deepEqual(
    mixed.performanceCandidates.pathIds,
    [catalog.performance[0].pathId],
  );
  assert.deepEqual(
    mixed.performanceCandidates.testNames,
    [catalog.performance[0].testName],
  );
  assert.equal("kind" in mixed, false);
});

test("empty kernel support selects complete proof alone and with owned source", () => {
  const supportPath = "e2e/app-kernel-benchmarks.ts";
  const kernelSpecPath = "e2e/toolcraft-kernel-benchmark.spec.ts";
  const currentUnitTests = [
    "src/app/app-contract.test.ts",
    "src/features/product-output.test.tsx",
  ];
  const dependencyGraph = graph(
    [
      { owner: "product", repoPath: supportPath, role: "test-support" },
      { owner: "product", repoPath: kernelSpecPath, role: "test" },
      { owner: "framework", repoPath: currentUnitTests[0], role: "test" },
      { owner: "product", repoPath: currentUnitTests[1], role: "test" },
      { owner: "product", repoPath: "src/app/app-schema.ts", role: "production" },
      {
        owner: "product",
        repoPath: "src/features/product-output.tsx",
        role: "production",
      },
    ],
    {
      [supportPath]: [kernelSpecPath],
    },
  );

  for (const changedFiles of [
    [supportPath],
    [supportPath, "src/app/app-schema.ts"],
    [supportPath, "src/features/product-output.tsx"],
  ]) {
    assertCompleteCurrentProof(
      resolveToolcraftChangedVerificationImpact({
        catalog,
        changedFiles,
        graph: dependencyGraph,
        inventory: validatedInventory(),
      }),
      currentUnitTests,
    );
  }
});

test("performance specs include only real reverse-reachable Vitest dependents", () => {
  const performancePath = "e2e/app-performance.spec.ts";
  const unitPath = "src/features/performance-contract.test.ts";
  const dependencyGraph = graph(
    [
      { owner: "product", repoPath: performancePath, role: "test" },
      { owner: "product", repoPath: unitPath, role: "test" },
      { owner: "product", repoPath: "src/app/app-schema.ts", role: "production" },
      {
        owner: "product",
        repoPath: "src/features/product-output.tsx",
        role: "production",
      },
    ],
    {
      [performancePath]: [unitPath],
    },
  );

  const result = resolveToolcraftChangedVerificationImpact({
    catalog,
    changedFiles: [performancePath],
    graph: dependencyGraph,
    inventory: validatedInventory(),
  });

  assert.deepEqual(result.productTestFiles, [unitPath]);
  assert.deepEqual(
    result.performanceCandidates.passIds,
    ["preview-composite"],
  );
  assert.equal(result.productTestFiles.includes(performancePath), false);
});

test("fails unknown or unowned changed product resources", () => {
  const dependencyGraph = graph([
    { owner: "product", repoPath: "src/assets/orphan.png", role: "production" },
    { owner: "product", repoPath: "src/app/app-schema.ts", role: "production" },
    {
      owner: "product",
      repoPath: "src/features/product-output.tsx",
      role: "production",
    },
  ]);
  assert.throws(
    () =>
      resolveToolcraftChangedVerificationImpact({
        catalog,
        changedFiles: ["src/assets/orphan.png"],
        graph: dependencyGraph,
        inventory: validatedInventory(),
      }),
    /unrecognized changed verification input/iu,
  );
});

test("inventory changes select complete current proof", () => {
  const allCurrentTests = [
    "e2e/app-controls.spec.ts",
    "e2e/app-performance.spec.ts",
    "src/app/app-contract.test.ts",
    "src/app/app-schema.test.ts",
  ];
  const currentUnitTests = allCurrentTests.filter((repoPath) =>
    repoPath.startsWith("src/"),
  );
  const dependencyGraph = graph([
    { owner: "product", repoPath: allCurrentTests[0], role: "test" },
    { owner: "product", repoPath: allCurrentTests[1], role: "test" },
    { owner: "framework", repoPath: allCurrentTests[2], role: "test" },
    { owner: "product", repoPath: allCurrentTests[3], role: "test" },
    { owner: "product", repoPath: "src/test-support/fixture.ts", role: "test-support" },
    { owner: "product", repoPath: "src/app/app-schema.ts", role: "production" },
    {
      owner: "product",
      repoPath: "src/features/product-output.tsx",
      role: "production",
    },
  ]);

  for (const changedPath of [
    "src/app/app-verification-impact.json",
    "src/app/starter-verification-impact.json",
  ]) {
    assertCompleteCurrentProof(
      resolveToolcraftChangedVerificationImpact({
        catalog,
        changedFiles: [changedPath],
        graph: dependencyGraph,
        inventory: validInventory,
      }),
      currentUnitTests,
    );
  }
});
