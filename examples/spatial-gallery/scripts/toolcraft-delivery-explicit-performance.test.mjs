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
import {
  validateToolcraftDeliveryReceipt,
} from "./toolcraft-delivery-receipt.mjs";
import { getToolcraftCheckpointBundlePath } from "./toolcraft-checkpoint-paths.mjs";

const explicitArguments = ["--reason=explicit-performance-work"];

test("verify:delivery rejects full performance certification authority", async (t) => {
  const rootDir = createDeliveryFixture();
  t.after(() => removeDeliveryFixture(rootDir));

  await assert.rejects(
    runToolcraftDeliveryVerification({
      arguments_: explicitArguments,
      projectDir: rootDir,
    }),
    /delivery --reason must be performance-iteration/iu,
  );
  assertNoPerformanceAuthority(rootDir);
});

test("operator full certification creates a baseline without prior authority", async (t) => {
  const rootDir = createDeliveryFixture();
  t.after(() => removeDeliveryFixture(rootDir));

  const receipt = await runToolcraftFullPerformanceCertification({
    projectDir: rootDir,
  });

  assert.equal(receipt.mode, "explicit-performance");
  assert.equal(getCompletedFixtureEvents(rootDir, "development").length, 0);
  assert.equal(getCompletedFixtureEvents(rootDir, "maximum").length, 1);
  const bundlePath = getToolcraftCheckpointBundlePath(rootDir);
  assert.equal(existsSync(bundlePath), true);
  assert.equal(
    readJson(bundlePath).performanceBaseline.checkpointReason,
    "explicit-performance-work",
  );
  assert.deepEqual(await validateToolcraftDeliveryReceipt({ rootDir }), []);
});

test("explicit performance delivery refreshes an existing baseline for changed source", async (t) => {
  const rootDir = createDeliveryFixture();
  t.after(() => removeDeliveryFixture(rootDir));
  const first = await runToolcraftFullPerformanceCertification({
    projectDir: rootDir,
  });
  writeFileSync(
    path.join(rootDir, "src", "app", "renderer.ts"),
    "export const renderer = 2;\n",
  );

  const refreshed = await runToolcraftFullPerformanceCertification({
    projectDir: rootDir,
  });

  assert.notEqual(refreshed.sourceHash, first.sourceHash);
  assert.equal(refreshed.baselineSourceHash, refreshed.sourceHash);
  assert.equal(getCompletedFixtureEvents(rootDir, "maximum").length, 2);
  assert.deepEqual(await validateToolcraftDeliveryReceipt({ rootDir }), []);
});

test("full checkpoint failure writes no delivery or performance authority", async (t) => {
  const rootDir = createDeliveryFixture();
  t.after(() => removeDeliveryFixture(rootDir));
  installConditionalPlaywrightFailure(rootDir, 'args.includes("browser perf:")');

  await assert.rejects(
    runToolcraftFullPerformanceCertification({ projectDir: rootDir }),
    /playwright.*code 1/iu,
  );
  assert.equal(existsSync(getToolcraftCheckpointBundlePath(rootDir)), false);
  assertNoPerformanceAuthority(rootDir);
});

test("failed explicit refresh preserves the previous delivery and baseline authority", async (t) => {
  const rootDir = createDeliveryFixture();
  t.after(() => removeDeliveryFixture(rootDir));
  await runToolcraftFullPerformanceCertification({
    projectDir: rootDir,
  });
  const authorityPath = getToolcraftCheckpointBundlePath(rootDir);
  const authorityBefore = readFileSync(authorityPath, "utf8");
  writeFileSync(
    path.join(rootDir, "src", "app", "renderer.ts"),
    "export const renderer = 2;\n",
  );
  installConditionalPlaywrightFailure(rootDir, 'args.includes("browser perf:")');

  await assert.rejects(
    runToolcraftFullPerformanceCertification({ projectDir: rootDir }),
    /playwright.*code 1/iu,
  );
  assert.equal(readFileSync(authorityPath, "utf8"), authorityBefore);
});
