import assert from "node:assert/strict";
import test from "node:test";

import {
  TOOLCRAFT_PERFORMANCE_SMOKE_EVIDENCE_VERSION,
  TOOLCRAFT_PERFORMANCE_SMOKE_TEST_NAME,
  getToolcraftPerformanceSmokeEvidenceError,
} from "./toolcraft-performance-smoke-evidence.mjs";

function createEvidence(overrides = {}) {
  return {
    completedAt: "2026-07-20T00:00:00.000Z",
    fixtureSelector: "development",
    kind: "performance-smoke",
    runner: "protected-playwright-smoke",
    sourceHash: "a".repeat(64),
    testName: "browser smoke: toolcraft prototype responsiveness",
    version: 1,
    ...overrides,
  };
}

test("accepts only the protected prototype performance smoke evidence shape", () => {
  assert.equal(TOOLCRAFT_PERFORMANCE_SMOKE_EVIDENCE_VERSION, 1);
  assert.equal(
    TOOLCRAFT_PERFORMANCE_SMOKE_TEST_NAME,
    "browser smoke: toolcraft prototype responsiveness",
  );
  assert.equal(
    getToolcraftPerformanceSmokeEvidenceError(createEvidence()),
    undefined,
  );
});

test("rejects unsupported protected smoke authority fields", () => {
  for (const [field, value] of [
    ["fixtureSelector", "maximum"],
    ["kind", "performance-checkpoint"],
    ["runner", "protected-playwright"],
    ["testName", "browser smoke: another test"],
    ["version", 2],
  ]) {
    assert.match(
      getToolcraftPerformanceSmokeEvidenceError(
        createEvidence({ [field]: value }),
      ),
      new RegExp(field, "iu"),
    );
  }
});

test("rejects malformed source hashes and completion timestamps", () => {
  for (const sourceHash of [undefined, "A".repeat(64), "a".repeat(63)]) {
    assert.match(
      getToolcraftPerformanceSmokeEvidenceError(createEvidence({ sourceHash })),
      /sourceHash/iu,
    );
  }
  for (const completedAt of [
    undefined,
    "not-a-date",
    "2026-07-20T00:00:00Z",
  ]) {
    assert.match(
      getToolcraftPerformanceSmokeEvidenceError(createEvidence({ completedAt })),
      /completedAt/iu,
    );
  }
});

test("rejects missing and unknown evidence fields", () => {
  const missingField = createEvidence();
  delete missingField.testName;
  assert.match(
    getToolcraftPerformanceSmokeEvidenceError(missingField),
    /exact fields/iu,
  );
  assert.match(
    getToolcraftPerformanceSmokeEvidenceError(
      createEvidence({ productClaim: "passed" }),
    ),
    /exact fields/iu,
  );
  assert.match(
    getToolcraftPerformanceSmokeEvidenceError(null),
    /object/iu,
  );
});
