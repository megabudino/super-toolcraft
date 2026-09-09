import { describe, expect, it } from "vitest";

import { appSchema } from "../app-schema";
import { grassDefaults } from "./grass-defaults";
import { grassStartStateV21 } from "./grass-start-state";

describe("Grass Studio authored start state", () => {
  it("overlays every compatible value from the exported settings", () => {
    expect(Object.keys(grassStartStateV21)).toHaveLength(240);

    for (const [target, value] of Object.entries(grassStartStateV21)) {
      expect(grassDefaults[target as keyof typeof grassDefaults]).toEqual(value);
    }
  });

  it("uses the requested authored scene sentinels", () => {
    expect(grassDefaults).toMatchObject({
      "butterflies.landingTime": 1.5,
      "environment.exposure": 151,
      "field.densityMax": 24_000,
      "lawn.densityMax": 36_000,
      "scene.background": "#88BB77",
      "terrain.seed": 86,
    });
  });

  it("preserves newer defaults that were absent from the export", () => {
    expect(grassDefaults).toMatchObject({
      "appearance.pbrSheen": 44,
      "lawn.textureMaskSeed": 76,
      "scan.tufted.pbrAoStrength": 79,
      "surface.textureMaskScale": 5.9,
    });
  });

  it("keeps the matching canvas and advances persistence", () => {
    expect(appSchema.canvas).toMatchObject({
      renderScale: { defaultValue: 2 },
      size: { height: 1080, unit: "px", width: 1920 },
    });
    expect(appSchema.persistence).toMatchObject({
      key: "toolcraft:grass-world:state:v22",
      version: 22,
    });
  });
});
