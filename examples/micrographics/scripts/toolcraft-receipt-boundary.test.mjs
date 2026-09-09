import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  getToolcraftDeliveryReceiptShapeError,
  validateToolcraftDeliveryReceipt,
} from "./toolcraft-delivery-receipt.mjs";
import { getToolcraftPerformanceReceiptShapeError } from "./toolcraft-performance-receipt-policy.mjs";
import * as performanceReceiptPolicy from "./toolcraft-performance-receipt-policy.mjs";
import { getToolcraftProductDependencyCycleViolations } from "./toolcraft-product-dependency-graph.mjs";
import {
  validateToolcraftPerformanceReceipt,
  validateToolcraftVerificationReceipt,
} from "./toolcraft-verification-receipt.mjs";
import * as verificationReceiptFacade from "./toolcraft-verification-receipt.mjs";
import * as verificationReceiptCore from "./toolcraft-verification-receipt-core.mjs";
import * as receiptFileIo from "./toolcraft-receipt-file-io.mjs";
import * as targetedExecutionAuthority from "./toolcraft-targeted-execution-authority.mjs";
import * as targetedEvidencePolicy from "./toolcraft-targeted-evidence-policy.mjs";
import * as targetedVerificationExecution from "./toolcraft-targeted-verification-execution.mjs";
import * as targetedPerformanceExecution from "./toolcraft-targeted-performance-execution.mjs";
import * as targetedProcessAdapter from "./toolcraft-targeted-process-adapter.mjs";
import * as targetedVerificationRunner from "./toolcraft-targeted-verification-runner.mjs";
import * as targetedVerificationSelection from "./toolcraft-targeted-verification-selection.mjs";
import { createReceiptFixture } from "./toolcraft-verification-receipt-test-helpers.mjs";

const expectedVerificationReceiptExports = [
  "TOOLCRAFT_EXPLICIT_PERFORMANCE_REASON",
  "TOOLCRAFT_PERFORMANCE_ITERATION_REASON",
  "TOOLCRAFT_PERFORMANCE_RECEIPT_VERSION",
  "assertToolcraftVerificationInputsUnchanged",
  "collectToolcraftVerificationInputs",
  "getChangedFiles",
  "getToolcraftPerformanceIterationContext",
  "getToolcraftPerformanceIterationVerificationError",
  "getToolcraftTargetedImpactVerificationError",
  "getToolcraftTargetedVerificationContext",
  "readToolcraftDurablePerformanceBaseline",
  "validateToolcraftCurrentPerformanceImpactInventory",
  "validateToolcraftPerformanceReceipt",
  "validateToolcraftVerificationReceipt",
];

const expectedTargetedAuthorityExports = [
  "executeToolcraftTargetedVerification",
  "finalizeToolcraftTargetedExecutionAuthority",
  "releaseToolcraftTargetedExecutionAuthority",
  "reserveToolcraftTargetedExecutionAuthority",
];

const expectedTargetedRunnerExports = [
  "executeToolcraftTargetedVerification",
];

const expectedPerformanceReceiptPolicyExports = [
  "TOOLCRAFT_EXPLICIT_PERFORMANCE_REASON",
  "TOOLCRAFT_PERFORMANCE_ITERATION_REASON",
  "TOOLCRAFT_PERFORMANCE_RECEIPT_VERSION",
  "getToolcraftPerformanceIterationVerificationError",
  "getToolcraftPerformanceReceiptShapeError",
];

test("receipt production dependency graph is acyclic", async () => {
  const rootDir = path.resolve(import.meta.dirname, "../..");
  const scriptNames = await fs.readdir(import.meta.dirname);
  const entries = scriptNames
    .filter(
      (name) =>
        name.endsWith(".mjs") &&
        !name.endsWith(".test.mjs") &&
        !name.endsWith("-test-helpers.mjs"),
    )
    .map((name) => ({
      absolutePath: path.join(import.meta.dirname, name),
      owner: "product",
      repoPath: `starter/scripts/${name}`,
      role: "production",
    }));
  const violations = getToolcraftProductDependencyCycleViolations({
    entries,
    rootDir,
  }).filter(({ cycle }) =>
    cycle.some((repoPath) => /toolcraft-(?:delivery|verification)-receipt/iu.test(repoPath)),
  );

  assert.deepEqual(violations, []);
});

