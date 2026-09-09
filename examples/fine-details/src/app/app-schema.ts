import { defineToolcraft } from "@/toolcraft/runtime";

import { appIdentity } from "./app-identity";
import { fineDetailsCarouselControlSections } from "./fine-details-carousel-control-sections";
import { fineDetailsLoadingControlSections } from "./fine-details-loading-control-section";
import { FINE_DETAILS_DEFAULT_TRAIL_ASSETS } from "./fine-details-default-assets";
import { fineDetailsPromptFlightControlSections } from "./fine-details-prompt-flight-control-sections";
import {
  FINE_DETAILS_APPEARANCE_DEFAULTS,
  FINE_DETAILS_GRID_SIZE_MAX,
  FINE_DETAILS_GRID_SIZE_MIN,
  fineDetailsTargets,
} from "./fine-details-values";
import {
  FINE_DETAILS_PROMPT_DEFAULTS,
  fineDetailsPromptTargets,
} from "./fine-details-prompt-values";
import { fineDetailsPromptTypingControlSection } from "./fine-details-prompt-typing-control-section";
import {
  FINE_DETAILS_TYPOGRAPHY_DEFAULTS,
  FINE_DETAILS_TYPOGRAPHY_GAP_MAX,
  FINE_DETAILS_TYPOGRAPHY_INSET_MAX,
  FINE_DETAILS_TYPOGRAPHY_SIZE_MAX,
  FINE_DETAILS_TYPOGRAPHY_SIZE_MIN,
  fineDetailsTypographyTargets,
} from "./fine-details-typography-values";
import { fineDetailsTrailControlSections } from "./fine-details-trail-control-sections";

