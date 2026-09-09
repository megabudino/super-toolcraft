#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertToolcraftVerificationInputsUnchanged,
  collectToolcraftVerificationInputs,
} from "./toolcraft-verification-inventory.mjs";
import {
  TOOLCRAFT_PERFORMANCE_ITERATION_REASON,
  TOOLCRAFT_PERFORMANCE_RECEIPT_VERSION,
  getToolcraftPerformanceIterationVerificationError,
  getToolcraftPerformanceReceiptShapeError,
} from "./toolcraft-performance-receipt-policy.mjs";
import {
  readToolcraftPerformanceImpactInventory,
  resolveToolcraftChangedPerformanceImpact,
} from "./toolcraft-performance-impact.mjs";
import { collectToolcraftSourceInventory } from "./toolcraft-source-inventory.mjs";
import { collectToolcraftFrameworkOwnedLocalPaths } from "./toolcraft-source-ownership.mjs";

export {
  TOOLCRAFT_PERFORMANCE_ITERATION_REASON,
  TOOLCRAFT_PERFORMANCE_RECEIPT_VERSION,
  assertToolcraftVerificationInputsUnchanged,
  collectToolcraftVerificationInputs,
  getToolcraftPerformanceIterationVerificationError,
};
const acceptedVerificationTiers = new Set([0, 1, 2, 3, 4]);

