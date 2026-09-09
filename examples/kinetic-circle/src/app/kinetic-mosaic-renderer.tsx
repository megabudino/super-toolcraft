import * as React from "react";

import {
  createToolcraftPngExportCanvas,
  getToolcraftTimelineLoopProgress,
  getToolcraftVideoExportSize,
  shouldIncludeToolcraftPreviewBackground,
  type ToolcraftState,
} from "@/toolcraft/runtime";
import {
  getToolcraftOrientationViewBasis,
  readToolcraftOrientationPose,
  useToolcraft,
  useToolcraftModelOrbitInteraction,
  type ToolcraftOrientationPose,
} from "@/toolcraft/runtime/react";

const TAU = Math.PI * 2;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const FLOATS_PER_VERTEX = 11;

export type ShapeForm = "circle" | "flower" | "pinch" | "vortex";
export type MotionType =
  | "ripple"
  | "breathe"
  | "twist"
  | "orbit"
  | "flow"
  | "sweep"
  | "pulse";
export type LayoutMode = "rings" | "phyllotaxis" | "spiral" | "arcs";
export type DotShape = "disc" | "ring" | "square" | "diamond" | "streak";
export type ColorMode =
  | "bands"
  | "gradient"
  | "sectors"
  | "spiral"
  | "depth"
  | "patches"
  | "duotone";

export const MOTION_TYPES: readonly MotionType[] = [
  "ripple",
  "breathe",
  "twist",
  "orbit",
  "flow",
  "sweep",
  "pulse",
];
export const LAYOUT_MODES: readonly LayoutMode[] = [
  "rings",
  "phyllotaxis",
  "spiral",
  "arcs",
];
export const DOT_SHAPES: readonly DotShape[] = [
  "disc",
  "ring",
  "square",
  "diamond",
  "streak",
];
export const COLOR_MODES: readonly ColorMode[] = [
  "bands",
  "gradient",
  "sectors",
  "spiral",
  "depth",
  "patches",
  "duotone",
];

type Palette = {
  base: string;
  bright: string;
  cyan: string;
  violet: string;
  warm: string;
};

export const PALETTE_PRESETS: Readonly<Record<string, Palette>> = {
  candy: {
    base: "#8C2C63",
    bright: "#FFF2F9",
    cyan: "#FF7AC6",
    violet: "#7A5CFF",
    warm: "#FFD166",
  },
  ember: {
    base: "#4A1207",
    bright: "#FFE8C7",
    cyan: "#FF7A18",
    violet: "#D63B2F",
    warm: "#FFC53D",
  },
  forest: {
    base: "#123A2A",
    bright: "#EFFFE9",
    cyan: "#4CD97B",
    violet: "#9BE15D",
    warm: "#F4D35E",
  },
  mono: {
    base: "#2B2F36",
    bright: "#F5F7FA",
    cyan: "#9AA7B8",
    violet: "#6B7686",
    warm: "#C9D2DE",
  },
  neon: {
    base: "#12063A",
    bright: "#F4FDFF",
    cyan: "#00F0FF",
    violet: "#C147FF",
    warm: "#FF3D81",
  },
  sea: {
    base: "#04263B",
    bright: "#E7FBFF",
    cyan: "#2EC4B6",
    violet: "#3D8BFD",
    warm: "#FFBF69",
  },
  sunset: {
    base: "#33122E",
    bright: "#FFEEDD",
    cyan: "#FF6B6B",
    violet: "#B84A9E",
    warm: "#FFA94D",
  },
  ultraviolet: {
    base: "#1B1040",
    bright: "#EFE6FF",
    cyan: "#7C4DFF",
    violet: "#C58CFF",
    warm: "#59D2FE",
  },
};

export type MosaicSettings = {
  accents: number;
  arcFill: number;
  arms: number;
  background: string;
  ballWeight: number;
  bend: number;
  colorMode: ColorMode;
  coreOpening: number;
  damping: number;
  density: number;
  depth: number;
  dotShape: DotShape;
  dotSize: number;
  form: ShapeForm;
  glow: number;
  highlight: number;
  includeBackground: boolean;
  layout: LayoutMode;
  motionType: MotionType;
  orientation: ToolcraftOrientationPose;
  palette: Palette;
  palettePreset: string;
  perspective: number;
  radiusRange: readonly [number, number];
  repeats: number;
  rotation: number;
  seed: number;
  sizeProfile: number;
  sparkle: number;
  speed: number;
  strength: number;
  turbulence: number;
  wavelength: number;
  zMotion: number;
  zBend: number;
  zSpread: number;
  zTwist: number;
};

type MosaicGeometry = {
  data: Float32Array;
  vertexCount: number;
};

type MosaicGlRenderer = {
  canvas: HTMLCanvasElement;
  dispose: () => void;
  draw: (options: DrawOptions) => void;
  hitTest: (
    clientX: number,
    clientY: number,
    settings: MosaicSettings,
  ) => boolean;
  setGeometry: (geometry: MosaicGeometry) => void;
};

type DrawOptions = {
  logicalHeight: number;
  logicalWidth: number;
  phase: number;
  pixelRatio: number;
  settings: MosaicSettings;
};

function numberValue(state: ToolcraftState, target: string, fallback: number): number {
  const value = Number(state.values[target]);
  return Number.isFinite(value) ? value : fallback;
}

function stringValue(state: ToolcraftState, target: string, fallback: string): string {
  const value = state.values[target];
  if (typeof value === "string" && value.length > 0) return value;
  if (
    typeof value === "object" &&
    value !== null &&
    "hex" in value &&
    typeof value.hex === "string" &&
    value.hex.length > 0
  ) {
    return value.hex;
  }
  return fallback;
}

function rangeValue(
  state: ToolcraftState,
  target: string,
  fallback: readonly [number, number],
): readonly [number, number] {
  const value = state.values[target];
  if (!Array.isArray(value) || value.length < 2) return fallback;
  const lower = Number(value[0]);
  const upper = Number(value[1]);
  return Number.isFinite(lower) && Number.isFinite(upper)
    ? [lower, upper]
    : fallback;
}

function enumValue<Option extends string>(
  state: ToolcraftState,
  target: string,
  options: readonly Option[],
  fallback: Option,
): Option {
  const value = stringValue(state, target, fallback);
  return (options as readonly string[]).includes(value)
    ? (value as Option)
    : fallback;
}

export function resolveMosaicPalette(settings: MosaicSettings): Palette {
  if (settings.palettePreset !== "custom") {
    const preset = PALETTE_PRESETS[settings.palettePreset];
    if (preset) return preset;
  }
  return settings.palette;
}

