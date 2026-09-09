import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  classifyToolcraftPerformanceRequest,
  describeToolcraftPerformanceRequestReason,
  validateToolcraftPerformanceRequestEvidence,
} from "@/toolcraft/runtime";
import {
  parseToolcraftWorklogVerificationCommand,
  type ToolcraftWorklogVerificationCommand,
} from "../../scripts/toolcraft-worklog-verification-command.mjs";

const appDir = dirname(fileURLToPath(import.meta.url));
const projectDir = join(appDir, "../..");

export const agentWorklogPath = join(projectDir, "docs/toolcraft/agent-worklog.md");

const requiredAgentWorklogDecisionSections = [
  "Renderer",
  "View Interaction",
  "Interaction Ownership",
  "Timeline",
  "Layers",
  "Controls",
  "Export",
  "Performance",
] as const;
const requiredAgentWorklogSections = [
  "Status",
  "Decisions",
  "Decision Trail",
  ...requiredAgentWorklogDecisionSections,
  "Evidence",
  "Verification",
  "Risks",
] as const;
const requiredAgentWorklogDecisionTrailFields = [
  "Request",
  "Task type",
  "User-visible result",
  "Source/reference checked",
  "Reference inputs",
  "Docs/contracts read",
  "Contract rules applied",
  "View interaction intent",
  "Interaction ownership",
  "Decision",
  "Alternatives rejected",
  "State/output mapping",
  "Files changed",
  "Performance intent",
  "Verification",
  "Skipped checks",
  "Risks",
] as const;
type WorklogDecisionSection = (typeof requiredAgentWorklogDecisionSections)[number];
type WorklogDecisionTrailField = (typeof requiredAgentWorklogDecisionTrailFields)[number];
type WorklogDecisionEvidence = {
  decision: string;
  evidence: string;
  reason: string;
};
export type AgentWorklogFixtureOptions = {
  decisions?: Partial<Record<WorklogDecisionSection, Partial<WorklogDecisionEvidence>>>;
  evidenceLines?: readonly string[];
  extraDecisionSections?: readonly string[];
  mode?: "product" | "starter";
  omitDecisionTrailFields?: readonly WorklogDecisionTrailField[];
  risksLines?: readonly string[];
  trailFields?: Partial<Record<WorklogDecisionTrailField, string>>;
  trailHeading?: string;
  verificationLines?: readonly string[];
};
const worklogVideoReferencePattern =
  /\b(?:source\/reference checked|source reviewed|reference inputs):[^\n]*(?:reference\s+(?:video|gif)|screen\s*recording|contact[-\s]*sheet|storyboard|frame[-\s]*by[-\s]*frame|extracted[-\s]*frames?|cleanshot|ffprobe|[^\s]+\.(?:mp4|mov|webm|gif))\b/i;
const worklogVideoReferenceStudyPattern =
  /\b(video reference study|storyboard|frame[-\s]*by[-\s]*frame|transition analysis|frame[-\s]*to[-\s]*frame|contact[-\s]*sheet|extracted frames?)\b/i;
export function readToolcraftDoc(relativePath: string): string {
  return readFileSync(join(projectDir, "docs/toolcraft", relativePath), "utf8");
}

const defaultDecisionEvidence: Record<WorklogDecisionSection, WorklogDecisionEvidence> = {
  Controls: {
    decision: "Group controls by product entity.",
    evidence: "src/app/app-schema.ts.",
    reason: "Each section maps to visible output behavior.",
  },
  Export: {
    decision: "Provide PNG export.",
    evidence: "panelActions.",
    reason: "The product output is exportable.",
  },
  Layers: {
    decision: "Do not enable layers.",
    evidence: "appSchema.panels.layers is omitted.",
    reason: "The product edits one output.",
  },
  Performance: {
    decision: "Use lifecycle-aware protected delivery verification.",
    evidence: "pnpm verify:delivery protected receipt.",
    reason:
      "The runner chooses prototype smoke, ordinary targeted evidence, or one request-backed targeted performance iteration; full certification remains operator-only.",
  },
  Renderer: {
    decision: "Use SVG renderer.",
    evidence: "src/app/product-renderer.tsx.",
    reason: "The product output is vector-native.",
  },
  "View Interaction": {
    decision: "Use non-spatial view interaction.",
    evidence: "appProductReadiness.viewInteraction.",
    reason: "The product has no visible three-dimensional scene or model.",
  },
  "Interaction Ownership": {
    decision: "Keep each user operation on one evidence-backed primary surface.",
    evidence: "appProductReadiness.interactionOwnership.",
    reason: "Canvas and panel interactions remain complementary instead of mirrored.",
  },
  Timeline: {
    decision: "Do not enable timeline.",
    evidence: "appSchema.panels.timeline is omitted.",
    reason: "The product is still output.",
  },
};

