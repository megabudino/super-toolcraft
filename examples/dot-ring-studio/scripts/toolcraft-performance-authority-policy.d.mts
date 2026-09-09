import type { ToolcraftDecisionTrailIteration } from "./toolcraft-worklog-decision-trail.mjs";

export declare const TOOLCRAFT_DELIVERY_VERIFICATION_COMMAND: string;
export declare const TOOLCRAFT_FULL_PERFORMANCE_VERIFICATION_COMMAND: string;
export declare const TOOLCRAFT_DELIVERY_VERIFICATION_NARRATIVE: string;

export declare function getToolcraftDecisionTrailFieldMatches(
  iteration: ToolcraftDecisionTrailIteration,
  field: string,
): string[];

export declare function getToolcraftDecisionTrailVerificationErrors(
  iteration: ToolcraftDecisionTrailIteration,
): string[];

export declare function validateToolcraftPerformanceAuthorityIteration(
  iteration: ToolcraftDecisionTrailIteration,
): {
  errors: string[];
  intent?: string;
  pathIds?: string[];
  request?: string;
  requestEvidence?: string;
};