export function getMosaicSettings(state: ToolcraftState): MosaicSettings {
  return {
    accents: numberValue(state, "palette.accents", 100),
    arcFill: numberValue(state, "pattern.arcFill", 33),
    arms: numberValue(state, "pattern.arms", 2),
    background: stringValue(state, "appearance.background", "#241814"),
    ballWeight: numberValue(state, "motion.ballWeight", 21),
    bend: numberValue(state, "shape.bend", 26),
    colorMode: enumValue(state, "palette.colorMode", COLOR_MODES, "spiral"),
    coreOpening: numberValue(state, "motion.coreOpening", 56),
    damping: numberValue(state, "motion.damping", 23),
    density: numberValue(state, "pattern.density", 88),
    depth: numberValue(state, "shape.depth", 42),
    dotShape: enumValue(state, "style.dotShape", DOT_SHAPES, "disc"),
    dotSize: numberValue(state, "pattern.dotSize", 6),
    form: enumValue(
      state,
      "shape.form",
      ["circle", "flower", "pinch", "vortex"] as const,
      "circle",
    ),
    glow: numberValue(state, "style.glow", 0),
    highlight: numberValue(state, "palette.highlight", 95),
    includeBackground: shouldIncludeToolcraftPreviewBackground({ state }),
    layout: enumValue(state, "pattern.layout", LAYOUT_MODES, "rings"),
    motionType: enumValue(state, "motion.type", MOTION_TYPES, "ripple"),
    orientation: readToolcraftOrientationPose(
      state.values["view.orbit"],
      readToolcraftOrientationPose(state.defaults["view.orbit"]),
    ),
    palette: {
      base: stringValue(state, "palette.base", "#173A78"),
      bright: stringValue(state, "palette.bright", "#F2F7FF"),
      cyan: stringValue(state, "palette.cyan", "#19D9EA"),
      violet: stringValue(state, "palette.violet", "#B967E8"),
      warm: stringValue(state, "palette.warm", "#FF9B38"),
    },
    palettePreset: (() => {
      const preset = stringValue(state, "palette.preset", "ember");
      return preset === "custom" || preset in PALETTE_PRESETS ? preset : "ember";
    })(),
    perspective: numberValue(state, "volume.perspective", 84),
    radiusRange: rangeValue(state, "volume.radiusRange", [2, 93]),
    repeats: numberValue(state, "shape.repeats", 12),
    rotation: numberValue(state, "shape.rotation", 249),
    seed: numberValue(state, "pattern.seed", 6),
    sizeProfile: numberValue(state, "style.taper", -59),
    sparkle: numberValue(state, "motion.sparkle", 22),
    speed: numberValue(state, "motion.speed", 2),
    strength: numberValue(state, "motion.strength", 46),
    turbulence: numberValue(state, "motion.turbulence", 25),
    wavelength: numberValue(state, "motion.wavelength", 29),
    zMotion: numberValue(state, "motion.zMotion", 34),
    zBend: numberValue(state, "volume.zBend", -9),
    zSpread: numberValue(state, "volume.zSpread", 31),
    zTwist: numberValue(state, "volume.zTwist", 22),
  };
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function controlCurve(value: number, exponent: number): number {
  return Math.pow(clamp01(value / 100), exponent);
}

function signedControlCurve(value: number, exponent: number): number {
  const normalized = Math.max(-1, Math.min(1, value / 100));
  return Math.sign(normalized) * Math.pow(Math.abs(normalized), exponent);
}

function expandedZSpreadCurve(value: number): number {
  const normalized = Math.max(0, Math.min(1, value / 160));
  return Math.pow(normalized, 0.9) * 1.45;
}

export type MosaicMotionResponse = {
  ballWeight: number;
  coreOpening: number;
  damping: number;
  perspective: number;
  strength: number;
  turbulence: number;
  wavelength: number;
  zMotion: number;
};

export function getMosaicMotionResponse(
  settings: MosaicSettings,
  logicalHeight: number,
): MosaicMotionResponse {
  return {
    ballWeight: controlCurve(settings.ballWeight, 1.08),
    coreOpening:
      controlCurve(settings.coreOpening, 1.25) * logicalHeight * 0.15,
    damping: controlCurve(settings.damping, 1.15) * 6,
    perspective: controlCurve(settings.perspective, 1.3),
    strength: controlCurve(settings.strength, 1.25) * logicalHeight * 0.1,
    turbulence:
      controlCurve(settings.turbulence, 1.15) * logicalHeight * 0.075,
    wavelength: 0.8 + controlCurve(settings.wavelength, 0.9) * 8.2,
    zMotion: controlCurve(settings.zMotion, 1.2) * logicalHeight * 0.15,
  };
}

function fract(value: number): number {
  return value - Math.floor(value);
}

function random(seed: number): number {
  return fract(Math.sin(seed * 12.9898 + 78.233) * 43758.5453);
}

function valueNoise2(x: number, y: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const corner = (cx: number, cy: number) =>
    random(cx * 157.31 + cy * 113.97 + seed * 0.917);
  const top = corner(ix, iy) * (1 - sx) + corner(ix + 1, iy) * sx;
  const bottom =
    corner(ix, iy + 1) * (1 - sx) + corner(ix + 1, iy + 1) * sx;
  return top * (1 - sy) + bottom * sy;
}

function hexToRgba(hex: string, alpha = 1): [number, number, number, number] {
  const normalized = hex.trim().replace(/^#/, "");
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((part) => `${part}${part}`)
          .join("")
      : normalized;
  const value = Number.parseInt(expanded, 16);

  if (!Number.isFinite(value)) {
    return [0, 0, 0, alpha];
  }

  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
    alpha,
  ];
}

type Rgba = [number, number, number, number];

function mixRgba(from: Rgba, to: Rgba, t: number): Rgba {
  const amount = clamp01(t);
  return [
    from[0] + (to[0] - from[0]) * amount,
    from[1] + (to[1] - from[1]) * amount,
    from[2] + (to[2] - from[2]) * amount,
    from[3] + (to[3] - from[3]) * amount,
  ];
}

function ramp3(low: Rgba, mid: Rgba, high: Rgba, t: number): Rgba {
  const amount = clamp01(t);
  return amount < 0.55
    ? mixRgba(low, mid, amount / 0.55)
    : mixRgba(mid, high, (amount - 0.55) / 0.45);
}

type DotColorInput = {
  accents: number;
  angle: number;
  colorMode: ColorMode;
  depthT: number;
  formIndex: number;
  highlight: number;
  indexSeed: number;
  palette: Palette;
  radius: number;
  seed: number;
  x: number;
  y: number;
};

function chooseDotColor(input: DotColorInput): Rgba {
  const {
    accents,
    angle,
    colorMode,
    depthT,
    formIndex,
    highlight,
    indexSeed,
    palette,
    radius,
    seed,
  } = input;
  const accentScale = accents / 30;
  const warmThreshold = 1 - 0.012 * accentScale;
  const violetThreshold = 1 - 0.042 * accentScale;
  const accentRoll = random(indexSeed + 9.41);
  const roll = random(indexSeed + 2.73);
  const baseAlpha = 0.62 + random(indexSeed + 4.2) * 0.34;
  const lift = 0.72 + 0.28 * random(indexSeed + 13.7);
  const base = hexToRgba(palette.base, baseAlpha);
  const bright = hexToRgba(palette.bright, 1);
  const cyan = hexToRgba(palette.cyan, 1);
  const liftedBase: Rgba = [
    base[0] * lift,
    base[1] * lift,
    base[2] * lift,
    base[3],
  ];

  if (colorMode === "duotone") {
    if (accentRoll > warmThreshold) {
      return hexToRgba(palette.warm, 1);
    }
  } else {
    if (accentRoll > warmThreshold) {
      return hexToRgba(palette.warm, 1);
    }
    if (accentRoll > violetThreshold && radius > 0.24) {
      return hexToRgba(palette.violet, 0.96);
    }
  }

  if (colorMode === "gradient") {
    const pivot = Math.min(0.92, Math.max(0.08, highlight));
    const dither = (random(indexSeed + 6.17) - 0.5) * 0.12;
    const position =
      radius <= pivot
        ? (radius / pivot) * 0.5
        : 0.5 + ((radius - pivot) / (1 - pivot)) * 0.5;
    const color = ramp3(liftedBase, cyan, bright, position + dither);
    return [color[0], color[1], color[2], 0.82 + 0.18 * clamp01(position)];
  }

  if (colorMode === "sectors") {
    const sectorCount = Math.max(2, Math.round(3 + highlight * 9));
    const sector = Math.floor(
      fract(angle / TAU + seed * 0.0431) * sectorCount,
    );
    const cycle: readonly Rgba[] = [
      liftedBase,
      cyan,
      liftedBase,
      bright,
      liftedBase,
      hexToRgba(palette.violet, 0.94),
    ];
    const color = cycle[sector % cycle.length] ?? liftedBase;
    const shade = 0.82 + 0.18 * random(indexSeed + 5.03);
    return [color[0] * shade, color[1] * shade, color[2] * shade, color[3]];
  }

  if (colorMode === "spiral") {
    const turns = 1.5 + highlight * 4.5;
    const position = fract((angle / TAU) * 2 + radius * turns);
    const tri = 1 - Math.abs(2 * position - 1);
    return ramp3(liftedBase, cyan, bright, tri + (roll - 0.5) * 0.14);
  }

  if (colorMode === "depth") {
    const contrast = 0.55 + highlight * 0.65;
    const position = clamp01(0.5 + depthT * 0.5 * contrast);
    const color = ramp3(liftedBase, cyan, bright, position);
    return [color[0], color[1], color[2], 0.72 + 0.28 * position];
  }

  if (colorMode === "patches") {
    const frequency = 1.4 + highlight * 3.8;
    const sample = valueNoise2(
      input.x * frequency,
      input.y * frequency,
      seed * 3.7 + formIndex,
    );
    if (sample < 0.42) return liftedBase;
    if (sample < 0.62) return [cyan[0], cyan[1], cyan[2], 0.9];
    if (sample < 0.78) return hexToRgba(palette.violet, 0.92);
    return [bright[0], bright[1], bright[2], 0.94];
  }

  if (colorMode === "duotone") {
    const threshold = 0.25 + (1 - highlight) * 0.55;
    const arc = 0.62 + 0.38 * Math.sin(angle * (3 + formIndex) + formIndex * 1.7);
    const band = Math.exp(-Math.pow((radius - highlight) / 0.22, 2));
    return roll < band * arc * (1 - threshold) + 0.08
      ? [bright[0], bright[1], bright[2], 0.94]
      : liftedBase;
  }

  const brightBand = Math.exp(
    -Math.pow((radius - highlight) / 0.135, 2),
  );
  const cyanBand =
    0.65 * Math.exp(-Math.pow((radius - (highlight - 0.21)) / 0.12, 2)) +
    0.42 * Math.exp(-Math.pow((radius - (highlight + 0.15)) / 0.09, 2));
  const brokenArc =
    0.62 + 0.38 * Math.sin(angle * (3 + formIndex) + formIndex * 1.7);
  const energy = Math.max(0, brightBand * brokenArc);

  if (roll < energy * 0.72) {
    return hexToRgba(palette.bright, 0.9 + 0.1 * brightBand);
  }

  if (roll < Math.min(0.86, energy * 0.72 + cyanBand * 0.42)) {
    return hexToRgba(palette.cyan, 0.86 + 0.12 * cyanBand);
  }

  return liftedBase;
}

function transformShapePoint(
  settings: MosaicSettings,
  radius: number,
  angle: number,
  ring: number,
): { angle: number; radius: number } {
  const bend = controlCurve(settings.bend, 0.72);
  const depth = controlCurve(settings.depth, 0.8);
  const repeats = Math.max(2, Math.round(settings.repeats));
  const rotatedAngle = angle + (settings.rotation / 360) * TAU;
  const edgeInfluence = Math.pow(radius, 0.4 + depth * 2.2);
  const harmonic = Math.cos(angle * repeats);
  const secondary = Math.sin(angle * (repeats + 1) + ring * 0.18);
  const tertiary = Math.cos(
    angle * Math.max(1, repeats - 1) + 0.72 + ring * 0.06,
  );

  if (settings.form === "flower") {
    const radialScale =
      1 +
      harmonic * bend * 0.31 * edgeInfluence +
      secondary * bend * 0.055 * (0.25 + edgeInfluence * 0.75);
    return {
      angle: rotatedAngle + secondary * bend * 0.05 * edgeInfluence,
      radius: radius * Math.max(0.66, Math.min(1.32, radialScale)),
    };
  }

  if (settings.form === "pinch") {
    const pinch = Math.pow(
      Math.abs(Math.sin((angle * repeats) / 2)),
      1.35,
    );
    return {
      angle: rotatedAngle + secondary * bend * 0.045 * edgeInfluence,
      radius:
        radius *
        Math.max(0.66, 1 - pinch * bend * 0.32 * edgeInfluence),
    };
  }

  if (settings.form === "vortex") {
    const twist = bend * (0.22 + depth * 1.18) * (1 - radius);
    return {
      angle:
        rotatedAngle +
        twist +
        secondary * bend * 0.075 * edgeInfluence,
      radius:
        radius *
        Math.max(
          0.7,
          Math.min(1.3, 1 + secondary * bend * 0.16 * edgeInfluence),
        ),
    };
  }

  return {
    angle:
      rotatedAngle +
      secondary * bend * 0.035 * edgeInfluence,
    radius:
      radius *
      Math.max(
        0.76,
        Math.min(
          1.24,
          1 +
            (harmonic * 0.11 + tertiary * 0.038) *
              bend *
              edgeInfluence,
        ),
      ),
  };
}

export function buildMosaicGeometry(
  logicalWidth: number,
  logicalHeight: number,
  settings: MosaicSettings,
): MosaicGeometry {
  const baseRadius = Math.min(logicalWidth, logicalHeight) * 0.33;
  const center = { x: logicalWidth / 2, y: logicalHeight / 2 };
  const formIndex = Math.max(
    0,
    ["circle", "flower", "pinch", "vortex"].indexOf(settings.form),
  );
  const palette = resolveMosaicPalette(settings);
  const highlight = clamp01(settings.highlight / 100);
  const accents = Math.max(0, Math.min(100, settings.accents));
  const innerRadius = Math.max(
    0,
    Math.min(0.94, Math.min(...settings.radiusRange) / 100),
  );
  const outerRadius = Math.max(
    innerRadius + 0.04,
    Math.min(1, Math.max(...settings.radiusRange) / 100),
  );
  const radiusSpan = outerRadius - innerRadius;
  const zSpread = expandedZSpreadCurve(settings.zSpread);
  const zTwist = signedControlCurve(settings.zTwist, 0.82);
  const depthResponse = controlCurve(settings.depth, 0.8);
  const baseRingCount = 9 + settings.density * 0.21;
  const ringCount = Math.max(
    2,
    Math.round(baseRingCount * (radiusSpan / 0.9)),
  );
  const dotPitch = Math.max(
    7,
    settings.dotSize * (1.48 - settings.density * 0.0028),
  );
  const ringPointCounts = Array.from({ length: ringCount }, (_, index) => {
    const ringProgress = (index + 1) / ringCount;
    const normalizedRadius = innerRadius + radiusSpan * ringProgress;
    return Math.max(
      12,
      Math.round((TAU * baseRadius * normalizedRadius) / dotPitch),
    );
  });
  const vertices: number[] = [];
  let pointIndex = 0;

  const emit = (
    normalizedRadius: number,
    sourceAngle: number,
    ring: number,
    ringProgress: number,
  ): void => {
    const indexSeed = settings.seed * 1009 + ring * 19 + pointIndex;
    const angleJitter =
      (random(indexSeed + 31.7) - 0.5) *
      0.045 *
      (0.35 + normalizedRadius * 0.65);
    const radiusJitter =
      1 +
      (random(indexSeed + 43.1) - 0.5) *
        0.035 *
        (0.25 + normalizedRadius * 0.75);
    const transformed = transformShapePoint(
      settings,
      normalizedRadius * radiusJitter,
      sourceAngle + angleJitter,
      ring,
    );
    const radiusPx = baseRadius * transformed.radius;
    const x = center.x + radiusPx * Math.cos(transformed.angle);
    const y = center.y + radiusPx * Math.sin(transformed.angle);
    const reliefStrength = baseRadius * 0.48 * depthResponse * zSpread;
    const dome = Math.pow(
      Math.max(0, 1 - normalizedRadius * normalizedRadius),
      1.35,
    );
    const ridge =
      Math.sin(
        transformed.angle * Math.max(2, Math.round(settings.repeats)) +
          ring * 0.22,
      ) *
      normalizedRadius *
      (settings.form === "circle" ? 0.24 : 0.42);
    const helix =
      Math.sin(
        transformed.angle +
          ringProgress * TAU * (0.5 + Math.abs(zTwist) * 4.1),
      ) *
      ringProgress *
      zTwist;
    const z = reliefStrength * (ridge * 0.72 + helix * 1.15);
    const domeDepth = reliefStrength * dome * 1.3;
    const depthT =
      reliefStrength > 0
        ? Math.max(
            -1,
            Math.min(1, (z + domeDepth * 0.4) / (reliefStrength * 1.1)),
          )
        : 0;
    const color = chooseDotColor({
      accents,
      angle: transformed.angle,
      colorMode: settings.colorMode,
      depthT,
      formIndex,
      highlight,
      indexSeed,
      palette,
      radius: normalizedRadius,
      seed: settings.seed,
      x: (x - center.x) / baseRadius,
      y: (y - center.y) / baseRadius,
    });
    const sizeJitter = 0.74 + random(indexSeed + 18.2) * 0.52;

    vertices.push(
      x,
      y,
      z,
      transformed.angle,
      normalizedRadius,
      color[0],
      color[1],
      color[2],
      color[3],
      sizeJitter,
      domeDepth,
    );
    pointIndex += 1;
  };

  if (settings.layout === "phyllotaxis") {
    const totalPoints = ringPointCounts.reduce((sum, count) => sum + count, 0);
    const seedRotation = random(settings.seed * 101 + 3) * TAU;

    for (let index = 0; index < totalPoints; index += 1) {
      const t = (index + 0.5) / totalPoints;
      const normalizedRadius = Math.sqrt(
        innerRadius * innerRadius +
          t * (outerRadius * outerRadius - innerRadius * innerRadius),
      );
      const ringProgress =
        radiusSpan > 0
          ? clamp01((normalizedRadius - innerRadius) / radiusSpan)
          : t;
      const ring = Math.max(1, Math.round(ringProgress * ringCount));
      emit(
        normalizedRadius,
        index * GOLDEN_ANGLE + seedRotation,
        ring,
        ringProgress,
      );
    }
  } else if (settings.layout === "spiral") {
    const totalPoints = ringPointCounts.reduce((sum, count) => sum + count, 0);
    const arms = Math.max(2, Math.min(8, Math.round(settings.arms)));
    const perArm = Math.max(8, Math.round(totalPoints / arms));
    const windTurns = 1.65;

    for (let arm = 0; arm < arms; arm += 1) {
      const armBase =
        (arm / arms) * TAU + random(settings.seed * 53 + arm) * 0.2;

      for (let step = 0; step < perArm; step += 1) {
        const t = (step + 0.5) / perArm;
        const normalizedRadius = innerRadius + radiusSpan * Math.pow(t, 0.85);
        const ringProgress = clamp01(Math.pow(t, 0.85));
        const ring = Math.max(1, Math.round(ringProgress * ringCount));
        const armWidth = (TAU / arms) * 0.16 * (0.35 + (1 - t) * 0.65);
        const scatter =
          (random(settings.seed * 977 + arm * 131 + step) - 0.5) *
          2 *
          armWidth;
        emit(
          normalizedRadius,
          armBase + t * TAU * windTurns + scatter,
          ring,
          ringProgress,
        );
      }
    }
  } else {
    const arcs = settings.layout === "arcs";
    const arcFill = Math.max(0.1, Math.min(0.95, settings.arcFill / 100));
    const segmentCount = Math.max(2, Math.round(settings.repeats));

    for (let ring = 1; ring <= ringCount; ring += 1) {
      const ringProgress = ring / ringCount;
      const normalizedRadius = innerRadius + radiusSpan * ringProgress;
      const pointCount = ringPointCounts[ring - 1] ?? 12;
      const angularOffset =
        (ring % 2) * (Math.PI / pointCount) +
        (random(settings.seed * 101 + ring) - 0.5) * 0.085;
      const segmentStagger =
        (ring % 2) * 0.5 + random(settings.seed * 211 + ring) * 0.3;

      for (let point = 0; point < pointCount; point += 1) {
        if (arcs) {
          const segmentPhase = fract(
            (point / pointCount) * segmentCount + segmentStagger,
          );
          if (segmentPhase > arcFill) continue;
        }
        emit(
          normalizedRadius,
          (point / pointCount) * TAU + angularOffset,
          ring,
          ringProgress,
        );
      }
    }
  }

  return {
    data: new Float32Array(vertices),
    vertexCount: vertices.length / FLOATS_PER_VERTEX,
  };
}

export const mosaicVertexShaderSource = `#version 300 es
precision highp float;

in vec3 a_position;
in float a_angle;
in float a_radius;
in vec4 a_color;
in float a_size;
in float a_dome;

uniform vec2 u_logicalResolution;
uniform float u_pixelRatio;
uniform float u_phase;
uniform float u_motionType;
uniform float u_speed;
uniform float u_strength;
uniform float u_wavelength;
uniform float u_damping;
uniform float u_turbulence;
uniform float u_dotSize;
uniform float u_innerRadius;
uniform float u_outerRadius;
uniform float u_perspective;
uniform float u_zMotion;
uniform float u_coreOpening;
uniform float u_ballWeight;
uniform float u_zBend;
uniform float u_sizeProfile;
uniform float u_sparkle;
uniform float u_glow;
uniform vec3 u_viewRight;
uniform vec3 u_viewUp;
uniform vec3 u_viewBack;

out vec4 v_color;
out float v_pointAngle;

const float TAU = 6.28318530718;

void main() {
  float cycle = u_phase * u_speed;
  float radiusSpan = max(0.04, u_outerRadius - u_innerRadius);
  float bandPosition = clamp((a_radius - u_innerRadius) / radiusSpan, 0.0, 1.0);
  float massVariation =
    0.55 + 0.9 * clamp((a_size - 0.74) / 0.52, 0.0, 1.0);
  float phaseLag =
    u_ballWeight * massVariation * (0.14 + 0.28 * bandPosition);
  float localCycle = cycle - phaseLag;
  float response = 1.0 / (1.0 + u_ballWeight * massVariation * 2.2);
  float spatialPhase = a_radius * u_wavelength * 3.14159265359;
  float attenuation = exp(-u_damping * a_radius);
  float edgeWeight = 0.32 + 0.68 * a_radius;
  float pointHash = fract(
    sin(dot(vec2(a_angle, a_radius), vec2(127.1, 311.7))) * 43758.5453
  );
  float radial = 0.0;
  float tangential = 0.0;
  float axial = 0.0;
  float shimmer = 0.0;

  if (u_motionType < 0.5) {
    float wavePhase = TAU * localCycle - spatialPhase;
    radial =
      (sin(wavePhase) + 0.28 * sin(wavePhase * 2.0 - a_radius * 5.0)) *
      u_strength *
      attenuation;
    tangential = sin(wavePhase + a_angle * 2.0) * u_turbulence * attenuation;
    axial =
      cos(wavePhase - a_angle * 0.35) *
      u_zMotion *
      attenuation *
      (0.5 + 0.5 * bandPosition);
  } else if (u_motionType < 1.5) {
    float breathPhase = TAU * localCycle - spatialPhase * 0.28;
    radial = sin(breathPhase) * u_strength * attenuation * edgeWeight;
    tangential =
      cos(breathPhase + a_angle * 2.0) *
      u_turbulence *
      attenuation *
      0.28;
    axial =
      cos(breathPhase) *
      u_zMotion *
      attenuation *
      (0.4 + 0.6 * (1.0 - abs(bandPosition - 0.5) * 2.0));
  } else if (u_motionType < 2.5) {
    float twistPhase = TAU * localCycle + spatialPhase + a_angle;
    radial = sin(twistPhase * 0.5) * u_strength * attenuation * 0.18;
    tangential =
      sin(twistPhase) *
      (u_strength + u_turbulence * 0.65) *
      attenuation *
      edgeWeight;
    axial =
      cos(twistPhase - a_angle * 1.5) *
      u_zMotion *
      attenuation *
      edgeWeight;
  } else if (u_motionType < 3.5) {
    float orbitPhase = TAU * localCycle + a_angle * u_wavelength;
    radial =
      sin(orbitPhase + spatialPhase * 0.32) *
      u_strength *
      attenuation *
      0.55;
    tangential =
      cos(orbitPhase - spatialPhase * 0.22) *
      (u_strength * 0.72 + u_turbulence) *
      attenuation *
      edgeWeight;
    axial =
      sin(orbitPhase - spatialPhase * 0.5) *
      u_zMotion *
      attenuation *
      (0.45 + 0.55 * edgeWeight);
  } else if (u_motionType < 4.5) {
    float flowA = TAU * (localCycle + pointHash);
    float flowB = TAU * (2.0 * localCycle - pointHash * 3.0);
    radial =
      (sin(flowA + spatialPhase * 0.5) + 0.55 * sin(flowB + a_angle * 3.0)) *
      0.62 *
      u_strength *
      attenuation;
    tangential =
      (cos(flowA - a_angle * 2.0) +
        0.55 * sin(flowB * 0.5 + spatialPhase * 0.35)) *
      (u_strength * 0.4 + u_turbulence) *
      attenuation *
      0.7;
    axial =
      sin(flowA - spatialPhase * 0.3) *
      u_zMotion *
      attenuation *
      (0.4 + 0.6 * pointHash);
  } else if (u_motionType < 5.5) {
    float beamWidth = mix(1.7, 0.32, clamp((u_wavelength - 0.8) / 8.2, 0.0, 1.0));
    float beamDelta = mod(a_angle - TAU * localCycle, TAU);
    float beamDistance = min(beamDelta, TAU - beamDelta);
    float beam = exp(-pow(beamDistance / beamWidth, 2.0));
    radial = beam * u_strength * attenuation * 1.2;
    tangential =
      beam *
      sign(sin(beamDelta - 3.14159265359)) *
      u_turbulence *
      attenuation *
      1.4;
    axial = beam * u_zMotion * attenuation * (0.5 + 0.5 * bandPosition);
    shimmer = beam;
  } else {
    float frontWidth = mix(0.42, 0.09, clamp((u_wavelength - 0.8) / 8.2, 0.0, 1.0));
    float frontA = fract(localCycle);
    float frontB = fract(localCycle + 0.5);
    float loopFade =
      smoothstep(0.0, 0.1, frontA) * (1.0 - smoothstep(0.86, 1.0, frontA));
    float loopFadeB =
      smoothstep(0.0, 0.1, frontB) * (1.0 - smoothstep(0.86, 1.0, frontB));
    float waveA =
      exp(-pow((bandPosition - frontA) / frontWidth, 2.0)) * loopFade;
    float waveB =
      exp(-pow((bandPosition - frontB) / frontWidth, 2.0)) * loopFadeB * 0.55;
    float wave = waveA + waveB;
    radial = wave * u_strength * attenuation * 1.35;
    tangential =
      wave *
      sin(a_angle * 3.0 + TAU * localCycle) *
      u_turbulence *
      attenuation *
      0.5;
    axial = wave * u_zMotion * attenuation;
    shimmer = wave;
  }

  tangential +=
    sin(TAU * localCycle + a_angle * (2.0 + u_wavelength * 0.25)) *
    u_turbulence *
    attenuation *
    0.24;
  radial *= response;
  tangential *= response;
  axial *= 0.58 + response * 0.42;

  float coreWeight = pow(1.0 - bandPosition, 2.2);
  float openingPulse = 0.18 + 0.82 * (0.5 + 0.5 * sin(TAU * localCycle));
  radial += u_coreOpening * coreWeight * openingPulse;

  vec2 direction = vec2(cos(a_angle), sin(a_angle));
  vec2 tangent = vec2(-direction.y, direction.x);
  vec2 displaced = a_position.xy + direction * radial + tangent * tangential;
  vec2 center = u_logicalResolution * 0.5;
  float depthSettle =
    u_ballWeight *
    massVariation *
    u_logicalResolution.y *
    0.05 *
    (0.25 + 0.75 * bandPosition);
  float gravityDrop =
    u_ballWeight *
    massVariation *
    u_logicalResolution.y *
    0.055 *
    (0.3 + 0.7 * bandPosition);
  displaced.y += gravityDrop;
  float motionEnvelope =
    (u_strength + u_turbulence + u_coreOpening * 0.5) /
    max(1.0, u_logicalResolution.y);
  float fitPressure = smoothstep(0.08, 0.25, motionEnvelope);
  float compositionScale = mix(1.0, 0.78, fitPressure);
  float depthLimit =
    min(u_logicalResolution.x, u_logicalResolution.y) * 0.33 * 1.35;
  float authoredDepth =
    depthLimit * tanh((a_position.z + a_dome * u_zBend) / depthLimit);
  vec3 local = vec3(
    (displaced.x - center.x) * compositionScale,
    (center.y - displaced.y) * compositionScale,
    (authoredDepth + axial - depthSettle) * compositionScale
  );
  float viewX = dot(local, u_viewRight);
  float viewY = dot(local, u_viewUp);
  float viewZ = dot(local, u_viewBack);
  float focalDistance =
    u_logicalResolution.y * mix(9.0, 1.15, u_perspective);
  float perspectiveProjection =
    1.0 / max(0.5, 1.0 - viewZ / focalDistance);
  float perspectiveCap = mix(1.38, 1.16, fitPressure);
  float perspective =
    mix(1.0, min(perspectiveCap, perspectiveProjection), u_perspective);
  vec2 projected = center + vec2(viewX, viewY) * perspective;
  vec2 clip = projected / u_logicalResolution * 2.0 - 1.0;

  float twinkle = pow(
    0.5 + 0.5 * sin(TAU * (3.0 * localCycle + pointHash * 5.0)),
    6.0
  );
  float sparkleBoost = u_sparkle * twinkle;
  float sizeProfile = mix(
    1.0 - u_sizeProfile * 0.55,
    1.0 + u_sizeProfile * 0.55,
    bandPosition
  );

  gl_Position = vec4(
    clip.x,
    clip.y,
    clamp(-viewZ / focalDistance, -0.9, 0.9),
    1.0
  );
  gl_PointSize = max(
    1.0,
    u_dotSize *
      a_size *
      u_pixelRatio *
      perspective *
      sizeProfile *
      (1.0 + sparkleBoost * 0.4 + u_glow * 0.5) *
      (1.0 + abs(radial) * 0.003 + abs(axial) * 0.0025) *
      (1.0 + u_ballWeight * (massVariation - 0.55) * 0.16)
  );
  float depthLight = clamp(
    0.5 + viewZ / max(1.0, u_logicalResolution.y * 0.55),
    0.0,
    1.0
  );
  float brightness =
    mix(0.78, 1.16, depthLight) *
    (1.0 + sparkleBoost * 1.5 + shimmer * 0.45);
  v_color = vec4(a_color.rgb * brightness, a_color.a);
  v_pointAngle = a_angle;
}`;

export const mosaicFragmentShaderSource = `#version 300 es
precision highp float;

in vec4 v_color;
in float v_pointAngle;

uniform float u_dotShape;
uniform float u_glow;

out vec4 outColor;

void main() {
  vec2 centered = gl_PointCoord * 2.0 - 1.0;
  float distanceFromCenter = length(centered);
  float edge;

  if (u_dotShape < 0.5) {
    edge = 1.0 - smoothstep(0.82, 1.0, distanceFromCenter);
  } else if (u_dotShape < 1.5) {
    edge = 1.0 - smoothstep(0.14, 0.3, abs(distanceFromCenter - 0.62));
  } else if (u_dotShape < 2.5) {
    float box = max(abs(centered.x), abs(centered.y));
    edge = 1.0 - smoothstep(0.68, 0.84, box);
  } else if (u_dotShape < 3.5) {
    float diamond = abs(centered.x) + abs(centered.y);
    edge = 1.0 - smoothstep(0.78, 0.96, diamond);
  } else {
    float cosine = cos(v_pointAngle);
    float sine = sin(v_pointAngle);
    vec2 rotated = vec2(
      centered.x * -sine + centered.y * cosine,
      centered.x * cosine + centered.y * sine
    );
    float streak = length(vec2(rotated.x * 0.52, rotated.y * 2.1));
    edge = 1.0 - smoothstep(0.78, 1.0, streak);
  }

  float halo = exp(-distanceFromCenter * distanceFromCenter * 2.3);
  float alpha = v_color.a * max(edge, u_glow * halo * 0.85 * (1.0 - edge));
  if (alpha <= 0.004) discard;
  vec3 color = v_color.rgb * (1.0 + u_glow * 0.55 * edge);
  outColor = vec4(color, alpha);
}`;

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to allocate WebGL shader.");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? "Unknown shader error";
    gl.deleteShader(shader);
    throw new Error(log);
  }
  return shader;
}

