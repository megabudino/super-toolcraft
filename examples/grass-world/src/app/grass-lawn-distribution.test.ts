import { describe, expect, it } from "vitest";
import type { ToolcraftControlSchema, ToolcraftState } from "@/toolcraft/runtime";

import { appSchema } from "./app-schema";
import { createGrassLayout } from "./grass/grass-layout";
import { readGrassSettings } from "./grass/grass-values";

function findControl(target: string): ToolcraftControlSchema {
  for (const section of appSchema.panels.controls?.sections ?? []) {
    const control = Object.values(section.controls).find(
      (candidate) => candidate.target === target,
    );
    if (control) return control;
  }
  throw new Error(`Missing control ${target}`);
}

function settingsWith(values: Record<string, unknown>) {
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

describe("Lawn distribution", () => {
  it("Lawn distribution preview owns an independent Voronoi layout", () => {
    expect(findControl("lawn.distributionOffset")).toMatchObject({
      keyframeable: false,
      type: "grassNoisePreview",
    });
    expect(findControl("lawn.distributionDetail")).toMatchObject({
      max: 6,
      min: 1,
      performanceRole: "workload",
      type: "slider",
    });
    expect(findControl("lawn.distributionLevels")).toMatchObject({
      defaultValue: [44, 87],
      type: "rangeSlider",
    });

    const shared = {
      "field.distributionLevels": [20, 80],
      "lawn.densityMax": 800,
      "lawn.distanceMin": 0.02,
      "lawn.distributionLevels": [20, 80],
    };
    const initial = settingsWith(shared);
    const shifted = settingsWith({
      ...shared,
      "lawn.distributionOffset": [4, -3],
    });
    expect(createGrassLayout(shifted, "lawn").offsets).not.toEqual(
      createGrassLayout(initial, "lawn").offsets,
    );
    expect(createGrassLayout(shifted).offsets).toEqual(
      createGrassLayout(initial).offsets,
    );
  });
});
