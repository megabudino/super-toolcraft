import { describe, expect, it } from "vitest";
import { createToolcraftState } from "@/toolcraft/runtime";

import { appSchema } from "../app-schema";
import { heroStructureKey, readHeroParams } from "../domain/hero-params";
import { buildRibs, getRibSweepSteps, RIB_PROFILE_POINT_COUNT } from "./rib-geometry";

describe("buildRibs", () => {
  it("builds every rib into one indexed geometry with unit normals", () => {
    const params = readHeroParams(
      createToolcraftState(appSchema, { values: { "structure.count": 40 } }),
    );
    const steps = getRibSweepSteps(params.structure.count);
    const geometry = buildRibs(params);
    const positions = geometry.getAttribute("position");
    const normals = geometry.getAttribute("normal");
    const ribXs = geometry.getAttribute("aRibX");
    const deforms = geometry.getAttribute("aDeform");

    expect(positions.count).toBe((params.structure.count + 1) * (steps + 1) * RIB_PROFILE_POINT_COUNT);
    expect(geometry.index?.count).toBe(
      (params.structure.count + 1) * steps * RIB_PROFILE_POINT_COUNT * 6,
    );
    expect(normals.count).toBe(positions.count);
    expect(ribXs.count).toBe(positions.count);
    expect(deforms.count).toBe(positions.count);
    expect(deforms.getX(0)).toBe(1);
    for (let index = 0; index < normals.count; index += 997) {
      const length = Math.hypot(normals.getX(index), normals.getY(index), normals.getZ(index));
      expect(length).toBeCloseTo(1, 3);
    }
    geometry.dispose();
  });

  it("keeps animated deformation values out of the geometry cache key", () => {
    const params = readHeroParams(createToolcraftState(appSchema));
    const animated = {
      ...params,
      structure: {
        ...params.structure,
        travel: 0.6,
        twist: 1.25,
        wave: 4.5,
        waveLength: 52,
        wavePhase: Math.PI,
      },
    };

    expect(heroStructureKey(animated)).toBe(heroStructureKey(params));
  });

  it("narrows the selected end of the rib", () => {
    const base = readHeroParams(
      createToolcraftState(appSchema, {
        values: { "rib.taperStart": 0.5, "rib.taperTip": 0.12 },
      }),
    );
    const params = {
      ...base,
      structure: { ...base.structure, count: 1, xShift: 0 },
    };
    const geometry = buildRibs(params);
    const positions = geometry.getAttribute("position");
    const steps = getRibSweepSteps(1);
    const spreadAt = (ring: number) => {
      let min = Number.POSITIVE_INFINITY;
      let max = Number.NEGATIVE_INFINITY;
      const start = ring * RIB_PROFILE_POINT_COUNT;
      for (let index = 0; index < RIB_PROFILE_POINT_COUNT; index += 1) {
        const x = positions.getX(start + index);
        min = Math.min(min, x);
        max = Math.max(max, x);
      }
      return max - min;
    };

    expect(spreadAt(steps)).toBeLessThan(spreadAt(0) * 0.2);
    geometry.dispose();
  });
});
