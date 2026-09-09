import * as THREE from "three";

export type GrassWindUniformSettings = Readonly<{
  activation: number;
  ambientStrength: number;
  direction: readonly [number, number];
  flow: number;
  gustCycles: number;
  gustWidth: number;
  noiseDetail: number;
  noiseScale: number;
  noiseStrength: number;
  progress: number;
  response: number;
  seed: number;
  strength: number;
  swayCycles: number;
  swayVariation: number;
}>;

export type GrassWindUniforms = Record<string, THREE.IUniform>;

export const grassWindVertexModel = /* glsl */ `
  uniform float uAmbientStrength;
  uniform float uFlow;
  uniform float uGustCycles;
  uniform float uGustWidth;
  uniform float uNoiseDetail;
  uniform float uNoiseScale;
  uniform float uNoiseStrength;
  uniform float uProgress;
  uniform float uStrength;
  uniform float uSwayCycles;
  uniform float uSwayVariation;
  uniform float uWindActivation;
  uniform vec2 uWindDirection;
  uniform float uWindResponse;
  uniform float uWindSeed;

  float grassWindHash(vec2 point) {
    vec3 value = fract(vec3(point.xyx) * 0.1031);
    value += dot(value, value.yzx + 33.33);
    return fract((value.x + value.y) * value.z);
  }

  vec2 grassTotalWindForce(
    vec3 root,
    float phaseValue,
    float bladeResponse,
    float bladeHeight
  ) {
    float activeWindStrength =
      abs(uAmbientStrength) +
      abs(uStrength) * clamp(uWindActivation, 0.0, 1.0);
    if (activeWindStrength <= 0.000001) {
      return vec2(0.0);
    }
    float cycle = uProgress * 6.28318530718;
    float heightValue = clamp(bladeHeight, 0.0, 1.0);
    float instanceValue = grassWindHash(
      root.xz * 0.173 + vec2(phaseValue * 0.071, uWindSeed * 0.113)
    );
    float seededPhase =
      phaseValue * 0.31 + instanceValue * 6.28318530718 + uWindSeed * 0.071;
    vec2 crossDirection = vec2(-uWindDirection.y, uWindDirection.x);
    float alongCoordinate = dot(root.xz, uWindDirection) * uNoiseScale;
    float crossCoordinate = dot(root.xz, crossDirection) * uNoiseScale;
    float responseValue = max(0.08, uWindResponse * bladeResponse);
    float tipDelay = heightValue * mix(
      0.18,
      0.52,
      clamp(1.0 / responseValue, 0.0, 1.0)
    );

    // Ambient sway is a low-energy, root-anchored oscillation. Spatial phase
    // variation prevents a rigid sheet while integer harmonics preserve the
    // exact first/last timeline seam.
    float swayVariation = clamp(uSwayVariation, 0.0, 1.0);
    float ambientPhase =
      cycle * uSwayCycles +
      alongCoordinate * 0.11 +
      crossCoordinate * 0.07 +
      seededPhase * mix(0.06, 0.62, swayVariation) -
      tipDelay * 0.72;
    float ambientPrimary = sin(ambientPhase);
    float ambientSecondary = sin(
      cycle * uSwayCycles * 2.0 -
      alongCoordinate * 0.19 +
      crossCoordinate * 0.23 +
      seededPhase * 0.83 -
      tipDelay * 1.41
    );
    float ambientCross = sin(
      cycle * uSwayCycles * 3.0 +
      alongCoordinate * 0.13 +
      crossCoordinate * 0.31 -
      seededPhase * 0.47
    );
    float ambientAlongForce =
      ambientPrimary * (0.72 + swayVariation * 0.18) +
      ambientSecondary * swayVariation * 0.22;
    float ambientCrossForce =
      ambientCross * (0.08 + swayVariation * 0.18);
    vec2 ambientForce =
      (uWindDirection * ambientAlongForce +
      crossDirection * ambientCrossForce) *
      uAmbientStrength * responseValue;

    // The gust is a travelling pressure front followed by elastic rebound.
    // Width shapes the front without adding branches or samples.
    float gustPhase =
      alongCoordinate * 0.43 -
      cycle * uGustCycles -
      tipDelay +
      seededPhase * 0.17;
    float secondaryPhase =
      alongCoordinate * 0.91 +
      crossCoordinate * 0.37 -
      cycle * uGustCycles * 2.0 +
      seededPhase * 0.41 -
      tipDelay * 1.7;
    float secondarySway = sin(secondaryPhase);
    float fineTurbulence =
      sin(
        alongCoordinate * 1.73 - crossCoordinate * 1.31 -
        cycle * uGustCycles * 3.0 + seededPhase
      ) * 0.67 +
      sin(
        alongCoordinate * 3.11 + crossCoordinate * 2.17 -
        cycle * uGustCycles * 5.0 - seededPhase * 0.73
      ) * 0.33;
    float crossTurbulence =
      sin(
        alongCoordinate * 1.21 + crossCoordinate * 1.83 -
        cycle * uGustCycles * 2.0 + seededPhase * 1.37 + tipDelay
      ) * 0.72 +
      sin(
        alongCoordinate * 2.63 - crossCoordinate * 2.41 -
        cycle * uGustCycles * 4.0 - seededPhase * 0.53
      ) * 0.28;
    float gustExponent = mix(7.0, 1.35, clamp(uGustWidth, 0.0, 1.0));
    float gustCarrier = sin(gustPhase - 0.35);
    float gustFront = pow(max(0.0, gustCarrier), gustExponent);
    float gustRebound = pow(max(0.0, -sin(gustPhase + 0.78)), 2.0);
    float variation = clamp(uNoiseStrength, 0.0, 1.0);
    float detail = clamp(uNoiseDetail, 0.0, 1.0);
    float flowBias = clamp(uFlow, 0.0, 1.0);
    float gustAlong =
      mix(0.02, 0.28, flowBias) +
      gustFront * mix(0.74, 1.18, variation) -
      gustRebound * mix(0.14, 0.32, variation) +
      secondarySway * 0.12 * variation +
      fineTurbulence * 0.13 * detail;
    float gustCross =
      crossTurbulence * (0.06 + variation * 0.16) *
      (0.45 + detail * 0.55);
    vec2 gustForce =
      (uWindDirection * gustAlong + crossDirection * gustCross) *
      uStrength * responseValue * clamp(uWindActivation, 0.0, 1.0);

    vec2 force = ambientForce + gustForce;
    float magnitude = length(force);
    return magnitude > 1.25 ? force * (1.25 / magnitude) : force;
  }
`;

