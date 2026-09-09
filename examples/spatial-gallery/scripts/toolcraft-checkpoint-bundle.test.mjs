import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  createToolcraftCheckpointBundle,
  getToolcraftCheckpointBundleShapeError,
  readToolcraftCheckpointBundle,
  writeToolcraftCheckpointBundle,
} from "./toolcraft-checkpoint-bundle.mjs";
import {
  getToolcraftCheckpointBundlePath,
  getToolcraftLegacyCheckpointReceiptPaths,
} from "./toolcraft-checkpoint-paths.mjs";

async function createFixture() {
  const rootDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "toolcraft-checkpoint-bundle-"),
  );
  return rootDir;
}

test("writes and reads one canonical checkpoint bundle", async (t) => {
  const rootDir = await createFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  const bundle = createToolcraftCheckpointBundle({
    delivery: { kind: "delivery" },
  });

  await writeToolcraftCheckpointBundle({ bundle, rootDir });

  assert.deepEqual(await readToolcraftCheckpointBundle(rootDir), {
    bundle,
    source: "canonical",
  });
  assert.deepEqual(
    JSON.parse(
      await fs.readFile(getToolcraftCheckpointBundlePath(rootDir), "utf8"),
    ),
    bundle,
  );
});

test("rejects malformed or extended bundle envelopes", () => {
  const bundle = createToolcraftCheckpointBundle({
    delivery: { kind: "delivery" },
  });
  assert.equal(getToolcraftCheckpointBundleShapeError(bundle), undefined);
  assert.match(
    getToolcraftCheckpointBundleShapeError({ ...bundle, extra: true }),
    /malformed/iu,
  );
  assert.match(
    getToolcraftCheckpointBundleShapeError({ ...bundle, delivery: null }),
    /malformed/iu,
  );
});

test("assembles legacy receipts only when the canonical bundle is absent", async (t) => {
  const rootDir = await createFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  const paths = getToolcraftLegacyCheckpointReceiptPaths(rootDir);
  await fs.mkdir(path.dirname(paths.delivery), { recursive: true });
  await fs.writeFile(paths.delivery, JSON.stringify({ kind: "legacy-delivery" }));
  await fs.writeFile(
    paths.performanceBaseline,
    JSON.stringify({ kind: "legacy-baseline" }),
  );

  const legacy = await readToolcraftCheckpointBundle(rootDir);
  assert.equal(legacy.source, "legacy");
  assert.deepEqual(legacy.bundle.delivery, { kind: "legacy-delivery" });
  assert.deepEqual(legacy.bundle.performanceBaseline, {
    kind: "legacy-baseline",
  });
  assert.equal(legacy.bundle.currentPerformance, null);

  const canonical = createToolcraftCheckpointBundle({
    delivery: { kind: "canonical-delivery" },
  });
  await writeToolcraftCheckpointBundle({ bundle: canonical, rootDir });
  assert.deepEqual(await readToolcraftCheckpointBundle(rootDir), {
    bundle: canonical,
    source: "canonical",
  });
});

test("fails closed for malformed canonical or orphaned legacy performance", async (t) => {
  const rootDir = await createFixture();
  t.after(() => fs.rm(rootDir, { force: true, recursive: true }));
  const bundlePath = getToolcraftCheckpointBundlePath(rootDir);
  await fs.mkdir(path.dirname(bundlePath), { recursive: true });
  await fs.writeFile(bundlePath, "{");
  assert.match(
    (await readToolcraftCheckpointBundle(rootDir)).error,
    /malformed JSON/iu,
  );

  await fs.rm(bundlePath);
  const paths = getToolcraftLegacyCheckpointReceiptPaths(rootDir);
  await fs.writeFile(
    paths.performanceBaseline,
    JSON.stringify({ kind: "orphan" }),
  );
  assert.match(
    (await readToolcraftCheckpointBundle(rootDir)).error,
    /without a delivery receipt/iu,
  );
});
