import { createHash } from "node:crypto";
import { validateToolcraftDeliveryCatalog } from "./playwright-test-title-selection.mjs";
import { createToolcraftDeliveryPlanLifecycle, getToolcraftDeliveryLifecyclePlanningError,
  getToolcraftDeliveryPlanLifecycleError, getToolcraftPreviousPerformanceError
} from "./toolcraft-delivery-lifecycle-state.mjs";
import { createToolcraftTargetedPerformanceReportHash,
  getToolcraftTargetedPerformanceReportError } from "./toolcraft-targeted-performance-report.mjs";
import { getToolcraftChangedVerificationFiles,
  getToolcraftVerificationInventoryError } from "./toolcraft-verification-inventory.mjs";
export const TOOLCRAFT_DELIVERY_PLAN_VERSION = 2;
const hashPattern = /^[a-f0-9]{64}$/u;
const managers = new Set(["npm", "pnpm", "yarn", "bun"]);
const smokeName = "browser smoke: toolcraft prototype responsiveness";
const stepOrder = ["dependencies", "docs", "code-health", "product-tests", "build",
  "browser-functional", "browser-functional-smoke", "browser-performance"];
const changeFlags = ["dependencyChanged", "docsChanged", "platformChanged", "productInputsChanged"];
const inputKeys = ["allProductTestFiles", "authority", "catalog", "changeSet",
  "comparisonInventory", "currentInventory", "integrity", "packageManager",
  "previousLifecycle", "previousPerformance"];
const impactKeys = ["acceptanceIds", "browserTestNames", "kind", "performancePassIds",
  "performancePathIds", "performanceTestNames", "productTestFiles"];
const stepKeys = {
  dependencies: ["kind", "packageManager"], docs: ["kind"],
  "code-health": ["kind"], "product-tests": ["kind", "files"], build: ["kind"],
  "browser-functional": ["kind", "testNames"], "browser-functional-smoke": ["kind", "smokeTestName", "testNames"],
  "browser-performance": ["kind", "testNames", "pathIds", "passIds"],
};
const planKeys = {
  prototype: ["kind", "lifecycle", "sourceHash", "manifestHash", "steps"],
  ordinary: ["kind", "lifecycle", "comparisonInventory", "sourceHash",
    "changedFiles", "manifestHash", "steps"],
  "performance-iteration": ["kind", "comparisonInventory", "sourceHash", "changedFiles",
    "lifecycle", "manifestHash", "requestAuthorityHash", "performanceComparison", "steps"],
};
const record = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const exact = (value, keys) => record(value) &&
  Object.keys(value).length === keys.length &&
  keys.every((key) => Object.hasOwn(value, key));
const compare = (left, right) => left < right ? -1 : left > right ? 1 : 0;
function canonicalPath(value) {
  return typeof value === "string" && value.length > 0 && value.trim() === value &&
    !value.includes("\\") && !value.startsWith("/") && !/^[A-Za-z]:\//u.test(value) &&
    value.split("/").every((part) => part && part !== "." && part !== "..");
}
function targets(value, { empty = false, paths = false } = {}) {
  return Array.isArray(value) && (empty || value.length > 0) &&
    value.every((item) => paths ? canonicalPath(item) : typeof item === "string" &&
      item.length > 0 && item.trim() === item) &&
    value.every((item, index) => index === 0 || compare(value[index - 1], item) < 0);
}
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!record(value)) return value;
  return Object.fromEntries(Object.keys(value).sort(compare)
    .map((key) => [key, stable(value[key])]));
}
function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze); Object.freeze(value);
  }
  return value;
}
const deeplyFrozen = (value) => !(value && typeof value === "object") || (Object.isFrozen(value) &&
  Object.values(value).every(deeplyFrozen));
