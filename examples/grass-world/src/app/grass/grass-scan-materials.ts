import * as THREE from "three";

import {
  createGrassColorGradeUniforms,
  extendGrassStandardMaterialWithColorGrade,
  type GrassColorGradeUniforms,
} from "./grass-color-grade";
import {
  createGrassFoliageBacklightUniforms,
  extendGrassFoliageMaterialWithBacklight,
  type GrassFoliageBacklightUniforms,
} from "./grass-foliage-backlight";
import type { GrassScanLayerKind } from "./grass-scan-contract";
import {
  createGrassReceivedShadowColorUniforms,
  extendGrassStandardMaterialWithReceivedShadowColor,
  type GrassReceivedShadowColorUniforms,
} from "./grass-received-shadow-color";
import {
  createGrassScanFoliageDepthMaterial,
  extendGrassScanFoliageMaterialWithWind,
} from "./grass-scan-wind";
import {
  extendGrassStandardMaterialWithSunPatches,
  type GrassSunPatchUniforms,
} from "./grass-sun-patches";
import type { GrassSurfaceEdgeFadeResource } from "./grass-surface-edge-fade";
import {
  createGrassTextureMaskUniforms,
  extendGrassStandardMaterialWithTextureMask,
  type GrassTextureMaskUniforms,
} from "./grass-texture-mask";
import {
  createGrassWindUniforms,
  type GrassWindUniforms,
} from "./grass-wind-material";

export type GrassScanLoadedTextureSet = Readonly<{
  ao: THREE.Texture;
  baseColor: THREE.Texture;
  normal: THREE.Texture;
  opacity?: THREE.Texture;
  roughness: THREE.Texture;
}>;

export type GrassScanMaterialBundle = Readonly<{
  backlightUniforms?: GrassFoliageBacklightUniforms;
  colorGradeUniforms: GrassColorGradeUniforms;
  depthMaterial: THREE.MeshDepthMaterial;
  material: THREE.MeshStandardMaterial;
  receivedShadowColorUniforms?: GrassReceivedShadowColorUniforms;
  textureMaskUniforms: GrassTextureMaskUniforms;
  windUniforms?: GrassWindUniforms;
}>;

export type GrassBoulderMaterialBundle = Readonly<{
  colorGradeUniforms: GrassColorGradeUniforms;
  depthMaterial: THREE.MeshDepthMaterial;
  material: THREE.MeshStandardMaterial;
  receivedShadowColorUniforms: GrassReceivedShadowColorUniforms;
  textureMaskUniforms: GrassTextureMaskUniforms;
}>;

const foliageNormalStrength = 0.48;
const rockNormalStrength = 0.95;

export function applyGrassScanDirectXNormalScale(
  material: THREE.MeshStandardMaterial,
  strength: number,
): void {
  material.normalScale.set(strength, -strength);
}

