import type { ToolcraftImageExportResolution } from "@/toolcraft/runtime";

export const ditherEffectStyles = [
  "none",
  "pixel-art",
  "dither-blend",
  "noise-dither",
  "bayer",
  "characters",
  "halftone",
  "lego",
  "dots",
  "led",
  "cross-stitch",
  "voxel",
  "lattice",
  "hex-grid",
] as const;

export type DitherEffectStyle = (typeof ditherEffectStyles)[number];

export const ditherAsciiModes = ["dynamic", "filled", "uniform"] as const;
export type DitherAsciiMode = (typeof ditherAsciiModes)[number];

export const ditherAsciiGlyphSets = [
  "alpha",
  "blocky",
  "brutal",
  "cinematic",
  "classic",
  "custom",
  "hacker",
  "japanese",
  "numbers",
  "pixel",
  "retro",
  "tech",
  "thin",
] as const;
export type DitherAsciiGlyphSet = (typeof ditherAsciiGlyphSets)[number];

export const ditherBlendModes = [
  "color-dodge",
  "multiply",
  "overlay",
  "screen",
  "source-over",
] as const;
export type DitherBlendMode = (typeof ditherBlendModes)[number];

export const ditherDuotonePresets = [
  "off",
  "midnight-gold",
  "royal-cream",
  "deep-sea",
  "neon-violet",
  "ember",
  "custom",
] as const;
export type DitherDuotonePreset = (typeof ditherDuotonePresets)[number];

export type DitherImageExportFormat = "jpg" | "png";
export type DitherRenderMode = "export" | "preview";

export type DitherRenderSettings = {
  asciiCustomGlyphs: string;
  asciiGlyphs: DitherAsciiGlyphSet;
  asciiMode: DitherAsciiMode;
  background: string;
  blend: DitherBlendMode;
  density: number;
  duotoneBase: string;
  duotonePixels: string;
  duotonePreset: DitherDuotonePreset;
  exposure: number;
  fill: number;
  finishGlow: number;
  finishGrain: number;
  finishNoise: number;
  finishVignette: number;
  imageFormat: DitherImageExportFormat;
  imageResolution: ToolcraftImageExportResolution;
  includeBackground: boolean;
  layerOpacity: number;
  scatter: number;
  seed: number;
  size: number;
  style: DitherEffectStyle;
  toneBrightness: number;
  toneContrast: number;
  toneHue: number;
  toneSaturation: number;
};

export type DitherRenderDimensions = {
  cssHeight: number;
  cssWidth: number;
  pixelHeight: number;
  pixelWidth: number;
};

export type RenderDitherImageOptions = DitherRenderDimensions & {
  engine?: import("./dither-effect").DitherRenderEngine;
  settings: DitherRenderSettings;
  sourceImage?: CanvasImageSource | null;
  target: HTMLCanvasElement;
};

export type DrawDitherOutputOptions = DitherRenderDimensions & {
  renderMode?: DitherRenderMode;
  settings: DitherRenderSettings;
  sourceImage?: CanvasImageSource | null;
  targetContext: CanvasRenderingContext2D;
};

