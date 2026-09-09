import { DONUT_DEFAULTS } from "./donut-values";

const responsive = (performanceReason: string) =>
  ({
    performanceReason,
    performanceRole: "responsiveness",
  }) as const;

function slider(
  label: string,
  target: string,
  defaultValue: number,
  min: number,
  max: number,
  performanceReason: string,
  step = 0.01,
  unit?: string,
) {
  return {
    defaultValue,
    label,
    max,
    min,
    sliderValueKind: "continuous" as const,
    step,
    target,
    type: "slider" as const,
    ...(unit ? { unit } : {}),
    ...responsive(performanceReason),
  };
}

export const donutStudioControlSections = [
  {
    controls: {
      panorama: {
        defaultValue: DONUT_DEFAULTS.studio.environmentBackdrop,
        label: "Panorama",
        target: "studio.hdriVisible",
        type: "switch" as const,
        ...responsive(
          "Backdrop shows the retained HDR panorama behind the product when Background is included.",
        ),
      },
      strength: slider(
        "Strength",
        "studio.environmentStrength",
        DONUT_DEFAULTS.studio.environmentStrength,
        0,
        2,
        "Strength updates the retained HDR environment contribution.",
      ),
      rotation: slider(
        "Rotation",
        "studio.environmentRotation",
        DONUT_DEFAULTS.studio.environmentRotation,
        0,
        360,
        "Rotation turns the retained HDR environment.",
        1,
        "°",
      ),
      blur: {
        ...slider(
          "Blur",
          "studio.environmentBlur",
          DONUT_DEFAULTS.studio.environmentBlur,
          0,
          1,
          "Blur softens only the visible HDR backdrop while preserving image-based lighting.",
        ),
        visibleWhen: { equals: true, target: "studio.hdriVisible" },
      },
    },
    id: "environment",
    title: "Environment",
  },
  {
    controls: {
      include: {
        defaultValue: DONUT_DEFAULTS.studio.shadowsEnabled,
        label: "Include",
        target: "studio.shadowsEnabled",
        type: "switch" as const,
        ...responsive(
          "Include enables retained shadows from the product onto the plate.",
        ),
      },
      strength: {
        ...slider(
          "Strength",
          "studio.shadowStrength",
          DONUT_DEFAULTS.studio.shadowStrength,
          0,
          1,
          "Strength changes shadow opacity without changing the key-light energy.",
        ),
        visibleWhen: { equals: true, target: "studio.shadowsEnabled" },
      },
      softness: {
        ...slider(
          "Softness",
          "studio.shadowSoftness",
          DONUT_DEFAULTS.studio.shadowSoftness,
          0,
          8,
          "Softness broadens the retained directional shadow edge.",
        ),
        visibleWhen: { equals: true, target: "studio.shadowsEnabled" },
      },
    },
    id: "shadows",
    title: "Shadows",
  },
] as const;