function createProgram(gl: WebGL2RenderingContext): WebGLProgram {
  const program = gl.createProgram();
  if (!program) throw new Error("Unable to allocate WebGL program.");
  const vertex = compileShader(gl, gl.VERTEX_SHADER, mosaicVertexShaderSource);
  const fragment = compileShader(
    gl,
    gl.FRAGMENT_SHADER,
    mosaicFragmentShaderSource,
  );
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) ?? "Unable to link WebGL program.");
  }
  return program;
}

function uniform(gl: WebGL2RenderingContext, program: WebGLProgram, name: string): WebGLUniformLocation {
  const location = gl.getUniformLocation(program, name);
  if (!location) throw new Error(`Missing WebGL uniform ${name}.`);
  return location;
}

export function createMosaicGlRenderer(
  canvas: HTMLCanvasElement,
  preserveDrawingBuffer = true,
): MosaicGlRenderer {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    antialias: false,
    preserveDrawingBuffer,
    premultipliedAlpha: true,
  });
  if (!gl) throw new Error("Kinetic Mosaic requires WebGL 2.");

  const program = createProgram(gl);
  const vao = gl.createVertexArray();
  const buffer = gl.createBuffer();
  if (!vao || !buffer) throw new Error("Unable to allocate WebGL geometry.");
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

  const stride = FLOATS_PER_VERTEX * Float32Array.BYTES_PER_ELEMENT;
  const attributes = [
    { name: "a_position", size: 3, offset: 0 },
    { name: "a_angle", size: 1, offset: 3 },
    { name: "a_radius", size: 1, offset: 4 },
    { name: "a_color", size: 4, offset: 5 },
    { name: "a_size", size: 1, offset: 9 },
    { name: "a_dome", size: 1, offset: 10 },
  ];
  for (const attribute of attributes) {
    const location = gl.getAttribLocation(program, attribute.name);
    if (location < 0) continue;
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(
      location,
      attribute.size,
      gl.FLOAT,
      false,
      stride,
      attribute.offset * Float32Array.BYTES_PER_ELEMENT,
    );
  }

  const uniforms = {
    ballWeight: uniform(gl, program, "u_ballWeight"),
    coreOpening: uniform(gl, program, "u_coreOpening"),
    damping: uniform(gl, program, "u_damping"),
    dotShape: uniform(gl, program, "u_dotShape"),
    dotSize: uniform(gl, program, "u_dotSize"),
    glow: uniform(gl, program, "u_glow"),
    innerRadius: uniform(gl, program, "u_innerRadius"),
    logicalResolution: uniform(gl, program, "u_logicalResolution"),
    motionType: uniform(gl, program, "u_motionType"),
    outerRadius: uniform(gl, program, "u_outerRadius"),
    perspective: uniform(gl, program, "u_perspective"),
    phase: uniform(gl, program, "u_phase"),
    pixelRatio: uniform(gl, program, "u_pixelRatio"),
    sizeProfile: uniform(gl, program, "u_sizeProfile"),
    sparkle: uniform(gl, program, "u_sparkle"),
    speed: uniform(gl, program, "u_speed"),
    strength: uniform(gl, program, "u_strength"),
    turbulence: uniform(gl, program, "u_turbulence"),
    viewBack: uniform(gl, program, "u_viewBack"),
    viewRight: uniform(gl, program, "u_viewRight"),
    viewUp: uniform(gl, program, "u_viewUp"),
    wavelength: uniform(gl, program, "u_wavelength"),
    zBend: uniform(gl, program, "u_zBend"),
    zMotion: uniform(gl, program, "u_zMotion"),
  };
  let vertexCount = 0;

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  return {
    canvas,
    dispose: () => {
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
    },
    draw: ({ logicalHeight, logicalWidth, phase, pixelRatio, settings }) => {
      const nextWidth = Math.max(1, Math.round(logicalWidth * pixelRatio));
      const nextHeight = Math.max(1, Math.round(logicalHeight * pixelRatio));
      if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
        canvas.width = nextWidth;
        canvas.height = nextHeight;
      }

      const background = hexToRgba(settings.background, settings.includeBackground ? 1 : 0);
      const viewBasis = getToolcraftOrientationViewBasis(settings.orientation);
      const innerRadius = Math.max(
        0,
        Math.min(0.94, Math.min(...settings.radiusRange) / 100),
      );
      const outerRadius = Math.max(
        innerRadius + 0.04,
        Math.min(1, Math.max(...settings.radiusRange) / 100),
      );
      const response = getMosaicMotionResponse(settings, logicalHeight);
      const glow = controlCurve(settings.glow, 1.1);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.depthMask(true);
      gl.clearColor(background[0], background[1], background[2], background[3]);
      gl.clearDepth(1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(program);
      gl.bindVertexArray(vao);
      if (glow > 0) {
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        gl.depthMask(false);
      } else {
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      }
      gl.uniform2f(uniforms.logicalResolution, logicalWidth, logicalHeight);
      gl.uniform1f(uniforms.pixelRatio, pixelRatio);
      gl.uniform1f(uniforms.phase, phase);
      gl.uniform1f(
        uniforms.motionType,
        Math.max(0, MOTION_TYPES.indexOf(settings.motionType)),
      );
      gl.uniform1f(uniforms.speed, Math.max(1, Math.round(settings.speed)));
      gl.uniform1f(uniforms.strength, response.strength);
      gl.uniform1f(uniforms.wavelength, response.wavelength);
      gl.uniform1f(uniforms.damping, response.damping);
      gl.uniform1f(uniforms.turbulence, response.turbulence);
      gl.uniform1f(
        uniforms.dotShape,
        Math.max(0, DOT_SHAPES.indexOf(settings.dotShape)),
      );
      gl.uniform1f(uniforms.dotSize, settings.dotSize);
      gl.uniform1f(uniforms.glow, glow);
      gl.uniform1f(uniforms.innerRadius, innerRadius);
      gl.uniform1f(uniforms.outerRadius, outerRadius);
      gl.uniform1f(uniforms.perspective, response.perspective);
      gl.uniform1f(
        uniforms.sizeProfile,
        signedControlCurve(settings.sizeProfile, 1),
      );
      gl.uniform1f(uniforms.sparkle, controlCurve(settings.sparkle, 1.1));
      gl.uniform1f(uniforms.zMotion, response.zMotion);
      gl.uniform1f(uniforms.coreOpening, response.coreOpening);
      gl.uniform1f(uniforms.ballWeight, response.ballWeight);
      gl.uniform3f(uniforms.viewRight, ...viewBasis.right);
      gl.uniform3f(uniforms.viewUp, ...viewBasis.up);
      gl.uniform3f(uniforms.viewBack, ...viewBasis.back);
      gl.uniform1f(
        uniforms.zBend,
        signedControlCurve(settings.zBend, 0.82),
      );
      gl.drawArrays(gl.POINTS, 0, vertexCount);
      gl.depthMask(true);
    },
    hitTest: (clientX, clientY, settings) => {
      const bounds = canvas.getBoundingClientRect();

      if (
        clientX < bounds.left ||
        clientX > bounds.right ||
        clientY < bounds.top ||
        clientY > bounds.bottom ||
        bounds.width <= 0 ||
        bounds.height <= 0
      ) {
        return false;
      }

      const x = Math.max(
        0,
        Math.min(
          canvas.width - 1,
          Math.floor(((clientX - bounds.left) / bounds.width) * canvas.width),
        ),
      );
      const y = Math.max(
        0,
        Math.min(
          canvas.height - 1,
          Math.floor(
            (1 - (clientY - bounds.top) / bounds.height) * canvas.height,
          ),
        ),
      );
      const pixel = new Uint8Array(4);
      gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
      const normalizedX =
        (clientX - (bounds.left + bounds.width / 2)) /
        Math.max(1, Math.min(bounds.width, bounds.height));
      const normalizedY =
        (clientY - (bounds.top + bounds.height / 2)) /
        Math.max(1, Math.min(bounds.width, bounds.height));
      const insideReliefBody =
        Math.hypot(normalizedX, normalizedY) < 0.29;

      if (!settings.includeBackground) {
        return pixel[3] > 20 || insideReliefBody;
      }

      const background = hexToRgba(settings.background, 1).map((channel) =>
        Math.round(channel * 255),
      );
      const colorDistance =
        Math.abs(pixel[0] - background[0]) +
        Math.abs(pixel[1] - background[1]) +
        Math.abs(pixel[2] - background[2]);
      return (pixel[3] > 20 && colorDistance > 24) || insideReliefBody;
    },
    setGeometry: (geometry) => {
      vertexCount = geometry.vertexCount;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, geometry.data, gl.STATIC_DRAW);
    },
  };
}

