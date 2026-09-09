import { evaluateToolcraftIntegrity } from "./check-toolcraft-integrity.mjs";
import { commitToolcraftDeliveryCheckpoint } from "./toolcraft-checkpoint-transaction.mjs";
import { collectToolcraftDeliveryCatalog } from "./toolcraft-delivery-catalog-collector.mjs";
import { readToolcraftDeliveryAnchor } from "./toolcraft-delivery-anchor.mjs";
import { executeToolcraftDeliveryPlan } from "./toolcraft-delivery-executor.mjs";
import {
  EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
  getToolcraftPreviousPerformanceError,
} from "./toolcraft-delivery-lifecycle-state.mjs";
import { createToolcraftDeliveryPlan } from "./toolcraft-delivery-plan.mjs";
import { createToolcraftDeliveryReceipt } from "./toolcraft-delivery-receipt.mjs";
import {
  createToolcraftLocalDependencyGraph,
} from "./toolcraft-local-dependency-graph.mjs";
import {
  formatToolcraftPerformanceEscalationRecommendation,
  getToolcraftPerformanceEscalationRecommendation,
} from "./toolcraft-performance-escalation-policy.mjs";
import {
  readToolcraftPerformanceRequestAuthority,
} from "./toolcraft-performance-request-authority.mjs";
import {
  detectToolcraftPackageManager,
} from "./toolcraft-proof-process.mjs";
import {
  createToolcraftDefaultSourceAliases,
  loadToolcraftLocalModuleAliases,
} from "./toolcraft-product-dependency-resolution.mjs";
import {
  collectToolcraftProductVerificationSources,
  readToolcraftVerificationImpactInventory,
  resolveToolcraftChangedVerificationImpact,
} from "./toolcraft-verification-impact.mjs";
import {
  collectToolcraftVerificationInputs,
  getToolcraftChangedVerificationFiles,
} from "./toolcraft-verification-inventory.mjs";
import {
  collectToolcraftFrameworkOwnedLocalPaths,
} from "./toolcraft-source-ownership.mjs";

const testFilePattern = /\.(?:test|spec)\.[cm]?[jt]sx?$/u;
const dependencyPaths = new Set([
  "bun.lock",
  "bun.lockb",
  "package-lock.json",
  "package.json",
  "pnpm-lock.yaml",
  "yarn.lock",
]);
const platformConfigPattern =
  /(?:^|\/)(?:playwright|vite|vitest)\.config\.[cm]?[jt]s$/u;
const tsconfigPattern = /(?:^|\/)tsconfig(?:\.[^/]+)?\.json$/u;
const editablePlatformRootPaths = new Set([
  ".gitignore",
]);

