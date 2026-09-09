import { describe, expect, it } from "vitest";

import {
  fullPerformanceCommands,
  wrappedPerformanceCommands,
} from "./app-acceptance.worklog-performance-command-cases";
import { createPerformanceIterationWorklogFixture } from "./app-acceptance.worklog-performance-intent-test-utils";
import {
  createAgentWorklogFixture,
  getAgentWorklogValidationErrors,
} from "./app-acceptance.worklog-test-utils";

describe("starter acceptance worklog command authority", () => {
  it("ignores command-like explanatory mentions outside executed verification entries", () => {
    const worklog = createAgentWorklogFixture()
      .replace(
        "- Decision: Use SVG renderer with Toolcraft controls.",
        "- Decision: Keep --reason=performance-iteration limited to actual delivery verification.",
      )
      .replace(
        "- Alternatives rejected: Canvas output because vector output must stay crisp.",
        "- Alternatives rejected: Running pnpm verify:delivery -- --reason=performance-iteration --tier=3 --performance-test=browser-perf here would be excessive.",
      )
      .replace(
        "- Risks: None; browser and performance gates cover the touched surfaces.",
        "- Risks: The operator may separately run pnpm verify:perf; this is not delivery authority.",
      );

    expect(getAgentWorklogValidationErrors(worklog)).toEqual([]);
  });

  it("does not accept a valid command mentioned only in explanatory fields", () => {
    const worklog = createPerformanceIterationWorklogFixture({
      request: "The app lags while dragging.",
      trailFields: { Verification: "pnpm verify:delivery." },
      verificationLines: ["- Run: pnpm verify:delivery"],
    }).replace(
      "- Alternatives rejected: Canvas output because vector output must stay crisp.",
      '- Alternatives rejected: pnpm verify:delivery -- --reason=performance-iteration --tier=3 --performance-test="browser perf: control-drag:composite".',
    );

    expect(getAgentWorklogValidationErrors(worklog)).not.toEqual([]);
  });

  it.each(fullPerformanceCommands)(
    "rejects the full operator command in an executed verification entry: %s",
    (command) => {
      const worklog = createAgentWorklogFixture({
        verificationLines: ["- Run: pnpm verify:delivery", `- Run: ${command}`],
      });

      expect(getAgentWorklogValidationErrors(worklog)).toContain(
        'agent-worklog.md Decision Trail iteration "Delivery 1 - Product build" cannot use request wording or worklog evidence to authorize full performance certification.',
      );
    },
  );

  it.each([
    "echo diagnostic",
    "rg documentation docs",
    'node -e "console.log(\'diagnostic\')"',
  ])("does not treat unrelated literal text as worklog authority: %s", (command) => {
    const worklog = createAgentWorklogFixture({
      verificationLines: ["- Run: pnpm verify:delivery", `- Run: ${command}`],
    });

    expect(getAgentWorklogValidationErrors(worklog)).toEqual([]);
  });

  it.each(wrappedPerformanceCommands)(
    "rejects an executed command wrapper: %s",
    (command) => {
      const worklog = createAgentWorklogFixture({
        verificationLines: ["- Run: pnpm verify:delivery", `- Run: ${command}`],
      });

      expect(getAgentWorklogValidationErrors(worklog)).toEqual(
        expect.arrayContaining([
          expect.stringContaining("has an invalid executed verification entry"),
        ]),
      );
    },
  );

  it("rejects a wrapper used as performance iteration verification", () => {
    const worklog = createPerformanceIterationWorklogFixture({
      request: "The app lags while dragging.",
      trailFields: { Verification: 'sh -c "pnpm verify:delivery".' },
      verificationLines: ['- Run: sh -c "pnpm verify:delivery"'],
    });

    expect(getAgentWorklogValidationErrors(worklog)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("has an invalid executed verification entry"),
      ]),
    );
  });

  it("accepts protected script words as literal targeted selector text", () => {
    const command =
      'pnpm verify:delivery -- --reason=performance-iteration --tier=3 --performance-test="verify:perf authority remains isolated"';
    const worklog = createPerformanceIterationWorklogFixture({
      request: "The app lags while dragging.",
      trailFields: { Verification: `${command}.` },
      verificationLines: [`- Run: ${command}`],
    });

    expect(getAgentWorklogValidationErrors(worklog)).toEqual([]);
  });

  it.each([
    'pnpm verify:delivery -- --reason=performance-iteration --tier=3 --performance-test="browser perf: control-drag:composite" && pnpm verify:perf',
    'pnpm verify:delivery -- --reason=performance-iteration --tier=3 --performance-test="browser perf: control-drag:composite"; pnpm test',
    'pnpm verify:delivery -- --reason=performance-iteration --reason=performance-iteration --tier=3 --performance-test="browser perf: control-drag:composite"',
    'pnpm verify:delivery -- --reason=performance-iteration --tier=3 --performance-test="   "',
    'pnpm verify:delivery -- --reason=performance-iteration --tier=3 --performance-test="browser perf: unfinished',
    "pnpm verify:delivery -- --reason=performance-iteration --tier=3 --performance-test=$TEST",
  ])("rejects malformed performance iteration execution: %s", (command) => {
    const worklog = createPerformanceIterationWorklogFixture({
      request: "The app lags while dragging.",
      trailFields: { Verification: `${command}.` },
      verificationLines: [`- Run: ${command}`],
    });

    expect(getAgentWorklogValidationErrors(worklog)).not.toEqual([]);
  });

  it("does not combine authority tokens distributed across verification entries", () => {
    const worklog = createPerformanceIterationWorklogFixture({
      request: "The app lags while dragging.",
      trailFields: {
        Verification:
          "pnpm verify:delivery -- --reason=performance-iteration --tier=3.",
      },
      verificationLines: [
        '- Run: pnpm verify:delivery -- --performance-test="browser perf: control-drag:composite"',
      ],
    });

    expect(getAgentWorklogValidationErrors(worklog)).not.toEqual([]);
  });
});
