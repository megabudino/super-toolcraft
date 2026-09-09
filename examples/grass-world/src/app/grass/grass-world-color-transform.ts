export type GrassWorldColorRole =
  | "flower-white"
  | "flower-yellow"
  | "ground"
  | "stone"
  | "vegetation-instance-dark"
  | "vegetation-instance-light"
  | "vegetation-instance-middle"
  | "vegetation-middle"
  | "vegetation-root"
  | "vegetation-tip"
  | "vegetation-tufted"
  | "vegetation-wild";

export type GrassWorldOklch = Readonly<{
  chroma: number;
  hue: number;
  lightness: number;
}>;

export type GrassWorldColorMood = Readonly<{
  chromaScale: number;
  lightnessBias: number;
  temperature: number;
  vegetationHue: number;
  worldId: number;
}>;

type RoleBounds = Readonly<{
  chroma: readonly [number, number];
  hue?: readonly [number, number];
  lightness: readonly [number, number];
}>;

type VegetationProfile = RoleBounds &
  Readonly<{
    hueAttraction: number;
    hueOffset: number;
    lightnessResponse: number;
  }>;

type Rgb = Readonly<{
  blue: number;
  green: number;
  red: number;
}>;

export const grassWorldColorRoleBounds = {
  "flower-white": {
    chroma: [0.001, 0.006],
    lightness: [0.955, 0.982],
  },
  "flower-yellow": {
    chroma: [0.008, 0.022],
    hue: [96, 108],
    lightness: [0.94, 0.975],
  },
  ground: {
    chroma: [0.16, 0.23],
    hue: [150, 172],
    lightness: [0.52, 0.65],
  },
  stone: {
    chroma: [0.008, 0.023],
    lightness: [0.78, 0.87],
  },
  "vegetation-instance-dark": {
    chroma: [0.07, 0.13],
    hue: [136, 160],
    lightness: [0.35, 0.49],
  },
  "vegetation-instance-light": {
    chroma: [0.08, 0.15],
    hue: [134, 158],
    lightness: [0.62, 0.74],
  },
  "vegetation-instance-middle": {
    chroma: [0.09, 0.15],
    hue: [134, 158],
    lightness: [0.5, 0.62],
  },
  "vegetation-middle": {
    chroma: [0.075, 0.14],
    hue: [134, 158],
    lightness: [0.46, 0.64],
  },
  "vegetation-root": {
    chroma: [0.045, 0.095],
    hue: [142, 166],
    lightness: [0.27, 0.41],
  },
  "vegetation-tip": {
    chroma: [0.08, 0.15],
    hue: [134, 158],
    lightness: [0.7, 0.86],
  },
  "vegetation-tufted": {
    chroma: [0.05, 0.085],
    hue: [136, 158],
    lightness: [0.94, 0.975],
  },
  "vegetation-wild": {
    chroma: [0.1, 0.19],
    hue: [138, 158],
    lightness: [0.6, 0.76],
  },
} as const satisfies Readonly<Record<GrassWorldColorRole, RoleBounds>>;

const vegetationProfiles = {
  "vegetation-instance-dark": profile(
    "vegetation-instance-dark",
    8,
    0.64,
    0.7,
  ),
  "vegetation-instance-light": profile(
    "vegetation-instance-light",
    -2,
    0.82,
    0.6,
  ),
  "vegetation-instance-middle": profile(
    "vegetation-instance-middle",
    0,
    0.68,
    0.75,
  ),
  "vegetation-middle": profile("vegetation-middle", 0, 0.64, 0.72),
  "vegetation-root": profile("vegetation-root", 10, 0.52, 0.58),
  "vegetation-tip": profile("vegetation-tip", -2, 0.86, 0.55),
} as const satisfies Readonly<
  Partial<Record<GrassWorldColorRole, VegetationProfile>>
>;

export function createGrassWorldColorMood(
  value: unknown,
): GrassWorldColorMood {
  const worldId = finiteInteger(value);
  return {
    chromaScale: sample(worldId, "palette-chroma", 0.88, 1.06),
    lightnessBias: sample(worldId, "palette-lightness", -0.02, 0.015),
    temperature: sample(worldId, "palette-temperature", -1, 1),
    vegetationHue: sample(worldId, "palette-green-hue", 140, 154),
    worldId,
  };
}

