import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import { runToolcraftDeliveryVerification } from "./run-delivery-verification.mjs";
import { runToolcraftFullPerformanceCertification } from "./run-browser-performance.mjs";
import {
  assertNoPerformanceAuthority,
  createDeliveryFixture,
  getCompletedFixtureEvents,
  installConditionalPlaywrightFailure,
  readJson,
  removeDeliveryFixture,
} from "./run-delivery-verification-test-helpers.mjs";
import { writePerformanceIterationWorklog } from "./run-browser-performance-test-helpers.mjs";
import { validateToolcraftDeliveryReceipt } from "./toolcraft-delivery-receipt.mjs";
import { getToolcraftCheckpointBundlePath } from "./toolcraft-checkpoint-paths.mjs";
import { commitToolcraftDeliveryCheckpoint } from "./toolcraft-checkpoint-transaction.mjs";
import {
  iterationArguments,
  performanceTestName,
  updateRenderer,
} from "./toolcraft-delivery-performance-iteration-test-helpers.mjs";
import { writePassedCheckpointFixture } from "./toolcraft-verification-receipt-test-helpers.mjs";

test("performance complaint records one baseline-free targeted iteration", async (t) => {
  const rootDir = createDeliveryFixture();
  t.after(() => removeDeliveryFixture(rootDir));
  const prototype = await runToolcraftDeliveryVerification({
    projectDir: rootDir,
  });
  updateRenderer(rootDir, 2);

  const receipt = await runToolcraftDeliveryVerification({
    arguments_: iterationArguments,
    projectDir: rootDir,
  });

  assert.equal(receipt.mode, "performance-iteration");
  assert.equal(receipt.comparisonSourceHash, prototype.sourceHash);
  assert.equal("baselineSourceHash" in receipt, false);
  assert.deepEqual(receipt.verification.performanceTests, [
    performanceTestName,
  ]);
  assert.deepEqual(receipt.verification.performanceTestTitles, [
    `app-controls.spec.ts › ${performanceTestName}`,
  ]);
  assert.deepEqual(receipt.verification.performancePassIds, ["composite"]);
  assert.deepEqual(receipt.verification.performancePathIds, [
    "performance-path:composite",
  ]);
  assert.equal(getCompletedFixtureEvents(rootDir, "maximum").length, 0);
  assert.equal(getCompletedFixtureEvents(rootDir, "development").length, 2);
  assert.equal(
    receipt.verification.targetedPerformanceReport.sourceHash,
    receipt.sourceHash,
  );
  assert.match(
    receipt.verification.targetedPerformanceReportHash,
    /^[a-f0-9]{64}$/u,
  );
  assertNoPerformanceAuthority(rootDir);
  assert.deepEqual(await validateToolcraftDeliveryReceipt({ rootDir }), []);
});

test("performance iteration rejects unchanged verification inputs", async (t) => {
  const rootDir = createDeliveryFixture();
  t.after(() => removeDeliveryFixture(rootDir));
  await runToolcraftDeliveryVerification({ projectDir: rootDir });
  const bundlePath = getToolcraftCheckpointBundlePath(rootDir);
  const authorityBefore = readFileSync(bundlePath, "utf8");
  const developmentRunsBefore = getCompletedFixtureEvents(
    rootDir,
    "development",
  ).length;

  await assert.rejects(
    runToolcraftDeliveryVerification({
      arguments_: iterationArguments,
      projectDir: rootDir,
    }),
    /performance iteration requires changed verification inputs/iu,
  );

  assert.equal(readFileSync(bundlePath, "utf8"), authorityBefore);
  assert.equal(
    getCompletedFixtureEvents(rootDir, "development").length,
    developmentRunsBefore,
  );
});

