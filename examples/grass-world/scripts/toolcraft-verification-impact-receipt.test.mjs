import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  TOOLCRAFT_PERFORMANCE_ITERATION_REASON,
  validateToolcraftPerformanceReceipt,
  writeToolcraftPerformanceIteration,
} from "./toolcraft-verification-receipt.mjs";
import {
  createIterationVerification,
  createReceiptFixture,
  writePassedCheckpointFixture,
} from "./toolcraft-verification-receipt-test-helpers.mjs";

async function preparePerformanceOwnedRenderer(rootDir) {
  const rendererPath = path.join(rootDir, "src", "product-renderer.ts");
  await fs.writeFile(rendererPath, "export const render = () => 1;\n");
  await fs.writeFile(
    path.join(rootDir, "src", "app", "app-performance-impact.json"),
    `${JSON.stringify({
      modules: [
        { kind: "functional", path: "src/app/app-schema.ts" },
        {
          kind: "performance",
          passIds: ["composite"],
          path: "src/product-renderer.ts",
        },
      ],
      version: 1,
    }, null, 2)}\n`,
  );
  await writePassedCheckpointFixture(rootDir);
  return rendererPath;
}

test("records pass-owned Tier 3 and Tier 4 iterations without full checkpoints", async (t) => {
  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  const rendererPath = await preparePerformanceOwnedRenderer(rootDir);
  await fs.writeFile(rendererPath, "export const render = () => 2;\n");

  await writeToolcraftPerformanceIteration({
    reasonCode: TOOLCRAFT_PERFORMANCE_ITERATION_REASON,
    rootDir,
    verification: createIterationVerification(3),
    verificationTier: 3,
  });
  assert.deepEqual(await validateToolcraftPerformanceReceipt({ rootDir }), []);

  await fs.writeFile(rendererPath, "export const render = () => 3;\n");
  await writeToolcraftPerformanceIteration({
    reasonCode: TOOLCRAFT_PERFORMANCE_ITERATION_REASON,
    rootDir,
    verification: createIterationVerification(4),
    verificationTier: 4,
  });
  assert.deepEqual(await validateToolcraftPerformanceReceipt({ rootDir }), []);
});

test("rejects a renderer implementation change recorded as Tier 0", async (t) => {
  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  const rendererPath = await preparePerformanceOwnedRenderer(rootDir);
  await fs.writeFile(rendererPath, "export const render = () => 2;\n");

  await assert.rejects(
    writeToolcraftPerformanceIteration({
      reasonCode: TOOLCRAFT_PERFORMANCE_ITERATION_REASON,
      rootDir,
      verification: createIterationVerification(0),
      verificationTier: 0,
    }),
    /requires verification Tier 3/iu,
  );
});