function compareCodeUnits(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function uniqueSorted(values) {
  return [...new Set(values)].sort(compareCodeUnits);
}

function getAllProductTestFiles(inventory) {
  return inventory.entries
    .map(({ path: filePath }) => filePath)
    .filter(
      (filePath) =>
        filePath.startsWith("src/") &&
        !filePath.startsWith("src/toolcraft/") &&
        testFilePattern.test(filePath),
    )
    .sort(compareCodeUnits);
}

function isEditableDocumentation(filePath) {
  return (
    filePath === "docs/toolcraft/agent-worklog.md" ||
    (filePath.startsWith("docs/") &&
      !filePath.startsWith("docs/toolcraft/")) ||
    /(?:^|\/)(?:README|CHANGELOG)\.md$/iu.test(filePath)
  );
}

function isEditablePlatformConfig(filePath) {
  return editablePlatformRootPaths.has(filePath) ||
    platformConfigPattern.test(filePath) ||
    tsconfigPattern.test(filePath);
}

function hasSelectedProof(impact) {
  return [
    impact.acceptanceIds,
    impact.browserTestNames,
    impact.productTestFiles,
    impact.performanceCandidates.passIds,
    impact.performanceCandidates.pathIds,
    impact.performanceCandidates.testNames,
  ].some((values) => values.length > 0);
}

function assertCurrentPreviousPerformance(performance) {
  const error = getToolcraftPreviousPerformanceError(performance);
  if (error) throw new Error(error);
  return performance;
}

async function createProductPlanningContext(projectDir, catalog) {
  const {
    knownProductResourcePaths,
    requiredProductModulePaths,
    sourceInventory,
  } = await collectToolcraftProductVerificationSources(projectDir);
  const aliases = await loadToolcraftLocalModuleAliases({
    rootDir: projectDir,
    tsconfigPaths: ["tsconfig.json"],
  });
  const graph = await createToolcraftLocalDependencyGraph({
    aliases: [
      ...aliases,
      ...createToolcraftDefaultSourceAliases(projectDir),
    ],
    entries: sourceInventory.entries,
    rootDir: projectDir,
  });
  const { inventory } = await readToolcraftVerificationImpactInventory(
    projectDir,
    {
      catalog,
      knownProductResourcePaths,
      requiredProductModulePaths,
    },
  );
  return { graph, inventory };
}

function classifyChangedFiles(changedFiles, frameworkOwnedPaths) {
  const frameworkOwnedPathSet = new Set(frameworkOwnedPaths);
  const dependency = [];
  const docs = [];
  const platform = [];
  const product = [];
  for (const filePath of changedFiles) {
    if (dependencyPaths.has(filePath)) {
      dependency.push(filePath);
    } else if (isEditableDocumentation(filePath)) {
      docs.push(filePath);
    } else if (
      isEditablePlatformConfig(filePath) ||
      filePath.startsWith("scripts/") ||
      filePath.startsWith("src/toolcraft/") ||
      frameworkOwnedPathSet.has(filePath)
    ) {
      platform.push(filePath);
    } else {
      product.push(filePath);
    }
  }
  return { dependency, docs, platform, product };
}

export async function loadToolcraftDeliveryPlanningInputs({
  currentInventory,
  integrity,
  previous,
  projectDir,
}) {
  const previousPerformance = previous.missing
    ? Object.freeze({ kind: "none" })
    : assertCurrentPreviousPerformance(previous.anchor.performance);
  const catalog = await collectToolcraftDeliveryCatalog(projectDir);
  const common = {
    allProductTestFiles: getAllProductTestFiles(currentInventory),
    catalog,
    currentInventory,
    integrity,
    packageManager: detectToolcraftPackageManager(projectDir),
  };
  const authority =
    await readToolcraftPerformanceRequestAuthority(projectDir);
  if (previous.missing) {
    return Object.freeze({
      ...common,
      authority,
      changeSet: Object.freeze({
        dependencyChanged: false,
        docsChanged: false,
        impact: null,
        platformChanged: false,
        productInputsChanged: false,
      }),
      comparisonInventory: null,
      previousLifecycle: EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
      previousPerformance,
    });
  }

  const comparisonInventory = Object.freeze({
    entries: previous.anchor.files,
    sourceHash: previous.anchor.sourceHash,
  });
  const changedFiles = getToolcraftChangedVerificationFiles(
    comparisonInventory.entries,
    currentInventory.entries,
  );
  const frameworkOwnedPaths =
    await collectToolcraftFrameworkOwnedLocalPaths(projectDir);
  const classified = classifyChangedFiles(
    changedFiles,
    frameworkOwnedPaths,
  );
  let impact = null;
  if (classified.product.length > 0) {
    const context = await createProductPlanningContext(
      projectDir,
      catalog,
    );
    const resolved = resolveToolcraftChangedVerificationImpact({
      catalog,
      changedFiles: classified.product,
      graph: context.graph,
      inventory: context.inventory,
    });
    impact = hasSelectedProof(resolved) ? resolved : null;
  }
  return Object.freeze({
    ...common,
    authority,
    changeSet: Object.freeze({
      dependencyChanged: classified.dependency.length > 0,
      docsChanged: classified.docs.length > 0,
      impact,
      platformChanged: classified.platform.length > 0,
      productInputsChanged: impact !== null,
    }),
    comparisonInventory,
    previousLifecycle: previous.anchor.lifecycle,
    previousPerformance,
  });
}

const defaultDeliveryDependencies = Object.freeze({
  collectInventory: collectToolcraftVerificationInputs,
  commit: async ({ receipt, result, projectDir }) =>
    commitToolcraftDeliveryCheckpoint({
      deliveryReceipt: receipt,
      finalInventory: result.finalInventory,
      planExecutionAuthority: result.planExecutionAuthority,
      projectDir,
    }),
  createPlan: createToolcraftDeliveryPlan,
  createReceipt: createToolcraftDeliveryReceipt,
  evaluateIntegrity: evaluateToolcraftIntegrity,
  executePlan: executeToolcraftDeliveryPlan,
  formatEscalationRecommendation:
    formatToolcraftPerformanceEscalationRecommendation,
  getEscalationRecommendation:
    getToolcraftPerformanceEscalationRecommendation,
  loadPlanningInputs: loadToolcraftDeliveryPlanningInputs,
  readDeliveryAnchor: readToolcraftDeliveryAnchor,
});

export async function executeToolcraftDeliveryLifecycleCore({
  dependencies,
  projectDir,
}) {
  const previous = await dependencies.readDeliveryAnchor(projectDir);
  if (previous.error) throw new Error(previous.error);
  const currentInventory =
    await dependencies.collectInventory(projectDir);
  if (
    !previous.missing &&
    previous.anchor.sourceHash === currentInventory.sourceHash
  ) {
    console.log(
      "Toolcraft delivery inputs are unchanged; delivery remains current.",
    );
    return previous.receipt;
  }

  const integrity = await dependencies.evaluateIntegrity({
    inventory: currentInventory,
    platformOnly: true,
    rootDir: projectDir,
  });
  const planningInputs = await dependencies.loadPlanningInputs({
    currentInventory,
    integrity,
    previous,
    projectDir,
  });
  const plan = dependencies.createPlan(planningInputs);
  const result = await dependencies.executePlan({ plan, projectDir });
  const receipt = dependencies.createReceipt({ plan, result });
  await dependencies.commit({
    plan,
    projectDir,
    receipt,
    result,
  });
  if (plan.kind === "performance-iteration") {
    const recommendation = dependencies.getEscalationRecommendation({
      currentReceipt: receipt,
      previousAnchor: previous.anchor,
    });
    if (recommendation) {
      console.log(
        dependencies.formatEscalationRecommendation(recommendation),
      );
    }
  }
  return receipt;
}

export function executeToolcraftDeliveryLifecycle({ projectDir }) {
  return executeToolcraftDeliveryLifecycleCore({
    dependencies: defaultDeliveryDependencies,
    projectDir,
  });
}
