import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { runToolcraftDeliveryVerification } from "./run-delivery-verification.mjs";
import {
  createDeliveryFixture,
  performanceTestName,
  readJson,
  removeDeliveryFixture,
} from "./run-delivery-verification-test-helpers.mjs";
import { createTargetedDeliveryReceipt } from "./toolcraft-delivery-receipt-builder.mjs";
import { getToolcraftCheckpointBundlePath } from "./toolcraft-checkpoint-paths.mjs";
import { commitToolcraftDeliveryCheckpoint } from "./toolcraft-checkpoint-transaction.mjs";
import {
  reserveToolcraftTargetedExecutionAuthority,
} from "./toolcraft-targeted-execution-authority.mjs";
import {
  executeToolcraftTargetedVerification,
} from "./toolcraft-targeted-verification-runner.mjs";
import { getToolcraftTargetedVerificationContext } from "./toolcraft-verification-receipt.mjs";
import {
  iterationArguments,
  updateRenderer,
} from "./toolcraft-delivery-performance-iteration-test-helpers.mjs";

test("targeted authority releases after checkpoint-prepared failure and permits identical retry", async (t) => {
  const rootDir = createDeliveryFixture();
  t.after(() => removeDeliveryFixture(rootDir));
  const prototype = await runToolcraftDeliveryVerification({
    projectDir: rootDir,
  });
  updateRenderer(rootDir, 2);
  const context = await getToolcraftTargetedVerificationContext({
    comparisonInventory: {
      entries: prototype.files,
      sourceHash: prototype.sourceHash,
    },
    rootDir,
  });
  const result = await executeToolcraftTargetedVerification({
    arguments_: ["--tier=3", `--performance-test=${performanceTestName}`],
    context,
    fixtureResolutionMode: "strict-development",
    projectDir: rootDir,
    requestAuthorityHash: "d".repeat(64),
  });
  const receipt = createTargetedDeliveryReceipt({
    comparisonReceipt: prototype,
    mode: "performance-iteration",
    result: { ...result, context },
  });
  const bundlePath = getToolcraftCheckpointBundlePath(rootDir);
  const authorityBefore = readFileSync(bundlePath, "utf8");

  await assert.rejects(
    commitToolcraftDeliveryCheckpoint({
      deliveryReceipt: receipt,
      observeDurabilityBarrier: ({ phase }) => {
        if (phase === "checkpoint-prepared") {
          assert.throws(
            () =>
              reserveToolcraftTargetedExecutionAuthority({
                authority: result.targetedExecutionAuthority,
                deliveryReceipt: receipt,
                projectDir: rootDir,
              }),
            /protected targeted execution authority/iu,
          );
          throw new Error("injected checkpoint-prepared failure");
        }
      },
      projectDir: rootDir,
      targetedExecutionAuthority: result.targetedExecutionAuthority,
    }),
    /injected checkpoint-prepared failure/iu,
  );
  assert.equal(readFileSync(bundlePath, "utf8"), authorityBefore);

  await commitToolcraftDeliveryCheckpoint({
    deliveryReceipt: receipt,
    projectDir: rootDir,
    targetedExecutionAuthority: result.targetedExecutionAuthority,
  });
  assert.deepEqual(readJson(bundlePath).delivery, receipt);
});
test("targeted authority finalizes when failure occurs after the durable commit barrier", async (t) => {
  const rootDir = createDeliveryFixture();
  t.after(() => removeDeliveryFixture(rootDir));
  const prototype = await runToolcraftDeliveryVerification({
    projectDir: rootDir,
  });
  updateRenderer(rootDir, 2);
  const context = await getToolcraftTargetedVerificationContext({
    comparisonInventory: {
      entries: prototype.files,
      sourceHash: prototype.sourceHash,
    },
    rootDir,
  });
  const result = await executeToolcraftTargetedVerification({
    arguments_: ["--tier=3", `--performance-test=${performanceTestName}`],
    context,
    fixtureResolutionMode: "strict-development",
    projectDir: rootDir,
    requestAuthorityHash: "e".repeat(64),
  });
  const receipt = createTargetedDeliveryReceipt({
    comparisonReceipt: prototype,
    mode: "performance-iteration",
    result: { ...result, context },
  });

  await assert.rejects(
    commitToolcraftDeliveryCheckpoint({
      deliveryReceipt: receipt,
      observeDurabilityBarrier: ({ phase }) => {
        if (phase === "checkpoint-committed") {
          throw new Error("injected post-durable failure");
        }
      },
      projectDir: rootDir,
      targetedExecutionAuthority: result.targetedExecutionAuthority,
    }),
    /injected post-durable failure/iu,
  );
  assert.deepEqual(
    readJson(getToolcraftCheckpointBundlePath(rootDir)).delivery,
    receipt,
  );
  assert.throws(
    () =>
      reserveToolcraftTargetedExecutionAuthority({
        authority: result.targetedExecutionAuthority,
        deliveryReceipt: receipt,
        projectDir: rootDir,
      }),
    /protected targeted execution authority/iu,
  );
});
