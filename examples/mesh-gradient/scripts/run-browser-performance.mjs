#!/usr/bin/env node

import { access, mkdir, realpath, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import spawn from "cross-spawn";

import {
  TOOLCRAFT_PERFORMANCE_RECEIPT_VERSION,
  assertToolcraftVerificationInputsUnchanged,
  collectToolcraftVerificationInputs,
  getToolcraftPerformanceBaselineReceiptPath,
  getToolcraftPerformanceReceiptPath,
  readToolcraftDurablePerformanceBaseline,
} from "./toolcraft-verification-receipt.mjs";
import { measureToolcraftPerformanceCheckpoint } from "./toolcraft-performance-checkpoint-runner.mjs";
import { withToolcraftVerificationLock } from "./toolcraft-verification-lock.mjs";

const defaultProjectDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

function getBinaryPath(projectDir, name) {
  return path.join(
    projectDir,
    "node_modules",
    ".bin",
    process.platform === "win32" ? `${name}.cmd` : name,
  );
}

function runBinary(binaryPath, args, { cwd, env = process.env } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(binaryPath, args, { cwd, env, stdio: "inherit" });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`${path.basename(binaryPath)} exited after signal ${signal}.`));
        return;
      }
      if (code !== 0) {
        reject(new Error(`${path.basename(binaryPath)} exited with code ${code ?? 1}.`));
        return;
      }
      resolve();
    });
  });
}

async function writeCheckpointFile(receiptPath, receipt) {
  const temporaryPath = `${receiptPath}.${process.pid}.tmp`;
  await mkdir(path.dirname(receiptPath), { recursive: true });
  await writeFile(temporaryPath, `${JSON.stringify(receipt, null, 2)}\n`);
  await rename(temporaryPath, receiptPath);
}

async function writeToolcraftPerformanceCheckpointReceipts({
  checkpointReason,
  evidence,
  inventory,
  projectDir,
}) {
  const receipt = {
    checkpointReason,
    completedAt: new Date().toISOString(),
    files: inventory.entries,
    kind: "performance-checkpoint",
    performanceEvidence: evidence,
    runner: "protected-playwright",
    sourceHash: inventory.sourceHash,
    status: "passed",
    version: TOOLCRAFT_PERFORMANCE_RECEIPT_VERSION,
  };
  await writeCheckpointFile(
    getToolcraftPerformanceBaselineReceiptPath(projectDir),
    receipt,
  );
  await writeCheckpointFile(getToolcraftPerformanceReceiptPath(projectDir), receipt);
  return receipt;
}

export async function runToolcraftPerformanceCheckpoint({
  projectDir = defaultProjectDir,
  requestedReason,
} = {}) {
  const resolvedProjectDir = path.resolve(projectDir);
  return withToolcraftVerificationLock(resolvedProjectDir, async () => {
  const baseline =
    await readToolcraftDurablePerformanceBaseline(resolvedProjectDir);
  if (baseline.error && !baseline.missing) throw new Error(baseline.error);
  const hasDurableBaseline = !baseline.missing;
  if (hasDurableBaseline && requestedReason !== "explicit-performance-work") {
    throw new Error(
      "A durable performance baseline already exists. Use post-first-working targeted verification for normal iterations; rerun the full checkpoint only for explicit performance work with --reason=explicit-performance-work.",
    );
  }
  if (!hasDurableBaseline && requestedReason !== undefined) {
    throw new Error(
      "The first working performance checkpoint must run without --reason; explicit-performance-work refresh is only valid after a durable baseline exists.",
    );
  }

  const checkpointReason = hasDurableBaseline
    ? "explicit-performance-work"
    : "first-working-version";
  const protectedInventory =
    await collectToolcraftVerificationInputs(resolvedProjectDir);
  const playwrightBin = getBinaryPath(resolvedProjectDir, "playwright");
  const tscBin = getBinaryPath(resolvedProjectDir, "tsc");
  const viteBin = getBinaryPath(resolvedProjectDir, "vite");
  await Promise.all([playwrightBin, tscBin, viteBin].map((filePath) => access(filePath)));
  await runBinary(tscBin, ["-p", "tsconfig.json", "--noEmit"], {
    cwd: resolvedProjectDir,
  });
  await runBinary(viteBin, ["build"], { cwd: resolvedProjectDir });
  assertToolcraftVerificationInputsUnchanged({
    baseline: protectedInventory,
    current: await collectToolcraftVerificationInputs(resolvedProjectDir),
    phase: "during performance checkpoint preparation",
  });
  await runBinary(playwrightBin, ["install", "chromium"], {
    cwd: resolvedProjectDir,
  });
  const measurement = await measureToolcraftPerformanceCheckpoint({
    baselineInventory: protectedInventory,
    projectDir: resolvedProjectDir,
  });
  return writeToolcraftPerformanceCheckpointReceipts({
    checkpointReason,
    evidence: measurement.evidence,
    inventory: measurement.inventory,
    projectDir: resolvedProjectDir,
  });
  });
}

function readCheckpointReason(arguments_) {
  const reasonArguments = arguments_.filter((argument) =>
    argument.startsWith("--reason="),
  );
  const unsupportedArguments = arguments_.filter(
    (argument) => argument !== "--" && !argument.startsWith("--reason="),
  );
  if (unsupportedArguments.length > 0) {
    throw new Error(
      `Toolcraft protected performance checkpoints do not accept Playwright arguments: ${unsupportedArguments.join(" ")}. Run Playwright directly for targeted diagnosis.`,
    );
  }
  if (reasonArguments.length > 1) {
    throw new Error("Toolcraft performance checkpoint accepts at most one --reason.");
  }
  const requestedReason = reasonArguments[0]?.slice("--reason=".length);
  if (
    requestedReason !== undefined &&
    requestedReason !== "explicit-performance-work"
  ) {
    throw new Error(
      "Toolcraft performance checkpoint --reason must be explicit-performance-work.",
    );
  }
  return requestedReason;
}

async function main() {
  await runToolcraftPerformanceCheckpoint({
    requestedReason: readCheckpointReason(process.argv.slice(2)),
  });
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
