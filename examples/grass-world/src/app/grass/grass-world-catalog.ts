import type { GrassHdriPreset } from "./grass-defaults";
import type { GrassScanLayerKind } from "./grass-scan-contract";
import type { GrassWorldRange } from "./grass-world-topologies";

export type { GrassWorldRange } from "./grass-world-topologies";

export const grassScaleVariations = [
  0.75, 0.83, 0.91, 1, 1.09, 1.17, 1.2,
] as const;
export const grassAbundanceVariations = [
  0.72, 0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28,
] as const;

export type GrassTerrainMorphology = Readonly<{
  detail: GrassWorldRange;
  edgeIrregularity: GrassWorldRange;
  height: GrassWorldRange;
  id: string;
  levels: readonly [GrassWorldRange, GrassWorldRange];
  roughness: GrassWorldRange;
  roundness: GrassWorldRange;
  scale: GrassWorldRange;
  topFacing: boolean;
}>;

export type GrassVegetationBalance = Readonly<{
  id: string;
  lawnDensity: GrassWorldRange;
  lawnEnabled: boolean;
  lawnHeight: readonly [GrassWorldRange, GrassWorldRange];
  lawnSpacing: GrassWorldRange;
  tallDensity: GrassWorldRange;
  tallEnabled: boolean;
  tallHeight: readonly [GrassWorldRange, GrassWorldRange];
  tallSpacing: GrassWorldRange;
}>;

export type GrassFeatureComposition = Readonly<{
  boulder: boolean;
  clumping: GrassWorldRange;
  countFraction: GrassWorldRange;
  id: string;
  sizeFraction: GrassWorldRange;
  visible: readonly GrassScanLayerKind[];
}>;

export type GrassSurfacePalette = Readonly<{
  background: string;
  fill: string;
  grass: readonly [dark: string, middle: string, light: string, tip: string];
  id: string;
  key: string;
  presets: readonly GrassHdriPreset[];
  rim: string;
  stone: string;
  surface: string;
}>;

export type GrassEcologyVariation = Readonly<{
  brightness: GrassWorldRange;
  contrast: GrassWorldRange;
  edgeFade: GrassWorldRange;
  id: string;
  normalStrength: GrassWorldRange;
  roughness: GrassWorldRange;
  saturation: GrassWorldRange;
  scanAbundance: number;
  sheen: GrassWorldRange;
}>;

export const grassTerrainMorphologies = [
  {
    detail: [1, 2],
    edgeIrregularity: [0, 5],
    height: [0.12, 0.38],
    id: "soft-mound",
    levels: [
      [0, 8],
      [88, 100],
    ],
    roughness: [12, 30],
    roundness: [78, 100],
    scale: [0.45, 0.9],
    topFacing: false,
  },
  {
    detail: [2, 3],
    edgeIrregularity: [2, 10],
    height: [0.35, 0.75],
    id: "rolling",
    levels: [
      [2, 16],
      [80, 96],
    ],
    roughness: [28, 48],
    roundness: [60, 92],
    scale: [0.28, 0.62],
    topFacing: false,
  },
  {
    detail: [3, 4],
    edgeIrregularity: [4, 14],
    height: [0.65, 1.15],
    id: "folded",
    levels: [
      [8, 24],
      [72, 90],
    ],
    roughness: [40, 62],
    roundness: [42, 82],
    scale: [0.2, 0.48],
    topFacing: false,
  },
  {
    detail: [4, 6],
    edgeIrregularity: [8, 20],
    height: [1.0, 1.7],
    id: "rugged",
    levels: [
      [14, 32],
      [65, 84],
    ],
    roughness: [55, 78],
    roundness: [28, 72],
    scale: [0.14, 0.38],
    topFacing: true,
  },
  {
    detail: [2, 4],
    edgeIrregularity: [10, 24],
    height: [1.5, 2.25],
    id: "highland",
    levels: [
      [20, 40],
      [60, 80],
    ],
    roughness: [48, 74],
    roundness: [18, 58],
    scale: [0.1, 0.3],
    topFacing: true,
  },
  {
    detail: [3, 5],
    edgeIrregularity: [14, 28],
    height: [2.1, 3],
    id: "peak",
    levels: [
      [28, 46],
      [56, 74],
    ],
    roughness: [62, 88],
    roundness: [8, 42],
    scale: [0.08, 0.22],
    topFacing: true,
  },
  {
    detail: [2, 4],
    edgeIrregularity: [16, 30],
    height: [0.7, 1.35],
    id: "weathered-square",
    levels: [
      [10, 26],
      [70, 88],
    ],
    roughness: [38, 68],
    roundness: [0, 22],
    scale: [0.2, 0.52],
    topFacing: false,
  },
  {
    detail: [3, 6],
    edgeIrregularity: [5, 18],
    height: [0.9, 1.8],
    id: "basin",
    levels: [
      [18, 38],
      [62, 82],
    ],
    roughness: [50, 82],
    roundness: [70, 100],
    scale: [0.12, 0.34],
    topFacing: true,
  },
  {
    detail: [1, 3],
    edgeIrregularity: [0, 12],
    height: [0.2, 0.6],
    id: "plateau",
    levels: [
      [30, 48],
      [52, 70],
    ],
    roughness: [18, 42],
    roundness: [35, 75],
    scale: [0.35, 0.8],
    topFacing: true,
  },
] as const satisfies readonly GrassTerrainMorphology[];