type RandomizeKind = "colors" | "look";

function pick<Value>(rng: () => number, values: readonly Value[]): Value {
  const index = Math.min(values.length - 1, Math.floor(rng() * values.length));
  return values[index] as Value;
}

function between(rng: () => number, min: number, max: number): number {
  return Math.round(min + rng() * (max - min));
}

export function createMosaicRandomValues(
  kind: RandomizeKind,
  rng: () => number = Math.random,
): Record<string, unknown> {
  const colorValues: Record<string, unknown> = {
    "palette.accents": between(rng, 8, 70),
    "palette.colorMode": pick(rng, COLOR_MODES),
    "palette.highlight": between(rng, 35, 85),
    "palette.preset": pick(rng, Object.keys(PALETTE_PRESETS)),
  };

  if (kind === "colors") {
    return colorValues;
  }

  const glowOn = rng() < 0.45;
  const sparkleOn = rng() < 0.45;

  return {
    ...colorValues,
    "motion.ballWeight": between(rng, 0, 50),
    "motion.coreOpening": between(rng, 10, 60),
    "motion.damping": between(rng, 10, 60),
    "motion.sparkle": sparkleOn ? between(rng, 15, 60) : 0,
    "motion.speed": between(rng, 1, 4),
    "motion.strength": between(rng, 30, 75),
    "motion.turbulence": between(rng, 10, 60),
    "motion.type": pick(rng, MOTION_TYPES),
    "motion.wavelength": between(rng, 20, 70),
    "motion.zMotion": between(rng, 20, 80),
    "pattern.arcFill": between(rng, 25, 80),
    "pattern.arms": between(rng, 2, 7),
    "pattern.density": between(rng, 45, 85),
    "pattern.dotSize": between(rng, 8, 24) / 2,
    "pattern.layout": pick(rng, LAYOUT_MODES),
    "pattern.seed": between(rng, 1, 24),
    "shape.bend": between(rng, 15, 70),
    "shape.depth": between(rng, 30, 90),
    "shape.form": pick(rng, ["circle", "flower", "pinch", "vortex"] as const),
    "shape.repeats": between(rng, 3, 9),
    "style.dotShape": rng() < 0.4 ? "disc" : pick(rng, DOT_SHAPES),
    "style.glow": glowOn ? between(rng, 20, 70) : 0,
    "style.taper": between(rng, -60, 60),
    "volume.perspective": between(rng, 30, 85),
    "volume.radiusRange": [between(rng, 0, 22), between(rng, 78, 100)],
    "volume.zBend": between(rng, -80, 80),
    "volume.zSpread": between(rng, 40, 140),
    "volume.zTwist": between(rng, -70, 70),
  };
}

