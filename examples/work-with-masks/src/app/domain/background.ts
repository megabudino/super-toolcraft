import { waveDefaultValues } from "./wave-default-values";

export const backgroundDefaults = {
  color: waveDefaultValues["appearance.background"],
  include: waveDefaultValues["export.includeBackground"],
} as const;

export const backgroundSection = {
  controls: {
    includeBackground: {
      applicability: { mode: "always" },
      defaultValue: backgroundDefaults.include,
      description: "Includes the visible sky behind the hero composition.",
      label: "Include",
      performanceReason:
        "Background inclusion changes shader compositing without changing fragment cost.",
      performanceRole: "responsiveness",
      target: "export.includeBackground",
      type: "switch",
    },
    backgroundColor: {
      applicability: { mode: "always" },
      defaultValue: backgroundDefaults.color,
      label: false,
      performanceReason:
        "Background color changes one shader uniform without changing workload size.",
      performanceRole: "responsiveness",
      target: "appearance.background",
      type: "color",
    },
  },
  id: "background",
  title: "Background",
} as const;
