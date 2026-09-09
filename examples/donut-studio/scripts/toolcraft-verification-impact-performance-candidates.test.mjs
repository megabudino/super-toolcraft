import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import {
  createToolcraftDeliveryPlan,
  getToolcraftDeliveryDiagnosticTier,
} from "./toolcraft-delivery-plan.mjs";
import {
  EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
} from "./toolcraft-delivery-lifecycle-state.mjs";
import {
  resolveToolcraftChangedVerificationImpact,
} from "./toolcraft-verification-impact.mjs";
import {
  createToolcraftVerificationSourceHash,
} from "./toolcraft-verification-inventory.mjs";

const hash = (character) => character.repeat(64);
const paths = Object.freeze([
  "performance-path:%5B%22interactive-continuous%22%2C%22viewport-drag%22%2C%5B%22viewport-composite%22%5D%2C%5B%22main%22%5D%2C%5B%5D%5D",
  "performance-path:%5B%22interactive-discrete%22%2C%22control-change%22%2C%5B%22preview-composite%22%5D%2C%5B%22main%22%5D%2C%5B%5D%5D",
]);
const absentCanonicalPath =
  `performance-path:${encodeURIComponent(JSON.stringify([
    "interactive-continuous",
    "control-drag",
    ["preview-composite"],
    ["main"],
    [],
  ]))}`;
const catalog = Object.freeze({
  acceptance: Object.freeze([
    Object.freeze({
      acceptanceId: "output.updates",
      file: "app-output.spec.ts",
      testName: "browser: output updates",
    }),
    Object.freeze({
      acceptanceId: "viewport.pans",
      file: "app-viewport.spec.ts",
      testName: "browser: viewport pans",
    }),
  ]),
  performance: Object.freeze([
    Object.freeze({
      passIds: Object.freeze(["viewport-composite"]),
      pathId: paths[0],
      testName: `browser perf: toolcraft path ${paths[0]}`,
    }),
    Object.freeze({
      passIds: Object.freeze(["preview-composite"]),
      pathId: paths[1],
      testName: `browser perf: toolcraft path ${paths[1]}`,
    }),
  ]),
  version: 1,
});

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

function graph(entries) {
  return Object.freeze({
    entries: Object.freeze(entries),
    reverse: new Map(
      entries.map(({ repoPath }) => [repoPath, Object.freeze([])]),
    ),
  });
}

function requestAuthority(pathIds = [paths[0]]) {
  const canonical = {
    heading: "Delivery 2 - Slow preview",
    pathIds,
    request:
      "The preview is still slow while dragging; the canvas remains slow.",
    requestEvidence: "preview is still slow",
  };
  return {
    hash: createHash("sha256")
      .update(JSON.stringify(canonical))
      .digest("hex"),
    ...canonical,
  };
}

function performanceCandidates(pathIds = paths) {
  const rows = catalog.performance.filter((row) =>
    pathIds.includes(row.pathId)
  );
  return {
    passIds: [...new Set(rows.flatMap((row) => row.passIds))].sort(),
    pathIds: rows.map((row) => row.pathId).sort(),
    testNames: rows.map((row) => row.testName).sort(),
  };
}

function impact({
  acceptanceIds = ["output.updates", "viewport.pans"],
  browserTestNames = ["browser: output updates", "browser: viewport pans"],
  candidates = performanceCandidates(),
  productTestFiles = ["src/features/output.test.tsx"],
} = {}) {
  return {
    acceptanceIds,
    browserTestNames,
    performanceCandidates: candidates,
    productTestFiles,
  };
}

