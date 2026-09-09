export const grassScanLayerKinds = [
  "tufted",
  "wild",
  "white",
  "yellow",
  "rocks",
] as const;

export type GrassScanLayerKind = (typeof grassScanLayerKinds)[number];

export const grassScanLayerContracts = {
  rocks: {
    baseSize: 0.22,
    countMax: 1000,
    noun: "small rocks",
    sizeMax: 2.2,
    sizeMin: 0.35,
    title: "Small Rocks",
    variantCount: 5,
  },
  tufted: {
    baseSize: 0.5,
    countMax: 1000,
    noun: "tufted grass",
    sizeMax: 2,
    sizeMin: 0.35,
    title: "Tufted Grass",
    variantCount: 3,
  },
  white: {
    baseSize: 0.7,
    countMax: 1000,
    noun: "white flowers",
    sizeMax: 1.8,
    sizeMin: 0.35,
    title: "White Flowers",
    variantCount: 4,
  },
  wild: {
    baseSize: 0.3,
    countMax: 1000,
    noun: "wild grass",
    sizeMax: 1.8,
    sizeMin: 0.35,
    title: "Wild Grass",
    variantCount: 3,
  },
  yellow: {
    baseSize: 0.62,
    countMax: 1000,
    noun: "yellow flowers",
    sizeMax: 1.8,
    sizeMin: 0.35,
    title: "Yellow Flowers",
    variantCount: 4,
  },
} as const satisfies Record<
  GrassScanLayerKind,
  Readonly<{
    baseSize: number;
    countMax: number;
    noun: string;
    sizeMax: number;
    sizeMin: number;
    title: string;
    variantCount: number;
  }>
>;
