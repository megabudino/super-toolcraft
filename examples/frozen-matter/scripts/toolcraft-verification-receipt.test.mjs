import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  TOOLCRAFT_PERFORMANCE_ITERATION_REASON,
  TOOLCRAFT_PERFORMANCE_RECEIPT_VERSION,
  collectToolcraftVerificationInputs,
  getToolcraftPerformanceBaselineReceiptPath,
  getToolcraftPerformanceReceiptPath,
  validateToolcraftPerformanceReceipt,
  writeToolcraftPerformanceIteration,
} from "./toolcraft-verification-receipt.mjs";
import * as receiptModule from "./toolcraft-verification-receipt.mjs";
import {
  createIterationVerification,
  createPerformanceEvidenceFixture,
  createReceiptFixture as createFixture,
  writePassedCheckpointFixture,
} from "./toolcraft-verification-receipt-test-helpers.mjs";

test("does not expose a reusable passed-checkpoint writer", () => {
  assert.equal("writeToolcraftPerformanceReceipt" in receiptModule, false);
});

test("rejects verification inputs that change during a protected checkpoint", () => {
  const assertStable = receiptModule.assertToolcraftVerificationInputsUnchanged;
  assert.equal(typeof assertStable, "function");
  assert.doesNotThrow(() =>
    assertStable({
      baseline: { entries: [], sourceHash: "same" },
      current: { entries: [], sourceHash: "same" },
      phase: "after build",
    }),
  );
  assert.throws(
    () =>
      assertStable({
        baseline: { entries: [], sourceHash: "before" },
        current: { entries: [], sourceHash: "after" },
        phase: "after Playwright",
      }),
    /verification inputs changed.*after Playwright.*rerun the active protected verification command/iu,
  );
});

test("requires a structured receipt instead of prose-only performance claims", async (t) => {
  const rootDir = await createFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  await fs.mkdir(path.join(rootDir, "docs", "toolcraft"), { recursive: true });
  await fs.writeFile(
    path.join(rootDir, "docs", "toolcraft", "agent-worklog.md"),
    "- Run: pnpm verify:perf passed\n",
  );

  const errors = await validateToolcraftPerformanceReceipt({ rootDir });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /performance receipt is missing/iu);
});

test("requires the durable protected baseline even when a current checkpoint exists", async (t) => {
  const rootDir = await createFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  await writePassedCheckpointFixture(rootDir, { writeBaseline: false });

  assert.match(
    (await validateToolcraftPerformanceReceipt({ rootDir }))[0],
    /performance baseline receipt is missing/iu,
  );
});

test("refuses to record an iteration without protected targeted evidence", async (t) => {
  const rootDir = await createFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  await writePassedCheckpointFixture(rootDir);

  await assert.rejects(
    writeToolcraftPerformanceIteration({
      reasonCode: TOOLCRAFT_PERFORMANCE_ITERATION_REASON,
      rootDir,
      verificationTier: 2,
    }),
    /targeted iteration verification evidence is malformed/iu,
  );
});

test("accepts a passed receipt only while its source inventory is current", async (t) => {
  const rootDir = await createFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  await writePassedCheckpointFixture(rootDir);

  assert.deepEqual(await validateToolcraftPerformanceReceipt({ rootDir }), []);

  await fs.writeFile(
    path.join(rootDir, "src", "app", "app-schema.ts"),
    'export const schema = { mode: "changed" };\n',
  );
  const staleErrors = await validateToolcraftPerformanceReceipt({ rootDir });
  assert.equal(staleErrors.length, 1);
  assert.match(staleErrors[0], /stale/iu);
});

test("rejects manual agent-browser receipts without automated runner proof", async (t) => {
  const rootDir = await createFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  await writePassedCheckpointFixture(rootDir, { runner: "agent-browser" });

  assert.match(
    (await validateToolcraftPerformanceReceipt({ rootDir }))[0],
    /supported runner/iu,
  );
});

