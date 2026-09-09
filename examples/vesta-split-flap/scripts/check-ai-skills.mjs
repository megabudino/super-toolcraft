#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const codexHome = process.env.CODEX_HOME
  ? path.resolve(process.env.CODEX_HOME)
  : path.join(os.homedir(), ".codex");

const requiredSkills = [
  {
    name: "brainstorming",
    purpose: "shape the app behavior, panels, controls, canvas, media, export, and ambiguity before code",
    paths: [path.join(codexHome, "skills/brainstorming/SKILL.md")],
  },
  {
    name: "writing-plans",
    purpose: "turn the approved app spec into a deterministic Creative Apps Kit implementation plan",
    paths: [path.join(codexHome, "skills/writing-plans/SKILL.md")],
  },
  {
    name: "systematic-debugging",
    purpose: "investigate root cause before fixing broken controls, tests, builds, visual regressions, or runtime bugs",
    paths: [path.join(codexHome, "skills/systematic-debugging/SKILL.md")],
  },
  {
    name: "browser",
    purpose: "verify the generated UI in a running local browser after implementation",
    paths: [
      path.join(codexHome, "skills/browser/SKILL.md"),
      path.join(codexHome, "skills/browser/browser/SKILL.md"),
      path.join(codexHome, "plugins/cache/openai-bundled/browser/0.1.0-alpha2/skills/browser/SKILL.md"),
      path.join(codexHome, "plugins/cache/openai-bundled/browser/*/skills/browser/SKILL.md"),
      path.join(codexHome, "plugins/cache/openai-bundled/browser/*/skills/control-in-app-browser/SKILL.md"),
    ],
  },
];

function pathPatternExists(candidatePath) {
  if (!candidatePath.includes("*")) {
    return fs.existsSync(candidatePath);
  }

  const { root } = path.parse(candidatePath);
  const segments = candidatePath.slice(root.length).split(path.sep).filter(Boolean);

  function walk(index, currentPath) {
    if (index >= segments.length) {
      return fs.existsSync(currentPath);
    }

    const segment = segments[index];

    if (segment !== "*") {
      return walk(index + 1, path.join(currentPath, segment));
    }

    if (!fs.existsSync(currentPath)) {
      return false;
    }

    return fs
      .readdirSync(currentPath, { withFileTypes: true })
      .some((entry) => entry.isDirectory() && walk(index + 1, path.join(currentPath, entry.name)));
  }

  return walk(0, root);
}

function hasAnyPath(paths) {
  return paths.some((candidatePath) => pathPatternExists(candidatePath));
}

const missingSkills = requiredSkills.filter((skill) => !hasAnyPath(skill.paths));

if (missingSkills.length === 0) {
  console.log("AI workflow skills are installed:");
  for (const skill of requiredSkills) {
    console.log(`- ${skill.name}: ${skill.purpose}`);
  }
  process.exit(0);
}

console.error("Missing required AI workflow skills:");
for (const skill of missingSkills) {
  console.error(`- ${skill.name}: ${skill.purpose}`);
}

console.error("");
console.error("If your AI environment supports Codex skills, install the missing skills before implementation.");
console.error("If installation is not available, stop and ask the user to install them.");
console.error(`Checked CODEX_HOME: ${codexHome}`);

process.exit(1);
