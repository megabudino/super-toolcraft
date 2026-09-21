#!/usr/bin/env node
// First-time setup: creates platform/.env.local (Turso or a local file DB + SETUP_TOKEN)
// and applies migrations. Vercel linking/deploy stays an explicit, separate step.
//
// Usage: node scripts/platform-init.mjs [--turso <db-name>] [--url <libsql-url> --token <auth-token>] [--force]
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseArgs } from "./platform-lib.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(repoRoot, "platform", ".env.local");

function turso(args) {
  const result = spawnSync("turso", args, { encoding: "utf8" });
  if (result.error?.code === "ENOENT") throw new Error("turso CLI not found: install it (brew install tursodatabase/tap/turso) and run `turso auth login`, or pass --url and --token.");
  if (result.status !== 0) throw new Error(`turso ${args.join(" ")} failed:\n${result.stderr || result.stdout}`);
  return result.stdout.trim();
}

function main() {
  const { options } = parseArgs(process.argv.slice(2), { boolean: ["force"] });
  if (fs.existsSync(envPath) && !options.force) {
    console.log(`platform/.env.local already exists (use --force to overwrite). Running migrations only.`);
  } else {
    let url = options.url ?? "file:local.db";
    let token = options.token ?? "";
    if (options.turso) {
      const name = options.turso;
      const existing = spawnSync("turso", ["db", "show", name, "--url"], { encoding: "utf8" });
      if (existing.status !== 0) {
        console.log(`Creating Turso database "${name}"…`);
        turso(["db", "create", name]);
      }
      url = turso(["db", "show", name, "--url"]);
      token = turso(["db", "tokens", "create", name]);
    }
    const setupToken = crypto.randomBytes(24).toString("base64url");
    fs.writeFileSync(
      envPath,
      [`DATABASE_URL=${url}`, `DATABASE_AUTH_TOKEN=${token}`, `SETUP_TOKEN=${setupToken}`, ""].join("\n"),
      { mode: 0o600 },
    );
    console.log(`Wrote platform/.env.local (DATABASE_URL=${url}).`);
  }

  const migrate = spawnSync("pnpm", ["--filter", "platform", "db:migrate"], { cwd: repoRoot, stdio: "inherit" });
  if (migrate.status !== 0) process.exit(migrate.status ?? 1);

  const env = Object.fromEntries(
    fs
      .readFileSync(envPath, "utf8")
      .split("\n")
      .filter((line) => line.includes("="))
      .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]),
  );
  console.log(`
Next steps
  Local:   pnpm build:apps && pnpm dev   →  http://localhost:3100/setup?token=<SETUP_TOKEN>
  Vercel:  create a project with Root Directory = "platform", then add these env vars:
             DATABASE_URL, DATABASE_AUTH_TOKEN, SETUP_TOKEN  (values in platform/.env.local)
           deploy, then open https://<your-domain>/setup?token=<SETUP_TOKEN>
  ${env.DATABASE_URL?.startsWith("file:") ? "Note: a file: database only works locally. Use --turso <name> for production." : ""}`);
}

try {
  main();
} catch (error) {
  console.error(`platform-init: ${error.message}`);
  process.exit(1);
}
