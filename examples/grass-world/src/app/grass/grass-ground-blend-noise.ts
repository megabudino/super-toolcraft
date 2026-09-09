export const grassGroundBlendNoiseGlsl = /* glsl */ `
  float grassCloverHash(vec2 point, float seed) {
    return fract(
      sin(dot(point, vec2(127.1, 311.7)) + seed * 74.7) *
      43758.5453123
    );
  }

  float grassCloverValueNoise(vec2 point, float seed) {
    vec2 cell = floor(point);
    vec2 local = fract(point);
    vec2 blend = local * local * (3.0 - 2.0 * local);
    float lower = mix(
      grassCloverHash(cell, seed),
      grassCloverHash(cell + vec2(1.0, 0.0), seed),
      blend.x
    );
    float upper = mix(
      grassCloverHash(cell + vec2(0.0, 1.0), seed),
      grassCloverHash(cell + vec2(1.0, 1.0), seed),
      blend.x
    );
    return mix(lower, upper, blend.y);
  }

  float grassCloverFbm(
    vec2 point,
    float seed,
    float roughness,
    int detail
  ) {
    float amplitude = 1.0;
    float frequency = 1.0;
    float normalization = 0.0;
    float value = 0.0;
    for (int octave = 0; octave < 6; octave++) {
      if (octave >= detail) break;
      vec2 octaveOffset = vec2(
        float(octave) * 13.37,
        -float(octave) * 7.91
      );
      value += grassCloverValueNoise(
        point * frequency + octaveOffset,
        seed + float(octave) * 19.0
      ) * amplitude;
      normalization += amplitude;
      amplitude *= roughness;
      frequency *= 2.0;
    }
    return clamp(value / max(0.0001, normalization), 0.0, 1.0);
  }

  float grassCloverEvaluateMask(
    vec2 worldPosition,
    vec2 offset,
    float scale,
    float seed,
    float roughness,
    int detail,
    vec2 levels
  ) {
    if (levels.y <= 0.001) return 0.0;
    if (levels.x >= 0.999) return 1.0;
    float noiseValue = grassCloverFbm(
      (worldPosition + offset) * max(0.001, scale),
      seed,
      roughness,
      detail
    );
    return smoothstep(
      levels.x,
      max(levels.x + 0.0001, levels.y),
      noiseValue
    );
  }
`;