function planningInputs({
  authority = null,
  initial = false,
  resolvedImpact = impact(),
} = {}) {
  const currentInventory = inventory("2");
  return {
    allProductTestFiles: ["src/features/output.test.tsx"],
    authority,
    catalog,
    changeSet: {
      dependencyChanged: false,
      docsChanged: false,
      impact: initial ? null : resolvedImpact,
      platformChanged: false,
      productInputsChanged: initial ? false : resolvedImpact !== null,
    },
    comparisonInventory: initial ? null : inventory("1"),
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

test("a performance owner resolves functional proof plus nested candidates", () => {
  const result = resolveToolcraftChangedVerificationImpact({
    catalog,
    changedFiles: ["src/features/output.tsx"],
    graph: graph([
      {
        owner: "product",
        repoPath: "src/features/output.tsx",
        role: "production",
      },
      {
        owner: "product",
        repoPath: "src/features/output.test.tsx",
        role: "test",
      },
    ]),
    inventory: {
      owners: [{
        acceptanceIds: ["output.updates"],
        kind: "performance",
        passIds: ["viewport-composite"],
        path: "src/features/output.tsx",
      }],
      version: 2,
    },
  });

  assert.deepEqual(result, {
    acceptanceIds: ["output.updates"],
    browserTestNames: ["browser: output updates"],
    performanceCandidates: performanceCandidates([paths[0]]),
    productTestFiles: [],
  });
  assert.equal("kind" in result, false);
  assert.equal(Object.isFrozen(result.performanceCandidates), true);
});

test("the shared performance spec broadens candidates without authorizing measurement", () => {
  const resolvedImpact = resolveToolcraftChangedVerificationImpact({
    catalog,
    changedFiles: ["e2e/app-performance.spec.ts"],
    graph: graph([
      {
        owner: "product",
        repoPath: "e2e/app-performance.spec.ts",
        role: "test",
      },
    ]),
    inventory: { owners: [], version: 2 },
  });
  assert.deepEqual(
    resolvedImpact.performanceCandidates,
    performanceCandidates(),
  );
  assert.ok(
    resolvedImpact.browserTestNames.length > 0 ||
      resolvedImpact.productTestFiles.length > 0,
  );

  const plan = createToolcraftDeliveryPlan(
    planningInputs({ resolvedImpact }),
  );
  assert.equal(plan.kind, "functional");
  assert.equal(
    plan.steps.some(({ kind }) => kind === "browser-performance"),
    false,
  );
  assert.equal(getToolcraftDeliveryDiagnosticTier(plan), 2);
});

test("changed authority narrows candidates to exact catalog-derived proof", () => {
  const authority = requestAuthority([paths[0]]);
  const plan = createToolcraftDeliveryPlan(
    planningInputs({ authority }),
  );
  const performance = plan.steps.find(
    ({ kind }) => kind === "browser-performance",
  );

  assert.deepEqual(performance, {
    kind: "browser-performance",
    ...performanceCandidates([paths[0]]),
  });
  assert.equal(getToolcraftDeliveryDiagnosticTier(plan), 3);
});

test("rejects candidate-only product impact", () => {
  assert.throws(
    () => createToolcraftDeliveryPlan(
      planningInputs({
        resolvedImpact: impact({
          acceptanceIds: [],
          browserTestNames: [],
          productTestFiles: [],
        }),
      }),
    ),
    /functional proof/iu,
  );
});

test("rejects empty, duplicate, unknown, unrelated, and hash-mismatched authority", () => {
  assert.throws(
    () => createToolcraftDeliveryPlan(
      planningInputs({
        authority: {
          ...requestAuthority(),
          requestEvidence: "canvas remains slow",
        },
      }),
    ),
    /authority hash/iu,
  );
  assert.throws(
    () => createToolcraftDeliveryPlan(
      planningInputs({
        authority: requestAuthority([absentCanonicalPath]),
      }),
    ),
    /unknown path/iu,
  );

  const cases = [
    { ...requestAuthority(), pathIds: [] },
    { ...requestAuthority(), pathIds: [paths[0], paths[0]] },
    requestAuthority([paths[1]]),
  ];
  const narrowImpact = impact({
    candidates: performanceCandidates([paths[0]]),
  });

  for (const authority of cases) {
    assert.throws(
      () => createToolcraftDeliveryPlan(
        planningInputs({ authority, resolvedImpact: narrowImpact }),
      ),
      /authority|performance|hash|candidate/iu,
    );
  }
});
