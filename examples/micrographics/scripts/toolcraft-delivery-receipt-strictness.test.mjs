import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  getToolcraftDeliveryReceiptShapeError,
  validateToolcraftDeliveryReceipt,
} from "./toolcraft-delivery-receipt.mjs";
import {
  createExplicitPerformanceDeliveryReceipt,
  createOrdinaryDeliveryReceipt,
  createPrototypeDeliveryReceipt,
  writeDeliveryReceiptFixture,
} from "./toolcraft-delivery-receipt-test-helpers.mjs";
import { collectToolcraftVerificationInputs } from "./toolcraft-verification-receipt.mjs";
import { createToolcraftVerificationSourceHash } from "./toolcraft-verification-inventory.mjs";
import {
  createIterationVerification,
  createPerformanceSmokeEvidenceFixture,
  createReceiptFixture,
  writePassedCheckpointFixture,
} from "./toolcraft-verification-receipt-test-helpers.mjs";

test("rejects duplicate and non-canonical delivery inventories", async (t) => {
  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  const inventory = await collectToolcraftVerificationInputs(rootDir);
  assert.ok(inventory.entries.length > 1);
  const firstPath = inventory.entries[0].path;
  const withFirstPath = (replacement) =>
    inventory.entries.map((entry, index) =>
      index === 0 ? { ...entry, path: replacement } : entry,
    );
  const adversarialEntries = [
    [...inventory.entries, inventory.entries[0]],
    withFirstPath(`./${firstPath}`),
    withFirstPath(`/${firstPath}`),
    withFirstPath(`C:/${firstPath}`),
    withFirstPath(firstPath.replace("/", "\\")),
    withFirstPath(`src/../${firstPath}`),
    withFirstPath(firstPath.replace("/", "//")),
    [...inventory.entries].reverse(),
  ];

  for (const entries of adversarialEntries) {
    const adversarialInventory = {
      entries,
      sourceHash: createToolcraftVerificationSourceHash(entries),
    };
    for (const receipt of [
      createPrototypeDeliveryReceipt(adversarialInventory),
      createOrdinaryDeliveryReceipt({
        comparisonInventory: adversarialInventory,
        inventory,
      }),
    ]) {
      assert.match(
        getToolcraftDeliveryReceiptShapeError(receipt),
        /inventory|duplicate|canonical|order/iu,
      );
      await writeDeliveryReceiptFixture(rootDir, receipt);
      assert.match(
        (await validateToolcraftDeliveryReceipt({ rootDir }))[0],
        /inventory|duplicate|canonical|order/iu,
      );
    }
  }
});

test("rejects cross-mode authority fields at runtime", async (t) => {
  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  const baseline = await writePassedCheckpointFixture(rootDir, {
    checkpointReason: "explicit-performance-work",
  });
  const inventory = await collectToolcraftVerificationInputs(rootDir);
  const verification = createIterationVerification(0);
  const ordinaryFields = {
    changedFiles: [],
    comparisonFiles: inventory.entries,
    comparisonSourceHash: inventory.sourceHash,
    verification,
    verificationTier: 0,
  };

  for (const receipt of [
    { ...createPrototypeDeliveryReceipt(inventory), ...ordinaryFields },
    {
      ...createExplicitPerformanceDeliveryReceipt(inventory, baseline),
      ...ordinaryFields,
    },
    {
      ...createExplicitPerformanceDeliveryReceipt(inventory, baseline),
      smokeEvidence: createPerformanceSmokeEvidenceFixture(inventory.sourceHash),
    },
    {
      ...createOrdinaryDeliveryReceipt({
        baseline,
        comparisonInventory: inventory,
        inventory,
      }),
      smokeEvidence: createPerformanceSmokeEvidenceFixture(inventory.sourceHash),
    },
  ]) {
    assert.match(
      getToolcraftDeliveryReceiptShapeError(receipt),
      /malformed|unsupported/iu,
    );
  }
});

test("ordinary delivery still validates comparison and current source evidence", async (t) => {
  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  const inventory = await collectToolcraftVerificationInputs(rootDir);
  const receipt = createOrdinaryDeliveryReceipt({
    comparisonInventory: inventory,
    inventory,
  });
  await writeDeliveryReceiptFixture(rootDir, {
    ...receipt,
    changedFiles: ["src/app/app-schema.ts"],
  });
  assert.match(
    (await validateToolcraftDeliveryReceipt({ rootDir }))[0],
    /changed-file (?:evidence|inventory)/iu,
  );

  await writeDeliveryReceiptFixture(rootDir, receipt);
  await fs.writeFile(
    path.join(rootDir, "src", "app", "app-schema.ts"),
    'export const schema = { mode: "changed" };\n',
  );
  assert.match(
    (await validateToolcraftDeliveryReceipt({ rootDir }))[0],
    /stale/iu,
  );
});

test("ordinary shape rejects changed files that do not match its inventories", async (t) => {
  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  const comparisonInventory = await collectToolcraftVerificationInputs(rootDir);
  await fs.writeFile(
    path.join(rootDir, "src", "app", "app-schema.ts"),
    'export const schema = { mode: "changed" };\n',
  );
  const inventory = await collectToolcraftVerificationInputs(rootDir);
  const receipt = createOrdinaryDeliveryReceipt({
    comparisonInventory,
    inventory,
  });

  assert.match(
    getToolcraftDeliveryReceiptShapeError(receipt),
    /changed-file.*inventor|changed files.*comparison/iu,
  );
  assert.equal(
    getToolcraftDeliveryReceiptShapeError({
      ...receipt,
      changedFiles: ["src/app/app-schema.ts"],
    }),
    undefined,
  );
});
