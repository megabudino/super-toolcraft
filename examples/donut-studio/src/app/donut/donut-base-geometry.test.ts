import { describe, expect, it } from "vitest";

import { deformDonutBasePositions } from "./donut-base-geometry";
import {
  DONUT_DEFAULTS,
  DONUT_FACTORY_DEFAULTS,
} from "./donut-values";

describe("Blender-derived Base deformation", () => {
  it("preserves authored positions at source defaults", () => {
    const source = new Float32Array([1.4, 0.4, 0.2, -1.2, -0.3, 0.5]);
    const output = new Float32Array(source.length);
    deformDonutBasePositions(source, output, DONUT_FACTORY_DEFAULTS.donut);
    expect(Array.from(output)).toEqual(Array.from(source));
  });

  it("maps ring, thickness, height, and organic settings deterministically", () => {
    const source = new Float32Array([1.4, 0.4, 0.2, -1.2, -0.3, 0.5]);
    const output = new Float32Array(source.length);
    const settings = {
      height: 1.35,
      majorRadius: 1.28,
      organic: 2,
      thickness: 1.35,
    };
    deformDonutBasePositions(source, output, settings);
    expect(Array.from(output).every(Number.isFinite)).toBe(true);
    expect(Array.from(output)).not.toEqual(Array.from(source));
    const repeated = new Float32Array(source.length);
    deformDonutBasePositions(source, repeated, settings);
    expect(Array.from(repeated)).toEqual(Array.from(output));
  });
});