test("repeated performance complaint compares with the latest successful iteration", async (t) => {
  const rootDir = createDeliveryFixture();
  t.after(() => removeDeliveryFixture(rootDir));
  const logMessages = [];
  t.mock.method(console, "log", (message) => {
    logMessages.push(String(message));
  });
  await runToolcraftDeliveryVerification({ projectDir: rootDir });
  updateRenderer(rootDir, 2);
  const first = await runToolcraftDeliveryVerification({
    arguments_: iterationArguments,
    projectDir: rootDir,
  });
  assert.equal(
    logMessages.some((message) =>
      message.includes("Offer the user a slower complete performance audit"),
    ),
    false,
  );
  updateRenderer(rootDir, 3);

  const second = await runToolcraftDeliveryVerification({
    arguments_: iterationArguments,
    projectDir: rootDir,
  });

  assert.equal(second.mode, "performance-iteration");
  assert.equal(second.comparisonSourceHash, first.sourceHash);
  assert.notEqual(second.sourceHash, first.sourceHash);
  assert.equal(second.verification.performanceComparison.status, "compared");
  assert.equal(
    second.verification.performanceComparison.previousReportHash,
    first.verification.targetedPerformanceReportHash,
  );
  assert.equal(
    second.verification.performanceComparison.measurements.length,
    first.verification.targetedPerformanceReport.measurements.length,
  );
  assert.equal(getCompletedFixtureEvents(rootDir, "maximum").length, 0);
  assert.equal(getCompletedFixtureEvents(rootDir, "development").length, 3);
  assert.equal(
    logMessages.some((message) =>
      message.includes("Offer the user a slower complete performance audit"),
    ),
    true,
  );
  assert.equal(
    logMessages.some((message) =>
      message.includes(
        "Do not run pnpm verify:perf without explicit user consent",
      ),
    ),
    true,
  );
  assertNoPerformanceAuthority(rootDir);
});

test("one recorded complaint cannot authorize a second performance iteration", async (t) => {
  const rootDir = createDeliveryFixture();
  t.after(() => removeDeliveryFixture(rootDir));
  await runToolcraftDeliveryVerification({ projectDir: rootDir });
  updateRenderer(rootDir, 2);
  await runToolcraftDeliveryVerification({
    arguments_: iterationArguments,
    projectDir: rootDir,
  });
  const bundlePath = getToolcraftCheckpointBundlePath(rootDir);
  const checkpointBefore = readFileSync(bundlePath, "utf8");
  const worklogPath = path.join(
    rootDir,
    "docs",
    "toolcraft",
    "agent-worklog.md",
  );
  const firstComplaint = readFileSync(worklogPath, "utf8");
  updateRenderer(rootDir, 3);
  writeFileSync(worklogPath, firstComplaint);
  const runsBefore = getCompletedFixtureEvents(rootDir, "development").length;

  await assert.rejects(
    runToolcraftDeliveryVerification({
      arguments_: iterationArguments,
      projectDir: rootDir,
    }),
    /request already produced one successful performance iteration/iu,
  );

  assert.equal(readFileSync(bundlePath, "utf8"), checkpointBefore);
  assert.equal(
    getCompletedFixtureEvents(rootDir, "development").length,
    runsBefore,
  );
});

test("performance iteration requires a successful prototype anchor", async (t) => {
  const rootDir = createDeliveryFixture();
  t.after(() => removeDeliveryFixture(rootDir));

  await assert.rejects(
    runToolcraftDeliveryVerification({
      arguments_: iterationArguments,
      projectDir: rootDir,
    }),
    /requires a previous successful delivery.*run pnpm verify:delivery without --reason.*prototype/iu,
  );
  assert.equal(existsSync(getToolcraftCheckpointBundlePath(rootDir)), false);
});
test("performance iteration requires an exact performance selector and adequate tier", async (t) => {
  const rootDir = createDeliveryFixture();
  t.after(() => removeDeliveryFixture(rootDir));
  await runToolcraftDeliveryVerification({ projectDir: rootDir });
  const bundlePath = getToolcraftCheckpointBundlePath(rootDir);
  updateRenderer(rootDir, 2);
  const authorityBefore = readFileSync(bundlePath, "utf8");

  await assert.rejects(
    runToolcraftDeliveryVerification({
      arguments_: ["--reason=performance-iteration", "--tier=3"],
      projectDir: rootDir,
    }),
    /requires at least one exact --performance-test selector/iu,
  );
  writePerformanceIterationWorklog(
    rootDir,
    "tier-2",
    performanceTestName,
    2,
  );
  await assert.rejects(
    runToolcraftDeliveryVerification({
      arguments_: [
        "--reason=performance-iteration",
        "--tier=2",
        `--performance-test=${performanceTestName}`,
      ],
      projectDir: rootDir,
    }),
    /requires verification tier 3 or higher/iu,
  );

  assert.equal(readFileSync(bundlePath, "utf8"), authorityBefore);
  assert.equal(getCompletedFixtureEvents(rootDir, "maximum").length, 0);
  assertNoPerformanceAuthority(rootDir);
});

