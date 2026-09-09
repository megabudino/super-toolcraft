import { describe, expect, it } from "vitest";
import type { ToolcraftState } from "@/toolcraft/runtime";

import { grassSunPatchesSection } from "./grass/grass-environment-controls";
import {
  applyGrassSunPatchSettings,
  createGrassSunPatchUniforms,
  grassSunPatchFragmentDeclarations,
} from "./grass/grass-sun-patches";
import { readGrassSettings } from "./grass/grass-values";

function settingsWith(strength: number) {
  return readGrassSettings({
    canvas: { size: { height: 1080, width: 1920 } },
    mediaAssets: [],
    timeline: {
      currentTimeSeconds: 0,
      durationSeconds: 6,
      isLooping: true,
      isPlaying: false,
    },
    values: { "environment.sunPatchStrength": strength },
  } as unknown as ToolcraftState);
}

describe("Sun Patches contrast", () => {
  it("extends Strength to 200% while preserving normalized authored inputs", () => {
    expect(grassSunPatchesSection.controls.strength).toMatchObject({
      defaultValue: 156,
      max: 200,
      min: 0,
      type: "slider",
    });
    expect(settingsWith(100).environment.sunPatches.strength).toBe(1);
    expect(settingsWith(175).environment.sunPatches.strength).toBe(1.75);
    expect(settingsWith(999).environment.sunPatches.strength).toBe(2);
  });

  it("uses the extra range for stronger direct and indirect separation", () => {
    expect(grassSunPatchFragmentDeclarations).toContain(
      "float extraStrength = clamp(uSunPatchStrength - 1.0, 0.0, 1.0)",
    );
    expect(grassSunPatchFragmentDeclarations).toContain("float shadowDirect");
    expect(grassSunPatchFragmentDeclarations).toContain("float shadowIndirect");
    expect(grassSunPatchFragmentDeclarations).toContain("float sunDirect");

    const uniforms = createGrassSunPatchUniforms();
    applyGrassSunPatchSettings(
      uniforms,
      settingsWith(200).environment.sunPatches,
      0,
    );
    expect(uniforms.uSunPatchStrength?.value).toBe(2);
  });
});
