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
    kind: "performance",
    performancePassIds: ["preview-composite"],
    performancePathIds: [catalog.performance[0].pathId],
    performanceTestNames: [catalog.performance[0].testName],
    productTestFiles: [...expectedTestFiles].sort(),
  });
  assert.equal(Object.isFrozen(result), true);
  for (const value of Object.values(result)) {
    if (Array.isArray(value)) assert.equal(Object.isFrozen(value), true);
  }
}

function validatedInventory() {
  return validateToolcraftVerificationImpactInventory(validInventory, {
    catalog,
    requiredProductModulePaths: productPaths,
  }).inventory;
}

test("uses strongest ownership through transitive resource importers", () => {
  const dependencyGraph = graph(
    [
      { owner: "product", repoPath: "src/app/app-schema.ts", role: "production" },
      {
        owner: "product",
        repoPath: "src/features/product-output.tsx",
        role: "production",
      },
      { owner: "product", repoPath: "src/styles/output.module.css", role: "production" },
      { owner: "product", repoPath: "src/assets/noise.png", role: "production" },
      { owner: "product", repoPath: "src/features/product-output.test.tsx", role: "test" },
    ],
    {
      "src/assets/noise.png": ["src/styles/output.module.css"],
      "src/styles/output.module.css": ["src/features/product-output.tsx"],
      "src/features/product-output.tsx": ["src/features/product-output.test.tsx"],
    },
  );

  const result = resolveToolcraftChangedVerificationImpact({
    catalog,
    changedFiles: ["src/assets/noise.png", "src/app/app-schema.ts"],
    graph: dependencyGraph,
    inventory: validatedInventory(),
  });
  assert.deepEqual(result, {
    acceptanceIds: ["appearance.background", "persistence.reload"],
    browserTestNames: ["browser: background", "browser: persistence"],
    kind: "performance",
    performancePassIds: ["preview-composite"],
    performancePathIds: [catalog.performance[0].pathId],
    performanceTestNames: [catalog.performance[0].testName],
    productTestFiles: ["src/features/product-output.test.tsx"],
  });
  assert.equal(Object.isFrozen(result), true);
  for (const value of Object.values(result)) {
    if (Array.isArray(value)) assert.equal(Object.isFrozen(value), true);
  }
});

test("changed catalog browser and performance tests select their own proofs", () => {
  const dependencyGraph = graph([
    { owner: "product", repoPath: "e2e/app-controls.spec.ts", role: "test" },
    { owner: "product", repoPath: "e2e/app-performance.spec.ts", role: "test" },
    { owner: "product", repoPath: "src/app/app-schema.ts", role: "production" },
    {
      owner: "product",
      repoPath: "src/features/product-output.tsx",
      role: "production",
    },
  ]);
  const browser = resolveToolcraftChangedVerificationImpact({
    catalog,
    changedFiles: ["e2e/app-controls.spec.ts"],
    graph: dependencyGraph,
    inventory: validatedInventory(),
  });
  assert.equal(browser.kind, "functional");
  assert.deepEqual(browser.acceptanceIds, [
    "appearance.background",
    "persistence.reload",
  ]);

  const performance = resolveToolcraftChangedVerificationImpact({
    catalog,
    changedFiles: ["e2e/app-performance.spec.ts"],
    graph: dependencyGraph,
    inventory: validatedInventory(),
  });
  assert.equal(performance.kind, "performance");
  assert.deepEqual(performance.performancePassIds, ["preview-composite"]);
  assert.deepEqual(performance.productTestFiles, []);
});

test("changed containing persistence spec selects its catalog acceptance", () => {
  const persistenceCatalog = {
    ...catalog,
    acceptance: [
      {
        acceptanceId: "persistence.reload",
        file: "app-persistence.spec.ts",
        testName: "browser: persistence",
      },
    ],
  };
  const result = resolveToolcraftChangedVerificationImpact({
    catalog: persistenceCatalog,
    changedFiles: ["e2e/app-persistence.spec.ts"],
    graph: graph([
      {
        owner: "product",
        repoPath: "e2e/app-persistence.spec.ts",
        role: "test",
      },
    ]),
    inventory: validInventory,
  });
  assert.deepEqual(result.acceptanceIds, ["persistence.reload"]);
  assert.deepEqual(result.browserTestNames, ["browser: persistence"]);
  assert.equal(result.kind, "functional");
});

