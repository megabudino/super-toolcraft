import { GLOBE_LOGO_SCALE, GLOBE_TARGETS } from "./globe-constants";
import { GLOBE_BAND_ROWS } from "./globe-band-order";

function logoScaleControl(label: string, target: string) {
  return {
    applicability: { mode: "always" },
    ...GLOBE_LOGO_SCALE,
    description:
      "Percentage of the original logo size. Keeps proportions and fits within the band without changing its dots or final position.",
    label,
    performanceReason:
      "Scales an existing mask within the fixed dot grid without adding dots or source paths.",
    performanceRole: "responsiveness",
    sliderValueKind: "continuous",
    step: 1,
    target,
    type: "slider",
    unit: "%",
  } as const;
}

export const logoScaleControls = Object.fromEntries(
  GLOBE_BAND_ROWS.map(({ logoId, label, scaleKey }) => [
    `${logoId}Scale`,
    logoScaleControl(label, GLOBE_TARGETS[scaleKey]),
  ]),
);
