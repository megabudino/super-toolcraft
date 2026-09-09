export type GrassWorldMacroPattern = Readonly<{
  id: string;
  influence: number;
  outsideCoverage: number;
}>;

type GrassWorldPatternPoint = Readonly<{
  radiusX: number;
  radiusZ: number;
  x: number;
  z: number;
}>;

type GrassWorldPatternProfile = Readonly<{
  cosine: number;
  offsetX: number;
  offsetZ: number;
  pattern: GrassWorldMacroPattern;
  patternIndex: number;
  phase: number;
  points: readonly GrassWorldPatternPoint[];
  scaleX: number;
  scaleZ: number;
  sine: number;
}>;

export const grassWorldMacroPatterns = [
  { id: "broad-cover", influence: 0.52, outsideCoverage: 0.62 },
  { id: "central-island", influence: 1, outsideCoverage: 0 },
  { id: "central-clearing", influence: 0.96, outsideCoverage: 0.01 },
  { id: "paired-lobes", influence: 1, outsideCoverage: 0 },
  { id: "opposing-corners", influence: 1, outsideCoverage: 0 },
  { id: "diagonal-chain", influence: 1, outsideCoverage: 0 },
  { id: "cross-chain", influence: 0.98, outsideCoverage: 0.01 },
  { id: "ring", influence: 1, outsideCoverage: 0 },
  { id: "broken-ring", influence: 1, outsideCoverage: 0 },
  { id: "edge-crescent", influence: 1, outsideCoverage: 0 },
  { id: "winding-band", influence: 1, outsideCoverage: 0 },
  { id: "parallel-bands", influence: 1, outsideCoverage: 0 },
  { id: "archipelago", influence: 1, outsideCoverage: 0 },
  { id: "open-corridor", influence: 0.96, outsideCoverage: 0.01 },
  { id: "fragmented-pockets", influence: 1, outsideCoverage: 0 },
  { id: "ridge-clearing", influence: 1, outsideCoverage: 0 },
] as const satisfies readonly GrassWorldMacroPattern[];

export const GRASS_WORLD_MACRO_PATTERN_COUNT = grassWorldMacroPatterns.length;

const profileCache = new Map<string, GrassWorldPatternProfile>();
const PROFILE_CACHE_LIMIT = 128;

export function getGrassWorldMacroPattern(
  worldId: unknown,
): (typeof grassWorldMacroPatterns)[number] {
  return grassWorldMacroPatterns[positiveModulo(
    finiteInteger(worldId),
    GRASS_WORLD_MACRO_PATTERN_COUNT,
  )]!;
}

export function getGrassWorldMacroPatternIndex(worldId: unknown): number {
  return positiveModulo(
    finiteInteger(worldId),
    GRASS_WORLD_MACRO_PATTERN_COUNT,
  );
}

export function sampleGrassWorldMacroPattern(
  normalizedX: number,
  normalizedZ: number,
  worldId: number,
  channelOffset: number,
): number {
  const profile = getPatternProfile(worldId, channelOffset);
  const deltaX = normalizedX - profile.offsetX;
  const deltaZ = normalizedZ - profile.offsetZ;
  const x = (
    deltaX * profile.cosine - deltaZ * profile.sine
  ) / profile.scaleX;
  const z = (
    deltaX * profile.sine + deltaZ * profile.cosine
  ) / profile.scaleZ;
  const raw = evaluatePattern(profile, x, z);
  return clamp01(
    profile.pattern.outsideCoverage +
      raw * (1 - profile.pattern.outsideCoverage),
  );
}

function evaluatePattern(
  profile: GrassWorldPatternProfile,
  x: number,
  z: number,
): number {
  const patternIndex = profile.patternIndex;
  if (patternIndex === 0) {
    return clamp01(0.78 + ellipse(x, z, 0, 0, 1.15, 0.98) * 0.22);
  }
  if (patternIndex === 1) {
    return ellipse(x, z, 0, 0, 0.94, 0.74);
  }
  if (patternIndex === 2) {
    return 1 - ellipse(x, z, 0.05, -0.03, 0.52, 0.43);
  }
  if (patternIndex === 3) {
    return Math.max(
      ellipse(x, z, -0.42, -0.06, 0.62, 0.53),
      ellipse(x, z, 0.42, 0.06, 0.62, 0.53),
    );
  }
  if (patternIndex === 4) {
    return Math.max(
      ellipse(x, z, -0.46, -0.4, 0.63, 0.53),
      ellipse(x, z, 0.46, 0.4, 0.63, 0.53),
    );
  }
  if (patternIndex === 5) {
    return Math.max(
      ellipse(x, z, -0.7, -0.52, 0.32, 0.27),
      ellipse(x, z, -0.24, -0.18, 0.3, 0.25),
      ellipse(x, z, 0.24, 0.18, 0.3, 0.25),
      ellipse(x, z, 0.7, 0.52, 0.32, 0.27),
    );
  }
  if (patternIndex === 6) {
    return Math.max(
      softBand(x, 0.19, 0.24),
      softBand(z, 0.19, 0.24),
    );
  }
  if (patternIndex === 7) {
    return softRing(Math.hypot(x / 1.02, z / 0.84), 0.68, 0.23, 0.18);
  }
  if (patternIndex === 8) {
    const radius = Math.hypot(x / 1.04, z / 0.86);
    const angle = Math.atan2(z, x);
    const segments = smoothstep(
      -0.12,
      0.42,
      Math.sin(angle * 3 + profile.phase),
    );
    return softRing(radius, 0.68, 0.25, 0.18) * (0.2 + segments * 0.8);
  }
  if (patternIndex === 9) {
    const outer = ellipse(x, z, -0.17, 0, 0.95, 0.76);
    const inner = ellipse(x, z, 0.18, 0, 0.76, 0.59);
    return clamp01(outer - inner * 0.9);
  }
  if (patternIndex === 10) {
    const center = Math.sin(x * 2.45 + profile.phase) * 0.27;
    return softBand(z - center, 0.19, 0.2);
  }
  if (patternIndex === 11) {
    return Math.max(
      softBand(z - 0.36, 0.14, 0.18),
      softBand(z + 0.36, 0.14, 0.18),
    );
  }
  if (patternIndex === 12) {
    let value = ellipse(x, z, 0, 0, 0.56, 0.47);
    for (let index = 0; index < 4; index += 1) {
      const point = profile.points[index]!;
      value = Math.max(
        value,
        ellipse(
          x,
          z,
          point.x,
          point.z,
          point.radiusX * 1.15,
          point.radiusZ * 1.15,
        ),
      );
    }
    return value;
  }
  if (patternIndex === 13) {
    const center = Math.sin(x * 1.8 + profile.phase) * 0.13;
    return 1 - softBand(z - center, 0.16, 0.19);
  }
  if (patternIndex === 14) {
    let value = 0;
    for (const point of profile.points) {
      value = Math.max(
        value,
        ellipse(
          x,
          z,
          point.x,
          point.z,
          point.radiusX,
          point.radiusZ,
        ),
      );
    }
    return value;
  }

  const ridge = Math.max(
    softBand(z - x * 0.28, 0.2, 0.22),
    softBand(z + x * 0.42, 0.16, 0.2) * 0.78,
  );
  const clearing = ellipse(x, z, 0.08, 0.02, 0.34, 0.29);
  return clamp01(ridge * (1 - clearing * 0.88));
}

