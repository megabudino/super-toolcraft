import {
  readToolcraftCheckpointBundle,
} from "./toolcraft-checkpoint-bundle.mjs";
import {
  assertToolcraftVerificationInputsUnchanged,
  collectToolcraftVerificationInputs,
  getToolcraftVerificationInventoryError,
} from "./toolcraft-verification-inventory.mjs";
import {
  TOOLCRAFT_EXPLICIT_PERFORMANCE_REASON,
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
  TOOLCRAFT_EXPLICIT_PERFORMANCE_REASON,
  TOOLCRAFT_PERFORMANCE_ITERATION_REASON,
  TOOLCRAFT_PERFORMANCE_RECEIPT_VERSION,
  assertToolcraftVerificationInputsUnchanged,
  collectToolcraftVerificationInputs,
  getToolcraftPerformanceIterationVerificationError,
};

function compareCodeUnits(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function arraysEqual(left, right) {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

export function getChangedFiles(previousFiles, currentFiles) {
  const previous = new Map(previousFiles.map((entry) => [entry.path, entry.sha256]));
  const current = new Map(currentFiles.map((entry) => [entry.path, entry.sha256]));
  return [...new Set([...previous.keys(), ...current.keys()])]
    .filter((filePath) => previous.get(filePath) !== current.get(filePath))
    .sort(compareCodeUnits);
}

export async function readToolcraftDurablePerformanceBaseline(rootDir) {
  const loaded = await readToolcraftCheckpointBundle(rootDir);
  if (loaded.error) return { error: loaded.error };
  if (loaded.missing || loaded.bundle.performanceBaseline === null) {
    return {
      error:
        "Toolcraft performance baseline receipt is missing. An operator must run pnpm verify:perf to create one.",
      missing: true,
    };
  }
  const receipt = loaded.bundle.performanceBaseline;
  const shapeError = getToolcraftPerformanceReceiptShapeError(receipt);
  if (shapeError || receipt.kind !== "performance-checkpoint") {
    return {
      error:
        shapeError ??
        "Toolcraft performance baseline must be a protected passed performance checkpoint.",
    };
  }
  return { receipt };
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

export function getToolcraftTargetedImpactVerificationError(
  verification,
  verificationTier,
  impact,
) {
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
  const baseline = await readToolcraftDurablePerformanceBaseline(rootDir);
  if (baseline.error) throw new Error(baseline.error);
  const context = await getToolcraftTargetedVerificationContext({
    comparisonInventory: {
      entries: baseline.receipt.files,
      sourceHash: baseline.receipt.sourceHash,
    },
    rootDir,
  });
  return { baseline: baseline.receipt, ...context };
}

export async function getToolcraftTargetedVerificationContext({
  comparisonInventory,
  rootDir,
}) {
  const comparisonInventoryError = getToolcraftVerificationInventoryError({
    entries: comparisonInventory.entries,
    label: "Toolcraft targeted verification comparison inventory",
    sourceHash: comparisonInventory.sourceHash,
  });
  if (comparisonInventoryError) throw new Error(comparisonInventoryError);
  const inventory = await collectToolcraftVerificationInputs(rootDir);
  const changedFiles = getChangedFiles(
    comparisonInventory.entries,
    inventory.entries,
  );
  const impact = await resolveCurrentPerformanceImpact(rootDir, changedFiles);
  return { changedFiles, impact, inventory };
}

export async function validateToolcraftPerformanceReceipt({ rootDir }) {
  const loaded = await readToolcraftCheckpointBundle(rootDir);
  if (loaded.error) return [loaded.error];
  if (loaded.missing || loaded.bundle.currentPerformance === null) {
    return [
      "Toolcraft performance receipt is missing. An operator must run pnpm verify:perf to create a full checkpoint before targeted iteration evidence can be recorded.",
    ];
  }
  const receipt = loaded.bundle.currentPerformance;
  const shapeError = getToolcraftPerformanceReceiptShapeError(receipt);
  if (shapeError) return [shapeError];

  const baseline = await readToolcraftDurablePerformanceBaseline(rootDir);
  if (baseline.error) return [baseline.error];

  if (receipt.kind === "performance-checkpoint") {
    if (receipt.sourceHash !== baseline.receipt.sourceHash) {
      return [
        "Toolcraft current performance checkpoint does not match the durable performance baseline.",
      ];
    }
  } else {
    if (receipt.baselineSourceHash !== baseline.receipt.sourceHash) {
      return [
        "Toolcraft performance iteration does not match the durable baseline checkpoint.",
      ];
    }
    if (
      receipt.baselineEvidenceHash !==
      baseline.receipt.performanceEvidence.reportHash
    ) {
      return [
        "Toolcraft performance iteration does not match the durable baseline evidence.",
      ];
    }
    const expectedChangedFiles = getChangedFiles(
      baseline.receipt.files,
      receipt.files,
    );
    if (!arraysEqual(receipt.changedFiles, expectedChangedFiles)) {
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
    const impactError = getToolcraftTargetedImpactVerificationError(
      receipt.verification,
      receipt.verificationTier,
      impact,
    );
    if (impactError) return [impactError];
  }

  const inventory = await collectToolcraftVerificationInputs(rootDir);
  if (receipt.sourceHash !== inventory.sourceHash) {
    return [
      "Toolcraft performance receipt is stale because product or verification inputs changed after the recorded verification pass.",
    ];
  }
  return [];
}