const defaultDecisionTrailFields: Record<WorklogDecisionTrailField, string> = {
  "Alternatives rejected": "Canvas output because vector output must stay crisp.",
  "Contract rules applied": "runtime-shell-required and output-export-required.",
  Decision: "Use SVG renderer with Toolcraft controls.",
  "Docs/contracts read": "workflow.md, assembly-workflow.md, and performance.md.",
  "Files changed": "src/app/app-schema.ts, src/app/product-renderer.tsx, src/app/app-performance.ts.",
  "Performance intent": "ordinary-product-work",
  "Reference inputs": "None.",
  Request: "Build a still vector poster app.",
  Risks: "None; browser and performance gates cover the touched surfaces.",
  "Skipped checks": "None.",
  "Source/reference checked": "User prompt.",
  "State/output mapping": "Schema values feed product-renderer.tsx and export uses runtime state.",
  "Task type": "Schema, renderer, export, acceptance, and performance.",
  "User-visible result": "The canvas renders the poster and exports PNG.",
  Verification: "pnpm verify:delivery.",
  "View interaction intent": "non-spatial; the product has no visible three-dimensional scene or model.",
  "Interaction ownership":
    "No cross-surface product operations; panel controls own their distinct property edits.",
};

function renderDecisionSection(
  section: WorklogDecisionSection,
  overrides: Partial<WorklogDecisionEvidence> | undefined,
): string {
  const decision = {
    ...defaultDecisionEvidence[section],
    ...overrides,
  };

  return [
    `### ${section}`,
    `- Decision: ${decision.decision}`,
    `- Reason: ${decision.reason}`,
    `- Evidence: ${decision.evidence}`,
  ].join("\n");
}

export function createAgentWorklogFixture({
  decisions = {},
  evidenceLines = [
    "- Source reviewed: src/app/app-schema.ts and src/app/product-renderer.tsx.",
    "- Contract applied: runtime-shell-required and performance-coverage-levels.",
  ],
  extraDecisionSections = [],
  mode = "product",
  omitDecisionTrailFields = [],
  risksLines = ["- None: no known risk."],
  trailFields = {},
  trailHeading = "Delivery 1 - Product build",
  verificationLines = ["- Run: pnpm verify:delivery"],
}: AgentWorklogFixtureOptions = {}): string {
  const omittedFields = new Set<WorklogDecisionTrailField>(omitDecisionTrailFields);
  const resolvedTrailFields = {
    ...defaultDecisionTrailFields,
    ...trailFields,
  };
  const decisionTrailLines = requiredAgentWorklogDecisionTrailFields
    .filter((field) => !omittedFields.has(field))
    .map((field) => `- ${field}: ${resolvedTrailFields[field]}`);

  return [
    "# Implementation Worklog",
    "",
    "## Status",
    "",
    `Mode: ${mode}`,
    "",
    "## Decisions",
    "",
    ...requiredAgentWorklogDecisionSections.map((section) =>
      renderDecisionSection(section, decisions[section]),
    ),
    ...extraDecisionSections,
    "",
    "## Decision Trail",
    "",
    `### ${trailHeading}`,
    "",
    ...decisionTrailLines,
    "",
    "## Evidence",
    "",
    ...evidenceLines,
    "",
    "## Verification",
    "",
    ...verificationLines,
    "",
    "## Risks",
    "",
    ...risksLines,
  ].join("\n");
}

