import type { ToolcraftCanvasSize, ToolcraftMediaAsset } from "@/toolcraft/runtime";

export const ditherSourceImageTarget = "source.image";

const ditherBaseUrl = import.meta.env ? import.meta.env.BASE_URL : "/";

export const ditherDefaultCanvasSize = {
  height: 2048,
  unit: "px",
  width: 2048,
} as const satisfies ToolcraftCanvasSize;

export const ditherDefaultSourceMediaAsset = {
  assetKind: "image",
  dataUrl: `${ditherBaseUrl}assets/lyonecho-blog-cover-art.png`,
  fileName: "Lyonecho Blog Cover Art.png",
  id: "dither-default-source",
  layerId: "dither-default-source-layer",
  mimeType: "image/png",
  position: { x: 0, y: 0 },
  size: ditherDefaultCanvasSize,
  sourceTarget: ditherSourceImageTarget,
} as const satisfies ToolcraftMediaAsset;

export const ditherDefaultValues = {
  appearanceBackground: { hex: "#050505" },
  asciiCustomGlyphs: "",
  asciiGlyphs: "hacker",
  asciiMode: "filled",
  duotoneBase: { hex: "#090A13" },
  duotonePixels: { hex: "#F7C66C" },
  duotonePreset: "off",
  effectDensity: 8,
  effectExposure: 189,
  effectFill: 81,
  effectLayerBlend: "source-over",
  effectLayerOpacity: 100,
  effectScatter: 66,
  effectSeed: 999,
  effectSize: 1,
  effectStyle: "dots",
  exportImageFormat: "png",
  exportImageResolution: "4k",
  exportIncludeBackground: true,
  finishGlow: 0,
  finishGrain: 22,
  finishNoise: 0,
  finishVignette: 0,
  sourceImage: [] as readonly string[],
  toneBrightness: 108,
  toneContrast: 100,
  toneHue: 0,
  toneSaturation: 100,
} as const;
