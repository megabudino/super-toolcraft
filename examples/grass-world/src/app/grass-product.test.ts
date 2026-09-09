import { describe, expect, it } from "vitest";
import {
  type ToolcraftControlSchema,
  type ToolcraftMediaAsset,
  type ToolcraftState,
} from "@/toolcraft/runtime";

import { appSchema } from "./app-schema";
import {
  getGrassEnvironmentLightingTuning,
  getGrassHdriPresetSource,
} from "./grass/grass-hdri";
import { createGrassLayout } from "./grass/grass-layout";
import { sampleGrassDistributionNoise } from "./grass/grass-distribution-noise";
import { getGrassReferenceSurfaceHeight } from "./grass/grass-reference-composition";
import { grassSunPatchFragmentDeclarations } from "./grass/grass-sun-patches";
import {
  getGrassLayoutKey,
  getGrassRenderKey,
  readGrassSettings,
  type GrassSettings,
} from "./grass/grass-values";
import { sampleTerrainNoise } from "./grass/terrain-noise";

function findControl(target: string): ToolcraftControlSchema {
  const sections = appSchema.panels.controls?.sections ?? [];
  for (const section of sections) {
    const control = Object.values(section.controls).find(
      (candidate) => candidate.target === target,
    );
    if (control) return control;
  }
  throw new Error(`Missing control ${target}`);
}

function stateWith(
  values: Record<string, unknown>,
  mediaAssets: readonly ToolcraftMediaAsset[] = [],
): ToolcraftState {
  return {
    canvas: { size: { height: 1080, width: 1920 } },
    mediaAssets,
    timeline: {
      currentTimeSeconds: 0,
      durationSeconds: 6,
      isLooping: true,
      isPlaying: false,
    },
    values,
  } as ToolcraftState;
}

function settingsWith(
  values: Record<string, unknown> = {},
  mediaAssets: readonly ToolcraftMediaAsset[] = [],
): GrassSettings {
  return readGrassSettings(stateWith(values, mediaAssets));
}

