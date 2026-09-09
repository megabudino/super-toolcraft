import {
  createAgentWorklogFixture,
  type AgentWorklogFixtureOptions,
} from "./app-acceptance.worklog-test-utils";

export const clearPerformanceSignalError =
  'agent-worklog.md Decision Trail iteration "Delivery 1 - Product build" contains a clear user performance signal and must use performance-iteration.';

type PerformanceIterationWorklogFixtureOptions = AgentWorklogFixtureOptions & {
  evidence?: string;
  performanceTest?: string;
  request: string;
  tier?: number;
};

export function createPerformanceIterationWorklogFixture({
  evidence,
  performanceTest = "browser perf: control-drag:composite",
  request,
  tier = 3,
  ...options
}: PerformanceIterationWorklogFixtureOptions): string {
  const requestEvidence = evidence ?? request;
  const verificationCommand =
    `pnpm verify:delivery -- --reason=performance-iteration --tier=${tier} ` +
    `--performance-test="${performanceTest}"`;

  return createAgentWorklogFixture({
    ...options,
    trailFields: {
      ...options.trailFields,
      "Performance intent":
        `performance-iteration — Request evidence: "${requestEvidence}"`,
      Request: request,
      Verification:
        options.trailFields?.Verification ?? `${verificationCommand}.`,
    },
    verificationLines: options.verificationLines ?? [
      `- Run: ${verificationCommand}`,
    ],
  });
}