function compareCodeUnits(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function getVerificationReceiptPath(rootDir, fileName) {
  return path.join(path.resolve(rootDir), ".toolcraft", "verification", fileName);
}

export function getToolcraftPerformanceReceiptPath(rootDir) {
  return getVerificationReceiptPath(rootDir, "performance.json");
}

export function getToolcraftPerformanceBaselineReceiptPath(rootDir) {
  return getVerificationReceiptPath(rootDir, "performance-baseline.json");
}

async function writeReceipt(receiptPath, receipt) {
  await fs.mkdir(path.dirname(receiptPath), { recursive: true });
  const temporaryPath = `${receiptPath}.${process.pid}.tmp`;
  await fs.writeFile(temporaryPath, `${JSON.stringify(receipt, null, 2)}\n`);
  await fs.rename(temporaryPath, receiptPath);
  return receipt;
}

export async function clearToolcraftPerformanceReceipt(rootDir) {
  await fs.rm(getToolcraftPerformanceReceiptPath(rootDir), { force: true });
}

async function readReceipt(receiptPath) {
  let source;
  try {
    source = await fs.readFile(receiptPath, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return { missing: true };
    throw error;
  }
  try {
    return { receipt: JSON.parse(source) };
  } catch {
    return { malformed: true };
  }
}

export function getChangedFiles(previousFiles, currentFiles) {
  const previous = new Map(previousFiles.map((entry) => [entry.path, entry.sha256]));
  const current = new Map(currentFiles.map((entry) => [entry.path, entry.sha256]));
  return [...new Set([...previous.keys(), ...current.keys()])]
    .filter((filePath) => previous.get(filePath) !== current.get(filePath))
    .sort(compareCodeUnits);
}

function arraysEqual(left, right) {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

async function loadDurableBaseline(rootDir) {
  const loaded = await readReceipt(getToolcraftPerformanceBaselineReceiptPath(rootDir));
  if (loaded.missing) {
    return { error: "Toolcraft performance baseline receipt is missing. Run pnpm verify:perf once for the first stable working version." };
  }
  if (loaded.malformed) {
    return { error: "Toolcraft performance baseline receipt is malformed JSON." };
  }
  const shapeError = getToolcraftPerformanceReceiptShapeError(loaded.receipt);
  if (shapeError || loaded.receipt.kind !== "performance-checkpoint") {
    return {
      error:
        shapeError ??
        "Toolcraft performance baseline must be a protected passed performance checkpoint.",
    };
  }
  return { receipt: loaded.receipt };
}

async function getProductProductionPaths(rootDir) {
  const protectedFilePaths = await collectToolcraftFrameworkOwnedLocalPaths(rootDir);
  const sourceInventory = await collectToolcraftSourceInventory({
    protectedFilePaths,
    rootDir,
  });
  return sourceInventory.entries
    .filter((entry) => entry.owner === "product" && entry.role === "production")
    .map((entry) => entry.repoPath);
}

export async function validateToolcraftCurrentPerformanceImpactInventory({
  knownPassIds = [],
  rootDir,
}) {
  return readToolcraftPerformanceImpactInventory(rootDir, {
    knownPassIds,
    productProductionPaths: await getProductProductionPaths(rootDir),
  });
}

async function resolveCurrentPerformanceImpact(rootDir, changedFiles) {
  const { inventory } = await readToolcraftPerformanceImpactInventory(rootDir, {
    productProductionPaths: await getProductProductionPaths(rootDir),
  });
  return resolveToolcraftChangedPerformanceImpact({ changedFiles, inventory });
}

function getIterationImpactError(verification, verificationTier, impact) {
  if (verificationTier < impact.minimumTier) {
    return `Toolcraft changed implementation requires verification Tier ${impact.minimumTier} or higher; received Tier ${verificationTier}.`;
  }
  if (
    JSON.stringify(verification.performancePassIds) !==
    JSON.stringify(impact.performancePassIds)
  ) {
    return "Toolcraft targeted iteration pass evidence does not match changed implementation ownership.";
  }
  if (
    impact.performancePassIds.length > 0 &&
    verification.performancePathIds.length === 0
  ) {
    return "Toolcraft performance-impacting changes require protected canonical path evidence.";
  }
  if (impact.requiresFunctionalBrowser && verification.browserTests.length === 0) {
    return "Toolcraft functional product changes require a targeted functional browser test.";
  }
  return undefined;
}

export async function getToolcraftPerformanceIterationContext(rootDir) {
  const baseline = await loadDurableBaseline(rootDir);
  if (baseline.error) throw new Error(baseline.error);
  const inventory = await collectToolcraftVerificationInputs(rootDir);
  const changedFiles = getChangedFiles(baseline.receipt.files, inventory.entries);
  const impact = await resolveCurrentPerformanceImpact(rootDir, changedFiles);
  return { baseline: baseline.receipt, changedFiles, impact, inventory };
}

export async function validateToolcraftPerformanceReceipt({ rootDir }) {
  const loaded = await readReceipt(getToolcraftPerformanceReceiptPath(rootDir));
  if (loaded.missing) {
    return [
      "Toolcraft performance receipt is missing. Run the required first-working checkpoint or record the current post-first-working iteration.",
    ];
  }
  if (loaded.malformed) {
    return ["Toolcraft performance receipt is malformed JSON."];
  }

  const shapeError = getToolcraftPerformanceReceiptShapeError(loaded.receipt);
  if (shapeError) return [shapeError];

  const baseline = await loadDurableBaseline(rootDir);
  if (baseline.error) return [baseline.error];

  if (loaded.receipt.kind === "performance-checkpoint") {
    if (loaded.receipt.sourceHash !== baseline.receipt.sourceHash) {
      return [
        "Toolcraft current performance checkpoint does not match the durable performance baseline.",
      ];
    }
  } else {
    if (loaded.receipt.baselineSourceHash !== baseline.receipt.sourceHash) {
      return [
        "Toolcraft performance iteration does not match the durable baseline checkpoint.",
      ];
    }
    if (
      loaded.receipt.baselineEvidenceHash !==
      baseline.receipt.performanceEvidence.reportHash
    ) {
      return [
        "Toolcraft performance iteration does not match the durable baseline evidence.",
      ];
    }
    const expectedChangedFiles = getChangedFiles(
      baseline.receipt.files,
      loaded.receipt.files,
    );
    if (!arraysEqual(loaded.receipt.changedFiles, expectedChangedFiles)) {
      return [
        "Toolcraft performance iteration changed-file inventory does not match its durable baseline.",
      ];
    }
    let impact;
    try {
      impact = await resolveCurrentPerformanceImpact(rootDir, expectedChangedFiles);
    } catch (error) {
      return [error instanceof Error ? error.message : String(error)];
    }
    const impactError = getIterationImpactError(
      loaded.receipt.verification,
      loaded.receipt.verificationTier,
      impact,
    );
    if (impactError) return [impactError];
  }

  const inventory = await collectToolcraftVerificationInputs(rootDir);
  if (loaded.receipt.sourceHash !== inventory.sourceHash) {
    return [
      "Toolcraft performance receipt is stale because product or verification inputs changed after the recorded verification pass.",
    ];
  }
  return [];
}

export async function writeToolcraftPerformanceIteration({
  reasonCode,
  rootDir,
  verification,
  verificationTier,
}) {
  if (reasonCode !== TOOLCRAFT_PERFORMANCE_ITERATION_REASON) {
    throw new Error(
      `Toolcraft performance iteration reason must be ${TOOLCRAFT_PERFORMANCE_ITERATION_REASON}.`,
    );
  }
  if (!acceptedVerificationTiers.has(verificationTier)) {
    throw new Error("Toolcraft post-first-working iteration tier must be 0, 1, 2, 3, or 4.");
  }
  const verificationError = getToolcraftPerformanceIterationVerificationError(
    verification,
    verificationTier,
  );
  if (verificationError) throw new Error(verificationError);

  const baseline = await loadDurableBaseline(rootDir);
  if (baseline.error) throw new Error(baseline.error);

  const inventory = await collectToolcraftVerificationInputs(rootDir);
  const changedFiles = getChangedFiles(baseline.receipt.files, inventory.entries);
  if (changedFiles.length === 0) {
    return writeReceipt(
      getToolcraftPerformanceReceiptPath(rootDir),
      baseline.receipt,
    );
  }
  const impact = await resolveCurrentPerformanceImpact(rootDir, changedFiles);
  const impactError = getIterationImpactError(
    verification,
    verificationTier,
    impact,
  );
  if (impactError) throw new Error(impactError);

  return writeReceipt(getToolcraftPerformanceReceiptPath(rootDir), {
    baselineEvidenceHash: baseline.receipt.performanceEvidence.reportHash,
    baselineSourceHash: baseline.receipt.sourceHash,
    changedFiles,
    completedAt: new Date().toISOString(),
    files: inventory.entries,
    kind: "performance-iteration",
    reasonCode,
    sourceHash: inventory.sourceHash,
    status: "passed-targeted",
    verification,
    verificationTier,
    version: TOOLCRAFT_PERFORMANCE_RECEIPT_VERSION,
  });
}

async function runCli() {
  const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const [command = "validate", ...args] = process.argv.slice(2);

  if (command !== "validate") {
    throw new Error(`Unknown Toolcraft verification receipt command: ${command}.`);
  }
  const errors = await validateToolcraftPerformanceReceipt({ rootDir: projectDir });
  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }
  console.log("Toolcraft performance receipt and durable baseline are current and valid.");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCli().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