test("rejects a receipt whose file inventory does not produce its source hash", async (t) => {
  const rootDir = await createFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  const inventory = await collectToolcraftVerificationInputs(rootDir);
  const receiptPath = getToolcraftPerformanceReceiptPath(rootDir);
  await fs.mkdir(path.dirname(receiptPath), { recursive: true });
  await fs.writeFile(
    receiptPath,
    `${JSON.stringify(
      {
        checkpointReason: "first-working-version",
        completedAt: new Date().toISOString(),
        files: [],
        kind: "performance-checkpoint",
        performanceEvidence: createPerformanceEvidenceFixture(),
        runner: "protected-playwright",
        sourceHash: inventory.sourceHash,
        status: "passed",
        version: TOOLCRAFT_PERFORMANCE_RECEIPT_VERSION,
      },
      null,
      2,
    )}\n`,
  );

  assert.match(
    (await validateToolcraftPerformanceReceipt({ rootDir }))[0],
    /file inventory.*source hash/iu,
  );
});

test("invalidates a checkpoint when the npm dependency graph changes", async (t) => {
  const rootDir = await createFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  const packageLockPath = path.join(rootDir, "package-lock.json");
  await fs.writeFile(
    packageLockPath,
    JSON.stringify({ lockfileVersion: 3, packages: {} }),
  );
  await writePassedCheckpointFixture(rootDir);

  await fs.writeFile(
    packageLockPath,
    JSON.stringify({
      lockfileVersion: 3,
      packages: { "node_modules/example": { version: "2.0.0" } },
    }),
  );

  assert.match(
    (await validateToolcraftPerformanceReceipt({ rootDir }))[0],
    /stale/iu,
  );
});

test("rejects malformed and non-passed receipts", async (t) => {
  const rootDir = await createFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  const receiptPath = getToolcraftPerformanceReceiptPath(rootDir);
  await fs.mkdir(path.dirname(receiptPath), { recursive: true });
  await fs.writeFile(receiptPath, "not json");
  const malformedErrors = await validateToolcraftPerformanceReceipt({ rootDir });
  assert.equal(malformedErrors.length, 1);
  assert.match(malformedErrors[0], /malformed/iu);

  await writePassedCheckpointFixture(rootDir);
  const failedReceipt = JSON.parse(await fs.readFile(receiptPath, "utf8"));
  failedReceipt.status = "failed";
  await fs.writeFile(receiptPath, `${JSON.stringify(failedReceipt, null, 2)}\n`);
  const failedErrors = await validateToolcraftPerformanceReceipt({ rootDir });
  assert.equal(failedErrors.length, 1);
  assert.match(failedErrors[0], /passed/iu);
});

test("rejects unsupported current and baseline receipt versions", async (t) => {
  const rootDir = await createFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));

  for (const receiptPath of [
    getToolcraftPerformanceReceiptPath(rootDir),
    getToolcraftPerformanceBaselineReceiptPath(rootDir),
  ]) {
    await writePassedCheckpointFixture(rootDir);
    const receipt = JSON.parse(await fs.readFile(receiptPath, "utf8"));
    receipt.version = TOOLCRAFT_PERFORMANCE_RECEIPT_VERSION - 1;
    await fs.writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
    assert.match(
      (await validateToolcraftPerformanceReceipt({ rootDir }))[0],
      /unsupported version/iu,
    );
  }
});

