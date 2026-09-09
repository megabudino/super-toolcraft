import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  executeToolcraftDeliveryLifecycleCore,
  loadToolcraftDeliveryPlanningInputs,
} from "./toolcraft-delivery-lifecycle.mjs";
import {
  EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
} from "./toolcraft-delivery-lifecycle-state.mjs";
import {
  createToolcraftDeliveryPlan,
} from "./toolcraft-delivery-plan.mjs";
import {
  createToolcraftVerificationSourceHash,
  collectToolcraftVerificationInputs,
} from "./toolcraft-verification-inventory.mjs";
import {
  TOOLCRAFT_DELIVERY_VERIFICATION_NARRATIVE,
} from "./toolcraft-performance-authority-policy.mjs";
import {
  createDeliveryFixture,
  removeDeliveryFixture,
} from "./run-delivery-verification-test-helpers.mjs";

const hash = (character) => character.repeat(64);
const pathId =
  "performance-path:%5B%22interactive-discrete%22%2C%22control-change%22%2C%5B%22composite%22%5D%2C%5B%22main%22%5D%2C%5B%5D%5D";
const performanceTestName = `browser perf: toolcraft path ${pathId}`;
const catalog = Object.freeze({
  acceptance: Object.freeze([Object.freeze({
    acceptanceId: "output.updates",
    file: "app-controls.spec.ts",
    testName: "browser: output updates",
  })]),
  performance: Object.freeze([Object.freeze({
    passIds: Object.freeze(["composite"]),
    pathId,
    testName: performanceTestName,
  })]),
  version: 1,
});

function inventory(character) {
  const entries = Object.freeze([
    Object.freeze({
      path: "src/app/output.tsx",
      sha256: hash(character),
    }),
  ]);
  return Object.freeze({
    entries,
    sourceHash: createToolcraftVerificationSourceHash(entries),
  });
}

function impact(kind) {
  return Object.freeze({
    acceptanceIds: Object.freeze(["output.updates"]),
    browserTestNames: Object.freeze(["browser: output updates"]),
    kind,
    performancePassIds:
      kind === "performance" ? Object.freeze(["composite"]) : Object.freeze([]),
    performancePathIds:
      kind === "performance" ? Object.freeze([pathId]) : Object.freeze([]),
    performanceTestNames:
      kind === "performance"
        ? Object.freeze([performanceTestName])
        : Object.freeze([]),
    productTestFiles: Object.freeze(["src/app/output.test.tsx"]),
  });
}

function planningInputs({ current, previous, kind = "functional" }) {
  const resolvedImpact = impact(kind);
  return Object.freeze({
    allProductTestFiles: Object.freeze(["src/app/output.test.tsx"]),
    authority: null,
    catalog,
    changeSet: Object.freeze({
      dependencyChanged: false,
      docsChanged: false,
      impact: resolvedImpact,
      platformChanged: false,
      productInputsChanged: true,
    }),
    comparisonInventory: Object.freeze({
      entries: previous.anchor.files,
      sourceHash: previous.anchor.sourceHash,
    }),
    currentInventory: current,
    integrity: Object.freeze({
      manifestHash: hash("a"),
      sourceHash: current.sourceHash,
    }),
    packageManager: "pnpm",
    previousLifecycle: previous.anchor.lifecycle,
    previousPerformance: Object.freeze({ kind: "none" }),
  });
}