export const grassVegetationBalances = [
  {
    id: "lawn-carpet",
    lawnDensity: [25_000, 30_000],
    lawnEnabled: true,
    lawnHeight: [
      [0.04, 0.08],
      [0.1, 0.16],
    ],
    lawnSpacing: [0.015, 0.024],
    tallDensity: [2_000, 5_000],
    tallEnabled: true,
    tallHeight: [
      [0.2, 0.34],
      [0.45, 0.72],
    ],
    tallSpacing: [0.075, 0.14],
  },
  {
    id: "balanced-meadow",
    lawnDensity: [17_000, 26_000],
    lawnEnabled: true,
    lawnHeight: [
      [0.05, 0.1],
      [0.14, 0.24],
    ],
    lawnSpacing: [0.018, 0.035],
    tallDensity: [7_000, 13_000],
    tallEnabled: true,
    tallHeight: [
      [0.24, 0.42],
      [0.62, 1.0],
    ],
    tallSpacing: [0.04, 0.08],
  },
  {
    id: "tall-field",
    lawnDensity: [8_000, 15_000],
    lawnEnabled: true,
    lawnHeight: [
      [0.07, 0.12],
      [0.16, 0.28],
    ],
    lawnSpacing: [0.03, 0.055],
    tallDensity: [13_000, 20_000],
    tallEnabled: true,
    tallHeight: [
      [0.34, 0.58],
      [0.9, 1.55],
    ],
    tallSpacing: [0.03, 0.065],
  },
  {
    id: "wild-thicket",
    lawnDensity: [2_000, 7_000],
    lawnEnabled: false,
    lawnHeight: [
      [0.05, 0.1],
      [0.12, 0.2],
    ],
    lawnSpacing: [0.04, 0.08],
    tallDensity: [16_000, 24_000],
    tallEnabled: true,
    tallHeight: [
      [0.45, 0.75],
      [1.25, 2.2],
    ],
    tallSpacing: [0.025, 0.055],
  },
  {
    id: "short-pasture",
    lawnDensity: [22_000, 30_000],
    lawnEnabled: true,
    lawnHeight: [
      [0.04, 0.07],
      [0.09, 0.14],
    ],
    lawnSpacing: [0.015, 0.028],
    tallDensity: [5_000, 9_000],
    tallEnabled: true,
    tallHeight: [
      [0.2, 0.3],
      [0.4, 0.65],
    ],
    tallSpacing: [0.055, 0.1],
  },
  {
    id: "sparse-alpine",
    lawnDensity: [5_000, 12_000],
    lawnEnabled: true,
    lawnHeight: [
      [0.05, 0.09],
      [0.12, 0.2],
    ],
    lawnSpacing: [0.045, 0.085],
    tallDensity: [2_500, 7_000],
    tallEnabled: true,
    tallHeight: [
      [0.18, 0.3],
      [0.4, 0.72],
    ],
    tallSpacing: [0.08, 0.16],
  },
  {
    id: "lawn-only",
    lawnDensity: [26_000, 30_000],
    lawnEnabled: true,
    lawnHeight: [
      [0.06, 0.1],
      [0.14, 0.22],
    ],
    lawnSpacing: [0.015, 0.026],
    tallDensity: [1_500, 4_000],
    tallEnabled: false,
    tallHeight: [
      [0.2, 0.35],
      [0.5, 0.8],
    ],
    tallSpacing: [0.08, 0.15],
  },
  {
    id: "mixed-tufts",
    lawnDensity: [12_000, 21_000],
    lawnEnabled: true,
    lawnHeight: [
      [0.08, 0.14],
      [0.2, 0.34],
    ],
    lawnSpacing: [0.025, 0.05],
    tallDensity: [9_000, 16_000],
    tallEnabled: true,
    tallHeight: [
      [0.3, 0.52],
      [0.76, 1.3],
    ],
    tallSpacing: [0.04, 0.085],
  },
] as const satisfies readonly GrassVegetationBalance[];

