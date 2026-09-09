import * as THREE from "three";

import {
  extendGrassStandardMaterialWithColorGrade,
  type GrassColorGradeUniforms,
} from "./grass-color-grade";
import {
  extendGrassStandardMaterialWithGroundBlend,
  type GrassGroundBlendUniforms,
} from "./grass-ground-blend-material";
import type { GrassSurfaceEdgeFadeResource } from "./grass-surface-edge-fade";
import {
  extendGrassStandardMaterialWithSunPatches,
  type GrassSunPatchUniforms,
} from "./grass-sun-patches";
import type { GrassTextureMaskUniforms } from "./grass-texture-mask";

export type GrassGroundMaterialSet = Readonly<{
  depth: THREE.MeshDepthMaterial;
  surface: THREE.MeshStandardMaterial;
}>;

export function createGrassGroundMaterialSet(
  sunPatchUniforms: GrassSunPatchUniforms,
  colorGradeUniforms: GrassColorGradeUniforms,
  textureMaskUniforms: GrassTextureMaskUniforms,
  blendUniforms: GrassGroundBlendUniforms,
  surfaceEdgeFade: GrassSurfaceEdgeFadeResource,
): GrassGroundMaterialSet {
  const surface = new THREE.MeshStandardMaterial({
    color: "#17261c",
    metalness: 0,
    roughness: 0.96,
    side: THREE.DoubleSide,
  });
  extendGrassStandardMaterialWithSunPatches(
    surface,
    sunPatchUniforms,
    "ground",
  );
  extendGrassStandardMaterialWithColorGrade(
    surface,
    colorGradeUniforms,
    "ground",
  );
  extendGrassStandardMaterialWithGroundBlend(
    surface,
    textureMaskUniforms,
    blendUniforms,
    "ground",
  );
  surfaceEdgeFade.extendBlend(surface, "ground");

  const depth = new THREE.MeshDepthMaterial({
    depthPacking: THREE.RGBADepthPacking,
    side: THREE.DoubleSide,
  });
  surfaceEdgeFade.extendHashed(depth, "ground:depth");
  return { depth, surface };
}
