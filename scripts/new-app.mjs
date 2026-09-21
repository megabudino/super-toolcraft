#!/usr/bin/env node
// Scaffolds a new client app in apps/<slug> using the pinned official Toolcraft CLI
// (it signs the integrity manifest), then adds the platform metadata (platform.json).
//
// Usage: node scripts/new-app.mjs <slug> [--template <example|path>] [--workspace <ws>]...
//                                   [--title "..."] [--description "..."] [--dry-run]
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseArgs, readAppIdentity, SLUG_PATTERN, toTitle } from "./platform-lib.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rootPackage = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"));
const cliVersion = process.env.TOOLCRAFT_CLI_VERSION ?? rootPackage.toolcraft?.cliVersion;

function fail(message) {
  console.error(`new-app: ${message}`);
  process.exit(1);
}

export function resolveTemplate(template, root = repoRoot) {
  if (!template || template === "starter") return undefined;
  const candidates = [path.resolve(root, template), path.join(root, "examples", template), path.join(root, "apps", template)];
  const found = candidates.find((candidate) => fs.existsSync(path.join(candidate, "package.json")));
  if (!found) throw new Error(`template "${template}" not found (looked in examples/, apps/ and as a path).`);
  return found;
}

function main() {
  const { positionals, options } = parseArgs(process.argv.slice(2), {
    multiple: ["workspace"],
    boolean: ["dry-run"],
  });
  const slug = positionals[0];
  if (!slug || !SLUG_PATTERN.test(slug)) {
    fail(`invalid slug "${slug ?? ""}". Use lowercase letters, digits and dashes (e.g. acme-configurator).`);
  }
  if (!cliVersion) fail('missing "toolcraft.cliVersion" in the root package.json.');

  const targetDir = path.join(repoRoot, "apps", slug);
  if (fs.existsSync(targetDir)) fail(`apps/${slug} already exists.`);

  let templateDir;
  try {
    templateDir = resolveTemplate(options.template);
  } catch (error) {
    fail(error.message);
  }

  const workspaces = [...new Set((options.workspace ?? []).flatMap((value) => value.split(",")).map((value) => value.trim()).filter(Boolean))];
  for (const workspace of workspaces) {
    if (!SLUG_PATTERN.test(workspace)) fail(`invalid workspace slug "${workspace}".`);
  }

  const cliArgs = [
    "-y",
    `@pixel-point/toolcraft@${cliVersion}`,
    "create",
    targetDir,
    "--name",
    slug,
    ...(templateDir ? ["--template", templateDir] : []),
    "--yes",
    "--no-install",
    "--no-skills",
  ];

  if (options["dry-run"]) {
    console.log(["npx", ...cliArgs].join(" "));
    return;
  }

  const result = spawnSync("npx", cliArgs, { cwd: repoRoot, stdio: "inherit" });
  if (result.status !== 0) fail(`Toolcraft CLI exited with status ${result.status}.`);

  // Deploy and lockfile are owned by the platform (single Vercel project, pnpm workspace).
  for (const file of ["vercel.json", "package-lock.json"]) {
    fs.rmSync(path.join(targetDir, file), { force: true });
  }

  const identity = readAppIdentity(targetDir);
  const platformConfig = {
    title: options.title ?? (templateDir ? toTitle(slug) : identity.title ?? toTitle(slug)),
    description: options.description ?? "",
    workspaces,
  };
  fs.writeFileSync(path.join(targetDir, "platform.json"), `${JSON.stringify(platformConfig, null, 2)}\n`);

  console.log(`\nCreated apps/${slug} (identity "${identity.id}")${templateDir ? ` from ${path.relative(repoRoot, templateDir)}` : ""}.`);
  console.log(`Workspaces: ${workspaces.length ? workspaces.join(", ") : "(none — assign from /admin)"}`);
  console.log(`Next: pnpm install && cd apps/${slug} && pnpm dev`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
