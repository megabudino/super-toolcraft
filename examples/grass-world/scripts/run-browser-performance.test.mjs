import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import test from "node:test";
import spawn from "cross-spawn";

import { runToolcraftPerformanceCheckpoint } from "./run-browser-performance.mjs";
import {
  TOOLCRAFT_PERFORMANCE_ITERATION_REASON,
  getToolcraftPerformanceBaselineReceiptPath,
  getToolcraftPerformanceReceiptPath,
  validateToolcraftPerformanceReceipt,
  writeToolcraftPerformanceIteration,
} from "./toolcraft-verification-receipt.mjs";
import {
  createIterationVerification,
  createProtectedRunnerFixture,
  createVerificationFixture,
  invokeRunner,
  iterationRunnerFileName,
  projectDir,
  readJson,
  readPlaywrightShimEvents,
  runProtectedRunner,
  runnerPath,
  writePassedCheckpointFixture,
} from "./run-browser-performance-test-helpers.mjs";

test("protected performance runner is importable without exposing preparation bypasses", async (t) => {
  const rootDir = createProtectedRunnerFixture();
  t.after(() => rmSync(rootDir, { force: true, recursive: true }));

  const receipt = await runToolcraftPerformanceCheckpoint({
    projectDir: rootDir,
  });

  assert.equal(receipt.kind, "performance-checkpoint");
  assert.deepEqual(readJson(getToolcraftPerformanceReceiptPath(rootDir)), receipt);
});

test("protected performance runner rejects a concurrent project verification", async (t) => {
  const rootDir = createProtectedRunnerFixture();
  t.after(() => rmSync(rootDir, { force: true, recursive: true }));

  const results = await Promise.allSettled([
    runToolcraftPerformanceCheckpoint({ projectDir: rootDir }),
    runToolcraftPerformanceCheckpoint({ projectDir: rootDir }),
  ]);
  const fulfilled = results.filter((result) => result.status === "fulfilled");
  const rejected = results.filter((result) => result.status === "rejected");

  assert.equal(fulfilled.length, 1);
  assert.equal(rejected.length, 1);
  assert.match(String(rejected[0].reason), /verification run is already active/iu);
});

test("protected performance runner rejects malformed baseline evidence before tools", async (t) => {
  const rootDir = createProtectedRunnerFixture();
  t.after(() => rmSync(rootDir, { force: true, recursive: true }));
  const baselinePath = getToolcraftPerformanceBaselineReceiptPath(rootDir);
  mkdirSync(path.dirname(baselinePath), { recursive: true });
  writeFileSync(baselinePath, "{not-json\n");

  await assert.rejects(
    runToolcraftPerformanceCheckpoint({ projectDir: rootDir }),
    /baseline receipt is malformed JSON/iu,
  );
  assert.equal(
    existsSync(
      path.join(
        rootDir,
        "node_modules/.toolcraft-playwright-test-shim/events.jsonl",
      ),
    ),
    false,
  );
});

test("protected performance runner rejects Playwright filters before launching tools", () => {
  const receiptPath = path.join(
    projectDir,
    ".toolcraft",
    "verification",
    "performance.json",
  );
  const baselinePath = path.join(
    projectDir,
    ".toolcraft",
    "verification",
    "performance-baseline.json",
  );
  const hadReceipt = existsSync(receiptPath);
  const hadBaseline = existsSync(baselinePath);
  const originalReceipt = hadReceipt ? readFileSync(receiptPath) : undefined;
  const originalBaseline = hadBaseline ? readFileSync(baselinePath) : undefined;
  const sentinelReceipt = Buffer.from("protected receipt sentinel\n");
  const sentinelBaseline = Buffer.from("protected baseline sentinel\n");
  mkdirSync(path.dirname(receiptPath), { recursive: true });
  writeFileSync(receiptPath, sentinelReceipt);
  writeFileSync(baselinePath, sentinelBaseline);

  try {
    const result = spawn.sync(
      process.execPath,
      [runnerPath, "e2e/app-performance.spec.ts"],
      {
        cwd: projectDir,
        encoding: "utf8",
        timeout: 5_000,
      },
    );

    assert.equal(result.signal, null);
    assert.notEqual(result.status, 0);
    assert.match(
      `${result.stdout}\n${result.stderr}`,
      /do not accept Playwright arguments.*app-performance\.spec\.ts/iu,
    );
    assert.deepEqual(readFileSync(receiptPath), sentinelReceipt);
    assert.deepEqual(readFileSync(baselinePath), sentinelBaseline);
  } finally {
    if (originalReceipt) writeFileSync(receiptPath, originalReceipt);
    else rmSync(receiptPath, { force: true });
    if (originalBaseline) writeFileSync(baselinePath, originalBaseline);
    else rmSync(baselinePath, { force: true });
  }
});

