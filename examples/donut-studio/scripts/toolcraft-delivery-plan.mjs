import { createHash } from "node:crypto";
import {
  validateToolcraftDeliveryCatalog,
} from "./playwright-test-title-selection.mjs";
import {
  getToolcraftDeliveryLifecyclePlanningError,
  getToolcraftDeliveryPlanLifecycleError,
  getToolcraftPreviousPerformanceError,
} from "./toolcraft-delivery-lifecycle-state.mjs";
import {
  constructToolcraftDeliveryPlan,
} from "./toolcraft-delivery-plan-construction.mjs";
import {
  getToolcraftPerformanceRequestAuthorityError,
} from "./toolcraft-performance-authority-policy.mjs";
import { createToolcraftTargetedPerformanceComparisonHash, getToolcraftTargetedPerformanceReportError } from "./toolcraft-targeted-performance-report.mjs";
import { getToolcraftChangedVerificationFiles, getToolcraftVerificationInventoryError } from "./toolcraft-verification-inventory.mjs";
export const TOOLCRAFT_DELIVERY_PLAN_VERSION = 3;
const hashPattern = /^[a-f0-9]{64}$/u;
const managers = new Set(["npm", "pnpm", "yarn", "bun"]);
const stepOrder = ["dependencies", "docs", "code-health", "product-tests", "build", "browser-functional", "browser-performance"];
const changeFlags = ["dependencyChanged", "docsChanged", "platformChanged", "productInputsChanged"];
const inputKeys = ["allProductTestFiles", "authority", "catalog", "changeSet",
  "comparisonInventory", "currentInventory", "integrity", "packageManager", "previousLifecycle", "previousPerformance"];
const impactKeys = ["acceptanceIds", "browserTestNames", "performanceCandidates", "productTestFiles"];
const performanceCandidateKeys = ["passIds", "pathIds", "testNames"];
const stepKeys = {
  dependencies: ["kind", "packageManager"], docs: ["kind"],
  "code-health": ["kind"], "product-tests": ["kind", "files"], build: ["kind"],
  "browser-functional": ["kind", "testNames"], "browser-performance": ["kind", "testNames", "pathIds", "passIds"],
};
const planKeys = {
  functional: ["basis", "kind", "lifecycle", "sourceHash", "manifestHash", "steps"],
  "performance-iteration": ["basis", "kind", "sourceHash", "lifecycle", "manifestHash", "requestAuthorityHash", "performanceComparison", "steps"],
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
  if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.values(value).forEach(deepFreeze); Object.freeze(value); }
  return value;
}
const deeplyFrozen = (value) => !(value && typeof value === "object") || (Object.isFrozen(value) &&
  Object.values(value).every(deeplyFrozen));