function createRenderedFrameCanvas(
  state: ToolcraftState,
  settings: MosaicSettings,
  phase: number,
  width: number,
  height: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const renderer = createMosaicGlRenderer(canvas, true);
  renderer.setGeometry(buildMosaicGeometry(state.canvas.size.width, state.canvas.size.height, settings));
  renderer.draw({
    logicalHeight: state.canvas.size.height,
    logicalWidth: state.canvas.size.width,
    phase,
    pixelRatio: width / state.canvas.size.width,
    settings,
  });
  renderer.dispose();
  return canvas;
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = fileName;
  link.href = url;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error(`Unable to encode ${type}.`));
    }, type, quality);
  });
}

export async function exportMosaicImage(state: ToolcraftState): Promise<Blob> {
  const settings = getMosaicSettings(state);
  const phase = getToolcraftTimelineLoopProgress(state.timeline);
  const selectedFormat = stringValue(state, "export.image.format", "png").toLowerCase();
  const mimeType = selectedFormat === "jpg" ? "image/jpeg" : "image/png";
  const includeBackground = selectedFormat === "jpg" ? true : settings.includeBackground;
  const exportCanvas = createToolcraftPngExportCanvas({
    background: settings.background,
    includeBackground,
    resolution: stringValue(state, "export.image.resolution", "4k"),
    state,
    render: ({ context, cssHeight, cssWidth, pixelHeight, pixelWidth }) => {
      const rendered = createRenderedFrameCanvas(
        state,
        { ...settings, includeBackground },
        phase,
        pixelWidth,
        pixelHeight,
      );
      context.drawImage(rendered, 0, 0, cssWidth, cssHeight);
    },
  });
  const blob = await canvasToBlob(exportCanvas, mimeType, 0.94);
  downloadBlob(blob, `kinetic-circle.${selectedFormat === "jpg" ? "jpg" : "png"}`);
  return blob;
}

