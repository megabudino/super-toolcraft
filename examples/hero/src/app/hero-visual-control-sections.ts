import {
  HERO_HEADING_DEFAULTS,
  heroHeadingTargets,
} from "./hero-heading-values";

export const heroVisualControlSections = [
  {
    controls: {
      badgeVisible: {
        applicability: { mode: "always" },
        defaultValue: HERO_HEADING_DEFAULTS.badgeVisible,
        label: "Badge",
        performanceReason:
          "Badge visibility must update immediately in the website preview.",
        performanceRole: "responsiveness",
        target: heroHeadingTargets.badgeVisible,
        type: "switch",
      },
      badgeColor: {
        applicability: {
          all: [{ equals: true, target: heroHeadingTargets.badgeVisible }],
          mode: "conditional",
        },
        defaultValue: HERO_HEADING_DEFAULTS.badgeColor,
        description:
          "Sets one shared color for the V4 text and circular outline.",
        label: "Badge color",
        performanceReason:
          "Badge color must update immediately in the website preview.",
        performanceRole: "responsiveness",
        target: heroHeadingTargets.badgeColor,
        type: "color",
      },
      badgeScale: {
        applicability: {
          all: [{ equals: true, target: heroHeadingTargets.badgeVisible }],
          mode: "conditional",
        },
        defaultValue: HERO_HEADING_DEFAULTS.badgeScale,
        description:
          "Scales the complete V4 badge artwork without changing its authored proportions.",
        label: "Badge scale",
        max: 300,
        min: 25,
        performanceReason:
          "Badge scale must remain live throughout slider gestures.",
        performanceRole: "responsiveness",
        sliderValueKind: "continuous",
        step: 1,
        target: heroHeadingTargets.badgeScale,
        type: "slider",
        unit: "%",
        variant: "continuous",
      },
      badgeGap: {
        applicability: {
          all: [{ equals: true, target: heroHeadingTargets.badgeVisible }],
          mode: "conditional",
        },
        defaultValue: HERO_HEADING_DEFAULTS.badgeGap,
        description:
          "Sets the visible vertical distance from the scaled badge to the Recraft line.",
        label: "Badge gap",
        max: 160,
        min: 0,
        performanceReason:
          "Badge-to-heading spacing must remain live throughout slider gestures.",
        performanceRole: "responsiveness",
        sliderValueKind: "continuous",
        step: 1,
        target: heroHeadingTargets.badgeGap,
        type: "slider",
        unit: "px",
        variant: "continuous",
      },
    },
    id: "heading-badge",
    title: "Badge",
  },
  {
    controls: {
      badgeShadowEnabled: {
        applicability: {
          all: [{ equals: true, target: heroHeadingTargets.badgeVisible }],
          mode: "conditional",
        },
        defaultValue: HERO_HEADING_DEFAULTS.badgeShadow.enabled,
        label: "Shadow",
        performanceReason:
          "Badge shadow visibility must update immediately in the website preview.",
        performanceRole: "responsiveness",
        target: heroHeadingTargets.badgeShadowEnabled,
        type: "switch",
      },
      badgeShadowOffset: {
        applicability: {
          all: [
            { equals: true, target: heroHeadingTargets.badgeVisible },
            { equals: true, target: heroHeadingTargets.badgeShadowEnabled },
          ],
          mode: "conditional",
        },
        coordinateMode: "screen",
        defaultValue: HERO_HEADING_DEFAULTS.badgeShadow.offset,
        description:
          "Moves only the badge shadow horizontally and vertically.",
        label: "Shadow offset",
        performanceReason:
          "Two-axis badge shadow placement must remain live throughout pad gestures.",
        performanceRole: "responsiveness",
        target: heroHeadingTargets.badgeShadowOffset,
        type: "vector",
      },
      badgeShadowBlur: {
        applicability: {
          all: [
            { equals: true, target: heroHeadingTargets.badgeVisible },
            { equals: true, target: heroHeadingTargets.badgeShadowEnabled },
          ],
          mode: "conditional",
        },
        defaultValue: HERO_HEADING_DEFAULTS.badgeShadow.blur,
        label: "Shadow blur",
        max: 100,
        min: 0,
        performanceReason:
          "Badge shadow blur must remain live throughout slider gestures.",
        performanceRole: "responsiveness",
        sliderValueKind: "continuous",
        step: 1,
        target: heroHeadingTargets.badgeShadowBlur,
        type: "slider",
        unit: "px",
        variant: "continuous",
      },
      badgeShadowSpread: {
        applicability: {
          all: [
            { equals: true, target: heroHeadingTargets.badgeVisible },
            { equals: true, target: heroHeadingTargets.badgeShadowEnabled },
          ],
          mode: "conditional",
        },
        defaultValue: HERO_HEADING_DEFAULTS.badgeShadow.spread,
        label: "Shadow spread",
        max: 32,
        min: -32,
        performanceReason:
          "Badge shadow spread must remain live throughout slider gestures.",
        performanceRole: "responsiveness",
        sliderValueKind: "continuous",
        step: 1,
        target: heroHeadingTargets.badgeShadowSpread,
        type: "slider",
        unit: "px",
        variant: "continuous",
      },
      badgeShadowColorOpacity: {
        applicability: {
          all: [
            { equals: true, target: heroHeadingTargets.badgeVisible },
            { equals: true, target: heroHeadingTargets.badgeShadowEnabled },
          ],
          mode: "conditional",
        },
        defaultValue: HERO_HEADING_DEFAULTS.badgeShadow.colorOpacity,
        label: "Shadow color",
        performanceReason:
          "Badge shadow color and opacity must update immediately in the website preview.",
        performanceRole: "responsiveness",
        target: heroHeadingTargets.badgeShadowColorOpacity,
        type: "colorOpacity",
      },
    },
    id: "heading-badge-shadow",
    title: "Badge Shadow",
  },
  {
    controls: {
      shadowEnabled: {
        applicability: { mode: "always" },
        defaultValue: HERO_HEADING_DEFAULTS.shadow.enabled,
        label: "Shadow",
        performanceReason:
          "Heading shadow visibility must update immediately in the website preview.",
        performanceRole: "responsiveness",
        target: heroHeadingTargets.shadowEnabled,
        type: "switch",
      },
      shadowOffset: {
        applicability: {
          all: [
            { equals: true, target: heroHeadingTargets.shadowEnabled },
          ],
          mode: "conditional",
        },
        coordinateMode: "screen",
        defaultValue: HERO_HEADING_DEFAULTS.shadow.offset,
        description:
          "Moves only the heading shadow horizontally and vertically.",
        label: "Shadow offset",
        performanceReason:
          "Two-axis shadow placement must remain live throughout pad gestures.",
        performanceRole: "responsiveness",
        target: heroHeadingTargets.shadowOffset,
        type: "vector",
      },
      shadowBlur: {
        applicability: {
          all: [
            { equals: true, target: heroHeadingTargets.shadowEnabled },
          ],
          mode: "conditional",
        },
        defaultValue: HERO_HEADING_DEFAULTS.shadow.blur,
        label: "Shadow blur",
        max: 100,
        min: 0,
        performanceReason:
          "Heading shadow blur must remain live throughout slider gestures.",
        performanceRole: "responsiveness",
        sliderValueKind: "continuous",
        step: 1,
        target: heroHeadingTargets.shadowBlur,
        type: "slider",
        unit: "px",
        variant: "continuous",
      },
      shadowSpread: {
        applicability: {
          all: [
            { equals: true, target: heroHeadingTargets.shadowEnabled },
          ],
          mode: "conditional",
        },
        defaultValue: HERO_HEADING_DEFAULTS.shadow.spread,
        label: "Shadow spread",
        max: 32,
        min: -32,
        performanceReason:
          "Heading shadow spread must remain live throughout slider gestures.",
        performanceRole: "responsiveness",
        sliderValueKind: "continuous",
        step: 1,
        target: heroHeadingTargets.shadowSpread,
        type: "slider",
        unit: "px",
        variant: "continuous",
      },
      shadowColorOpacity: {
        applicability: {
          all: [
            { equals: true, target: heroHeadingTargets.shadowEnabled },
          ],
          mode: "conditional",
        },
        defaultValue: HERO_HEADING_DEFAULTS.shadow.colorOpacity,
        label: "Shadow color",
        performanceReason:
          "Heading shadow color and opacity must update immediately in the website preview.",
        performanceRole: "responsiveness",
        target: heroHeadingTargets.shadowColorOpacity,
        type: "colorOpacity",
      },
    },
    id: "heading-effects",
    title: "Heading Shadow",
  },
] as const;
