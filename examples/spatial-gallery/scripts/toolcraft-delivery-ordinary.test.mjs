import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import { runToolcraftDeliveryVerification } from "./run-delivery-verification.mjs";
import { runToolcraftFullPerformanceCertification } from "./run-browser-performance.mjs";
import {
  assertNoPerformanceAuthority,
  createDeliveryFixture,
  functionalTestName,
  getCompletedFixtureEvents,
  performanceTestName,
  readJson,
  removeDeliveryFixture,
} from "./run-delivery-verification-test-helpers.mjs";
import {
  validateToolcraftDeliveryReceipt,
} from "./toolcraft-delivery-receipt.mjs";
import { getToolcraftCheckpointBundlePath } from "./toolcraft-checkpoint-paths.mjs";
import { commitToolcraftDeliveryCheckpoint } from "./toolcraft-checkpoint-transaction.mjs";

test("ordinary functional delivery before a baseline compares with the prototype", async (t) => {
  const rootDir = createDeliveryFixture();
  t.after(() => removeDeliveryFixture(rootDir));
  const prototype = await runToolcraftDeliveryVerification({ projectDir: rootDir });
  writeFileSync(
    path.join(rootDir, "src", "app", "schema.ts"),
    "export const schema = 2;\n",
  );

  const receipt = await runToolcraftDeliveryVerification({
    arguments_: ["--tier=2", `--browser-test=${functionalTestName}`],
    projectDir: rootDir,
  });

  assert.equal(receipt.mode, "ordinary");
  assert.equal(receipt.comparisonSourceHash, prototype.sourceHash);
  assert.equal("baselineSourceHash" in receipt, false);
  assert.deepEqual(receipt.verification.performanceTests, []);
  assertNoPerformanceAuthority(rootDir);
  assert.deepEqual(await validateToolcraftDeliveryReceipt({ rootDir }), []);
});

test("ordinary unchanged delivery remains a no-op", async (t) => {
  const rootDir = createDeliveryFixture();
  t.after(() => removeDeliveryFixture(rootDir));
  const prototype = await runToolcraftDeliveryVerification({ projectDir: rootDir });

  const unchanged = await runToolcraftDeliveryVerification({ projectDir: rootDir });

  assert.deepEqual(unchanged, prototype);
});

