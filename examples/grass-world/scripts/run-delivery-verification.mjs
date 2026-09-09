#!/usr/bin/env node

import { mkdir, realpath, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  TOOLCRAFT_DELIVERY_RECEIPT_VERSION,
  getToolcraftDeliveryReceiptPath,
  getToolcraftDeliveryReceiptShapeError,
  readToolcraftDeliveryReceipt,
  validateToolcraftDeliveryReceipt,
} from "./toolcraft-delivery-receipt.mjs";
import {
  runToolcraftAggregateFunctionalGate,
  runToolcraftDeliveryCommand,
  runToolcraftDeliveryPackageScript,
} from "./toolcraft-delivery-command-runner.mjs";
import { measureToolcraftPerformanceCheckpoint } from "./toolcraft-performance-checkpoint-runner.mjs";
import { TOOLCRAFT_PERFORMANCE_RECEIPT_VERSION } from "./toolcraft-performance-receipt-policy.mjs";
import { executeToolcraftTargetedVerification } from "./toolcraft-targeted-verification-runner.mjs";
import {
  collectToolcraftVerificationInputs,
  getToolcraftPerformanceBaselineReceiptPath,
  getToolcraftPerformanceReceiptPath,
  getToolcraftTargetedVerificationContext,
  readToolcraftDurablePerformanceBaseline,
} from "./toolcraft-verification-receipt.mjs";
import { withToolcraftVerificationLock } from "./toolcraft-verification-lock.mjs";

const defaultProjectDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const aggregateChecks = [
  "integrity",
  "ai-check",
  "test",
  "build",
  "playwright-functional",
  "playwright-performance",
];

function parseArguments(arguments_) {
  const targetedArguments = [];
  let requestedReason;
  for (const argument of arguments_) {
    if (argument === "--") continue;
    if (argument.startsWith("--reason=")) {
      if (requestedReason !== undefined) {
        throw new Error("Toolcraft delivery verification accepts one --reason.");
      }
      requestedReason = argument.slice("--reason=".length);
      continue;
    }
    if (
      argument.startsWith("--tier=") ||
      argument.startsWith("--unit-test=") ||
      argument.startsWith("--browser-test=") ||
      argument.startsWith("--performance-test=")
    ) {
      targetedArguments.push(argument);
      continue;
    }
    throw new Error(`Unsupported Toolcraft delivery argument: ${argument}`);
  }
  if (
    requestedReason !== undefined &&
    requestedReason !== "explicit-performance-work"
  ) {
    throw new Error(
      "Toolcraft delivery --reason must be explicit-performance-work.",
    );
  }
  return { requestedReason, targetedArguments };
}

async function writeCheckpointFile(receiptPath, receipt) {
  const temporaryPath = `${receiptPath}.${process.pid}.tmp`;
  await mkdir(path.dirname(receiptPath), { recursive: true });
  await writeFile(temporaryPath, `${JSON.stringify(receipt, null, 2)}\n`);
  await rename(temporaryPath, receiptPath);
}

async function writeDeliveryReceipt(projectDir, receipt) {
  const shapeError = getToolcraftDeliveryReceiptShapeError(receipt);
  if (shapeError) throw new Error(shapeError);
  await writeCheckpointFile(getToolcraftDeliveryReceiptPath(projectDir), receipt);
  return receipt;
}

function createAggregateDeliveryReceipt({ baseline, inventory, mode }) {
  return {
    baselineEvidenceHash: baseline.performanceEvidence.reportHash,
    baselineSourceHash: baseline.sourceHash,
    checks: [...aggregateChecks],
    completedAt: new Date().toISOString(),
    files: inventory.entries,
    kind: "delivery-verification",
    mode,
    runner: "protected-delivery",
    sourceHash: inventory.sourceHash,
    status: "passed",
    version: TOOLCRAFT_DELIVERY_RECEIPT_VERSION,
  };
}

function createOrdinaryDeliveryReceipt({ baseline, comparisonReceipt, result }) {
  return {
    baselineEvidenceHash: baseline.performanceEvidence.reportHash,
    baselineSourceHash: baseline.sourceHash,
    changedFiles: result.context.changedFiles,
    checks: ["integrity", "ai-check", "docs-check", ...result.verification.checks],
    comparisonFiles: comparisonReceipt.files,
    comparisonSourceHash: comparisonReceipt.sourceHash,
    completedAt: new Date().toISOString(),
    files: result.verifiedInventory.entries,
    kind: "delivery-verification",
    mode: "ordinary",
    runner: "protected-delivery",
    sourceHash: result.verifiedInventory.sourceHash,
    status: "passed",
    verification: result.verification,
    verificationTier: result.verificationTier,
    version: TOOLCRAFT_DELIVERY_RECEIPT_VERSION,
  };
}