function chooseVideoMime(requestedFormat: string): string {
  const candidates =
    requestedFormat === "mp4"
      ? ["video/mp4;codecs=avc1", "video/webm;codecs=vp9", "video/webm;codecs=vp8"]
      : ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? "video/webm";
}

export async function exportMosaicVideo(
  state: ToolcraftState,
  reportProgress: (progress: number) => void,
): Promise<Blob> {
  const settings = { ...getMosaicSettings(state), includeBackground: true };
  const size = getToolcraftVideoExportSize({
    resolution: stringValue(state, "export.video.resolution", "current"),
    state,
  });
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const renderer = createMosaicGlRenderer(canvas);
  renderer.setGeometry(buildMosaicGeometry(state.canvas.size.width, state.canvas.size.height, settings));

  const fps = 30;
  const durationSeconds = Math.max(1, state.timeline.durationSeconds);
  const totalFrames = Math.max(1, Math.round(durationSeconds * fps));
  const stream = canvas.captureStream(0);
  const track = stream.getVideoTracks()[0] as MediaStreamTrack & { requestFrame?: () => void };
  const mimeType = chooseVideoMime(stringValue(state, "export.video.format", "mp4"));
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: Math.min(30_000_000, Math.max(8_000_000, size.width * size.height * 3)),
  });
  const chunks: BlobPart[] = [];
  recorder.addEventListener("dataavailable", (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  });

  const stopped = new Promise<void>((resolve, reject) => {
    recorder.addEventListener("stop", () => resolve(), { once: true });
    recorder.addEventListener("error", () => reject(new Error("Video recorder failed.")), {
      once: true,
    });
  });

  recorder.start();
  for (let frame = 0; frame < totalFrames; frame += 1) {
    const timelineTimeSeconds = frame / fps;
    const phase = timelineTimeSeconds / durationSeconds;
    renderer.draw({
      logicalHeight: state.canvas.size.height,
      logicalWidth: state.canvas.size.width,
      phase,
      pixelRatio: size.width / state.canvas.size.width,
      settings,
    });
    track.requestFrame?.();
    reportProgress((frame + 1) / totalFrames);
    await new Promise<void>((resolve) => window.setTimeout(resolve, 1000 / fps));
  }
  recorder.stop();
  await stopped;
  renderer.dispose();
  stream.getTracks().forEach((streamTrack) => streamTrack.stop());

  const blob = new Blob(chunks, { type: mimeType });
  if (blob.size === 0) throw new Error("Video encoder returned an empty file.");
  const extension = mimeType.includes("mp4") ? "mp4" : "webm";
  downloadBlob(blob, `kinetic-circle.${extension}`);
  return blob;
}