export function transformGrassWorldColor(
  source: string,
  role: GrassWorldColorRole,
  mood: GrassWorldColorMood,
  channel: string,
): string {
  const sourceColor = readGrassWorldOklch(source);
  const transformed = transformRole(sourceColor, role, mood, channel);
  return oklchToHex(transformed);
}

export function readGrassWorldOklch(value: string): GrassWorldOklch {
  const rgb = parseHex(value);
  if (!rgb) throw new Error(`Expected a hex color, received ${value}.`);
  return rgbToOklch({
    red: srgbToLinear(rgb.red),
    green: srgbToLinear(rgb.green),
    blue: srgbToLinear(rgb.blue),
  });
}

function transformRole(
  source: GrassWorldOklch,
  role: GrassWorldColorRole,
  mood: GrassWorldColorMood,
  channel: string,
): GrassWorldOklch {
  if (role === "flower-white") {
    return transformWhiteFlower(mood, channel);
  }
  if (role === "flower-yellow") {
    return transformYellowFlower(mood, channel);
  }
  if (role === "stone") return transformStone(source, mood, channel);
  if (role === "ground") return transformGround(source, mood, channel);
  if (role === "vegetation-tufted") {
    return transformTufted(mood, channel);
  }
  if (role === "vegetation-wild") {
    return transformWild(source, mood, channel);
  }

  const profile = vegetationProfiles[role];
  if (!profile) return source;
  const hueJitter = sample(mood.worldId, `${channel}-hue`, -1.8, 1.8);
  const chromaJitter = sample(
    mood.worldId,
    `${channel}-chroma`,
    -0.006,
    0.006,
  );
  const lightnessJitter = sample(
    mood.worldId,
    `${channel}-lightness`,
    -0.007,
    0.007,
  );
  const targetHue = clamp(
    mood.vegetationHue + profile.hueOffset + hueJitter,
    profile.hue![0],
    profile.hue![1],
  );
  return {
    hue: clamp(
      mixHue(source.hue, targetHue, profile.hueAttraction),
      profile.hue![0],
      profile.hue![1],
    ),
    chroma: clamp(
      source.chroma * mood.chromaScale + chromaJitter,
      profile.chroma[0],
      profile.chroma[1],
    ),
    lightness: clamp(
      source.lightness +
        mood.lightnessBias * profile.lightnessResponse +
        lightnessJitter,
      profile.lightness[0],
      profile.lightness[1],
    ),
  };
}

function transformTufted(
  mood: GrassWorldColorMood,
  channel: string,
): GrassWorldOklch {
  const bounds = grassWorldColorRoleBounds["vegetation-tufted"];
  return {
    hue: clamp(
      mood.vegetationHue +
        sample(mood.worldId, `${channel}-hue`, -1.5, 1.5),
      bounds.hue[0],
      bounds.hue[1],
    ),
    chroma: clamp(
      sample(mood.worldId, `${channel}-chroma`, 0.055, 0.08) *
        mood.chromaScale,
      bounds.chroma[0],
      bounds.chroma[1],
    ),
    lightness: clamp(
      0.958 +
        mood.lightnessBias * 0.25 +
        sample(mood.worldId, `${channel}-lightness`, -0.004, 0.004),
      bounds.lightness[0],
      bounds.lightness[1],
    ),
  };
}

function transformWhiteFlower(
  mood: GrassWorldColorMood,
  channel: string,
): GrassWorldOklch {
  const bounds = grassWorldColorRoleBounds["flower-white"];
  return {
    hue: wrapHue(
      172 + mood.temperature * 78 +
        sample(mood.worldId, `${channel}-hue`, -4, 4),
    ),
    chroma: clamp(
      sample(mood.worldId, `${channel}-chroma`, 0.0015, 0.0045),
      bounds.chroma[0],
      bounds.chroma[1],
    ),
    lightness: clamp(
      0.971 +
        mood.lightnessBias * 0.08 +
        sample(mood.worldId, `${channel}-lightness`, -0.004, 0.004),
      bounds.lightness[0],
      bounds.lightness[1],
    ),
  };
}