export const grassFeatureCompositions = [
  {
    boulder: false,
    clumping: [8, 32],
    countFraction: [0.08, 0.24],
    id: "quiet",
    sizeFraction: [0.08, 0.25],
    visible: ["white"],
  },
  {
    boulder: false,
    clumping: [12, 48],
    countFraction: [0.2, 0.55],
    id: "flower-field",
    sizeFraction: [0.1, 0.34],
    visible: ["white", "yellow", "wild"],
  },
  {
    boulder: false,
    clumping: [40, 78],
    countFraction: [0.22, 0.62],
    id: "tuft-groups",
    sizeFraction: [0.18, 0.46],
    visible: ["tufted", "wild"],
  },
  {
    boulder: true,
    clumping: [4, 30],
    countFraction: [0.06, 0.25],
    id: "rocky",
    sizeFraction: [0.28, 0.68],
    visible: ["rocks", "yellow"],
  },
  {
    boulder: true,
    clumping: [25, 62],
    countFraction: [0.12, 0.38],
    id: "stone-garden",
    sizeFraction: [0.18, 0.52],
    visible: ["rocks", "white", "tufted"],
  },
  {
    boulder: false,
    clumping: [55, 90],
    countFraction: [0.3, 0.72],
    id: "wild-abundance",
    sizeFraction: [0.2, 0.58],
    visible: ["tufted", "wild", "white", "yellow"],
  },
  {
    boulder: true,
    clumping: [18, 58],
    countFraction: [0.15, 0.48],
    id: "mixed-ecology",
    sizeFraction: [0.12, 0.48],
    visible: ["tufted", "wild", "white", "yellow", "rocks"],
  },
] as const satisfies readonly GrassFeatureComposition[];

