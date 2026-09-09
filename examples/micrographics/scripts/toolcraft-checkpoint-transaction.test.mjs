import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  readToolcraftCheckpointBundle,
} from "./toolcraft-checkpoint-bundle.mjs";
import { getToolcraftCheckpointBundlePath } from "./toolcraft-checkpoint-paths.mjs";
import { commitToolcraftDeliveryCheckpoint } from "./toolcraft-checkpoint-transaction.mjs";
import {
  createCheckpointFixture,
  createExplicitCheckpointFixture,
} from "./toolcraft-checkpoint-transaction-test-helpers.mjs";
import { writePassedCheckpointFixture } from "./toolcraft-verification-receipt-test-helpers.mjs";

test("successful commit publishes one complete checkpoint bundle", async (t) => {
  const { deliveryReceipt, performanceCheckpoint, rootDir } =
    await createExplicitCheckpointFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));

  await commitToolcraftDeliveryCheckpoint({
    deliveryReceipt,
    performanceCheckpoint,
    projectDir: rootDir,
  });

  const loaded = await readToolcraftCheckpointBundle(rootDir);
  assert.equal(loaded.source, "canonical");
  assert.deepEqual(loaded.bundle.delivery, deliveryReceipt);
  assert.deepEqual(loaded.bundle.performanceBaseline, performanceCheckpoint);
  assert.deepEqual(loaded.bundle.currentPerformance, performanceCheckpoint);
});

test("commit module exports only the delivery-specific checkpoint writer", async () => {
  const transactionModule = await import("./toolcraft-checkpoint-transaction.mjs");
  assert.deepEqual(Object.keys(transactionModule), [
    "commitToolcraftDeliveryCheckpoint",
  ]);
});

test("malformed delivery input cannot mutate checkpoint authority", async (t) => {
  const { rootDir, verificationDir } = await createCheckpointFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  const unrelatedPath = path.join(verificationDir, "unrelated.json");
  await fs.writeFile(unrelatedPath, "unrelated-sentinel\n");

  await assert.rejects(
    commitToolcraftDeliveryCheckpoint({
      deliveryReceipt: {},
      projectDir: rootDir,
    }),
    /delivery receipt is malformed/iu,
  );
  await assert.rejects(
    commitToolcraftDeliveryCheckpoint({
      entries: [{ contents: "forged-authority\n", filePath: unrelatedPath }],
      projectDir: rootDir,
    }),
    /commit options are malformed or unsupported/iu,
  );

  assert.equal(await fs.readFile(unrelatedPath, "utf8"), "unrelated-sentinel\n");
  await assert.rejects(
    fs.access(getToolcraftCheckpointBundlePath(rootDir)),
    /ENOENT/iu,
  );
});

test("malformed performance content is rejected before checkpoint mutation", async (t) => {
  const { deliveryReceipt, rootDir } = await createExplicitCheckpointFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));

  await assert.rejects(
    commitToolcraftDeliveryCheckpoint({
      deliveryReceipt,
      performanceCheckpoint: {},
      projectDir: rootDir,
    }),
    /performance baseline.*malformed/iu,
  );
  await assert.rejects(
    fs.access(getToolcraftCheckpointBundlePath(rootDir)),
    /ENOENT/iu,
  );
});

test("caller-authored legacy v2 targeted authority cannot be promoted without protected execution", async (t) => {
  const { rootDir } = await createCheckpointFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  await fs.mkdir(path.join(rootDir, "src", "app"), { recursive: true });
  await fs.writeFile(
    path.join(rootDir, "src", "app", "app-schema.ts"),
    "export const schema = {};\n",
  );
  await fs.writeFile(
    path.join(rootDir, "src", "app", "app-performance-impact.json"),
    `${JSON.stringify({
      modules: [{ kind: "functional", path: "src/app/app-schema.ts" }],
      version: 1,
    })}\n`,
  );
  await fs.writeFile(
    path.join(rootDir, "package.json"),
    `${JSON.stringify({ name: "legacy-authority-fixture", private: true })}\n`,
  );
  await writePassedCheckpointFixture(rootDir, { legacy: true });
  const legacy = await readToolcraftCheckpointBundle(rootDir);
  assert.equal(legacy.source, "legacy");

  await assert.rejects(
    commitToolcraftDeliveryCheckpoint({
      deliveryReceipt: legacy.bundle.delivery,
      projectDir: rootDir,
    }),
    /protected targeted execution authority/iu,
  );

  const unchanged = await readToolcraftCheckpointBundle(rootDir);
  assert.equal(unchanged.source, "legacy");
  assert.deepEqual(unchanged.bundle, legacy.bundle);
  await assert.rejects(
    fs.access(getToolcraftCheckpointBundlePath(rootDir)),
    /ENOENT/iu,
  );
});
