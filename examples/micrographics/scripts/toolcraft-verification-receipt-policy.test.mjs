import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  collectToolcraftVerificationInputs,
  getToolcraftPerformanceIterationVerificationError,
  getToolcraftTargetedVerificationContext,
  validateToolcraftPerformanceReceipt,
} from "./toolcraft-verification-receipt.mjs";
import { createToolcraftVerificationSourceHash } from "./toolcraft-verification-inventory.mjs";
import {
  createReceiptFixture,
  writePassedCheckpointFixture,
} from "./toolcraft-verification-receipt-test-helpers.mjs";

test("does not require performance evidence for functional-only Tier 3 and 4 delivery", () => {
  const verification = {
    browserTests: ["browser: focused acceptance"],
    checks: ["typecheck", "build", "playwright-targeted-functional"],
    performancePassIds: [],
    performancePathIds: [],
    performanceTests: [],
    runner: "protected-iteration",
    unitTests: [],
  };

  assert.equal(
    getToolcraftPerformanceIterationVerificationError(verification, 3),
    undefined,
  );
  assert.equal(
    getToolcraftPerformanceIterationVerificationError(verification, 4),
    undefined,
  );
});

test("rejects verification inputs that change during a protected checkpoint", async () => {
  const { assertToolcraftVerificationInputsUnchanged } = await import(
    "./toolcraft-verification-receipt.mjs"
  );
  assert.doesNotThrow(() =>
    assertToolcraftVerificationInputsUnchanged({
      baseline: { entries: [], sourceHash: "same" },
      current: { entries: [], sourceHash: "same" },
      phase: "after build",
    }),
  );
  assert.throws(
    () =>
      assertToolcraftVerificationInputsUnchanged({
        baseline: { entries: [], sourceHash: "before" },
        current: { entries: [], sourceHash: "after" },
        phase: "after Playwright",
      }),
    /verification inputs changed.*after Playwright.*rerun the active protected verification command/iu,
  );
});

test("targeted verification rejects duplicate and noncanonical comparison inventories", async (t) => {
  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  const inventory = await collectToolcraftVerificationInputs(rootDir);
  const duplicateEntries = [...inventory.entries, inventory.entries[0]];
  const noncanonicalEntries = inventory.entries.map((entry, index) =>
    index === 0 ? { ...entry, path: `./${entry.path}` } : entry,
  );

  for (const entries of [duplicateEntries, noncanonicalEntries]) {
    await assert.rejects(
      getToolcraftTargetedVerificationContext({
        comparisonInventory: {
          entries,
          sourceHash: createToolcraftVerificationSourceHash(entries),
        },
        rootDir,
      }),
      /comparison inventory.*duplicate|comparison inventory.*canonical/iu,
    );
  }
});

test("requires a structured receipt instead of prose-only performance claims", async (t) => {
  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  await fs.mkdir(path.join(rootDir, "docs", "toolcraft"), { recursive: true });
  await fs.writeFile(
    path.join(rootDir, "docs", "toolcraft", "agent-worklog.md"),
    "- Run: pnpm verify:perf passed\n",
  );

  const errors = await validateToolcraftPerformanceReceipt({ rootDir });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /performance receipt is missing/iu);
});

test("requires the durable protected baseline even when a current checkpoint exists", async (t) => {
  const rootDir = await createReceiptFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  await writePassedCheckpointFixture(rootDir, { writeBaseline: false });

  assert.match(
    (await validateToolcraftPerformanceReceipt({ rootDir }))[0],
    /performance baseline receipt is missing/iu,
  );
});

test("refuses malformed synthesized targeted evidence", () => {
  assert.match(
    getToolcraftPerformanceIterationVerificationError(undefined, 2, {
      requireResolvedEvidence: true,
    }),
    /targeted iteration verification evidence is malformed/iu,
  );
});
