import {
  createMeshPointLayout,
  type MeshPoint,
  type MeshPointLayout,
} from "./mesh-model";

export const MESH_CUSTOM_PRESET_ID = "custom";

export type MeshPreset = Readonly<{
  colors: readonly string[];
  columns: number;
  id: string;
  layout: MeshPointLayout;
  name: string;
  thumbnail: string;
}>;

type MeshPresetSpec = Readonly<{
  columns: number;
  id: string;
  indices: readonly number[];
  name: string;
  palette: readonly string[];
  phase: number;
  warpX: number;
  warpY: number;
}>;

function createPresetPoints(
  count: number,
  columns: number,
  phase: number,
  warpX: number,
  warpY: number,
): MeshPoint[] {
  const rows = count / columns;
  return Array.from({ length: count }, (_, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const baseX = column / (columns - 1);
    const baseY = row / (rows - 1);
    const x =
      column === 0 || column === columns - 1
        ? baseX
        : baseX + Math.sin(phase + row * 1.37 + column * 0.83) * warpX;
    const y =
      row === 0 || row === rows - 1
        ? baseY
        : baseY + Math.cos(phase * 0.73 + row * 1.11 - column * 0.69) * warpY;
    return { x, y };
  });
}

function createPresetThumbnail(
  colors: readonly string[],
  layout: MeshPointLayout,
): string {
  const circles = layout.points
    .map((point, index) => {
      const x = Math.round(point.x * 320);
      const y = Math.round(point.y * 240);
      return `<circle cx="${x}" cy="${y}" r="92" fill="${colors[index]}" opacity=".88"/>`;
    })
    .join("");
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240">',
    '<defs><filter id="b" x="-40%" y="-40%" width="180%" height="180%">',
    '<feGaussianBlur stdDeviation="34"/></filter></defs>',
    `<rect width="320" height="240" fill="${colors[0]}"/>`,
    `<g filter="url(#b)">${circles}</g>`,
    '<rect width="320" height="240" fill="none" stroke="#fff" stroke-opacity=".08"/>',
    "</svg>",
  ].join("");
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function createPreset(spec: MeshPresetSpec): MeshPreset {
  const colors = spec.indices.map((index) => spec.palette[index % spec.palette.length]!);
  if (colors.length % spec.columns !== 0) {
    throw new Error(`Mesh preset ${spec.id} must use a rectangular topology.`);
  }
  const layout = createMeshPointLayout(
    createPresetPoints(
      colors.length,
      spec.columns,
      spec.phase,
      spec.warpX,
      spec.warpY,
    ),
    spec.columns,
  );
  return {
    colors,
    columns: spec.columns,
    id: spec.id,
    layout,
    name: spec.name,
    thumbnail: createPresetThumbnail(colors, layout),
  };
}

