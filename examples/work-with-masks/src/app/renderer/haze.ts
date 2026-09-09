import * as THREE from "three";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

import type { HeroGradient, HeroGradientStop } from "../domain/sky";
import type { HeroParams } from "../domain/hero-params";
import type { HeroRenderFrame } from "./hero-pipeline";

const MAX_STOPS = 8;

type HazeUniforms = {
  tDiffuse: { value: THREE.Texture | null };
  uAngle: { value: number };
  uBlend: { value: number };
  uFullSize: { value: THREE.Vector2 };
  uGlowColor: { value: THREE.Color };
  uGlowPosition: { value: THREE.Vector2 };
  uGlowRadius: { value: number };
  uGlowStrength: { value: number };
  uPositions: { value: number[] };
  uStopCount: { value: number };
  uStops: { value: THREE.Vector4[] };
  uStrength: { value: number };
  uTileOffset: { value: THREE.Vector2 };
  uTileSize: { value: THREE.Vector2 };
  uType: { value: number };
};

const HAZE_VERTEX_SHADER = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

/*
 * Screen-space atmosphere: a CSS-convention gradient tint (linear angle 0 =
 * first stop at the bottom, 180 = first stop at the top) blended over the
 * tone-mapped frame, plus one soft radial sun glow. Tile uniforms map every
 * export tile back to full-frame coordinates so seams never appear.
 */
const HAZE_FRAGMENT_SHADER = `
uniform sampler2D tDiffuse;
uniform float uAngle;
uniform int uBlend;
uniform vec2 uFullSize;
uniform vec3 uGlowColor;
uniform vec2 uGlowPosition;
uniform float uGlowRadius;
uniform float uGlowStrength;
uniform float uPositions[${MAX_STOPS}];
uniform int uStopCount;
uniform vec4 uStops[${MAX_STOPS}];
uniform float uStrength;
uniform vec2 uTileOffset;
uniform vec2 uTileSize;
uniform int uType;
varying vec2 vUv;

vec4 sampleGradient(float t) {
  float value = clamp(t, 0.0, 1.0);
  vec4 color = uStops[0];
  if (value <= uPositions[0]) return color;
  for (int i = 1; i < ${MAX_STOPS}; i++) {
    if (i >= uStopCount) break;
    float span = max(0.0001, uPositions[i] - uPositions[i - 1]);
    float amount = clamp((value - uPositions[i - 1]) / span, 0.0, 1.0);
    color = mix(color, uStops[i], amount);
  }
  return color;
}

vec3 blendTint(vec3 base, vec3 tint) {
  if (uBlend == 1) return 1.0 - (1.0 - base) * (1.0 - tint);
  if (uBlend == 2) return base * tint;
  return tint;
}

void main() {
  vec4 base = texture2D(tDiffuse, vUv);
  // Full-frame pixel position with the origin at the bottom-left corner.
  vec2 fullPx = uTileOffset + vUv * uTileSize;
  vec2 p = fullPx - uFullSize * 0.5;
  float t;
  if (uType == 1) {
    t = length(p / (uFullSize * 0.5)) / sqrt(2.0);
  } else if (uType == 2) {
    t = fract(atan(p.x, p.y) / 6.28318530718 + uAngle / 6.28318530718);
  } else if (uType == 3) {
    t = (abs(p.x) / (uFullSize.x * 0.5) + abs(p.y) / (uFullSize.y * 0.5)) * 0.5;
  } else {
    vec2 direction = vec2(sin(uAngle), cos(uAngle));
    float lineLength = abs(direction.x) * uFullSize.x + abs(direction.y) * uFullSize.y;
    t = 0.5 + dot(p, direction) / max(1.0, lineLength);
  }
  vec4 tint = sampleGradient(t);
  vec3 color = mix(base.rgb, blendTint(base.rgb, tint.rgb), clamp(tint.a * uStrength, 0.0, 1.0));
  vec2 glowCenter = (uGlowPosition * 0.5 + 0.5) * uFullSize;
  float glowDistance = length(fullPx - glowCenter) / max(1.0, uGlowRadius * uFullSize.y);
  float glow = exp(-glowDistance * glowDistance * 3.0) * uGlowStrength;
  color = 1.0 - (1.0 - color) * (1.0 - uGlowColor * glow);
  gl_FragColor = vec4(color, base.a);
}`;

