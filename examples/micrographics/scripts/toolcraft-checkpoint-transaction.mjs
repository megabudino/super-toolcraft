import path from "node:path";

import {
  createToolcraftCheckpointBundle,
  readToolcraftCheckpointBundle,
  writeToolcraftCheckpointBundle,
} from "./toolcraft-checkpoint-bundle.mjs";
import { assertDeliveryCheckpointState } from "./toolcraft-checkpoint-delivery-state.mjs";
import { isToolcraftTargetedDeliveryMode } from "./toolcraft-delivery-receipt.mjs";
import {
  finalizeToolcraftTargetedExecutionAuthority,
  releaseToolcraftTargetedExecutionAuthority,
  reserveToolcraftTargetedExecutionAuthority,
} from "./toolcraft-targeted-execution-authority.mjs";

const allowedOptionKeys = new Set([
  "deliveryReceipt",
  "observeDurabilityBarrier",
  "performanceCheckpoint",
  "projectDir",
  "targetedExecutionAuthority",
]);

function assertCommitOptions(options) {
  if (
    typeof options !== "object" ||
    options === null ||
    Array.isArray(options) ||
    !Object.keys(options).every((key) => allowedOptionKeys.has(key)) ||
    typeof options.projectDir !== "string" ||
    (options.observeDurabilityBarrier !== undefined &&
      typeof options.observeDurabilityBarrier !== "function")
  ) {
    throw new Error(
      "Toolcraft delivery checkpoint commit options are malformed or unsupported.",
    );
  }
}

function getExistingAuthority(loaded) {
  if (loaded.missing) {
    return { currentPerformance: null, performanceBaseline: null };
  }
  if (loaded.error) throw new Error(loaded.error);
  return loaded.bundle;
}

export async function commitToolcraftDeliveryCheckpoint(options) {
  assertCommitOptions(options);
  const {
    deliveryReceipt,
    observeDurabilityBarrier,
    performanceCheckpoint,
    projectDir,
    targetedExecutionAuthority,
  } = options;
  const resolvedProjectDir = path.resolve(projectDir);
  const loaded = await readToolcraftCheckpointBundle(resolvedProjectDir);
  const existing = getExistingAuthority(loaded);
  const writesPerformanceCheckpoint = performanceCheckpoint !== undefined;
  const previousDeliveryReceipt = existing.delivery;
  const candidate = createToolcraftCheckpointBundle({
    currentPerformance: writesPerformanceCheckpoint
      ? performanceCheckpoint
      : existing.currentPerformance,
    delivery: deliveryReceipt,
    performanceBaseline: writesPerformanceCheckpoint
      ? performanceCheckpoint
      : existing.performanceBaseline,
  });

  await assertDeliveryCheckpointState({
    baselineReceipt: candidate.performanceBaseline ?? undefined,
    currentPerformanceReceipt: candidate.currentPerformance ?? undefined,
    deliveryReceipt: candidate.delivery,
    previousDeliveryReceipt,
    projectDir: resolvedProjectDir,
    writesPerformanceCheckpoint,
  });
  let targetedExecutionReservation;
  if (isToolcraftTargetedDeliveryMode(deliveryReceipt.mode)) {
    targetedExecutionReservation = reserveToolcraftTargetedExecutionAuthority({
      authority: targetedExecutionAuthority,
      deliveryReceipt,
      projectDir: resolvedProjectDir,
    });
  }
  let durablyCommitted = false;
  try {
    await writeToolcraftCheckpointBundle({
      bundle: candidate,
      observeDurabilityBarrier: async (event) => {
        if (event.phase === "checkpoint-committed") {
          durablyCommitted = true;
        }
        await observeDurabilityBarrier?.(event);
      },
      rootDir: resolvedProjectDir,
    });
    durablyCommitted = true;
    if (targetedExecutionReservation !== undefined) {
      finalizeToolcraftTargetedExecutionAuthority(targetedExecutionReservation);
      targetedExecutionReservation = undefined;
    }
  } catch (error) {
    if (targetedExecutionReservation !== undefined) {
      if (durablyCommitted) {
        finalizeToolcraftTargetedExecutionAuthority(
          targetedExecutionReservation,
        );
      } else {
        releaseToolcraftTargetedExecutionAuthority(
          targetedExecutionReservation,
        );
      }
    }
    throw error;
  }

  // Authority is final before post-write reads because the bundle is durable.
  const committed = await readToolcraftCheckpointBundle(resolvedProjectDir);
  if (
    committed.error ||
    committed.missing ||
    committed.source !== "canonical"
  ) {
    throw new Error(
      committed.error ??
        "Toolcraft committed verification checkpoint bundle is missing.",
    );
  }
  await assertDeliveryCheckpointState({
    baselineReceipt: committed.bundle.performanceBaseline ?? undefined,
    currentPerformanceReceipt: writesPerformanceCheckpoint
      ? (committed.bundle.currentPerformance ?? undefined)
      : undefined,
    deliveryReceipt: committed.bundle.delivery,
    previousDeliveryReceipt,
    projectDir: resolvedProjectDir,
    writesPerformanceCheckpoint,
  });
}
