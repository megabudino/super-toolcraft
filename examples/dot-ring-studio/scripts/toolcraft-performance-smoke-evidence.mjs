export const TOOLCRAFT_PERFORMANCE_SMOKE_EVIDENCE_VERSION = 1;
export const TOOLCRAFT_PERFORMANCE_SMOKE_TEST_NAME =
  "browser smoke: toolcraft prototype responsiveness";

const evidenceKeys = Object.freeze([
  "completedAt",
  "fixtureSelector",
  "kind",
  "runner",
  "sourceHash",
  "testName",
  "version",
]);

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactEvidenceKeys(evidence) {
  const actualKeys = Object.keys(evidence).sort();
  return (
    actualKeys.length === evidenceKeys.length &&
    actualKeys.every((key, index) => key === evidenceKeys[index])
  );
}

function isCanonicalTimestamp(value) {
  if (typeof value !== "string") return false;
  try {
    return new Date(value).toISOString() === value;
  } catch {
    return false;
  }
}

export function getToolcraftPerformanceSmokeEvidenceError(evidence) {
  if (!isRecord(evidence)) {
    return "Toolcraft performance smoke evidence must be an object.";
  }
  if (!hasExactEvidenceKeys(evidence)) {
    return "Toolcraft performance smoke evidence must contain the exact fields required by the protected contract.";
  }
  if (!isCanonicalTimestamp(evidence.completedAt)) {
    return "Toolcraft performance smoke evidence completedAt must be a canonical ISO timestamp.";
  }
  if (evidence.fixtureSelector !== "development") {
    return "Toolcraft performance smoke evidence fixtureSelector must be development.";
  }
  if (evidence.kind !== "performance-smoke") {
    return "Toolcraft performance smoke evidence kind must be performance-smoke.";
  }
  if (evidence.runner !== "protected-playwright-smoke") {
    return "Toolcraft performance smoke evidence runner must be protected-playwright-smoke.";
  }
  if (
    typeof evidence.sourceHash !== "string" ||
    !/^[a-f0-9]{64}$/u.test(evidence.sourceHash)
  ) {
    return "Toolcraft performance smoke evidence sourceHash must be a lowercase SHA-256 hash.";
  }
  if (evidence.testName !== TOOLCRAFT_PERFORMANCE_SMOKE_TEST_NAME) {
    return `Toolcraft performance smoke evidence testName must be ${TOOLCRAFT_PERFORMANCE_SMOKE_TEST_NAME}.`;
  }
  if (evidence.version !== TOOLCRAFT_PERFORMANCE_SMOKE_EVIDENCE_VERSION) {
    return `Toolcraft performance smoke evidence version must be ${TOOLCRAFT_PERFORMANCE_SMOKE_EVIDENCE_VERSION}.`;
  }
  return undefined;
}
