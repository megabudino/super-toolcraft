import { existsSync } from "node:fs";
import { access } from "node:fs/promises";
import path from "node:path";

import spawn from "cross-spawn";

import {
  assertToolcraftVerificationInputsUnchanged,
  collectToolcraftVerificationInputs,
} from "./toolcraft-verification-receipt.mjs";

function getBinaryPath(projectDir, name) {
  return path.join(
    projectDir,
    "node_modules",
    ".bin",
    process.platform === "win32" ? `${name}.cmd` : name,
  );
}

function getPackageManager(projectDir) {
  const userAgent = process.env.npm_config_user_agent ?? "";
  if (userAgent.startsWith("pnpm/")) return "pnpm";
  if (userAgent.startsWith("yarn/")) return "yarn";
  if (userAgent.startsWith("bun/")) return "bun";
  if (userAgent.startsWith("npm/")) return "npm";
  if (path.extname(process.env.npm_execpath ?? "") === ".cjs") return "pnpm";
  if (existsSync(path.join(projectDir, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(path.join(projectDir, "yarn.lock"))) return "yarn";
  if (existsSync(path.join(projectDir, "bun.lock"))) return "bun";
  return "npm";
}

export function runToolcraftDeliveryCommand(
  command,
  args,
  { cwd, env = process.env } = {},
) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`${path.basename(command)} exited after signal ${signal}.`));
      } else if (code !== 0) {
        reject(new Error(`${path.basename(command)} exited with code ${code ?? 1}.`));
      } else {
        resolve();
      }
    });
  });
}

export async function runToolcraftDeliveryPackageScript(projectDir, scriptName) {
  await runToolcraftDeliveryCommand(
    getPackageManager(projectDir),
    ["run", scriptName],
    { cwd: projectDir },
  );
}

export function getToolcraftAggregateFunctionalPlaywrightArgs() {
  return [
    "test",
    "--grep-invert",
    "browser perf:|browser smoke:|toolcraft kernel:",
    "--workers=1",
  ];
}

export async function runToolcraftAggregateFunctionalGate({
  baselineInventory,
  projectDir,
}) {
  await runToolcraftDeliveryCommand(
    process.execPath,
    [path.join(projectDir, "scripts", "check-toolcraft-integrity.mjs")],
    { cwd: projectDir },
  );
  await runToolcraftDeliveryPackageScript(projectDir, "ai:check");
  await runToolcraftDeliveryPackageScript(projectDir, "test:delivery");
  await runToolcraftDeliveryPackageScript(projectDir, "build");
  const playwrightBin = getBinaryPath(projectDir, "playwright");
  await access(playwrightBin);
  await runToolcraftDeliveryCommand(playwrightBin, ["install", "chromium"], {
    cwd: projectDir,
  });
  await runToolcraftDeliveryCommand(
    playwrightBin,
    getToolcraftAggregateFunctionalPlaywrightArgs(),
    {
      cwd: projectDir,
      env: {
        ...process.env,
        TOOLCRAFT_BROWSER_SERVER_MODE: "preview",
      },
    },
  );
  assertToolcraftVerificationInputsUnchanged({
    baseline: baselineInventory,
    current: await collectToolcraftVerificationInputs(projectDir),
    phase: "during the aggregate delivery gate",
  });
}