test("zero-delta docs iteration restores the matching baseline checkpoint as current evidence", async (t) => {
  const rootDir = createVerificationFixture("zero-delta-docs");
  t.after(() => rmSync(rootDir, { force: true, recursive: true }));
  const baseline = await writePassedCheckpointFixture(rootDir);
  mkdirSync(path.join(rootDir, "docs"), { recursive: true });
  writeFileSync(path.join(rootDir, "docs", "notes.md"), "Docs-only iteration.\n");

  const current = await writeToolcraftPerformanceIteration({
    reasonCode: TOOLCRAFT_PERFORMANCE_ITERATION_REASON,
    rootDir,
    verification: createIterationVerification(0),
    verificationTier: 0,
  });

  assert.deepEqual(current, baseline);
  assert.deepEqual(readJson(getToolcraftPerformanceReceiptPath(rootDir)), baseline);
  assert.deepEqual(await validateToolcraftPerformanceReceipt({ rootDir }), []);
});

test("revert-to-baseline restores the protected checkpoint after a prior iteration", async (t) => {
  const rootDir = createVerificationFixture("zero-delta-revert");
  t.after(() => rmSync(rootDir, { force: true, recursive: true }));
  const sourcePath = path.join(rootDir, "src", "app.ts");
  const originalSource = readFileSync(sourcePath, "utf8");
  const baseline = await writePassedCheckpointFixture(rootDir);
  writeFileSync(sourcePath, "export const value = 2;\n");
  await writeToolcraftPerformanceIteration({
    reasonCode: TOOLCRAFT_PERFORMANCE_ITERATION_REASON,
    rootDir,
    verification: createIterationVerification(2),
    verificationTier: 2,
  });

  writeFileSync(sourcePath, originalSource);
  const current = await writeToolcraftPerformanceIteration({
    reasonCode: TOOLCRAFT_PERFORMANCE_ITERATION_REASON,
    rootDir,
    verification: createIterationVerification(2),
    verificationTier: 2,
  });

  assert.deepEqual(current, baseline);
  assert.deepEqual(readJson(getToolcraftPerformanceReceiptPath(rootDir)), baseline);
  assert.deepEqual(await validateToolcraftPerformanceReceipt({ rootDir }), []);
});

test("protected runner preserves the first baseline unless performance work is explicit", async (t) => {
  const rootDir = createProtectedRunnerFixture();
  t.after(() => rmSync(rootDir, { force: true, recursive: true }));
  const baselinePath = getToolcraftPerformanceBaselineReceiptPath(rootDir);
  const currentPath = getToolcraftPerformanceReceiptPath(rootDir);
  runProtectedRunner(rootDir);
  const firstBaseline = readJson(baselinePath);
  assert.deepEqual(readJson(currentPath), firstBaseline);
  assert.match(firstBaseline.performanceEvidence.reportHash, /^[a-f0-9]{64}$/u);
  assert.equal(firstBaseline.performanceEvidence.profileCatalogVersion, 1);
  assert.equal(firstBaseline.performanceEvidence.measurements.length, 3);
  assert.equal(
    readPlaywrightShimEvents(rootDir).findLast(
      (event) => event.event === "completed",
    )?.fixtureSelector,
    "maximum",
  );

  writeFileSync(path.join(rootDir, "src", "app.ts"), "export const value = 2;\n");
  const repeated = invokeRunner(rootDir, "run-browser-performance.mjs");
  assert.notEqual(repeated.status, 0);
  assert.match(
    `${repeated.stdout}\n${repeated.stderr}`,
    /durable performance baseline already exists.*explicit performance work/iu,
  );
  assert.deepEqual(readJson(baselinePath), firstBaseline);

  runProtectedRunner(rootDir, ["--reason=explicit-performance-work"]);
  const secondBaseline = readJson(baselinePath);
  const secondCurrent = readJson(currentPath);

  assert.notEqual(secondBaseline.sourceHash, firstBaseline.sourceHash);
  assert.equal(secondBaseline.checkpointReason, "explicit-performance-work");
  assert.deepEqual(secondCurrent, secondBaseline);
  assert.equal(secondBaseline.kind, "performance-checkpoint");
  assert.deepEqual(await validateToolcraftPerformanceReceipt({ rootDir }), []);
});

