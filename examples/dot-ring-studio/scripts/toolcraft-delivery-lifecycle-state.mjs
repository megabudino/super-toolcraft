import {
  createToolcraftTargetedPerformanceReportHash,
  getToolcraftTargetedPerformanceReportError,
} from "./toolcraft-targeted-performance-report.mjs";

const lifecycleKeys = Object.freeze([
  "consumedPerformanceRequestAuthorityHashes",
  "performanceEscalationOffered",
]);
const hashPattern = /^[a-f0-9]{64}$/u;

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value, keys) {
  return isRecord(value) &&
    Object.keys(value).length === keys.length &&
    keys.every((key) => Object.hasOwn(value, key));
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

export function getToolcraftDeliveryLifecycleStateError(value) {
  const hashes = value?.consumedPerformanceRequestAuthorityHashes;
  if (
    !isRecord(value) ||
    Object.keys(value).length !== lifecycleKeys.length ||
    !lifecycleKeys.every((key) => Object.hasOwn(value, key)) ||
    !Array.isArray(hashes) ||
    !hashes.every((hash, index) =>
      hashPattern.test(hash) &&
      (index === 0 || hashes[index - 1] < hash)
    ) ||
    typeof value.performanceEscalationOffered !== "boolean"
  ) {
    return "Toolcraft delivery lifecycle state is malformed or noncanonical.";
  }
}

export function getToolcraftPreviousPerformanceError(value) {
  if (!isRecord(value) || !["none", "ordinary-targeted-report",
    "performance-iteration-report"].includes(value.kind))
    return "Previous performance evidence is malformed.";
  const keys = value.kind === "none" ? ["kind"] :
    value.kind === "ordinary-targeted-report" ? ["kind", "report", "reportHash"] :
      ["kind", "requestAuthorityHash", "report", "reportHash"];
  if (!hasExactKeys(value, keys))
    return "Previous performance evidence is malformed.";
  if (value.kind === "none") return;
  if (!hashPattern.test(value.reportHash) || value.report?.version !== 3 ||
    getToolcraftTargetedPerformanceReportError(value.report) ||
    createToolcraftTargetedPerformanceReportHash({
      report: value.report,
      testTitles: value.report.testNames,
    }) !== value.reportHash)
    return "Previous targeted performance report is malformed.";
  if (value.kind === "ordinary-targeted-report" &&
    value.report.requestAuthorityHash !== null)
    return "Ordinary targeted performance evidence has request authority.";
  if (value.kind === "performance-iteration-report" &&
    (!hashPattern.test(value.requestAuthorityHash) ||
      value.report.requestAuthorityHash !== value.requestAuthorityHash))
    return "Performance iteration report authority does not match.";
}

export const EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE = deepFreeze({
  consumedPerformanceRequestAuthorityHashes: [],
  performanceEscalationOffered: false,
});

export function createToolcraftDeliveryLifecycleState({
  performanceEscalationReached = false,
  previous = EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE,
  requestAuthorityHash = null,
} = {}) {
  const previousError = getToolcraftDeliveryLifecycleStateError(previous);
  if (
    previousError ||
    typeof performanceEscalationReached !== "boolean" ||
    (requestAuthorityHash !== null && !hashPattern.test(requestAuthorityHash))
  ) {
    throw new Error(
      previousError ??
        "Toolcraft delivery lifecycle state transition is malformed.",
    );
  }
  const hashes = requestAuthorityHash === null
    ? [...previous.consumedPerformanceRequestAuthorityHashes]
    : [
        ...previous.consumedPerformanceRequestAuthorityHashes,
        requestAuthorityHash,
      ].sort();
  return deepFreeze({
    consumedPerformanceRequestAuthorityHashes: [...new Set(hashes)],
    performanceEscalationOffered:
      previous.performanceEscalationOffered ||
      performanceEscalationReached,
  });
}

export function getToolcraftDeliveryLifecyclePlanningError({
  authority,
  hasComparison,
  previous,
}) {
  const error = getToolcraftDeliveryLifecycleStateError(previous);
  if (error) return error;
  if (
    !hasComparison &&
    JSON.stringify(previous) !==
      JSON.stringify(EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE)
  ) {
    return "Prototype planning inputs contain comparison-only lifecycle state.";
  }
  if (
    authority &&
    previous.consumedPerformanceRequestAuthorityHashes.includes(authority.hash)
  ) {
    return "Performance iteration authority has already been used.";
  }
}

export function createToolcraftDeliveryPlanLifecycle({
  kind,
  performanceComparison = null,
  previous,
  requestAuthorityHash = null,
}) {
  const performanceIteration = kind === "performance-iteration";
  if (
    !["prototype", "ordinary", "performance-iteration"].includes(kind) ||
    performanceIteration !== (requestAuthorityHash !== null) ||
    (!performanceIteration && performanceComparison !== null)
  ) {
    throw new Error(
      "Toolcraft delivery lifecycle transition is malformed.",
    );
  }
  return createToolcraftDeliveryLifecycleState({
    performanceEscalationReached:
      performanceIteration &&
      performanceComparison?.kind === "compatible-targeted-report",
    previous,
    requestAuthorityHash,
  });
}

export function getToolcraftDeliveryPlanLifecycleError(plan) {
  const error = getToolcraftDeliveryLifecycleStateError(plan?.lifecycle);
  if (error) return error;
  if (
    plan.kind === "prototype" &&
    JSON.stringify(plan.lifecycle) !==
      JSON.stringify(EMPTY_TOOLCRAFT_DELIVERY_LIFECYCLE_STATE)
  ) {
    return "Prototype lifecycle state must be empty.";
  }
  if (
    plan.kind === "performance-iteration" &&
    (!plan.lifecycle.consumedPerformanceRequestAuthorityHashes.includes(
      plan.requestAuthorityHash,
    ) ||
      (plan.performanceComparison?.kind === "compatible-targeted-report" &&
        !plan.lifecycle.performanceEscalationOffered))
  ) {
    return "Performance iteration lifecycle state is invalid.";
  }
}

export function createToolcraftDeliveryAnchorState({
  currentLifecycle = null,
  files,
  performance,
  sourceHash,
}) {
  if (currentLifecycle !== null) {
    const error = getToolcraftDeliveryLifecycleStateError(currentLifecycle);
    if (error) throw new Error(error);
  }
  const legacyHash =
    currentLifecycle === null &&
    performance?.kind === "performance-iteration-report"
      ? performance.requestAuthorityHash
      : null;
  return deepFreeze({
    files,
    lifecycle: currentLifecycle ??
      createToolcraftDeliveryLifecycleState({
        performanceEscalationReached: legacyHash !== null,
        requestAuthorityHash: legacyHash,
      }),
    performance,
    sourceHash,
  });
}
