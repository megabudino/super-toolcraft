export const flameDefaults = {
  layout: "center" as const,
  columns: 50,
  depth: 10,
  border: 5,
  noise: 20,
  core: 25,
  dark: "#2724FF",
  middle: "#576DFF",
  light: "#C7E8FF",
  background: "#EEEBFF",
};

export const envelopeDefaults = {
  top: [0.1, 0.2, 0.15, 0.1, 0.15, 0.2, 0.1],
  mid: [0.4, 0.5, 0.45, 0.5, 0.45, 0.5, 0.4],
  bottom: [0.8, 0.9, 0.85, 0.9, 0.85, 0.9, 0.8],
};
export type EnvelopeLine = keyof typeof envelopeDefaults;
export type FlameLayout = "center" | "top-down";
export const geometryTargets = ["flame.columns", "flame.depth", "flame.noise", "flame.layout", "flame.envelopes", "flame.seed"] as const;
export const paintTargets = ["flame.dark", "flame.middle", "flame.light", "flame.border", "flame.core"] as const;

export type FlameSettings = {
  layout: FlameLayout; columns: number; depth: number; border: number; noise: number; core: number;
  dark: string; middle: string; light: string;
  seed: number; envelopes: Record<EnvelopeLine, readonly number[]>;
};

export function readFlameSettings(values: Readonly<Record<string, unknown>>): FlameSettings {
  return {
    layout: (values["flame.layout"] ?? flameDefaults.layout) as FlameLayout,
    columns: (values["flame.columns"] ?? flameDefaults.columns) as number,
    depth: (values["flame.depth"] ?? flameDefaults.depth) as number,
    border: (values["flame.border"] ?? flameDefaults.border) as number,
    noise: (values["flame.noise"] ?? flameDefaults.noise) as number,
    core: (values["flame.core"] ?? flameDefaults.core) as number,
    dark: (values["flame.dark"] ?? flameDefaults.dark) as string,
    middle: (values["flame.middle"] ?? flameDefaults.middle) as string,
    light: (values["flame.light"] ?? flameDefaults.light) as string,
    seed: (values["flame.seed"] ?? 1729) as number,
    envelopes: (values["flame.envelopes"] ?? envelopeDefaults) as FlameSettings["envelopes"],
  };
}