test("post-first-working Tier 3 iteration requires and records exact targeted performance tests", async (t) => {
  const rootDir = createProtectedRunnerFixture();
  t.after(() => rmSync(rootDir, { force: true, recursive: true }));
  const baseline = await writePassedCheckpointFixture(rootDir);
  writeFileSync(path.join(rootDir, "src", "app.ts"), "export const value = 2;\n");

  const missingTarget = invokeRunner(rootDir, iterationRunnerFileName, ["--tier=3"]);
  assert.notEqual(missingTarget.status, 0);
  assert.match(
    `${missingTarget.stdout}\n${missingTarget.stderr}`,
    /performance-impacting changes.*targeted canonical browser performance tests/iu,
  );

  const testName = "browser perf: focused renderer path";
  const targeted = invokeRunner(
    rootDir,
    iterationRunnerFileName,
    ["--tier=3", `--performance-test=${testName}`],
    {
      ...process.env,
      TOOLCRAFT_PERFORMANCE_FIXTURE_SELECTOR: "maximum",
    },
  );
  assert.equal(targeted.signal, null);
  assert.equal(targeted.status, 0, `${targeted.stdout}\n${targeted.stderr}`);

  const receipt = readJson(getToolcraftPerformanceReceiptPath(rootDir));
  assert.equal(receipt.kind, "performance-iteration");
  assert.equal(receipt.status, "passed-targeted");
  assert.equal(
    receipt.baselineEvidenceHash,
    baseline.performanceEvidence.reportHash,
  );
  assert.deepEqual(receipt.verification, {
    browserTests: [],
    checks: ["typecheck", "build", "playwright-targeted-performance"],
    performancePassIds: ["composite"],
    performancePathIds: ["performance-path:composite"],
    performanceTests: [testName],
    runner: "protected-iteration",
    unitTests: [],
  });
  assert.equal(
    readPlaywrightShimEvents(rootDir).findLast(
      (event) => event.event === "completed",
    )?.fixtureSelector,
    "development",
  );
  assert.equal(
    readJson(getToolcraftPerformanceBaselineReceiptPath(rootDir)).sourceHash,
    baseline.sourceHash,
  );
  assert.deepEqual(await validateToolcraftPerformanceReceipt({ rootDir }), []);
});

test("targeted iteration rejects zero or ambiguous title matches before receipt", async (t) => {
  const duplicateTitle = "browser perf: duplicated leaf";
  const report = {
    errors: [],
    suites: [{
      title: "app-controls.spec.ts",
      suites: ["suite one", "suite two"].map((title) => ({
        specs: [{ title: duplicateTitle, tags: [], tests: [{ projectName: "" }] }],
        title,
      })),
    }],
  };
  for (const requestedTitle of ["browser perf: missing", duplicateTitle]) {
    const rootDir = createProtectedRunnerFixture(report);
    t.after(() => rmSync(rootDir, { force: true, recursive: true }));
    const baseline = await writePassedCheckpointFixture(rootDir);
    writeFileSync(path.join(rootDir, "src", "app.ts"), "export const value = 2;\n");

    const result = invokeRunner(rootDir, iterationRunnerFileName, [
      "--tier=3",
      `--performance-test=${requestedTitle}`,
    ]);

    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}\n${result.stderr}`, /did not match|matched 2/u);
    assert.deepEqual(readJson(getToolcraftPerformanceReceiptPath(rootDir)), baseline);
  }
});
