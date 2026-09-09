import * as THREE from "three";

import type { GrassSettings } from "./grass-values";

export type GrassGroundShadowDiagnostics = Readonly<{
  blur: number;
  color: string;
  offsetY: number;
  offsetZ: number;
  scale: number;
  strength: number;
  visible: boolean;
}>;

const vertexShader = /* glsl */ `
  varying vec2 vGrassGroundShadowUv;

  void main() {
    vGrassGroundShadowUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec2 vGrassGroundShadowUv;
  uniform float uGrassGroundShadowBlur;
  uniform vec3 uGrassGroundShadowColor;
  uniform vec2 uGrassGroundShadowExtent;
  uniform vec2 uGrassGroundShadowHalfSize;
  uniform float uGrassGroundShadowIrregularity;
  uniform float uGrassGroundShadowRoundness;
  uniform float uGrassGroundShadowSeed;
  uniform float uGrassGroundShadowStrength;

  void main() {
    vec2 grassGroundShadowPosition =
      (vGrassGroundShadowUv - 0.5) *
      2.0 *
      uGrassGroundShadowExtent;
    vec2 grassGroundShadowNormalizedPosition =
      grassGroundShadowPosition / max(
        uGrassGroundShadowHalfSize,
        vec2(0.001)
      );
    float grassGroundShadowExponent = 2.0 +
      (1.0 - clamp(uGrassGroundShadowRoundness, 0.0, 1.0)) * 10.0;
    float grassGroundShadowAngle = atan(
      grassGroundShadowNormalizedPosition.y,
      grassGroundShadowNormalizedPosition.x
    );
    float grassGroundShadowPhase = uGrassGroundShadowSeed * 0.173;
    float grassGroundShadowWave =
      sin(grassGroundShadowAngle * 3.0 + grassGroundShadowPhase) * 0.67 +
      sin(
        grassGroundShadowAngle * 7.0 - grassGroundShadowPhase * 1.7
      ) * 0.33;
    float grassGroundShadowScale = 1.0 -
      uGrassGroundShadowIrregularity * 0.5 +
      grassGroundShadowWave * uGrassGroundShadowIrregularity * 0.5;
    float grassGroundShadowDistance = pow(
      pow(
        abs(grassGroundShadowNormalizedPosition.x),
        grassGroundShadowExponent
      ) +
        pow(
          abs(grassGroundShadowNormalizedPosition.y),
          grassGroundShadowExponent
        ),
      1.0 / grassGroundShadowExponent
    ) / max(0.001, grassGroundShadowScale);
    float grassGroundShadowBlurDistance =
      uGrassGroundShadowBlur /
      max(
        0.001,
        min(
          uGrassGroundShadowHalfSize.x,
          uGrassGroundShadowHalfSize.y
        )
      );
    float grassGroundShadowAntialias = max(
      fwidth(grassGroundShadowDistance),
      0.001
    );
    float grassGroundShadowCoverage = 1.0 - smoothstep(
      1.0 - grassGroundShadowAntialias,
      1.0 + max(grassGroundShadowBlurDistance, grassGroundShadowAntialias),
      grassGroundShadowDistance
    );
    float grassGroundShadowAlpha =
      grassGroundShadowCoverage * uGrassGroundShadowStrength;
    if (grassGroundShadowAlpha <= 0.001) discard;
    gl_FragColor = vec4(
      uGrassGroundShadowColor,
      grassGroundShadowAlpha
    );
    #include <colorspace_fragment>
  }
`;

export class GrassGroundShadowResource {
  private readonly geometry = new THREE.PlaneGeometry(1, 1);
  private readonly uniforms = {
    uGrassGroundShadowBlur: { value: 0.65 },
    uGrassGroundShadowColor: { value: new THREE.Color(0x000000) },
    uGrassGroundShadowExtent: { value: new THREE.Vector2(4.41, 3.15) },
    uGrassGroundShadowHalfSize: { value: new THREE.Vector2(3.5, 2.5) },
    uGrassGroundShadowIrregularity: { value: 0.07 },
    uGrassGroundShadowRoundness: { value: 1 },
    uGrassGroundShadowSeed: { value: 4 },
    uGrassGroundShadowStrength: { value: 0.55 },
  };
  private readonly material = new THREE.ShaderMaterial({
    depthTest: true,
    depthWrite: false,
    fragmentShader,
    transparent: true,
    uniforms: this.uniforms,
    vertexShader,
  });
  private readonly mesh = new THREE.Mesh(this.geometry, this.material);
  private diagnostics: GrassGroundShadowDiagnostics = {
    blur: 0.65,
    color: "#000000",
    offsetY: -0.18,
    offsetZ: 0.25,
    scale: 1,
    strength: 0.55,
    visible: true,
  };

  constructor(private readonly parent: THREE.Object3D) {
    this.material.name = "Grass Ground Shadow";
    this.material.toneMapped = false;
    this.mesh.name = "Grass Ground Shadow";
    this.mesh.castShadow = false;
    this.mesh.receiveShadow = false;
    this.mesh.renderOrder = -100;
    this.mesh.rotation.x = -Math.PI / 2;
    this.parent.add(this.mesh);
  }

  update(settings: GrassSettings): void {
    const { blur, color, offsetY, offsetZ, scale, strength } = settings.groundShadow;
    const halfWidth = settings.field.width * scale * 0.5;
    const halfDepth = settings.field.depth * scale * 0.5;
    const minimumHalfSize = Math.max(0.001, Math.min(halfWidth, halfDepth));
    const normalizedBlur = blur / minimumHalfSize;
    const extentWidth = halfWidth * (1 + normalizedBlur);
    const extentDepth = halfDepth * (1 + normalizedBlur);
    this.uniforms.uGrassGroundShadowBlur.value = blur;
    this.uniforms.uGrassGroundShadowColor.value.set(color);
    this.uniforms.uGrassGroundShadowExtent.value.set(
      extentWidth,
      extentDepth,
    );
    this.uniforms.uGrassGroundShadowHalfSize.value.set(halfWidth, halfDepth);
    this.uniforms.uGrassGroundShadowIrregularity.value =
      settings.field.edgeIrregularity;
    this.uniforms.uGrassGroundShadowRoundness.value =
      settings.field.shapeRoundness;
    this.uniforms.uGrassGroundShadowSeed.value = settings.terrain.seed;
    this.uniforms.uGrassGroundShadowStrength.value = strength;
    this.mesh.position.set(0, offsetY, offsetZ);
    this.mesh.scale.set(
      extentWidth * 2,
      extentDepth * 2,
      1,
    );
    this.mesh.visible = settings.field.showGround && strength > 0.001;
    this.diagnostics = {
      blur,
      color: `#${new THREE.Color(color).getHexString().toUpperCase()}`,
      offsetY,
      offsetZ,
      scale,
      strength,
      visible: this.mesh.visible,
    };
  }

  getDiagnostics(): GrassGroundShadowDiagnostics {
    return this.diagnostics;
  }

  dispose(): void {
    this.parent.remove(this.mesh);
    this.geometry.dispose();
    this.material.dispose();
  }
}