function inventoryError(value, label) {
  if (!exact(value, ["entries", "sourceHash"]) || !Array.isArray(value.entries) ||
    !value.entries.every((entry) => exact(entry, ["path", "sha256"])))
    return `${label} is malformed.`;
  return getToolcraftVerificationInventoryError(
    { entries: value.entries, label, sourceHash: value.sourceHash });
}
function impactError(impact, catalog, allTests) {
  if (!exact(impact, impactKeys) ||
    !exact(impact.performanceCandidates, performanceCandidateKeys))
    return "Verification impact is malformed.";
  for (const key of ["acceptanceIds", "browserTestNames", "productTestFiles"])
    if (!targets(impact[key], { empty: true, paths: key === "productTestFiles" }))
      return `Verification impact ${key} is not canonical.`;
  for (const key of performanceCandidateKeys)
    if (!targets(impact.performanceCandidates[key], { empty: true }))
      return `Verification impact performanceCandidates.${key} is not canonical.`;
  if (!impact.productTestFiles.every((file) => allTests.includes(file)))
    return "Verification impact contains an unknown product test.";
  const acceptance = catalog.acceptance.filter((row) =>
    impact.acceptanceIds.includes(row.acceptanceId));
  const performance = catalog.performance.filter((row) =>
    impact.performanceCandidates.pathIds.includes(row.pathId));
  if (!impact.browserTestNames.length && !impact.productTestFiles.length)
    return "Verification impact does not select functional proof.";
  if (acceptance.length !== impact.acceptanceIds.length ||
    !same(acceptance.map((row) => row.testName).sort(compare), impact.browserTestNames) ||
    performance.length !== impact.performanceCandidates.pathIds.length ||
    !same(performance.map((row) => row.testName).sort(compare),
      impact.performanceCandidates.testNames) ||
    !same([...new Set(performance.flatMap((row) => row.passIds))].sort(compare),
      impact.performanceCandidates.passIds))
    return "Verification impact does not match the delivery catalog.";
}
function authorityError(authority, catalog) {
  const authorityProblem =
    getToolcraftPerformanceRequestAuthorityError(authority);
  if (authorityProblem) return authorityProblem;
  const knownPathIds = catalog.performance.map(({ pathId }) => pathId);
  if (!authority.pathIds.every((pathId) => knownPathIds.includes(pathId)))
    return "Performance iteration authority selects an unknown path.";
}
function inputError(inputs) {
  if (!exact(inputs, inputKeys)) return "Delivery planning inputs are malformed.";
  if (!targets(inputs.allProductTestFiles, { paths: true }))
    return "Product test inventory is malformed.";
  const checkedCatalog = validateToolcraftDeliveryCatalog(inputs.catalog);
  if (checkedCatalog.errors.length) return checkedCatalog.errors.join("\n");
  if (!same(stable(inputs.catalog), stable(checkedCatalog.catalog)))
    return "Delivery catalog must already be canonical.";
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
  const previousProblem = getToolcraftPreviousPerformanceError(inputs.previousPerformance);
  if (previousProblem) return previousProblem;
  const lifecycleProblem = getToolcraftDeliveryLifecyclePlanningError({
    authority: inputs.authority, hasComparison: inputs.comparisonInventory !== null,
    previous: inputs.previousLifecycle });
  if (lifecycleProblem) return lifecycleProblem;
  const authorityProblem = inputs.authority && authorityError(inputs.authority, inputs.catalog);
  if (authorityProblem) return authorityProblem;
  if (inputs.comparisonInventory === null) {
    if (inputs.authority !== null)
      return "Toolcraft first delivery must be functional; performance authority requires a previous successful delivery.";
    if (inputs.changeSet.impact !== null ||
      Object.entries(inputs.changeSet).some(([key, value]) => key !== "impact" && value) ||
      inputs.previousPerformance.kind !== "none")
      return "Initial planning inputs contain changed-delivery state.";
    return;
  }
  const comparisonProblem = inventoryError(inputs.comparisonInventory, "Comparison inventory");
  if (comparisonProblem) return comparisonProblem;
  const changed = getToolcraftChangedVerificationFiles(
    inputs.comparisonInventory.entries, inputs.currentInventory.entries);
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
  if (inputs.authority !== null &&
    (!inputs.changeSet.productInputsChanged ||
      !inputs.authority.pathIds.every((pathId) =>
        inputs.changeSet.impact?.performanceCandidates.pathIds.includes(pathId)
      )))
    return "Performance iteration authority is missing or incompatible.";
}
function stepError(step) {
  const keys = stepKeys[step?.kind];
  if (!keys || !exact(step, keys)) return "Delivery proof step is malformed.";
  if (step.kind === "dependencies" && !managers.has(step.packageManager))
    return "Dependency proof has an invalid package manager.";
  const badTarget = ["files", "testNames", "pathIds", "passIds"].find((key) =>
    Object.hasOwn(step, key) && !targets(step[key], { paths: key === "files" }));
  if (badTarget)
    return `Delivery proof ${badTarget} must be nonempty, sorted, and unique.`;
}
const fullProof = (kinds) => ["docs", "code-health", "product-tests", "build", "browser-functional"].every((kind) => kinds.includes(kind));
export function getToolcraftDeliveryPlanError(plan) {
  if (!deeplyFrozen(plan)) return "Toolcraft delivery plans must be deeply immutable.";
  const keys = planKeys[plan?.kind];
  if (!keys || !exact(plan, keys) || !hashPattern.test(plan.sourceHash ?? "") ||
    !hashPattern.test(plan.manifestHash ?? "") || !Array.isArray(plan.steps) ||
    !plan.steps.length) return "Toolcraft delivery plan is malformed.";
  if (!(exact(plan.basis, ["kind"]) && plan.basis.kind === "initial")) {
    if (!exact(plan.basis, ["changedFiles", "comparisonInventory", "kind"]) ||
      plan.basis.kind !== "changed") return "Delivery plan basis is malformed.";
    const basisProblem = inventoryError(
      plan.basis.comparisonInventory, "Plan comparison inventory");
    if (basisProblem || !targets(plan.basis.changedFiles, { paths: true }) ||
      plan.basis.comparisonInventory.sourceHash === plan.sourceHash)
      return basisProblem ?? "Changed delivery plan provenance is invalid.";
  }
  if (plan.kind === "performance-iteration" &&
    plan.basis.kind !== "changed")
    return "Performance iteration requires a previous successful delivery.";
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
    !kinds.includes("browser-functional"))
    return "Browser performance proof requires functional browser proof.";
  if (plan.basis.kind === "initial" &&
    (!fullProof(kinds) || kinds.includes("dependencies")))
    return "Initial delivery proof is not the fixed complete functional proof.";
  if (plan.basis.kind === "changed" && kinds.includes("dependencies") &&
    !fullProof(kinds))
    return "Dependency delivery proof cannot be weakened.";
  if (plan.kind === "functional")
    return kinds.includes("browser-performance")
      ? "Functional delivery plans cannot include browser performance proof."
      : undefined;
  if (!hashPattern.test(plan.requestAuthorityHash) ||
    !kinds.includes("browser-performance"))
    return "Performance iteration authority or proof is invalid.";
  const comparison = plan.performanceComparison;
  if (exact(comparison, ["kind"]) && comparison.kind === "none") return;
  if (!exact(comparison, ["comparisonHash", "kind", "report"]) ||
    comparison.kind !== "compatible-targeted-report" ||
    !hashPattern.test(comparison.comparisonHash) ||
    comparison.report?.version !== 3 ||
    getToolcraftTargetedPerformanceReportError(comparison.report) ||
    createToolcraftTargetedPerformanceComparisonHash(
      comparison.report,
    ) !== comparison.comparisonHash)
    return "Performance comparison is malformed or implicit.";
  const performance = plan.steps.find((step) => step.kind === "browser-performance");
  if (comparison.report.fixtureResolutionMode !== "strict-development" ||
    comparison.report.requestAuthorityHash === plan.requestAuthorityHash ||
    comparison.report.sourceHash !== plan.basis.comparisonInventory.sourceHash ||
    !same(comparison.report.performancePathIds, performance.pathIds) ||
    !same(comparison.report.performancePassIds, performance.passIds) ||
    !same(comparison.report.testNames, performance.testNames))
    return "Previous targeted report is not compatible with the plan.";
}
export function createToolcraftDeliveryPlan(inputs) {
  const problem = inputError(inputs);
  if (problem) throw new Error(problem);
  const plan = constructToolcraftDeliveryPlan(inputs);
  const frozen = deepFreeze(JSON.parse(JSON.stringify(plan)));
  const planProblem = getToolcraftDeliveryPlanError(frozen);
  if (planProblem) throw new Error(planProblem);
  return frozen;
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
  if (plan.basis.kind === "initial") return 4;
  if (plan.kind === "performance-iteration") return 3;
  if (kinds.has("dependencies")) return 4;
  if (kinds.has("browser-functional")) return 2;
  if (kinds.has("code-health") || kinds.has("product-tests") ||
    kinds.has("build")) return 1;
  return 0;
}
