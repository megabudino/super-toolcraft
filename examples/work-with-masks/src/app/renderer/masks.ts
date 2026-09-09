import * as THREE from "three";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

import type { HeroParams } from "../domain/hero-params";
import type { HeroRenderFrame } from "./hero-pipeline";
import { toArtboardMask } from "./mask-geometry";

const MAX_MASKS = 16;

type MaskUniforms = {
  tDiffuse: { value: THREE.Texture | null };
  uBackground: { value: THREE.Color };
  uBackgroundIncluded: { value: boolean };
  uFullSize: { value: THREE.Vector2 };
  uMaskCenter: { value: THREE.Vector2[] };
  uMaskCount: { value: number };
  uMaskFeather: { value: number[] };
  uMaskOpacity: { value: number[] };
  uMaskRadii: { value: THREE.Vector2[] };
  uMaskRotation: { value: THREE.Vector2[] };
  uMode: { value: number };
  uTileOffset: { value: THREE.Vector2 };
  uTileSize: { value: THREE.Vector2 };
};

const MASK_VERTEX_SHADER = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const MASK_FRAGMENT_SHADER = `
#define MAX_MASKS ${MAX_MASKS}
uniform sampler2D tDiffuse;
uniform int uMode;
uniform int uMaskCount;
uniform vec2 uMaskCenter[MAX_MASKS];
uniform vec2 uMaskRadii[MAX_MASKS];
uniform vec2 uMaskRotation[MAX_MASKS];
uniform float uMaskFeather[MAX_MASKS];
uniform float uMaskOpacity[MAX_MASKS];
uniform vec3 uBackground;
uniform bool uBackgroundIncluded;
uniform vec2 uFullSize;
uniform vec2 uTileOffset;
uniform vec2 uTileSize;
varying vec2 vUv;

float maskDistance(int i, vec2 q) {
  vec2 v = q - uMaskCenter[i];
  vec2 r = uMaskRotation[i];
  vec2 p = vec2(r.x * v.x + r.y * v.y, -r.y * v.x + r.x * v.y);
  vec2 e = uMaskRadii[i];
  float g = length(p / e);
  if (g < 1e-4) return -min(e.x, e.y);
  return (g - 1.0) * g / max(length(p / (e * e)), 1e-6);
}

void main() {
  vec4 src = texture2D(tDiffuse, vUv);
  vec2 q = (vUv * uTileSize + uTileOffset) / uFullSize.y;
  float px = 1.0 / uFullSize.y;
  float keep = 1.0;
  float tint = 1.0;
  float rim = 0.0;
  for (int i = 0; i < MAX_MASKS; i++) {
    if (i >= uMaskCount) break;
    float d = maskDistance(i, q);
    float shape = 1.0 - smoothstep(-uMaskFeather[i], uMaskFeather[i], d);
    float c = shape * uMaskOpacity[i];
    keep *= 1.0 - c;
    tint *= 1.0 - 0.45 * c;
    rim = max(
      rim,
      (1.0 - smoothstep(0.0, 1.5 * px, abs(d))) * max(uMaskOpacity[i], 0.18)
    );
  }
  float cov = uMaskCount == 0 ? 1.0 : 1.0 - keep;
  if (uMode == 1) {
    gl_FragColor = uBackgroundIncluded
      ? vec4(mix(uBackground, src.rgb, cov), 1.0)
      : vec4(src.rgb * cov, src.a * cov);
  } else if (uMode == 2) {
    float a = max(1.0 - tint, 0.9 * rim);
    vec3 layer = mix(vec3(0.94, 0.27, 0.27), vec3(1.0, 0.55, 0.55), rim);
    gl_FragColor = vec4(
      src.rgb * (1.0 - a) + layer * a,
      src.a * (1.0 - a) + a
    );
  } else {
    gl_FragColor = src;
  }
}`;

function makeVectorArray(): THREE.Vector2[] {
  return Array.from({ length: MAX_MASKS }, () => new THREE.Vector2());
}

export function createMaskPass(): ShaderPass {
  const uniforms: MaskUniforms = {
    tDiffuse: { value: null },
    uBackground: { value: new THREE.Color(0, 0, 0) },
    uBackgroundIncluded: { value: true },
    uFullSize: { value: new THREE.Vector2(1, 1) },
    uMaskCenter: { value: makeVectorArray() },
    uMaskCount: { value: 0 },
    uMaskFeather: { value: Array.from({ length: MAX_MASKS }, () => 0) },
    uMaskOpacity: { value: Array.from({ length: MAX_MASKS }, () => 1) },
    uMaskRadii: { value: makeVectorArray() },
    uMaskRotation: { value: makeVectorArray() },
    uMode: { value: 0 },
    uTileOffset: { value: new THREE.Vector2(0, 0) },
    uTileSize: { value: new THREE.Vector2(1, 1) },
  };
  return new ShaderPass(
    new THREE.ShaderMaterial({
      depthTest: false,
      depthWrite: false,
      fragmentShader: MASK_FRAGMENT_SHADER,
      uniforms,
      vertexShader: MASK_VERTEX_SHADER,
    }),
  );
}

export function isMaskPassActive(params: HeroParams): boolean {
  return params.masks.mode !== "off";
}

export function applyMaskParams(
  pass: ShaderPass,
  params: HeroParams,
  frame: HeroRenderFrame,
): void {
  const uniforms = pass.material.uniforms as unknown as MaskUniforms;
  const aspect = frame.fullWidth / frame.fullHeight;
  const masks = params.masks.items
    .filter((mask) => mask.enabled)
    .slice(0, MAX_MASKS)
    .map((mask) => toArtboardMask(mask, aspect, frame.fullHeight));

  uniforms.uBackground.value.set(params.background.color).convertLinearToSRGB();
  uniforms.uBackgroundIncluded.value = params.background.include;
  uniforms.uFullSize.value.set(frame.fullWidth, frame.fullHeight);
  uniforms.uMaskCount.value = masks.length;
  uniforms.uMode.value = params.masks.mode === "preview" ? 2 : 1;
  uniforms.uTileOffset.value.set(frame.tileX, frame.fullHeight - frame.tileY - frame.height);
  uniforms.uTileSize.value.set(frame.width, frame.height);

  for (let index = 0; index < MAX_MASKS; index += 1) {
    const mask = masks[index];
    if (!mask) continue;
    uniforms.uMaskCenter.value[index].set(mask.center.x, mask.center.y);
    uniforms.uMaskRadii.value[index].set(mask.rx, mask.ry);
    uniforms.uMaskRotation.value[index].set(mask.cos, mask.sin);
    uniforms.uMaskFeather.value[index] = mask.feather;
    uniforms.uMaskOpacity.value[index] = mask.opacity;
  }

  pass.enabled = isMaskPassActive(params);
}
