import { defineToolcraft } from "@/toolcraft/runtime";

const resolvedAppSchema = defineToolcraft({
  canvas: {
    enabled: true,
    renderScale: {
      defaultValue: 2,
      enabled: true,
      max: 2,
      min: 1,
      step: 0.25,
    },
    size: { height: 1024, unit: "px", width: 1024 },
    sizing: { defaultMode: "infinite", mode: "editable-output" },
    upload: false,
  },
  export: {
    png: {
      background: "include",
    },
  },
  panels: {
    controls: {
      sections: [
        {
          controls: {
            audioSource: {
              accept:
                "audio/*,.aac,.aif,.aiff,.flac,.m4a,.mp3,.ogg,.wav,.webm",
              assetKind: "file",
              defaultValue: null,
              description:
                "Uses the bundled MP3 analysis by default; upload audio to drive the waveform from another track.",
              label: "Audio",
              multiple: false,
              orderRole: "input",
              performanceReason:
                "Importing audio can decode and analyze source media before preview reuses the cached profile.",
              performanceRole: "responsiveness",
              target: "audio.source",
              type: "fileDrop",
            },
          },
          id: "source-audio",
          title: "Source Audio",
        },
        {
          controls: {
            includeBackground: {
              defaultValue: true,
              description:
                "Hide the product background in preview and image export; video always keeps it.",
              label: "Background",
              orderRole: "input",
              performanceReason:
                "PNG background inclusion changes export bytes without increasing preview workload.",
              performanceRole: "responsiveness",
              target: "export.includeBackground",
              type: "switch",
            },
            background: {
              defaultValue: { hex: "#0C1A32" },
              label: "Background color",
              orderRole: "color",
              performanceReason:
                "Background color updates a single fill and should stay responsive.",
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
            radius: {
              defaultValue: 372,
              description:
                "Sets the main circular path before waveform displacement.",
              label: "Radius",
              max: 420,
              min: 180,
              orderRole: "primary",
              performanceReason:
                "Radius changes the rendered output footprint and export workload.",
              performanceRole: "responsiveness",
              step: 1,
              target: "ring.radius",
              type: "slider",
              unit: "px",
            },
            density: {
              defaultValue: 160,
              description:
                "Sets how many bead circles are distributed around each row.",
              label: "Density",
              max: 280,
              min: 48,
              orderRole: "detail",
              performanceReason:
                "Density changes bead count and directly affects renderer workload.",
              performanceRole: "workload",
              step: 1,
              target: "ring.density",
              type: "slider",
              unit: "dots",
            },
            rows: {
              defaultValue: 12,
              description:
                "Builds the outer ring from multiple concentric bead rows.",
              label: "Rows",
              markerCount: 12,
              max: 12,
              min: 1,
              orderRole: "detail",
              performanceReason:
                "Rows multiply the bead count and directly affect renderer workload.",
              performanceRole: "workload",
              step: 1,
              sliderValueKind: "discrete",
              target: "ring.rows",
              type: "slider",
              unit: "rows",
              variant: "discrete",
            },
          },
          id: "ring-pattern",
          title: "Ring Pattern",
        },
        {
          controls: {
            colorMode: {
              defaultValue: "rows",
              description:
                "Chooses how palette colors map to beads: random spread, position around the ring, row bands, or waveform energy.",
              label: "Color mode",
              options: [
                { label: "Random", value: "spread" },
                { label: "Around ring", value: "conic" },
                { label: "By row", value: "rows" },
                { label: "By energy", value: "energy" },
              ],
              orderRole: "mode",
              performanceReason:
                "Color mode changes deterministic fill selection without changing primitive count.",
              performanceRole: "responsiveness",
              target: "ring.colorMode",
              type: "select",
            },
            color1: {
              defaultValue: { hex: "#441AFF" },
              label: false,
              orderRole: "detail",
              performanceReason:
                "Color 1 updates bead fill style without changing primitive count.",
              performanceRole: "responsiveness",
              target: "ring.color1",
              type: "color",
            },
            color2: {
              defaultValue: { hex: "#3A99FF" },
              label: false,
              orderRole: "detail",
              performanceReason:
                "Color 2 updates bead fill style without changing primitive count.",
              performanceRole: "responsiveness",
              target: "ring.color2",
              type: "color",
            },
            color3: {
              defaultValue: { hex: "#7B5AFF" },
              label: false,
              orderRole: "detail",
              performanceReason:
                "Color 3 updates bead fill style without changing primitive count.",
              performanceRole: "responsiveness",
              target: "ring.color3",
              type: "color",
            },
            color4: {
              defaultValue: { hex: "#b8ff2e" },
              label: false,
              orderRole: "detail",
              performanceReason:
                "Color 4 updates bead fill style without changing primitive count.",
              performanceRole: "responsiveness",
              target: "ring.color4",
              type: "color",
            },
            color5: {
              defaultValue: { hex: "#FFAC68" },
              label: false,
              orderRole: "detail",
              performanceReason:
                "Color 5 updates bead fill style without changing primitive count.",
              performanceRole: "responsiveness",
              target: "ring.color5",
              type: "color",
            },
            colorSpread: {
              defaultValue: 55,
              label: "Spread",
              max: 100,
              min: 0,
              orderRole: "advanced",
              performanceReason:
                "Color spread updates deterministic color selection without changing primitive count.",
              performanceRole: "responsiveness",
              step: 1,
              target: "ring.colorSpread",
              type: "slider",
              unit: "%",
            },
          },
          layoutGroups: [
            {
              columns: 2,
              controls: ["color1", "color2"],
              layout: "inline",
            },
            {
              columns: 2,
              controls: ["color3", "color4"],
              layout: "inline",
            },
          ],
          id: "bead-colors",
          title: "Bead Colors",
        },
        {
          controls: {
            dotSize: {
              defaultValue: 1.05,
              description:
                "Scales the base bead radius before the waveform size response.",
              label: "Dot size",
              max: 1.8,
              min: 0.6,
              orderRole: "primary",
              performanceReason:
                "Dot size scales bead radii without changing primitive count.",
              performanceRole: "responsiveness",
              step: 0.05,
              target: "ring.dotSize",
              type: "slider",
            },
            sizeResponse: {
              defaultValue: 96,
              description:
                "Grows beads with local waveform energy so hits read through mass, not only displacement.",
              label: "Size response",
              max: 100,
              min: 0,
              orderRole: "strength",
              performanceReason:
                "Size response modulates bead radii without changing primitive count.",
              performanceRole: "responsiveness",
              step: 1,
              target: "ring.sizeResponse",
              type: "slider",
              unit: "%",
            },
            glow: {
              defaultValue: 0,
              description:
                "Adds an additive halo behind every bead using one cached sprite per palette color.",
              label: "Glow",
              max: 100,
              min: 0,
              orderRole: "strength",
              performanceReason:
                "Glow draws one cached sprite per bead without changing bead count.",
              performanceRole: "responsiveness",
              step: 1,
              target: "ring.glow",
              type: "slider",
              unit: "%",
            },
          },
          id: "bead-style",
          title: "Bead Style",
        },
        {
          controls: {
            formula: {
              defaultValue: "organic",
              description:
                "Chooses whether deformation is driven by source audio or procedural fallback fields.",
              label: "Formula",
              options: [
                { label: "Audio", value: "audio" },
                { label: "Complex", value: "complex" },
                { label: "Organic", value: "organic" },
                { label: "Turbulent", value: "turbulent" },
                { label: "Pulse", value: "pulse" },
              ],
              orderRole: "mode",
              performanceReason:
                "Formula changes waveform math without changing primitive count.",
              performanceRole: "responsiveness",
              semanticGroup: "motion",
              target: "wave.formula",
              type: "select",
            },
            speed: {
              defaultValue: 0.35,
              description:
                "Sets how quickly the audio envelope and waveform detail travel inside the seamless loop.",
              label: "Speed",
              max: 1.6,
              min: 0.2,
              orderRole: "strength",
              performanceReason:
                "Speed changes animation phase sampling without changing primitive count.",
              performanceRole: "responsiveness",
              semanticGroup: "motion",
              step: 0.05,
              target: "wave.speed",
              type: "slider",
            },
            rotationSpeed: {
              defaultValue: 0.25,
              description:
                "Sets how quickly the high-energy waveform sector travels clockwise around the ring.",
              label: "Rotation",
              max: 4,
              min: 0,
              orderRole: "strength",
              performanceReason:
                "Rotation changes waveform phase without changing primitive count.",
              performanceRole: "responsiveness",
              semanticGroup: "motion",
              step: 0.05,
              target: "wave.rotationSpeed",
              type: "slider",
              unit: "turns",
            },
            globalRotationSpeed: {
              defaultValue: -0.39,
              description:
                "Adds a travelling tangential push so neighboring beads hand off motion around the ring.",
              label: "Global rotation",
              max: 0.5,
              min: -0.5,
              orderRole: "strength",
              performanceReason:
                "Global rotation changes bead tangential offsets without changing primitive count.",
              performanceRole: "responsiveness",
              semanticGroup: "motion",
              step: 0.01,
              target: "wave.globalRotationSpeed",
              type: "slider",
              unit: "turns",
            },
            affectedAmplitude: {
              defaultValue: 156,
              description:
                "Sets the radial displacement strength inside the active waveform sector.",
              label: "Active amp",
              max: 160,
              min: 0,
              orderRole: "strength",
              performanceReason:
                "Active amplitude changes bead positions without changing primitive count.",
              performanceRole: "responsiveness",
              semanticGroup: "motion",
              step: 1,
              target: "wave.affectedAmplitude",
              type: "slider",
              unit: "px",
            },
            calmAmplitude: {
              defaultValue: 46,
              description:
                "Sets the small radial movement applied outside the active waveform sector.",
              label: "Calm amp",
              max: 64,
              min: 0,
              orderRole: "strength",
              performanceReason:
                "Calm amplitude changes bead positions without changing primitive count.",
              performanceRole: "responsiveness",
              semanticGroup: "motion",
              step: 1,
              target: "wave.calmAmplitude",
              type: "slider",
              unit: "px",
            },
            sectorAngle: {
              defaultValue: 118,
              description:
                "Sets the angular width of the high-amplitude waveform sector.",
              label: "Sector angle",
              max: 180,
              min: 30,
              orderRole: "advanced",
              performanceReason:
                "Sector angle changes bead displacement distribution without changing primitive count.",
              performanceRole: "responsiveness",
              semanticGroup: "motion",
              step: 1,
              target: "wave.sectorAngle",
              type: "slider",
              unit: "deg",
            },
            rowEcho: {
              defaultValue: 10,
              description:
                "Delays each inner row so concentric rows replay the waveform history like a radar trail.",
              label: "Row echo",
              max: 400,
              min: 0,
              orderRole: "advanced",
              performanceReason:
                "Row echo shifts per-row sampling time without changing primitive count.",
              performanceRole: "responsiveness",
              semanticGroup: "motion",
              step: 10,
              target: "wave.rowEcho",
              type: "slider",
              unit: "ms",
            },
          },
          id: "wave-motion",
          title: "Wave Motion",
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
              orderRole: "advanced",
              performanceReason:
                "Image format changes encoding after the ring frame is rendered.",
              performanceRole: "responsiveness",
              target: "export.image.format",
              type: "select",
            },
            imageResolution: {
              defaultValue: "4k",
              label: "Resolution",
              options: [
                { label: "2K", value: "2k" },
                { label: "4K", value: "4k" },
                { label: "8K", value: "8k" },
              ],
              orderRole: "advanced",
              performanceReason:
                "The selected long edge controls image pixel fill and encoding workload.",
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
              orderRole: "advanced",
              performanceReason:
                "Format changes export container selection without affecting live preview.",
              performanceRole: "responsiveness",
              target: "export.video.format",
              type: "select",
            },
            videoResolution: {
              defaultValue: "current",
              label: "Resolution",
              options: [
                { label: "Current", value: "current" },
                { label: "4K", value: "4k" },
              ],
              orderRole: "advanced",
              performanceReason:
                "Resolution changes video export dimensions and encoder workload.",
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
            exports: {
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
      title: "Dot Ring Studio",
    },
    timeline: {
      defaultDurationSeconds: 12,
      enabled: true,
      mode: "playback",
    },
  },
  persistence: {
    include: ["values", "canvas", "panels", "timeline"],
    key: "toolcraft:dot-ring-studio:state:v2",
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

const setupControls = resolvedAppSchema.panels.controls?.sections[0]?.controls;
const settingsTransferControl = setupControls?.settingsTransfer;

if (settingsTransferControl?.type === "settingsTransfer") {
  settingsTransferControl.orderRole = "input";
  settingsTransferControl.performanceReason =
    "Settings import/export serializes runtime state and should remain responsive.";
  settingsTransferControl.performanceRole = "responsiveness";
}

export const appSchema = resolvedAppSchema;
