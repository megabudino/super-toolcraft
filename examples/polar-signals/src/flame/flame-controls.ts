import type { ToolcraftControlSchema } from "@/toolcraft/runtime";
import { flameDefaults } from "./flame-defaults";

const live = { applicability: { mode: "always" }, keyframeable: false } as const;
const appearance = { ...live, performanceRole: "responsiveness", performanceReason: "Changes segment shading without changing the generated column geometry." } as const;
const workload = { ...live, performanceRole: "workload", performanceReason: "Controls the number of rectangles generated and rasterized." } as const;

export const flameControls = {
  layout: { ...appearance, type: "segmented", target: "flame.layout", label: "Layout", defaultValue: flameDefaults.layout,
    options: [{ label: "Top Down", value: "top-down" }, { label: "Center", value: "center" }] },
  columns: { ...workload, type: "slider", target: "flame.columns", label: "Width", description: "Number of equal-width columns across the graph.",
    defaultValue: 50, min: 10, max: 200, step: 1, sliderValueKind: "discrete", editableRange: { hardMin: 10, hardMax: 200 } },
  depth: { ...workload, type: "slider", target: "flame.depth", label: "Depth", description: "Segment density; each column receives a random depth multiplier.",
    defaultValue: 10, min: 3, max: 30, step: 1, sliderValueKind: "discrete", variant: "discrete", editableRange: { hardMin: 3, hardMax: 30 } },
  noise: { ...appearance, type: "slider", target: "flame.noise", label: "Boundary noise", description: "Random boundary displacement, up to 15% of the graph height in either direction.",
    defaultValue: 20, min: 0, max: 100, step: 1, unit: "%", sliderValueKind: "continuous" },
  dark: { ...appearance, type: "color", target: "flame.dark", label: "Core", semanticGroup: "segment-tones", defaultValue: flameDefaults.dark },
  middle: { ...appearance, type: "color", target: "flame.middle", label: "Middle", semanticGroup: "segment-tones", defaultValue: flameDefaults.middle },
  light: { ...appearance, type: "color", target: "flame.light", label: "Edge", semanticGroup: "segment-tones", defaultValue: flameDefaults.light },
  core: { ...appearance, type: "slider", target: "flame.core", label: "Gradient core", description: "Keeps more inner segment ranks at the core color before the HSL transition begins.",
    defaultValue: 25, min: 10, max: 100, step: 1, sliderValueKind: "continuous" },
  border: { ...appearance, type: "slider", target: "flame.border", label: "Border opacity", defaultValue: 5, min: 0, max: 100, step: 1, unit: "%", sliderValueKind: "continuous" },
} as const satisfies Record<string, ToolcraftControlSchema>;

export const backgroundControls = {
  include: { ...appearance, type: "switch", target: "export.includeBackground", label: "Background", defaultValue: true },
  color: { ...appearance, type: "color", target: "appearance.background", label: "Background color", defaultValue: flameDefaults.background },
} as const satisfies Record<string, ToolcraftControlSchema>;