export function createGrassScanMaterialBundle(
  kind: GrassScanLayerKind,
  textures: GrassScanLoadedTextureSet,
  sunPatchUniforms: GrassSunPatchUniforms,
  surfaceEdgeFade: GrassSurfaceEdgeFadeResource,
): GrassScanMaterialBundle {
  const plant = kind !== "rocks";
  const material = plant
    ? new THREE.MeshPhysicalMaterial({
        alphaMap: textures.opacity ?? null,
        alphaTest: 0.44,
        aoMap: textures.ao,
        color: 0xffffff,
        map: textures.baseColor,
        metalness: 0,
        normalMap: textures.normal,
        roughness: 0.88,
        roughnessMap: textures.roughness,
        sheen: 0.1,
        sheenColor: new THREE.Color(0xdfffd8),
        side: THREE.DoubleSide,
      })
    : new THREE.MeshStandardMaterial({
        aoMap: textures.ao,
        color: 0xffffff,
        map: textures.baseColor,
        metalness: 0,
        normalMap: textures.normal,
        roughness: 0.9,
        roughnessMap: textures.roughness,
      });
  material.alphaToCoverage = plant;
  applyGrassScanDirectXNormalScale(
    material,
    plant ? foliageNormalStrength : rockNormalStrength,
  );
  extendGrassStandardMaterialWithSunPatches(
    material,
    sunPatchUniforms,
    `scan:${kind}`,
  );
  const colorGradeUniforms = createGrassColorGradeUniforms();
  extendGrassStandardMaterialWithColorGrade(
    material,
    colorGradeUniforms,
    `scan:${kind}`,
  );
  const receivedShadowColorUniforms = plant
    ? undefined
    : createGrassReceivedShadowColorUniforms();
  if (receivedShadowColorUniforms) {
    extendGrassStandardMaterialWithReceivedShadowColor(
      material,
      receivedShadowColorUniforms,
      `scan:${kind}`,
    );
  }
  const textureMaskUniforms = createGrassTextureMaskUniforms();
  extendGrassStandardMaterialWithTextureMask(
    material,
    textureMaskUniforms,
    `scan:${kind}`,
  );
  if (material instanceof THREE.MeshPhysicalMaterial) {
    const windUniforms = createGrassWindUniforms();
    extendGrassScanFoliageMaterialWithWind(
      material,
      windUniforms,
      `scan:${kind}`,
    );
    const depthMaterial = createGrassScanFoliageDepthMaterial(
      textures.opacity ?? null,
      windUniforms,
      `scan:${kind}`,
    );
    const backlightUniforms = createGrassFoliageBacklightUniforms();
    extendGrassFoliageMaterialWithBacklight(
      material,
      backlightUniforms,
      `scan:${kind}`,
    );
    surfaceEdgeFade.extendHashed(material, `scan:${kind}`);
    surfaceEdgeFade.extendHashed(depthMaterial, `scan:${kind}:depth`);
    return {
      backlightUniforms,
      colorGradeUniforms,
      depthMaterial,
      material,
      textureMaskUniforms,
      windUniforms,
    };
  }
  const depthMaterial = new THREE.MeshDepthMaterial({
    depthPacking: THREE.RGBADepthPacking,
  });
  surfaceEdgeFade.extendHashed(material, `scan:${kind}`);
  surfaceEdgeFade.extendHashed(depthMaterial, `scan:${kind}:depth`);
  return {
    colorGradeUniforms,
    depthMaterial,
    material,
    ...(receivedShadowColorUniforms ? { receivedShadowColorUniforms } : {}),
    textureMaskUniforms,
  };
}

export function createGrassBoulderMaterialBundle(
  textures: GrassScanLoadedTextureSet,
  sunPatchUniforms: GrassSunPatchUniforms,
  surfaceEdgeFade: GrassSurfaceEdgeFadeResource,
): GrassBoulderMaterialBundle {
  const material = new THREE.MeshStandardMaterial({
    aoMap: textures.ao,
    aoMapIntensity: 1,
    color: 0xffffff,
    map: textures.baseColor,
    metalness: 0,
    normalMap: textures.normal,
    roughness: 0.9,
    roughnessMap: textures.roughness,
  });
  applyGrassScanDirectXNormalScale(material, rockNormalStrength);
  extendGrassStandardMaterialWithSunPatches(
    material,
    sunPatchUniforms,
    "scan:boulder",
  );
  const colorGradeUniforms = createGrassColorGradeUniforms();
  extendGrassStandardMaterialWithColorGrade(
    material,
    colorGradeUniforms,
    "scan:boulder",
  );
  const receivedShadowColorUniforms = createGrassReceivedShadowColorUniforms();
  extendGrassStandardMaterialWithReceivedShadowColor(
    material,
    receivedShadowColorUniforms,
    "scan:boulder",
  );
  const textureMaskUniforms = createGrassTextureMaskUniforms();
  extendGrassStandardMaterialWithTextureMask(
    material,
    textureMaskUniforms,
    "scan:boulder",
  );
  const depthMaterial = new THREE.MeshDepthMaterial({
    depthPacking: THREE.RGBADepthPacking,
  });
  surfaceEdgeFade.extendHashed(material, "scan:boulder");
  surfaceEdgeFade.extendHashed(depthMaterial, "scan:boulder:depth");
  return {
    colorGradeUniforms,
    depthMaterial,
    material,
    receivedShadowColorUniforms,
    textureMaskUniforms,
  };
}
