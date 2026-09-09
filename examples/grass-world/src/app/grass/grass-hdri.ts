export type GrassHdriPresetId =
  | "alps"
  | "blendSunset"
  | "forest"
  | "golden"
  | "hardSun"
  | "meadow"
  | "overcast"
  | "sunrise";

export type GrassHdriSource = Readonly<{
  cacheKey: string;
  fileName: string;
  kind: "custom" | "preset";
  url: string;
}>;

export type GrassEnvironmentLightingTuning = Readonly<{
  ambient: number;
  environmentFill: number;
  exposure: number;
  key: number;
  rim: number;
  stylizedContrast: number;
}>;

const neutralLightingTuning: GrassEnvironmentLightingTuning = {
  ambient: 1,
  environmentFill: 1,
  exposure: 1,
  key: 1,
  rim: 1,
  stylizedContrast: 0,
};

const hardSunLightingTuning: GrassEnvironmentLightingTuning = {
  ambient: 0.48,
  environmentFill: 0.62,
  exposure: 1.5,
  key: 1.75,
  rim: 0.28,
  stylizedContrast: 0.9,
};

const grassHdriPresets = {
  alps: {
    fileName: "alps_field_1k.hdr",
    label: "Alps",
    preview: new URL("./assets/hdri/alps_field.webp", import.meta.url).href,
    url: new URL("./assets/hdri/alps_field_1k.hdr", import.meta.url).href,
  },
  blendSunset: {
    fileName: "blend_sunset_2k.hdr",
    label: "Blend Sunset",
    preview: new URL("./assets/hdri/blend_sunset.webp", import.meta.url).href,
    url: new URL("./assets/hdri/blend_sunset_2k.hdr", import.meta.url).href,
  },
  forest: {
    fileName: "hochsal_forest_1k.hdr",
    label: "Forest Shade",
    preview: new URL("./assets/hdri/hochsal_forest.webp", import.meta.url).href,
    url: new URL("./assets/hdri/hochsal_forest_1k.hdr", import.meta.url).href,
  },
  golden: {
    fileName: "grasslands_sunset_1k.hdr",
    label: "Golden Sunset",
    preview: new URL("./assets/hdri/grasslands_sunset.webp", import.meta.url)
      .href,
    url: new URL("./assets/hdri/grasslands_sunset_1k.hdr", import.meta.url)
      .href,
  },
  hardSun: {
    fileName: "qwantani_noon_puresky_1k.hdr",
    label: "Hard Sun",
    preview: new URL("./assets/hdri/qwantani_noon_puresky.webp", import.meta.url)
      .href,
    url: new URL(
      "./assets/hdri/qwantani_noon_puresky_1k.hdr",
      import.meta.url,
    ).href,
  },
  meadow: {
    fileName: "meadow_2_1k.hdr",
    label: "Meadow",
    preview: new URL("./assets/hdri/meadow_2.webp", import.meta.url).href,
    url: new URL("./assets/hdri/meadow_2_1k.hdr", import.meta.url).href,
  },
  overcast: {
    fileName: "belfast_open_field_1k.hdr",
    label: "Overcast Field",
    preview: new URL("./assets/hdri/belfast_open_field.webp", import.meta.url)
      .href,
    url: new URL("./assets/hdri/belfast_open_field_1k.hdr", import.meta.url)
      .href,
  },
  sunrise: {
    fileName: "bloem_field_sunrise_1k.hdr",
    label: "Sunrise",
    preview: new URL("./assets/hdri/bloem_field_sunrise.webp", import.meta.url)
      .href,
    url: new URL("./assets/hdri/bloem_field_sunrise_1k.hdr", import.meta.url)
      .href,
  },
} as const;

const grassHdriPresetOrder = [
  "meadow",
  "alps",
  "sunrise",
  "hardSun",
  "overcast",
  "forest",
  "golden",
  "blendSunset",
] as const satisfies readonly GrassHdriPresetId[];

export const grassHdriPickerItems = grassHdriPresetOrder.map((value) => {
  const preset = grassHdriPresets[value];
  return {
    alt: `${preset.label} HDRI environment`,
    src: preset.preview,
    value,
  };
});

export function getGrassHdriPresetSource(
  presetId: GrassHdriPresetId,
): GrassHdriSource {
  const preset = grassHdriPresets[presetId];
  return {
    cacheKey: `preset:${presetId}`,
    fileName: preset.fileName,
    kind: "preset",
    url: preset.url,
  };
}

export function getGrassEnvironmentLightingTuning(
  source: GrassHdriSource,
): GrassEnvironmentLightingTuning {
  return source.kind === "preset" && source.cacheKey === "preset:hardSun"
    ? hardSunLightingTuning
    : neutralLightingTuning;
}