export const appSchema = defineToolcraft({
  canvas: {
    enabled: true,
    size: { height: 1080, unit: "px", width: 1920 },
    sizing: { mode: "editable-output" },
  },
  identity: appIdentity,
  media: {
    defaultAssets: FINE_DETAILS_DEFAULT_TRAIL_ASSETS,
  },
  panels: {
    controls: {
      sections: [
        {
          controls: {
            background: {
              applicability: { mode: "always" },
              defaultValue: FINE_DETAILS_APPEARANCE_DEFAULTS.background,
              label: "Color",
              performanceReason:
                "Background color changes must appear immediately in the website preview.",
              performanceRole: "responsiveness",
              target: fineDetailsTargets.background,
              type: "color",
            },
            gridSize: {
              applicability: { mode: "always" },
              defaultValue: FINE_DETAILS_APPEARANCE_DEFAULTS.gridSize,
              label: "Grid size",
              max: FINE_DETAILS_GRID_SIZE_MAX,
              min: FINE_DETAILS_GRID_SIZE_MIN,
              performanceReason: "Grid spacing must remain live while the size slider is dragged.",
              performanceRole: "responsiveness",
              sliderValueKind: "continuous",
              step: 1,
              target: fineDetailsTargets.gridSize,
              type: "slider",
              unit: "px",
              variant: "continuous",
            },
            gridOpacity: {
              applicability: { mode: "always" },
              defaultValue: FINE_DETAILS_APPEARANCE_DEFAULTS.gridOpacity,
              label: "Grid opacity",
              max: 100,
              min: 0,
              performanceReason:
                "Grid opacity must remain live while the opacity slider is dragged.",
              performanceRole: "responsiveness",
              sliderValueKind: "continuous",
              step: 1,
              target: fineDetailsTargets.gridOpacity,
              type: "slider",
              unit: "%",
              variant: "continuous",
            },
          },
          id: "background",
          title: "Background",
        },
        ...fineDetailsCarouselControlSections,
        ...fineDetailsLoadingControlSections,
        ...fineDetailsTrailControlSections,
        {
          controls: {
            left: {
              applicability: { mode: "always" },
              defaultValue: FINE_DETAILS_TYPOGRAPHY_DEFAULTS.upperLeft.left,
              label: "Left",
              max: FINE_DETAILS_TYPOGRAPHY_INSET_MAX,
              min: 0,
              performanceReason:
                "The upper-left heading must stay attached to exact pixel placement during edits.",
              performanceRole: "responsiveness",
              sliderValueKind: "continuous",
              step: 1,
              target: fineDetailsTypographyTargets.upperLeftLeft,
              type: "slider",
              unit: "px",
              variant: "continuous",
            },
            top: {
              applicability: { mode: "always" },
              defaultValue: FINE_DETAILS_TYPOGRAPHY_DEFAULTS.upperLeft.top,
              label: "Top",
              max: FINE_DETAILS_TYPOGRAPHY_INSET_MAX,
              min: 0,
              performanceReason:
                "The upper-left heading must stay attached to exact pixel placement during edits.",
              performanceRole: "responsiveness",
              sliderValueKind: "continuous",
              step: 1,
              target: fineDetailsTypographyTargets.upperLeftTop,
              type: "slider",
              unit: "px",
              variant: "continuous",
            },
            fontSize: {
              applicability: { mode: "always" },
              defaultValue: FINE_DETAILS_TYPOGRAPHY_DEFAULTS.upperLeft.fontSize,
              label: "Font size",
              max: FINE_DETAILS_TYPOGRAPHY_SIZE_MAX,
              min: FINE_DETAILS_TYPOGRAPHY_SIZE_MIN,
              performanceReason:
                "The TRY IT heading size must remain live while its slider is dragged.",
              performanceRole: "responsiveness",
              sliderValueKind: "continuous",
              step: 1,
              target: fineDetailsTypographyTargets.upperLeftFontSize,
              type: "slider",
              unit: "px",
              variant: "continuous",
            },
          },
          id: "upper-left-typography",
          title: "Upper Left Typography",
        },
        {
          controls: {
            right: {
              applicability: { mode: "always" },
              defaultValue: FINE_DETAILS_TYPOGRAPHY_DEFAULTS.lowerRight.right,
              label: "Right",
              max: FINE_DETAILS_TYPOGRAPHY_INSET_MAX,
              min: 0,
              performanceReason:
                "The lower-right composition must stay attached to its exact right inset during edits.",
              performanceRole: "responsiveness",
              sliderValueKind: "continuous",
              step: 1,
              target: fineDetailsTypographyTargets.lowerRightRight,
              type: "slider",
              unit: "px",
              variant: "continuous",
            },
            bottom: {
              applicability: { mode: "always" },
              defaultValue: FINE_DETAILS_TYPOGRAPHY_DEFAULTS.lowerRight.bottom,
              label: "Bottom",
              max: FINE_DETAILS_TYPOGRAPHY_INSET_MAX,
              min: 0,
              performanceReason:
                "The lower-right composition must stay attached to its exact bottom inset during edits.",
              performanceRole: "responsiveness",
              sliderValueKind: "continuous",
              step: 1,
              target: fineDetailsTypographyTargets.lowerRightBottom,
              type: "slider",
              unit: "px",
              variant: "continuous",
            },
            headingSize: {
              applicability: { mode: "always" },
              defaultValue: FINE_DETAILS_TYPOGRAPHY_DEFAULTS.lowerRight.headingFontSize,
              label: "Heading size",
              max: FINE_DETAILS_TYPOGRAPHY_SIZE_MAX,
              min: FINE_DETAILS_TYPOGRAPHY_SIZE_MIN,
              performanceReason:
                "The YOUR WAY heading size must remain live while its slider is dragged.",
              performanceRole: "responsiveness",
              sliderValueKind: "continuous",
              step: 1,
              target: fineDetailsTypographyTargets.lowerRightHeadingFontSize,
              type: "slider",
              unit: "px",
              variant: "continuous",
            },
            bodySize: {
              applicability: { mode: "always" },
              defaultValue: FINE_DETAILS_TYPOGRAPHY_DEFAULTS.lowerRight.bodyFontSize,
              label: "Body size",
              max: FINE_DETAILS_TYPOGRAPHY_SIZE_MAX,
              min: FINE_DETAILS_TYPOGRAPHY_SIZE_MIN,
              performanceReason:
                "The lower-right body size must remain live while its slider is dragged.",
              performanceRole: "responsiveness",
              sliderValueKind: "continuous",
              step: 1,
              target: fineDetailsTypographyTargets.lowerRightBodyFontSize,
              type: "slider",
              unit: "px",
              variant: "continuous",
            },
            gap: {
              applicability: { mode: "always" },
              defaultValue: FINE_DETAILS_TYPOGRAPHY_DEFAULTS.lowerRight.gap,
              label: "Gap",
              max: FINE_DETAILS_TYPOGRAPHY_GAP_MAX,
              min: 0,
              performanceReason:
                "The heading-to-body gap must remain live while its slider is dragged.",
              performanceRole: "responsiveness",
              sliderValueKind: "continuous",
              step: 1,
              target: fineDetailsTypographyTargets.lowerRightGap,
              type: "slider",
              unit: "px",
              variant: "continuous",
            },
          },
          id: "lower-right-typography",
          title: "Lower Right Typography",
        },
        {
          controls: {
            position: {
              applicability: { mode: "always" },
              coordinateMode: "screen",
              defaultValue: FINE_DETAILS_PROMPT_DEFAULTS.position,
              description: "Moves the AI prompt popup across the Fine Details section.",
              label: "Position",
              performanceReason:
                "Two-axis prompt placement must remain live throughout pad gestures.",
              performanceRole: "responsiveness",
              target: fineDetailsPromptTargets.position,
              type: "vector",
            },
          },
          id: "prompt",
          title: "Prompt",
        },
        ...fineDetailsPromptFlightControlSections,
        {
          controls: {
            shadowEnabled: {
              applicability: { mode: "always" },
              defaultValue: FINE_DETAILS_PROMPT_DEFAULTS.shadow.enabled,
              label: "Shadow",
              performanceReason:
                "Prompt shadow visibility must update immediately in the website preview.",
              performanceRole: "responsiveness",
              target: fineDetailsPromptTargets.shadowEnabled,
              type: "switch",
            },
            shadowOffset: {
              applicability: {
                all: [
                  {
                    equals: true,
                    target: fineDetailsPromptTargets.shadowEnabled,
                  },
                ],
                mode: "conditional",
              },
              coordinateMode: "screen",
              defaultValue: FINE_DETAILS_PROMPT_DEFAULTS.shadow.offset,
              description: "Moves only the prompt panel shadow horizontally and vertically.",
              label: "Shadow offset",
              performanceReason:
                "Two-axis prompt shadow placement must remain live throughout pad gestures.",
              performanceRole: "responsiveness",
              target: fineDetailsPromptTargets.shadowOffset,
              type: "vector",
            },
            shadowBlur: {
              applicability: {
                all: [
                  {
                    equals: true,
                    target: fineDetailsPromptTargets.shadowEnabled,
                  },
                ],
                mode: "conditional",
              },
              defaultValue: FINE_DETAILS_PROMPT_DEFAULTS.shadow.blur,
              label: "Shadow blur",
              max: 100,
              min: 0,
              performanceReason: "Prompt shadow blur must remain live throughout slider gestures.",
              performanceRole: "responsiveness",
              sliderValueKind: "continuous",
              step: 1,
              target: fineDetailsPromptTargets.shadowBlur,
              type: "slider",
              unit: "px",
              variant: "continuous",
            },
            shadowSpread: {
              applicability: {
                all: [
                  {
                    equals: true,
                    target: fineDetailsPromptTargets.shadowEnabled,
                  },
                ],
                mode: "conditional",
              },
              defaultValue: FINE_DETAILS_PROMPT_DEFAULTS.shadow.spread,
              label: "Shadow spread",
              max: 32,
              min: -32,
              performanceReason:
                "Prompt shadow spread must remain live throughout slider gestures.",
              performanceRole: "responsiveness",
              sliderValueKind: "continuous",
              step: 1,
              target: fineDetailsPromptTargets.shadowSpread,
              type: "slider",
              unit: "px",
              variant: "continuous",
            },
            shadowColorOpacity: {
              applicability: {
                all: [
                  {
                    equals: true,
                    target: fineDetailsPromptTargets.shadowEnabled,
                  },
                ],
                mode: "conditional",
              },
              defaultValue: FINE_DETAILS_PROMPT_DEFAULTS.shadow.colorOpacity,
              label: "Shadow color",
              performanceReason:
                "Prompt shadow color and opacity must update immediately in the website preview.",
              performanceRole: "responsiveness",
              target: fineDetailsPromptTargets.shadowColorOpacity,
              type: "colorOpacity",
            },
          },
          id: "prompt-shadow",
          title: "Prompt Shadow",
        },
        fineDetailsPromptTypingControlSection,
        {
          controls: {
            apply: {
              actions: [
                {
                  label: "Reset",
                  value: "website.reset",
                  variant: "outline",
                },
              ],
              applicability: { mode: "always" },
              target: "website.settings",
              type: "panelActions",
            },
          },
          id: "website-actions",
          title: "Website",
        },
      ],
      title: "Controls",
    },
  },
  persistence: {
    include: ["canvas", "media", "panels", "values"],
    key: "toolcraft:fine-details:state:v3",
    storage: "localStorage",
    version: 3,
  },
  toolbar: {
    history: true,
    radar: true,
    zoom: true,
  },
});
