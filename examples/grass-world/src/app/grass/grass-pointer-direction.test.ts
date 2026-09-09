import { describe, expect, it } from "vitest";

import {
  getGrassScreenPointerDirection,
  GrassPointerDirectionController,
  GrassPointerInputController,
} from "./grass-pointer-direction";

describe("GrassPointerDirectionController", () => {
  it("maps pointer travel to one normalized global wind direction", () => {
    const controller = new GrassPointerDirectionController();

    expect(controller.sample([0, 0]).active).toBe(false);
    const right = controller.sample([1, 0]);
    expect(right).toMatchObject({ active: true, angle: 0, direction: [1, 0] });

    expect(controller.leave().active).toBe(false);
    expect(controller.sample([2, 2]).active).toBe(false);
    const forward = controller.sample([2, 3]);
    expect(forward.active).toBe(true);
    expect(forward.angle).toBeCloseTo(90, 5);
    expect(Math.hypot(...forward.direction)).toBeCloseTo(1, 5);
  });

  it("Touch input owns one terrain gesture until release", () => {
    const controller = new GrassPointerInputController();

    expect(controller.beginTouch(1, false)).toBe(false);
    expect(controller.hasActiveTouch()).toBe(false);

    expect(controller.beginTouch(2, true)).toBe(true);
    expect(controller.hasActiveTouch()).toBe(true);
    expect(controller.acceptsTouch(2)).toBe(true);
    expect(controller.acceptsTouch(3)).toBe(false);
    expect(controller.beginTouch(3, true)).toBe(false);

    expect(controller.endTouch(3)).toBe(false);
    expect(controller.acceptsTouch(2)).toBe(true);
    expect(controller.endTouch(2)).toBe(true);
    expect(controller.hasActiveTouch()).toBe(false);

    expect(controller.beginTouch(4, true)).toBe(true);
    controller.reset();
    expect(controller.hasActiveTouch()).toBe(false);
  });

  it("ignores pointer jitter without changing the last authored direction", () => {
    const controller = new GrassPointerDirectionController();
    controller.sample([0, 0]);
    controller.sample([1, 0]);
    const jitter = controller.sample([1.001, 0.001]);

    expect(jitter).toMatchObject({ active: false, angle: 0, direction: [1, 0] });
  });

  it("keeps surface-tilt screen axes isolated from terrain projection", () => {
    expect(getGrassScreenPointerDirection(null, [20, 20])).toEqual([0, 0]);
    expect(getGrassScreenPointerDirection([20, 20], [80, 20])).toEqual([1, 0]);
    expect(getGrassScreenPointerDirection([20, 80], [20, 20])).toEqual([0, -1]);
    expect(getGrassScreenPointerDirection([20, 20], [20.25, 20.25])).toEqual([
      0, 0,
    ]);
  });
});
