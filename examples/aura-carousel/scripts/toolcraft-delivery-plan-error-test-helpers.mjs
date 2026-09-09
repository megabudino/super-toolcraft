import {
  EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
} from "./toolcraft-delivery-lifecycle-state.mjs";
import {
  hash,
  pathId,
  performanceTestName,
} from "./toolcraft-delivery-plan-test-helpers.mjs";
import {
  createToolcraftFunctionalProofModel,
} from "./toolcraft-functional-proof-model.mjs";
import {
  createToolcraftPerformanceRequestAuthorityHash,
} from "./toolcraft-performance-authority-policy.mjs";
import {
  createToolcraftTargetedPerformanceReport,
} from "./toolcraft-targeted-performance-report.mjs";
import {
  createToolcraftVerificationSourceHash,
} from "./toolcraft-verification-inventory.mjs";

export { hash };
export const absentCanonicalPath =
  `performance-path:${encodeURIComponent(JSON.stringify([
    "interactive-continuous",
    "control-drag",
    ["preview-composite"],
    ["main"],
    [],
  ]))}`;
const catalog = {
  acceptance: [{
    acceptanceId: "output.updates",
    contractHash: hash("a"),
    domainId: "output",
    file: "app-output.spec.ts",
    testName: "browser: output updates",
  }],
  performance: [{
    passIds: ["preview-composite"],
    pathId,
    testName: performanceTestName,
  }],
  version: 2,
};

function proofModel(ownerPath) {
  return createToolcraftFunctionalProofModel({
    catalog,
    inventory: {
      owners: [{
        acceptanceIds: ["output.updates"],
        kind: "functional",
        path: ownerPath,
      }],
      version: 3,
    },
  });
}

function inventory(path, digit) {
  const entries = [{ path, sha256: hash(digit) }];
  return { entries, sourceHash: createToolcraftVerificationSourceHash(entries) };
}

function performanceImpact() {
  return {
    acceptanceIds: ["output.updates"],
    browserTestNames: ["browser: output updates"],
    buildRequired: true,
    performanceCandidates: {
      passIds: ["preview-composite"],
      pathIds: [pathId],
      testNames: [performanceTestName],
    },
    productTestFiles: ["src/features/output.test.tsx"],
  };
}

export function requestAuthority(pathIds = [pathId]) {
  const source = {
    heading: "Delivery 2 - Slow preview",
    pathIds,
    request: "Slow preview",
    requestEvidence: "Slow preview",
  };
  return { hash: createToolcraftPerformanceRequestAuthorityHash(source), ...source };
}

export function inputs({
  authority = null,
  changedPath = "src/features/output.tsx",
  resolvedImpact = performanceImpact(),
} = {}) {
  const comparisonInventory = inventory(changedPath, "1");
  const currentInventory = inventory(changedPath, "2");
  return {
    allProductTestFiles: ["src/features/output.test.tsx"],
    authority,
    catalog,
    changeSet: {
      dependencyChanged: false,
      docsChanged: false,
      frameworkChanged: false,
      impact: resolvedImpact,
      platformChanged: false,
      productInputsChanged: resolvedImpact !== null,
    },
    comparisonInventory,
    currentFunctionalProofModel: proofModel("src/features/output.tsx"),
    currentInventory,
    integrity: { manifestHash: hash("a"), sourceHash: currentInventory.sourceHash },
    packageManager: "pnpm",
    previousFunctionalProofModel: proofModel(
      "src/features/previous-output.tsx",
    ),
    previousLifecycle: EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
    previousPerformance: { kind: "none" },
  };
}

export function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

export function validReport(sourceHash, requestAuthorityHash) {
  const metrics = {
    droppedFrameCount: 0,
    droppedFrameRatio: 0,
    durationMs: 100,
    frameGapP50Ms: 16,
    frameGapP95Ms: 17,
    frameGapP99Ms: 18,
    longTaskCount: 0,
    longTaskMaxMs: 0,
    maxFrameGapMs: 20,
    sampleCount: 10,
  };
  return createToolcraftTargetedPerformanceReport({
    fixtureResolutionMode: "strict-development",
    fixtureSelector: "development",
    measurements: ["cold", "warm", "sustained"].map((phase) => ({
      evidenceType: "performance-measurement-metrics",
      kind: "animation-frames",
      metrics,
      pathId,
      phase,
      profile: "default",
      profileCatalogVersion: 1,
      version: 1,
    })),
    nonce: "nonce",
    performancePassIds: ["preview-composite"],
    performancePathIds: [pathId],
    requestAuthorityHash,
    sourceHash,
    testNames: [performanceTestName],
  });
}