test("targeted performance failure preserves prior checkpoint authority and scope", async (t) => {
  const rootDir = createDeliveryFixture();
  t.after(() => removeDeliveryFixture(rootDir));
  await runToolcraftDeliveryVerification({ projectDir: rootDir });
  const bundlePath = getToolcraftCheckpointBundlePath(rootDir);
  const authorityBefore = readFileSync(bundlePath, "utf8");
  updateRenderer(rootDir, 2);
  installConditionalPlaywrightFailure(rootDir, 'args.includes("--grep")');

  await assert.rejects(
    runToolcraftDeliveryVerification({
      arguments_: iterationArguments,
      projectDir: rootDir,
    }),
    /playwright.*code 1/iu,
  );

  assert.equal(readFileSync(bundlePath, "utf8"), authorityBefore);
  assert.equal(getCompletedFixtureEvents(rootDir, "maximum").length, 0);
  assertNoPerformanceAuthority(rootDir);
});

test("performance iteration preserves an existing durable baseline linkage", async (t) => {
  const rootDir = createDeliveryFixture();
  t.after(() => removeDeliveryFixture(rootDir));
  const explicit = await runToolcraftFullPerformanceCertification({
    projectDir: rootDir,
  });
  const bundlePath = getToolcraftCheckpointBundlePath(rootDir);
  const bundleBefore = readJson(bundlePath);
  updateRenderer(rootDir, 2);

  const receipt = await runToolcraftDeliveryVerification({
    arguments_: iterationArguments,
    projectDir: rootDir,
  });
  const bundleAfter = readJson(bundlePath);

  assert.equal(receipt.mode, "performance-iteration");
  assert.equal(receipt.comparisonSourceHash, explicit.sourceHash);
  assert.equal(receipt.baselineSourceHash, explicit.baselineSourceHash);
  assert.equal(receipt.baselineEvidenceHash, explicit.baselineEvidenceHash);
  assert.deepEqual(
    bundleAfter.performanceBaseline,
    bundleBefore.performanceBaseline,
  );
  assert.deepEqual(
    bundleAfter.currentPerformance,
    bundleBefore.currentPerformance,
  );
  assert.equal(getCompletedFixtureEvents(rootDir, "maximum").length, 1);
  assert.deepEqual(await validateToolcraftDeliveryReceipt({ rootDir }), []);
});

test("performance iteration upgrades a legacy v2 delivery while preserving its v3 baseline", async (t) => {
  const rootDir = createDeliveryFixture();
  t.after(() => removeDeliveryFixture(rootDir));
  const legacyBaseline = await writePassedCheckpointFixture(rootDir, {
    legacy: true,
  });
  updateRenderer(rootDir, 2);

  const receipt = await runToolcraftDeliveryVerification({
    arguments_: iterationArguments,
    projectDir: rootDir,
  });
  const bundle = readJson(getToolcraftCheckpointBundlePath(rootDir));

  assert.equal(receipt.version, 4);
  assert.equal(receipt.comparisonSourceHash, legacyBaseline.sourceHash);
  assert.equal(receipt.baselineSourceHash, legacyBaseline.sourceHash);
  assert.equal(bundle.performanceBaseline.version, 3);
  assert.deepEqual(bundle.performanceBaseline, legacyBaseline);
  assert.deepEqual(await validateToolcraftDeliveryReceipt({ rootDir }), []);
});
test("checkpoint commit rejects a replayed performance comparison anchor atomically", async (t) => {
  const rootDir = createDeliveryFixture();
  t.after(() => removeDeliveryFixture(rootDir));
  await runToolcraftDeliveryVerification({ projectDir: rootDir });
  updateRenderer(rootDir, 2);
  const receipt = await runToolcraftDeliveryVerification({
    arguments_: iterationArguments,
    projectDir: rootDir,
  });
  const bundlePath = getToolcraftCheckpointBundlePath(rootDir);
  const authorityBefore = readFileSync(bundlePath, "utf8");

  await assert.rejects(
    commitToolcraftDeliveryCheckpoint({
      deliveryReceipt: receipt,
      projectDir: rootDir,
    }),
    /comparison.*immediately previous successful delivery/iu,
  );
  assert.equal(readFileSync(bundlePath, "utf8"), authorityBefore);
});