export const grassSurfacePalettes = [
  {
    background: "#040806",
    fill: "#315e50",
    grass: ["#10291e", "#31583a", "#71934e", "#d3e58a"],
    id: "moss",
    key: "#eef5c9",
    presets: ["forest", "overcast", "meadow"],
    rim: "#a8c783",
    stone: "#abb3a5",
    surface: "#294b2d",
  },
  {
    background: "#080b05",
    fill: "#47704c",
    grass: ["#153522", "#47743a", "#9fbd50", "#f0f29a"],
    id: "spring",
    key: "#fff0aa",
    presets: ["meadow", "sunrise", "alps"],
    rim: "#d5d77d",
    stone: "#c6cbb9",
    surface: "#3d6c32",
  },
  {
    background: "#020907",
    fill: "#245f58",
    grass: ["#0c2d24", "#245e3e", "#6ea34f", "#d7e77c"],
    id: "deep-green",
    key: "#dcecb0",
    presets: ["forest", "meadow", "overcast"],
    rim: "#a2ca78",
    stone: "#9fa99c",
    surface: "#214b32",
  },
  {
    background: "#0b0d11",
    fill: "#405c72",
    grass: ["#1a3025", "#445a35", "#7f8845", "#c8c876"],
    id: "alpine",
    key: "#ffe4b0",
    presets: ["alps", "hardSun", "overcast"],
    rim: "#d6a66d",
    stone: "#c5c8be",
    surface: "#48533a",
  },
  {
    background: "#110904",
    fill: "#6c4d34",
    grass: ["#2d2b16", "#6f6330", "#ad9940", "#eadb7b"],
    id: "golden",
    key: "#ffd38a",
    presets: ["golden", "blendSunset", "hardSun"],
    rim: "#ef9e58",
    stone: "#b9aa91",
    surface: "#665b32",
  },
  {
    background: "#06080d",
    fill: "#33485f",
    grass: ["#13272a", "#315052", "#6d8771", "#c7d6a0"],
    id: "cool",
    key: "#dce8ff",
    presets: ["overcast", "alps", "forest"],
    rim: "#88a9c5",
    stone: "#aebbc2",
    surface: "#344d43",
  },
  {
    background: "#100608",
    fill: "#68404b",
    grass: ["#2a211d", "#605032", "#9a7d42", "#e6c780"],
    id: "sunset",
    key: "#ffc6a0",
    presets: ["blendSunset", "sunrise", "golden"],
    rim: "#e97962",
    stone: "#c0aaa3",
    surface: "#584733",
  },
] as const satisfies readonly GrassSurfacePalette[];

export const grassEcologyVariations = [
  {
    brightness: [88, 112],
    contrast: [92, 124],
    edgeFade: [8, 18],
    id: "soft",
    normalStrength: [65, 100],
    roughness: [82, 108],
    saturation: [42, 78],
    scanAbundance: 0.72,
    sheen: [15, 38],
  },
  {
    brightness: [98, 126],
    contrast: [104, 142],
    edgeFade: [10, 24],
    id: "lush",
    normalStrength: [88, 128],
    roughness: [68, 92],
    saturation: [72, 118],
    scanAbundance: 1.12,
    sheen: [32, 62],
  },
  {
    brightness: [72, 102],
    contrast: [118, 168],
    edgeFade: [5, 16],
    id: "dramatic",
    normalStrength: [110, 150],
    roughness: [72, 102],
    saturation: [48, 92],
    scanAbundance: 0.88,
    sheen: [18, 48],
  },
  {
    brightness: [82, 108],
    contrast: [96, 136],
    edgeFade: [16, 32],
    id: "misty",
    normalStrength: [55, 92],
    roughness: [90, 120],
    saturation: [28, 64],
    scanAbundance: 0.78,
    sheen: [8, 28],
  },
  {
    brightness: [92, 118],
    contrast: [128, 178],
    edgeFade: [6, 20],
    id: "crisp",
    normalStrength: [118, 150],
    roughness: [58, 88],
    saturation: [60, 108],
    scanAbundance: 0.94,
    sheen: [28, 58],
  },
  {
    brightness: [76, 104],
    contrast: [108, 152],
    edgeFade: [12, 28],
    id: "weathered",
    normalStrength: [95, 138],
    roughness: [92, 125],
    saturation: [22, 58],
    scanAbundance: 0.64,
    sheen: [5, 24],
  },
  {
    brightness: [104, 132],
    contrast: [112, 154],
    edgeFade: [8, 22],
    id: "radiant",
    normalStrength: [82, 122],
    roughness: [62, 92],
    saturation: [88, 138],
    scanAbundance: 1.22,
    sheen: [38, 70],
  },
  {
    brightness: [86, 116],
    contrast: [100, 146],
    edgeFade: [18, 36],
    id: "natural",
    normalStrength: [72, 118],
    roughness: [76, 108],
    saturation: [52, 96],
    scanAbundance: 1,
    sheen: [20, 52],
  },
] as const satisfies readonly GrassEcologyVariation[];
