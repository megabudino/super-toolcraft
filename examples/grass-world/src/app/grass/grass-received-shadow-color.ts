import * as THREE from "three";

export type GrassReceivedShadowColorUniforms = Record<string, THREE.IUniform>;

export const grassReceivedShadowColorFragment = /* glsl */ `
  #include <shadowmask_pars_fragment>

  uniform vec3 uGrassReceivedShadowColor;

  vec3 grassApplyReceivedShadowColor(vec3 sourceColor) {
    float receivedShadow = clamp(1.0 - getShadowMask(), 0.0, 1.0);
    return sourceColor * mix(
      vec3(1.0),
      uGrassReceivedShadowColor,
      receivedShadow
    );
  }
`;

export function createGrassReceivedShadowColorUniforms(): GrassReceivedShadowColorUniforms {
  return {
    uGrassReceivedShadowColor: { value: new THREE.Color(0xffffff) },
  };
}

export function applyGrassReceivedShadowColor(
  uniforms: GrassReceivedShadowColorUniforms,
  color: string,
): void {
  (uniforms.uGrassReceivedShadowColor!.value as THREE.Color).set(color);
}

export function extendGrassStandardMaterialWithReceivedShadowColor(
  material: THREE.MeshStandardMaterial,
  uniforms: GrassReceivedShadowColorUniforms,
  cacheKey: string,
): void {
  const previousOnBeforeCompile = material.onBeforeCompile;
  const previousProgramCacheKey = material.customProgramCacheKey;
  material.onBeforeCompile = (shader, renderer) => {
    previousOnBeforeCompile.call(material, shader, renderer);
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <shadowmap_pars_fragment>",
        `#include <shadowmap_pars_fragment>\n${grassReceivedShadowColorFragment}`,
      )
      .replace(
        "#include <opaque_fragment>",
        "outgoingLight = grassApplyReceivedShadowColor(outgoingLight);\n#include <opaque_fragment>",
      );
  };
  material.customProgramCacheKey = () =>
    `${previousProgramCacheKey.call(material)}:grass-received-shadow-color-v1:${cacheKey}`;
  material.needsUpdate = true;
}
