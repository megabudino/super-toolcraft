import {
  Color,
  MeshPhysicalMaterial,
  SRGBColorSpace,
  type Material,
} from "three";

import {
  installDonutFoodShader,
  type DonutFoodTextures,
  updateDonutFoodShader,
} from "./donut-food-shader";
import type { DonutSettings } from "./donut-types";

export type DonutMaterials = Readonly<{
  base: MeshPhysicalMaterial;
  icing: MeshPhysicalMaterial;
  plate: MeshPhysicalMaterial;
  sprinkle: MeshPhysicalMaterial;
}>;

const WHITE = new Color(1, 1, 1);
const DOUGH_GLOW_FILTER = new Color(1.35, 0.95, 0.7);
const scratchTint = new Color();

function boundedRange(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function createDonutMaterials(
  settings: DonutSettings,
  foodTextures: DonutFoodTextures,
): DonutMaterials {
  const base = new MeshPhysicalMaterial({
    attenuationColor: new Color(settings.materials.donut.color),
    attenuationDistance: 1.8,
    clearcoatRoughness: 0.45,
    color: new Color(settings.materials.donut.color),
    ior: 1.4,
    metalness: 0,
    roughness: settings.materials.donut.roughness,
    sheen: settings.materials.donut.sheen,
    sheenColor: new Color("#7E2410"),
    sheenRoughness: 0.6,
    specularIntensity: 0.25,
    thickness: 0.2,
    transmission: 0.001,
  });
  base.name = "Blender.Material";
  installDonutFoodShader(base, "dough", foodTextures);

  const icing = new MeshPhysicalMaterial({
    attenuationColor: new Color(settings.icing.color),
    attenuationDistance: 0.72,
    clearcoatRoughness: 0.24,
    color: new Color(settings.icing.color),
    ior: 1.45,
    metalness: 0,
    roughness: settings.materials.icing.roughness,
    sheen: settings.materials.icing.sheen,
    sheenColor: new Color(settings.icing.color),
    sheenRoughness: 0.45,
    specularIntensity: 0.3,
    thickness: 0.12,
    transmission: 0.001,
  });
  icing.name = "Blender.icing";
  installDonutFoodShader(icing, "icing", foodTextures);

  const plate = new MeshPhysicalMaterial({
    clearcoatRoughness: 0.12,
    color: new Color(settings.materials.plate.color),
    ior: 1.45,
    metalness: 0,
    roughness: settings.materials.plate.roughness,
  });
  plate.name = "Blender.Material.002";

  const sprinkle = new MeshPhysicalMaterial({
    clearcoatRoughness: 0.28,
    color: 0xffffff,
    ior: 1.45,
    metalness: settings.sprinkles.metallic,
    roughness: settings.materials.sprinkle.roughness,
    sheen: 0.0458,
    sheenColor: 0xffffff,
    sheenRoughness: 0.55,
  });
  sprinkle.name = "Blender.sprinkle";

  for (const material of [base, icing, plate, sprinkle]) {
    material.toneMapped = true;
  }

  const materials = Object.freeze({ base, icing, plate, sprinkle });
  updateDonutMaterials(materials, settings);
  return materials;
}

export function updateDonutMaterials(
  materials: DonutMaterials,
  settings: DonutSettings,
): void {
  const baseSettings = settings.materials.donut;
  materials.base.color.set(baseSettings.color);
  materials.base.roughness = boundedRange(
    baseSettings.roughness -
      baseSettings.moisture * 0.3 -
      baseSettings.softness * 0.1,
    0.05,
    1,
  );
  materials.base.clearcoat = boundedRange(
    baseSettings.coat * 0.85 + baseSettings.moisture * 0.4,
    0.0001,
    1,
  );
  materials.base.clearcoatRoughness = boundedRange(
    0.52 - baseSettings.moisture * 0.22 - baseSettings.coat * 0.14,
    0.08,
    1,
  );
  materials.base.sheen = boundedRange(
    baseSettings.sheen +
      baseSettings.subsurface * baseSettings.softness * 0.3,
    0.0001,
    1,
  );
  materials.base.sheenColor.copy(materials.base.color).lerp(WHITE, 0.55);
  materials.base.transmission = Math.max(
    0.001,
    baseSettings.subsurface * (0.02 + baseSettings.softness * 0.1),
  );
  materials.base.thickness = 0.1 + baseSettings.softness * 1.4;
  materials.base.attenuationColor.set(baseSettings.color);
  materials.base.attenuationDistance = 0.9 + baseSettings.softness * 3.2;
  materials.base.specularIntensity = 0.18 + baseSettings.moisture * 0.5;
  materials.base.envMapIntensity = 1 + baseSettings.moisture * 0.35;
  materials.base.emissiveIntensity = 0;
  scratchTint.copy(materials.base.color).multiply(DOUGH_GLOW_FILTER);
  updateDonutFoodShader(materials.base, {
    bake: baseSettings.bake,
    glaze: 0,
    moisture: baseSettings.moisture,
    pores: baseSettings.pores,
    sssTint: scratchTint,
    subsurface: baseSettings.subsurface,
    texture: 0,
    variation: baseSettings.variation,
  });

  const icingSettings = settings.materials.icing;
  materials.icing.color.set(settings.icing.color);
  materials.icing.roughness = boundedRange(
    icingSettings.roughness - icingSettings.glaze * 0.5,
    0.03,
    1,
  );
  materials.icing.clearcoat = boundedRange(
    icingSettings.coat * 0.35 + icingSettings.glaze * 0.95,
    0.0001,
    1,
  );
  materials.icing.clearcoatRoughness = boundedRange(
    0.4 - icingSettings.glaze * 0.34 - icingSettings.coat * 0.06,
    0.04,
    1,
  );
  materials.icing.sheen = boundedRange(
    icingSettings.sheen * 0.7 + icingSettings.subsurface * 0.12,
    0.0001,
    1,
  );
  materials.icing.sheenColor
    .set(settings.icing.color)
    .lerp(WHITE, 0.35);
  materials.icing.transmission = Math.max(
    0.001,
    icingSettings.subsurface * (0.08 + icingSettings.glaze * 0.3),
  );
  materials.icing.thickness =
    0.1 + icingSettings.subsurface * 0.5 + icingSettings.glaze * 0.12;
  materials.icing.attenuationColor
    .set(settings.icing.color)
    .offsetHSL(0, 0.18, -0.05);
  materials.icing.attenuationDistance = 0.3 + icingSettings.glaze * 0.5;
  materials.icing.specularIntensity = 0.25 + icingSettings.glaze * 0.75;
  materials.icing.envMapIntensity = 1 + icingSettings.glaze * 0.9;
  materials.icing.emissiveIntensity = 0;
  scratchTint.set(settings.icing.color).offsetHSL(0, 0.1, 0.12);
  updateDonutFoodShader(materials.icing, {
    bake: 0,
    glaze: icingSettings.glaze,
    moisture: 0,
    pores: 0,
    sssTint: scratchTint,
    subsurface: icingSettings.subsurface,
    texture: icingSettings.texture,
    variation: 0,
  });

  const plateSettings = settings.materials.plate;
  materials.plate.color.set(plateSettings.color);
  materials.plate.roughness = plateSettings.roughness;
  materials.plate.clearcoat = Math.max(0.0001, plateSettings.coat);

  const sprinkleSettings = settings.materials.sprinkle;
  materials.sprinkle.metalness = settings.sprinkles.metallic;
  materials.sprinkle.roughness = sprinkleSettings.roughness;
  materials.sprinkle.clearcoat = Math.max(0.0001, sprinkleSettings.coat);
}

export function disposeMaterial(material: Material | readonly Material[]): void {
  const materials = Array.isArray(material) ? material : [material];
  for (const item of materials) item.dispose();
}

export const DONUT_OUTPUT_COLOR_SPACE = SRGBColorSpace;
