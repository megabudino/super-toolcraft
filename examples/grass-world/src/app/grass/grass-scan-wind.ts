import * as THREE from "three";

import {
  grassWindVertexModel,
  type GrassWindUniforms,
} from "./grass-wind-material";

const scanWindVertexHeader = /* glsl */ `
  ${grassWindVertexModel}

  vec3 grassScanLocalWindDirection(vec2 force) {
    vec3 worldForce = normalize(vec3(force.x, 0.0, force.y));
    vec3 instanceX = normalize(instanceMatrix[0].xyz);
    vec3 instanceY = normalize(instanceMatrix[1].xyz);
    vec3 instanceZ = normalize(instanceMatrix[2].xyz);
    vec3 localForce = vec3(
      dot(worldForce, instanceX),
      dot(worldForce, instanceY),
      dot(worldForce, instanceZ)
    );
    vec2 localHorizontal = localForce.xz;
    float localLength = length(localHorizontal);
    return localLength > 0.0001
      ? vec3(localHorizontal.x / localLength, 0.0, localHorizontal.y / localLength)
      : vec3(1.0, 0.0, 0.0);
  }

  vec2 grassScanWindForce(float heightValue) {
    vec3 root = vec3(
      instanceMatrix[3].x,
      instanceMatrix[3].y,
      instanceMatrix[3].z
    );
    float phaseValue = dot(root.xz, vec2(17.13, 31.71));
    return grassTotalWindForce(root, phaseValue, 1.0, heightValue);
  }
`;

const scanWindNormalVertex = /* glsl */ `
  vec3 objectNormal = vec3(normal);
  #ifdef USE_INSTANCING
    float grassScanNormalHeight = clamp(uv.y, 0.0, 1.0);
    vec2 grassScanSharedForce = grassScanWindForce(grassScanNormalHeight);
    vec2 grassScanNormalForce = grassScanSharedForce;
    float grassScanNormalMagnitude = length(grassScanNormalForce);
    if (grassScanNormalMagnitude > 0.0001) {
      vec3 grassScanNormalDirection = grassScanLocalWindDirection(
        grassScanNormalForce
      );
      float grassScanNormalBend = pow(grassScanNormalHeight, 1.25);
      float grassScanNormalAngle =
        grassScanNormalMagnitude * grassScanNormalBend * 0.48;
      vec3 grassScanNormalAxis = normalize(cross(
        grassScanNormalDirection,
        vec3(0.0, 1.0, 0.0)
      ));
      float grassScanNormalCosine = cos(grassScanNormalAngle);
      float grassScanNormalSine = sin(grassScanNormalAngle);
      objectNormal =
        objectNormal * grassScanNormalCosine +
        cross(grassScanNormalAxis, objectNormal) * grassScanNormalSine +
        grassScanNormalAxis * dot(grassScanNormalAxis, objectNormal) *
          (1.0 - grassScanNormalCosine);
    }
  #endif
`;

const scanWindBeginVertex = /* glsl */ `
  vec3 transformed = vec3(position);
  #ifdef USE_INSTANCING
    float grassScanHeight = clamp(uv.y, 0.0, 1.0);
    #ifdef GRASS_SCAN_SHARED_WIND_FORCE
      vec2 grassScanForce = grassScanSharedForce;
    #else
      vec2 grassScanForce = grassScanWindForce(grassScanHeight);
    #endif
    float grassScanMagnitude = length(grassScanForce);
    if (grassScanMagnitude > 0.0001) {
      float grassScanBendShape =
        pow(grassScanHeight, 1.55) * (0.22 + abs(position.y) * 0.46);
      vec3 grassScanDirection = grassScanLocalWindDirection(grassScanForce);
      transformed +=
        grassScanDirection * grassScanMagnitude * grassScanBendShape * 0.72;
      transformed.y -=
        grassScanMagnitude * grassScanMagnitude * grassScanHeight *
        abs(position.y) * 0.08;
    }
  #endif
`;

function extendVertexWind(
  material: THREE.Material,
  uniforms: GrassWindUniforms,
  cacheKey: string,
  includeNormals: boolean,
): void {
  if (includeNormals) {
    material.defines = {
      ...material.defines,
      GRASS_SCAN_SHARED_WIND_FORCE: "1",
    };
  }
  const previousOnBeforeCompile = material.onBeforeCompile;
  const previousProgramCacheKey = material.customProgramCacheKey;
  material.onBeforeCompile = (shader, renderer) => {
    previousOnBeforeCompile.call(material, shader, renderer);
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>\n${scanWindVertexHeader}`,
      )
      .replace("#include <begin_vertex>", scanWindBeginVertex);
    if (includeNormals) {
      shader.vertexShader = shader.vertexShader.replace(
        "#include <beginnormal_vertex>",
        scanWindNormalVertex,
      );
    }
  };
  material.customProgramCacheKey = () =>
    `${previousProgramCacheKey.call(material)}:grass-scan-wind-v4:${cacheKey}`;
  material.needsUpdate = true;
}

export function extendGrassScanFoliageMaterialWithWind(
  material: THREE.MeshPhysicalMaterial,
  uniforms: GrassWindUniforms,
  cacheKey: string,
): void {
  extendVertexWind(material, uniforms, cacheKey, true);
}

export function createGrassScanFoliageDepthMaterial(
  alphaMap: THREE.Texture | null,
  uniforms: GrassWindUniforms,
  cacheKey: string,
): THREE.MeshDepthMaterial {
  const material = new THREE.MeshDepthMaterial({
    alphaMap,
    alphaTest: 0.44,
    depthPacking: THREE.RGBADepthPacking,
    side: THREE.DoubleSide,
  });
  extendVertexWind(material, uniforms, `${cacheKey}:depth`, false);
  return material;
}