test("checkpoint commit rejects a replayed ordinary comparison anchor atomically", async (t) => {
  const rootDir = createDeliveryFixture();
  t.after(() => removeDeliveryFixture(rootDir));
  await runToolcraftDeliveryVerification({ projectDir: rootDir });
  writeFileSync(
    path.join(rootDir, "src", "app", "schema.ts"),
    "export const schema = 2;\n",
  );
  const receipt = await runToolcraftDeliveryVerification({
    arguments_: ["--tier=2", `--browser-test=${functionalTestName}`],
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

test("ordinary performance-impacting delivery before a baseline uses targeted development proof", async (t) => {
  const rootDir = createDeliveryFixture();
  t.after(() => removeDeliveryFixture(rootDir));
  const prototype = await runToolcraftDeliveryVerification({ projectDir: rootDir });
  writeFileSync(
    path.join(rootDir, "src", "app", "renderer.ts"),
    "export const renderer = 2;\n",
  );

  const receipt = await runToolcraftDeliveryVerification({
    arguments_: ["--tier=3", `--performance-test=${performanceTestName}`],
    projectDir: rootDir,
  });

  assert.equal(receipt.mode, "ordinary");
  assert.equal(receipt.comparisonSourceHash, prototype.sourceHash);
  assert.equal("baselineSourceHash" in receipt, false);
  assert.deepEqual(receipt.verification.performancePassIds, ["composite"]);
  assert.equal(getCompletedFixtureEvents(rootDir, "maximum").length, 0);
  assert.ok(getCompletedFixtureEvents(rootDir, "development").length >= 2);
  assertNoPerformanceAuthority(rootDir);
  assert.deepEqual(await validateToolcraftDeliveryReceipt({ rootDir }), []);

  writeFileSync(
    path.join(rootDir, "src", "app", "schema.ts"),
    "export const schema = 2;\n",
  );
  const nextReceipt = await runToolcraftDeliveryVerification({
    arguments_: ["--tier=2", `--browser-test=${functionalTestName}`],
    projectDir: rootDir,
  });
  assert.equal(nextReceipt.comparisonSourceHash, receipt.sourceHash);
  assert.deepEqual(nextReceipt.verification.performanceTests, []);
  assertNoPerformanceAuthority(rootDir);
  assert.deepEqual(await validateToolcraftDeliveryReceipt({ rootDir }), []);
});

test("ordinary delivery after a baseline preserves exact baseline linkage", async (t) => {
  const rootDir = createDeliveryFixture();
  t.after(() => removeDeliveryFixture(rootDir));
  const explicit = await runToolcraftFullPerformanceCertification({
    projectDir: rootDir,
  });
  const bundlePath = getToolcraftCheckpointBundlePath(rootDir);
  const baselineBefore = readJson(bundlePath).performanceBaseline;
  writeFileSync(
    path.join(rootDir, "src", "app", "schema.ts"),
    "export const schema = 2;\n",
  );

  const receipt = await runToolcraftDeliveryVerification({
    arguments_: ["--tier=2", `--browser-test=${functionalTestName}`],
    projectDir: rootDir,
  });

  assert.equal(receipt.mode, "ordinary");
  assert.equal(receipt.comparisonSourceHash, explicit.sourceHash);
  assert.equal(receipt.baselineSourceHash, explicit.baselineSourceHash);
  assert.equal(receipt.baselineEvidenceHash, explicit.baselineEvidenceHash);
  assert.deepEqual(readJson(bundlePath).performanceBaseline, baselineBefore);
  assert.equal(getCompletedFixtureEvents(rootDir, "maximum").length, 1);
  assert.deepEqual(await validateToolcraftDeliveryReceipt({ rootDir }), []);
});

test("ordinary delivery rejects baseline authority that no longer matches its delivery anchor", async (t) => {
  const rootDir = createDeliveryFixture();
  t.after(() => removeDeliveryFixture(rootDir));
  await runToolcraftFullPerformanceCertification({
    projectDir: rootDir,
  });
  const bundlePath = getToolcraftCheckpointBundlePath(rootDir);
  const bundle = readJson(bundlePath);
  bundle.performanceBaseline.performanceEvidence.reportHash = "f".repeat(64);
  writeFileSync(bundlePath, `${JSON.stringify(bundle, null, 2)}\n`);

  await assert.rejects(
    runToolcraftDeliveryVerification({ projectDir: rootDir }),
    /does not match the durable performance baseline/iu,
  );
});

test("ordinary preflight source mutation preserves the previous baseline-free delivery authority", async (t) => {
  const rootDir = createDeliveryFixture();
  t.after(() => removeDeliveryFixture(rootDir));
  await runToolcraftDeliveryVerification({ projectDir: rootDir });
  const bundlePath = getToolcraftCheckpointBundlePath(rootDir);
  const deliveryBefore = readFileSync(bundlePath, "utf8");
  writeFileSync(
    path.join(rootDir, "src", "app", "schema.ts"),
    "export const schema = 2;\n",
  );
  writeFileSync(
    path.join(rootDir, "scripts", "mutate-ordinary-source.mjs"),
    [
      'import { writeFile } from "node:fs/promises";',
      'await writeFile("src/app/schema.ts", "export const schema = 99;\\n");',
      "",
    ].join("\n"),
  );
  const packageJsonPath = path.join(rootDir, "package.json");
  const packageJson = readJson(packageJsonPath);
  packageJson.scripts["docs:check"] = "node scripts/mutate-ordinary-source.mjs";
  writeFileSync(packageJsonPath, `${JSON.stringify(packageJson)}\n`);

  await assert.rejects(
    runToolcraftDeliveryVerification({ projectDir: rootDir }),
    /verification inputs changed during ordinary delivery preflight/iu,
  );
  assert.equal(readFileSync(bundlePath, "utf8"), deliveryBefore);
  assertNoPerformanceAuthority(rootDir);
});
