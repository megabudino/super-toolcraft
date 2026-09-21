// Shared helpers for the platform scripts (new-app, build-all).
import fs from "node:fs";
import path from "node:path";

export const SLUG_PATTERN = /^[a-z][a-z0-9-]{0,47}$/;

export function parseArgs(argv, { multiple = [], boolean = [] } = {}) {
  const positionals = [];
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      positionals.push(arg);
      continue;
    }
    const [rawName, inlineValue] = arg.slice(2).split(/=(.*)/s);
    if (boolean.includes(rawName)) {
      options[rawName] = true;
      continue;
    }
    const value = inlineValue ?? argv[++index];
    if (value === undefined) throw new Error(`--${rawName} requires a value.`);
    if (multiple.includes(rawName)) (options[rawName] ??= []).push(value);
    else options[rawName] = value;
  }
  return { positionals, options };
}

export function toTitle(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

export function readAppIdentity(appDir) {
  const file = path.join(appDir, "src/app/app-identity.ts");
  if (!fs.existsSync(file)) return {};
  const source = fs.readFileSync(file, "utf8");
  return {
    id: source.match(/id:\s*"([^"]+)"/)?.[1],
    title: source.match(/title:\s*"([^"]+)"/)?.[1],
  };
}

export function readPlatformConfig(appDir, slug) {
  const file = path.join(appDir, "platform.json");
  const config = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
  const workspaces = Array.isArray(config.workspaces) ? config.workspaces : [];
  for (const workspace of workspaces) {
    if (typeof workspace !== "string" || !SLUG_PATTERN.test(workspace)) {
      throw new Error(`apps/${slug}/platform.json: invalid workspace slug ${JSON.stringify(workspace)}.`);
    }
  }
  return {
    title: typeof config.title === "string" && config.title ? config.title : toTitle(slug),
    description: typeof config.description === "string" ? config.description : "",
    workspaces,
  };
}

export function listApps(appsDir) {
  if (!fs.existsSync(appsDir)) return [];
  return fs
    .readdirSync(appsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(appsDir, entry.name, "package.json")))
    .map((entry) => entry.name)
    .sort();
}

export function validateApps(appsDir) {
  const errors = [];
  const warnings = [];
  const identities = new Map();
  for (const slug of listApps(appsDir)) {
    if (!SLUG_PATTERN.test(slug)) errors.push(`apps/${slug}: folder name is not a valid slug.`);
    const { id } = readAppIdentity(path.join(appsDir, slug));
    if (id) {
      if (identities.has(id)) {
        warnings.push(`apps/${slug} and apps/${identities.get(id)} share appIdentity.id "${id}" (storage is still isolated per slug by the platform).`);
      } else identities.set(id, slug);
    }
    try {
      readPlatformConfig(path.join(appsDir, slug), slug);
    } catch (error) {
      errors.push(error.message);
    }
  }
  return { errors, warnings };
}
