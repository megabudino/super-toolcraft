#!/usr/bin/env node

import { realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { commitToolcraftDeliveryCheckpoint } from "./toolcraft-checkpoint-transaction.mjs";
import { runToolcraftAggregateFunctionalGate } from "./toolcraft-delivery-command-runner.mjs";
import {
  createExplicitPerformanceDeliveryReceipt,
  createPerformanceCheckpointReceipt,
} from "./toolcraft-delivery-receipt-builder.mjs";
import { measureToolcraftPerformanceCheckpoint } from "./toolcraft-performance-checkpoint-runner.mjs";
import { collectToolcraftVerificationInputs } from "./toolcraft-verification-receipt.mjs";
import { withToolcraftVerificationLock } from "./toolcraft-verification-lock.mjs";

const defaultProjectDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

function assertOperatorArguments(arguments_) {
  const unsupportedArguments = arguments_.filter((argument) => argument !== "--");
  if (unsupportedArguments.length > 0) {
    throw new Error(
      `Toolcraft full performance operator command does not accept arguments: ${unsupportedArguments.join(" ")}. Run Playwright directly for targeted diagnosis.`,
    );
  }
}

async function runToolcraftFullPerformanceCertificationCore({ projectDir }) {
  const inventory = await collectToolcraftVerificationInputs(projectDir);
  await runToolcraftAggregateFunctionalGate({
    baselineInventory: inventory,
    projectDir,
  });
  const measurement = await measureToolcraftPerformanceCheckpoint({
    baselineInventory: inventory,
    projectDir,
  });
  const baseline = createPerformanceCheckpointReceipt({
    evidence: measurement.evidence,
    inventory: measurement.inventory,
  });
  const receipt = createExplicitPerformanceDeliveryReceipt({
    baseline,
    inventory: measurement.inventory,
  });
  await commitToolcraftDeliveryCheckpoint({
    deliveryReceipt: receipt,
    performanceCheckpoint: baseline,
    projectDir,
  });
  return receipt;
}

export async function runToolcraftFullPerformanceCertification({
  projectDir = defaultProjectDir,
} = {}) {
  const resolvedProjectDir = path.resolve(projectDir);
  return withToolcraftVerificationLock(resolvedProjectDir, () => {
    return runToolcraftFullPerformanceCertificationCore({
      projectDir: resolvedProjectDir,
    });
  });
}

async function main() {
  assertOperatorArguments(process.argv.slice(2));
  await runToolcraftFullPerformanceCertification();
}

async function isDirectExecution() {
  if (!process.argv[1]) return false;
  try {
    return (
      (await realpath(process.argv[1])) ===
      (await realpath(fileURLToPath(import.meta.url)))
    );
  } catch {
    return path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
  }
}

if (await isDirectExecution()) {
  await main();
}
