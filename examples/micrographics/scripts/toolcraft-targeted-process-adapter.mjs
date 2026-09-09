import path from "node:path";

import spawn from "cross-spawn";

export function getToolcraftTargetedBinaryPath(projectDir, name) {
  return path.join(
    projectDir,
    "node_modules",
    ".bin",
    process.platform === "win32" ? `${name}.cmd` : name,
  );
}

export function runToolcraftTargetedBinary(
  binaryPath,
  args,
  { cwd, env = process.env } = {},
) {
  return new Promise((resolve, reject) => {
    const child = spawn(binaryPath, args, { cwd, env, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) {
        reject(
          new Error(
            `${path.basename(binaryPath)} exited after signal ${signal}.`,
          ),
        );
      } else if (code !== 0) {
        reject(
          new Error(
            `${path.basename(binaryPath)} exited with code ${code ?? 1}.`,
          ),
        );
      } else {
        resolve();
      }
    });
  });
}

export function runToolcraftTargetedBinaryCapture(
  binaryPath,
  args,
  { cwd, env = process.env } = {},
) {
  return new Promise((resolve, reject) => {
    const child = spawn(binaryPath, args, {
      cwd,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal || code !== 0) {
        reject(
          new Error(
            `${path.basename(binaryPath)} list failed${signal ? ` after signal ${signal}` : ` with code ${code ?? 1}`}\n${stdout}\n${stderr}`,
          ),
        );
      } else {
        resolve(stdout);
      }
    });
  });
}
