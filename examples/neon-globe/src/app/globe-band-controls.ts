import { GLOBE_BAND_ROWS } from "./globe-band-order";
import { GLOBE_BAND_WIDTH_MAX, GLOBE_DEFAULTS, GLOBE_TARGETS } from "./globe-constants";

const percentageSlider = {
  applicability: { mode: "always" },
  sliderValueKind: "continuous",
  step: 1,
  type: "slider",
  unit: "%",
} as const;

export const bandLayoutControls = Object.fromEntries(
  GLOBE_BAND_ROWS.flatMap(({ bandId, label }, index) => {
    const positionKey = `band${bandId}Position` as const;
    const widthKey = `band${bandId}Width` as const;
    return [
      [positionKey, {
        ...percentageSlider,
        defaultValue: GLOBE_DEFAULTS[positionKey],
        description: `Moves the ${label} band up or down while preserving the shared surface distance.`,
        label: `Band ${index + 1} position`,
        max: 76,
        min: -76,
        performanceReason: "Band position changes one fixed ribbon radius and projection.",
        performanceRole: "responsiveness",
        semanticGroup: `band-${bandId}`,
        target: GLOBE_TARGETS[positionKey],
      }] as const,
      [widthKey, {
        ...percentageSlider,
        defaultValue: GLOBE_DEFAULTS[widthKey],
        description: `Width of the ${label} band.`,
        label: `Band ${index + 1} width`,
        max: GLOBE_BAND_WIDTH_MAX,
        min: 4,
        performanceReason: "Wider bands fit more dot rows and increase the dot drawing workload.",
        performanceRole: "workload",
        semanticGroup: `band-${bandId}`,
        target: GLOBE_TARGETS[widthKey],
      }] as const,
    ];
  }),
);

export const logoPositionControls = Object.fromEntries(
  GLOBE_BAND_ROWS.map(({ logoId, label, positionKey }, index) => [
    `${logoId}FinalPosition`,
    {
      ...percentageSlider,
      defaultValue: GLOBE_DEFAULTS[positionKey],
      description: `Final horizontal position for the ${label} logo on band ${index + 1}.`,
      label,
      max: 100,
      min: 0,
      performanceReason: "Logo position moves an existing fixed mask without changing dot count.",
      performanceRole: "responsiveness",
      target: GLOBE_TARGETS[positionKey],
    },
  ] as const),
);