async function writePerformanceCheckpoint({
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

async function runAggregateDelivery({
  baseline,
  mode,
  projectDir,
}) {
  const inventory = await collectToolcraftVerificationInputs(projectDir);
  await runToolcraftAggregateFunctionalGate({
    baselineInventory: inventory,
    projectDir,
  });

  let currentBaseline = baseline?.receipt;
  const baselineMatchesSource =
    currentBaseline?.sourceHash === inventory.sourceHash;
  if (mode === "explicit-performance" || !baselineMatchesSource) {
    const measurement = await measureToolcraftPerformanceCheckpoint({
      baselineInventory: inventory,
      projectDir,
    });
    currentBaseline = await writePerformanceCheckpoint({
      checkpointReason:
        mode === "explicit-performance"
          ? "explicit-performance-work"
          : "first-working-version",
      evidence: measurement.evidence,
      inventory: measurement.inventory,
      projectDir,
    });
  }
  if (!currentBaseline) {
    throw new Error("Toolcraft aggregate delivery did not produce a performance baseline.");
  }
  const receipt = createAggregateDeliveryReceipt({
    baseline: currentBaseline,
    inventory,
    mode: mode === "explicit-performance" ? mode : "first-stable",
  });
  await writeDeliveryReceipt(projectDir, receipt);
  const errors = await validateToolcraftDeliveryReceipt({ rootDir: projectDir });
  if (errors.length > 0) throw new Error(errors.join("\n"));
  return receipt;
}

async function runOrdinaryDelivery({
  baseline,
  delivery,
  projectDir,
  targetedArguments,
}) {
  await runToolcraftDeliveryCommand(
    process.execPath,
    [path.join(projectDir, "scripts", "check-toolcraft-integrity.mjs")],
    { cwd: projectDir },
  );
  await runToolcraftDeliveryPackageScript(projectDir, "ai:check");
  await runToolcraftDeliveryPackageScript(projectDir, "docs:check");
  const context = await getToolcraftTargetedVerificationContext({
    comparisonInventory: {
      entries: delivery.receipt.files,
      sourceHash: delivery.receipt.sourceHash,
    },
    rootDir: projectDir,
  });
  if (context.changedFiles.length === 0) {
    console.log("Toolcraft delivery inputs are unchanged; delivery remains current.");
    return delivery.receipt;
  }
  const result = await executeToolcraftTargetedVerification({
    arguments_: targetedArguments,
    context,
    projectDir,
  });
  const receipt = createOrdinaryDeliveryReceipt({
    baseline: baseline.receipt,
    comparisonReceipt: delivery.receipt,
    result: { ...result, context },
  });
  await writeDeliveryReceipt(projectDir, receipt);
  const errors = await validateToolcraftDeliveryReceipt({ rootDir: projectDir });
  if (errors.length > 0) throw new Error(errors.join("\n"));
  return receipt;
}

export async function runToolcraftDeliveryVerification({
  arguments_ = [],
  projectDir = defaultProjectDir,
} = {}) {
  const resolvedProjectDir = path.resolve(projectDir);
  const { requestedReason, targetedArguments } = parseArguments(arguments_);
  return withToolcraftVerificationLock(resolvedProjectDir, async () => {
    const baseline =
      await readToolcraftDurablePerformanceBaseline(resolvedProjectDir);
    if (baseline.error && !baseline.missing) throw new Error(baseline.error);
    const delivery = await readToolcraftDeliveryReceipt(resolvedProjectDir);
    if (delivery.error) throw new Error(delivery.error);
    const deliveryBaselineMismatch =
      !delivery.missing &&
      !baseline.missing &&
      (delivery.receipt.baselineSourceHash !== baseline.receipt.sourceHash ||
        delivery.receipt.baselineEvidenceHash !==
          baseline.receipt.performanceEvidence.reportHash);

    if (requestedReason === "explicit-performance-work") {
      if (baseline.missing || delivery.missing) {
        throw new Error(
          "Explicit performance delivery requires an existing durable baseline and prior delivery receipt.",
        );
      }
      if (targetedArguments.length > 0) {
        throw new Error(
          "Explicit performance delivery does not accept targeted test selectors.",
        );
      }
      return runAggregateDelivery({
        baseline,
        mode: "explicit-performance",
        projectDir: resolvedProjectDir,
      });
    }

    if (deliveryBaselineMismatch) {
      throw new Error(
        "Toolcraft delivery receipt does not match the durable performance baseline. Rerun with --reason=explicit-performance-work to restore one coherent delivery state.",
      );
    }

    if (delivery.missing) {
      if (targetedArguments.length > 0) {
        throw new Error(
          "First stable delivery does not accept targeted selectors; run pnpm verify:delivery without tier or test arguments.",
        );
      }
      return runAggregateDelivery({
        baseline: baseline.missing ? undefined : baseline,
        mode: "first-stable",
        projectDir: resolvedProjectDir,
      });
    }
    if (baseline.missing) {
      throw new Error(
        "Toolcraft delivery receipt exists without its durable performance baseline.",
      );
    }
    return runOrdinaryDelivery({
      baseline,
      delivery,
      projectDir: resolvedProjectDir,
      targetedArguments,
    });
  });
}

async function main() {
  await runToolcraftDeliveryVerification({ arguments_: process.argv.slice(2) });
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
