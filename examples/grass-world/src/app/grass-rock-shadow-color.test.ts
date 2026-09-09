import * as THREE from "three";
import { describe, expect, it } from "vitest";
import type {
  ToolcraftControlSchema,
  ToolcraftState,
} from "@/toolcraft/runtime";

import { appSchema } from "./app-schema";
import { grassDefaults } from "./grass/grass-defaults";
import {
  applyGrassReceivedShadowColor,
  createGrassReceivedShadowColorUniforms,
  extendGrassStandardMaterialWithReceivedShadowColor,
} from "./grass/grass-received-shadow-color";
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

describe("Rock received-shadow colors", () => {
  it("Rock shadow colors remain independent and use received shadow masks", () => {
    for (const kind of ["rocks", "boulder"] as const) {
      const target = `scan.${kind}.shadowColor` as
        "scan.rocks.shadowColor" | "scan.boulder.shadowColor";
      expect(findControl(target)).toMatchObject({
        defaultValue: grassDefaults[target],
        performanceRole: "responsiveness",
        target,
        type: "color",
        visibleWhen: { equals: true, target: `scan.${kind}.enabled` },
      });
    }

    const initial = settingsWith();
    expect(initial.scans.rocks.shadowColor).toBe("#E8D6C0");
    expect(initial.scans.boulder.shadowColor).toBe("#E8CBB5");

    const changed = settingsWith({
      "scan.boulder.shadowColor": "#d24b2a",
      "scan.rocks.shadowColor": "#315fd1",
    });
    expect(changed.scans.rocks.shadowColor).toBe("#315fd1");
    expect(changed.scans.boulder.shadowColor).toBe("#d24b2a");

    const uniforms = createGrassReceivedShadowColorUniforms();
    applyGrassReceivedShadowColor(uniforms, changed.scans.rocks.shadowColor);
    expect(
      (uniforms.uGrassReceivedShadowColor!.value as THREE.Color).getHexString(),
    ).toBe("315fd1");

    const material = new THREE.MeshStandardMaterial();
    extendGrassStandardMaterialWithReceivedShadowColor(
      material,
      uniforms,
      "unit-test",
    );
    const shader = {
      fragmentShader:
        "#include <shadowmap_pars_fragment>\nvoid main() { vec3 outgoingLight = vec3(1.0); #include <opaque_fragment> }",
      uniforms: {},
      vertexShader: "void main() {}",
    };
    material.onBeforeCompile(shader as never, null as never);
    expect(shader.fragmentShader).toContain(
      "#include <shadowmask_pars_fragment>",
    );
    expect(shader.fragmentShader).toContain("1.0 - getShadowMask()");
    expect(shader.fragmentShader).toContain(
      "outgoingLight = grassApplyReceivedShadowColor(outgoingLight)",
    );
    expect(material.customProgramCacheKey()).toContain(
      "grass-received-shadow-color-v1:unit-test",
    );
    material.dispose();
  });
});
