import assert from "node:assert/strict";
import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import { runToolcraftDeliveryVerification } from "./run-delivery-verification.mjs";
import {
  assertNoPerformanceAuthority,
  createDeliveryFixture,
  getCompletedFixtureEvents,
  installConditionalPlaywrightFailure,
  readDeliveryEvents,
  readJson,
  removeDeliveryFixture,
} from "./run-delivery-verification-test-helpers.mjs";
import { getToolcraftCheckpointBundlePath } from "./toolcraft-checkpoint-paths.mjs";
import { validateToolcraftDeliveryReceipt } from "./toolcraft-delivery-receipt.mjs";

test("first delivery runs aggregate functional proof and bounded smoke without a baseline", async (t) => {
  const rootDir = createDeliveryFixture();
  t.after(() => removeDeliveryFixture(rootDir));

  const receipt = await runToolcraftDeliveryVerification({ projectDir: rootDir });

  assert.equal(receipt.mode, "prototype");
  assert.equal(receipt.smokeEvidence.fixtureSelector, "development");
  assert.equal(receipt.smokeEvidence.sourceHash, receipt.sourceHash);
  assert.deepEqual(readDeliveryEvents(rootDir), [
    "integrity",
    "ai-check",
    "test-delivery",
    "build",
  ]);
  assert.equal(getCompletedFixtureEvents(rootDir, "development").length, 1);
  assert.equal(getCompletedFixtureEvents(rootDir, "maximum").length, 0);
  assertNoPerformanceAuthority(rootDir);
  assert.deepEqual(await validateToolcraftDeliveryReceipt({ rootDir }), []);
});

test("source mutation during aggregate verification writes no delivery or performance authority", async (t) => {
  const rootDir = createDeliveryFixture();
  t.after(() => removeDeliveryFixture(rootDir));
  writeFileSync(
    path.join(rootDir, "scripts", "mutate-source.mjs"),
    [
      'import { writeFile } from "node:fs/promises";',
      'await writeFile("src/app/schema.ts", "export const schema = 99;\\n");',
      "",
    ].join("\n"),
  );
  const packageJsonPath = path.join(rootDir, "package.json");
  const packageJson = readJson(packageJsonPath);
  packageJson.scripts.build = "node scripts/mutate-source.mjs";
  writeFileSync(packageJsonPath, `${JSON.stringify(packageJson)}\n`);

  await assert.rejects(
    runToolcraftDeliveryVerification({ projectDir: rootDir }),
    /verification inputs changed.*aggregate delivery gate/iu,
  );
  assert.equal(existsSync(getToolcraftCheckpointBundlePath(rootDir)), false);
  assertNoPerformanceAuthority(rootDir);
});

test("smoke failure writes no delivery or performance authority", async (t) => {
  const rootDir = createDeliveryFixture();
  t.after(() => removeDeliveryFixture(rootDir));
  installConditionalPlaywrightFailure(
    rootDir,
    'args.includes("e2e/app-performance-smoke.spec.ts")',
  );

  await assert.rejects(
    runToolcraftDeliveryVerification({ projectDir: rootDir }),
    /playwright.*code 1/iu,
  );
  assert.equal(existsSync(getToolcraftCheckpointBundlePath(rootDir)), false);
  assertNoPerformanceAuthority(rootDir);
});
