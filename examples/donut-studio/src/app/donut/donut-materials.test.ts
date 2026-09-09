import { Color, ShaderLib, Texture } from "three";
import { describe, expect, it } from "vitest";

import {
  createDonutMaterials,
  disposeMaterial,
  updateDonutMaterials,
} from "./donut-materials";
import { DONUT_DEFAULTS, readDonutSettings } from "./donut-values";

function createFoodTextures() {
  return {
    baseColor: new Texture(),
    normal: new Texture(),
    roughness: new Texture(),
  };
}

describe("donut edible materials", () => {
  it("maps the supplied Strawberry defaults with real translucency", () => {
    const materials = createDonutMaterials(DONUT_DEFAULTS, createFoodTextures());

    expect(materials.base.emissiveIntensity).toBe(0);
    expect(materials.icing.emissiveIntensity).toBe(0);
    expect(materials.base.transmission).toBeGreaterThan(0);
    expect(materials.base.clearcoat).toBeCloseTo(0.19);
    expect(materials.base.transmission).toBeCloseTo(0.00784);
    expect(materials.icing.transmission).toBeCloseTo(0.08575);
    expect(materials.icing.thickness).toBeCloseTo(0.341);
    expect(materials.icing.clearcoat).toBeCloseTo(0.6275);
    expect(materials.icing.clearcoatRoughness).toBeCloseTo(0.195);

    disposeMaterial(Object.values(materials));
  });

  it("installs distinct stable object-space shaders for dough and icing", () => {
    const materials = createDonutMaterials(DONUT_DEFAULTS, createFoodTextures());
    const doughShader = {
      fragmentShader: ShaderLib.physical.fragmentShader,
      uniforms: {},
      vertexShader: ShaderLib.physical.vertexShader,
    };
    const icingShader = {
      fragmentShader: ShaderLib.physical.fragmentShader,
      uniforms: {},
      vertexShader: ShaderLib.physical.vertexShader,
    };
    const compileDough = materials.base.onBeforeCompile as unknown as (
      shader: typeof doughShader,
    ) => void;
    const compileIcing = materials.icing.onBeforeCompile as unknown as (
      shader: typeof icingShader,
    ) => void;

    compileDough(doughShader);
    compileIcing(icingShader);

    expect(materials.base.customProgramCacheKey()).toBe(
      "donut-edible-pbr-v5:dough",
    );
    expect(materials.icing.customProgramCacheKey()).toBe(
      "donut-edible-pbr-v5:icing",
    );
    expect(doughShader.vertexShader).toContain("vDonutFoodPosition");
    expect(doughShader.vertexShader).toContain("vDonutFoodUv = uv");
    expect(doughShader.fragmentShader).toContain(
      "const float donutFoodKind = 0.0",
    );
    expect(icingShader.fragmentShader).toContain(
      "const float donutFoodKind = 1.0",
    );
    expect(doughShader.fragmentShader).toContain("donutFoodPore");
    expect(doughShader.fragmentShader).toContain("donutFoodScanTone");
    expect(doughShader.fragmentShader).toContain("donutFoodCrust");
    expect(doughShader.fragmentShader).toContain("donutFoodRing");
    expect(doughShader.fragmentShader).toContain("textureGrad");
    expect(doughShader.fragmentShader).toContain("donutFoodAlign");
    expect(doughShader.fragmentShader).toContain("uFoodMoisture * 0.12");
    expect(doughShader.fragmentShader).toContain("roughnessFactor = clamp");
    expect(doughShader.fragmentShader).toContain(
      "normal = normalize(normal - donutFoodGradient",
    );
    expect(doughShader.fragmentShader).toContain("uFoodSssColor");
    expect(icingShader.fragmentShader).toContain("donutFoodGlazeCalm");
    expect(icingShader.fragmentShader).toContain("donutFoodRimEdge");
    expect(doughShader.uniforms).toEqual(
      expect.objectContaining({
        uFoodBake: { value: DONUT_DEFAULTS.materials.donut.bake },
        uFoodBaseColorMap: { value: expect.any(Texture) },
        uFoodNormalMap: { value: expect.any(Texture) },
        uFoodPores: { value: DONUT_DEFAULTS.materials.donut.pores },
        uFoodRoughnessMap: { value: expect.any(Texture) },
        uFoodSssColor: { value: expect.any(Color) },
        uFoodSubsurface: {
          value: DONUT_DEFAULTS.materials.donut.subsurface,
        },
      }),
    );
    expect(icingShader.uniforms).toEqual(
      expect.objectContaining({
        uFoodGlaze: { value: DONUT_DEFAULTS.materials.icing.glaze },
        uFoodSubsurface: {
          value: DONUT_DEFAULTS.materials.icing.subsurface,
        },
        uFoodTexture: { value: DONUT_DEFAULTS.materials.icing.texture },
      }),
    );

    disposeMaterial(Object.values(materials));
  });

  it("updates shader-facing physical properties without recompiling", () => {
    const initialSettings = readDonutSettings({
      "material.donut.moisture": 0,
      "material.donut.softness": 0,
      "material.donut.subsurface": 0,
      "material.icing.coat": 0,
      "material.icing.glaze": 0,
      "material.icing.subsurface": 0,
    });
    const materials = createDonutMaterials(
      initialSettings,
      createFoodTextures(),
    );
    const baseVersion = materials.base.version;
    const icingVersion = materials.icing.version;

    const settings = readDonutSettings({
      "material.donut.moisture": 1,
      "material.donut.softness": 0.5,
      "material.donut.subsurface": 1,
      "material.icing.coat": 1,
      "material.icing.glaze": 1,
      "material.icing.subsurface": 1,
    });
    const beforeBaseTransmission = materials.base.transmission;
    const beforeIcingClearcoat = materials.icing.clearcoat;

    updateDonutMaterials(materials, settings);

    expect(materials.base.transmission).toBeGreaterThan(beforeBaseTransmission);
    expect(materials.base.thickness).toBeGreaterThanOrEqual(0.5);
    expect(materials.icing.clearcoat).toBeGreaterThan(beforeIcingClearcoat);
    expect(materials.icing.envMapIntensity).toBeGreaterThan(1.5);
    expect(materials.base.version).toBe(baseVersion);
    expect(materials.icing.version).toBe(icingVersion);

    disposeMaterial(Object.values(materials));
  });

  it("spans dry matte pastry to wet mirror glaze across the slider range", () => {
    const materials = createDonutMaterials(DONUT_DEFAULTS, createFoodTextures());
    const dryMatte = readDonutSettings({
      "material.donut.coat": 0,
      "material.donut.moisture": 0,
      "material.donut.roughness": 1,
      "material.donut.sheen": 0,
      "material.donut.softness": 0,
      "material.donut.subsurface": 0,
      "material.icing.coat": 0,
      "material.icing.glaze": 0,
      "material.icing.roughness": 1,
      "material.icing.sheen": 0,
      "material.icing.subsurface": 0,
    });
    const softGlazed = readDonutSettings({
      "material.donut.coat": 1,
      "material.donut.moisture": 1,
      "material.donut.roughness": 0.05,
      "material.donut.sheen": 1,
      "material.donut.softness": 0.5,
      "material.donut.subsurface": 1,
      "material.icing.coat": 1,
      "material.icing.glaze": 1,
      "material.icing.roughness": 0.05,
      "material.icing.sheen": 1,
      "material.icing.subsurface": 1,
    });

    updateDonutMaterials(materials, dryMatte);
    const dry = {
      baseClearcoat: materials.base.clearcoat,
      baseRoughness: materials.base.roughness,
      baseSheen: materials.base.sheen,
      baseTransmission: materials.base.transmission,
      icingClearcoat: materials.icing.clearcoat,
      icingEnvMapIntensity: materials.icing.envMapIntensity,
      icingRoughness: materials.icing.roughness,
      icingSpecular: materials.icing.specularIntensity,
      icingTransmission: materials.icing.transmission,
    };
    updateDonutMaterials(materials, softGlazed);

    expect(dry.baseClearcoat).toBeLessThan(0.001);
    expect(dry.icingClearcoat).toBeLessThan(0.001);
    expect(materials.base.roughness).toBeLessThan(dry.baseRoughness - 0.9);
    expect(materials.base.clearcoat).toBeGreaterThan(dry.baseClearcoat + 0.9);
    expect(materials.base.sheen).toBeGreaterThan(dry.baseSheen + 0.9);
    expect(materials.base.transmission).toBeGreaterThan(
      dry.baseTransmission + 0.05,
    );
    expect(materials.icing.roughness).toBeLessThan(dry.icingRoughness - 0.9);
    expect(materials.icing.clearcoat).toBeGreaterThan(
      dry.icingClearcoat + 0.9,
    );
    expect(materials.icing.clearcoatRoughness).toBeLessThanOrEqual(0.05);
    expect(materials.icing.transmission).toBeGreaterThan(
      dry.icingTransmission + 0.3,
    );
    expect(materials.icing.specularIntensity).toBeGreaterThan(
      dry.icingSpecular + 0.7,
    );
    expect(materials.icing.envMapIntensity).toBeGreaterThan(
      dry.icingEnvMapIntensity + 0.5,
    );

    disposeMaterial(Object.values(materials));
  });
});
