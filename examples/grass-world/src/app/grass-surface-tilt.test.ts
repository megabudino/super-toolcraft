import { describe, expect, it } from "vitest";
import type {
  ToolcraftControlSchema,
  ToolcraftControlSectionSchema,
  ToolcraftState,
} from "@/toolcraft/runtime";

import { grassRenderSliderTargets } from "./grass/grass-render-targets";
import {
  GrassSurfaceTiltController,
  GrassSurfaceTiltTransform,
  type GrassSurfaceTiltSettings,
} from "./grass/grass-surface-tilt";
import { getGrassRenderKey, readGrassSettings } from "./grass/grass-values";
import { appSchema } from "./app-schema";

const tiltSettings: GrassSurfaceTiltSettings = {
  downDegrees: 2,
  leftDegrees: 0.75,
  rightDegrees: 1.75,
  smoothingSeconds: 0.6,
  upDegrees: 0.5,
};

function findControl(target: string): ToolcraftControlSchema {
  for (const section of appSchema.panels.controls?.sections ?? []) {
    const control = Object.values(section.controls).find(
      (candidate) => candidate.target === target,
    );
    if (control) return control;
  }
  throw new Error(`Missing control ${target}`);
}

function findSection(target: string): ToolcraftControlSectionSchema {
  const section = (appSchema.panels.controls?.sections ?? []).find(
    (candidate) =>
      Object.values(candidate.controls).some(
        (control) => control.target === target,
      ),
  );
  if (!section) throw new Error(`Missing section for ${target}`);
  return section;
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

function driveController(
  controller: GrassSurfaceTiltController,
  intervalMs: number,
  durationMs: number,
) {
  let snapshot = controller.reset();
  for (let nowMs = 0; nowMs <= durationMs; nowMs += intervalMs) {
    controller.setMotion([1, 0], nowMs);
    snapshot = controller.resolve(tiltSettings, nowMs);
  }
  return snapshot;
}

describe("Simulation surface tilt", () => {
  it("Surface tilt maps screen travel through four amplitudes and one global smoothing", () => {
    const degreeTargets = [
      "wind.surfaceTiltLeft",
      "wind.surfaceTiltRight",
      "wind.surfaceTiltUp",
      "wind.surfaceTiltDown",
    ] as const;
    for (const target of degreeTargets) {
      expect(findControl(target)).toMatchObject({
        defaultValue: 3,
        max: 20,
        min: 0,
        sliderValueKind: "continuous",
        step: 0.05,
        type: "slider",
        unit: "°",
      });
      expect(findSection(target)).toMatchObject({
        title: "Surface Tilt",
        visibleWhen: { equals: "simulation", target: "wind.mode" },
      });
      expect(grassRenderSliderTargets).toContain(target);
    }
    expect(findControl("wind.surfaceTiltSmoothing")).toMatchObject({
      defaultValue: 2,
      max: 2,
      min: 0.1,
      step: 0.05,
      type: "slider",
      unit: "s",
    });
    expect(settingsWith().wind).toMatchObject({
      surfaceTiltDown: 3,
      surfaceTiltLeft: 3,
      surfaceTiltRight: 3,
      surfaceTiltSmoothing: 2,
      surfaceTiltUp: 3,
    });
    expect(
      settingsWith({
        "wind.surfaceTiltDown": 28,
        "wind.surfaceTiltLeft": -2,
        "wind.surfaceTiltSmoothing": 8,
      }).wind,
    ).toMatchObject({
      surfaceTiltDown: 20,
      surfaceTiltLeft: 0,
      surfaceTiltSmoothing: 2,
    });
    expect(
      getGrassRenderKey(settingsWith({ "wind.surfaceTiltRight": 0 })),
    ).not.toBe(
      getGrassRenderKey(settingsWith({ "wind.surfaceTiltRight": 20 })),
    );

    const transform = new GrassSurfaceTiltTransform();
    transform.set((28 * Math.PI) / 180, (-28 * Math.PI) / 180);
    const [clampedX, clampedZ] = transform.resolve("interactive-preview");
    expect((clampedX * 180) / Math.PI).toBeCloseTo(20, 6);
    expect((clampedZ * 180) / Math.PI).toBeCloseTo(-20, 6);

    const maximumController = new GrassSurfaceTiltController();
    maximumController.setMotion([1, 0], 0);
    const maximumSnapshot = maximumController.resolve(
      { ...tiltSettings, rightDegrees: 28, smoothingSeconds: 0.001 },
      0,
    );
    expect(maximumSnapshot.magnitudeDegrees).toBeCloseTo(20, 3);

    const sixtyFps = driveController(
      new GrassSurfaceTiltController(),
      1_000 / 60,
      300,
    );
    const thirtyFps = driveController(
      new GrassSurfaceTiltController(),
      1_000 / 30,
      300,
    );
    expect(sixtyFps.rotationX).toBeCloseTo(0, 6);
    expect(sixtyFps.rotationZ).toBeLessThan(0);
    expect(sixtyFps.magnitudeDegrees).toBeGreaterThan(1);
    expect(sixtyFps.magnitudeDegrees).toBeLessThanOrEqual(1.75);
    expect(thirtyFps.magnitudeDegrees).toBeCloseTo(
      sixtyFps.magnitudeDegrees,
      1,
    );

    const directionalCases = [
      [[-1, 0], 0, 1],
      [[1, 0], 0, -1],
      [[0, -1], -1, 0],
      [[0, 1], 1, 0],
    ] as const;
    for (const [direction, expectedX, expectedZ] of directionalCases) {
      const controller = new GrassSurfaceTiltController();
      controller.setMotion(direction, 0);
      const snapshot = controller.resolve(tiltSettings, 0);
      expect(Math.sign(snapshot.rotationX)).toBe(expectedX);
      expect(Math.sign(snapshot.rotationZ)).toBe(expectedZ);
    }

    const fast = new GrassSurfaceTiltController();
    fast.setMotion([1, 0], 0);
    const fastSnapshot = fast.resolve(
      { ...tiltSettings, smoothingSeconds: 0.1 },
      0,
    );
    const smooth = new GrassSurfaceTiltController();
    smooth.setMotion([1, 0], 0);
    const smoothSnapshot = smooth.resolve(
      { ...tiltSettings, smoothingSeconds: 1.5 },
      0,
    );
    expect(fastSnapshot.magnitudeDegrees).toBeGreaterThan(
      smoothSnapshot.magnitudeDegrees * 5,
    );

    const returning = new GrassSurfaceTiltController();
    let returned = driveController(returning, 16, 240);
    returning.leave();
    for (let nowMs = 256; nowMs <= 1_600; nowMs += 16) {
      returned = returning.resolve(tiltSettings, nowMs);
    }
    expect(returned).toMatchObject({
      active: false,
      magnitudeDegrees: 0,
      rotationX: 0,
      rotationZ: 0,
      settled: true,
    });
  });
});