describe("Grass Studio product behavior", () => {
  it("grass controls map to renderer output", () => {
    const initial = settingsWith();
    const changed = settingsWith({
      "field.densityMax": 12_000,
      "field.seed": 44,
      "surface.brightness": 250,
      "surface.receiveShadows": false,
      "wind.strength": 88,
    });
    expect(getGrassRenderKey(changed)).not.toBe(getGrassRenderKey(initial));
    expect(createGrassLayout(changed).count).toBeLessThan(
      createGrassLayout(initial).count,
    );
    expect(findControl("surface.brightness")).toMatchObject({
      defaultValue: 214,
      max: 300,
      min: 0,
      type: "slider",
    });
    expect(findControl("surface.receiveShadows")).toMatchObject({
      defaultValue: true,
      type: "switch",
    });
    expect(changed.surface.brightness).toBe(2.5);
    expect(changed.surface.receiveShadows).toBe(false);
  });

  it("uses numeric text inputs for authored field dimensions", () => {
    expect(findControl("field.width")).toMatchObject({
      commitMode: "setting",
      max: 20,
      min: 2,
      textValueKind: "single-line",
      type: "text",
    });
    expect(findControl("field.depth")).toMatchObject({
      commitMode: "setting",
      label: "Length",
      type: "text",
    });
    expect(settingsWith({ "field.width": "18.5" }).field.width).toBe(18.5);
    expect(settingsWith({ "field.depth": "999" }).field.depth).toBe(20);
  });

  it("terrain noise preview maps runtime state to terrain output", () => {
    expect(findControl("terrain.noiseOffset")).toMatchObject({
      keyframeable: false,
      type: "grassNoisePreview",
    });
    expect(findControl("terrain.detail")).toMatchObject({
      max: 6,
      min: 1,
      performanceRole: "workload",
      type: "slider",
    });
    const initial = settingsWith();
    const shifted = settingsWith({
      "terrain.detail": 6,
      "terrain.noiseOffset": [5.5, -3.25],
      "terrain.noiseScale": 0.72,
      "terrain.roughness": 78,
      "terrain.seed": 83,
    });
    expect(sampleTerrainNoise(0, 0, shifted.terrain)).not.toBe(
      sampleTerrainNoise(0, 0, initial.terrain),
    );
    expect(getGrassLayoutKey(shifted)).not.toBe(getGrassLayoutKey(initial));
    expect(createGrassLayout(shifted).offsets).not.toEqual(
      createGrassLayout(initial).offsets,
    );
  });

  it("Tall Grass distribution preview maps Voronoi state to exact layout", () => {
    expect(findControl("field.distributionOffset")).toMatchObject({
      keyframeable: false,
      type: "grassNoisePreview",
    });
    const initial = settingsWith({
      "field.densityMax": 10_000,
      "field.distanceMin": 0.04,
      "field.distributionLevels": [20, 80],
    });
    const shifted = settingsWith({
      "field.densityMax": 10_000,
      "field.distanceMin": 0.04,
      "field.distributionLevels": [20, 80],
      "field.distributionOffset": [4, -3],
    });
    expect(createGrassLayout(initial).count).toBeGreaterThan(0);
    expect(createGrassLayout(initial).count).toBeLessThanOrEqual(10_000);
    expect(createGrassLayout(shifted).offsets).not.toEqual(
      createGrassLayout(initial).offsets,
    );
  });

  it("Tall Grass distribution levels map black and white bounds to layout", () => {
    const settings = settingsWith({
      "field.distributionLevels": [45, 55],
    }).field.distribution;
    const samples = Array.from({ length: 64 }, (_, index) =>
      sampleGrassDistributionNoise(
        (index % 8) * 0.55,
        Math.floor(index / 8) * 0.55,
        settings,
      ),
    );
    expect(samples).toContain(0);
    expect(samples).toContain(1);
  });

  it("terrain maximum height raises the shared grass layout", () => {
    const lowTerrain = settingsWith({ "terrain.maxHeight": 0.45 });
    const highTerrain = settingsWith({ "terrain.maxHeight": 1.8 });
    expect(
      getGrassReferenceSurfaceHeight(0.8, -1.1, lowTerrain),
    ).toBeLessThan(
      getGrassReferenceSurfaceHeight(0.8, -1.1, highTerrain),
    );
    const lowLayout = createGrassLayout(lowTerrain);
    const highLayout = createGrassLayout(highTerrain);
    const lowY = Array.from(lowLayout.offsets).filter(
      (_, index) => index % 3 === 1,
    );
    const highY = Array.from(highLayout.offsets).filter(
      (_, index) => index % 3 === 1,
    );
    expect(Math.max(...highY)).toBeGreaterThan(Math.max(...lowY));
  });

  it("grass conditional distribution controls map to renderer output", () => {
    const open = createGrassLayout(
      settingsWith({ "field.topFacingOnly": false }),
    );
    const filtered = createGrassLayout(
      settingsWith({
        "field.topFacingCoverage": 0,
        "field.topFacingFade": 0,
        "field.topFacingOnly": true,
      }),
    );
    expect(Array.from(filtered.visibility)).not.toEqual(
      Array.from(open.visibility),
    );
  });

  it("grass blade height range maps both bounds to layout", () => {
    const short = createGrassLayout(
      settingsWith({ "blade.heightRange": [0.2, 0.45] }),
    );
    const tall = createGrassLayout(
      settingsWith({ "blade.heightRange": [1.8, 2.4] }),
    );
    expect(Math.max(...tall.heights)).toBeGreaterThan(
      Math.max(...short.heights),
    );
    expect(Math.min(...tall.heights)).toBeGreaterThan(
      Math.min(...short.heights),
    );
  });

  it("grass always uses one physical material model", () => {
    expect(() => findControl("appearance.materialStyle")).toThrow();
    expect(() => findControl("appearance.pbrEnabled")).toThrow();
    expect(findControl("environment.preset").visibleWhen).toBeUndefined();
    expect(findControl("environment.hdriFile").visibleWhen).toBeUndefined();
  });

  it("grass PBR parameters map to the physical blade material", () => {
    const settings = settingsWith({
      "appearance.pbrRoughness": 18,
      "appearance.pbrSheen": 92,
    });
    expect(settings.appearance.pbrRoughness).toBe(0.18);
    expect(settings.appearance.pbrSheen).toBe(0.92);
    expect(findControl("appearance.pbrRoughness").visibleWhen).toBeUndefined();
    expect(() => findControl("appearance.pbrSheen")).toThrow();
  });

  it("grass HDRI presets map every environment to retained lighting", () => {
    const control = findControl("environment.preset");
    expect(control.type).toBe("imagePicker");
    expect(control.items?.map((item) => item.value)).toEqual([
      "meadow",
      "alps",
      "sunrise",
      "hardSun",
      "overcast",
      "forest",
      "golden",
      "blendSunset",
    ]);
    const meadow = settingsWith({ "environment.preset": "meadow" });
    const blendSunset = settingsWith({
      "environment.preset": "blendSunset",
    });
    const hardSun = settingsWith({ "environment.preset": "hardSun" });
    const sunrise = settingsWith({ "environment.preset": "sunrise" });
    expect(meadow.environment.source.cacheKey).toBe("preset:meadow");
    expect(blendSunset.environment.source.cacheKey).toBe("preset:blendSunset");
    expect(hardSun.environment.source.cacheKey).toBe("preset:hardSun");
    expect(sunrise.environment.source.cacheKey).toBe("preset:sunrise");
    expect(
      getGrassEnvironmentLightingTuning(hardSun.environment.source),
    ).toMatchObject({
      ambient: expect.any(Number),
      environmentFill: expect.any(Number),
      key: expect.any(Number),
      stylizedContrast: expect.any(Number),
    });
    expect(
      getGrassEnvironmentLightingTuning(hardSun.environment.source).key,
    ).toBeGreaterThan(
      getGrassEnvironmentLightingTuning(getGrassHdriPresetSource("meadow")).key,
    );
    expect(getGrassRenderKey(sunrise)).not.toBe(getGrassRenderKey(meadow));
  });

  it("grass custom HDRI source overrides and restores the preset", () => {
    const customAsset: ToolcraftMediaAsset = {
      assetKind: "file",
      dataUrl: "data:image/vnd.radiance;base64,ZmFrZQ==",
      fileName: "studio.hdr",
      id: "custom-hdri",
      layerId: "custom-hdri-layer",
      mimeType: "application/octet-stream",
      position: { x: 0, y: 0 },
      sourceTarget: "environment.hdriFile",
    };
    const custom = settingsWith({}, [customAsset]);
    const restored = settingsWith();
    expect(findControl("environment.hdriFile")).toMatchObject({
      assetKind: "file",
      defaultValue: null,
      multiple: false,
      type: "fileDrop",
    });
    expect(custom.environment.source).toMatchObject({
      cacheKey: "custom:custom-hdri:studio.hdr",
      kind: "custom",
    });
    expect(restored.environment.source.kind).toBe("preset");
  });

  it("grass HDRI settings map to the entire scene output", () => {
    const settings = settingsWith({
      "environment.backgroundBlur": 88,
      "environment.exposure": 124,
      "environment.fillColor": "#86aa9e",
      "environment.fillStrength": 138,
      "environment.highlightWarmth": 72,
      "environment.intensity": 175,
      "environment.keyColor": "#ffe2a0",
      "environment.keyStrength": 146,
      "environment.rimColor": "#d8f1cf",
      "environment.rimStrength": 121,
      "environment.rotation": 270,
      "environment.rotationX": -42,
      "environment.rotationZ": 63,
      "environment.sceneContrast": 142,
      "environment.sceneSaturation": 92,
      "environment.shadowCoolness": 34,
      "environment.visible": false,
    });
    expect(settings.environment).toMatchObject({
      backgroundBlur: 0.88,
      exposure: 1.24,
      fillColor: "#86aa9e",
      fillStrength: 1.38,
      highlightWarmth: 0.72,
      intensity: 1.75,
      keyColor: "#ffe2a0",
      keyStrength: 1.46,
      rimColor: "#d8f1cf",
      rimStrength: 1.21,
      rotation: 270,
      rotationX: -42,
      rotationZ: 63,
      sceneContrast: 1.42,
      sceneSaturation: 0.92,
      shadowCoolness: 0.34,
      visible: false,
    });
    for (const target of [
      "environment.keyColor",
      "environment.keyStrength",
      "environment.fillColor",
      "environment.fillStrength",
      "environment.rimColor",
      "environment.rimStrength",
      "environment.exposure",
      "environment.sceneContrast",
      "environment.sceneSaturation",
      "environment.highlightWarmth",
      "environment.shadowCoolness",
    ]) {
      expect(findControl(target)).toBeDefined();
    }
  });

  it("grass final color grade maps to the lit scene output", () => {
    const settings = settingsWith({
      "environment.highlightWarmth": 72,
      "environment.sceneContrast": 142,
      "environment.sceneSaturation": 92,
      "environment.shadowCoolness": 34,
    });
    expect(settings.environment).toMatchObject({
      highlightWarmth: 0.72,
      sceneContrast: 1.42,
      sceneSaturation: 0.92,
      shadowCoolness: 0.34,
    });
    for (const target of [
      "environment.sceneContrast",
      "environment.sceneSaturation",
      "environment.highlightWarmth",
      "environment.shadowCoolness",
    ]) {
      expect(findControl(target)).toBeDefined();
    }
  });

  it("reference reset preserves the authored composition", () => {
    const settings = settingsWith();
    expect(settings.field).toMatchObject({ densityMax: 24_000, seed: 149_410 });
    expect(settings.lawn).toMatchObject({
      densityMax: 36_000,
      heightMax: 0.16,
      heightMin: 0.0585,
      seed: 26,
    });
    expect(
      (["tufted", "wild", "white", "yellow", "rocks"] as const).map((kind) => [
        settings.scans[kind].count,
        settings.scans[kind].seed,
      ]),
    ).toEqual([
      [1000, 71],
      [1000, 29],
      [1000, 67],
      [1000, 39],
      [89, 75],
    ]);
    expect(settings.scans.boulder).toMatchObject({ enabled: true, seed: 51 });
  });

  it("grass sun patches map controls to world-space light mask", () => {
    const initial = settingsWith();
    const changed = settingsWith({
      "environment.sunPatchCoverage": 73,
      "environment.sunPatchEnabled": true,
      "environment.sunPatchOffset": { x: "-0.75", y: "0.50" },
      "environment.sunPatchScale": 5.2,
      "environment.sunPatchSeed": 92,
      "environment.sunPatchSoftness": 24,
      "environment.sunPatchStrength": 175,
    });
    expect(changed.environment.sunPatches).toEqual({
      coverage: 0.73,
      enabled: true,
      offset: [-6, 4],
      scale: 5.2,
      seed: 92,
      softness: 0.24,
      strength: 1.75,
    });
    expect(findControl("environment.sunPatchStrength")).toMatchObject({
      defaultValue: 156,
      max: 200,
      min: 0,
      type: "slider",
    });
    expect(grassSunPatchFragmentDeclarations).toContain(
      "float extraStrength = clamp(uSunPatchStrength - 1.0, 0.0, 1.0)",
    );
    expect(grassSunPatchFragmentDeclarations).toContain(
      "float shadowIndirect = mix(1.0, 0.35, extraStrength)",
    );
    expect(findControl("environment.sunPatchOffset")).toMatchObject({
      coordinateMode: "cartesian",
      defaultValue: { x: "-0.12", y: "0.05" },
      keyframeable: false,
      type: "vector",
      visibleWhen: {
        equals: true,
        target: "environment.sunPatchEnabled",
      },
    });
    expect(getGrassRenderKey(changed)).not.toBe(getGrassRenderKey(initial));
  });

  it("grass gradient maps all visible parts to blade shader", () => {
    const settings = settingsWith({
      "appearance.colorContrast": 140,
      "appearance.colorSaturation": 65,
      "appearance.colorVariation": 84,
      "appearance.bladeGradient": {
        angle: 12,
        gradientType: "radial",
        stops: [
          { color: "#ff0000", opacity: 25, position: "5%" },
          { color: "#00ff00", opacity: 80, position: "45%" },
          { color: "#0000ff", opacity: 100, position: "90%" },
        ],
      },
    });
    expect(settings.appearance.bladeColors).toEqual([
      "#ff0000",
      "#00ff00",
      "#0000ff",
    ]);
    expect(settings.appearance.colorVariation).toBe(0.84);
    expect(settings.appearance.colorContrast).toBe(1.4);
    expect(settings.appearance.colorSaturation).toBe(0.65);
    expect(findControl("appearance.colorVariation")).toMatchObject({
      defaultValue: 59,
      max: 100,
      min: 0,
      performanceRole: "responsiveness",
      type: "slider",
    });
    for (const [target, defaultValue] of [
      ["appearance.colorContrast", 131],
      ["appearance.colorSaturation", 200],
    ] as const) {
      expect(findControl(target)).toMatchObject({
        defaultValue,
        max: 200,
        min: 0,
        performanceRole: "responsiveness",
        type: "slider",
      });
    }
  });
});
