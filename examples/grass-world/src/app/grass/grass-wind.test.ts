import { describe, expect, it } from "vitest";

import type { GrassSettings } from "./grass-settings-types";
import {
  approachGrassWindActivation,
  createGrassWindUniformSettings,
  GRASS_LAWN_WIND_RESPONSE,
  getGrassWindDirectionVector,
  GrassWindFrameController,
  interpolateGrassWindAngle,
} from "./grass-wind";

const baseWind = {
  audioVolume: 0.6,
  directionAngle: 0,
  directionResponse: 0.45,
  flow: 0.38,
  gustCycles: 2,
  gustWidth: 0.52,
  mode: "static",
  noiseDetail: 0.58,
  noiseScale: 1.7,
  noiseStrength: 0.62,
  rampUp: 0.75,
  release: 1.2,
  seed: 17,
  strength: 0.72,
  surfaceTiltDown: 1.25,
  surfaceTiltLeft: 1.25,
  surfaceTiltRight: 1.25,
  surfaceTiltSmoothing: 0.6,
  surfaceTiltUp: 1.25,
  swayCycles: 1,
  swayStrength: 0.16,
  swayVariation: 0.48,
} as const satisfies GrassSettings["wind"];

describe("grass wind model", () => {
  it.each([
    [0, [1, 0]],
    [90, [0, 1]],
    [180, [-1, 0]],
    [270, [0, -1]],
    [360, [1, 0]],
  ] as const)(
    "maps %s degrees to the world XZ direction",
    (angle, expected) => {
      expect(getGrassWindDirectionVector(angle)).toEqual(expected);
    },
  );

  it("smooths direction through the shortest angular arc", () => {
    const towardTen = interpolateGrassWindAngle(350, 10, 0.2, 0.4);
    const towardThreeFifty = interpolateGrassWindAngle(10, 350, 0.2, 0.4);

    expect(towardTen).toBeGreaterThan(350);
    expect(towardThreeFifty).toBeLessThan(10);
    expect(interpolateGrassWindAngle(20, 220, 0, 0.4)).toBe(20);
  });

  it("uses frame-rate-independent attack and release", () => {
    const attacked = approachGrassWindActivation(0, 1, 0.1, 0.75);
    const released = approachGrassWindActivation(attacked, 0, 0.1, 1.2);

    expect(attacked).toBeGreaterThan(0);
    expect(attacked).toBeLessThan(1);
    expect(released).toBeGreaterThan(0);
    expect(released).toBeLessThan(attacked);
  });

  it("resolves Static Sway Wind and Simulation without changing geometry work", () => {
    const controller = new GrassWindFrameController();
    const staticFrame = controller.resolve(
      baseWind,
      0.6,
      "interactive-preview",
      0,
    );
    const swayFrame = controller.resolve(
      { ...baseWind, mode: "sway" },
      0.6,
      "interactive-preview",
      100,
    );
    const windFrame = controller.resolve(
      { ...baseWind, mode: "wind" },
      0.6,
      "interactive-preview",
      200,
    );
    const simulation = { ...baseWind, mode: "simulation" } as const;
    controller.setPointerState(false);
    const idleSimulation = controller.resolve(
      simulation,
      0.6,
      "interactive-preview",
      300,
    );
    controller.setPointerState(true, 90);
    const activeSimulation = controller.resolve(
      simulation,
      0.6,
      "interactive-preview",
      400,
    );
    controller.setPointerState(false);
    const releasedSimulation = controller.resolve(
      simulation,
      0.6,
      "interactive-preview",
      500,
    );

    expect(staticFrame).toMatchObject({
      activation: 0,
      ambientStrength: 0,
      progress: 0,
    });
    expect(swayFrame).toMatchObject({ activation: 0, ambientStrength: 0.16 });
    expect(windFrame.activation).toBe(1);
    expect(idleSimulation.activation).toBe(0);
    expect(activeSimulation.activation).toBeGreaterThan(0);
    expect(activeSimulation.activation).toBeLessThan(1);
    expect(activeSimulation.directionAngle).toBeGreaterThan(0);
    expect(activeSimulation.directionAngle).toBeLessThan(90);
    expect(releasedSimulation.activation).toBeLessThan(
      activeSimulation.activation,
    );

    const exportedSimulation = new GrassWindFrameController().resolve(
      { ...simulation, directionAngle: 180 },
      0.6,
      "export",
      0,
    );
    expect(exportedSimulation).toMatchObject({
      activation: 1,
      directionAngle: 180,
      directionVector: [-1, 0],
    });
    expect(
      createGrassWindUniformSettings(
        exportedSimulation,
        GRASS_LAWN_WIND_RESPONSE,
      ),
    ).toMatchObject({ activation: 1, response: 0.45 });
  });
});
