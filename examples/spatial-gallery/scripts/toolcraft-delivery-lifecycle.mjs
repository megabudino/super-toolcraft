import path from "node:path";

import { commitToolcraftDeliveryCheckpoint } from "./toolcraft-checkpoint-transaction.mjs";
import {
  runToolcraftAggregateFunctionalGate,
  runToolcraftDeliveryCommand,
  runToolcraftDeliveryPackageScript,
} from "./toolcraft-delivery-command-runner.mjs";
import {
  assertOptionalBaselineCoherence,
  createPrototypeDeliveryReceipt,
  createTargetedDeliveryReceipt,
} from "./toolcraft-delivery-receipt-builder.mjs";
import { runToolcraftPerformanceSmoke } from "./toolcraft-performance-smoke-runner.mjs";
import {
  formatToolcraftPerformanceEscalationRecommendation,
  getToolcraftPerformanceEscalationRecommendation,
} from "./toolcraft-performance-escalation-policy.mjs";
import { readToolcraftPerformanceRequestAuthority } from "./toolcraft-performance-request-authority.mjs";
import { executeToolcraftTargetedVerification } from "./toolcraft-targeted-verification-runner.mjs";
import { isToolcraftTargetedDeliveryMode } from "./toolcraft-delivery-receipt.mjs";
import {
  assertToolcraftVerificationInputsUnchanged,
  collectToolcraftVerificationInputs,
  getToolcraftTargetedVerificationContext,
} from "./toolcraft-verification-receipt.mjs";

async function runPrototypeDelivery({ projectDir }) {
  const inventory = await collectToolcraftVerificationInputs(projectDir);
  await runToolcraftAggregateFunctionalGate({
    baselineInventory: inventory,
    projectDir,
  });
  const smokeEvidence = await runToolcraftPerformanceSmoke({
    baselineInventory: inventory,
    projectDir,
  });
  const receipt = createPrototypeDeliveryReceipt({ inventory, smokeEvidence });
  await commitToolcraftDeliveryCheckpoint({
    deliveryReceipt: receipt,
    projectDir,
  });
  return receipt;
}

