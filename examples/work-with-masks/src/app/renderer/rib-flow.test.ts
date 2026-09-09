import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { createToolcraftState } from "@/toolcraft/runtime";
import { appSchema } from "../app-schema";
import { readHeroParams } from "../domain/hero-params";
import { buildRibs, getRibSweepSteps, RIB_PROFILE_POINT_COUNT } from "./rib-geometry";
import { flowRibVertex, flowTravelOffset } from "./rib-flow";

describe("Rib Flow transport", () => {
  it("maps a whole pitch to the next authored rib without changing its profile", () => {
    for (const shape of ["vault", "dome"]) {
      const params = readHeroParams(createToolcraftState(appSchema, { values: { "structure.shape": shape, "structure.count": 40, "rib.taperTip": 0.2 } }));
      const geometry = buildRibs(params);
      const vertices = geometry.getAttribute("position");
      const centers = geometry.getAttribute("aRibCenter");
      const xs = geometry.getAttribute("aRibX");
      const size = (getRibSweepSteps(params.structure.count) + 1) * RIB_PROFILE_POINT_COUNT;
      for (let i = size * 17; i < size * 18; i++) {
        const point = new THREE.Vector3().fromBufferAttribute(vertices, i);
        const center = new THREE.Vector2(centers.getX(i), centers.getY(i));
        const next = new THREE.Vector3().fromBufferAttribute(vertices, i + size);
        expect(flowRibVertex(point, center, xs.getX(i), params, params.structure.spacing).distanceTo(next)).toBeLessThan(params.structure.radius * 1e-6);
      }
      geometry.dispose();
    }
  });

  it("wraps only at a whole pitch and stitches both directions exactly", () => {
    for (const spacing of [0.6, 1.15, 2.65, 4.7]) {
      for (const direction of [-1, 1]) for (const count of [1, 3, 6]) {
        expect(flowTravelOffset(direction * count * spacing, spacing)).toBe(0);
      }
      expect(flowTravelOffset(spacing * 0.9, spacing)).toBeCloseTo(spacing * 0.9, 12);
      expect(flowTravelOffset(-spacing * 0.1, spacing)).toBeCloseTo(spacing * 0.9, 12);
    }
  });
});
