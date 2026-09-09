import { describe, expect, it } from "vitest";
import { createToolcraftState, toolcraftReducer } from "@/toolcraft/runtime";

import { appSchema } from "../app-schema";
import { backgroundDefaults } from "./background";
import { hazeDefaults } from "./haze";
import { readHeroParams } from "./hero-params";
import { lightDefaults } from "./light";
import { materialDefaults } from "./material";
import { postDefaults } from "./post";
import {
  applyHeroPreset,
  getHeroPresetIdForAction,
  heroPresetActionValues,
  heroPresets,
} from "./presets";
import { skyDefaults } from "./sky";
import { structureDefaults } from "./structure";

describe("readHeroParams", () => {
  it("maps canonical Toolcraft defaults to the approved wave look", () => {
    const params = readHeroParams(createToolcraftState(appSchema));
    const oculus = heroPresets.oculus;

    expect(params.background).toEqual({
      color: backgroundDefaults.color,
      include: backgroundDefaults.include,
    });
    expect(params.structure).toMatchObject({
      arc: oculus["structure.arc"],
      count: oculus["structure.count"],
      radius: oculus["structure.radius"],
      spacing: oculus["structure.spacing"],
      xShift: -30,
    });
    expect(params.rib).toMatchObject({
      corner: oculus["rib.corner"],
      depth: oculus["rib.depth"],
      taperStart: oculus["rib.taperStart"],
      taperTip: oculus["rib.taperTip"],
      width: oculus["rib.width"],
    });
    expect(params.camera).toEqual({
      fov: oculus["camera.fov"],
      height: oculus["camera.height"],
      pitch: oculus["camera.pitch"],
      position: oculus["camera.position"],
      roll: oculus["camera.roll"],
      yaw: oculus["camera.yaw"],
    });
    expect(params.light).toEqual({
      ambient: lightDefaults.ambient,
      azimuth: lightDefaults.azimuth,
      color: lightDefaults.color,
      elevation: lightDefaults.elevation,
      groundColor: lightDefaults.groundColor,
      intensity: lightDefaults.intensity,
      shadowSoftness: lightDefaults.shadowSoftness,
      shadows: lightDefaults.shadows,
      skyColor: lightDefaults.skyColor,
    });
    expect(params.post).toEqual({
      aperture: postDefaults.aperture * 0.0001,
      bloom: postDefaults.bloom,
      bloomThreshold: postDefaults.bloomThreshold,
      depthOfField: postDefaults.depthOfField,
      exposure: postDefaults.exposure,
      focus: postDefaults.focus,
      maxBlur: 0.005,
      occlusion: postDefaults.occlusion / 100,
      occlusionRadius: postDefaults.occlusionRadius,
    });
    expect(params.haze).toEqual({
      blend: hazeDefaults.blend,
      glowColor: hazeDefaults.glowColor,
      glowPosition: hazeDefaults.glowPosition,
      glowRadius: hazeDefaults.glowRadius,
      glowStrength: hazeDefaults.glowStrength / 100,
      gradient: hazeDefaults.gradient,
      strength: hazeDefaults.strength / 100,
    });
    expect(params.sky.gradient.stops.map(({ color }) => color)).toEqual(
      skyDefaults.gradient.stops.map(({ color }) => color),
    );
    expect(params.sky.lightGradient.stops.map(({ color }) => color)).toEqual(
      skyDefaults.lightGradient.stops.map(({ color }) => color),
    );
    expect(params.material).toEqual(materialDefaults);
  });

  it("maps authored camera, geometry, post, and haze values without callback decoding", () => {
    const params = readHeroParams(
      createToolcraftState(appSchema, {
        values: {
          "camera.position": { x: -0.5, y: 0.75 },
          "haze.blend": "screen",
          "haze.glowPosition": { x: 0.25, y: -0.5 },
          "haze.strength": 40,
          "light.shadows": true,
          "post.aperture": 2,
          "post.occlusion": 80,
          "rib.taperSide": "start",
          "structure.arc": [-90, 80],
          "structure.shape": "dome",
        },
      }),
    );

    expect(params.camera.position).toEqual({ x: -0.5, y: 0.75 });
    expect(params.haze.blend).toBe("screen");
    expect(params.haze.glowPosition).toEqual({ x: 0.25, y: -0.5 });
    expect(params.haze.strength).toBe(0.4);
    expect(params.light.shadows).toBe(true);
    expect(params.post.aperture).toBeCloseTo(0.0002);
    expect(params.post.occlusion).toBe(0.8);
    expect(params.rib.taperSide).toBe("start");
    expect(params.structure.arc).toEqual([-90, 80]);
    expect(params.structure.shape).toBe("dome");
  });

  it("uses runtime preview background semantics in Infinity mode", () => {
    const state = createToolcraftState(appSchema, {
      canvas: { mode: "infinite" },
    });

    expect(readHeroParams(state).background.include).toBe(true);
    expect(readHeroParams(state, { preview: true }).background.include).toBe(false);
  });
});

describe("hero presets", () => {
  it("keeps the Oculus preset identical to the canonical defaults", () => {
    const state = createToolcraftState(appSchema);
    for (const [target, value] of Object.entries(heroPresets.oculus)) {
      expect(state.values[target], target).toEqual(value);
    }
    expect(Object.keys(heroPresets.oculus)).toHaveLength(Object.keys(heroPresets.bend).length);
  });

  it("applies every non-default preset value through accepted value commands", () => {
    for (const presetId of ["bend", "wave", "amber"] as const) {
      let state = createToolcraftState(appSchema);
      applyHeroPreset((command) => {
        state = toolcraftReducer(state, command);
      }, presetId);
      for (const [target, value] of Object.entries(heroPresets[presetId])) {
        expect(state.values[target], `${presetId} ${target}`).toEqual(value);
      }
      const params = readHeroParams(state);
      expect(params.structure.count).toBe(heroPresets[presetId]["structure.count"]);
      expect(state.history.undo.length).toBeGreaterThan(0);
    }
  });

  it("resolves preset actions and only those actions", () => {
    expect(getHeroPresetIdForAction(heroPresetActionValues.bend)).toBe("bend");
    expect(getHeroPresetIdForAction(heroPresetActionValues.wave)).toBe("wave");
    expect(getHeroPresetIdForAction(heroPresetActionValues.oculus)).toBe("oculus");
    expect(getHeroPresetIdForAction(heroPresetActionValues.amber)).toBe("amber");
    expect(getHeroPresetIdForAction("export.png")).toBeUndefined();
    expect(structureDefaults.count).toBe(heroPresets.oculus["structure.count"]);
  });
});
