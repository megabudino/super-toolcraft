import {
  DONUT_PRESET_CUSTOM,
  DONUT_PRESET_DEFAULT,
  DONUT_PRESET_TARGET,
  DONUT_PRESETS,
} from "./donut-presets";
import {
  DONUT_DEFAULT_PRESET_LIBRARY_JSON,
  DONUT_PRESET_LIBRARY_TARGET,
  DONUT_PRESET_RESET_ACTION,
} from "./donut-preset-library";

const responsive = (performanceReason: string) =>
  ({
    performanceReason,
    performanceRole: "responsiveness",
  }) as const;

export const donutPresetControlSections = [
  {
    controls: {
      flavor: {
        defaultValue: DONUT_PRESET_DEFAULT,
        description:
          "Choose a tasty donut look. Changes made while a named flavor is selected are remembered for that flavor.",
        label: "Flavor",
        options: [
          ...DONUT_PRESETS.map((preset) => ({
            label: preset.label,
            value: preset.id,
          })),
          { label: "Custom", value: DONUT_PRESET_CUSTOM },
        ],
        target: DONUT_PRESET_TARGET,
        type: "select" as const,
        ...responsive(
          "Preset applies retained material, icing, and sprinkle values without rebuilding scene resources.",
        ),
      },
      libraryState: {
        actions: [
          {
            label: "Reset flavor",
            value: DONUT_PRESET_RESET_ACTION,
          },
        ],
        defaultValue: DONUT_DEFAULT_PRESET_LIBRARY_JSON,
        description:
          "Restore the selected named flavor to its curated defaults. Export Settings and Import Settings carry every tuned flavor.",
        label: false,
        target: DONUT_PRESET_LIBRARY_TARGET,
        type: "actions" as const,
        visibleWhen: {
          notEquals: DONUT_PRESET_CUSTOM,
          target: DONUT_PRESET_TARGET,
        },
        ...responsive(
          "The retained preset document changes stored configuration without invalidating renderer passes.",
        ),
      },
    },
    id: "presets",
    title: "Presets",
  },
] as const;
