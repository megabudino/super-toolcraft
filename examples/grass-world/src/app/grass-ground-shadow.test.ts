import * as THREE from "three";
import { describe, expect, it } from "vitest";
import type { ToolcraftState } from "@/toolcraft/runtime";

import { appSchema } from "./app-schema";
import { GrassGroundShadowResource } from "./grass/grass-ground-shadow";
import { readGrassSettings } from "./grass/grass-values";

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

describe("Ground Shadow", () => {
  it("keeps one focused section after Surface Fade and normalizes settings", () => {
    const sections = appSchema.panels.controls?.sections ?? [];
    const fadeIndex = sections.findIndex(
      (section) => section.title === "Surface Fade",
    );
    const shadow = sections[fadeIndex + 1];
    expect(shadow?.title).toBe("Ground Shadow");
    expect(
      Object.values(shadow?.controls ?? {}).map(({ target }) => target),
    ).toEqual([
      "groundShadow.offsetY",
      "groundShadow.offsetZ",
      "groundShadow.scale",
      "groundShadow.blur",
      "groundShadow.color",
      "groundShadow.strength",
    ]);

    const settings = settingsWith({
      "groundShadow.blur": 1.25,
      "groundShadow.color": "#123456",
      "groundShadow.offsetY": -0.72,
      "groundShadow.offsetZ": 1.4,
      "groundShadow.scale": 125,
      "groundShadow.strength": 83,
    });
    expect(settings.groundShadow).toEqual({
      blur: 1.25,
      color: "#123456",
      offsetY: -0.72,
      offsetZ: 1.4,
      scale: 1.25,
      strength: 0.83,
    });
  });

  it("updates one retained analytic underlay and releases it", () => {
    const parent = new THREE.Group();
    const resource = new GrassGroundShadowResource(parent);
    const settings = settingsWith({
      "field.depth": 6,
      "field.edgeIrregularity": 24,
      "field.shapeRoundness": 35,
      "field.width": 8,
      "groundShadow.blur": 0.8,
      "groundShadow.color": "#123456",
      "groundShadow.offsetY": -0.6,
      "groundShadow.offsetZ": 1.1,
      "groundShadow.scale": 120,
      "groundShadow.strength": 78,
    });

    resource.update(settings);
    expect(resource.getDiagnostics()).toEqual({
      blur: 0.8,
      color: "#123456",
      offsetY: -0.6,
      offsetZ: 1.1,
      scale: 1.2,
      strength: 0.78,
      visible: true,
    });
    const mesh = parent.getObjectByName("Grass Ground Shadow") as THREE.Mesh;
    expect(mesh).toBeInstanceOf(THREE.Mesh);
    expect(mesh.position.toArray()).toEqual([0, -0.6, 1.1]);
    expect(mesh.scale.x).toBeCloseTo(11.733333);
    expect(mesh.scale.y).toBeCloseTo(8.8);
    expect(mesh.scale.z).toBe(1);
    expect(mesh.castShadow).toBe(false);
    expect(mesh.receiveShadow).toBe(false);
    const material = mesh.material as THREE.ShaderMaterial;
    expect(
      (
        material.uniforms.uGrassGroundShadowExtent?.value as THREE.Vector2
      ).toArray(),
    ).toEqual([
      expect.closeTo(5.866666, 5),
      expect.closeTo(4.4, 5),
    ]);
    expect(material.fragmentShader).toContain("grassGroundShadowDistance");
    expect(material.fragmentShader).toContain(
      "uGrassGroundShadowExtent",
    );
    expect(material.fragmentShader).toContain("fwidth");
    expect(material.depthWrite).toBe(false);
    expect(material.transparent).toBe(true);

    resource.update(
      settingsWith({
        "field.showGround": false,
        "groundShadow.strength": 78,
      }),
    );
    expect(resource.getDiagnostics().visible).toBe(false);
    expect(mesh.visible).toBe(false);

    resource.dispose();
    expect(parent.children).toHaveLength(0);
  });
});
