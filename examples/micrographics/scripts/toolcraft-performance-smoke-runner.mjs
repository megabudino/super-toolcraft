import { access } from "node:fs/promises";
import path from "node:path";

import { runToolcraftDeliveryCommand } from "./toolcraft-delivery-command-runner.mjs";
import {
  TOOLCRAFT_PERFORMANCE_SMOKE_EVIDENCE_VERSION,
  TOOLCRAFT_PERFORMANCE_SMOKE_TEST_NAME,
  getToolcraftPerformanceSmokeEvidenceError,
} from "./toolcraft-performance-smoke-evidence.mjs";
import {
  assertToolcraftVerificationInputsUnchanged,
  collectToolcraftVerificationInputs,
} from "./toolcraft-verification-inventory.mjs";

function getBinaryPath(projectDir, name) {
  return path.join(
    projectDir,
    "node_modules",
    ".bin",
    process.platform === "win32" ? `${name}.cmd` : name,
  );
}

export function getToolcraftPerformanceSmokePlaywrightArgs() {
  return [
    "test",
    "e2e/app-performance-smoke.spec.ts",
    "--grep",
    `${TOOLCRAFT_PERFORMANCE_SMOKE_TEST_NAME}$`,
    "--workers=1",
  ];
}

export async function runToolcraftPerformanceSmoke({
  baselineInventory,
  projectDir,
}) {
  const resolvedProjectDir = path.resolve(projectDir);
  const currentInventory =
    await collectToolcraftVerificationInputs(resolvedProjectDir);
  assertToolcraftVerificationInputsUnchanged({
    baseline: baselineInventory,
    current: currentInventory,
    phase: "before the protected performance smoke",
  });

  const playwrightBin = getBinaryPath(resolvedProjectDir, "playwright");
  await access(playwrightBin);
  await runToolcraftDeliveryCommand(
    playwrightBin,
    getToolcraftPerformanceSmokePlaywrightArgs(),
    {
      cwd: resolvedProjectDir,
      env: {
        ...process.env,
        TOOLCRAFT_BROWSER_SERVER_MODE: "preview",
        TOOLCRAFT_PERFORMANCE_FIXTURE_SELECTOR: "development",
      },
    },
  );

  const verifiedInventory =
    await collectToolcraftVerificationInputs(resolvedProjectDir);
  assertToolcraftVerificationInputsUnchanged({
    baseline: baselineInventory,
    current: verifiedInventory,
    phase: "during the protected performance smoke",
  });

  const evidence = Object.freeze({
    completedAt: new Date().toISOString(),
    fixtureSelector: "development",
    kind: "performance-smoke",
    runner: "protected-playwright-smoke",
    sourceHash: verifiedInventory.sourceHash,
    testName: TOOLCRAFT_PERFORMANCE_SMOKE_TEST_NAME,
    version: TOOLCRAFT_PERFORMANCE_SMOKE_EVIDENCE_VERSION,
  });
  const evidenceError = getToolcraftPerformanceSmokeEvidenceError(evidence);
  if (evidenceError) throw new Error(evidenceError);
  return evidence;
}