function stopPosition(stop: HeroGradientStop): number {
  const parsed = Number.parseFloat(stop.position);
  if (!Number.isFinite(parsed)) return 0;
  const normalized = stop.position.includes("%") ? parsed / 100 : parsed;
  return Math.min(1, Math.max(0, normalized));
}

function typeIndex(type: HeroGradient["gradientType"]): number {
  if (type === "radial") return 1;
  if (type === "angular") return 2;
  if (type === "diamond") return 3;
  return 0;
}

function blendIndex(blend: HeroParams["haze"]["blend"]): number {
  if (blend === "screen") return 1;
  if (blend === "multiply") return 2;
  return 0;
}

export function createHazePass(): ShaderPass {
  const uniforms: HazeUniforms = {
    tDiffuse: { value: null },
    uAngle: { value: 0 },
    uBlend: { value: 0 },
    uFullSize: { value: new THREE.Vector2(1, 1) },
    uGlowColor: { value: new THREE.Color(1, 1, 1) },
    uGlowPosition: { value: new THREE.Vector2(0, 0) },
    uGlowRadius: { value: 1 },
    uGlowStrength: { value: 0 },
    uPositions: { value: Array.from({ length: MAX_STOPS }, () => 0) },
    uStopCount: { value: 2 },
    uStops: {
      value: Array.from({ length: MAX_STOPS }, () => new THREE.Vector4(1, 1, 1, 0)),
    },
    uStrength: { value: 0 },
    uTileOffset: { value: new THREE.Vector2(0, 0) },
    uTileSize: { value: new THREE.Vector2(1, 1) },
    uType: { value: 0 },
  };
  return new ShaderPass(
    new THREE.ShaderMaterial({
      fragmentShader: HAZE_FRAGMENT_SHADER,
      uniforms,
      vertexShader: HAZE_VERTEX_SHADER,
    }),
  );
}

export function isHazeVisible(haze: HeroParams["haze"]): boolean {
  return (
    (haze.strength > 0 && haze.gradient.stops.some((stop) => stop.opacity > 0)) ||
    haze.glowStrength > 0
  );
}

export function applyHazeParams(
  pass: ShaderPass,
  params: HeroParams,
  frame: HeroRenderFrame,
): void {
  const uniforms = pass.material.uniforms as unknown as HazeUniforms;
  const { haze } = params;
  const stops = [...haze.gradient.stops]
    .sort((left, right) => stopPosition(left) - stopPosition(right))
    .slice(0, MAX_STOPS);
  const fallback = stops.at(-1) ?? { color: "#FFFFFF", opacity: 0, position: "100%" };
  uniforms.uAngle.value = THREE.MathUtils.degToRad(haze.gradient.angle);
  uniforms.uBlend.value = blendIndex(haze.blend);
  uniforms.uFullSize.value.set(frame.fullWidth, frame.fullHeight);
  uniforms.uGlowColor.value.set(haze.glowColor).convertLinearToSRGB();
  uniforms.uGlowPosition.value.set(haze.glowPosition.x, haze.glowPosition.y);
  uniforms.uGlowRadius.value = haze.glowRadius;
  uniforms.uGlowStrength.value = haze.glowStrength;
  uniforms.uStopCount.value = Math.max(2, stops.length);
  uniforms.uStrength.value = haze.strength;
  uniforms.uType.value = typeIndex(haze.gradient.gradientType);
  // Tiles are addressed from the top-left in the export frame; the shader
  // works with a bottom-left origin, so flip the tile row here.
  uniforms.uTileOffset.value.set(frame.tileX, frame.fullHeight - frame.tileY - frame.height);
  uniforms.uTileSize.value.set(frame.width, frame.height);
  for (let index = 0; index < MAX_STOPS; index += 1) {
    const stop = stops[index] ?? fallback;
    // The frame is already display-encoded here, so blend with the authored
    // hex components rather than their linear working-space conversion.
    const color = new THREE.Color(stop.color).convertLinearToSRGB();
    uniforms.uStops.value[index].set(
      color.r,
      color.g,
      color.b,
      Math.min(1, Math.max(0, stop.opacity / 100)),
    );
    uniforms.uPositions.value[index] = stopPosition(stop);
  }
  pass.enabled = isHazeVisible(haze);
}