function dependencies({ current, kind = "functional", onCommit, onExecute }) {
  const previous = Object.freeze({
    anchor: Object.freeze({
      files: inventory("1").entries,
      lifecycle: EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
      performance: Object.freeze({ kind: "none" }),
      sourceHash: inventory("1").sourceHash,
    }),
    receipt: Object.freeze({ version: 5 }),
  });
  return Object.freeze({
    collectInventory: async () => current,
    commit: async (value) => onCommit?.(value),
    createPlan: createToolcraftDeliveryPlan,
    createReceipt: ({ plan, result }) =>
      Object.freeze({ plan, result, version: 5 }),
    evaluateIntegrity: async () =>
      planningInputs({ current, kind, previous }).integrity,
    executePlan: async (options) => {
      onExecute?.(options);
      return Object.freeze({
        evidence: Object.freeze([]),
        finalInventory: current,
        planExecutionAuthority: Object.freeze(Object.create(null)),
      });
    },
    formatEscalationRecommendation: () => "",
    getEscalationRecommendation: () => null,
    loadPlanningInputs: async () =>
      planningInputs({ current, kind, previous }),
    readDeliveryAnchor: async () => previous,
  });
}

test("bare ordinary delivery automatically executes exact functional ownership proof", async () => {
  const current = inventory("2");
  let executed;
  let committed;
  const receipt = await executeToolcraftDeliveryLifecycleCore({
    dependencies: dependencies({
      current,
      onCommit: (value) => { committed = value; },
      onExecute: (value) => { executed = value; },
    }),
    projectDir: "/tmp/toolcraft-ordinary",
  });

  assert.deepEqual(Object.keys(executed), ["plan", "projectDir"]);
  assert.deepEqual(executed.plan.changedFiles, ["src/app/output.tsx"]);
  assert.deepEqual(executed.plan.steps, [
    { kind: "code-health" },
    {
      files: ["src/app/output.test.tsx"],
      kind: "product-tests",
    },
    { kind: "build" },
    {
      kind: "browser-functional",
      testNames: ["browser: output updates"],
    },
  ]);
  assert.equal(Object.hasOwn(executed.plan, "selectors"), false);
  assert.equal(committed.receipt, receipt);
});

test("performance-owned ordinary change stays ordinary and never expands to a full matrix", async () => {
  const current = inventory("3");
  let plan;
  await executeToolcraftDeliveryLifecycleCore({
    dependencies: dependencies({
      current,
      kind: "performance",
      onExecute: ({ plan: value }) => { plan = value; },
    }),
    projectDir: "/tmp/toolcraft-ordinary-performance",
  });

  assert.equal(plan.kind, "ordinary");
  assert.deepEqual(
    plan.steps.filter(({ kind }) => kind === "browser-performance"),
    [{
      kind: "browser-performance",
      passIds: ["composite"],
      pathIds: [pathId],
      testNames: [performanceTestName],
    }],
  );
  assert.equal(
    plan.steps.some(({ kind }) => kind === "browser-functional-smoke"),
    false,
  );
});

test("failed ordinary execution never reaches receipt construction or commit", async () => {
  const current = inventory("4");
  const base = dependencies({ current });
  let receipts = 0;
  let commits = 0;
  await assert.rejects(
    executeToolcraftDeliveryLifecycleCore({
      dependencies: Object.freeze({
        ...base,
        commit: async () => { commits += 1; },
        createReceipt: () => {
          receipts += 1;
          return {};
        },
        executePlan: async () => {
          throw new Error("targeted proof failed");
        },
      }),
      projectDir: "/tmp/toolcraft-ordinary-failure",
    }),
    /targeted proof failed/iu,
  );
  assert.equal(receipts, 0);
  assert.equal(commits, 0);
});

