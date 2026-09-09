import * as THREE from "three";

import type { HeroGradient, HeroGradientStop } from "../domain/sky";

const MAX_GRADIENT_STOPS = 8;

type SkyUniforms = {
  uAngle: { value: number };
  uForceOpaque: { value: number };
  uPositions: { value: number[] };
  uStopCount: { value: number };
  uStops: { value: THREE.Vector4[] };
  uType: { value: number };
};

const SKY_VERTEX_SHADER = `
varying vec3 vWorldPosition;
void main() {
  vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const SKY_FRAGMENT_SHADER = `
uniform float uAngle;
uniform float uForceOpaque;
uniform int uStopCount;
uniform int uType;
uniform float uPositions[${MAX_GRADIENT_STOPS}];
uniform vec4 uStops[${MAX_GRADIENT_STOPS}];
varying vec3 vWorldPosition;

vec4 sampleGradient(float t) {
  float value = clamp(t, 0.0, 1.0);
  vec4 color = uStops[0];
  for (int i = 1; i < ${MAX_GRADIENT_STOPS}; i++) {
    if (i >= uStopCount) break;
    float span = max(0.0001, uPositions[i] - uPositions[i - 1]);
    float amount = smoothstep(0.0, 1.0, (value - uPositions[i - 1]) / span);
    color = mix(color, uStops[i], amount);
  }
  return color;
}

void main() {
  vec3 direction = normalize(vWorldPosition);
  vec3 axis = normalize(vec3(sin(uAngle), cos(uAngle), 0.0));
  float t;
  if (uType == 1) {
    t = acos(clamp(dot(direction, axis), -1.0, 1.0)) / 3.14159265359;
  } else if (uType == 2) {
    t = fract(atan(direction.z, direction.x) / 6.28318530718 + 0.5 + uAngle / 6.28318530718);
  } else if (uType == 3) {
    vec2 rotated = mat2(cos(uAngle), -sin(uAngle), sin(uAngle), cos(uAngle)) * direction.xy;
    t = clamp(abs(rotated.x) + (1.0 - rotated.y) * 0.5, 0.0, 1.0);
  } else {
    t = 0.5 - dot(direction, axis) * 0.5;
  }
  vec4 color = sampleGradient(t);
  gl_FragColor = vec4(color.rgb, mix(color.a, 1.0, uForceOpaque));
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

function createUniforms(): SkyUniforms {
  return {
    uAngle: { value: 0 },
    uForceOpaque: { value: 0 },
    uPositions: { value: Array.from({ length: MAX_GRADIENT_STOPS }, () => 0) },
    uStopCount: { value: 2 },
    uStops: {
      value: Array.from({ length: MAX_GRADIENT_STOPS }, () => new THREE.Vector4(1, 1, 1, 1)),
    },
    uType: { value: 0 },
  };
}

function updateMaterial(
  material: THREE.ShaderMaterial,
  gradient: HeroGradient,
  forceOpaque: boolean,
): void {
  const uniforms = material.uniforms as SkyUniforms;
  const stops = [...gradient.stops]
    .sort((left, right) => stopPosition(left) - stopPosition(right))
    .slice(0, MAX_GRADIENT_STOPS);
  const fallback = stops.at(-1) ?? {
    color: "#FFFFFF",
    opacity: 100,
    position: "100%",
  };
  uniforms.uAngle.value = THREE.MathUtils.degToRad(gradient.angle);
  uniforms.uForceOpaque.value = forceOpaque ? 1 : 0;
  uniforms.uStopCount.value = Math.max(2, stops.length);
  uniforms.uType.value = typeIndex(gradient.gradientType);
  for (let index = 0; index < MAX_GRADIENT_STOPS; index += 1) {
    const stop = stops[index] ?? fallback;
    const color = new THREE.Color(stop.color);
    uniforms.uStops.value[index].set(
      color.r,
      color.g,
      color.b,
      Math.min(1, Math.max(0, stop.opacity / 100)),
    );
    uniforms.uPositions.value[index] = stopPosition(stop);
  }
}

export function createSkyMesh(
  gradient: HeroGradient,
  forceOpaque = false,
): THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial> {
  const material = new THREE.ShaderMaterial({
    depthWrite: false,
    fragmentShader: SKY_FRAGMENT_SHADER,
    side: THREE.BackSide,
    transparent: !forceOpaque,
    uniforms: createUniforms(),
    vertexShader: SKY_VERTEX_SHADER,
  });
  updateMaterial(material, gradient, forceOpaque);
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(500, 32, 16), material);
  mesh.frustumCulled = false;
  return mesh;
}

export function updateSkyMesh(
  mesh: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>,
  gradient: HeroGradient,
): void {
  updateMaterial(mesh.material, gradient, false);
}

export type HeroEnvironment = Readonly<{
  dispose(): void;
  texture: THREE.Texture;
}>;

export function makeEnvironment(
  renderer: THREE.WebGLRenderer,
  gradient: HeroGradient,
): HeroEnvironment {
  const environmentScene = new THREE.Scene();
  const environmentSky = createSkyMesh(gradient, true);
  environmentScene.add(environmentSky);
  const generator = new THREE.PMREMGenerator(renderer);
  const target = generator.fromScene(environmentScene, 0.04, 0.1, 1000, {
    size: 64,
  });
  generator.dispose();
  environmentSky.geometry.dispose();
  environmentSky.material.dispose();
  return {
    dispose() {
      target.dispose();
    },
    texture: target.texture,
  };
}
