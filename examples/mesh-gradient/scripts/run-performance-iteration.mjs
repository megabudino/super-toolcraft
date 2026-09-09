#!/usr/bin/env node

import { realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { executeToolcraftTargetedVerification } from "./toolcraft-targeted-verification-runner.mjs";
import {
  TOOLCRAFT_PERFORMANCE_ITERATION_REASON,
  getToolcraftPerformanceIterationContext,
  writeToolcraftPerformanceIteration,
} from "./toolcraft-verification-receipt.mjs";
import { withToolcraftVerificationLock } from "./toolcraft-verification-lock.mjs";

const defaultProjectDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

export async function runToolcraftPerformanceIteration({
  arguments_ = [],
  projectDir = defaultProjectDir,
} = {}) {
  const resolvedProjectDir = path.resolve(projectDir);
  return withToolcraftVerificationLock(resolvedProjectDir, async () => {
    const context =
      await getToolcraftPerformanceIterationContext(resolvedProjectDir);
    const result = await executeToolcraftTargetedVerification({
      arguments_,
      context,
      projectDir: resolvedProjectDir,
    });
    const receipt = await writeToolcraftPerformanceIteration({
      reasonCode: TOOLCRAFT_PERFORMANCE_ITERATION_REASON,
      rootDir: resolvedProjectDir,
      verification: result.verification,
      verificationTier: result.verificationTier,
    });
    console.log(
      "Recorded current-source Toolcraft targeted performance iteration.",
    );
    return receipt;
  });
}

async function main() {
  await runToolcraftPerformanceIteration({ arguments_: process.argv.slice(2) });
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