test("verification receipt facade preserves its public API", () => {
  assert.deepEqual(
    Object.keys(verificationReceiptFacade).sort(),
    expectedVerificationReceiptExports,
  );
  assert.deepEqual(
    Object.keys(verificationReceiptCore).sort(),
    expectedVerificationReceiptExports.filter(
      (name) => name !== "validateToolcraftVerificationReceipt",
    ),
  );
  assert.equal(
    "writeToolcraftPerformanceIteration" in verificationReceiptFacade,
    false,
  );
  assert.equal(
    "writeToolcraftPerformanceIteration" in verificationReceiptCore,
    false,
  );
});

test("receipt file I/O exposes no generic protected receipt writer", () => {
  assert.deepEqual(Object.keys(receiptFileIo), ["readToolcraftReceiptFile"]);
});

test("targeted execution boundary exposes no forgeable authority factory", async () => {
  assert.deepEqual(
    Object.keys(targetedExecutionAuthority).sort(),
    expectedTargetedAuthorityExports,
  );
  assert.deepEqual(
    Object.keys(targetedVerificationRunner).sort(),
    expectedTargetedRunnerExports,
  );
  assert.deepEqual(Object.keys(targetedVerificationExecution), [
    "executeToolcraftTargetedVerificationCore",
  ]);
  assert.deepEqual(Object.keys(targetedPerformanceExecution), [
    "executeToolcraftTargetedPerformanceVerification",
  ]);
  assert.deepEqual(Object.keys(targetedProcessAdapter).sort(), [
    "getToolcraftTargetedBinaryPath",
    "runToolcraftTargetedBinary",
    "runToolcraftTargetedBinaryCapture",
  ]);
  assert.deepEqual(Object.keys(targetedVerificationSelection).sort(), [
    "createToolcraftCanonicalTestEvidence",
    "getToolcraftCanonicalLeafTitles",
    "readToolcraftTargetedVerificationArguments",
    "sortToolcraftPlaywrightSelections",
  ]);

  const checkpointSource = await fs.readFile(
    path.join(import.meta.dirname, "toolcraft-checkpoint-transaction.mjs"),
    "utf8",
  );
  assert.match(
    checkpointSource,
    /from "\.\/toolcraft-targeted-execution-authority\.mjs"/u,
  );
  assert.doesNotMatch(checkpointSource, /targeted-verification-runner/u);

  const runnerSource = await fs.readFile(
    path.join(import.meta.dirname, "toolcraft-targeted-verification-runner.mjs"),
    "utf8",
  );
  assert.doesNotMatch(
    runnerSource,
    /(?:finalize|release|reserve)ToolcraftTargetedExecutionAuthority/u,
  );

  const scriptNames = await fs.readdir(import.meta.dirname);
  const lifecycleConsumers = [];
  for (const scriptName of scriptNames) {
    if (
      !scriptName.endsWith(".mjs") ||
      scriptName.endsWith(".test.mjs") ||
      scriptName.endsWith("-test-helpers.mjs") ||
      scriptName === "toolcraft-targeted-execution-authority.mjs"
    ) {
      continue;
    }
    const source = await fs.readFile(
      path.join(import.meta.dirname, scriptName),
      "utf8",
    );
    if (
      /(?:finalize|release|reserve)ToolcraftTargetedExecutionAuthority/u.test(
        source,
      )
    ) {
      lifecycleConsumers.push(scriptName);
    }
  }
  assert.deepEqual(lifecycleConsumers, ["toolcraft-checkpoint-transaction.mjs"]);
});

test("targeted evidence split preserves receipt policy exports", () => {
  assert.deepEqual(
    Object.keys(performanceReceiptPolicy).sort(),
    expectedPerformanceReceiptPolicyExports,
  );
  assert.deepEqual(Object.keys(targetedEvidencePolicy).sort(), [
    "getLegacyResolvedTargetedEvidenceError",
    "getResolvedTargetedEvidenceError",
  ]);
});

test("receipt validators remain fail-closed without protected authority", async (t) => {
  assert.match(getToolcraftDeliveryReceiptShapeError({}), /malformed/iu);
  assert.match(getToolcraftPerformanceReceiptShapeError({}), /malformed/iu);

  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  assert.match(
    (await validateToolcraftDeliveryReceipt({ rootDir }))[0],
    /delivery receipt is missing/iu,
  );
  assert.match(
    (await validateToolcraftPerformanceReceipt({ rootDir }))[0],
    /performance receipt is missing/iu,
  );
  assert.match(
    (await validateToolcraftVerificationReceipt({ rootDir }))[0],
    /delivery receipt is missing/iu,
  );
});