function getPatternProfile(
  worldId: number,
  channelOffset: number,
): GrassWorldPatternProfile {
  const key = `${finiteInteger(worldId)}:${channelOffset}`;
  const cached = profileCache.get(key);
  if (cached) return cached;

  const baseRotation = sample(worldId, 3, -Math.PI, Math.PI);
  const channelJitter = channelOffset === 0 ? 0 : channelOffset;
  const patternIndex = getGrassWorldMacroPatternIndex(worldId);
  const rotation =
    baseRotation + sample(worldId + channelJitter, 5, -0.055, 0.055);
  const profile: GrassWorldPatternProfile = {
    cosine: Math.cos(rotation),
    offsetX:
      sample(worldId, 7, -0.13, 0.13) +
      sample(worldId + channelJitter, 11, -0.035, 0.035),
    offsetZ:
      sample(worldId, 13, -0.13, 0.13) +
      sample(worldId + channelJitter, 17, -0.035, 0.035),
    pattern: grassWorldMacroPatterns[patternIndex]!,
    patternIndex,
    phase: sample(worldId, 19, -Math.PI, Math.PI),
    points: Array.from({ length: 7 }, (_, index) => {
      const angle = sample(worldId, 23 + index * 11, -Math.PI, Math.PI);
      const radius = sample(worldId, 29 + index * 13, 0.28, 0.76);
      return {
        radiusX: sample(worldId, 31 + index * 17, 0.25, 0.4),
        radiusZ: sample(worldId, 37 + index * 19, 0.22, 0.36),
        x:
          Math.cos(angle) * radius +
          sample(worldId + channelJitter, 41 + index * 23, -0.025, 0.025),
        z:
          Math.sin(angle) * radius +
          sample(worldId + channelJitter, 43 + index * 29, -0.025, 0.025),
      };
    }),
    scaleX: sample(worldId, 47, 0.88, 1.12),
    scaleZ: sample(worldId, 53, 0.88, 1.12),
    sine: Math.sin(rotation),
  };
  profileCache.set(key, profile);
  if (profileCache.size > PROFILE_CACHE_LIMIT) {
    const oldestKey = profileCache.keys().next().value;
    if (oldestKey) profileCache.delete(oldestKey);
  }
  return profile;
}

function ellipse(
  x: number,
  z: number,
  centerX: number,
  centerZ: number,
  radiusX: number,
  radiusZ: number,
): number {
  const distance = Math.hypot(
    (x - centerX) / Math.max(0.001, radiusX),
    (z - centerZ) / Math.max(0.001, radiusZ),
  );
  return 1 - smoothstep(0.62, 1, distance);
}

function softBand(value: number, halfWidth: number, softness: number): number {
  return 1 - smoothstep(halfWidth, halfWidth + softness, Math.abs(value));
}

function softRing(
  radius: number,
  center: number,
  halfWidth: number,
  softness: number,
): number {
  return 1 - smoothstep(
    halfWidth,
    halfWidth + softness,
    Math.abs(radius - center),
  );
}

function sample(
  worldId: number,
  salt: number,
  minimum: number,
  maximum: number,
): number {
  return minimum + (maximum - minimum) * hashUnit(worldId, salt);
}

function hashUnit(worldId: number, salt: number): number {
  let value = Math.imul(finiteInteger(worldId) + 1, 0x9e3779b1);
  value ^= Math.imul(salt + 1, 0x85ebca6b);
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d);
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b);
  value ^= value >>> 16;
  return (value >>> 0) / 4_294_967_296;
}

function finiteInteger(value: unknown): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.round(numeric) : 0;
}

function positiveModulo(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const amount = clamp01((value - edge0) / Math.max(0.0001, edge1 - edge0));
  return amount * amount * (3 - 2 * amount);
}