test("accepts only owned paths or recognized graph and catalog test routes", () => {
  const dependencyGraph = graph([
    { owner: "product", repoPath: "e2e/app-controls.spec.ts", role: "test" },
    { owner: "product", repoPath: "e2e/unknown.spec.ts", role: "test" },
    { owner: "product", repoPath: "src/app/app-schema.test.ts", role: "test" },
    { owner: "product", repoPath: "src/test-support/browser.ts", role: "test-support" },
    { owner: "product", repoPath: "src/app/app-schema.ts", role: "production" },
    {
      owner: "product",
      repoPath: "src/features/product-output.tsx",
      role: "production",
    },
  ]);
  const unit = resolveToolcraftChangedVerificationImpact({
    catalog,
    changedFiles: ["src/app/app-schema.test.ts"],
    graph: dependencyGraph,
    inventory: validatedInventory(),
  });
  assert.deepEqual(unit.productTestFiles, ["src/app/app-schema.test.ts"]);

  assertCompleteCurrentProof(
    resolveToolcraftChangedVerificationImpact({
      catalog,
      changedFiles: ["src/test-support/browser.ts"],
      graph: dependencyGraph,
      inventory: validatedInventory(),
    }),
    ["src/app/app-schema.test.ts"],
  );
  const browser = resolveToolcraftChangedVerificationImpact({
    catalog,
    changedFiles: ["e2e/app-controls.spec.ts"],
    graph: dependencyGraph,
    inventory: validatedInventory(),
  });
  assert.deepEqual(browser.productTestFiles, []);

  assertCompleteCurrentProof(
    resolveToolcraftChangedVerificationImpact({
      catalog,
      changedFiles: ["public/deleted-product-resource.bin"],
      graph: dependencyGraph,
      inventory: validInventory,
    }),
    ["src/app/app-schema.test.ts"],
  );

  for (const changedPath of [
    "e2e/unknown.spec.ts",
    "test-support/app-kernel-benchmarks.ts",
    "vite.config.ts",
    "arbitrary.txt",
  ]) {
    assert.throws(
      () =>
        resolveToolcraftChangedVerificationImpact({
          catalog,
          changedFiles: [changedPath],
          graph: dependencyGraph,
          inventory: validatedInventory(),
        }),
      /unrecognized changed verification input/iu,
      changedPath,
    );
  }
});

test("deleted product modules, resources, tests, support, and e2e select complete current proof", () => {
  const currentTests = [
    "src/app/app-contract.test.ts",
    "src/app/app-schema.test.ts",
  ];
  const dependencyGraph = graph([
    { owner: "framework", repoPath: currentTests[0], role: "test" },
    { owner: "product", repoPath: currentTests[1], role: "test" },
    { owner: "product", repoPath: "src/app/app-schema.ts", role: "production" },
    {
      owner: "product",
      repoPath: "src/features/product-output.tsx",
      role: "production",
    },
  ]);
  for (const changedPath of [
    "src/features/deleted-output.tsx",
    "src/assets/deleted-noise.png",
    "src/features/deleted-output.test.tsx",
    "src/test-support/deleted-fixture.ts",
    "e2e/deleted-controls.spec.ts",
  ]) {
    assertCompleteCurrentProof(
      resolveToolcraftChangedVerificationImpact({
        catalog,
        changedFiles: [changedPath],
        graph: dependencyGraph,
        inventory: validInventory,
      }),
      currentTests,
    );
  }
});

test("deleted owned public resources select complete current proof after ownership moves to a live module", () => {
  const currentTests = ["src/app/app-schema.test.ts"];
  const dependencyGraph = graph([
    { owner: "product", repoPath: currentTests[0], role: "test" },
    { owner: "product", repoPath: "src/app/app-schema.ts", role: "production" },
    {
      owner: "product",
      repoPath: "src/features/product-output.tsx",
      role: "production",
    },
  ]);

  for (const deletedResource of [
    "public/product-pulse.svg",
    "public/product-pulse.custom-resource",
  ]) {
    assertCompleteCurrentProof(
      resolveToolcraftChangedVerificationImpact({
        catalog,
        changedFiles: [deletedResource],
        graph: dependencyGraph,
        inventory: validInventory,
      }),
      currentTests,
    );
  }
  for (const outOfScopePath of [
    "assets/product-pulse.svg",
    "product-pulse.svg",
  ]) {
    assert.throws(
      () =>
        resolveToolcraftChangedVerificationImpact({
          catalog,
          changedFiles: [outOfScopePath],
          graph: dependencyGraph,
          inventory: validInventory,
        }),
      /unrecognized changed verification input/iu,
    );
  }
});

test("public resource rename batches select complete proof independent of changed-file order", () => {
  const currentTests = ["src/app/app-schema.test.ts"];
  const dependencyGraph = graph([
    { owner: "product", repoPath: currentTests[0], role: "test" },
    { owner: "product", repoPath: "src/app/app-schema.ts", role: "production" },
    {
      owner: "product",
      repoPath: "src/features/product-output.tsx",
      role: "production",
    },
    {
      owner: "product",
      repoPath: "public/product-pulse-v2.svg",
      role: "production",
    },
  ]);

  for (const changedFiles of [
    ["public/product-pulse.svg", "public/product-pulse-v2.svg"],
    ["public/product-pulse-v2.svg", "public/product-pulse.svg"],
  ]) {
    assertCompleteCurrentProof(
      resolveToolcraftChangedVerificationImpact({
        catalog,
        changedFiles,
        graph: dependencyGraph,
        inventory: validInventory,
      }),
      currentTests,
    );
  }

  assert.throws(
    () =>
      resolveToolcraftChangedVerificationImpact({
        catalog,
        changedFiles: ["public/product-pulse-v2.svg"],
        graph: dependencyGraph,
        inventory: validInventory,
      }),
    /unrecognized changed verification input/iu,
  );
});

test("added current production modules still require explicit ownership", () => {
  const dependencyGraph = graph([
    { owner: "product", repoPath: "src/app/app-schema.ts", role: "production" },
    {
      owner: "product",
      repoPath: "src/features/added-output.tsx",
      role: "production",
    },
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
        changedFiles: ["src/features/added-output.tsx"],
        graph: dependencyGraph,
        inventory: validInventory,
      }),
    /unrecognized changed verification input/iu,
  );
});