function inventoryError(value, label) {
  if (!exact(value, ["entries", "sourceHash"]) || !Array.isArray(value.entries) ||
    !value.entries.every((entry) => exact(entry, ["path", "sha256"])))
    return `${label} is malformed.`;
  return getToolcraftVerificationInventoryError({ entries: value.entries,
    label, sourceHash: value.sourceHash });
}
function catalogError(catalog) {
  const validation = validateToolcraftDeliveryCatalog(catalog);
  if (validation.errors.length) return validation.errors.join("\n");
  return same(stable(catalog), stable(validation.catalog))
    ? undefined : "Delivery catalog must already be canonical.";
}
function impactError(impact, catalog, allTests) {
  if (!exact(impact, impactKeys) ||
    !["presentation", "functional", "performance"].includes(impact.kind))
    return "Verification impact is malformed.";
  for (const key of impactKeys.filter((key) => key !== "kind")) {
    if (!targets(impact[key], {
      empty: true, paths: key === "productTestFiles",
    }))
      return `Verification impact ${key} is not canonical.`;
  }
  if (!impact.productTestFiles.every((file) => allTests.includes(file)))
    return "Verification impact contains an unknown product test.";
  const acceptance = catalog.acceptance.filter((row) =>
    impact.acceptanceIds.includes(row.acceptanceId));
  const performance = catalog.performance.filter((row) =>
    impact.performancePathIds.includes(row.pathId));
  if (!impact.browserTestNames.length && !impact.productTestFiles.length &&
    !performance.length) return "Verification impact does not select proof.";
  if (["functional", "performance"].includes(impact.kind) &&
    (!acceptance.length || !impact.browserTestNames.length))
    return "Functional or performance impact does not select acceptance proof.";
  if (acceptance.length !== impact.acceptanceIds.length ||
    !same(acceptance.map((row) => row.testName).sort(compare), impact.browserTestNames) ||
    performance.length !== impact.performancePathIds.length ||
    !same(performance.map((row) => row.testName).sort(compare), impact.performanceTestNames) ||
    !same([...new Set(performance.flatMap((row) => row.passIds))].sort(compare),
      impact.performancePassIds) ||
    (impact.kind === "performance") !== (performance.length > 0))
    return "Verification impact does not match the delivery catalog.";
}
function inputError(inputs) {
  if (!exact(inputs, inputKeys)) return "Delivery planning inputs are malformed.";
  if (!targets(inputs.allProductTestFiles, { paths: true }))
    return "Product test inventory is malformed.";
  const catalogProblem = catalogError(inputs.catalog);
  if (catalogProblem) return catalogProblem;
  if (!exact(inputs.changeSet, [...changeFlags.slice(0, 2), "impact",
    ...changeFlags.slice(2)]) ||
    !changeFlags.every((key) =>
        typeof inputs.changeSet[key] === "boolean"))
    return "Delivery change set is malformed.";
  const currentProblem = inventoryError(inputs.currentInventory, "Current inventory");
  if (currentProblem) return currentProblem;
  if (!exact(inputs.integrity, ["manifestHash", "sourceHash"]) ||
    !hashPattern.test(inputs.integrity.manifestHash) ||
    inputs.integrity.sourceHash !== inputs.currentInventory.sourceHash ||
    !managers.has(inputs.packageManager))
    return "Delivery integrity or package-manager policy is invalid.";
  const previousProblem =
    getToolcraftPreviousPerformanceError(inputs.previousPerformance);
  if (previousProblem) return previousProblem;
  const lifecycleProblem = getToolcraftDeliveryLifecyclePlanningError({
    authority: inputs.authority, hasComparison: inputs.comparisonInventory !== null,
    previous: inputs.previousLifecycle });
  if (lifecycleProblem) return lifecycleProblem;
  if (inputs.comparisonInventory === null) {
    if (inputs.authority !== null || inputs.changeSet.impact !== null ||
      Object.entries(inputs.changeSet).some(([key, value]) => key !== "impact" && value) ||
      inputs.previousPerformance.kind !== "none")
      return "Prototype planning inputs contain comparison-only state.";
    return;
  }
  const comparisonProblem = inventoryError(inputs.comparisonInventory,
    "Comparison inventory");
  if (comparisonProblem) return comparisonProblem;
  const changed = getToolcraftChangedVerificationFiles(
    inputs.comparisonInventory.entries,
    inputs.currentInventory.entries,
  );
  if (!changed.length ||
    inputs.comparisonInventory.sourceHash === inputs.currentInventory.sourceHash)
    return "Delivery planning requires actual changed files.";
  if (!changeFlags.some((key) => inputs.changeSet[key]))
    return "Changed files are not represented by the trusted change set.";
  if (inputs.changeSet.productInputsChanged !== (inputs.changeSet.impact !== null))
    return "Product input changes require explicit verification impact.";
  const impactProblem = inputs.changeSet.impact && impactError(
    inputs.changeSet.impact, inputs.catalog, inputs.allProductTestFiles);
  if (impactProblem) return impactProblem;
  if (inputs.authority !== null) {
    if (!exact(inputs.authority, ["hash", "pathIds", "requestEvidence"]) ||
      !hashPattern.test(inputs.authority.hash) ||
      !targets(inputs.authority.pathIds) ||
      typeof inputs.authority.requestEvidence !== "string" ||
      !inputs.authority.requestEvidence.trim() ||
      !inputs.changeSet.productInputsChanged ||
      inputs.changeSet.impact?.kind !== "performance" ||
      !same(inputs.authority.pathIds, inputs.changeSet.impact.performancePathIds)) {
      return "Performance iteration authority is missing or incompatible.";
    }
  }
}
function fixedSteps(inputs, dependencies) {
  return [
    ...(dependencies ? [{ kind: "dependencies",
      packageManager: inputs.packageManager }] : []),
    { kind: "docs" }, { kind: "code-health" },
    { kind: "product-tests", files: inputs.allProductTestFiles },
    { kind: "build" }, { kind: "browser-functional-smoke",
      smokeTestName: smokeName,
      testNames: inputs.catalog.acceptance.map((row) => row.testName).sort(compare) },
  ];
}
const performanceStep = (impact) => ({ kind: "browser-performance",
  testNames: impact.performanceTestNames, pathIds: impact.performancePathIds,
  passIds: impact.performancePassIds });
