import assert from "node:assert/strict";
import test from "node:test";

import {
  getToolcraftExecutionEvidenceError,
} from "./toolcraft-delivery-evidence.mjs";
import {
  createInventory,
  createPlanReceiptFixture,
} from "./toolcraft-delivery-receipt-test-helpers.mjs";

const hash = (character) => character.repeat(64);

function clone(value) {
  return structuredClone(value);
}

function freeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

function createDependencyFixture() {
  const comparisonInventory = createInventory({
    "package.json": hash("1"),
    "pnpm-lock.yaml": hash("2"),
  });
  const finalInventory = createInventory({
    "package.json": hash("3"),
    "pnpm-lock.yaml": hash("4"),
  });
  const plan = freeze({
    changedFiles: ["package.json", "pnpm-lock.yaml"],
    comparisonInventory,
    kind: "ordinary",
    manifestHash: hash("a"),
    sourceHash: finalInventory.sourceHash,
    steps: [
      { kind: "dependencies", packageManager: "pnpm" },
      { kind: "docs" },
      { kind: "code-health" },
      {
        files: ["src/app/app-automated-runtime-evidence.test.ts"],
        kind: "product-tests",
      },
      { kind: "build" },
      {
        kind: "browser-functional-smoke",
        smokeTestName: "browser smoke: toolcraft prototype responsiveness",
        testNames: ["browser: focused acceptance"],
      },
    ],
  });
  return {
    plan,
    result: {
      evidence: [
        { kind: "dependencies", packageManager: "pnpm" },
        { kind: "docs" },
        { kind: "code-health" },
        {
          files: ["src/app/app-automated-runtime-evidence.test.ts"],
          kind: "product-tests",
        },
        { kind: "build" },
        {
          kind: "browser-functional-smoke",
          smokeEvidence: {
            fixtureSelector: "development",
            kind: "performance-smoke",
            sourceHash: finalInventory.sourceHash,
            testName: "browser smoke: toolcraft prototype responsiveness",
          },
          testNames: ["browser: focused acceptance"],
        },
      ],
      finalInventory,
    },
  };
}

for (const kind of ["prototype", "ordinary", "performance-iteration"]) {
  test(`accepts exact ${kind} execution evidence`, () => {
    const { plan, result } = createPlanReceiptFixture(kind);
    assert.equal(
      getToolcraftExecutionEvidenceError({
        evidence: result.evidence,
        finalInventory: result.finalInventory,
        plan,
      }),
      undefined,
    );
  });
}

test("accepts exact evidence for every proof-step kind", () => {
  const { plan, result } = createDependencyFixture();
  assert.equal(
    getToolcraftExecutionEvidenceError({
      evidence: result.evidence,
      finalInventory: result.finalInventory,
      plan,
    }),
    undefined,
  );
});

test("rejects missing, excess, duplicate, and reordered step evidence", () => {
  const { plan, result } = createDependencyFixture();
  for (const evidence of [
    result.evidence.slice(0, -1),
    [...result.evidence, { kind: "build" }],
    [result.evidence[0], result.evidence[0], ...result.evidence.slice(2)],
    [result.evidence[1], result.evidence[0], ...result.evidence.slice(2)],
  ]) {
    assert.equal(
      getToolcraftExecutionEvidenceError({
        evidence,
        finalInventory: result.finalInventory,
        plan,
      }),
      "Toolcraft execution evidence does not exactly match its plan.",
    );
  }
});

test("rejects altered step targets and combined smoke evidence", () => {
  const { plan, result } = createDependencyFixture();
  const mutations = [
    [0, { kind: "dependencies", packageManager: "npm" }],
    [3, { files: ["src/app/other.test.ts"], kind: "product-tests" }],
    [
      5,
      {
        ...result.evidence[5],
        testNames: ["browser: different acceptance"],
      },
    ],
    [
      5,
      {
        ...result.evidence[5],
        smokeEvidence: {
          ...result.evidence[5].smokeEvidence,
          sourceHash: hash("f"),
        },
      },
    ],
  ];
  for (const [index, replacement] of mutations) {
    const evidence = [...result.evidence];
    evidence[index] = replacement;
    assert.match(
      getToolcraftExecutionEvidenceError({
        evidence,
        finalInventory: result.finalInventory,
        plan,
      }),
      /does not match/iu,
    );
  }
});

test("rejects altered performance targets, report, and request authority", () => {
  const { plan, result } = createPlanReceiptFixture("performance-iteration");
  const performanceIndex = result.evidence.length - 1;
  for (const update of [
    { pathIds: ["other-path"] },
    { passIds: ["other-pass"] },
    { testNames: ["browser perf: other"] },
    {
      report: {
        ...result.evidence[performanceIndex].report,
        requestAuthorityHash: hash("e"),
      },
    },
  ]) {
    const evidence = clone(result.evidence);
    evidence[performanceIndex] = {
      ...evidence[performanceIndex],
      ...update,
    };
    assert.match(
      getToolcraftExecutionEvidenceError({
        evidence,
        finalInventory: result.finalInventory,
        plan,
      }),
      /does not match|malformed/iu,
    );
  }
});

test("rejects source and final inventory mismatch deterministically", () => {
  const { plan, result } = createPlanReceiptFixture("ordinary");
  assert.equal(
    getToolcraftExecutionEvidenceError({
      evidence: result.evidence,
      finalInventory: {
        entries: result.finalInventory.entries,
        sourceHash: hash("f"),
      },
      plan,
    }),
    "Toolcraft delivery final inventory does not produce its source hash.",
  );
  const otherInventory = createInventory({
    "src/app/app-schema.ts": hash("9"),
  });
  assert.equal(
    getToolcraftExecutionEvidenceError({
      evidence: result.evidence,
      finalInventory: otherInventory,
      plan,
    }),
    "Toolcraft execution evidence does not exactly match its plan.",
  );
});