test("planning input loader owns catalog, graph, ownership, and optional domain authority", async (t) => {
  const rootDir = createDeliveryFixture();
  t.after(() => removeDeliveryFixture(rootDir));
  const productPulsePath = path.join(rootDir, "public", "product-pulse.svg");
  const unownedTexturePath = path.join(rootDir, "public", "unowned-texture.svg");
  mkdirSync(path.dirname(productPulsePath), { recursive: true });
  writeFileSync(productPulsePath, "<svg xmlns=\"http://www.w3.org/2000/svg\"/>\n");
  writeFileSync(unownedTexturePath, "<svg xmlns=\"http://www.w3.org/2000/svg\"/>\n");
  const impactPath = path.join(
    rootDir,
    "src",
    "app",
    "app-verification-impact.json",
  );
  const impactInventory = JSON.parse(readFileSync(impactPath, "utf8"));
  impactInventory.owners.push({
    acceptanceIds: ["persistence.reload"],
    kind: "presentation",
    path: "public/product-pulse.svg",
  });
  writeFileSync(impactPath, `${JSON.stringify(impactInventory)}\n`);
  const comparisonInventory =
    await collectToolcraftVerificationInputs(rootDir);
  writeFileSync(
    path.join(rootDir, "src", "app", "schema.ts"),
    "export const schema = 2;\n",
  );
  writeFileSync(
    path.join(rootDir, "docs", "toolcraft", "agent-worklog.md"),
    `# Agent Worklog

## Decision Trail

### Ordinary delivery 2
- Request: Update the schema behavior.
- Performance intent: ordinary-product-work
- Verification: ${TOOLCRAFT_DELIVERY_VERIFICATION_NARRATIVE}

## Verification
Protected receipts own checks and evidence.
`,
  );
  const currentInventory =
    await collectToolcraftVerificationInputs(rootDir);
  const integrity = Object.freeze({
    manifestHash: hash("a"),
    sourceHash: currentInventory.sourceHash,
  });
  const inputs = await loadToolcraftDeliveryPlanningInputs({
    currentInventory,
    integrity,
    previous: {
      anchor: {
        files: comparisonInventory.entries,
        lifecycle: EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
        performance: { kind: "none" },
        sourceHash: comparisonInventory.sourceHash,
      },
      receipt: { version: 5 },
    },
    projectDir: rootDir,
  });

  assert.equal(inputs.authority, null);
  assert.equal(inputs.changeSet.docsChanged, true);
  assert.equal(inputs.changeSet.productInputsChanged, true);
  assert.equal(inputs.changeSet.impact.kind, "functional");
  assert.deepEqual(
    inputs.changeSet.impact.browserTestNames,
    ["browser: focused acceptance"],
  );
  assert.equal(Object.hasOwn(inputs, "selectors"), false);
  assert.equal(Object.hasOwn(inputs, "executionContext"), false);
});

test("planning classifies refreshed signed framework and copied runtime as platform changes", async (t) => {
  const rootDir = createDeliveryFixture();
  t.after(() => removeDeliveryFixture(rootDir));
  const comparisonInventory =
    await collectToolcraftVerificationInputs(rootDir);
  writeFileSync(
    path.join(rootDir, "scripts", "toolcraft-source-inventory.mjs"),
    `${readFileSync(
      path.join(rootDir, "scripts", "toolcraft-source-inventory.mjs"),
      "utf8",
    )}\n// refreshed framework script\n`,
  );
  mkdirSync(
    path.join(rootDir, "src", "toolcraft", "runtime"),
    { recursive: true },
  );
  writeFileSync(
    path.join(rootDir, "src", "toolcraft", "runtime", "index.ts"),
    "export const refreshedCopiedRuntime = true;\n",
  );
  writeFileSync(path.join(rootDir, ".gitignore"), "dist\n");
  const currentInventory =
    await collectToolcraftVerificationInputs(rootDir);
  const inputs = await loadToolcraftDeliveryPlanningInputs({
    currentInventory,
    integrity: Object.freeze({
      manifestHash: hash("a"),
      sourceHash: currentInventory.sourceHash,
    }),
    previous: {
      anchor: {
        files: comparisonInventory.entries,
        lifecycle: EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
        performance: { kind: "none" },
        sourceHash: comparisonInventory.sourceHash,
      },
      receipt: { version: 5 },
    },
    projectDir: rootDir,
  });

  assert.equal(inputs.changeSet.platformChanged, true);
  assert.equal(inputs.changeSet.productInputsChanged, false);
  assert.equal(inputs.changeSet.impact, null);
});
