import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  readToolcraftCheckpointBundle,
  writeToolcraftCheckpointBundle,
} from "./toolcraft-checkpoint-bundle.mjs";
import { getToolcraftCheckpointBundlePath } from "./toolcraft-checkpoint-paths.mjs";
import {
  TOOLCRAFT_PERFORMANCE_RECEIPT_VERSION,
  collectToolcraftVerificationInputs,
  validateToolcraftPerformanceReceipt,
} from "./toolcraft-verification-receipt.mjs";
import { getToolcraftPerformanceReceiptShapeError } from "./toolcraft-performance-receipt-policy.mjs";
import { createToolcraftTargetedPerformanceReportHash } from "./toolcraft-targeted-performance-report.mjs";
import {
  createIterationVerification,
  createLegacyV3IterationVerification,
  createReceiptFixture,
  writePassedCheckpointFixture,
} from "./toolcraft-verification-receipt-test-helpers.mjs";

test("legacy first-working-version checkpoints remain readable migration input", async (t) => {
  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  const legacy = await writePassedCheckpointFixture(rootDir, { legacy: true });

  assert.equal(legacy.checkpointReason, "first-working-version");
  assert.deepEqual(await validateToolcraftPerformanceReceipt({ rootDir }), []);
});

test("uses version 4 for new receipts and keeps legacy version 3 performance iterations readable", async (t) => {
  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  const baseline = await writePassedCheckpointFixture(rootDir);
  await fs.writeFile(
    path.join(rootDir, "src", "app", "app-schema.ts"),
    'export const schema = { mode: "legacy-iteration" };\n',
  );
  const inventory = await collectToolcraftVerificationInputs(rootDir);
  const legacyVerification = createLegacyV3IterationVerification(3, {
    sourceHash: inventory.sourceHash,
  });
  const legacyReceipt = {
    baselineEvidenceHash: baseline.performanceEvidence.reportHash,
    baselineSourceHash: baseline.sourceHash,
    changedFiles: ["src/app/app-schema.ts"],
    completedAt: new Date().toISOString(),
    files: inventory.entries,
    kind: "performance-iteration",
    reasonCode: "post-first-working-targeted-verification",
    sourceHash: inventory.sourceHash,
    status: "passed-targeted",
    verification: legacyVerification,
    verificationTier: 3,
    version: 3,
  };

  assert.equal(TOOLCRAFT_PERFORMANCE_RECEIPT_VERSION, 4);
  assert.equal(
    getToolcraftPerformanceReceiptShapeError(legacyReceipt),
    undefined,
  );
  assert.match(
    getToolcraftPerformanceReceiptShapeError({
      ...legacyReceipt,
      version: TOOLCRAFT_PERFORMANCE_RECEIPT_VERSION,
    }),
    /canonical test evidence|resolved test evidence/iu,
  );
});

test("current performance iterations reject legacy targeted reports", async (t) => {
  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  const baseline = await writePassedCheckpointFixture(rootDir);
  await fs.writeFile(
    path.join(rootDir, "src", "app", "app-schema.ts"),
    'export const schema = { mode: "current-iteration" };\n',
  );
  const inventory = await collectToolcraftVerificationInputs(rootDir);
  const verification = createIterationVerification(3, {
    sourceHash: inventory.sourceHash,
  });
  const {
    fixtureResolutionMode: _fixtureResolutionMode,
    fixtureSelector: _fixtureSelector,
    measurements: _measurements,
    requestAuthorityHash: _requestAuthorityHash,
    ...legacyReportFields
  } = verification.targetedPerformanceReport;
  delete verification.performanceComparison;
  verification.targetedPerformanceReport = {
    ...legacyReportFields,
    version: 1,
  };
  verification.targetedPerformanceReportHash =
    createToolcraftTargetedPerformanceReportHash({
      report: verification.targetedPerformanceReport,
      testEvidence: verification.performanceTestEvidence,
    });

  assert.match(
    getToolcraftPerformanceReceiptShapeError({
      baselineEvidenceHash: baseline.performanceEvidence.reportHash,
      baselineSourceHash: baseline.sourceHash,
      changedFiles: ["src/app/app-schema.ts"],
      completedAt: new Date().toISOString(),
      files: inventory.entries,
      kind: "performance-iteration",
      reasonCode: "post-first-working-targeted-verification",
      sourceHash: inventory.sourceHash,
      status: "passed-targeted",
      verification,
      verificationTier: 3,
      version: TOOLCRAFT_PERFORMANCE_RECEIPT_VERSION,
    }),
    /version does not match/iu,
  );
});