function transformYellowFlower(
  mood: GrassWorldColorMood,
  channel: string,
): GrassWorldOklch {
  const bounds = grassWorldColorRoleBounds["flower-yellow"];
  return {
    hue: clamp(
      102 +
        mood.temperature * 4 +
        sample(mood.worldId, `${channel}-hue`, -2, 2),
      bounds.hue[0],
      bounds.hue[1],
    ),
    chroma: clamp(
      sample(mood.worldId, `${channel}-chroma`, 0.01, 0.02),
      bounds.chroma[0],
      bounds.chroma[1],
    ),
    lightness: clamp(
      0.962 +
        mood.lightnessBias * 0.08 +
        sample(mood.worldId, `${channel}-lightness`, -0.005, 0.005),
      bounds.lightness[0],
      bounds.lightness[1],
    ),
  };
}

function transformGround(
  source: GrassWorldOklch,
  mood: GrassWorldColorMood,
  channel: string,
): GrassWorldOklch {
  const bounds = grassWorldColorRoleBounds.ground;
  const targetHue = clamp(
    mood.vegetationHue +
      12 +
      sample(mood.worldId, `${channel}-hue`, -2, 2),
    bounds.hue[0],
    bounds.hue[1],
  );
  return {
    hue: clamp(
      mixHue(source.hue, targetHue, 0.8),
      bounds.hue[0],
      bounds.hue[1],
    ),
    chroma: clamp(
      source.chroma *
        sample(mood.worldId, `${channel}-chroma`, 0.85, 1.1),
      bounds.chroma[0],
      bounds.chroma[1],
    ),
    lightness: clamp(
      source.lightness +
        mood.lightnessBias * 0.35 +
        sample(mood.worldId, `${channel}-lightness`, -0.008, 0.004),
      bounds.lightness[0],
      bounds.lightness[1],
    ),
  };
}

function transformWild(
  source: GrassWorldOklch,
  mood: GrassWorldColorMood,
  channel: string,
): GrassWorldOklch {
  const bounds = grassWorldColorRoleBounds["vegetation-wild"];
  return {
    hue: clamp(
      mixHue(
        source.hue,
        mood.vegetationHue +
          sample(mood.worldId, `${channel}-hue`, -2, 2),
        0.78,
      ),
      bounds.hue[0],
      bounds.hue[1],
    ),
    chroma: clamp(
      source.chroma * 0.3 +
        sample(mood.worldId, `${channel}-chroma`, 0.055, 0.095),
      bounds.chroma[0],
      bounds.chroma[1],
    ),
    lightness: clamp(
      source.lightness +
        (0.68 - source.lightness) * 0.68 +
        mood.lightnessBias * 0.3 +
        sample(mood.worldId, `${channel}-lightness`, -0.02, 0.02),
      bounds.lightness[0],
      bounds.lightness[1],
    ),
  };
}

function transformStone(
  source: GrassWorldOklch,
  mood: GrassWorldColorMood,
  channel: string,
): GrassWorldOklch {
  const bounds = grassWorldColorRoleBounds.stone;
  const temperatureHue = 165 + mood.temperature * 72;
  return {
    hue: mixHue(source.hue, temperatureHue, 0.2),
    chroma: clamp(
      source.chroma * sample(mood.worldId, `${channel}-chroma`, 0.72, 0.94),
      bounds.chroma[0],
      bounds.chroma[1],
    ),
    lightness: clamp(
      source.lightness +
        mood.lightnessBias * 0.3 +
        sample(mood.worldId, `${channel}-lightness`, -0.004, 0.004),
      bounds.lightness[0],
      bounds.lightness[1],
    ),
  };
}

function profile(
  role: GrassWorldColorRole,
  hueOffset: number,
  hueAttraction: number,
  lightnessResponse: number,
): VegetationProfile {
  const bounds: RoleBounds = grassWorldColorRoleBounds[role];
  if (!bounds.hue) throw new Error(`Missing hue bounds for ${role}.`);
  return { ...bounds, hueAttraction, hueOffset, lightnessResponse };
}

function oklchToHex(color: GrassWorldOklch): string {
  const mapped = mapOklchToGamut(color);
  const hueRadians = (wrapHue(mapped.hue) * Math.PI) / 180;
  const lab = {
    lightness: mapped.lightness,
    a: mapped.chroma * Math.cos(hueRadians),
    b: mapped.chroma * Math.sin(hueRadians),
  };
  const linear = oklabToLinearRgb(lab);
  return `#${hexByte(linearToSrgb(linear.red))}${hexByte(
    linearToSrgb(linear.green),
  )}${hexByte(linearToSrgb(linear.blue))}`;
}

