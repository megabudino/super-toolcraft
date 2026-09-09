#!/usr/bin/env node

import { realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { runToolcraftDeliveryVerification } from "./run-delivery-verification.mjs";

const defaultProjectDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

export async function runToolcraftPerformanceIteration({
  arguments_ = [],
  projectDir = defaultProjectDir,
} = {}) {
  const resolvedProjectDir = path.resolve(projectDir);
  const receipt = await runToolcraftDeliveryVerification({
    arguments_: ["--reason=performance-iteration", ...arguments_],
    projectDir: resolvedProjectDir,
  });
  console.log(
    "Recorded Toolcraft performance iteration through protected delivery.",
  );
  return receipt;
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