test("permits repeated current post-first-working iterations backed by one durable baseline", async (t) => {
  const rootDir = await createFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  const checkpoint = await writePassedCheckpointFixture(rootDir);
  await fs.writeFile(
    path.join(rootDir, "src", "app", "app-schema.ts"),
    'export const schema = { mode: "feature-one" };\n',
  );
  await writeToolcraftPerformanceIteration({
    reasonCode: TOOLCRAFT_PERFORMANCE_ITERATION_REASON,
    rootDir,
    verification: createIterationVerification(2),
    verificationTier: 2,
  });

  assert.deepEqual(await validateToolcraftPerformanceReceipt({ rootDir }), []);

  await fs.writeFile(
    path.join(rootDir, "src", "app", "app-schema.ts"),
    'export const schema = { mode: "feature-two" };\n',
  );
  const secondIteration = await writeToolcraftPerformanceIteration({
    reasonCode: TOOLCRAFT_PERFORMANCE_ITERATION_REASON,
    rootDir,
    verification: createIterationVerification(2),
    verificationTier: 2,
  });

  assert.equal(secondIteration.kind, "performance-iteration");
  assert.equal(secondIteration.baselineSourceHash, checkpoint.sourceHash);
  assert.equal(
    secondIteration.baselineEvidenceHash,
    checkpoint.performanceEvidence.reportHash,
  );
  assert.deepEqual(await validateToolcraftPerformanceReceipt({ rootDir }), []);
  assert.equal(
    JSON.parse(
      await fs.readFile(getToolcraftPerformanceBaselineReceiptPath(rootDir), "utf8"),
    ).sourceHash,
    checkpoint.sourceHash,
  );
});

test("rejects post-first-working iterations with missing or mismatched baselines", async (t) => {
  const rootDir = await createFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  await writePassedCheckpointFixture(rootDir);
  await fs.writeFile(
    path.join(rootDir, "src", "app", "app-schema.ts"),
    'export const schema = { mode: "changed" };\n',
  );
  await writeToolcraftPerformanceIteration({
    reasonCode: TOOLCRAFT_PERFORMANCE_ITERATION_REASON,
    rootDir,
    verification: createIterationVerification(2),
    verificationTier: 2,
  });

  const baselinePath = getToolcraftPerformanceBaselineReceiptPath(rootDir);
  const baselineSource = await fs.readFile(baselinePath, "utf8");
  await fs.rm(baselinePath);
  assert.match(
    (await validateToolcraftPerformanceReceipt({ rootDir }))[0],
    /performance baseline receipt is missing/iu,
  );

  await fs.writeFile(baselinePath, baselineSource);
  const receiptPath = getToolcraftPerformanceReceiptPath(rootDir);
  const iteration = JSON.parse(await fs.readFile(receiptPath, "utf8"));
  iteration.baselineSourceHash = "0".repeat(64);
  await fs.writeFile(receiptPath, `${JSON.stringify(iteration, null, 2)}\n`);
  assert.match(
    (await validateToolcraftPerformanceReceipt({ rootDir }))[0],
    /does not match the durable baseline/iu,
  );

  const baseline = JSON.parse(baselineSource);
  iteration.baselineSourceHash = baseline.sourceHash;
  iteration.baselineEvidenceHash = "0".repeat(64);
  await fs.writeFile(receiptPath, `${JSON.stringify(iteration, null, 2)}\n`);
  assert.match(
    (await validateToolcraftPerformanceReceipt({ rootDir }))[0],
    /does not match the durable baseline evidence/iu,
  );
});

test("invalidates a post-first-working iteration after later source changes", async (t) => {
  const rootDir = await createFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  await writePassedCheckpointFixture(rootDir);
  await fs.writeFile(
    path.join(rootDir, "src", "app", "app-schema.ts"),
    'export const schema = { mode: "iteration" };\n',
  );
  await writeToolcraftPerformanceIteration({
    reasonCode: TOOLCRAFT_PERFORMANCE_ITERATION_REASON,
    rootDir,
    verification: createIterationVerification(2),
    verificationTier: 2,
  });

  await fs.writeFile(
    path.join(rootDir, "e2e", "app-performance.spec.ts"),
    'export const scenario = "changed-after-iteration";\n',
  );
  assert.match(
    (await validateToolcraftPerformanceReceipt({ rootDir }))[0],
    /stale/iu,
  );
});
