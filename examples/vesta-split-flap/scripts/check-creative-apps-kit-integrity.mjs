#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const creativeAppsKitRoot = path.join(appRoot, "src/creative-apps-kit");
const manifestPath = path.join(creativeAppsKitRoot, ".creative-apps-kit-manifest.json");
const appSourceRoot = path.join(appRoot, "src/app");
const routesSourceRoot = path.join(appRoot, "src/routes");

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function hashFile(filePath) {
  const buffer = await fs.readFile(filePath);
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

async function collectFiles(rootDir) {
  const files = [];

  async function visit(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const filePath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await visit(filePath);
        continue;
      }

      if (entry.isFile() && entry.name !== ".creative-apps-kit-manifest.json") {
        files.push(path.relative(rootDir, filePath).split(path.sep).join("/"));
      }
    }
  }

  await visit(rootDir);
  return files.sort();
}

function stripJsComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

async function collectSourceText(rootDir, { excludeTests = false } = {}) {
  if (!(await pathExists(rootDir))) {
    return "";
  }

  const chunks = [];

  async function visit(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const filePath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await visit(filePath);
        continue;
      }

      if (!entry.isFile() || !/\.[cm]?[jt]sx?$/.test(entry.name)) {
        continue;
      }

      if (excludeTests && /\.(test|spec)\.[cm]?[jt]sx?$/.test(entry.name)) {
        continue;
      }

      chunks.push(await fs.readFile(filePath, "utf8"));
    }
  }

  await visit(rootDir);
  return stripJsComments(chunks.join("\n"));
}

if (!(await pathExists(manifestPath))) {
  console.log("Creative Apps Kit integrity manifest not found; skipping copied source check.");
  process.exit(0);
}

const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
const expectedFiles = new Map(
  Object.entries(manifest.files ?? {}).map(([relativePath, hash]) => [
    relativePath,
    String(hash),
  ]),
);
const actualFiles = await collectFiles(creativeAppsKitRoot);
const actualFileSet = new Set(actualFiles);
const failures = [];
const routesSource = await collectSourceText(routesSourceRoot, { excludeTests: true });
const implementationSource = [
  routesSource,
  await collectSourceText(appSourceRoot, { excludeTests: true }),
].join("\n");

if (!/\bCreativeAppsKitApp\b/.test(implementationSource)) {
  failures.push(
    "app shell bypass: src/routes or src/app must render CreativeAppsKitApp instead of replacing the Creative Apps Kit runtime shell",
  );
}

if (/<\s*iframe\b|React\.createElement\s*\(\s*["']iframe["']/i.test(routesSource)) {
  failures.push(
    "app shell bypass: route files must not render a full-page iframe; preserve reference behavior inside CreativeAppsKitApp canvasContent",
  );
}

for (const relativePath of expectedFiles.keys()) {
  if (!actualFileSet.has(relativePath)) {
    failures.push(`deleted ${relativePath}`);
    continue;
  }

  const actualHash = await hashFile(path.join(creativeAppsKitRoot, relativePath));

  if (actualHash !== expectedFiles.get(relativePath)) {
    failures.push(`modified ${relativePath}`);
  }
}

for (const relativePath of actualFiles) {
  if (!expectedFiles.has(relativePath)) {
    failures.push(`added ${relativePath}`);
  }
}

if (failures.length > 0) {
  console.error("Creative Apps Kit generated app integrity check failed.");
  console.error(
    "Do not edit src/creative-apps-kit or replace the Creative Apps Kit runtime shell in generated apps.",
  );
  console.error(
    "Fix the app schema/source runtime in the monorepo, preserve CreativeAppsKitApp, then regenerate.",
  );

  for (const failure of failures) {
    console.error(`- ${failure}`);
  }

  process.exit(1);
}

console.log(`Creative Apps Kit integrity check passed (${actualFiles.length} files).`);
