import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");

const requiredDocs = [
  "README.md",
  "assembly-workflow.md",
  "decision-contract.md",
  "schema-reference.md",
  "acceptance-testing.md",
  "performance.md",
  "renderer-technique.md",
  "agent-worklog.md",
  "custom-controls.md",
  "component-rules.md",
];

const requiredRuleIds = [
  "runtime-shell-required",
  "canvas-no-app-ui",
  "canvas-surface-preserved",
  "canvas-handle-placement",
  "panel-host-behavior",
  "layers-enable-only-when-needed",
  "layers-enabled-behavior",
  "timeline-mode-choice",
  "timeline-enabled-behavior",
  "controls-product-coverage",
  "output-export-required",
  "controls-layout-heuristics",
  "renderer-technique-inventory",
  "reference-clone-source-of-truth",
  "acceptance-product-observable",
  "performance-coverage-levels",
  "persistence-policy-explicit",
  "workflow-required",
];

const requiredAgentsLinks = [
  "assembly-workflow.md",
  "decision-contract.md",
  "schema-reference.md",
  "acceptance-testing.md",
  "performance.md",
  "renderer-technique.md",
  "agent-worklog.md",
  "custom-controls.md",
  "component-rules.md",
];

const requiredWorkflowTerms = [
  "Verification Tier Classifier",
  "Verification tier: Tier N",
  "pnpm verify:quick",
  "pnpm verify:perf",
  "pnpm verify:final",
];

const forbiddenTextPatterns = [
  /@repo\/ui/,
  /@repo\/creative-apps-kit-runtime/,
  /workspace:/,
  /creative-apps-kit-ai-assembly/,
  /\bAI Assembly\b/,
  /How AI/,
];

async function readText(relativePath) {
  return fs.readFile(path.join(projectRoot, relativePath), "utf8");
}

async function fileExists(relativePath) {
  try {
    const stat = await fs.stat(path.join(projectRoot, relativePath));
    return stat.isFile();
  } catch {
    return false;
  }
}

const failures = [];

for (const fileName of requiredDocs) {
  const relativePath = `docs/creative-apps-kit/${fileName}`;

  if (!(await fileExists(relativePath))) {
    failures.push(`missing local Creative Apps Kit doc: ${relativePath}`);
  }
}

const agentsSource = await readText("AGENTS.md");
const decisionSource = await readText("docs/creative-apps-kit/decision-contract.md");
const docsSources = [agentsSource, decisionSource];

for (const ruleId of requiredRuleIds) {
  if (!agentsSource.includes(ruleId)) {
    failures.push(`AGENTS.md must list decision rule "${ruleId}"`);
  }

  if (!decisionSource.includes(ruleId)) {
    failures.push(`docs/creative-apps-kit/decision-contract.md must list decision rule "${ruleId}"`);
  }
}

for (const fileName of requiredDocs) {
  const source = await readText(`docs/creative-apps-kit/${fileName}`);
  docsSources.push(source);
}

const combinedSource = docsSources.join("\n");

for (const pattern of forbiddenTextPatterns) {
  if (pattern.test(combinedSource)) {
    failures.push(`local Creative Apps Kit docs contain forbidden text pattern ${pattern}`);
  }
}

for (const localDoc of requiredAgentsLinks) {
  if (!agentsSource.includes(`docs/creative-apps-kit/${localDoc}`)) {
    failures.push(`AGENTS.md must link docs/creative-apps-kit/${localDoc}`);
  }
}

for (const term of requiredWorkflowTerms) {
  if (!agentsSource.includes(term)) {
    failures.push(`AGENTS.md must mention "${term}"`);
  }

  if (!combinedSource.includes(term)) {
    failures.push(`local Creative Apps Kit docs must mention "${term}"`);
  }
}

if (failures.length > 0) {
  console.error("Creative Apps Kit local docs check failed:");

  for (const failure of failures) {
    console.error(`- ${failure}`);
  }

  process.exit(1);
}

console.log("Creative Apps Kit local docs check passed.");
