import { describe, expect, it } from "vitest";

import type { ToolcraftState } from "@/toolcraft/runtime";

import { appPerformance } from "./app-performance";
import { createPosterSceneCacheInput } from "./renderer-pipeline";

describe("renderer pipeline", () => {
  it("invalidates the poster scene when glow changes", () => {
    const state = {
      canvas: { size: { height: 1350, unit: "px", width: 1080 } },
      values: { "ink.glow": 64 },
    } as unknown as ToolcraftState;

    expect(createPosterSceneCacheInput(state)).toMatchObject({
      "ink.glow": 64,
    });
  });

  it("classifies glow as a live control drag", () => {
    const controlDrag = appPerformance.scenarios.find(
      (scenario) => scenario.interaction === "control-drag",
    );
    const controlChange = appPerformance.scenarios.find(
      (scenario) => scenario.interaction === "control-change",
    );

    expect(controlDrag?.coversTargets).toContain("ink.glow");
    expect(controlChange?.coversTargets).not.toContain("ink.glow");
  });

  it("models random template tier as a scene workload input", () => {
    const state = {
      canvas: { size: { height: 1350, unit: "px", width: 1080 } },
      values: { "composition.templateTier": "mega" },
    } as unknown as ToolcraftState;
    const controlChange = appPerformance.scenarios.find(
      (scenario) => scenario.interaction === "control-change",
    );

    expect(createPosterSceneCacheInput(state)).toMatchObject({
      "composition.templateTier": "mega",
    });
    expect(controlChange?.coversTargets).toContain("composition.templateTier");
    expect(appPerformance.workloadEnvelope.dimensions).toContainEqual(
      expect.objectContaining({
        id: "template-tier-weight",
        interactiveMax: 3,
      }),
    );
  });
});
