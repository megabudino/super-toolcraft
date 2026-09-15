import { defineToolcraft } from "@/toolcraft/runtime";

import { appIdentity } from "./app-identity";
import { bandLayoutControls, logoPositionControls } from "./globe-band-controls";
import { logoScaleControls } from "./globe-logo-scale-controls";
import {
  GLOBE_DEFAULTS,
  GLOBE_SCENE_SIZE,
  GLOBE_TARGETS,
} from "./globe-constants";

export const appSchema = defineToolcraft({
  canvas: {
    enabled: true,
    renderScale: true,
    size: {
      height: GLOBE_SCENE_SIZE.height,
      unit: "px",
      width: GLOBE_SCENE_SIZE.width,
    },
    sizing: {
      mode: "editable-output",
    },
    upload: false,
  },
  identity: appIdentity,
  panels: {
    controls: {
      sections: [
        {
          controls: {
            includeBackground: {
              applicability: { mode: "always" },
              defaultValue: GLOBE_DEFAULTS.includeBackground,
              description:
                "Shows the black product background in bounded preview and PNG export.",
              label: "Include",
              performanceReason:
                "Changing background inclusion should update preview/export semantics without changing geometry.",
              performanceRole: "responsiveness",
              target: GLOBE_TARGETS.includeBackground,
              type: "switch",
            },
            background: {
              applicability: { mode: "always" },
              defaultValue: GLOBE_DEFAULTS.background,
              label: false,
              performanceReason:
                "Background color changes the visible canvas fill and exported image background.",
              performanceRole: "responsiveness",
              target: GLOBE_TARGETS.background,
              type: "color",
            },
          },
          id: "background",
          layoutGroups: [
            {
              columns: 2,
              controls: ["includeBackground", "background"],
              layout: "inline",
            },
          ],
          title: "Background",
        },
        {
          controls: {
            sphereColor: {
              applicability: { mode: "always" },
              defaultValue: GLOBE_DEFAULTS.sphereColor,
              description:
                "Opaque globe body color. The requested default matches the black background.",
              label: "Sphere",
              orderRole: "color",
              performanceReason:
                "Sphere color changes shading output while preserving geometry.",
              performanceRole: "responsiveness",
              semanticGroup: "appearance",
              target: GLOBE_TARGETS.sphereColor,
              type: "color",
            },
            lineColor: {
              applicability: { mode: "always" },
              defaultValue: GLOBE_DEFAULTS.lineColor,
              label: "Lines",
              orderRole: "color",
              performanceReason:
                "Line color changes the rendered grid without changing workload.",
              performanceRole: "responsiveness",
              semanticGroup: "appearance",
              target: GLOBE_TARGETS.lineColor,
              type: "color",
            },
            latitudeCount: {
              applicability: { mode: "always" },
              defaultValue: GLOBE_DEFAULTS.latitudeCount,
              description: "Controls the number of horizontal latitude rings.",
              label: "Latitudes",
              max: 25,
              min: 3,
              orderRole: "primary",
              performanceReason:
                "Latitude count directly changes generated line geometry.",
              performanceRole: "workload",
              semanticGroup: "grid",
              sliderValueKind: "discrete",
              step: 1,
              target: GLOBE_TARGETS.latitudeCount,
              type: "slider",
              variant: "discrete",
            },
            meridianCount: {
              applicability: { mode: "always" },
              defaultValue: GLOBE_DEFAULTS.meridianCount,
              description: "Controls the number of vertical meridian arcs.",
              label: "Meridians",
              max: 48,
              min: 4,
              orderRole: "primary",
              performanceReason:
                "Meridian count directly changes generated line geometry.",
              performanceRole: "workload",
              semanticGroup: "grid",
              sliderValueKind: "continuous",
              step: 1,
              target: GLOBE_TARGETS.meridianCount,
              type: "slider",
            },
            lineWidth: {
              applicability: { mode: "always" },
              defaultValue: GLOBE_DEFAULTS.lineWidth,
              description: "Controls the thickness of every latitude and meridian line.",
              label: "Line width",
              max: 8,
              min: 0.5,
              orderRole: "strength",
              performanceReason:
                "Line thickness changes raster fill area and export stroke width.",
              performanceRole: "workload",
              semanticGroup: "grid",
              sliderValueKind: "continuous",
              step: 0.25,
              target: GLOBE_TARGETS.lineWidth,
              type: "slider",
              unit: "px",
            },
            orientation: {
              applicability: { mode: "always" },
              defaultValue: GLOBE_DEFAULTS.orientation,
              keyframeable: false,
              label: false,
              orderRole: "spatial",
              performanceReason:
                "Orientation drag changes the live view while reusing existing geometry.",
              performanceRole: "responsiveness",
              semanticGroup: "orientation",
              target: GLOBE_TARGETS.orientation,
              type: "orientationGizmo",
            },
          },
          id: "globe",
          title: "Globe",
        },
        {
          controls: {
            outline: {
              applicability: { mode: "always" },
              defaultValue: GLOBE_DEFAULTS.outline,
              description:
                "Draws the outer sphere circle with the current Line width.",
              label: "Outline",
              performanceReason:
                "Outline visibility changes one projected stroke without changing geometry.",
              performanceRole: "responsiveness",
              target: GLOBE_TARGETS.outline,
              type: "switch",
            },
          },
          id: "globe-outline",
          title: "Globe Outline",
        },
        {
          controls: {
            crtIntensity: {
              applicability: { mode: "always" },
              defaultValue: GLOBE_DEFAULTS.crtIntensity,
              description:
                "Strength of the foreground scanline and soft flicker pass. 0 removes the effect.",
              label: "Intensity",
              max: 100,
              min: 0,
              performanceReason:
                "CRT intensity scales one constant-cost foreground post-process without changing geometry or dot count.",
              performanceRole: "responsiveness",
              sliderValueKind: "continuous",
              step: 1,
              target: GLOBE_TARGETS.crtIntensity,
              type: "slider",
              unit: "%",
            },
          },
          id: "crt",
          title: "CRT",
        },
        {
          controls: {
            bandDistance: {
              applicability: { mode: "always" },
              defaultValue: GLOBE_DEFAULTS.bandDistance,
              description:
                "Shared offset from the sphere surface. Band radii update from this distance.",
              label: "Distance",
              max: 24,
              min: 0,
              performanceReason:
                "Band distance changes ribbon projection and the offset ring circumference.",
              performanceRole: "responsiveness",
              semanticGroup: "offset",
              sliderValueKind: "continuous",
              step: 1,
              target: GLOBE_TARGETS.bandDistance,
              type: "slider",
              unit: "%",
            },
            bandDotSize: {
              applicability: { mode: "always" },
              defaultValue: GLOBE_DEFAULTS.bandDotSize,
              description:
                "Universal dot diameter. Smaller dots fit more rows into each band.",
              label: "Dot size",
              max: 6,
              min: 1,
              performanceReason:
                "Smaller dots increase the number of dot rows drawn in every band.",
              performanceRole: "workload",
              semanticGroup: "dot-grid",
              sliderValueKind: "continuous",
              step: 0.25,
              target: GLOBE_TARGETS.bandDotSize,
              type: "slider",
              unit: "px",
            },
            bandColumnSpacing: {
              applicability: { mode: "always" },
              defaultValue: GLOBE_DEFAULTS.bandColumnSpacing,
              description:
                "Distance between vertical dot columns. Smaller values create more columns.",
              label: "Column spacing",
              max: 18,
              min: 3,
              performanceReason:
                "Smaller spacing increases the number of dot columns drawn in every band.",
              performanceRole: "workload",
              semanticGroup: "dot-grid",
              sliderValueKind: "continuous",
              step: 0.5,
              target: GLOBE_TARGETS.bandColumnSpacing,
              type: "slider",
              unit: "px",
            },
          },
          id: "bands",
          title: "Bands",
        },
        {
          controls: bandLayoutControls,
          id: "band-layout",
          title: "Band Layout",
        },
        {
          controls: {
            introRun: {
              actions: [
                {
                  icon: "rotate-ccw",
                  label: "Run logos",
                  value: GLOBE_TARGETS.logoIntroRun,
                },
              ],
              applicability: { mode: "always" },
              description:
                "Restarts the staggered reference-paced logo orbit cycle.",
              label: "Loop",
              performanceReason:
                "Resets the autonomous preview loop without changing dot cardinality or export workload.",
              performanceRole: "responsiveness",
              target: GLOBE_TARGETS.logoIntroRun,
              type: "actions",
            },
            holdSeconds: {
              applicability: { mode: "always" },
              defaultValue: GLOBE_DEFAULTS.logoHoldSeconds,
              description:
                "How long each logo stays at its final position before continuing around the globe.",
              label: "Hold",
              max: 8,
              min: 0,
              performanceReason:
                "Changes the autonomous loop timing without changing dot count or export workload.",
              performanceRole: "responsiveness",
              sliderValueKind: "continuous",
              step: 0.25,
              target: GLOBE_TARGETS.logoHoldSeconds,
              type: "slider",
              unit: "s",
            },
            speed: {
              applicability: { mode: "always" },
              defaultValue: GLOBE_DEFAULTS.logoSpeed,
              description:
                "Scales the logo orbit tempo while Hold remains an exact pause in seconds.",
              label: "Speed",
              max: 2.5,
              min: 0.5,
              performanceReason:
                "Changes autonomous logo-loop timing without changing dot count or export workload.",
              performanceRole: "responsiveness",
              sliderValueKind: "continuous",
              step: 0.05,
              target: GLOBE_TARGETS.logoSpeed,
              type: "slider",
            },
            ...logoPositionControls,
          },
          id: "logos",
          title: "Logos",
        },
        {
          controls: logoScaleControls,
          id: "logo-scale",
          title: "Logo Scale",
        },
        {
          controls: {
            imageFormat: {
              applicability: { mode: "always" },
              defaultValue: "png",
              label: "Format",
              options: [
                { label: "PNG", value: "png" },
                { label: "JPG", value: "jpg" },
              ],
              performanceReason:
                "Image format changes runtime-owned artifact encoding only.",
              performanceRole: "responsiveness",
              target: "export.image.format",
              type: "select",
            },
            imageResolution: {
              applicability: { mode: "always" },
              defaultValue: "4k",
              label: "Resolution",
              options: [
                { label: "2K", value: "2k" },
                { label: "4K", value: "4k" },
                { label: "8K", value: "8k" },
              ],
              performanceReason:
                "Image resolution changes runtime-owned export dimensions.",
              performanceRole: "workload",
              target: "export.image.resolution",
              type: "select",
            },
          },
          id: "image-export",
          layoutGroups: [
            {
              columns: 2,
              controls: ["imageFormat", "imageResolution"],
              layout: "inline",
            },
          ],
          title: "Image Export",
        },
        {
          actionGroup: "secondary",
          controls: {
            outputActions: {
              actions: [
                {
                  icon: "upload-simple",
                  label: "Export PNG",
                  role: "export-image",
                  value: "export.png",
                },
              ],
              applicability: { mode: "always" },
              target: "actions.output",
              type: "panelActions",
            },
          },
          id: "export-actions",
          title: "Export",
        },
      ],
      title: "Globe Controls",
    },
  },
  toolbar: {
    history: true,
    radar: true,
    zoom: true,
  },
});
