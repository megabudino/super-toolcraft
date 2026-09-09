import { expect, test } from "@playwright/test";

import type { ToolcraftComponentAcceptance } from "../src/app/app-acceptance";
import { deriveToolcraftBrowserRuntimeRequirements } from "./browser-runtime-evidence-requirements";

function renderScaleAcceptance(
  states: readonly ("interaction" | "playback" | "steady")[],
): ToolcraftComponentAcceptance {
  return {
    automated: true,
    automatedTestName: "canvas render scale acceptance",
    browser: true,
    browserTestName: "browser: canvas render scale backing pixels",
    componentType: "canvas-render-scale",
    evidence: "rendered-pixels",
    expectedObservable: "Canvas backing pixels match the selected resolution scale.",
    fixture: "A visible raster canvas.",
    id: "canvas.render-scale",
    kind: "runtime",
    renderScaleCoverage: {
      kind: "selected-backing-pixels",
      states,
    },
    target: "canvas.renderScale",
    userAction: "Change resolution scale and exercise each renderer state.",
  };
}

test("render-scale coverage derives one exact functional requirement per state", () => {
  const requirements = deriveToolcraftBrowserRuntimeRequirements([
    renderScaleAcceptance(["interaction", "playback", "steady"]),
  ]);

  expect(
    requirements.filter(
      ({ evidenceType }) => evidenceType === "canvas-render-scale-backing",
    ),
  ).toEqual([
    {
      evidenceType: "canvas-render-scale-backing",
      requirementId: "canvas.render-scale#interaction",
      target: "canvas.renderScale",
      testName: "browser: canvas render scale backing pixels",
    },
    {
      evidenceType: "canvas-render-scale-backing",
      requirementId: "canvas.render-scale#playback",
      target: "canvas.renderScale",
      testName: "browser: canvas render scale backing pixels",
    },
    {
      evidenceType: "canvas-render-scale-backing",
      requirementId: "canvas.render-scale#steady",
      target: "canvas.renderScale",
      testName: "browser: canvas render scale backing pixels",
    },
  ]);
});

test("render-scale functional requirements remain separate from performance evidence", () => {
  const requirements = deriveToolcraftBrowserRuntimeRequirements([
    renderScaleAcceptance(["interaction", "steady"]),
  ]);

  expect(requirements.map(({ evidenceType }) => evidenceType)).toContain(
    "canvas-render-scale-backing",
  );
  expect(requirements.map(({ evidenceType }) => evidenceType)).not.toContain(
    "performance-render-scale",
  );
});