export function createGrassWindUniforms(): GrassWindUniforms {
  return {
    uAmbientStrength: { value: 0.16 },
    uFlow: { value: 0.38 },
    uGustCycles: { value: 2 },
    uGustWidth: { value: 0.52 },
    uNoiseDetail: { value: 0.58 },
    uNoiseScale: { value: 1.7 },
    uNoiseStrength: { value: 0.62 },
    uProgress: { value: 0 },
    uStrength: { value: 0.72 },
    uSwayCycles: { value: 1 },
    uSwayVariation: { value: 0.48 },
    uWindActivation: { value: 0 },
    uWindDirection: { value: new THREE.Vector2(1, 0) },
    uWindResponse: { value: 1 },
    uWindSeed: { value: 17 },
  };
}

export function applyGrassWindUniformSettings(
  uniforms: GrassWindUniforms,
  settings: GrassWindUniformSettings,
): void {
  uniforms.uAmbientStrength!.value = settings.ambientStrength;
  uniforms.uFlow!.value = settings.flow;
  uniforms.uGustCycles!.value = settings.gustCycles;
  uniforms.uGustWidth!.value = settings.gustWidth;
  uniforms.uNoiseDetail!.value = settings.noiseDetail;
  uniforms.uNoiseScale!.value = settings.noiseScale;
  uniforms.uNoiseStrength!.value = settings.noiseStrength;
  uniforms.uProgress!.value = settings.progress;
  uniforms.uStrength!.value = settings.strength;
  uniforms.uSwayCycles!.value = settings.swayCycles;
  uniforms.uSwayVariation!.value = settings.swayVariation;
  uniforms.uWindActivation!.value = settings.activation;
  (uniforms.uWindDirection!.value as THREE.Vector2).set(
    settings.direction[0],
    settings.direction[1],
  );
  uniforms.uWindResponse!.value = settings.response;
  uniforms.uWindSeed!.value = settings.seed;
}