function mapOklchToGamut(color: GrassWorldOklch): GrassWorldOklch {
  const normalized = {
    hue: wrapHue(color.hue),
    chroma: Math.max(0, color.chroma),
    lightness: clamp(color.lightness, 0, 1),
  };
  if (isOklchInGamut(normalized)) return normalized;

  let low = 0;
  let high = normalized.chroma;
  for (let iteration = 0; iteration < 24; iteration += 1) {
    const middle = (low + high) / 2;
    if (isOklchInGamut({ ...normalized, chroma: middle })) low = middle;
    else high = middle;
  }
  return { ...normalized, chroma: low };
}

function isOklchInGamut(color: GrassWorldOklch): boolean {
  const hueRadians = (wrapHue(color.hue) * Math.PI) / 180;
  const rgb = oklabToLinearRgb({
    lightness: color.lightness,
    a: color.chroma * Math.cos(hueRadians),
    b: color.chroma * Math.sin(hueRadians),
  });
  const epsilon = 0.0000001;
  return (
    rgb.red >= -epsilon &&
    rgb.red <= 1 + epsilon &&
    rgb.green >= -epsilon &&
    rgb.green <= 1 + epsilon &&
    rgb.blue >= -epsilon &&
    rgb.blue <= 1 + epsilon
  );
}

function rgbToOklch(color: Rgb): GrassWorldOklch {
  const l = Math.cbrt(
    0.4122214708 * color.red +
      0.5363325363 * color.green +
      0.0514459929 * color.blue,
  );
  const m = Math.cbrt(
    0.2119034982 * color.red +
      0.6806995451 * color.green +
      0.1073969566 * color.blue,
  );
  const s = Math.cbrt(
    0.0883024619 * color.red +
      0.2817188376 * color.green +
      0.6299787005 * color.blue,
  );
  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const b = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return {
    lightness,
    chroma: Math.hypot(a, b),
    hue: wrapHue((Math.atan2(b, a) * 180) / Math.PI),
  };
}

function oklabToLinearRgb(color: Readonly<{
  a: number;
  b: number;
  lightness: number;
}>): Rgb {
  const lRoot = color.lightness + 0.3963377774 * color.a + 0.2158037573 * color.b;
  const mRoot = color.lightness - 0.1055613458 * color.a - 0.0638541728 * color.b;
  const sRoot = color.lightness - 0.0894841775 * color.a - 1.291485548 * color.b;
  const l = lRoot * lRoot * lRoot;
  const m = mRoot * mRoot * mRoot;
  const s = sRoot * sRoot * sRoot;
  return {
    red: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    green: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    blue: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  };
}

function parseHex(value: string): Rgb | null {
  const short = /^#([\da-f])([\da-f])([\da-f])$/iu.exec(value);
  if (short) {
    return {
      red: Number.parseInt(short[1]! + short[1]!, 16) / 255,
      green: Number.parseInt(short[2]! + short[2]!, 16) / 255,
      blue: Number.parseInt(short[3]! + short[3]!, 16) / 255,
    };
  }
  const match = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/iu.exec(value);
  if (!match) return null;
  return {
    red: Number.parseInt(match[1]!, 16) / 255,
    green: Number.parseInt(match[2]!, 16) / 255,
    blue: Number.parseInt(match[3]!, 16) / 255,
  };
}

function srgbToLinear(value: number): number {
  return value <= 0.04045
    ? value / 12.92
    : ((value + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(value: number): number {
  const clamped = clamp(value, 0, 1);
  return clamped <= 0.0031308
    ? clamped * 12.92
    : 1.055 * clamped ** (1 / 2.4) - 0.055;
}

function hexByte(value: number): string {
  return Math.round(clamp(value, 0, 1) * 255)
    .toString(16)
    .padStart(2, "0");
}

function mixHue(source: number, target: number, amount: number): number {
  const delta = ((target - source + 540) % 360) - 180;
  return wrapHue(source + delta * amount);
}

function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function unit(worldId: number, channel: string): number {
  let value = Math.imul(worldId + 1, 0x9e3779b1) ^ hashString(channel);
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d);
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b);
  value ^= value >>> 16;
  return (value >>> 0) / 4_294_967_296;
}

function sample(
  worldId: number,
  channel: string,
  minimum: number,
  maximum: number,
): number {
  return minimum + (maximum - minimum) * unit(worldId, channel);
}

function finiteInteger(value: unknown): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.round(numeric) : 0;
}

function wrapHue(value: number): number {
  return ((value % 360) + 360) % 360;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