test("accepts a passed receipt only while its source inventory is current", async (t) => {
  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  await writePassedCheckpointFixture(rootDir);

  assert.deepEqual(await validateToolcraftPerformanceReceipt({ rootDir }), []);
  await fs.writeFile(
    path.join(rootDir, "src", "app", "app-schema.ts"),
    'export const schema = { mode: "changed" };\n',
  );
  const errors = await validateToolcraftPerformanceReceipt({ rootDir });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /stale/iu);
});

test("rejects manual agent-browser receipts without automated runner proof", async (t) => {
  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  await writePassedCheckpointFixture(rootDir, { runner: "agent-browser" });

  assert.match(
    (await validateToolcraftPerformanceReceipt({ rootDir }))[0],
    /supported runner/iu,
  );
});

test("rejects a receipt whose file inventory does not produce its source hash", async (t) => {
  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  await writePassedCheckpointFixture(rootDir);
  const loaded = await readToolcraftCheckpointBundle(rootDir);
  await writeToolcraftCheckpointBundle({
    bundle: {
      ...loaded.bundle,
      currentPerformance: { ...loaded.bundle.currentPerformance, files: [] },
    },
    rootDir,
  });

  assert.match(
    (await validateToolcraftPerformanceReceipt({ rootDir }))[0],
    /file inventory.*source hash/iu,
  );
});

test("invalidates a checkpoint when the npm dependency graph changes", async (t) => {
  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  const packageLockPath = path.join(rootDir, "package-lock.json");
  await fs.writeFile(
    packageLockPath,
    JSON.stringify({ lockfileVersion: 3, packages: {} }),
  );
  await writePassedCheckpointFixture(rootDir);
  await fs.writeFile(
    packageLockPath,
    JSON.stringify({
      lockfileVersion: 3,
      packages: { "node_modules/example": { version: "2.0.0" } },
    }),
  );

  assert.match(
    (await validateToolcraftPerformanceReceipt({ rootDir }))[0],
    /stale/iu,
  );
});

test("rejects malformed and non-passed receipts", async (t) => {
  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  const bundlePath = getToolcraftCheckpointBundlePath(rootDir);
  await fs.mkdir(path.dirname(bundlePath), { recursive: true });
  await fs.writeFile(bundlePath, "not json");
  const malformedErrors = await validateToolcraftPerformanceReceipt({
    rootDir,
  });
  assert.equal(malformedErrors.length, 1);
  assert.match(malformedErrors[0], /malformed/iu);

  await fs.rm(bundlePath);
  await writePassedCheckpointFixture(rootDir);
  const loaded = await readToolcraftCheckpointBundle(rootDir);
  await writeToolcraftCheckpointBundle({
    bundle: {
      ...loaded.bundle,
      currentPerformance: {
        ...loaded.bundle.currentPerformance,
        status: "failed",
      },
    },
    rootDir,
  });
  const failedErrors = await validateToolcraftPerformanceReceipt({ rootDir });
  assert.equal(failedErrors.length, 1);
  assert.match(failedErrors[0], /passed/iu);
});

test("rejects unsupported current and baseline receipt versions", async (t) => {
  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));

  for (const field of ["currentPerformance", "performanceBaseline"]) {
    await writePassedCheckpointFixture(rootDir);
    const loaded = await readToolcraftCheckpointBundle(rootDir);
    await writeToolcraftCheckpointBundle({
      bundle: {
        ...loaded.bundle,
        [field]: {
          ...loaded.bundle[field],
          version: 2,
        },
      },
      rootDir,
    });
    assert.match(
      (await validateToolcraftPerformanceReceipt({ rootDir }))[0],
      /unsupported version/iu,
    );
  }
});
