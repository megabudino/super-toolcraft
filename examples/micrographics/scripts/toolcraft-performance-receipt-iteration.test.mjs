import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  readToolcraftCheckpointBundle,
  writeToolcraftCheckpointBundle,
} from "./toolcraft-checkpoint-bundle.mjs";
import {
  TOOLCRAFT_PERFORMANCE_ITERATION_REASON,
  collectToolcraftVerificationInputs,
  getChangedFiles,
  validateToolcraftPerformanceReceipt,
} from "./toolcraft-verification-receipt.mjs";
import {
  createLegacyV3IterationVerification,
  createReceiptFixture,
  writePassedCheckpointFixture,
} from "./toolcraft-verification-receipt-test-helpers.mjs";

async function configurePerformanceOwnedFixture(rootDir) {
  await fs.writeFile(
    path.join(rootDir, "src", "app", "product-renderer.ts"),
    'export const rendererMode = "initial";\n',
  );
  await fs.writeFile(
    path.join(rootDir, "src", "app", "app-performance-impact.json"),
    `${JSON.stringify(
      {
        modules: [
          { kind: "functional", path: "src/app/app-schema.ts" },
          {
            kind: "performance",
            passIds: ["composite"],
            path: "src/app/product-renderer.ts",
          },
        ],
        version: 1,
      },
      null,
      2,
    )}\n`,
  );
}

async function writeLegacyReadableIteration(rootDir, baseline, mode) {
  await fs.writeFile(
    path.join(rootDir, "src", "app", "product-renderer.ts"),
    `export const rendererMode = ${JSON.stringify(mode)};\n`,
  );
  const inventory = await collectToolcraftVerificationInputs(rootDir);
  const receipt = {
    baselineEvidenceHash: baseline.performanceEvidence.reportHash,
    baselineSourceHash: baseline.sourceHash,
    changedFiles: getChangedFiles(baseline.files, inventory.entries),
    completedAt: new Date().toISOString(),
    files: inventory.entries,
    kind: "performance-iteration",
    reasonCode: TOOLCRAFT_PERFORMANCE_ITERATION_REASON,
    sourceHash: inventory.sourceHash,
    status: "passed-targeted",
    verification: createLegacyV3IterationVerification(3, {
      sourceHash: inventory.sourceHash,
    }),
    verificationTier: 3,
    version: 3,
  };
  const loaded = await readToolcraftCheckpointBundle(rootDir);
  await writeToolcraftCheckpointBundle({
    bundle: { ...loaded.bundle, currentPerformance: receipt },
    rootDir,
  });
  return receipt;
}

test("keeps repeated legacy targeted receipts readable against one durable baseline", async (t) => {
  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  await configurePerformanceOwnedFixture(rootDir);
  const baseline = await writePassedCheckpointFixture(rootDir);

  await writeLegacyReadableIteration(rootDir, baseline, "feature-one");
  assert.deepEqual(await validateToolcraftPerformanceReceipt({ rootDir }), []);

  const second = await writeLegacyReadableIteration(
    rootDir,
    baseline,
    "feature-two",
  );
  assert.equal(second.kind, "performance-iteration");
  assert.equal(second.version, 3);
  assert.equal(second.verification.targetedPerformanceReport.version, 1);
  assert.equal(second.baselineSourceHash, baseline.sourceHash);
  assert.deepEqual(await validateToolcraftPerformanceReceipt({ rootDir }), []);
  const loaded = await readToolcraftCheckpointBundle(rootDir);
  assert.equal(loaded.bundle.performanceBaseline.sourceHash, baseline.sourceHash);
});

test("rejects readable legacy targeted receipts with missing or mismatched baselines", async (t) => {
  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  await configurePerformanceOwnedFixture(rootDir);
  const baseline = await writePassedCheckpointFixture(rootDir);
  const iteration = await writeLegacyReadableIteration(
    rootDir,
    baseline,
    "changed",
  );
  const loaded = await readToolcraftCheckpointBundle(rootDir);

  await writeToolcraftCheckpointBundle({
    bundle: { ...loaded.bundle, performanceBaseline: null },
    rootDir,
  });
  assert.match(
    (await validateToolcraftPerformanceReceipt({ rootDir }))[0],
    /performance baseline receipt is missing/iu,
  );

  await writeToolcraftCheckpointBundle({
    bundle: {
      ...loaded.bundle,
      currentPerformance: {
        ...iteration,
        baselineSourceHash: "0".repeat(64),
      },
    },
    rootDir,
  });
  assert.match(
    (await validateToolcraftPerformanceReceipt({ rootDir }))[0],
    /does not match the durable baseline/iu,
  );

  await writeToolcraftCheckpointBundle({
    bundle: {
      ...loaded.bundle,
      currentPerformance: {
        ...iteration,
        baselineEvidenceHash: "0".repeat(64),
      },
    },
    rootDir,
  });
  assert.match(
    (await validateToolcraftPerformanceReceipt({ rootDir }))[0],
    /does not match the durable baseline evidence/iu,
  );
});

test("invalidates a readable legacy targeted receipt after later source changes", async (t) => {
  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  await configurePerformanceOwnedFixture(rootDir);
  const baseline = await writePassedCheckpointFixture(rootDir);
  await writeLegacyReadableIteration(rootDir, baseline, "iteration");
  await fs.writeFile(
    path.join(rootDir, "e2e", "app-performance.spec.ts"),
    'export const scenario = "changed-after-iteration";\n',
  );
  assert.match(
    (await validateToolcraftPerformanceReceipt({ rootDir }))[0],
    /stale/iu,
  );
});