function getMarkdownHeadingLevel(line: string): number | null {
  const match = /^(#{1,6})\s+\S/.exec(line.trim());

  return match ? match[1].length : null;
}

function getMarkdownSectionBody(source: string, heading: string): string {
  const lines = source.split(/\r?\n/);
  const headingPattern = new RegExp(`^(#{1,6})\\s+${escapeRegExp(heading)}\\s*$`, "i");
  const startIndex = lines.findIndex((line) => headingPattern.test(line.trim()));

  if (startIndex < 0) {
    return "";
  }

  const startLevel = getMarkdownHeadingLevel(lines[startIndex]);
  const bodyLines: string[] = [];

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const nextLevel = getMarkdownHeadingLevel(lines[index]);

    if (startLevel !== null && nextLevel !== null && nextLevel <= startLevel) {
      break;
    }

    bodyLines.push(lines[index]);
  }

  return bodyLines.join("\n").trim();
}

function getAgentWorklogDecisionTrailIterations(
  decisionTrailBody: string,
): Array<{ body: string; heading: string }> {
  const iterations: Array<{ body: string; heading: string }> = [];
  let currentHeading = "";
  let currentBody: string[] = [];

  for (const line of decisionTrailBody.split(/\r?\n/)) {
    const headingMatch = /^###\s+(.+?)\s*$/.exec(line.trim());

    if (headingMatch) {
      if (currentHeading) {
        iterations.push({ body: currentBody.join("\n").trim(), heading: currentHeading });
      }

      currentHeading = headingMatch[1];
      currentBody = [];
      continue;
    }

    if (currentHeading) {
      currentBody.push(line);
    }
  }

  if (currentHeading) {
    iterations.push({ body: currentBody.join("\n").trim(), heading: currentHeading });
  }

  return iterations;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type ParsedVerificationEntries = {
  commands: ToolcraftWorklogVerificationCommand[];
  errors: string[];
};

function getDecisionTrailVerificationEntries(iterationBody: string): string[] {
  return [
    ...iterationBody.matchAll(/^-\s*Verification:\s*(.*?)\s*$/gimu),
  ].map((match) => match[1]);
}

function getRunVerificationEntries(verificationBody: string): string[] {
  return [...verificationBody.matchAll(/^-\s*Run:\s*(.*?)\s*$/gimu)].map(
    (match) => match[1],
  );
}

function parseVerificationEntries(
  entries: readonly string[],
  { allowNarrative = false }: { allowNarrative?: boolean } = {},
): ParsedVerificationEntries {
  const commands: ToolcraftWorklogVerificationCommand[] = [];
  const errors: string[] = [];

  for (const entry of entries) {
    const hasNarrativeAroundInlineCode =
      /`[^`\r\n]+`/u.test(entry) &&
      !/^`[^`\r\n]+`\.?$/u.test(entry.trim());
    if (allowNarrative && hasNarrativeAroundInlineCode) {
      commands.push({ kind: "other" });
      continue;
    }

    try {
      commands.push(parseToolcraftWorklogVerificationCommand(entry));
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  return { commands, errors };
}

function getPerformanceIterationCommandError(
  decisionCommands: readonly ToolcraftWorklogVerificationCommand[],
  runCommands: readonly ToolcraftWorklogVerificationCommand[],
): string | null {
  const getDeliveryCommands = (
    commands: readonly ToolcraftWorklogVerificationCommand[],
  ) => commands.filter(
    (
      command,
    ): command is Extract<
      ToolcraftWorklogVerificationCommand,
      { kind: "delivery" }
    > =>
      command.kind === "delivery" &&
      command.requestedReason === "performance-iteration",
  );
  const decisionDeliveryCommands = getDeliveryCommands(decisionCommands);
  const runDeliveryCommands = getDeliveryCommands(runCommands);

  if (
    decisionDeliveryCommands.length === 0 ||
    runDeliveryCommands.length === 0
  ) {
    return "must verify through pnpm verify:delivery -- --reason=performance-iteration with an exact tier and performance selector";
  }
  if (
    decisionDeliveryCommands.length !== 1 ||
    runDeliveryCommands.length !== 1
  ) {
    return "must include exactly one performance-iteration delivery command";
  }

  if (
    JSON.stringify(decisionDeliveryCommands[0]) !==
    JSON.stringify(runDeliveryCommands[0])
  ) {
    return "must execute the same performance-iteration delivery command recorded in the Decision Trail";
  }

  const hasValidCommand = runDeliveryCommands.some((command) => {
    const tierArguments = command.targetedArguments.filter((argument) =>
      argument.startsWith("--tier="),
    );
    const performanceTests = command.targetedArguments.filter((argument) =>
      argument.startsWith("--performance-test="),
    );
    const tier = Number(tierArguments[0]?.slice("--tier=".length));

    return (
      tierArguments.length === 1 &&
      Number.isInteger(tier) &&
      tier >= 3 &&
      tier <= 4 &&
      performanceTests.length >= 1
    );
  });

  return hasValidCommand
    ? null
    : "must include one valid --tier=3 or --tier=4 and at least one exact --performance-test selector on the performance-iteration delivery command";
}

function getAgentWorklogPerformanceIntentErrors(
  iteration: { body: string; heading: string },
  runVerificationEntries: readonly string[],
): string[] {
  const requestMatches = [
    ...iteration.body.matchAll(/^-\s*Request:\s*(.*?)\s*$/gimu),
  ];
  if (requestMatches.length !== 1) {
    return [
      `agent-worklog.md Decision Trail iteration "${iteration.heading}" must include exactly one "Request:" before performance authority can be evaluated.`,
    ];
  }
  const request = requestMatches[0][1];
  const intentMatches = [
    ...iteration.body.matchAll(/^-\s*Performance intent:\s*(.*?)\s*$/gimu),
  ];

  if (intentMatches.length !== 1) {
    return [
      `agent-worklog.md Decision Trail iteration "${iteration.heading}" must include exactly one "Performance intent:".`,
    ];
  }

  const intent = intentMatches[0][1].trim();
  const requestClassification = classifyToolcraftPerformanceRequest(request);
  const parsedDecisionEntries = parseVerificationEntries(
    getDecisionTrailVerificationEntries(iteration.body),
    { allowNarrative: intent === "ordinary-product-work" },
  );
  const parsedRunEntries = parseVerificationEntries(runVerificationEntries);
  const parsedCommands = [
    ...parsedDecisionEntries.commands,
    ...parsedRunEntries.commands,
  ];
  const parsedErrors = [
    ...parsedDecisionEntries.errors,
    ...parsedRunEntries.errors,
  ];
  const hasPerformanceIterationCommand = parsedCommands.some(
    (command) =>
      command.kind === "delivery" &&
      command.requestedReason === "performance-iteration",
  );
  const hasFullCertificationCommand = parsedCommands.some(
    (command) => command.kind === "full-performance",
  );

  if (intent === "ordinary-product-work") {
    const errors: string[] = [];

    if (requestClassification.intent === "performance-iteration") {
      errors.push(
        `agent-worklog.md Decision Trail iteration "${iteration.heading}" contains a clear user performance signal and must use performance-iteration.`,
      );
    }
    if (hasPerformanceIterationCommand) {
      errors.push(
        `agent-worklog.md Decision Trail iteration "${iteration.heading}" uses performance-iteration verification and must record a concrete performance-iteration Performance intent.`,
      );
    }
    if (hasFullCertificationCommand) {
      errors.push(
        `agent-worklog.md Decision Trail iteration "${iteration.heading}" cannot use request wording or worklog evidence to authorize full performance certification.`,
      );
    }
    for (const error of parsedErrors) {
      errors.push(
        `agent-worklog.md Decision Trail iteration "${iteration.heading}" has an invalid executed verification entry: ${error}`,
      );
    }

    return errors;
  }

  if (!intent.startsWith("performance-iteration")) {
    return [
      `agent-worklog.md Decision Trail iteration "${iteration.heading}" has an unknown Performance intent.`,
    ];
  }

  const iterationMatch =
    /^performance-iteration\s+—\s+Request evidence:\s*(?:"([^"]+)"|“([^”]+)”)$/u.exec(
      intent,
    );

  if (!iterationMatch) {
    return [
      `agent-worklog.md Decision Trail iteration "${iteration.heading}" performance-iteration must use 'Request evidence: "<verbatim request quote>"' after an em dash.`,
    ];
  }

  const evidenceResult = validateToolcraftPerformanceRequestEvidence(
    request,
    iterationMatch[1] ?? iterationMatch[2] ?? "",
  );
  if (!evidenceResult.valid) {
    return [
      `agent-worklog.md Decision Trail iteration "${iteration.heading}" has invalid performance iteration Request evidence: ${describeToolcraftPerformanceRequestReason(evidenceResult.reason)}`,
    ];
  }

  if (hasFullCertificationCommand) {
    return [
      `agent-worklog.md Decision Trail iteration "${iteration.heading}" cannot use request wording or worklog evidence to authorize full performance certification.`,
    ];
  }

  if (parsedErrors.length > 0) {
    return parsedErrors.map(
      (error) =>
        `agent-worklog.md Decision Trail iteration "${iteration.heading}" has an invalid executed verification entry: ${error}`,
    );
  }

  const commandError = getPerformanceIterationCommandError(
    parsedDecisionEntries.commands,
    parsedRunEntries.commands,
  );
  return commandError
    ? [
        `agent-worklog.md Decision Trail iteration "${iteration.heading}" ${commandError}.`,
      ]
    : [];
}

export function getAgentWorklogValidationErrors(source: string): string[] {
  const errors: string[] = [];

  for (const section of requiredAgentWorklogSections) {
    if (!getMarkdownSectionBody(source, section)) {
      errors.push(`agent-worklog.md must include a populated "${section}" section.`);
    }
  }

  const statusBody = getMarkdownSectionBody(source, "Status");

  if (!/\bMode:\s*product\b/i.test(statusBody)) {
    errors.push('agent-worklog.md Status must declare "Mode: product" before final delivery.');
  }

  if (/\bMode:\s*starter\b/i.test(statusBody)) {
    errors.push('agent-worklog.md still declares "Mode: starter"; replace the starter template with product decisions.');
  }

  for (const section of requiredAgentWorklogDecisionSections) {
    const body = getMarkdownSectionBody(source, section);

    if (!/\bDecision:\s*\S/i.test(body)) {
      errors.push(`agent-worklog.md "${section}" must include a concrete Decision.`);
    }

    if (!/\bReason:\s*\S/i.test(body)) {
      errors.push(`agent-worklog.md "${section}" must include the Reason for the decision.`);
    }

    if (!/\bEvidence:\s*\S/i.test(body)) {
      errors.push(`agent-worklog.md "${section}" must include Evidence such as files, tests, browser checks, or contract rules.`);
    }
  }

  const decisionTrailBody = getMarkdownSectionBody(source, "Decision Trail");
  const decisionTrailIterations = getAgentWorklogDecisionTrailIterations(decisionTrailBody);
  const verificationBody = getMarkdownSectionBody(source, "Verification");
  const runVerificationEntries = getRunVerificationEntries(verificationBody);

  if (decisionTrailIterations.length === 0) {
    errors.push("agent-worklog.md Decision Trail must include at least one iteration heading.");
  }

  for (const [index, iteration] of decisionTrailIterations.entries()) {
    for (const field of requiredAgentWorklogDecisionTrailFields) {
      if (field === "Performance intent") continue;

      const fieldPattern = new RegExp(`\\b${escapeRegExp(field)}:\\s*\\S`, "i");

      if (!fieldPattern.test(iteration.body)) {
        errors.push(
          `agent-worklog.md Decision Trail iteration "${iteration.heading}" must include "${field}:".`,
        );
      }
    }

    errors.push(
      ...getAgentWorklogPerformanceIntentErrors(
        iteration,
        index === decisionTrailIterations.length - 1
          ? runVerificationEntries
          : [],
      ),
    );
  }

  const evidenceBody = getMarkdownSectionBody(source, "Evidence");
  const risksBody = getMarkdownSectionBody(source, "Risks");

  if (!/\b(Source reviewed|Contract applied|Evidence):\s*\S/i.test(evidenceBody)) {
    errors.push("agent-worklog.md Evidence must name reviewed files, references, or contract rules.");
  }

  if (
    worklogVideoReferencePattern.test(source) &&
    !worklogVideoReferenceStudyPattern.test(source)
  ) {
    errors.push(
      "agent-worklog.md cites a video reference, screen recording, GIF, extracted frames, or contact sheet; record a Video Reference Study with storyboard frames and frame-to-frame transition analysis.",
    );
  }

  if (!/\bpnpm\s+(verify|test|build|typecheck)|browser|Playwright|perf/i.test(verificationBody)) {
    errors.push("agent-worklog.md Verification must list concrete test/build/browser/performance checks.");
  }

  if (!/\b(Risk|None):\s*\S/i.test(risksBody)) {
    errors.push('agent-worklog.md Risks must include either "Risk:" entries or "None:" with a reason.');
  }

  return [...new Set(errors)];
}
