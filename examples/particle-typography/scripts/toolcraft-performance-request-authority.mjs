import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import {
  getToolcraftDecisionTrailVerificationErrors,
  validateToolcraftPerformanceAuthorityIteration,
} from "./toolcraft-performance-authority-policy.mjs";
import {
  parseToolcraftDecisionTrail,
} from "./toolcraft-worklog-decision-trail.mjs";

function throwFirstError(errors) {
  if (errors.length > 0) throw new Error(errors[0]);
}

export function createToolcraftPerformanceRequestAuthority(source) {
  const decisionTrail = parseToolcraftDecisionTrail(source);
  throwFirstError(decisionTrail.errors);
  const latest = decisionTrail.iterations.at(-1);
  if (!latest) {
    throw new Error(
      "agent-worklog.md Decision Trail must include at least one iteration heading.",
    );
  }

  throwFirstError(getToolcraftDecisionTrailVerificationErrors(latest));
  const validation =
    validateToolcraftPerformanceAuthorityIteration(latest);
  throwFirstError(validation.errors);
  if (validation.intent === "ordinary-product-work") return null;
  if (
    !validation.pathIds ||
    validation.request === undefined ||
    validation.requestEvidence === undefined
  ) {
    throw new Error(
      "Toolcraft performance request authority is incomplete.",
    );
  }

  const canonical = {
    heading: latest.heading,
    pathIds: validation.pathIds,
    request: validation.request,
    requestEvidence: validation.requestEvidence,
  };
  return Object.freeze({
    hash: createHash("sha256")
      .update(JSON.stringify(canonical))
      .digest("hex"),
    pathIds: Object.freeze(validation.pathIds),
    requestEvidence: validation.requestEvidence,
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
