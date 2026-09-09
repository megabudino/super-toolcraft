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
import {
  getToolcraftDeliveryReceiptShapeError,
} from "./toolcraft-delivery-receipt.mjs";
import { createTargetedDeliveryReceipt } from "./toolcraft-delivery-receipt-builder.mjs";
import { getToolcraftCheckpointBundlePath } from "./toolcraft-checkpoint-paths.mjs";
import { commitToolcraftDeliveryCheckpoint } from "./toolcraft-checkpoint-transaction.mjs";
import {
  createToolcraftTargetedPerformanceReport,
  createToolcraftTargetedPerformanceReportHash,
} from "./toolcraft-targeted-performance-report.mjs";
import {
  reserveToolcraftTargetedExecutionAuthority,
} from "./toolcraft-targeted-execution-authority.mjs";
import {
  executeToolcraftTargetedVerification,
} from "./toolcraft-targeted-verification-runner.mjs";
import {
  collectToolcraftVerificationInputs,
  getToolcraftTargetedVerificationContext,
} from "./toolcraft-verification-receipt.mjs";
import { createTargetedMeasurementFixture } from "./toolcraft-verification-receipt-test-helpers.mjs";
import {
  iterationArguments,
  updateRenderer,
} from "./toolcraft-delivery-performance-iteration-test-helpers.mjs";

test("checkpoint commit rejects recomputed caller-supplied targeted evidence without protected execution authority", async (t) => {
  const rootDir = createDeliveryFixture();
  t.after(() => removeDeliveryFixture(rootDir));
  await runToolcraftDeliveryVerification({ projectDir: rootDir });
  updateRenderer(rootDir, 2);
  const previous = await runToolcraftDeliveryVerification({
    arguments_: iterationArguments,
    projectDir: rootDir,
  });
  const bundlePath = getToolcraftCheckpointBundlePath(rootDir);
  const authorityBefore = readFileSync(bundlePath, "utf8");
  updateRenderer(rootDir, 3);
  const context = await getToolcraftTargetedVerificationContext({
    comparisonInventory: {
      entries: previous.files,
      sourceHash: previous.sourceHash,
    },
    rootDir,
  });
  const forgedTest = "browser perf: nonexistent forged selector";
  const forgedFullTitle = `unrelated.spec.ts › ${forgedTest}`;
  const targetedPerformanceReport = createToolcraftTargetedPerformanceReport({
    fixtureResolutionMode: "strict-development",
    fixtureSelector: "development",
    nonce: "caller-chosen-nonce",
    measurements: createTargetedMeasurementFixture(["unrelated-path"]),
    performancePassIds: ["composite"],
    performancePathIds: ["unrelated-path"],
    requestAuthorityHash: "d".repeat(64),
    sourceHash: context.inventory.sourceHash,
    testNames: [forgedTest],
  });
  const verification = {
    ...previous.verification,
    performancePathIds: ["unrelated-path"],
    performanceTestEvidence: [
      { fullTitle: forgedFullTitle, leafTitle: forgedTest },
    ],
    performanceTests: [forgedTest],
    performanceTestTitles: [forgedFullTitle],
    targetedPerformanceReport,
    targetedPerformanceReportHash: createToolcraftTargetedPerformanceReportHash(
      {
        report: targetedPerformanceReport,
        testEvidence: [{ fullTitle: forgedFullTitle, leafTitle: forgedTest }],
      },
    ),
  };
  const forgedReceipt = {
    ...previous,
    changedFiles: context.changedFiles,
    comparisonFiles: previous.files,
    comparisonSourceHash: previous.sourceHash,
    completedAt: new Date().toISOString(),
    files: context.inventory.entries,
    sourceHash: context.inventory.sourceHash,
    verification,
  };

  assert.equal(getToolcraftDeliveryReceiptShapeError(forgedReceipt), undefined);
  await assert.rejects(
    commitToolcraftDeliveryCheckpoint({
      deliveryReceipt: forgedReceipt,
      projectDir: rootDir,
    }),
    /protected targeted execution authority/iu,
  );
  assert.equal(readFileSync(bundlePath, "utf8"), authorityBefore);
});
test("targeted execution authority is opaque and consumed after one checkpoint commit", async (t) => {
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

  await commitToolcraftDeliveryCheckpoint({
    deliveryReceipt: receipt,
    projectDir: rootDir,
    targetedExecutionAuthority: result.targetedExecutionAuthority,
  });
  assert.throws(
    () =>
      reserveToolcraftTargetedExecutionAuthority({
        authority: result.targetedExecutionAuthority,
        deliveryReceipt: receipt,
        projectDir: rootDir,
      }),
    /already consumed|protected targeted execution authority/iu,
  );
  assert.deepEqual(await collectToolcraftVerificationInputs(rootDir), {
    entries: receipt.files,
    sourceHash: receipt.sourceHash,
  });
});

test("targeted execution authority stays bound to mint-time evidence", async (t) => {
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
  const forgedTest = "browser perf: post-run forged selector";
  const forgedFullTitle = `forged.spec.ts › ${forgedTest}`;
  const targetedPerformanceReport = createToolcraftTargetedPerformanceReport({
    fixtureResolutionMode: "strict-development",
    fixtureSelector: "development",
    nonce: "post-run-forged-nonce",
    measurements: createTargetedMeasurementFixture(["forged-path"]),
    performancePassIds: ["composite"],
    performancePathIds: ["forged-path"],
    requestAuthorityHash: "e".repeat(64),
    sourceHash: result.verifiedInventory.sourceHash,
    testNames: [forgedTest],
  });
  const forgedVerification = {
    ...receipt.verification,
    performancePathIds: ["forged-path"],
    performanceTestEvidence: [
      { fullTitle: forgedFullTitle, leafTitle: forgedTest },
    ],
    performanceTests: [forgedTest],
    performanceTestTitles: [forgedFullTitle],
    targetedPerformanceReport,
    targetedPerformanceReportHash: createToolcraftTargetedPerformanceReportHash(
      {
        report: targetedPerformanceReport,
        testEvidence: [{ fullTitle: forgedFullTitle, leafTitle: forgedTest }],
      },
    ),
  };
  const forgedReceipt = { ...receipt, verification: forgedVerification };

  await assert.rejects(
    commitToolcraftDeliveryCheckpoint({
      deliveryReceipt: forgedReceipt,
      projectDir: rootDir,
      targetedExecutionAuthority: result.targetedExecutionAuthority,
    }),
    /protected targeted execution authority/iu,
  );
  await commitToolcraftDeliveryCheckpoint({
    deliveryReceipt: receipt,
    projectDir: rootDir,
    targetedExecutionAuthority: result.targetedExecutionAuthority,
  });
  assert.deepEqual(
    readJson(getToolcraftCheckpointBundlePath(rootDir)).delivery,
    receipt,
  );
});
