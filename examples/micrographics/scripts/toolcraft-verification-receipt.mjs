#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  readToolcraftDeliveryReceipt,
  validateToolcraftDeliveryReceipt,
} from "./toolcraft-delivery-receipt.mjs";
import {
  hasToolcraftDeliveryBaselineLinkage,
  validateToolcraftLinkedPerformanceAuthority,
} from "./toolcraft-linked-performance-authority.mjs";

export {
  TOOLCRAFT_EXPLICIT_PERFORMANCE_REASON,
  TOOLCRAFT_PERFORMANCE_ITERATION_REASON,
  TOOLCRAFT_PERFORMANCE_RECEIPT_VERSION,
  assertToolcraftVerificationInputsUnchanged,
  collectToolcraftVerificationInputs,
  getChangedFiles,
  getToolcraftPerformanceIterationContext,
  getToolcraftPerformanceIterationVerificationError,
  getToolcraftTargetedImpactVerificationError,
  getToolcraftTargetedVerificationContext,
  readToolcraftDurablePerformanceBaseline,
  validateToolcraftCurrentPerformanceImpactInventory,
  validateToolcraftPerformanceReceipt,
} from "./toolcraft-verification-receipt-core.mjs";

export async function validateToolcraftVerificationReceipt({ rootDir }) {
  const deliveryErrors = await validateToolcraftDeliveryReceipt({ rootDir });
  if (deliveryErrors.length > 0) return deliveryErrors;
  const delivery = await readToolcraftDeliveryReceipt(rootDir);
  if (delivery.error) return [delivery.error];
  if (delivery.missing) {
    return [
      "Toolcraft delivery receipt is missing. Run pnpm verify:delivery at the delivery boundary.",
    ];
  }
  if (!hasToolcraftDeliveryBaselineLinkage(delivery.receipt)) return [];
  return validateToolcraftLinkedPerformanceAuthority({
    deliveryReceipt: delivery.receipt,
    rootDir,
  });
}

async function runCli() {
  const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const [command = "validate"] = process.argv.slice(2);

  if (command !== "validate") {
    throw new Error(`Unknown Toolcraft verification receipt command: ${command}.`);
  }
  const errors = await validateToolcraftVerificationReceipt({ rootDir: projectDir });
  if (errors.length > 0) throw new Error(errors.join("\n"));
  console.log("Toolcraft delivery and linked performance authority are current and valid.");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCli().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
