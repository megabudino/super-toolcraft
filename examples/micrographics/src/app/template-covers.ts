export type MicrographCoverPreset = {
  readonly id: string;
  readonly label: string;
  readonly src: string;
};

const assetBase = import.meta.env?.BASE_URL ?? "/";

export const micrographCoverPresets: readonly MicrographCoverPreset[] = [
  {
    id: "atlas",
    label: "Runner",
    src: `${assetBase}covers/runner-close-crop.jpg`,
  },
  {
    id: "profile",
    label: "Profile",
    src: `${assetBase}covers/side-profile.jpg`,
  },
  {
    id: "fitness",
    label: "Fitness",
    src: `${assetBase}covers/fitness-explore.jpg`,
  },
  {
    id: "pilates",
    label: "Pilates",
    src: `${assetBase}covers/pilates-group.jpg`,
  },
  { id: "mesh", label: "Mesh", src: `${assetBase}covers/mesh.jpg` },
  { id: "chaos", label: "Chaos", src: `${assetBase}covers/chaos-blue.jpg` },
  { id: "paper", label: "Paper", src: `${assetBase}covers/cream-paper.jpg` },
  {
    id: "wireframe",
    label: "Wireframe",
    src: `${assetBase}covers/wireframe-landscape.jpg`,
  },
];

export function normalizeCoverPresetId(value: unknown): string {
  const preset =
    typeof value === "string"
      ? micrographCoverPresets.find((entry) => entry.id === value)
      : undefined;
  return preset?.id ?? micrographCoverPresets[0]?.id ?? "";
}

export function coverPresetSrc(value: unknown): string | null {
  const normalizedValue = normalizeCoverPresetId(value);
  const preset = micrographCoverPresets.find((entry) => entry.id === normalizedValue);
  return preset ? preset.src : null;
}

export const micrographPosterFormats = [
  { height: 1350, label: "4:5", value: "format-45", width: 1080 },
  { height: 1620, label: "2:3", value: "format-23", width: 1080 },
  { height: 1920, label: "9:16", value: "format-916", width: 1080 },
] as const;