function comparisonFor(inputs, impact) {
  const previous = inputs.previousPerformance;
  if (previous.kind === "none" ||
    previous.report.fixtureResolutionMode !== "strict-development" ||
    previous.report.sourceHash !== inputs.comparisonInventory.sourceHash ||
    !same(previous.report.performancePathIds, impact.performancePathIds) ||
    !same(previous.report.performancePassIds, impact.performancePassIds) ||
    !same(previous.report.testNames, impact.performanceTestNames)) {
    return { kind: "none" };
  }
  return { kind: "compatible-targeted-report", report: previous.report, reportHash: previous.reportHash };
}
export function createToolcraftDeliveryPlan(inputs) {
  const problem = inputError(inputs);
  if (problem) throw new Error(problem);
  const baseKind = inputs.comparisonInventory === null ? "prototype" : "ordinary";
  const base = { sourceHash: inputs.currentInventory.sourceHash, lifecycle:
    createToolcraftDeliveryPlanLifecycle({ kind: baseKind,
      previous: inputs.previousLifecycle }),
    manifestHash: inputs.integrity.manifestHash };
  let plan;
  if (inputs.comparisonInventory === null) {
    plan = { kind: "prototype", ...base, steps: fixedSteps(inputs, false) };
  } else {
    const changed = getToolcraftChangedVerificationFiles(
      inputs.comparisonInventory.entries,
      inputs.currentInventory.entries,
    );
    const full = inputs.changeSet.dependencyChanged || inputs.changeSet.platformChanged;
    const impact = inputs.changeSet.impact;
    const steps = full ? fixedSteps(inputs, inputs.changeSet.dependencyChanged) : [];
    if (!full) {
      if (inputs.changeSet.docsChanged) steps.push({ kind: "docs" });
      if (impact) steps.push({ kind: "code-health" });
      if (impact?.productTestFiles.length)
        steps.push({ kind: "product-tests", files: impact.productTestFiles });
      if (impact && (impact.browserTestNames.length ||
        impact.performanceTestNames.length)) steps.push({ kind: "build" });
      if (impact?.browserTestNames.length)
        steps.push({ kind: "browser-functional",
          testNames: impact.browserTestNames });
    }
    if (impact?.performanceTestNames.length) steps.push(performanceStep(impact));
    const common = { comparisonInventory: inputs.comparisonInventory, ...base,
      changedFiles: changed };
    const performanceComparison = inputs.authority === null ? null :
      comparisonFor(inputs, impact);
    plan = inputs.authority === null
      ? { kind: "ordinary", ...common, steps }
      : { kind: "performance-iteration", ...common,
          requestAuthorityHash: inputs.authority.hash,
          lifecycle: createToolcraftDeliveryPlanLifecycle({
            kind: "performance-iteration", performanceComparison,
            previous: inputs.previousLifecycle,
            requestAuthorityHash: inputs.authority.hash }),
          performanceComparison, steps };
  }
  const frozen = deepFreeze(JSON.parse(JSON.stringify(plan)));
  const planProblem = getToolcraftDeliveryPlanError(frozen);
  if (planProblem) throw new Error(planProblem);
  return frozen;
}
function stepError(step) {
  const keys = stepKeys[step?.kind];
  if (!keys || !exact(step, keys)) return "Delivery proof step is malformed.";
  if (step.kind === "dependencies" && !managers.has(step.packageManager))
    return "Dependency proof has an invalid package manager.";
  for (const key of ["files", "testNames", "pathIds", "passIds"]) {
    if (Object.hasOwn(step, key) &&
      !targets(step[key], { paths: key === "files" }))
      return `Delivery proof ${key} must be nonempty, sorted, and unique.`;
  }
  if (step.kind === "browser-functional-smoke" &&
    step.smokeTestName !== smokeName) return "Prototype smoke proof is invalid.";
}
const fullProof = (kinds) => ["docs", "code-health", "product-tests", "build", "browser-functional-smoke"].every((kind) => kinds.includes(kind));
export function getToolcraftDeliveryPlanError(plan) {
  if (!deeplyFrozen(plan)) return "Toolcraft delivery plans must be deeply immutable.";
  const keys = planKeys[plan?.kind];
  if (!keys || !exact(plan, keys) || !hashPattern.test(plan.sourceHash ?? "") ||
    !hashPattern.test(plan.manifestHash ?? "") || !Array.isArray(plan.steps) ||
    !plan.steps.length) return "Toolcraft delivery plan is malformed.";
  const lifecycleProblem = getToolcraftDeliveryPlanLifecycleError(plan);
  if (lifecycleProblem) return lifecycleProblem;
  const kinds = plan.steps.map((step) => step.kind);
  const stepProblem = plan.steps.map(stepError).find(Boolean);
  if (stepProblem) return stepProblem;
  if (new Set(kinds).size !== kinds.length ||
    kinds.some((kind, index) => index &&
      stepOrder.indexOf(kinds[index - 1]) >= stepOrder.indexOf(kind))) {
    return "Delivery proof steps are duplicate or out of canonical order.";
  }
  const buildIndex = kinds.indexOf("build");
  if (kinds.some((kind, index) => kind.startsWith("browser-") &&
    (buildIndex < 0 || buildIndex > index)))
    return "Browser proof requires a preceding build.";
  if (kinds.includes("browser-performance") &&
    !kinds.some((kind) => ["browser-functional", "browser-functional-smoke"].includes(kind)))
    return "Browser performance proof requires functional browser proof.";
  if (plan.kind === "prototype") {
    if (!fullProof(kinds) || kinds.includes("dependencies") ||
      kinds.includes("browser-functional") || kinds.includes("browser-performance"))
      return "Prototype proof is not the fixed complete proof.";
    return;
  }
  const inventoryProblem = inventoryError(plan.comparisonInventory,
    "Plan comparison inventory");
  if (inventoryProblem || !targets(plan.changedFiles, { paths: true }) ||
    plan.comparisonInventory.sourceHash === plan.sourceHash)
    return inventoryProblem ?? "Changed delivery plan provenance is invalid.";
  if ((kinds.includes("dependencies") || kinds.includes("browser-functional-smoke")) &&
    (!fullProof(kinds) || kinds.includes("browser-functional")))
    return "Prototype-equivalent proof cannot be weakened.";
  if (plan.kind === "ordinary") return;
  if (!hashPattern.test(plan.requestAuthorityHash) ||
    !kinds.includes("browser-performance"))
    return "Performance iteration authority or proof is invalid.";
  const comparison = plan.performanceComparison;
  if (exact(comparison, ["kind"]) && comparison.kind === "none") return;
  if (!exact(comparison, ["kind", "report", "reportHash"]) ||
    comparison.kind !== "compatible-targeted-report" ||
    !hashPattern.test(comparison.reportHash) ||
    comparison.report?.version !== 3 ||
    getToolcraftTargetedPerformanceReportError(comparison.report) ||
    createToolcraftTargetedPerformanceReportHash({
      report: comparison.report,
      testTitles: comparison.report.testNames,
    }) !== comparison.reportHash)
    return "Performance comparison is malformed or implicit.";
  const performance = plan.steps.find((step) =>
    step.kind === "browser-performance");
  if (comparison.report.fixtureResolutionMode !== "strict-development" ||
    comparison.report.requestAuthorityHash === plan.requestAuthorityHash ||
    comparison.report.sourceHash !== plan.comparisonInventory.sourceHash ||
    !same(comparison.report.performancePathIds, performance.pathIds) ||
    !same(comparison.report.performancePassIds, performance.passIds) ||
    !same(comparison.report.testNames, performance.testNames))
    return "Previous targeted report is not compatible with the plan.";
}
export function createToolcraftDeliveryPlanHash(plan) {
  const problem = getToolcraftDeliveryPlanError(plan);
  if (problem) throw new Error(problem);
  return createHash("sha256").update(JSON.stringify(stable(plan))).digest("hex");
}
export function getToolcraftDeliveryDiagnosticTier(plan) {
  const problem = getToolcraftDeliveryPlanError(plan);
  if (problem) throw new Error(problem);
  const kinds = new Set(plan.steps.map((step) => step.kind));
  if (plan.kind === "prototype" || kinds.has("dependencies") ||
    kinds.has("browser-functional-smoke")) return 4;
  if (kinds.has("browser-performance")) return 3;
  if (kinds.has("browser-functional")) return 2;
  if (kinds.has("code-health") || kinds.has("product-tests") ||
    kinds.has("build")) return 1;
  return 0;
}
