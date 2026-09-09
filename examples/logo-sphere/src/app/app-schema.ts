import { defineToolcraft } from "@/toolcraft/runtime";

import { appIdentity } from "./app-identity";
import { logoSphereDefaultAssets } from "./logo-sphere-assets";

const always = { mode: "always" } as const;

export const appSchema = defineToolcraft({
  canvas: {
    draggable: true,
    enabled: true,
    renderScale: true,
    size: { height: 1080, unit: "px", width: 1920 },
    sizing: { defaultMode: "infinite", mode: "editable-output" },
    upload: true,
  },
  identity: appIdentity,
  media: {
    defaultAssets: logoSphereDefaultAssets,
  },
  panels: {
    controls: {
      sections: [
        {
          controls: {
            defaultSet: {
              accept: ".svg,image/svg+xml",
              applicability: always,
              assetKind: "file",
              defaultValue: [],
              description:
                "The supplied vector bundle contains 30 SVG cards; replacing it with one SVG repeats that file over the sphere.",
              hardMaxItems: 1,
              label: "Included SVG set",
              multiple: false,
              orderRole: "input",
              performanceReason:
                "Replacing the attached SVG source changes the fallback vector resource and visible card assignment.",
              performanceRole: "responsiveness",
              recommendedMaxItems: 1,
              target: "logos.defaults",
              type: "fileDrop",
            },
            sources: {
              accept: "image/*",
              applicability: always,
              assetKind: "image",
              defaultValue: [],
              description:
                "Uploaded images override the included SVG set and repeat when there are fewer images than visible positions.",
              hardMaxItems: 72,
              label: "Logo images",
              multiple: true,
              orderRole: "input",
              performanceReason:
                "Importing and reordering images changes source-bound decode resources and visible logo assignment.",
              performanceRole: "responsiveness",
              recommendedMaxItems: 40,
              target: "logos.sources",
              type: "fileDrop",
            },
          },
          id: "logos",
          title: "Logos",
        },
        {
          controls: {
            visibleCount: {
              applicability: always,
              defaultValue: 63,
              description:
                "Sets how many evenly spaced fill points cover the sphere; source logos repeat onto the points as needed.",
              label: "Points",
              max: 500,
              min: 6,
              orderRole: "primary",
              performanceReason:
                "Visible card count linearly controls projection and composite work per frame.",
              performanceRole: "workload",
              semanticGroup: "sphere-fill",
              sliderValueKind: "continuous",
              step: 1,
              target: "sphere.visibleCount",
              type: "slider",
            },
            distribution: {
              applicability: always,
              defaultValue: "grid",
              description:
                "Fibonacci is evenly scattered; Rings emphasizes horizontal latitude bands; Grid wraps upright sphere-distorted cards onto evenly spaced organic fill points around the whole ball.",
              label: "Distribution",
              options: [
                { label: "Fibonacci", value: "fibonacci" },
                { label: "Rings", value: "rings" },
                { label: "Grid", value: "grid" },
              ],
              orderRole: "mode",
              performanceReason:
                "Grid adds a clipped surface texture mesh per visible card, making distribution an independent renderer workload dimension.",
              performanceRole: "workload",
              semanticGroup: "sphere-fill",
              target: "sphere.distribution",
              type: "segmented",
            },
            radius: {
              applicability: always,
              defaultValue: 360,
              description:
                "Sets the sphere radius, from a compact ball to one far larger than the frame.",
              label: "Sphere radius",
              max: 1600,
              min: 140,
              orderRole: "spatial",
              performanceReason:
                "Sphere radius changes projection math while preserving the same card count.",
              performanceRole: "responsiveness",
              semanticGroup: "sphere-body",
              sliderValueKind: "continuous",
              step: 10,
              target: "sphere.radius",
              type: "slider",
              unit: "px",
            },
            logoSize: {
              applicability: always,
              defaultValue: 110,
              label: "Logo size",
              max: 220,
              min: 56,
              orderRole: "detail",
              performanceReason:
                "Card size updates composite geometry without changing workload cardinality.",
              performanceRole: "responsiveness",
              semanticGroup: "sphere-body",
              sliderValueKind: "continuous",
              step: 2,
              target: "sphere.logoSize",
              type: "slider",
              unit: "px",
            },
            depth: {
              applicability: always,
              defaultValue: 66,
              description:
                "Lower values flatten the cluster; higher values create stronger front-to-back volume.",
              label: "Depth",
              max: 120,
              min: 25,
              orderRole: "detail",
              performanceReason:
                "Depth changes projection and opacity coefficients for the current cards.",
              performanceRole: "responsiveness",
              semanticGroup: "sphere-lens",
              sliderValueKind: "continuous",
              step: 1,
              target: "sphere.depth",
              type: "slider",
              unit: "%",
            },
            perspective: {
              applicability: always,
              defaultValue: 2.2,
              description:
                "Lower values exaggerate the front-to-back size difference.",
              label: "Perspective",
              max: 5,
              min: 1.6,
              orderRole: "detail",
              performanceReason:
                "Perspective changes per-card scale without changing workload cardinality.",
              performanceRole: "responsiveness",
              semanticGroup: "sphere-lens",
              sliderValueKind: "continuous",
              step: 0.1,
              target: "sphere.perspective",
              type: "slider",
            },
            fisheye: {
              applicability: always,
              defaultValue: 46,
              description:
                "Widens the lens while the framing holds, so the nearest logos grow and distort against their neighbors.",
              label: "Fisheye",
              max: 100,
              min: 0,
              orderRole: "detail",
              performanceReason:
                "Fisheye changes per-card projection scale without changing workload cardinality.",
              performanceRole: "responsiveness",
              semanticGroup: "sphere-lens",
              sliderValueKind: "continuous",
              step: 1,
              target: "sphere.fisheye",
              type: "slider",
              unit: "%",
            },
            orientation: {
              applicability: always,
              defaultValue: {
                position: [0.033405701706035754, 4.839599778675587, -1.25584952973559],
                up: [-0.02573764723262314, 0.2512587496779799, 0.967577704489509],
              },
              keyframeable: false,
              label: false,
              orderRole: "spatial",
              performanceReason:
                "Direct orbit and the gizmo update the shared camera pose consumed by projection.",
              performanceRole: "responsiveness",
              semanticGroup: "sphere-pose",
              target: "view.orbit",
              type: "orientationGizmo",
            },
          },
          id: "sphere",
          title: "Sphere",
        },
        {
          controls: {
            maskSize: {
              applicability: always,
              defaultValue: 109,
              description:
                "Sets how far the visible field extends before the outer fade completes.",
              label: "Mask size",
              max: 125,
              min: 55,
              orderRole: "primary",
              performanceReason:
                "Mask size changes the bounded radial alpha composite for the current frame.",
              performanceRole: "responsiveness",
              sliderValueKind: "continuous",
              step: 1,
              target: "fade.maskSize",
              type: "slider",
              unit: "%",
            },
            feather: {
              applicability: always,
              defaultValue: 30,
              description: "Controls the width of the soft outer transition.",
              label: "Feather",
              max: 60,
              min: 2,
              orderRole: "strength",
              performanceReason:
                "Feather changes the width of the bounded radial alpha composite.",
              performanceRole: "responsiveness",
              sliderValueKind: "continuous",
              step: 1,
              target: "fade.feather",
              type: "slider",
              unit: "%",
            },
            rearOpacity: {
              applicability: always,
              defaultValue: 10,
              description:
                "Sets the minimum opacity of logos on the far hemisphere.",
              label: "Rear opacity",
              max: 100,
              min: 0,
              orderRole: "strength",
              performanceReason:
                "Rear opacity changes per-card alpha without changing workload cardinality.",
              performanceRole: "responsiveness",
              sliderValueKind: "continuous",
              step: 1,
              target: "fade.rearOpacity",
              type: "slider",
              unit: "%",
            },
          },
          id: "fade-mask",
          title: "Fade Mask",
        },
        {
          controls: {
            strokeWidth: {
              applicability: always,
              defaultValue: 0.5,
              description:
                "Screen-space outline thickness stays constant as cards move nearer or farther away.",
              label: "Stroke width",
              max: 8,
              min: 0,
              orderRole: "strength",
              performanceReason:
                "Stroke width changes one constant-width path stroke per visible card.",
              performanceRole: "responsiveness",
              sliderValueKind: "continuous",
              step: 0.25,
              target: "card.strokeWidth",
              type: "slider",
              unit: "px",
            },
            strokeColor: {
              applicability: always,
              defaultValue: "#D7D6D2",
              description:
                "Colors only the outer card contour and preserves the authored SVG colors.",
              label: "Stroke color",
              orderRole: "color",
              performanceReason:
                "Stroke color changes one path style per visible card.",
              performanceRole: "responsiveness",
              target: "card.strokeColor",
              type: "color",
            },
            cornerRadius: {
              applicability: always,
              defaultValue: 12,
              description:
                "Base card-space radius scales with perspective, so distant SVG cards have proportionally smaller visible corners.",
              label: "Corner radius",
              max: 32,
              min: 0,
              orderRole: "detail",
              performanceReason:
                "Corner radius changes the rounded clip and outline geometry per visible card.",
              performanceRole: "responsiveness",
              sliderValueKind: "continuous",
              step: 1,
              target: "card.cornerRadius",
              type: "slider",
              unit: "px",
            },
            shadowColor: {
              applicability: always,
              defaultValue: "#171717",
              label: "Shadow color",
              orderRole: "color",
              performanceReason:
                "Shadow color changes the existing depth-scaled card shadow style.",
              performanceRole: "responsiveness",
              target: "card.shadowColor",
              type: "color",
            },
            shadowOpacity: {
              applicability: always,
              defaultValue: 28,
              description:
                "Maximum shadow opacity; distant cards are additionally attenuated by their depth opacity.",
              label: "Shadow opacity",
              max: 60,
              min: 0,
              orderRole: "strength",
              performanceReason:
                "Shadow opacity changes the shadow color alpha per visible card.",
              performanceRole: "responsiveness",
              sliderValueKind: "continuous",
              step: 1,
              target: "card.shadowOpacity",
              type: "slider",
              unit: "%",
            },
            shadowBlur: {
              applicability: always,
              defaultValue: 16,
              description:
                "Base blur follows perspective scale, producing tighter shadows on distant cards.",
              label: "Shadow blur",
              max: 32,
              min: 0,
              orderRole: "detail",
              performanceReason:
                "Shadow blur changes the bounded Canvas 2D shadow kernel per visible card.",
              performanceRole: "responsiveness",
              sliderValueKind: "continuous",
              step: 1,
              target: "card.shadowBlur",
              type: "slider",
              unit: "px",
            },
            shadowOffset: {
              applicability: always,
              defaultValue: 8,
              description:
                "Base vertical offset follows perspective scale, keeping the shadow attached to the card in depth.",
              label: "Shadow offset",
              max: 20,
              min: 0,
              orderRole: "detail",
              performanceReason:
                "Shadow offset changes one perspective-scaled displacement per visible card.",
              performanceRole: "responsiveness",
              sliderValueKind: "continuous",
              step: 1,
              target: "card.shadowOffset",
              type: "slider",
              unit: "px",
            },
          },
          id: "card-style",
          title: "Card Style",
        },
        {
          controls: {
            spinAxis: {
              applicability: always,
              defaultValue: "diagonal",
              label: "Spin axis",
              options: [
                { label: "Vert", value: "vertical" },
                { label: "Diag", value: "diagonal" },
                { label: "Horiz", value: "horizontal" },
              ],
              orderRole: "mode",
              performanceReason:
                "Axis selection changes the rotation matrix used during playback.",
              performanceRole: "responsiveness",
              target: "motion.spinAxis",
              type: "segmented",
            },
            spinAmount: {
              applicability: always,
              defaultValue: 1,
              description: "Sets the number of full turns in one timeline loop.",
              label: "Spin turns",
              max: 3,
              min: 0,
              orderRole: "strength",
              performanceReason:
                "Spin turns changes the phase-to-angle mapping during playback.",
              performanceRole: "responsiveness",
              sliderValueKind: "continuous",
              step: 0.25,
              target: "motion.spinAmount",
              type: "slider",
            },
            inertia: {
              applicability: always,
              defaultValue: 72,
              description:
                "Controls how long the sphere keeps rotating after a drag release.",
              label: "Inertia",
              max: 96,
              min: 0,
              orderRole: "strength",
              performanceReason:
                "Inertia changes the number of post-gesture projection frames.",
              performanceRole: "responsiveness",
              sliderValueKind: "continuous",
              step: 1,
              target: "motion.inertia",
              type: "slider",
              unit: "%",
            },
          },
          id: "motion",
          title: "Motion",
        },
        {
          controls: {
            includeBackground: {
              applicability: always,
              defaultValue: true,
              description:
                "Controls bounded preview and PNG background visibility; JPG stays opaque.",
              label: "Include",
              orderRole: "primary",
              performanceReason:
                "Background visibility changes preview and export composition.",
              performanceRole: "responsiveness",
              target: "export.includeBackground",
              type: "switch",
            },
            background: {
              applicability: always,
              defaultValue: "#F5F4F1",
              label: false,
              orderRole: "color",
              performanceReason:
                "Background color changes preview and export composition.",
              performanceRole: "responsiveness",
              target: "appearance.background",
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
            imageFormat: {
              applicability: always,
              defaultValue: "png",
              label: "Format",
              options: [
                { label: "PNG", value: "png" },
                { label: "JPG", value: "jpg" },
              ],
              orderRole: "mode",
              performanceReason:
                "Format selection changes the runtime-owned image encoding branch.",
              performanceRole: "responsiveness",
              target: "export.image.format",
              type: "select",
            },
            imageResolution: {
              applicability: always,
              defaultValue: "4k",
              label: "Resolution",
              options: [
                { label: "2K", value: "2k" },
                { label: "4K", value: "4k" },
                { label: "8K", value: "8k" },
              ],
              orderRole: "detail",
              performanceReason:
                "Resolution selection changes the runtime-owned export backing dimensions.",
              performanceRole: "responsiveness",
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
          actionGroup: "primary",
          controls: {
            output: {
              actions: [
                {
                  icon: "upload-simple",
                  label: "Export PNG",
                  role: "export-image",
                  value: "export.png",
                },
              ],
              applicability: always,
              target: "actions.output",
              type: "panelActions",
            },
          },
          id: "output-actions",
          title: "Export",
        },
      ],
      title: "Logo Sphere",
    },
    timeline: {
      defaultDurationSeconds: 12,
      enabled: true,
      mode: "playback",
    },
  },
  toolbar: {
    history: true,
    radar: true,
    theme: true,
    zoom: true,
  },
});
