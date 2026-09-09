import {
  HERO_HEADING_SUBTITLE_DEFAULTS,
  heroHeadingSubtitleTargets,
} from "./hero-heading-subtitle-values";

const shadowEnabled = {
  all: [{ equals: true, target: heroHeadingSubtitleTargets.shadowEnabled }],
  mode: "conditional",
} as const;

export const heroHeadingSubtitleControlSections = [
  {
    controls: {
      fontSize: {
        applicability: { mode: "always" },
        defaultValue: HERO_HEADING_SUBTITLE_DEFAULTS.fontSize,
        description:
          "Sets the subtitle text size while preserving its Figma line-height and tracking proportions.",
        label: "Font size",
        max: 64,
        min: 10,
        performanceReason:
          "Subtitle typography must remain live while its size is edited.",
        performanceRole: "responsiveness",
        sliderValueKind: "continuous",
        step: 1,
        target: heroHeadingSubtitleTargets.fontSize,
        type: "slider",
        unit: "px",
        variant: "continuous",
      },
      gap: {
        applicability: { mode: "always" },
        defaultValue: HERO_HEADING_SUBTITLE_DEFAULTS.gap,
        description: "Sets the vertical distance from the heading to the subtitle.",
        label: "Gap",
        max: 160,
        min: 0,
        performanceReason:
          "Subtitle placement must remain live while its heading gap is edited.",
        performanceRole: "responsiveness",
        sliderValueKind: "continuous",
        step: 1,
        target: heroHeadingSubtitleTargets.gap,
        type: "slider",
        unit: "px",
        variant: "continuous",
      },
      shadowEnabled: {
        applicability: { mode: "always" },
        defaultValue: HERO_HEADING_SUBTITLE_DEFAULTS.shadow.enabled,
        label: "Shadow",
        performanceReason:
          "Subtitle shadow visibility must update immediately in the website preview.",
        performanceRole: "responsiveness",
        target: heroHeadingSubtitleTargets.shadowEnabled,
        type: "switch",
      },
      shadowOffset: {
        applicability: shadowEnabled,
        coordinateMode: "screen",
        defaultValue: HERO_HEADING_SUBTITLE_DEFAULTS.shadow.offset,
        description: "Moves only the subtitle shadow horizontally and vertically.",
        label: "Shadow offset",
        performanceReason:
          "Subtitle shadow position must remain live throughout pad gestures.",
        performanceRole: "responsiveness",
        target: heroHeadingSubtitleTargets.shadowOffset,
        type: "vector",
      },
      shadowBlur: {
        applicability: shadowEnabled,
        defaultValue: HERO_HEADING_SUBTITLE_DEFAULTS.shadow.blur,
        label: "Shadow blur",
        max: 100,
        min: 0,
        performanceReason:
          "Subtitle shadow blur must remain live throughout slider gestures.",
        performanceRole: "responsiveness",
        sliderValueKind: "continuous",
        step: 1,
        target: heroHeadingSubtitleTargets.shadowBlur,
        type: "slider",
        unit: "px",
        variant: "continuous",
      },
      shadowSpread: {
        applicability: shadowEnabled,
        defaultValue: HERO_HEADING_SUBTITLE_DEFAULTS.shadow.spread,
        label: "Shadow spread",
        max: 32,
        min: -32,
        performanceReason:
          "Subtitle shadow spread must remain live throughout slider gestures.",
        performanceRole: "responsiveness",
        sliderValueKind: "continuous",
        step: 1,
        target: heroHeadingSubtitleTargets.shadowSpread,
        type: "slider",
        unit: "px",
        variant: "continuous",
      },
      shadowColorOpacity: {
        applicability: shadowEnabled,
        defaultValue: HERO_HEADING_SUBTITLE_DEFAULTS.shadow.colorOpacity,
        label: "Shadow color",
        performanceReason:
          "Subtitle shadow color and opacity must update immediately in the website preview.",
        performanceRole: "responsiveness",
        target: heroHeadingSubtitleTargets.shadowColorOpacity,
        type: "colorOpacity",
      },
    },
    id: "heading-subtitle",
    title: "Hero Subtitle",
  },
] as const;