const meshPresetSpecs = [
  {
    columns: 4,
    id: "aurora",
    indices: [0, 1, 2, 3, 1, 4, 3, 0, 2, 3, 4, 1],
    name: "Aurora",
    palette: ["#071A2B", "#2563EB", "#22D3EE", "#A855F7", "#34D399"],
    phase: 0.3,
    warpX: 0.12,
    warpY: 0.14,
  },
  {
    columns: 4,
    id: "sunset",
    indices: [4, 3, 2, 1, 3, 0, 1, 2, 4, 3, 0, 1],
    name: "Sunset",
    palette: ["#FF3D81", "#FF7A1A", "#FFD166", "#7C3AED", "#24102F"],
    phase: 1.15,
    warpX: 0.16,
    warpY: 0.1,
  },
  {
    columns: 3,
    id: "lagoon",
    indices: [0, 1, 2, 3, 4, 1, 2, 0, 3],
    name: "Lagoon",
    palette: ["#002B5B", "#00A8E8", "#00E5C0", "#B8F2E6", "#006D77"],
    phase: 2.1,
    warpX: 0.18,
    warpY: 0.16,
  },
  {
    columns: 5,
    id: "sorbet",
    indices: [0, 1, 2, 3, 4, 2, 4, 0, 1, 3, 4, 2, 3, 0, 1],
    name: "Sorbet",
    palette: ["#FF8FAB", "#FFD6A5", "#FDFFB6", "#9BF6FF", "#BDB2FF"],
    phase: 2.85,
    warpX: 0.1,
    warpY: 0.18,
  },
  {
    columns: 4,
    id: "ember",
    indices: [0, 0, 1, 2, 0, 1, 3, 2, 1, 3, 4, 2, 0, 1, 3, 4],
    name: "Ember",
    palette: ["#090909", "#7F1D1D", "#EF4444", "#FF8A00", "#FFF1C1"],
    phase: 3.7,
    warpX: 0.13,
    warpY: 0.13,
  },
  {
    columns: 4,
    id: "glacier",
    indices: [4, 3, 2, 1, 3, 2, 0, 1, 4, 3, 1, 0],
    name: "Glacier",
    palette: ["#F8FAFC", "#BAE6FD", "#38BDF8", "#1D4ED8", "#071B3A"],
    phase: 4.4,
    warpX: 0.14,
    warpY: 0.09,
  },
  {
    columns: 3,
    id: "forest",
    indices: [0, 1, 2, 1, 3, 4, 2, 4, 0, 3, 1, 2],
    name: "Forest",
    palette: ["#071F13", "#14532D", "#22C55E", "#84CC16", "#FDE047"],
    phase: 5.25,
    warpX: 0.17,
    warpY: 0.12,
  },
  {
    columns: 4,
    id: "plasma",
    indices: [0, 1, 2, 3, 4, 2, 0, 1, 3, 4, 1, 2],
    name: "Plasma",
    palette: ["#17003C", "#5B21B6", "#D946EF", "#FF2E93", "#22D3EE"],
    phase: 6.05,
    warpX: 0.15,
    warpY: 0.17,
  },
  {
    columns: 5,
    id: "dune",
    indices: [0, 1, 2, 3, 4, 1, 3, 4, 0, 2, 4, 2, 0, 1, 3],
    name: "Dune",
    palette: ["#2B1B13", "#7C4A2D", "#C47A44", "#F1C27D", "#FFF0D3"],
    phase: 6.8,
    warpX: 0.11,
    warpY: 0.15,
  },
  {
    columns: 4,
    id: "nocturne",
    indices: [0, 0, 1, 2, 0, 3, 4, 1, 2, 4, 3, 0],
    name: "Nocturne",
    palette: ["#030712", "#111827", "#334155", "#C4B5FD", "#F8FAFC"],
    phase: 7.55,
    warpX: 0.16,
    warpY: 0.11,
  },
  {
    columns: 4,
    id: "citrus",
    indices: [0, 1, 2, 3, 1, 2, 3, 4, 0, 2, 4, 1],
    name: "Citrus",
    palette: ["#061A12", "#2563EB", "#84CC16", "#FACC15", "#F8FAFC"],
    phase: 8.3,
    warpX: 0.14,
    warpY: 0.16,
  },
  {
    columns: 3,
    id: "iris",
    indices: [0, 1, 2, 3, 4, 1, 2, 3, 0, 4, 2, 1, 0, 3, 4],
    name: "Iris",
    palette: ["#14001F", "#4C1D95", "#8B5CF6", "#E9D5FF", "#FB7185"],
    phase: 9.1,
    warpX: 0.18,
    warpY: 0.1,
  },
] as const satisfies readonly MeshPresetSpec[];

export const MESH_PRESETS = meshPresetSpecs.map(createPreset);

export const MESH_PRESET_PICKER_ITEMS = MESH_PRESETS.map((preset) => ({
  alt: preset.name,
  src: preset.thumbnail,
  value: preset.id,
}));

export function getMeshPreset(value: unknown): MeshPreset | null {
  return typeof value === "string"
    ? (MESH_PRESETS.find((preset) => preset.id === value) ?? null)
    : null;
}

export function getMeshTopologySignature({
  colors,
  columns,
  layout,
}: {
  colors: readonly string[];
  columns: number;
  layout: Pick<MeshPointLayout, "handles" | "points">;
}): string {
  return JSON.stringify([colors, columns, layout.points, layout.handles]);
}