export function KineticMosaicRenderer(): React.JSX.Element {
  const { state } = useToolcraft();
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const rendererRef = React.useRef<MosaicGlRenderer | null>(null);
  const interactionRef = React.useRef(false);
  const responsiveInteractionRef = React.useRef(false);
  const resumeTimerRef = React.useRef<number | null>(null);
  const resumeFrameRef = React.useRef<number | null>(null);
  const renderFrameRef = React.useRef<number | null>(null);
  const lastDrawAtRef = React.useRef(0);
  const latestDrawRef = React.useRef<() => void>(() => undefined);
  const renderScaleRef = React.useRef<number | null>(null);
  const renderScaleTimerRef = React.useRef<number | null>(null);
  const renderScalePendingRef = React.useRef(false);
  const settings = getMosaicSettings(state);
  const previewSettings =
    state.canvas.mode === "infinite"
      ? { ...settings, includeBackground: false }
      : settings;
  const previewSettingsRef = React.useRef(previewSettings);
  previewSettingsRef.current = previewSettings;
  const logicalWidth = state.canvas.size.width;
  const logicalHeight = state.canvas.size.height;
  const renderScale = numberValue(state, "canvas.renderScale", 2);
  const phase = getToolcraftTimelineLoopProgress(state.timeline);
  const isPlaying = state.timeline.isPlaying;
  const hitTest = React.useCallback(
    (clientX: number, clientY: number) =>
      rendererRef.current?.hitTest(
        clientX,
        clientY,
        previewSettingsRef.current,
      ) ?? false,
    [],
  );
  const orbitHandlers = useToolcraftModelOrbitInteraction<HTMLCanvasElement>({
    hitTest,
    target: "view.orbit",
  });
  const geometry = React.useMemo(
    () => buildMosaicGeometry(logicalWidth, logicalHeight, settings),
    [
      logicalHeight,
      logicalWidth,
      settings.accents,
      settings.arcFill,
      settings.arms,
      settings.bend,
      settings.colorMode,
      settings.density,
      settings.depth,
      settings.dotSize,
      settings.form,
      settings.highlight,
      settings.layout,
      settings.palette.base,
      settings.palette.bright,
      settings.palette.cyan,
      settings.palette.violet,
      settings.palette.warm,
      settings.palettePreset,
      settings.radiusRange[0],
      settings.radiusRange[1],
      settings.repeats,
      settings.rotation,
      settings.seed,
      settings.zSpread,
      settings.zTwist,
    ],
  );

  React.useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const renderer = createMosaicGlRenderer(canvas);
    rendererRef.current = renderer;
    return () => {
      renderer.dispose();
      rendererRef.current = null;
    };
  }, []);

  React.useLayoutEffect(() => {
    rendererRef.current?.setGeometry(geometry);
  }, [geometry]);

  const drawLatest = React.useCallback(() => {
    rendererRef.current?.draw({
      logicalHeight,
      logicalWidth,
      phase,
      pixelRatio: responsiveInteractionRef.current
        ? Math.min(1, renderScale)
        : renderScale,
      settings: previewSettings,
    });
  }, [logicalHeight, logicalWidth, phase, previewSettings, renderScale]);

  latestDrawRef.current = drawLatest;

  React.useLayoutEffect(() => {
    if (renderScaleRef.current !== null && renderScaleRef.current !== renderScale) {
      renderScaleRef.current = renderScale;
      renderScalePendingRef.current = true;
      if (renderScaleTimerRef.current !== null) {
        window.clearTimeout(renderScaleTimerRef.current);
      }
      renderScaleTimerRef.current = window.setTimeout(() => {
        renderScalePendingRef.current = false;
        renderScaleTimerRef.current = null;
        latestDrawRef.current();
      }, 250);
      return;
    }
    renderScaleRef.current = renderScale;
    if (renderScalePendingRef.current) return;
    if (interactionRef.current || renderFrameRef.current !== null) return;
    const renderOnCadence = (timestamp: number) => {
      renderFrameRef.current = null;
      const minimumFrameInterval = responsiveInteractionRef.current
        ? 16
        : isPlaying
          ? 30
          : 0;
      if (
        minimumFrameInterval > 0 &&
        timestamp - lastDrawAtRef.current < minimumFrameInterval
      ) {
        renderFrameRef.current =
          window.requestAnimationFrame(renderOnCadence);
        return;
      }
      lastDrawAtRef.current = timestamp;
      latestDrawRef.current();
    };
    renderFrameRef.current = window.requestAnimationFrame(renderOnCadence);
  }, [drawLatest, isPlaying]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const viewport = canvas?.closest<HTMLElement>('[data-slot="toolcraft-runtime-canvas"]');
    if (!canvas || !viewport) return undefined;

    const isOrientationGizmoEvent = (event: Event): boolean =>
      event.target instanceof Element &&
      event.target.closest(
        '[data-toolcraft-canvas-handle="orientation-gizmo"]',
      ) !== null;
    const isProductOrbitPointerEvent = (event: PointerEvent): boolean =>
      event.target instanceof Element &&
      event.target.matches("[data-toolcraft-product-output]") &&
      hitTest(event.clientX, event.clientY);
    const beginResponsiveInteraction = () => {
      responsiveInteractionRef.current = true;
      interactionRef.current = false;
      canvas.dataset.mosaicInteractionQuality = "responsive";
      if (resumeTimerRef.current !== null) {
        window.clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = null;
      }
    };
    const pauseForInteraction = () => {
      responsiveInteractionRef.current = false;
      interactionRef.current = true;
      if (resumeTimerRef.current !== null) window.clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = window.setTimeout(() => {
        interactionRef.current = false;
        resumeFrameRef.current = window.requestAnimationFrame(() => latestDrawRef.current());
      }, 90);
    };
    const beginViewportPointer = (event: PointerEvent) => {
      if (
        isOrientationGizmoEvent(event) ||
        isProductOrbitPointerEvent(event)
      ) {
        beginResponsiveInteraction();
        return;
      }
      pauseForInteraction();
    };
    const pauseForPointerDrag = (event: PointerEvent) => {
      if (responsiveInteractionRef.current) return;
      if (event.buttons !== 0) pauseForInteraction();
    };
    const resumeAfterPointer = () => {
      const wasResponsiveInteraction = responsiveInteractionRef.current;
      responsiveInteractionRef.current = false;
      canvas.dataset.mosaicInteractionQuality = "full";
      if (resumeTimerRef.current !== null) window.clearTimeout(resumeTimerRef.current);
      if (wasResponsiveInteraction) {
        interactionRef.current = false;
        if (renderFrameRef.current !== null) {
          window.cancelAnimationFrame(renderFrameRef.current);
          renderFrameRef.current = null;
        }
        if (resumeFrameRef.current !== null) {
          window.cancelAnimationFrame(resumeFrameRef.current);
        }
        resumeFrameRef.current = window.requestAnimationFrame(() => {
          resumeFrameRef.current = null;
          lastDrawAtRef.current = 0;
          latestDrawRef.current();
        });
        return;
      }
      resumeTimerRef.current = window.setTimeout(() => {
        interactionRef.current = false;
        resumeFrameRef.current = window.requestAnimationFrame(() => latestDrawRef.current());
      }, 32);
    };
    const pauseForEditorInteraction = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (isOrientationGizmoEvent(event)) {
        beginResponsiveInteraction();
        return;
      }
      const slider = target.closest('[data-slot="slider"]');
      const resolutionScale =
        slider?.querySelector('input[aria-label="Resolution scale"]') != null;
      if (slider && !resolutionScale) {
        beginResponsiveInteraction();
        return;
      }
      const commandLabel = target.closest("button")?.getAttribute("aria-label");
      const viewportCommand =
        commandLabel === "Zoom in" ||
        commandLabel === "Zoom out" ||
        commandLabel === "Center canvas";
      if (resolutionScale || viewportCommand) {
        pauseForInteraction();
      }
    };

    canvas.dataset.mosaicInteractionQuality = "full";
    viewport.addEventListener("pointerdown", beginViewportPointer, true);
    viewport.addEventListener("pointermove", pauseForPointerDrag, true);
    viewport.addEventListener("wheel", pauseForInteraction, true);
    document.addEventListener("pointerdown", pauseForEditorInteraction, true);
    document.addEventListener("pointerup", resumeAfterPointer, true);
    document.addEventListener("pointercancel", resumeAfterPointer, true);
    return () => {
      viewport.removeEventListener("pointerdown", beginViewportPointer, true);
      viewport.removeEventListener("pointermove", pauseForPointerDrag, true);
      viewport.removeEventListener("wheel", pauseForInteraction, true);
      document.removeEventListener("pointerdown", pauseForEditorInteraction, true);
      document.removeEventListener("pointerup", resumeAfterPointer, true);
      document.removeEventListener("pointercancel", resumeAfterPointer, true);
      if (resumeTimerRef.current !== null) window.clearTimeout(resumeTimerRef.current);
      if (resumeFrameRef.current !== null) {
        window.cancelAnimationFrame(resumeFrameRef.current);
        resumeFrameRef.current = null;
      }
      if (renderFrameRef.current !== null) {
        window.cancelAnimationFrame(renderFrameRef.current);
        renderFrameRef.current = null;
      }
      if (renderScaleTimerRef.current !== null) {
        window.clearTimeout(renderScaleTimerRef.current);
        renderScaleTimerRef.current = null;
      }
      renderScalePendingRef.current = false;
      delete canvas.dataset.mosaicInteractionQuality;
      resumeTimerRef.current = null;
    };
  }, []);

  return (
    <canvas
      aria-label="One animated configurable mosaic circle"
      className={
        state.canvas.mode === "finite"
          ? "block size-full"
          : "absolute block max-w-none"
      }
      data-mosaic-canvas-mode={state.canvas.mode}
      data-mosaic-figure-count="1"
      data-mosaic-motion-type={settings.motionType}
      data-mosaic-phase={phase.toFixed(4)}
      data-mosaic-accents={settings.accents}
      data-mosaic-base-color={settings.palette.base}
      data-mosaic-ball-weight={settings.ballWeight}
      data-mosaic-color-mode={settings.colorMode}
      data-mosaic-core-opening={settings.coreOpening}
      data-mosaic-dot-shape={settings.dotShape}
      data-mosaic-glow={settings.glow}
      data-mosaic-highlight={settings.highlight}
      data-mosaic-layout={settings.layout}
      data-mosaic-palette-preset={settings.palettePreset}
      data-mosaic-seed={settings.seed}
      data-mosaic-shape-form={settings.form}
      data-mosaic-taper={settings.sizeProfile}
      data-mosaic-sparkle={settings.sparkle}
      data-mosaic-strength={settings.strength}
      data-mosaic-orientation={JSON.stringify(settings.orientation)}
      data-mosaic-perspective={settings.perspective}
      data-mosaic-radius-range={settings.radiusRange.join(":")}
      data-mosaic-vertex-count={geometry.vertexCount}
      data-mosaic-z-motion={settings.zMotion}
      data-mosaic-z-bend={settings.zBend}
      data-mosaic-z-spread={settings.zSpread}
      data-mosaic-z-twist={settings.zTwist}
      data-toolcraft-generated-output=""
      data-toolcraft-product-output=""
      onLostPointerCapture={orbitHandlers.onLostPointerCapture}
      onPointerCancel={orbitHandlers.onPointerCancel}
      onPointerDown={orbitHandlers.onPointerDown}
      onPointerMove={orbitHandlers.onPointerMove}
      onPointerUp={orbitHandlers.onPointerUp}
      ref={canvasRef}
      style={
        state.canvas.mode === "finite"
          ? {
              background: "transparent",
              cursor: "grab",
              touchAction: "none",
            }
          : {
              background: "transparent",
              cursor: "grab",
              height: logicalHeight,
              left: 0,
              touchAction: "none",
              top: 0,
              transform: "translate(-50%, -50%)",
              width: logicalWidth,
            }
      }
    />
  );
}
