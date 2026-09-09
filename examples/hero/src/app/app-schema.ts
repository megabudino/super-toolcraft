import { defineToolcraft } from "@/toolcraft/runtime";

import { appIdentity } from "./app-identity";
import {
  HERO_BACKGROUND_PATTERN_DEFAULTS,
  heroBackgroundPatternTargets,
} from "./hero-background-pattern-values";
import { heroDispersionControlSections } from "./hero-dispersion-control-sections";
import { heroEffectsControlSections } from "./hero-effects-control-sections";
import {
  HERO_GALLERY_DEFAULTS,
  HERO_SPHERE_ROW_DEFAULT,
  HERO_SPHERE_ROWS_DEFAULT,
  heroGalleryTargets,
} from "./hero-gallery-values";
import {
  HERO_HEADING_DEFAULTS,
  heroHeadingTargets,
} from "./hero-heading-values";
import { heroHeadingCtaControlSections } from "./hero-heading-cta-control-sections";
import { heroHeadingSubtitleControlSections } from "./hero-heading-subtitle-control-sections";
import { HERO_PREVIEW_DEFAULTS } from "./hero-preview-protocol";
import { heroVisualControlSections } from "./hero-visual-control-sections";

import { heroDefaultMediaAssets } from "./hero-default-media";

export const appSchema = defineToolcraft({
  media: { defaultAssets: heroDefaultMediaAssets },
  canvas: {
    enabled: true,
    size: { height: 1080, unit: "px", width: 1920 },
    sizing: { mode: "editable-output" },
  },
  identity: appIdentity,
  persistence: { storage: "localStorage", key: "toolcraft:recraft-hero:state:v1", version: 1, include: ["values", "canvas", "panels", "media"] },
  settingsTransfer: { enabled: "auto" },
  panels: {
    controls: {
      sections: [
        {
          controls: {
            includeBackground: {
              applicability: { mode: "always" },
              defaultValue: HERO_PREVIEW_DEFAULTS.backgroundEnabled,
              description:
                "Shows or hides the hero stage color in the native Hero section.",
              label: "Background",
              performanceReason:
                "The bridge must reflect the background mode immediately in the website preview.",
              performanceRole: "responsiveness",
              target: "export.includeBackground",
              type: "switch",
            },
            background: {
              applicability: { mode: "always" },
              defaultValue: HERO_PREVIEW_DEFAULTS.background,
              label: false,
              performanceReason:
                "The bridge must reflect color changes immediately in the website preview.",
              performanceRole: "responsiveness",
              target: "appearance.background",
              type: "color",
            },
          },
          id: "background",
          title: "Background",
        },
        {
          controls: {
            enabled: {
              applicability: {
                all: [{ equals: true, target: "export.includeBackground" }],
                mode: "conditional",
              },
              defaultValue: HERO_BACKGROUND_PATTERN_DEFAULTS.enabled,
              description:
                "Adds a native checker layer over the selected hero background color.",
              label: "Visible",
              performanceReason:
                "Pattern visibility must update immediately in the native Hero section.",
              performanceRole: "responsiveness",
              target: heroBackgroundPatternTargets.enabled,
              type: "switch",
            },
            colorOpacity: {
              applicability: {
                all: [
                  { equals: true, target: "export.includeBackground" },
                  {
                    equals: true,
                    target: heroBackgroundPatternTargets.enabled,
                  },
                ],
                mode: "conditional",
              },
              defaultValue: HERO_BACKGROUND_PATTERN_DEFAULTS.colorOpacity,
              label: "Color & opacity",
              performanceReason:
                "Pattern color and opacity must update immediately in the native Hero section.",
              performanceRole: "responsiveness",
              target: heroBackgroundPatternTargets.colorOpacity,
              type: "colorOpacity",
            },
            squareSize: {
              applicability: {
                all: [
                  { equals: true, target: "export.includeBackground" },
                  {
                    equals: true,
                    target: heroBackgroundPatternTargets.enabled,
                  },
                ],
                mode: "conditional",
              },
              defaultValue: HERO_BACKGROUND_PATTERN_DEFAULTS.squareSize,
              description:
                "Sets the side length of each alternating checker square.",
              label: "Square size",
              max: 160,
              min: 4,
              performanceReason:
                "Checker scale must remain live throughout slider gestures.",
              performanceRole: "responsiveness",
              sliderValueKind: "continuous",
              step: 1,
              target: heroBackgroundPatternTargets.squareSize,
              type: "slider",
              unit: "px",
              variant: "continuous",
            },
          },
          id: "pattern",
          title: "Pattern",
        },
        {
          controls: {
            recraftSize: {
              applicability: { mode: "always" },
              defaultValue: HERO_HEADING_DEFAULTS.recraftSize,
              label: "Recraft size",
              max: 200,
              min: 32,
              performanceReason:
                "The first heading line must resize live in the native Hero section.",
              performanceRole: "responsiveness",
              sliderValueKind: "continuous",
              step: 1,
              target: heroHeadingTargets.recraftSize,
              type: "slider",
              unit: "px",
              variant: "continuous",
            },
            stylesSize: {
              applicability: { mode: "always" },
              defaultValue: HERO_HEADING_DEFAULTS.stylesSize,
              label: "Styles size",
              max: 200,
              min: 32,
              performanceReason:
                "The second heading line must resize live in the native Hero section.",
              performanceRole: "responsiveness",
              sliderValueKind: "continuous",
              step: 1,
              target: heroHeadingTargets.stylesSize,
              type: "slider",
              unit: "px",
              variant: "continuous",
            },
            color: {
              applicability: { mode: "always" },
              defaultValue: HERO_HEADING_DEFAULTS.color,
              description:
                "Sets one shared brand color for both hero heading lines without recoloring the V4 badge.",
              label: "Text color",
              performanceReason:
                "The shared heading color must update immediately in the website preview.",
              performanceRole: "responsiveness",
              target: heroHeadingTargets.color,
              type: "color",
            },
            lineGap: {
              applicability: { mode: "always" },
              defaultValue: HERO_HEADING_DEFAULTS.lineGap,
              description:
                "Adds or removes vertical space between the Recraft and Styles lines.",
              label: "Line gap",
              max: 160,
              min: -64,
              performanceReason:
                "Line spacing must remain live while the heading is composed.",
              performanceRole: "responsiveness",
              sliderValueKind: "continuous",
              step: 1,
              target: heroHeadingTargets.lineGap,
              type: "slider",
              unit: "px",
              variant: "continuous",
            },
            position: {
              applicability: { mode: "always" },
              coordinateMode: "screen",
              defaultValue: HERO_HEADING_DEFAULTS.position,
              description:
                "Moves the V4 badge and both heading lines together across the hero canvas.",
              label: "Position",
              performanceReason:
                "Two-axis heading placement must remain live throughout pad gestures.",
              performanceRole: "responsiveness",
              target: heroHeadingTargets.position,
              type: "vector",
            },
          },
          id: "hero-heading",
          title: "Hero Heading",
        },
        ...heroVisualControlSections,
        ...heroHeadingSubtitleControlSections,
        ...heroHeadingCtaControlSections,
        {
          controls: {
            perspective: {
              applicability: { mode: "always" },
              defaultValue: HERO_PREVIEW_DEFAULTS.perspective,
              label: "Perspective",
              max: 2400,
              min: 200,
              performanceReason:
                "Perspective changes must remain live while the user tunes the scene.",
              performanceRole: "responsiveness",
              sliderValueKind: "continuous",
              step: 10,
              target: "scene.perspective",
              type: "slider",
              unit: "px",
              variant: "continuous",
            },
          },
          id: "projection",
          title: "Projection",
        },
        {
          controls: {
            type: {
              applicability: { mode: "always" },
              defaultValue: HERO_GALLERY_DEFAULTS.type,
              label: "Type",
              options: [
                { label: "Rows", value: "rows" },
                { label: "Sphere", value: "sphere" },
              ],
              orderRole: "mode",
              performanceReason:
                "Switching gallery geometry must replace the active website renderer immediately.",
              performanceRole: "responsiveness",
              semanticGroup: "gallery-mode",
              target: heroGalleryTargets.type,
              type: "segmented",
            },
            images: {
              applicability: {
                all: [{ equals: "rows", target: heroGalleryTargets.type }],
                mode: "conditional",
              },
              assetKind: "image",
              defaultValue: [],
              description:
                "In Rows mode, uploaded images appear in media order; an empty set keeps the authored portraits.",
              hardMaxItems: 24,
              label: "Images",
              multiple: true,
              performanceReason:
                "The bounded image set is decoded once and reused by the active website gallery renderer.",
              performanceRole: "responsiveness",
              recommendedMaxItems: 16,
              semanticGroup: "gallery-mode",
              target: heroGalleryTargets.images,
              type: "fileDrop",
            },
            gap: {
              applicability: { mode: "always" },
              defaultValue: HERO_GALLERY_DEFAULTS.cardGap,
              description:
                "Controls the edge-to-edge space between neighboring cards; negative values create overlap.",
              label: "Gap",
              max: 160,
              min: -240,
              performanceReason:
                "Card row placement must remain live throughout slider gestures.",
              performanceRole: "responsiveness",
              semanticGroup: "card-spacing",
              sliderValueKind: "continuous",
              step: 1,
              target: heroGalleryTargets.gap,
              type: "slider",
              unit: "px",
              variant: "continuous",
            },
            cardHeight: {
              applicability: { mode: "always" },
              defaultValue: HERO_GALLERY_DEFAULTS.cardHeight,
              description:
                "Height of every card in panel pixels; the Sphere lens scales rows as they move away from its centre.",
              label: "Card height",
              max: 1080,
              min: 80,
              performanceReason:
                "Row card height and aspect-derived width must remain live throughout slider gestures.",
              performanceRole: "responsiveness",
              semanticGroup: "card-geometry",
              sliderValueKind: "continuous",
              step: 1,
              target: heroGalleryTargets.cardHeight,
              type: "slider",
              unit: "px",
              variant: "continuous",
            },
            cardRadius: {
              applicability: { mode: "always" },
              defaultValue: HERO_GALLERY_DEFAULTS.cardRadius,
              description:
                "Rounds every image card in both Rows and Sphere gallery modes.",
              label: "Card radius",
              max: 160,
              min: 0,
              performanceReason:
                "Card corner masking must remain live throughout slider gestures.",
              performanceRole: "responsiveness",
              semanticGroup: "card-geometry",
              sliderValueKind: "continuous",
              step: 1,
              target: heroGalleryTargets.cardRadius,
              type: "slider",
              unit: "px",
              variant: "continuous",
            },
            safetyWidth: {
              applicability: {
                all: [{ equals: "rows", target: heroGalleryTargets.type }],
                mode: "conditional",
              },
              defaultValue: HERO_GALLERY_DEFAULTS.rows.safetyWidth,
              description:
                "Sets the full clear corridor around the centered hero content; both card rows move outward or inward equally.",
              label: "Safety width",
              max: 1440,
              min: 320,
              performanceReason:
                "The centered card-row anchors must remain live throughout slider gestures.",
              performanceRole: "responsiveness",
              semanticGroup: "rows-geometry",
              sliderValueKind: "continuous",
              step: 1,
              target: heroGalleryTargets.safetyWidth,
              type: "slider",
              unit: "px",
              variant: "continuous",
            },
            roll: {
              applicability: {
                all: [{ equals: "rows", target: heroGalleryTargets.type }],
                mode: "conditional",
              },
              defaultValue: HERO_GALLERY_DEFAULTS.rows.roll,
              description:
                "Progressively wraps cards toward the viewer from the center of the hero to each outer viewport edge.",
              label: "Roll",
              max: 85,
              min: 0,
              performanceReason:
                "The retained roller mesh must update throughout slider gestures.",
              performanceRole: "responsiveness",
              semanticGroup: "rows-geometry",
              sliderValueKind: "continuous",
              step: 1,
              target: heroGalleryTargets.roll,
              type: "slider",
              unit: "°",
              variant: "continuous",
            },
            sphereRows: {
              applicability: {
                all: [{ equals: "sphere", target: heroGalleryTargets.type }],
                mode: "conditional",
              },
              defaultValue: HERO_SPHERE_ROWS_DEFAULT,
              description:
                "Each row owns its base angle and signed angular speed; rows share Card height and Row gap and cycle top to bottom. Row 1 cannot be removed. Uploading the first image into an empty higher-numbered drop adds any missing rows through it automatically. Remove Row hides the last extra row but keeps its drop images; Add Row is canonical while that drop stays nonempty, or clear the drop before uploading a new first image to activate it again.",
              hardMaxItems: 6,
              itemControls: {
                offset: {
                  defaultValue: HERO_SPHERE_ROW_DEFAULT.offset,
                  label: "Offset",
                  max: 180,
                  min: -180,
                  sliderValueKind: "continuous",
                  step: 1,
                  type: "slider",
                  unit: "°",
                },
                speed: {
                  defaultValue: HERO_SPHERE_ROW_DEFAULT.speed,
                  label: "Speed",
                  max: 45,
                  min: -45,
                  sliderValueKind: "continuous",
                  step: 0.5,
                  type: "slider",
                  unit: "°/s",
                },
              },
              itemLabel: "Row",
              label: "Rows",
              minItems: 1,
              performanceReason:
                "Row collection edits must rebuild the bounded sphere layout immediately.",
              performanceRole: "responsiveness",
              semanticGroup: "sphere-rows",
              target: heroGalleryTargets.sphereRows,
              type: "collectionActions",
            },
            rowGap: {
              applicability: {
                all: [{ equals: "sphere", target: heroGalleryTargets.type }],
                mode: "conditional",
              },
              defaultValue: HERO_GALLERY_DEFAULTS.sphere.rowGap,
              description:
                "Vertical distance between rows on the image panel; negative values overlap rows.",
              label: "Row gap",
              max: 400,
              min: -200,
              performanceReason:
                "Panel row placement must remain live throughout slider gestures.",
              performanceRole: "responsiveness",
              semanticGroup: "sphere-rows",
              sliderValueKind: "continuous",
              step: 1,
              target: heroGalleryTargets.rowGap,
              type: "slider",
              unit: "px",
              variant: "continuous",
            },
          },
          id: "gallery",
          title: "Gallery",
        },
        {
          controls: {
            rowImages0: {
              applicability: {
                all: [{ equals: "sphere", target: heroGalleryTargets.type }],
                mode: "conditional",
              },
              assetKind: "image",
              defaultValue: [],
              description:
                "Only these images appear on Row 1; an empty set leaves Row 1 blank. Row 1 always exists because Rows has a one-row minimum, so this drop's media lifecycle changes its content but never row cardinality.",
              hardMaxItems: 8,
              label: "Row 1 images",
              multiple: true,
              performanceReason:
                "The bounded image set limits decode work while the sphere preview updates.",
              performanceRole: "responsiveness",
              recommendedMaxItems: 6,
              target: heroGalleryTargets.rowImages0,
              type: "fileDrop",
            },
            rowImages1: {
              applicability: {
                all: [{ equals: "sphere", target: heroGalleryTargets.type }],
                mode: "conditional",
              },
              assetKind: "image",
              defaultValue: [],
              description:
                "Only these images appear on Row 2; an empty set leaves Row 2 blank. Uploading the first image into this empty drop adds any missing rows through Row 2 automatically. Remove Row can hide Row 2 while retaining these images; Add Row is canonical while the drop stays nonempty, or clear it before uploading a new first image to activate Row 2 again.",
              hardMaxItems: 8,
              label: "Row 2 images",
              multiple: true,
              performanceReason:
                "The bounded image set limits decode work while the sphere preview updates.",
              performanceRole: "responsiveness",
              recommendedMaxItems: 6,
              target: heroGalleryTargets.rowImages1,
              type: "fileDrop",
            },
            rowImages2: {
              applicability: {
                all: [{ equals: "sphere", target: heroGalleryTargets.type }],
                mode: "conditional",
              },
              assetKind: "image",
              defaultValue: [],
              description:
                "Only these images appear on Row 3; an empty set leaves Row 3 blank. Uploading the first image into this empty drop adds any missing rows through Row 3 automatically. Remove Row can hide Row 3 while retaining these images; Add Row is canonical while the drop stays nonempty, or clear it before uploading a new first image to activate Row 3 again.",
              hardMaxItems: 8,
              label: "Row 3 images",
              multiple: true,
              performanceReason:
                "The bounded image set limits decode work while the sphere preview updates.",
              performanceRole: "responsiveness",
              recommendedMaxItems: 6,
              target: heroGalleryTargets.rowImages2,
              type: "fileDrop",
            },
            rowImages3: {
              applicability: {
                all: [{ equals: "sphere", target: heroGalleryTargets.type }],
                mode: "conditional",
              },
              assetKind: "image",
              defaultValue: [],
              description:
                "Only these images appear on Row 4; an empty set leaves Row 4 blank. Uploading the first image into this empty drop adds any missing rows through Row 4 automatically. Remove Row can hide Row 4 while retaining these images; Add Row is canonical while the drop stays nonempty, or clear it before uploading a new first image to activate Row 4 again.",
              hardMaxItems: 8,
              label: "Row 4 images",
              multiple: true,
              performanceReason:
                "The bounded image set limits decode work while the sphere preview updates.",
              performanceRole: "responsiveness",
              recommendedMaxItems: 6,
              target: heroGalleryTargets.rowImages3,
              type: "fileDrop",
            },
            rowImages4: {
              applicability: {
                all: [{ equals: "sphere", target: heroGalleryTargets.type }],
                mode: "conditional",
              },
              assetKind: "image",
              defaultValue: [],
              description:
                "Only these images appear on Row 5; an empty set leaves Row 5 blank. Uploading the first image into this empty drop adds any missing rows through Row 5 automatically. Remove Row can hide Row 5 while retaining these images; Add Row is canonical while the drop stays nonempty, or clear it before uploading a new first image to activate Row 5 again.",
              hardMaxItems: 8,
              label: "Row 5 images",
              multiple: true,
              performanceReason:
                "The bounded image set limits decode work while the sphere preview updates.",
              performanceRole: "responsiveness",
              recommendedMaxItems: 6,
              target: heroGalleryTargets.rowImages4,
              type: "fileDrop",
            },
            rowImages5: {
              applicability: {
                all: [{ equals: "sphere", target: heroGalleryTargets.type }],
                mode: "conditional",
              },
              assetKind: "image",
              defaultValue: [],
              description:
                "Only these images appear on Row 6; an empty set leaves Row 6 blank. Uploading the first image into this empty drop adds any missing rows through Row 6 automatically. Remove Row can hide Row 6 while retaining these images; Add Row is canonical while the drop stays nonempty, or clear it before uploading a new first image to activate Row 6 again.",
              hardMaxItems: 8,
              label: "Row 6 images",
              multiple: true,
              performanceReason:
                "The bounded image set limits decode work while the sphere preview updates.",
              performanceRole: "responsiveness",
              recommendedMaxItems: 6,
              target: heroGalleryTargets.rowImages5,
              type: "fileDrop",
            },
          },
          id: "row-images",
          title: "Row Images",
        },
        {
          controls: {
            width: {
              applicability: {
                all: [{ equals: "sphere", target: heroGalleryTargets.type }],
                mode: "conditional",
              },
              defaultValue: HERO_GALLERY_DEFAULTS.sphere.width,
              description:
                "Horizontal lens curvature: how much of each row fits the frame and how quickly cards bend toward the sides.",
              label: "Width",
              max: 6000,
              min: 200,
              performanceReason:
                "Horizontal lens curvature must remain live throughout slider gestures.",
              performanceRole: "responsiveness",
              semanticGroup: "lens-shape",
              sliderValueKind: "continuous",
              step: 10,
              target: heroGalleryTargets.sphereWidth,
              type: "slider",
              unit: "px",
              variant: "continuous",
            },
            height: {
              applicability: {
                all: [{ equals: "sphere", target: heroGalleryTargets.type }],
                mode: "conditional",
              },
              defaultValue: HERO_GALLERY_DEFAULTS.sphere.height,
              description:
                "Vertical lens curvature: how much of the row stack fits the frame and how quickly rows above and below the centre bend.",
              label: "Height",
              max: 6000,
              min: 200,
              performanceReason:
                "Vertical lens curvature must remain live throughout slider gestures.",
              performanceRole: "responsiveness",
              semanticGroup: "lens-shape",
              sliderValueKind: "continuous",
              step: 10,
              target: heroGalleryTargets.sphereHeight,
              type: "slider",
              unit: "px",
              variant: "continuous",
            },
            depth: {
              applicability: {
                all: [{ equals: "sphere", target: heroGalleryTargets.type }],
                mode: "conditional",
              },
              defaultValue: HERO_GALLERY_DEFAULTS.sphere.depth,
              description:
                "Lens depth at the rim; Bend X and Bend Y choose which share of it each axis uses and in which direction.",
              label: "Depth",
              max: 6000,
              min: 200,
              performanceReason:
                "Lens depth and edge magnification must remain live throughout slider gestures.",
              performanceRole: "responsiveness",
              semanticGroup: "lens-shape",
              sliderValueKind: "continuous",
              step: 10,
              target: heroGalleryTargets.sphereDepth,
              type: "slider",
              unit: "px",
              variant: "continuous",
            },
            bendX: {
              applicability: {
                all: [{ equals: "sphere", target: heroGalleryTargets.type }],
                mode: "conditional",
              },
              defaultValue: HERO_GALLERY_DEFAULTS.sphere.bendX * 100,
              description:
                "Signed horizontal profile: +100% is the concave inverse fisheye whose sides approach the viewer, -100% is the classic convex fisheye whose sides recede, and 0% keeps the sides flat.",
              label: "Bend X",
              max: 100,
              min: -100,
              performanceReason:
                "The signed horizontal lens profile must remain live throughout slider gestures.",
              performanceRole: "responsiveness",
              semanticGroup: "lens-shape",
              sliderValueKind: "continuous",
              step: 1,
              target: heroGalleryTargets.sphereBendX,
              type: "slider",
              unit: "%",
              variant: "continuous",
            },
            bendY: {
              applicability: {
                all: [{ equals: "sphere", target: heroGalleryTargets.type }],
                mode: "conditional",
              },
              defaultValue: HERO_GALLERY_DEFAULTS.sphere.bendY * 100,
              description:
                "Signed vertical profile for rows above and below the centre: +100% bends them toward the viewer, -100% away from it, and 0% leaves a vertical cylinder.",
              label: "Bend Y",
              max: 100,
              min: -100,
              performanceReason:
                "The signed vertical lens profile must remain live throughout slider gestures.",
              performanceRole: "responsiveness",
              semanticGroup: "lens-shape",
              sliderValueKind: "continuous",
              step: 1,
              target: heroGalleryTargets.sphereBendY,
              type: "slider",
              unit: "%",
              variant: "continuous",
            },
          },
          id: "lens",
          title: "Lens",
        },
        {
          controls: {
            position: {
              applicability: { mode: "always" },
              coordinateMode: "screen",
              defaultValue: HERO_GALLERY_DEFAULTS.position,
              description:
                "Moves the full gallery composition across the hero canvas.",
              label: "Position",
              performanceReason:
                "Two-axis gallery placement must remain live throughout pad gestures.",
              performanceRole: "responsiveness",
              target: heroGalleryTargets.position,
              type: "vector",
            },
            pan: {
              applicability: {
                all: [{ equals: "sphere", target: heroGalleryTargets.type }],
                mode: "conditional",
              },
              coordinateMode: "screen",
              defaultValue: HERO_GALLERY_DEFAULTS.sphere.pan,
              description:
                "Slides the image panel through the fixed lens: X scrolls every row along the lens and wraps at ±180°, Y cycles the row stack (±1 is half a stack period).",
              label: "Pan",
              orderRole: "spatial",
              performanceReason:
                "Two-axis panel pan must remain live throughout pad and canvas gestures.",
              performanceRole: "responsiveness",
              target: heroGalleryTargets.pan,
              type: "vector",
            },
          },
          id: "gallery-placement",
          title: "Gallery Placement",
        },
        {
          controls: {
            enabled: {
              applicability: {
                all: [{ equals: "sphere", target: heroGalleryTargets.type }],
                mode: "conditional",
              },
              defaultValue: HERO_GALLERY_DEFAULTS.sphere.autoScroll.enabled,
              description:
                "Periodically jumps the gallery to another spot; turn off while tuning the scene",
              label: "Auto scroll",
              performanceReason:
                "The website-owned autonomous jump cycle must start and stop immediately.",
              performanceRole: "responsiveness",
              target: heroGalleryTargets.autoScrollEnabled,
              type: "switch",
            },
            interval: {
              applicability: {
                all: [
                  { equals: "sphere", target: heroGalleryTargets.type },
                  {
                    equals: true,
                    target: heroGalleryTargets.autoScrollEnabled,
                  },
                ],
                mode: "conditional",
              },
              defaultValue: HERO_GALLERY_DEFAULTS.sphere.autoScroll.interval,
              description:
                "Pause between automatic jumps to another gallery spot",
              label: "Interval",
              max: 60,
              min: 0.5,
              performanceReason:
                "The retained website timer must adopt the edited pause without rebuilding the scene.",
              performanceRole: "responsiveness",
              sliderValueKind: "continuous",
              step: 0.5,
              target: heroGalleryTargets.autoScrollInterval,
              type: "slider",
              unit: "s",
              variant: "continuous",
            },
            duration: {
              applicability: {
                all: [
                  { equals: "sphere", target: heroGalleryTargets.type },
                  {
                    equals: true,
                    target: heroGalleryTargets.autoScrollEnabled,
                  },
                ],
                mode: "conditional",
              },
              defaultValue: HERO_GALLERY_DEFAULTS.sphere.autoScroll.duration,
              description:
                "How long each automatic jump takes; shorter is sharper and smears more",
              label: "Jump time",
              max: 2,
              min: 0.15,
              performanceReason:
                "The retained website glide must adopt the edited duration without rebuilding the scene.",
              performanceRole: "responsiveness",
              sliderValueKind: "continuous",
              step: 0.05,
              target: heroGalleryTargets.autoScrollDuration,
              type: "slider",
              unit: "s",
              variant: "continuous",
            },
          },
          id: "auto-scroll",
          title: "Auto Scroll",
        },
        ...heroDispersionControlSections,
        ...heroEffectsControlSections,
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
  toolbar: {
    history: true,
    radar: true,
    zoom: true,
  },
});
