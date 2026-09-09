#!/usr/bin/env node

import { realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseToolcraftDeliveryArguments } from "./toolcraft-delivery-arguments.mjs";
import { readToolcraftDeliveryReceipt } from "./toolcraft-delivery-receipt.mjs";
import { executeToolcraftDeliveryLifecycle } from "./toolcraft-delivery-lifecycle.mjs";
import { withToolcraftVerificationLock } from "./toolcraft-verification-lock.mjs";
import { readToolcraftDurablePerformanceBaseline } from "./toolcraft-verification-receipt.mjs";

const modulePath = fileURLToPath(import.meta.url);
const defaultProjectDir = path.resolve(path.dirname(modulePath), "..");

export async function runToolcraftDeliveryVerification({
  arguments_ = [],
  projectDir = defaultProjectDir,
} = {}) {
  const resolvedProjectDir = path.resolve(projectDir);
  const { requestedReason, targetedArguments } =
    parseToolcraftDeliveryArguments(arguments_);

  return withToolcraftVerificationLock(resolvedProjectDir, async () => {
    const baseline =
      await readToolcraftDurablePerformanceBaseline(resolvedProjectDir);
    const delivery = await readToolcraftDeliveryReceipt(resolvedProjectDir);
    return executeToolcraftDeliveryLifecycle({
      baseline,
      delivery,
      projectDir: resolvedProjectDir,
      requestedReason,
      targetedArguments,
    });
  });
}

async function isDirectExecution() {
  if (!process.argv[1]) return false;
  try {
    return (await realpath(process.argv[1])) === (await realpath(modulePath));
  } catch {
    return path.resolve(process.argv[1]) === modulePath;
  }
}

if (await isDirectExecution()) {
  await runToolcraftDeliveryVerification({ arguments_: process.argv.slice(2) });
}
