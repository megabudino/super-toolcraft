#!/usr/bin/env node
// Builds every apps/<slug> under the /a/<slug>/ base path, collects the output in
// platform/.app-builds/<slug>/ with a manifest.json, then builds the platform.
//
// Usage: node scripts/build-all.mjs [--apps-only] [--only <slug>]
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { listApps, parseArgs, readAppIdentity, readPlatformConfig, validateApps } from "./platform-lib.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appsDir = path.join(repoRoot, "apps");
const outDir = path.join(repoRoot, "platform", ".app-builds");

function run(command, args, cwd) {
  console.log(`\n$ ${command} ${args.join(" ")}  (${path.relative(repoRoot, cwd) || "."})`);
  const result = spawnSync(command, args, { cwd, stdio: "inherit", env: process.env });
  if (result.status !== 0) {
    console.error(`build-all: command failed with status ${result.status}.`);
    process.exit(result.status ?? 1);
  }
}

function main() {
  const { options } = parseArgs(process.argv.slice(2), { boolean: ["apps-only"] });
  const { errors, warnings } = validateApps(appsDir);
  warnings.forEach((warning) => console.warn(`warning: ${warning}`));
  if (errors.length) {
    errors.forEach((error) => console.error(`error: ${error}`));
    process.exit(1);
  }

  const allSlugs = listApps(appsDir);
  const slugs = options.only ? allSlugs.filter((slug) => slug === options.only) : allSlugs;
  if (options.only && slugs.length === 0) {
    console.error(`build-all: apps/${options.only} not found.`);
    process.exit(1);
  }

  fs.mkdirSync(outDir, { recursive: true });
  for (const slug of slugs) {
    const appDir = path.join(appsDir, slug);
    run("npm", ["run", "build", "--", "--base", `/a/${slug}/`], appDir);
    const target = path.join(outDir, slug);
    fs.rmSync(target, { recursive: true, force: true });
    fs.cpSync(path.join(appDir, "dist"), target, { recursive: true });
  }

  // Drop builds of apps that no longer exist.
  for (const entry of fs.readdirSync(outDir, { withFileTypes: true })) {
    if (entry.isDirectory() && !allSlugs.includes(entry.name)) {
      fs.rmSync(path.join(outDir, entry.name), { recursive: true, force: true });
    }
  }

  const apps = allSlugs
    .filter((slug) => fs.existsSync(path.join(outDir, slug, "index.html")))
    .map((slug) => {
      const appDir = path.join(appsDir, slug);
      return { slug, identity: readAppIdentity(appDir).id ?? slug, ...readPlatformConfig(appDir, slug) };
    });
  const hash = crypto.createHash("sha256").update(JSON.stringify(apps)).digest("hex");
  fs.writeFileSync(path.join(outDir, "manifest.json"), `${JSON.stringify({ hash, apps }, null, 2)}\n`);
  console.log(`\nmanifest: ${apps.length} app(s) → platform/.app-builds/manifest.json`);

  if (!options["apps-only"]) run("pnpm", ["--filter", "platform", "build"], repoRoot);
}

main();
