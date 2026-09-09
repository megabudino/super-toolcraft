import { existsSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  agentWorklogPath,
  createAgentWorklogFixture,
  getAgentWorklogValidationErrors,
  isPassedDeliveryVerificationLine,
  readToolcraftDoc,
} from "./app-acceptance.worklog-test-utils";

const deliveryEvidenceError =
  "agent-worklog.md Verification must record one passed `pnpm verify:delivery` result for the coherent delivery batch.";

function appendDecisionTrailIteration(
  worklog: string,
  trailFields: NonNullable<
    Parameters<typeof createAgentWorklogFixture>[0]
  >["trailFields"],
): string {
  const fixture = createAgentWorklogFixture({
    trailFields,
    trailHeading: "Delivery 2 - Later product edit",
  });
  const latestIteration = /## Decision Trail\n\n([\s\S]*?)\n\n## Evidence/u.exec(
    fixture,
  )?.[1];
  if (!latestIteration) throw new Error("Expected a rendered decision-trail iteration.");
  return worklog.replace("\n## Evidence", `\n${latestIteration}\n\n## Evidence`);
}

describe("starter acceptance worklog contract", () => {
  it("keeps an implementation worklog available for generated app decisions", () => {
    expect(
      existsSync(agentWorklogPath),
      "Generated apps must include docs/toolcraft/agent-worklog.md so implementation decisions and evidence survive the chat context.",
    ).toBe(true);
  });

  it("documents control selection inventory and custom built-in fit checks", () => {
    const coreControlSelection = readToolcraftDoc("core/control-selection.md");
    const componentRules = readToolcraftDoc("component-rules.md");
    const acceptanceTesting = readToolcraftDoc("acceptance-testing.md");

    expect(coreControlSelection).toContain("Control Selection Inventory");
    expect(coreControlSelection).toContain("Product need:");
    expect(coreControlSelection).toContain("Candidate built-ins checked:");
    expect(coreControlSelection).toContain("Best built-in:");
    expect(coreControlSelection).toContain("Rejected alternatives:");
    expect(coreControlSelection).toContain("Target:");
    expect(coreControlSelection).toContain("Custom Control Gate");

    expect(componentRules).toContain("Control Decision Catalog");
    expect(componentRules).toContain("core/control-selection.md");

    expect(acceptanceTesting).toContain("wrong-substitution");
    expect(acceptanceTesting).toContain("built-in fit check");
    expect(acceptanceTesting).toContain("builtInFitCheck");
  });

  it("requires product worklogs to record storyboard evidence for video references", () => {
    const worklog = createAgentWorklogFixture({
      evidenceLines: [
        "- Source reviewed: user prompt, ref.mp4, src/app/product-renderer.tsx.",
        "- Contract applied: Toolcraft workflow.",
      ],
      trailFields: {
        "Reference inputs": "/fixtures/reference-motion/ref.mp4 video reference.",
        "Source/reference checked": "User prompt and /fixtures/reference-motion/ref.mp4 video.",
      },
    });

    expect(getAgentWorklogValidationErrors(worklog)).toContain(
      "agent-worklog.md cites a video reference, screen recording, GIF, extracted frames, or contact sheet; record a Video Reference Study with storyboard frames and frame-to-frame transition analysis.",
    );
  });

  it("accepts product worklogs that record video reference storyboard and transition evidence", () => {
    const worklog = createAgentWorklogFixture({
      evidenceLines: [
        "- Source reviewed: user prompt, ref.mp4, extracted frames, contact sheet, src/app/product-renderer.tsx.",
        "- Contract applied: Toolcraft workflow and video-reference-analysis.",
      ],
      extraDecisionSections: [
        [
          "### Video Reference Study",
          "- Decision: Implement from storyboard frames and frame-to-frame transition analysis.",
          "- Reason: The video reference defines behavior, not only a static visual state.",
          "- Evidence: extracted frames f000/f012/f024/f036 and transition analysis between adjacent frames.",
        ].join("\n"),
      ],
      trailFields: {
        "Alternatives rejected": "Single screenshot implementation because the video behavior changes frame to frame.",
        "Contract rules applied": "video-reference-analysis and acceptance-product-observable.",
        "Reference inputs": "/fixtures/reference-motion/ref.mp4 video reference, extracted frames, contact sheet.",
        "Source/reference checked": "User prompt, /fixtures/reference-motion/ref.mp4 video, extracted frames, and contact sheet.",
      },
    });

    expect(getAgentWorklogValidationErrors(worklog)).toEqual([]);
  });

  it("does not treat ordinary video export worklog evidence as a video reference", () => {
    const worklog = createAgentWorklogFixture({
      decisions: {
        Export: {
          decision: "Expose Export PNG and Export Video.",
          evidence: "src/app/export.ts.",
          reason: "Animated products need still and video output.",
        },
        Renderer: {
          decision: "Use Canvas 2D.",
          evidence: "src/app/product-renderer.tsx.",
          reason: "Product output is simple animated geometry.",
        },
        Timeline: {
          decision: "Use playback.",
          evidence: "src/app/app-schema.ts.",
          reason: "Export Video requires runtime timeline time.",
        },
      },
      evidenceLines: [
        "- Source reviewed: user prompt, app schema, export handler, browser export behavior.",
        "- Contract applied: Toolcraft workflow.",
      ],
      trailFields: {
        Decision: "Use Toolcraft export helpers.",
        "Reference inputs": "None.",
        "Source/reference checked": "User prompt, app schema, export handler, and browser export behavior.",
        "State/output mapping": "Runtime timeline state drives preview and export frames.",
        "User-visible result": "The product renders and exports video.",
      },
    });

    expect(getAgentWorklogValidationErrors(worklog)).toEqual([]);
  });

  it("rejects stale or incomplete product worklogs", () => {
    const errors = getAgentWorklogValidationErrors(
      createAgentWorklogFixture({ mode: "starter" }),
    );

    expect(errors).toContain(
      'agent-worklog.md Status must declare "Mode: product" before final delivery.',
    );
    expect(errors).toContain(
      'agent-worklog.md still declares "Mode: starter"; replace the starter template with product decisions.',
    );
  });

  it("accepts product worklogs with concrete decisions, evidence, verification, and risk state", () => {
    expect(getAgentWorklogValidationErrors(createAgentWorklogFixture())).toEqual([]);
  });

  it("rejects product worklogs that report an incomplete delivery gate", () => {
    const worklog = createAgentWorklogFixture({
      risksLines: ["- Risk: Required checks are not complete."],
      trailFields: {
        Risks: "Product contract tests still need updates before delivery.",
        "Skipped checks": "pnpm verify:delivery is not complete yet.",
        Verification: "pnpm test failed; pnpm verify:delivery not complete.",
      },
      verificationLines: [
        "- Run: pnpm test failed.",
        "- Run: pnpm verify:delivery not complete.",
      ],
    });

    expect(getAgentWorklogValidationErrors(worklog)).toEqual(
      expect.arrayContaining([
        "agent-worklog.md required checks must be passed before delivery; do not report failed, incomplete, pending, or blocked verification.",
        "agent-worklog.md must not list `verify:delivery` as skipped for a recorded delivery batch.",
        deliveryEvidenceError,
      ]),
    );
  });

  it("requires product worklogs to record the protected delivery command", () => {
    const worklog = createAgentWorklogFixture({
      trailFields: {
        Verification: "pnpm verify:quick; pnpm verify:final.",
      },
      verificationLines: [
        "- Run: pnpm verify:quick",
        "- Run: pnpm verify:final",
      ],
    });

    expect(getAgentWorklogValidationErrors(worklog)).toContain(deliveryEvidenceError);
  });

  it("does not accept agent-browser prose as delivery authority", () => {
    const worklog = createAgentWorklogFixture({
      trailFields: {
        Verification: "pnpm verify:quick; agent-browser delivery check.",
      },
      verificationLines: [
        "- Run: pnpm verify:quick",
        "- Browser: delivery behavior inspected with agent-browser",
      ],
    });

    expect(getAgentWorklogValidationErrors(worklog)).toContain(deliveryEvidenceError);
  });

  it("recognizes protected delivery evidence line formats", () => {
    expect(
      isPassedDeliveryVerificationLine("- Verification: protected-delivery receipt"),
    ).toBe(true);
    expect(isPassedDeliveryVerificationLine("- Run: pnpm verify:delivery")).toBe(true);
    expect(
      isPassedDeliveryVerificationLine("- Run: `pnpm verify:delivery`"),
    ).toBe(true);
    expect(
      isPassedDeliveryVerificationLine(
        '- Run: pnpm verify:delivery -- --tier=3 --browser-test="browser: focused"',
      ),
    ).toBe(true);
    expect(
      isPassedDeliveryVerificationLine("- Run: pnpm verify:delivery not complete"),
    ).toBe(false);
    expect(
      isPassedDeliveryVerificationLine("- Run: pnpm verify:delivery not run"),
    ).toBe(false);
  });

  it("accepts Markdown-wrapped delivery evidence but rejects compatibility commands", () => {
    const wrappedDelivery = createAgentWorklogFixture({
      trailFields: {
        Verification: "`pnpm verify:delivery`.",
      },
      verificationLines: ["- Run: `pnpm verify:delivery`"],
    });
    expect(getAgentWorklogValidationErrors(wrappedDelivery)).toEqual([]);

    for (const command of [
      "`pnpm verify:perf:record-iteration -- --tier=2`",
      "`pnpm verify:final`",
    ]) {
      const compatibilityOnly = createAgentWorklogFixture({
        trailFields: { Verification: command },
        verificationLines: [`- Run: ${command}`],
      });
      expect(getAgentWorklogValidationErrors(compatibilityOnly)).toContain(
        deliveryEvidenceError,
      );
    }
  });

  it("allows an ordinary later delivery with exact targeted selectors", () => {
    const worklog = appendDecisionTrailIteration(
      createAgentWorklogFixture({
        decisions: {
          Performance: {
            decision: "Use targeted renderer verification without repeating the full suite.",
            evidence: "Prior delivery anchor plus the current protected delivery receipt.",
            reason: "The user did not request performance work.",
          },
        },
      }),
      {
        "Alternatives rejected": "Repeating every unrelated browser performance scenario.",
        Decision: "Verify only the touched renderer workload and record the current iteration.",
        "Files changed": "src/app/product-renderer.tsx.",
        Request: "Refine one renderer behavior in an already delivered app.",
        Risks: "Renderer responsiveness is covered by its targeted scenario.",
        "Skipped checks": "Full performance not required for ordinary post-first delivery.",
        "State/output mapping": "The changed renderer path updates product output directly.",
        "Task type": "Tier 3 renderer update after the first working version.",
        "User-visible result": "The renderer behavior is corrected.",
        Verification:
          'pnpm verify:delivery -- --tier=3 --performance-test="browser perf: focused renderer path".',
      },
    );

    expect(getAgentWorklogValidationErrors(worklog)).toEqual([]);
  });

  it("does not require a historical full-performance command in worklog prose", () => {
    const worklog = createAgentWorklogFixture({
      trailFields: {
        "Skipped checks": "Full performance not required for ordinary post-first delivery.",
        Verification:
          'pnpm verify:delivery -- --tier=2 --browser-test="browser: focused acceptance".',
      },
      verificationLines: [
        '- Run: pnpm verify:delivery -- --tier=2 --browser-test="browser: focused acceptance"',
      ],
    });

    expect(getAgentWorklogValidationErrors(worklog)).toEqual([]);
  });

  it("rejects a later delivery batch without its own protected delivery result", () => {
    const worklog = createAgentWorklogFixture({
      trailFields: {
        "Skipped checks": "Full performance not required for ordinary post-first delivery.",
        Verification: "pnpm verify:quick; targeted renderer browser scenario.",
      },
      verificationLines: [
        "- Run: pnpm verify:quick",
        "- Browser: targeted renderer workload passed",
      ],
    });

    expect(getAgentWorklogValidationErrors(worklog)).toContain(deliveryEvidenceError);
  });

  it("does not let a historical delivery excuse the latest unreceipted batch", () => {
    const worklog = appendDecisionTrailIteration(createAgentWorklogFixture(), {
      "Files changed": "src/app/app-schema.ts.",
      Request: "Refine product behavior after the prototype delivery.",
      "Skipped checks": "Full performance not required for ordinary post-first delivery.",
      "Task type": "Tier 2 product behavior update.",
      "User-visible result": "The product behavior is refined.",
      Verification: "pnpm verify:quick; targeted browser acceptance.",
    });

    expect(getAgentWorklogValidationErrors(worklog)).toContain(deliveryEvidenceError);
  });

  it("rejects product worklogs without an actionable decision trail", () => {
    const worklog = createAgentWorklogFixture({
      omitDecisionTrailFields: [
        "Alternatives rejected",
        "Contract rules applied",
        "Reference inputs",
        "Skipped checks",
        "Source/reference checked",
        "State/output mapping",
        "User-visible result",
      ],
    });

    expect(getAgentWorklogValidationErrors(worklog)).toEqual(
      expect.arrayContaining([
        'agent-worklog.md Decision Trail iteration "Delivery 1 - Product build" must include "User-visible result:".',
        'agent-worklog.md Decision Trail iteration "Delivery 1 - Product build" must include "Source/reference checked:".',
        'agent-worklog.md Decision Trail iteration "Delivery 1 - Product build" must include "Reference inputs:".',
        'agent-worklog.md Decision Trail iteration "Delivery 1 - Product build" must include "Contract rules applied:".',
        'agent-worklog.md Decision Trail iteration "Delivery 1 - Product build" must include "Alternatives rejected:".',
        'agent-worklog.md Decision Trail iteration "Delivery 1 - Product build" must include "State/output mapping:".',
        'agent-worklog.md Decision Trail iteration "Delivery 1 - Product build" must include "Skipped checks:".',
      ]),
    );
  });
});
