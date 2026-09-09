import { defineToolcraft } from "@/toolcraft/runtime";

import {
  createDotColorThemePaletteValue,
  DOT_COLOR_THEME_SPECTRUM,
  DOT_COLOR_THEMES,
} from "./dots/dots-theme";
import { DOTS_DEFAULT_CYCLE_SECONDS } from "./dots/dots-timing";

const responsiveness = (
  performanceReason: string,
): {
  performanceReason: string;
  performanceRole: "responsiveness";
} => ({
  performanceReason,
  performanceRole: "responsiveness",
});

export const appSchema = defineToolcraft({
  canvas: {
    enabled: true,
    renderScale: {
      defaultValue: 2,
      enabled: true,
      max: 2,
      min: 1,
      step: 0.25,
    },
    size: { height: 1350, unit: "px", width: 1080 },
    sizing: { defaultMode: "infinite", mode: "editable-output" },
    upload: false,
  },
  export: {
    png: { background: "include" },
  },
  panels: {
    controls: {
      sections: [
        {
          controls: {
            content: {
              commitMode: "content",
              defaultValue: "Hi!",
              description:
                "Use a letter, word, or short phrase as the particle target shape.",
              label: "Text",
              target: "text.content",
              textValueKind: "single-line",
              type: "text",
              ...responsiveness(
                "Typing resamples one deterministic glyph mask without increasing the configured particle boundary.",
              ),
            },
          },
          id: "text-shape",
          title: "Text Shape",
        },
        {
          controls: {
            typography: {
              defaultValue: {
                color: "#FFFFFF",
                fontId: "inter",
                fontSize: 760,
                fontWeight: "700",
                letterSpacing: "normal",
                lineHeight: "none",
                opacity: 100,
                textCase: "uppercase",
              },
              label: "Typography",
              target: "text.typography",
              type: "fontPicker",
              ...responsiveness(
                "Typography changes the sampled glyph geometry and particle tint while preserving the particle count boundary.",
              ),
            },
          },
          id: "typography",
          title: "Typography",
        },
        {
          controls: {
            count: {
              defaultValue: 1800,
              description:
                "Choose how many particles travel into the sampled text shape.",
              label: "Count",
              max: 2400,
              min: 240,
              performanceReason:
                "Particle count linearly controls target sampling, analytic motion, trail segments, dots, and export work.",
              performanceRole: "workload",
              sliderValueKind: "continuous",
              step: 40,
              target: "particles.count",
              type: "slider",
            },
            distribution: {
              defaultValue: "outline",
              description:
                "Fill the glyph, trace its edge, or blend both sampling strategies.",
              label: "Shape fill",
              options: [
                { label: "Fill", value: "fill" },
                { label: "Outline", value: "outline" },
                { label: "Mix", value: "mixed" },
              ],
              target: "particles.distribution",
              type: "segmented",
              ...responsiveness(
                "Shape fill swaps the deterministic target candidate set at the current count.",
              ),
            },
            edgeSpill: {
              defaultValue: 23,
              description:
                "Let settled dot centers spread beyond the sampled text boundary.",
              label: "Edge spill",
              max: 100,
              min: 0,
              sliderValueKind: "continuous",
              step: 1,
              target: "particles.edgeSpill",
              type: "slider",
              unit: "%",
              ...responsiveness(
                "Edge spill offsets the existing deterministic target plan without adding particles.",
              ),
            },
            launch: {
              defaultValue: "ring",
              description:
                "Select the arrangement particles leave before forming the text.",
              label: "Launch",
              options: [
                { label: "Ring", value: "ring" },
                { label: "Scatter", value: "scatter" },
                { label: "Grid", value: "grid" },
              ],
              target: "particles.launch",
              type: "segmented",
              ...responsiveness(
                "Launch mode changes only deterministic particle start positions.",
              ),
            },
            size: {
              defaultValue: [4, 11],
              description:
                "Set the smallest resting dot and the largest moving dot.",
              label: "Size range",
              max: 24,
              min: 1,
              sliderValueKind: "continuous",
              step: 1,
              target: "particles.size",
              type: "rangeSlider",
              unit: "px",
              ...responsiveness(
                "Size bounds change circle radii without changing the number of drawn primitives.",
              ),
            },
          },
          id: "particles",
          title: "Particles",
        },
        {
          controls: {
            activeDuration: {
              defaultValue: 4,
              description:
                "Set the combined formation and release time; the loop duration updates automatically.",
              label: "Active",
              max: 12,
              min: 1,
              sliderValueKind: "continuous",
              step: 0.25,
              target: "motion.activeDuration",
              type: "slider",
              unit: "s",
              ...responsiveness(
                "Active duration remaps analytic phase time without rebuilding the particle plan.",
              ),
            },
            calmDuration: {
              defaultValue: 1,
              description:
                "Set how long the settled shape remains active without changing its breathing speed.",
              label: "Calm",
              max: 6,
              min: 0.25,
              sliderValueKind: "continuous",
              step: 0.25,
              target: "motion.calmDuration",
              type: "slider",
              unit: "s",
              ...responsiveness(
                "Calm duration extends the fixed-speed idle phase without rebuilding the particle plan.",
              ),
            },
          },
          id: "timing",
          title: "Timing",
        },
        {
          controls: {
            mass: {
              defaultValue: 0.9,
              description:
                "Heavier particles respond more slowly and overshoot with a longer period.",
              label: "Mass",
              max: 3,
              min: 0.2,
              sliderValueKind: "continuous",
              step: 0.05,
              target: "physics.mass",
              type: "slider",
              ...responsiveness(
                "Mass changes the analytic spring frequency for the same particle plan.",
              ),
            },
            attraction: {
              defaultValue: 0.72,
              description:
                "Increase how strongly particles accelerate toward their text anchors.",
              label: "Attraction",
              max: 1.5,
              min: 0.1,
              sliderValueKind: "continuous",
              step: 0.01,
              target: "physics.attraction",
              type: "slider",
              ...responsiveness(
                "Attraction changes the spring response without rebuilding glyph targets.",
              ),
            },
            damping: {
              defaultValue: 0.66,
              description:
                "Lower values keep energetic oscillation; higher values settle quickly.",
              label: "Damping",
              max: 1,
              min: 0.05,
              sliderValueKind: "continuous",
              step: 0.01,
              target: "physics.damping",
              type: "slider",
              ...responsiveness(
                "Damping changes analytic spring decay for the current particle plan.",
              ),
            },
            turbulence: {
              defaultValue: 0.34,
              description:
                "Add deterministic curl and stragglers while the shape is forming.",
              label: "Turbulence",
              max: 1.2,
              min: 0,
              sliderValueKind: "continuous",
              step: 0.01,
              target: "physics.turbulence",
              type: "slider",
              ...responsiveness(
                "Turbulence adds bounded analytic offsets without adding particles.",
              ),
            },
          },
          id: "physics",
          title: "Physics",
        },
        {
          controls: {
            colorTheme: {
              actions: DOT_COLOR_THEMES.map((theme) => ({
                label: theme.label,
                value: theme.actionValue,
              })),
              label: false,
              target: "actions.colorTheme",
              type: "actions",
              ...responsiveness(
                "Applying a theme rewrites the existing palette and background values without changing particle count or renderer passes.",
              ),
            },
          },
          id: "color-theme",
          title: "Color Theme",
        },
        {
          controls: {
            palette: {
              defaultValue: createDotColorThemePaletteValue(
                DOT_COLOR_THEME_SPECTRUM,
              ),
              label: "Particle palette",
              target: "appearance.palette",
              type: "gradient",
              ...responsiveness(
                "Gradient type, angle, stops, color, position, and opacity all map directly to particle and trail colors.",
              ),
            },
          },
          id: "particle-palette",
          title: "Particle palette",
        },
        {
          controls: {
            trails: {
              defaultValue: 0.68,
              description:
                "Increase the length and visibility of motion trajectories.",
              label: "Trails",
              max: 1,
              min: 0,
              sliderValueKind: "continuous",
              step: 0.01,
              target: "appearance.trails",
              type: "slider",
              ...responsiveness(
                "Trail amount changes sample spacing and alpha for a fixed three-segment trail plan.",
              ),
            },
            sizeMotion: {
              defaultValue: 0.82,
              description:
                "Make dots grow with velocity and breathe subtly while settled.",
              label: "Size motion",
              max: 1.5,
              min: 0,
              sliderValueKind: "continuous",
              step: 0.01,
              target: "appearance.sizeMotion",
              type: "slider",
              ...responsiveness(
                "Size motion remaps analytic velocity to the configured dot-size range.",
              ),
            },
            glow: {
              defaultValue: 0,
              description:
                "Add a soft luminous halo around the colored points.",
              label: "Glow",
              max: 1,
              min: 0,
              sliderValueKind: "continuous",
              step: 0.01,
              target: "appearance.glow",
              type: "slider",
              ...responsiveness(
                "Glow changes one batched shadow style without adding primitives.",
              ),
            },
          },
          id: "dot-look",
          title: "Dot Look",
        },
        {
          controls: {
            includeBackground: {
              defaultValue: true,
              description:
                "Hide the product background in preview and image export; video always keeps it.",
              label: "Background",
              target: "export.includeBackground",
              type: "switch",
              ...responsiveness(
                "Background inclusion changes one preview and image-export composite.",
              ),
            },
            background: {
              defaultValue: DOT_COLOR_THEME_SPECTRUM.background,
              label: "Background color",
              target: "appearance.background",
              type: "color",
              ...responsiveness(
                "Background color changes the product clear color and exported pixels.",
              ),
            },
          },
          id: "background",
          title: "Background",
        },
        {
          controls: {
            imageFormat: {
              defaultValue: "png",
              label: "Format",
              options: [
                { label: "PNG", value: "png" },
                { label: "JPG", value: "jpg" },
              ],
              target: "export.image.format",
              type: "select",
              ...responsiveness(
                "Image format changes encoding after the deterministic frame is rendered.",
              ),
            },
            imageResolution: {
              defaultValue: "4k",
              label: "Resolution",
              options: [
                { label: "2K", value: "2k" },
                { label: "4K", value: "4k" },
                { label: "8K", value: "8k" },
              ],
              performanceReason:
                "The selected long edge controls image pixel fill and encoding work.",
              performanceRole: "workload",
              target: "export.image.resolution",
              type: "select",
            },
          },
          layoutGroups: [
            {
              columns: 2,
              controls: ["imageFormat", "imageResolution"],
              layout: "inline",
            },
          ],
          id: "image-export",
          title: "Image Export",
        },
        {
          controls: {
            videoFormat: {
              defaultValue: "mp4",
              label: "Format",
              options: [
                { label: "MP4", value: "mp4" },
                { label: "WebM", value: "webm" },
              ],
              target: "export.video.format",
              type: "select",
              ...responsiveness(
                "Video format selects the first supported browser container in the requested family.",
              ),
            },
            videoResolution: {
              defaultValue: "current",
              label: "Resolution",
              options: [
                { label: "Current", value: "current" },
                { label: "4K", value: "4k" },
              ],
              performanceReason:
                "Current or 4K controls per-frame pixel fill and encoding work.",
              performanceRole: "workload",
              target: "export.video.resolution",
              type: "select",
            },
          },
          layoutGroups: [
            {
              columns: 2,
              controls: ["videoFormat", "videoResolution"],
              layout: "inline",
            },
          ],
          id: "video-export",
          title: "Video Export",
        },
        {
          actionGroup: "secondary",
          controls: {
            outputActions: {
              actions: [
                {
                  icon: "upload-simple",
                  label: "Export Video",
                  role: "export-video",
                  value: "export.video",
                },
                {
                  icon: "upload-simple",
                  label: "Export PNG",
                  role: "export-image",
                  value: "export.png",
                },
              ],
              target: "actions.output",
              type: "panelActions",
            },
          },
          title: "Export",
        },
      ],
      title: "Particle Typography",
    },
    timeline: {
      defaultDurationSeconds: DOTS_DEFAULT_CYCLE_SECONDS,
      enabled: true,
      mode: "playback",
    },
  },
  persistence: {
    include: ["values", "canvas", "panels", "timeline"],
    key: "toolcraft:particle-typography:state:v2",
    storage: "localStorage",
    version: 2,
  },
  settingsTransfer: "auto",
  toolbar: {
    history: true,
    radar: true,
    theme: true,
    zoom: true,
  },
});
