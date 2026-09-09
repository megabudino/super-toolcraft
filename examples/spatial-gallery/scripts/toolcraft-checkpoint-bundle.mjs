import { randomUUID } from "node:crypto";
import path from "node:path";

import {
  getToolcraftCheckpointBundlePath,
  getToolcraftLegacyCheckpointReceiptPaths,
} from "./toolcraft-checkpoint-paths.mjs";
import { writeDurableCheckpointAtomic } from "./toolcraft-checkpoint-durable-fs.mjs";
import { readToolcraftReceiptFile } from "./toolcraft-receipt-file-io.mjs";

export const TOOLCRAFT_CHECKPOINT_BUNDLE_VERSION = 1;

const bundleKeys = Object.freeze([
  "currentPerformance",
  "delivery",
  "kind",
  "performanceBaseline",
  "version",
]);

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value, expectedKeys) {
  if (!isRecord(value)) return false;
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  return (
    actual.length === expected.length &&
    actual.every((key, index) => key === expected[index])
  );
}

function isNullableRecord(value) {
  return value === null || isRecord(value);
}

export function createToolcraftCheckpointBundle({
  currentPerformance = null,
  delivery,
  performanceBaseline = null,
}) {
  return {
    currentPerformance,
    delivery,
    kind: "toolcraft-verification-checkpoint",
    performanceBaseline,
    version: TOOLCRAFT_CHECKPOINT_BUNDLE_VERSION,
  };
}

export function getToolcraftCheckpointBundleShapeError(bundle) {
  if (
    !hasExactKeys(bundle, bundleKeys) ||
    bundle.kind !== "toolcraft-verification-checkpoint" ||
    bundle.version !== TOOLCRAFT_CHECKPOINT_BUNDLE_VERSION ||
    !isRecord(bundle.delivery) ||
    !isNullableRecord(bundle.performanceBaseline) ||
    !isNullableRecord(bundle.currentPerformance)
  ) {
    return "Toolcraft verification checkpoint bundle is malformed or uses an unsupported version.";
  }
  return undefined;
}

async function readCanonicalBundle(rootDir) {
  const loaded = await readToolcraftReceiptFile(
    getToolcraftCheckpointBundlePath(rootDir),
  );
  if (loaded.missing) return { missing: true };
  if (loaded.malformed) {
    return { error: "Toolcraft verification checkpoint bundle is malformed JSON." };
  }
  const shapeError = getToolcraftCheckpointBundleShapeError(loaded.receipt);
  return shapeError
    ? { error: shapeError }
    : { bundle: loaded.receipt, source: "canonical" };
}

async function readLegacyReceipt(filePath, label) {
  const loaded = await readToolcraftReceiptFile(filePath);
  if (loaded.missing) return { missing: true };
  if (loaded.malformed) return { error: `${label} is malformed JSON.` };
  return { receipt: loaded.receipt };
}

async function readLegacyBundle(rootDir) {
  const paths = getToolcraftLegacyCheckpointReceiptPaths(rootDir);
  const [delivery, performanceBaseline, currentPerformance] = await Promise.all([
    readLegacyReceipt(paths.delivery, "Toolcraft legacy delivery receipt"),
    readLegacyReceipt(
      paths.performanceBaseline,
      "Toolcraft legacy performance baseline",
    ),
    readLegacyReceipt(
      paths.currentPerformance,
      "Toolcraft legacy current performance receipt",
    ),
  ]);
  const error =
    delivery.error ?? performanceBaseline.error ?? currentPerformance.error;
  if (error) return { error };
  if (delivery.missing) {
    return performanceBaseline.missing && currentPerformance.missing
      ? { missing: true }
      : {
          error:
            "Toolcraft legacy checkpoint authority contains performance receipts without a delivery receipt.",
        };
  }
  return {
    bundle: createToolcraftCheckpointBundle({
      currentPerformance: currentPerformance.missing
        ? null
        : currentPerformance.receipt,
      delivery: delivery.receipt,
      performanceBaseline: performanceBaseline.missing
        ? null
        : performanceBaseline.receipt,
    }),
    source: "legacy",
  };
}

export async function readToolcraftCheckpointBundle(rootDir) {
  const canonical = await readCanonicalBundle(rootDir);
  if (!canonical.missing) return canonical;
  return readLegacyBundle(rootDir);
}

export async function writeToolcraftCheckpointBundle({
  bundle,
  observeDurabilityBarrier,
  rootDir,
}) {
  const shapeError = getToolcraftCheckpointBundleShapeError(bundle);
  if (shapeError) throw new Error(shapeError);
  const filePath = getToolcraftCheckpointBundlePath(rootDir);
  await writeDurableCheckpointAtomic({
    contents: `${JSON.stringify(bundle, null, 2)}\n`,
    filePath,
    observeDurabilityBarrier,
    phase: "checkpoint-committed",
    temporaryPath: path.join(
      path.dirname(filePath),
      `.checkpoint-${randomUUID()}.tmp`,
    ),
  });
  return bundle;
}

export async function updateToolcraftCheckpointBundle({
  rootDir,
  update,
  observeDurabilityBarrier,
}) {
  if (typeof update !== "function") {
    throw new Error("Toolcraft checkpoint bundle update must be a function.");
  }
  const loaded = await readToolcraftCheckpointBundle(rootDir);
  if (loaded.missing) {
    throw new Error("Toolcraft verification checkpoint bundle is missing.");
  }
  if (loaded.error) throw new Error(loaded.error);
  const bundle = update(loaded.bundle);
  await writeToolcraftCheckpointBundle({
    bundle,
    observeDurabilityBarrier,
    rootDir,
  });
  return bundle;
}
