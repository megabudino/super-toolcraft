export type GrassWorldRange = readonly [minimum: number, maximum: number];

export type GrassCoverageTopology = Readonly<{
  detail: GrassWorldRange;
  id: string;
  lawnRelation: "complement" | "offset" | "shared";
  levels: readonly [GrassWorldRange, GrassWorldRange];
  macroInfluence: number;
  roughness: GrassWorldRange;
  scale: GrassWorldRange;
  scanRelation: "clearings" | "edges" | "islands";
  transform:
    | "bands"
    | "broad"
    | "fragmented"
    | "islands"
    | "ridges"
    | "sparse"
    | "split";
}>;

export const grassCoverageTopologies = [
  {
    detail: [1, 3],
    id: "broad-cover",
    lawnRelation: "shared",
    levels: [
      [0, 16],
      [68, 88],
    ],
    macroInfluence: 0.72,
    roughness: [25, 52],
    scale: [0.22, 0.52],
    scanRelation: "edges",
    transform: "broad",
  },
  {
    detail: [2, 5],
    id: "meadow-islands",
    lawnRelation: "complement",
    levels: [
      [18, 36],
      [58, 76],
    ],
    macroInfluence: 0.9,
    roughness: [42, 72],
    scale: [0.14, 0.42],
    scanRelation: "islands",
    transform: "islands",
  },
  {
    detail: [2, 4],
    id: "wind-bands",
    lawnRelation: "offset",
    levels: [
      [14, 30],
      [62, 82],
    ],
    macroInfluence: 0.84,
    roughness: [32, 62],
    scale: [0.18, 0.48],
    scanRelation: "edges",
    transform: "bands",
  },
  {
    detail: [3, 6],
    id: "broken-ridges",
    lawnRelation: "complement",
    levels: [
      [24, 45],
      [56, 76],
    ],
    macroInfluence: 0.88,
    roughness: [55, 88],
    scale: [0.1, 0.32],
    scanRelation: "clearings",
    transform: "ridges",
  },
  {
    detail: [4, 6],
    id: "fragmented-mosaic",
    lawnRelation: "offset",
    levels: [
      [28, 48],
      [55, 72],
    ],
    macroInfluence: 0.96,
    roughness: [62, 90],
    scale: [0.08, 0.28],
    scanRelation: "islands",
    transform: "fragmented",
  },
  {
    detail: [1, 3],
    id: "sparse-highlands",
    lawnRelation: "complement",
    levels: [
      [46, 64],
      [72, 90],
    ],
    macroInfluence: 0.98,
    roughness: [20, 48],
    scale: [0.42, 1.1],
    scanRelation: "clearings",
    transform: "sparse",
  },
  {
    detail: [2, 5],
    id: "split-clearing",
    lawnRelation: "shared",
    levels: [
      [20, 40],
      [60, 82],
    ],
    macroInfluence: 0.9,
    roughness: [38, 74],
    scale: [0.16, 0.46],
    scanRelation: "edges",
    transform: "split",
  },
] as const satisfies readonly GrassCoverageTopology[];
