import * as THREE from "three";
import type { ToolcraftState } from "@/toolcraft/runtime";
import { describe, expect, it } from "vitest";

import {
  createGrassButterflyLayout,
  grassButterflyMaximumCount,
} from "./grass-butterfly-layout";
import {
  getGrassButterflyLandingProgress,
  GrassButterflyResource,
} from "./grass-butterfly-resource";
import { grassDefaults } from "./grass-defaults";
import {
  getGrassFieldShapeSettings,
  isGrassFieldPointInside,
} from "./grass-field-shape";
import { getGrassReferenceSurfaceHeight } from "./grass-reference-composition";
import { readGrassSettings } from "./grass-values";

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
    values: { ...grassDefaults, ...values },
  } as unknown as ToolcraftState);
}

describe("animated butterfly flock", () => {
  it("butterfly controls map to deterministic PBR flock settings", () => {
    const settings = settingsWith({
      "butterflies.count": 23,
      "butterflies.seed": 41,
    });
    const first = createGrassButterflyLayout(settings);
    const repeated = createGrassButterflyLayout(settings);
    const changed = createGrassButterflyLayout(
      settingsWith({
        "butterflies.count": 23,
        "butterflies.seed": 42,
      }),
    );
    const shape = getGrassFieldShapeSettings(settings);

    expect(first.count).toBe(23);
    expect(first.count).toBeLessThanOrEqual(grassButterflyMaximumCount);
    expect(repeated.anchors).toEqual(first.anchors);
    expect(repeated.atlasIndices).toEqual(first.atlasIndices);
    expect(repeated.landingOrders).toEqual(first.landingOrders);
    expect(changed.anchors).not.toEqual(first.anchors);
    expect(changed.landingOrders).not.toEqual(first.landingOrders);
    expect(
      new Set(
        Array.from(first.landingOrders, (value) => value.toFixed(6)),
      ).size,
    ).toBe(first.count);
    expect(getGrassButterflyLandingProgress(0.18, 0.05)).toBeGreaterThan(0);
    expect(getGrassButterflyLandingProgress(0.18, 0.95)).toBe(0);
    for (let index = 0; index < first.count; index += 1) {
      const x = first.anchors[index * 2]!;
      const z = first.anchors[index * 2 + 1]!;
      expect(isGrassFieldPointInside(x, z, shape)).toBe(true);
      expect(first.anchorHeights[index]).toBeCloseTo(
        getGrassReferenceSurfaceHeight(x, z, settings),
        5,
      );
      expect(first.atlasIndices[index]).toBeGreaterThanOrEqual(0);
      expect(first.atlasIndices[index]).toBeLessThan(8);
    }

  });

  it("butterfly hover lands and relaunches the retained flock", () => {
    const settings = settingsWith({
      "butterflies.count": 12,
      "butterflies.landingTime": 0.2,
    });
    const parent = new THREE.Group();
    const resource = new GrassButterflyResource(parent);
    const layout = createGrassButterflyLayout(settings);
    resource.updateLayout(settings);
    const mesh = (
      resource as unknown as { mesh: THREE.InstancedMesh }
    ).mesh;
    const movingIndex = Array.from(layout.landingOrders).reduce(
      (lowest, order, index) =>
        order < layout.landingOrders[lowest]! ? index : lowest,
      0,
    );
    const matrix = new THREE.Matrix4();
    const airbornePosition = new THREE.Vector3();
    const approachPosition = new THREE.Vector3();

    expect(resource.render(settings, 0.25, 100, true)).toMatchObject({
      count: 12,
      landingBlend: 0,
    });
    mesh.getMatrixAt(movingIndex, matrix);
    airbornePosition.setFromMatrixPosition(matrix);
    expect(resource.setHoverActive(true)).toBe(true);
    resource.render(settings, 0.25, 200, true);
    const landed = resource.render(settings, 0.25, 240, true);
    mesh.getMatrixAt(movingIndex, matrix);
    approachPosition.setFromMatrixPosition(matrix);
    expect(landed.landingBlend).toBeGreaterThan(0);
    expect(landed.transitioning).toBe(true);
    expect(
      Math.hypot(
        approachPosition.x - airbornePosition.x,
        approachPosition.z - airbornePosition.z,
      ),
    ).toBeGreaterThan(0.0001);
    const landingFactors = Array.from(
      (
        mesh.geometry.getAttribute(
          "butterflyLanding",
        ) as THREE.InstancedBufferAttribute
      ).array.slice(0, layout.count),
    );
    expect(new Set(landingFactors.map((value) => value.toFixed(4))).size)
      .toBeGreaterThan(2);
    expect(landingFactors).toContain(0);
    resource.render(settings, 0.25, 280, true);
    mesh.getMatrixAt(movingIndex, matrix);
    approachPosition.setFromMatrixPosition(matrix);
    expect(approachPosition.y).toBeLessThan(airbornePosition.y);

    expect(resource.setHoverActive(false)).toBe(true);
    resource.render(settings, 0.25, 300, true);
    const relaunched = resource.render(settings, 0.25, 380, true);
    expect(relaunched.landingBlend).toBeLessThan(landed.landingBlend);
    expect(resource.render(settings, 0.25, 320, false)).toMatchObject({
      count: 12,
      landingBlend: 0,
      transitioning: false,
    });
    expect(parent.children).toHaveLength(1);
    resource.dispose();
    expect(parent.children).toHaveLength(0);
  });
});
