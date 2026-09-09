import * as THREE from "three";

export type GrassColorGradeSettings = Readonly<{
  colorContrast: number;
  colorSaturation: number;
}>;

export type GrassSceneGradeSettings = Readonly<{
  highlightWarmth: number;
  sceneContrast: number;
  sceneSaturation: number;
  shadowCoolness: number;
}>;

export type GrassColorGradeUniforms = Record<string, THREE.IUniform>;

export const grassColorGradeFragmentDeclarations = /* glsl */ `
  uniform float uGrassColorContrast;
  uniform float uGrassColorSaturation;
  uniform float uGrassHighlightWarmth;
  uniform float uGrassSceneContrast;
  uniform float uGrassSceneSaturation;
  uniform float uGrassShadowCoolness;

  vec3 grassApplyMaterialColor(vec3 sourceColor) {
    if (
      abs(uGrassColorContrast - 1.0) < 0.0001 &&
      abs(uGrassColorSaturation - 1.0) < 0.0001
    ) {
      return sourceColor;
    }
    vec3 color = max(sourceColor, vec3(0.0));
    float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
    color = mix(
      vec3(luminance),
      color,
      max(0.0, uGrassColorSaturation)
    );
    color = (color - vec3(0.18)) * max(0.0, uGrassColorContrast) + vec3(0.18);
    return max(color, vec3(0.0));
  }

  vec3 grassApplySceneGrade(vec3 sourceColor) {
    vec3 color = clamp(sourceColor, 0.0, 1.0);
    float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
    color = mix(
      vec3(luminance),
      color,
      max(0.0, uGrassSceneSaturation)
    );
    color = clamp(color, 0.0, 1.0);

    vec3 smoothCurve = color * color * (3.0 - 2.0 * color);
    float sceneContrast = clamp(uGrassSceneContrast, 0.0, 2.0);
    if (sceneContrast < 1.0) {
      color = clamp(
        (color - vec3(0.5)) * sceneContrast + vec3(0.5),
        0.0,
        1.0
      );
    } else {
      float contrastStrength = clamp(
        (sceneContrast - 1.0) * 1.25,
        0.0,
        1.0
      );
      color = mix(color, smoothCurve, contrastStrength);
    }

    luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
    float shadowMask = 1.0 - smoothstep(0.08, 0.42, luminance);
    float highlightMask = smoothstep(0.34, 0.82, luminance);
    vec3 coolShadow = vec3(0.84, 1.0, 1.1);
    vec3 warmHighlight = vec3(1.16, 1.06, 0.78);
    color *= mix(
      vec3(1.0),
      coolShadow,
      shadowMask * clamp(uGrassShadowCoolness, 0.0, 1.0)
    );
    color *= mix(
      vec3(1.0),
      warmHighlight,
      highlightMask * clamp(uGrassHighlightWarmth, 0.0, 1.0)
    );
    return clamp(color, 0.0, 1.0);
  }
`;

export function createGrassColorGradeUniforms(): GrassColorGradeUniforms {
  return {
    uGrassColorContrast: { value: 1 },
    uGrassColorSaturation: { value: 1 },
    uGrassHighlightWarmth: { value: 0 },
    uGrassSceneContrast: { value: 1 },
    uGrassSceneSaturation: { value: 1 },
    uGrassShadowCoolness: { value: 0 },
  };
}

export function applyGrassColorGradeSettings(
  uniforms: GrassColorGradeUniforms,
  settings: GrassColorGradeSettings,
  sceneGrade?: GrassSceneGradeSettings,
): void {
  uniforms.uGrassColorContrast!.value = settings.colorContrast;
  uniforms.uGrassColorSaturation!.value = settings.colorSaturation;
  uniforms.uGrassHighlightWarmth!.value = sceneGrade?.highlightWarmth ?? 0;
  uniforms.uGrassSceneContrast!.value = sceneGrade?.sceneContrast ?? 1;
  uniforms.uGrassSceneSaturation!.value = sceneGrade?.sceneSaturation ?? 1;
  uniforms.uGrassShadowCoolness!.value = sceneGrade?.shadowCoolness ?? 0;
}

export function extendGrassStandardMaterialWithColorGrade(
  material: THREE.MeshStandardMaterial,
  uniforms: GrassColorGradeUniforms,
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
        `#include <common>\n${grassColorGradeFragmentDeclarations}`,
      )
      .replace(
        "#include <normal_fragment_begin>",
        "diffuseColor.rgb = grassApplyMaterialColor(diffuseColor.rgb);\n#include <normal_fragment_begin>",
      )
      .replace(
        "#include <colorspace_fragment>",
        "gl_FragColor.rgb = grassApplySceneGrade(gl_FragColor.rgb);\n#include <colorspace_fragment>",
      );
  };
  material.customProgramCacheKey = () =>
    `${previousProgramCacheKey.call(material)}:grass-color-grade-v2:${cacheKey}`;
  material.needsUpdate = true;
}