async function runTargetedDelivery({
  baseline,
  delivery,
  mode,
  projectDir,
  targetedArguments,
}) {
  if (!isToolcraftTargetedDeliveryMode(mode)) {
    throw new Error("Toolcraft targeted delivery mode is unsupported.");
  }
  const phaseLabel = mode;
  const candidateInventory =
    await collectToolcraftVerificationInputs(projectDir);
  await runToolcraftDeliveryCommand(
    process.execPath,
    [path.join(projectDir, "scripts", "check-toolcraft-integrity.mjs")],
    { cwd: projectDir },
  );
  await runToolcraftDeliveryPackageScript(projectDir, "ai:check");
  await runToolcraftDeliveryPackageScript(projectDir, "docs:check");
  assertToolcraftVerificationInputsUnchanged({
    baseline: candidateInventory,
    current: await collectToolcraftVerificationInputs(projectDir),
    phase: `during ${phaseLabel} delivery preflight`,
  });
  const context = await getToolcraftTargetedVerificationContext({
    comparisonInventory: {
      entries: delivery.receipt.files,
      sourceHash: delivery.receipt.sourceHash,
    },
    rootDir: projectDir,
  });
  assertToolcraftVerificationInputsUnchanged({
    baseline: candidateInventory,
    current: context.inventory,
    phase: `while deriving ${phaseLabel} targeted verification context`,
  });
  if (context.changedFiles.length === 0) {
    if (mode === "performance-iteration") {
      throw new Error(
        "Toolcraft performance iteration requires changed verification inputs; complete a product change before running the selected performance evidence.",
      );
    }
    console.log(
      "Toolcraft delivery inputs are unchanged; delivery remains current.",
    );
    return delivery.receipt;
  }
  const performanceRequestAuthority =
    mode === "performance-iteration"
      ? await readToolcraftPerformanceRequestAuthority(projectDir)
      : null;
  const previousRequestAuthorityHash =
    delivery.receipt.verification?.targetedPerformanceReport
      ?.requestAuthorityHash;
  if (
    performanceRequestAuthority &&
    previousRequestAuthorityHash === performanceRequestAuthority.hash
  ) {
    throw new Error(
      "Toolcraft performance request already produced one successful performance iteration. Record a new user performance complaint before starting another iteration.",
    );
  }
  if (
    performanceRequestAuthority &&
    JSON.stringify(performanceRequestAuthority.command.targetedArguments) !==
      JSON.stringify(targetedArguments)
  ) {
    throw new Error(
      "Toolcraft performance iteration arguments must exactly match the command recorded in the latest Decision Trail.",
    );
  }
  const result = await executeToolcraftTargetedVerification({
    arguments_: targetedArguments,
    comparisonPerformanceReport:
      delivery.receipt.verification?.targetedPerformanceReport ?? null,
    comparisonPerformanceReportHash:
      delivery.receipt.verification?.targetedPerformanceReportHash ?? null,
    context,
    fixtureResolutionMode:
      mode === "performance-iteration" ? "strict-development" : "default",
    projectDir,
    requestAuthorityHash: performanceRequestAuthority?.hash ?? null,
  });
  assertToolcraftVerificationInputsUnchanged({
    baseline: candidateInventory,
    current: result.verifiedInventory,
    phase: `during ${phaseLabel} targeted verification`,
  });
  const receipt = createTargetedDeliveryReceipt({
    baseline: baseline.missing ? undefined : baseline,
    comparisonReceipt: delivery.receipt,
    mode,
    result: { ...result, context },
  });
  await commitToolcraftDeliveryCheckpoint({
    deliveryReceipt: receipt,
    projectDir,
    targetedExecutionAuthority: result.targetedExecutionAuthority,
  });
  const escalationRecommendation =
    getToolcraftPerformanceEscalationRecommendation({
      currentReceipt: receipt,
      previousReceipt: delivery.receipt,
    });
  if (escalationRecommendation) {
    console.log(
      formatToolcraftPerformanceEscalationRecommendation(
        escalationRecommendation,
      ),
    );
  }
  return receipt;
}

export async function executeToolcraftDeliveryLifecycle({
  baseline,
  delivery,
  projectDir,
  requestedReason,
  targetedArguments,
}) {
  if (
    requestedReason !== undefined &&
    requestedReason !== "performance-iteration"
  ) {
    throw new Error(
      "Toolcraft delivery reason must be performance-iteration.",
    );
  }

  const mode =
    requestedReason === "performance-iteration"
      ? "performance-iteration"
      : "ordinary";

  if (mode === "performance-iteration") {
    if (delivery.error) throw new Error(delivery.error);
    if (delivery.missing) {
      throw new Error(
        "Toolcraft performance iteration requires a previous successful delivery. Run pnpm verify:delivery without --reason to complete the default prototype delivery first.",
      );
    }
    const performanceTestPrefix = "--performance-test=";
    const hasExactPerformanceSelector = targetedArguments.some(
      (argument) =>
        argument.startsWith(performanceTestPrefix) &&
        argument.slice(performanceTestPrefix.length).trim().length > 0,
    );
    if (!hasExactPerformanceSelector) {
      throw new Error(
        "Toolcraft performance iteration requires at least one exact --performance-test selector.",
      );
    }
  }

  if (delivery.error) throw new Error(delivery.error);
  if (delivery.missing) {
    if (targetedArguments.length > 0) {
      throw new Error(
        "Prototype delivery does not accept targeted test selectors; run pnpm verify:delivery without tier or test arguments.",
      );
    }
    if (baseline.error && !baseline.missing) throw new Error(baseline.error);
    if (!baseline.missing) {
      throw new Error(
        "Toolcraft prototype delivery requires no pre-existing performance baseline. Run pnpm verify:perf to create coherent full operator authority.",
      );
    }
    return runPrototypeDelivery({ projectDir });
  }

  assertOptionalBaselineCoherence({ baseline, delivery });
  return runTargetedDelivery({
    baseline,
    delivery,
    mode,
    projectDir,
    targetedArguments,
  });
}
