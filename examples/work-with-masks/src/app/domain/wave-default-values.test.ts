import { describe, expect, it } from "vitest";
import { createToolcraftState, toolcraftReducer } from "@/toolcraft/runtime";

import approvedSettings from "../../../reference/settings/hero-settings-2026-09-09.json";
import { appSchema } from "../app-schema";
import { FLOW_DURATION_SECONDS } from "./flow";
import { waveDefaultValues } from "./wave-default-values";

const approvedValues: Readonly<Record<string, unknown>> = approvedSettings.values;

describe("waveDefaultValues", () => {
  it("matches the approved wave-only settings exactly", () => {
    expect(Object.keys(waveDefaultValues)).toHaveLength(74);
    for (const [target, value] of Object.entries(waveDefaultValues)) {
      if (target.startsWith("motion.")) continue;
      expect(value, target).toEqual(approvedValues[target]);
    }
    expect(Object.keys(waveDefaultValues)).not.toContain("export.image.format");
    expect(Object.keys(waveDefaultValues)).not.toContain("export.image.resolution");
  });

  it("initializes and resets every approved hero setting through the runtime", () => {
    const initial = createToolcraftState(appSchema);
    const imported = createToolcraftState(appSchema, { values: approvedSettings.values });
    let edited = initial;
    for (const [target, value] of Object.entries({
      "appearance.background": "#000000",
      "hero.layout.topInset": 0,
      "wave.frame.position": { x: 0.5, y: -0.5 },
      "wave.frame.width": 1200,
      "masks.items": [],
    })) {
      edited = toolcraftReducer(edited, { type: "controls.setValue", target, value });
    }
    const reset = toolcraftReducer(edited, { type: "controls.reset" });

    expect(Object.keys(approvedValues)).toHaveLength(76);
    for (const target of Object.keys(approvedValues)) {
      expect(initial.values[target], `initial ${target}`).toEqual(imported.values[target]);
      expect(reset.values[target], `reset ${target}`).toEqual(imported.values[target]);
    }
    expect(initial.canvas.size).toEqual(approvedSettings.canvas.size);
    expect(initial.canvas.mode).toBe(approvedSettings.canvas.mode);
    expect(initial.timeline.durationSeconds).toBe(FLOW_DURATION_SECONDS);
    expect(initial.timeline.durationSeconds).toBe(approvedSettings.timeline.durationSeconds);
    const restored = createToolcraftState(appSchema, { timeline: approvedSettings.timeline });
    expect(restored.timeline.durationSeconds).toBe(approvedSettings.timeline.durationSeconds);
  });
});
