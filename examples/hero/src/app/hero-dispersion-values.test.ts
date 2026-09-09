import { describe, expect, it } from "vitest";

import {
  createHeroDispersionSettingsFromValues,
  HERO_DISPERSION_DEFAULTS,
  heroDispersionTargets,
} from "./hero-dispersion-values";

describe("hero dispersion values", () => {
  it("keeps targets, defaults, and runtime settings on the current side-zone shape", () => {
    const expectedKeys = [
      "amount",
      "aura",
      "blur",
      "count",
      "curve",
      "edgeFade",
      "edgeWidth",
      "gateGlow",
      "gateOffset",
      "gateRefraction",
      "gateWidth",
      "hue",
      "spectrum",
      "turbulence",
      "turbulenceScale",
      "velocity",
      "warp",
      "warpFace",
      "warpOffset",
      "warpSharpness",
      "warpStyle",
      "warpWave",
      "warpWaveBlur",
      "warpWaveEnabled",
      "warpWaveKind",
      "warpWaveLength",
    ];
    const removedVerticalKey = ["dispersion", ["top", "Width"].join("")].join(
      ".",
    );
    const settings = createHeroDispersionSettingsFromValues({
      [removedVerticalKey]: 18,
    });

    expect(Object.keys(heroDispersionTargets)).toEqual(expectedKeys);
    expect(Object.keys(HERO_DISPERSION_DEFAULTS)).toEqual(expectedKeys);
    expect(Object.keys(settings)).toEqual(expectedKeys);
  });
});
