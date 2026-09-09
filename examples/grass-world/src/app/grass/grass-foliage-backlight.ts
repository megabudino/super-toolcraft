import * as THREE from "three";

export type GrassFoliageBacklightUniforms = Record<string, THREE.IUniform>;

export function createGrassFoliageBacklightUniforms(): GrassFoliageBacklightUniforms {
  return {
    uGrassFoliageBacklight: { value: 0 },
  };
}

export function applyGrassFoliageBacklight(
  uniforms: GrassFoliageBacklightUniforms,
  strength: number,
): void {
  uniforms.uGrassFoliageBacklight!.value = THREE.MathUtils.clamp(
    strength,
    0,
    1,
  );
}

export function extendGrassFoliageMaterialWithBacklight(
  material: THREE.MeshPhysicalMaterial,
  uniforms: GrassFoliageBacklightUniforms,
  cacheKey: string,
): void {
  const previousOnBeforeCompile = material.onBeforeCompile;
  const previousProgramCacheKey = material.customProgramCacheKey;
  material.onBeforeCompile = (shader, renderer) => {
    previousOnBeforeCompile.call(material, shader, renderer);
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform float uGrassFoliageBacklight;",
      )
      .replace(
        "#include <aomap_fragment>",
        `#include <aomap_fragment>
        float grassFoliageFresnel = pow(
          1.0 - abs(dot(normalize(normal), normalize(vViewPosition))),
          2.0
        );
        float grassFoliageLight = mix(0.12, 0.42, grassFoliageFresnel);
        reflectedLight.indirectDiffuse +=
          diffuseColor.rgb * uGrassFoliageBacklight * grassFoliageLight;`,
      );
  };
  material.customProgramCacheKey = () =>
    `${previousProgramCacheKey.call(material)}:grass-foliage-backlight-v1:${cacheKey}`;
  material.needsUpdate = true;
}
