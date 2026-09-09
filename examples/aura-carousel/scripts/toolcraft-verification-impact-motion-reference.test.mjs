import assert from "node:assert/strict";
import test from "node:test";

import {
  createToolcraftFunctionalProofModel,
} from "./toolcraft-functional-proof-model.mjs";
import {
  resolveToolcraftChangedVerificationImpact,
} from "./toolcraft-verification-impact.mjs";
import {
  toolcraftVerificationInputRootFamilies,
} from "./toolcraft-verification-input-roles.mjs";

const evidencePath =
  "src/app/reference-studies/study-main/evidence.json";
const contactSheetPath =
  "src/app/reference-studies/study-main/contact-sheet.png";
const acceptanceIds = [
  "reference.anchor-retarget",
  "reference.loop-seam",
];
const catalog = Object.freeze({
  acceptance: Object.freeze([
    Object.freeze({
      acceptanceId: acceptanceIds[0],
      contractHash: "a".repeat(64),
      domainId: "reference",
      file: "app-reference-parity.spec.ts",
      testName: "browser: preserves referenced anchor retarget behavior",
    }),
    Object.freeze({
      acceptanceId: acceptanceIds[1],
      contractHash: "b".repeat(64),
      domainId: "reference",
      file: "app-reference-parity.spec.ts",
      testName: "browser: preserves referenced loop seam behavior",
    }),
  ]),
  performance: Object.freeze([
    Object.freeze({
      passIds: Object.freeze(["preview-composite"]),
      pathId:
        "performance-path:%5B%22interactive-discrete%22%2C%22control-change%22%2C%5B%22preview-composite%22%5D%2C%5B%22main%22%5D%2C%5B%5D%5D",
      testName:
        "browser perf: toolcraft path performance-path:%5B%22interactive-discrete%22%2C%22control-change%22%2C%5B%22preview-composite%22%5D%2C%5B%22main%22%5D%2C%5B%5D%5D",
    }),
  ]),
  version: 2,
});
const owners = Object.freeze(
  [evidencePath, contactSheetPath].map((path) =>
    Object.freeze({
      acceptanceIds: Object.freeze([...acceptanceIds]),
      kind: "functional",
      path,
    }),
  ),
);

test("generated products bind both exact study resources to mapped functional acceptance", () => {
  const model = createToolcraftFunctionalProofModel({
    catalog,
    inventory: { owners, version: 3 },
  });
  const roleByPath = Object.freeze({
    [contactSheetPath]: "product-resource",
    [evidencePath]: "product-resource",
  });
  const roles = Object.freeze({
    impactInventoryPath: "src/app/app-verification-impact.json",
    productResourcePaths: Object.freeze([contactSheetPath, evidencePath]),
    productTestPaths: Object.freeze([]),
    proofModelPaths: Object.freeze([]),
    roleByPath,
    rootFamily: "generated",
    runtimeProductionPaths: Object.freeze([]),
    semanticProofRootPaths:
      toolcraftVerificationInputRootFamilies.generated.semanticProofRootPaths,
  });
  const graph = Object.freeze({
    entries: Object.freeze(
      [contactSheetPath, evidencePath].map((repoPath) =>
        Object.freeze({ owner: "product", repoPath, role: "production" }),
      ),
    ),
    reverse: new Map([
      [contactSheetPath, Object.freeze([])],
      [evidencePath, Object.freeze([])],
    ]),
  });

  const result = resolveToolcraftChangedVerificationImpact({
    catalog,
    changedFiles: [contactSheetPath],
    currentModel: model,
    graph,
    previousModel: model,
    roles,
  });

  assert.deepEqual(result, {
    acceptanceIds,
    browserTestNames: [
      "browser: preserves referenced anchor retarget behavior",
      "browser: preserves referenced loop seam behavior",
    ],
    buildRequired: true,
    performanceCandidates: {
      passIds: [],
      pathIds: [],
      testNames: [],
    },
    productTestFiles: [],
  });
});
