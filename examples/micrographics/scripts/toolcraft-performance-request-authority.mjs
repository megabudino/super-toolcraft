import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { parseToolcraftWorklogVerificationCommand } from "./toolcraft-worklog-verification-command.mjs";

function getSectionBody(source, heading) {
  const match = new RegExp(
    `^##\\s+${heading}\\s*$([\\s\\S]*?)(?=^##\\s+|(?![\\s\\S]))`,
    "imu",
  ).exec(source);
  return match?.[1] ?? "";
}

function getDecisionTrailIterations(source) {
  return [
    ...getSectionBody(source, "Decision Trail").matchAll(
      /^###\s+(.+?)\s*$([\s\S]*?)(?=^###\s+|(?![\s\S]))/gimu,
    ),
  ].map((match) => ({ body: match[2], heading: match[1].trim() }));
}

function getSingleField(body, field) {
  const matches = [
    ...body.matchAll(
      new RegExp(`^-\\s*${field}:\\s*(.*?)\\s*$`, "gimu"),
    ),
  ];
  if (matches.length !== 1) {
    throw new Error(
      `Toolcraft performance request authority requires exactly one ${field} field.`,
    );
  }
  return matches[0][1].trim();
}

function getPerformanceCommand(value) {
  const command = parseToolcraftWorklogVerificationCommand(value);
  return command.kind === "delivery" &&
    command.requestedReason === "performance-iteration"
    ? command
    : null;
}

function canonicalizeCommand(command) {
  return JSON.stringify({
    kind: command.kind,
    requestedReason: command.requestedReason,
    targetedArguments: command.targetedArguments,
  });
}

export function createToolcraftPerformanceRequestAuthority(source) {
  const iterations = getDecisionTrailIterations(source);
  const latest = iterations.at(-1);
  if (!latest) {
    throw new Error(
      "Toolcraft performance request authority requires a Decision Trail iteration.",
    );
  }
  const request = getSingleField(latest.body, "Request");
  const intent = getSingleField(latest.body, "Performance intent");
  const intentMatch =
    /^performance-iteration\s+—\s+Request evidence:\s*(?:"([^"]+)"|“([^”]+)”)$/u.exec(
      intent,
    );
  if (!intentMatch) {
    throw new Error(
      "Toolcraft latest Decision Trail iteration must declare performance-iteration request evidence.",
    );
  }
  const requestEvidence = intentMatch[1] ?? intentMatch[2];
  const decisionCommand = getPerformanceCommand(
    getSingleField(latest.body, "Verification"),
  );
  if (!decisionCommand) {
    throw new Error(
      "Toolcraft performance request authority requires one Decision Trail performance-iteration command.",
    );
  }
  const canonicalCommand = canonicalizeCommand(decisionCommand);
  const matchingRuns = [
    ...getSectionBody(source, "Verification").matchAll(
      /^-\s*Run:\s*(.*?)\s*$/gimu,
    ),
  ]
    .map((match) => getPerformanceCommand(match[1]))
    .filter((command) => command !== null)
    .filter((command) => canonicalizeCommand(command) === canonicalCommand);
  if (matchingRuns.length !== 1) {
    throw new Error(
      "Toolcraft performance request authority requires exactly one matching executed performance-iteration command.",
    );
  }

  const hash = createHash("sha256")
    .update(
      JSON.stringify({
        command: JSON.parse(canonicalCommand),
        heading: latest.heading,
        intent,
        request,
        requestEvidence,
      }),
    )
    .digest("hex");
  return Object.freeze({
    command: Object.freeze(JSON.parse(canonicalCommand)),
    hash,
    heading: latest.heading,
    request,
    requestEvidence,
  });
}

export async function readToolcraftPerformanceRequestAuthority(projectDir) {
  const worklogPath = path.join(
    path.resolve(projectDir),
    "docs",
    "toolcraft",
    "agent-worklog.md",
  );
  return createToolcraftPerformanceRequestAuthority(
    await fs.readFile(worklogPath, "utf8"),
  );
}
