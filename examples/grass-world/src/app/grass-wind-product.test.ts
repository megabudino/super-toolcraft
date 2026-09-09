import { describe, expect, it } from "vitest";
import type {
  ToolcraftControlSchema,
  ToolcraftState,
} from "@/toolcraft/runtime";

import { appSchema } from "./app-schema";
import { grassWindVertexModel } from "./grass/grass-wind-material";
import { getGrassRenderKey, readGrassSettings } from "./grass/grass-values";

function findWindControl(target: string): ToolcraftControlSchema {
  const sections = appSchema.panels.controls?.sections ?? [];
  for (const section of sections) {
    const control = Object.values(section.controls).find(
      (candidate) => candidate.target === target,
    );
    if (control) return control;
  }
  throw new Error(`Missing control ${target}`);
}

function settingsWith(values: Record<string, unknown> = {}) {
  return readGrassSettings({
    canvas: { size: { height: 1080, width: 1920 } },
    mediaAssets: [],
    timeline: {
      currentTimeSeconds: 0,
      durationSeconds: 6,
      isLooping: true,
      isPlaying: false,
    },
    values,
  } as unknown as ToolcraftState);
}

describe("Grass Studio wind product behavior", () => {
  it("Wind editor modes map to ambient gust and interactive simulation", () => {
    expect(findWindControl("wind.mode")).toMatchObject({
      defaultValue: "simulation",
      options: [
        { label: "Static", value: "static" },
        { label: "Sway", value: "sway" },
        { label: "Wind", value: "wind" },
        { label: "Simulate", value: "simulation" },
      ],
      type: "segmented",
    });
    expect(findWindControl("wind.directionAngle")).toMatchObject({
      max: 360,
      min: 0,
      unit: "°",
      visibleWhen: {
        oneOf: ["wind", "simulation"],
        target: "wind.mode",
      },
    });
    expect(() => findWindControl("interaction.cursorWindEnabled")).toThrow(
      "Missing control interaction.cursorWindEnabled",
    );
    expect(findWindControl("wind.swayStrength")).toMatchObject({
      max: 40,
      min: 0,
    });
    expect(findWindControl("wind.flow")).toMatchObject({
      max: 100,
      min: 0,
      unit: "%",
    });
    expect(findWindControl("wind.seed")).toMatchObject({
      max: 128,
      min: 1,
      step: 1,
    });
    expect(findWindControl("wind.rampUp")).toMatchObject({
      max: 4,
      min: 0.1,
      unit: "s",
    });
    expect(findWindControl("wind.directionResponse")).toMatchObject({
      max: 2,
      min: 0.1,
      unit: "s",
    });
    expect(grassWindVertexModel).toContain("float tipDelay");
    expect(grassWindVertexModel).toContain("float gustRebound");
    expect(grassWindVertexModel).toContain("vec2 ambientForce");
    expect(grassWindVertexModel).toContain("uWindActivation");
    expect(grassWindVertexModel).toContain("vec2 crossDirection");
    expect(grassWindVertexModel).not.toContain("uWindProfile");
    expect(settingsWith({ "wind.mode": "simulation" }).wind.mode).toBe(
      "simulation",
    );
    expect(settingsWith({ "wind.mode": "unsupported" }).wind.mode).toBe(
      "simulation",
    );
    expect(
      getGrassRenderKey(settingsWith({ "wind.directionAngle": 180 })),
    ).not.toBe(getGrassRenderKey(settingsWith({ "wind.directionAngle": 0 })));
  });

  it("Wind audio volume maps persisted percent to retained gain", () => {
    expect(findWindControl("wind.audioVolume")).toMatchObject({
      defaultValue: 80,
      max: 100,
      min: 0,
      sliderValueKind: "continuous",
      step: 1,
      type: "slider",
      unit: "%",
    });
    expect(settingsWith().wind.audioVolume).toBe(0.8);
    expect(settingsWith({ "wind.audioVolume": 25 }).wind.audioVolume).toBe(
      0.25,
    );
    expect(settingsWith({ "wind.audioVolume": 200 }).wind.audioVolume).toBe(1);
    expect(getGrassRenderKey(settingsWith({ "wind.audioVolume": 0 }))).toBe(
      getGrassRenderKey(settingsWith({ "wind.audioVolume": 100 })),
    );
  });
});
