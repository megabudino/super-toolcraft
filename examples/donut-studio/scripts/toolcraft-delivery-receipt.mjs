import {
  TOOLCRAFT_DELIVERY_PLAN_VERSION,
  createToolcraftDeliveryPlanHash,
  getToolcraftDeliveryPlanError,
} from "./toolcraft-delivery-plan.mjs";
import {
  getToolcraftExecutionEvidenceError,
} from "./toolcraft-delivery-evidence.mjs";
import { readToolcraftCheckpointBundle } from "./toolcraft-checkpoint-bundle.mjs";
import {
  collectToolcraftVerificationInputs,
  getToolcraftChangedVerificationFiles,
  getToolcraftVerificationInventoryError,
} from "./toolcraft-verification-inventory.mjs";

export const TOOLCRAFT_DELIVERY_RECEIPT_VERSION = 6;

const receiptKeys = Object.freeze([
  "completedAt",
  "evidence",
  "files",
  "kind",
  "manifestHash",
  "plan",
  "planHash",
  "planVersion",
  "runner",
  "sourceHash",
  "status",
  "version",
]);
const hashPattern = /^[a-f0-9]{64}$/u;

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value, expected) {
  if (!isRecord(value)) return false;
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return arraysEqual(actual, sortedExpected);
}

function arraysEqual(left, right) {
  return (
    Array.isArray(left) &&
    Array.isArray(right) &&
    left.length === right.length &&
    left.every((item, index) => item === right[index])
  );
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

function getCurrentReceiptCommonError(receipt) {
  if (
    !hasExactKeys(receipt, receiptKeys) ||
    receipt.kind !== "delivery-verification" ||
    receipt.runner !== "protected-delivery" ||
    receipt.status !== "passed" ||
    receipt.version !== TOOLCRAFT_DELIVERY_RECEIPT_VERSION ||
    receipt.planVersion !== TOOLCRAFT_DELIVERY_PLAN_VERSION ||
    typeof receipt.completedAt !== "string" ||
    !hashPattern.test(receipt.sourceHash ?? "") ||
    !hashPattern.test(receipt.manifestHash ?? "") ||
    !hashPattern.test(receipt.planHash ?? "")
  ) {
    return "Toolcraft delivery receipt is malformed or has unsupported fields.";
  }
  return getToolcraftVerificationInventoryError({
    entries: receipt.files,
    label: "Toolcraft delivery receipt file inventory",
    sourceHash: receipt.sourceHash,
  });
}

export function getToolcraftDeliveryReceiptShapeError(receipt) {
  const commonError = getCurrentReceiptCommonError(receipt);
  if (commonError) return commonError;
  const plan = deepFreeze(receipt.plan);
  const planError = getToolcraftDeliveryPlanError(plan);
  if (planError) return planError;
  if (
    receipt.sourceHash !== plan.sourceHash ||
    receipt.manifestHash !== plan.manifestHash
  ) {
    return "Toolcraft delivery receipt source or manifest does not match its plan.";
  }
  if (createToolcraftDeliveryPlanHash(plan) !== receipt.planHash) {
    return "Toolcraft delivery receipt plan hash does not match its plan.";
  }
  if (
    plan.basis.kind === "changed" &&
    !arraysEqual(
      plan.basis.changedFiles,
      getToolcraftChangedVerificationFiles(
        plan.basis.comparisonInventory.entries,
        receipt.files,
      ),
    )
  ) {
    return "Toolcraft delivery receipt changed files do not exactly match its inventories.";
  }
  return getToolcraftExecutionEvidenceError({
    evidence: receipt.evidence,
    finalInventory: {
      entries: receipt.files,
      sourceHash: receipt.sourceHash,
    },
    plan,
  });
}

export function createToolcraftDeliveryReceipt({ plan, result }) {
  const planHash = createToolcraftDeliveryPlanHash(plan);
  const resultError = getToolcraftExecutionEvidenceError({
    evidence: result?.evidence,
    finalInventory: result?.finalInventory,
    plan,
  });
  if (resultError) throw new Error(resultError);
  const receipt = {
    completedAt: new Date().toISOString(),
    evidence: result?.evidence,
    files: result?.finalInventory?.entries,
    kind: "delivery-verification",
    manifestHash: plan.manifestHash,
    plan,
    planHash,
    planVersion: TOOLCRAFT_DELIVERY_PLAN_VERSION,
    runner: "protected-delivery",
    sourceHash: plan.sourceHash,
    status: "passed",
    version: TOOLCRAFT_DELIVERY_RECEIPT_VERSION,
  };
  const error = getToolcraftDeliveryReceiptShapeError(receipt);
  if (error) throw new Error(error);
  return deepFreeze(receipt);
}

export async function readToolcraftDeliveryReceipt(rootDir) {
  const loaded = await readToolcraftCheckpointBundle(rootDir);
  if (loaded.missing || loaded.error) return loaded;
  const receipt = loaded.bundle.delivery;
  const error = getToolcraftDeliveryReceiptShapeError(receipt);
  return error ? { error } : { receipt };
}

export async function validateToolcraftDeliveryReceipt({
  collectInventory = collectToolcraftVerificationInputs,
  rootDir,
}) {
  const loaded = await readToolcraftDeliveryReceipt(rootDir);
  if (loaded.missing) return ["Toolcraft delivery receipt is missing."];
  if (loaded.error) return [loaded.error];
  const inventory = await collectInventory(rootDir);
  return loaded.receipt.sourceHash === inventory.sourceHash
    ? []
    : ["Toolcraft delivery receipt is stale for the current source."];
}
