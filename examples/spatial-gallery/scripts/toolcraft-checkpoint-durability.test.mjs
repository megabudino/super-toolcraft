import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";

import { readToolcraftCheckpointBundle } from "./toolcraft-checkpoint-bundle.mjs";
import { commitToolcraftDeliveryCheckpoint } from "./toolcraft-checkpoint-transaction.mjs";
import { createExplicitCheckpointFixture } from "./toolcraft-checkpoint-transaction-test-helpers.mjs";

function nextAuthority(deliveryReceipt, performanceCheckpoint) {
  const completedAt = "2026-07-21T00:00:00.000Z";
  return {
    deliveryReceipt: { ...deliveryReceipt, completedAt },
    performanceCheckpoint: { ...performanceCheckpoint, completedAt },
  };
}

test("successful atomic commit crosses prepared and committed durability barriers", async (t) => {
  const { deliveryReceipt, performanceCheckpoint, rootDir } =
    await createExplicitCheckpointFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  const events = [];

  await commitToolcraftDeliveryCheckpoint({
    deliveryReceipt,
    observeDurabilityBarrier: ({ phase }) => events.push(phase),
    performanceCheckpoint,
    projectDir: rootDir,
  });

  assert.deepEqual(events, ["checkpoint-prepared", "checkpoint-committed"]);
  const loaded = await readToolcraftCheckpointBundle(rootDir);
  assert.deepEqual(loaded.bundle.delivery, deliveryReceipt);
  assert.deepEqual(loaded.bundle.performanceBaseline, performanceCheckpoint);
  assert.deepEqual(loaded.bundle.currentPerformance, performanceCheckpoint);
});

test("failure before rename preserves the previous complete bundle", async (t) => {
  const { deliveryReceipt, performanceCheckpoint, rootDir } =
    await createExplicitCheckpointFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  await commitToolcraftDeliveryCheckpoint({
    deliveryReceipt,
    performanceCheckpoint,
    projectDir: rootDir,
  });
  const before = (await readToolcraftCheckpointBundle(rootDir)).bundle;
  const next = nextAuthority(deliveryReceipt, performanceCheckpoint);

  await assert.rejects(
    commitToolcraftDeliveryCheckpoint({
      ...next,
      observeDurabilityBarrier: ({ phase }) => {
        if (phase === "checkpoint-prepared") throw new Error("simulated crash");
      },
      projectDir: rootDir,
    }),
    /simulated crash/iu,
  );

  assert.deepEqual((await readToolcraftCheckpointBundle(rootDir)).bundle, before);
});

test("failure after rename leaves the complete new bundle", async (t) => {
  const { deliveryReceipt, performanceCheckpoint, rootDir } =
    await createExplicitCheckpointFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  await commitToolcraftDeliveryCheckpoint({
    deliveryReceipt,
    performanceCheckpoint,
    projectDir: rootDir,
  });
  const next = nextAuthority(deliveryReceipt, performanceCheckpoint);

  await assert.rejects(
    commitToolcraftDeliveryCheckpoint({
      ...next,
      observeDurabilityBarrier: ({ phase }) => {
        if (phase === "checkpoint-committed") throw new Error("simulated crash");
      },
      projectDir: rootDir,
    }),
    /simulated crash/iu,
  );

  const committed = (await readToolcraftCheckpointBundle(rootDir)).bundle;
  assert.deepEqual(committed.delivery, next.deliveryReceipt);
  assert.deepEqual(committed.performanceBaseline, next.performanceCheckpoint);
  assert.deepEqual(committed.currentPerformance, next.performanceCheckpoint);
});
