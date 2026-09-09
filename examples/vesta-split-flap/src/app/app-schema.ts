import { defineCreativeAppsKit } from "@/creative-apps-kit/template-runtime";

import {
  vestaboardDefaultCanvasSize,
  vestaboardDefaultPersistenceVersion,
  vestaboardDefaultSettingsValues,
} from "./vestaboard-defaults";

const defaultValues = vestaboardDefaultSettingsValues;

const vestaboardSchema = defineCreativeAppsKit({
  canvas: {
    enabled: true,
    size: vestaboardDefaultCanvasSize,
    sizing: { mode: "editable-output" },
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
            tileWidth: {
              defaultValue: defaultValues["board.tile.width"],
              label: "Width",
              max: 120,
              min: 18,
              orderRole: "primary",
              performanceReason:
                "Tile width changes the board layout footprint and fit scale.",
              performanceRole: "workload",
              step: 1,
              target: "board.tile.width",
              type: "slider",
              unit: "px",
            },
            tileHeight: {
              defaultValue: defaultValues["board.tile.height"],
              label: "Height",
              max: 150,
              min: 24,
              orderRole: "primary",
              performanceReason:
                "Tile height changes the board layout footprint and fit scale.",
              performanceRole: "workload",
              step: 1,
              target: "board.tile.height",
              type: "slider",
              unit: "px",
            },
            tileGap: {
              defaultValue: defaultValues["board.tile.gap"],
              label: "Gap",
              max: 30,
              min: -1,
              orderRole: "spatial",
              performanceReason:
                "Tile gap changes the total grid dimensions and layout work.",
              performanceRole: "workload",
              step: 1,
              target: "board.tile.gap",
              type: "slider",
              unit: "px",
            },
            cellRadius: {
              defaultValue: defaultValues["board.cell.radius"],
              label: "Radius",
              max: 80,
              min: 0,
              orderRole: "spatial",
              performanceReason:
                "Cell radius repaints every computed cell without changing the grid count.",
              performanceRole: "workload",
              step: 1,
              target: "board.cell.radius",
              type: "slider",
              unit: "px",
            },
            cellFill: {
              defaultValue: defaultValues["board.cell.fill"],
              label: "Cell fill",
              orderRole: "color",
              performanceReason:
                "Cell fill color repaints every computed cell background.",
              performanceRole: "workload",
              target: "board.cell.fill",
              type: "color",
            },
            cellBorder: {
              defaultValue: defaultValues["board.cell.border"],
              label: "Cell border",
              orderRole: "color",
              performanceReason:
                "Cell border color and opacity repaint every computed cell outline.",
              performanceRole: "workload",
              target: "board.cell.border",
              type: "colorOpacity",
            },
            cellFillOpacityRange: {
              defaultValue: defaultValues["board.cell.fillOpacityRange"],
              label: "Cell opacity",
              max: 100,
              min: 0,
              orderRole: "strength",
              performanceReason:
                "Cell opacity range changes deterministic background alpha across every computed cell.",
              performanceRole: "workload",
              step: 1,
              target: "board.cell.fillOpacityRange",
              type: "rangeSlider",
              unit: "%",
            },
            cellBottomHighlightOpacityRange: {
              defaultValue: defaultValues["board.cell.bottomHighlightOpacityRange"],
              label: "Bottom opacity",
              max: 100,
              min: 0,
              orderRole: "strength",
              performanceReason:
                "Bottom opacity range changes deterministic lower-edge alpha across every computed cell.",
              performanceRole: "workload",
              step: 1,
              target: "board.cell.bottomHighlightOpacityRange",
              type: "rangeSlider",
              unit: "%",
            },
            cellBottomHighlightFillCanvas: {
              defaultValue: defaultValues["board.cell.bottomHighlightFillCanvas"],
              label: "Fill canvas",
              max: 100,
              min: 0,
              orderRole: "strength",
              performanceReason:
                "Fill canvas changes how many overlay cells receive bottom edge highlights.",
              performanceRole: "workload",
              step: 1,
              target: "board.cell.bottomHighlightFillCanvas",
              type: "slider",
              unit: "%",
            },
            cellFillSeed: {
              defaultValue: defaultValues["board.cell.fillSeed"],
              label: "Cell seed",
              max: 9999,
              min: 1,
              orderRole: "advanced",
              performanceReason:
                "Cell seed regenerates deterministic background alpha distribution.",
              performanceRole: "workload",
              step: 1,
              target: "board.cell.fillSeed",
              type: "slider",
            },
            cellBottomHighlightSeed: {
              defaultValue: defaultValues["board.cell.bottomHighlightSeed"],
              label: "Bottom seed",
              max: 9999,
              min: 1,
              orderRole: "advanced",
              performanceReason:
                "Bottom seed regenerates deterministic lower-edge alpha distribution.",
              performanceRole: "workload",
              step: 1,
              target: "board.cell.bottomHighlightSeed",
              type: "slider",
            },
          },
          title: "Board Surface",
        },
        {
          controls: {
            messageText: {
              defaultValue: defaultValues["board.text.message"],
              label: "Message",
              orderRole: "input",
              performanceReason:
                "Large message text can stress wrapping and board model generation.",
              performanceRole: "workload",
              target: "board.text.message",
              type: "code",
            },
            targetMessage: {
              defaultValue: defaultValues["board.text.targetMessage"],
              label: "Target message",
              orderRole: "input",
              performanceReason:
                "Target message changes the animated phrase transform and board model generation.",
              performanceRole: "workload",
              target: "board.text.targetMessage",
              type: "code",
            },
            finalHoldSeconds: {
              defaultValue: defaultValues["board.text.finalHoldSeconds"],
              label: "Final hold",
              max: 8,
              min: 0,
              orderRole: "primary",
              performanceReason:
                "Final hold extends the runtime timeline so the phrase keeps its transform duration while the background field stretches into the ending.",
              performanceRole: "workload",
              step: 0.1,
              target: "board.text.finalHoldSeconds",
              type: "finalHoldSlider",
              unit: "s",
            },
            uppercase: {
              defaultValue: defaultValues["board.text.uppercase"],
              label: "Uppercase",
              orderRole: "primary",
              performanceReason:
                "Uppercase remaps Message and Target message characters and rebuilds the phrase layout.",
              performanceRole: "workload",
              target: "board.text.uppercase",
              type: "switch",
            },
            letterDurationRange: {
              defaultValue: defaultValues["board.text.letterDurationRange"],
              disabledWhen: {
                equals: "drum",
                target: "board.flip.mode",
              },
              label: "Duration spread",
              max: 95,
              min: 5,
              orderRole: "primary",
              performanceReason:
                "Duration spread changes how long outgoing phrase characters flicker before disappearing.",
              performanceRole: "workload",
              step: 1,
              target: "board.text.letterDurationRange",
              type: "rangeSlider",
              unit: "%",
            },
            letterSpeed: {
              defaultValue: defaultValues["board.text.letterSpeed"],
              label: "Letter speed",
              max: 100,
              min: 1,
              orderRole: "primary",
              performanceReason:
                "Letter speed changes how tightly outgoing phrase characters launch and how many flicker at once.",
              performanceRole: "workload",
              step: 1,
              target: "board.text.letterSpeed",
              type: "slider",
              unit: "%",
            },
            outgoingOpacityRange: {
              defaultValue: defaultValues["board.text.outgoingOpacityRange"],
              label: "Outgoing opacity",
              max: 100,
              min: 0,
              orderRole: "primary",
              performanceReason:
                "Outgoing opacity changes the visible alpha of source characters that are flipping before removal.",
              performanceRole: "workload",
              step: 1,
              target: "board.text.outgoingOpacityRange",
              type: "rangeSlider",
              unit: "%",
            },
            messageFlashColorCount: {
              defaultValue: defaultValues["board.text.flashColorCount"],
              label: "Flash colors",
              max: 4,
              min: 0,
              orderRole: "primary",
              performanceReason:
                "Flash colors changes how many fill palette slots can appear on animated text cells.",
              performanceRole: "workload",
              step: 1,
              target: "board.text.flashColorCount",
              type: "slider",
            },
            messageFlashFrequency: {
              defaultValue: defaultValues["board.text.flashFrequency"],
              label: "Flash frequency",
              max: 100,
              min: 0,
              orderRole: "primary",
              performanceReason:
                "Flash frequency changes how often animated text cells receive colored fills.",
              performanceRole: "workload",
              step: 1,
              target: "board.text.flashFrequency",
              type: "slider",
              unit: "%",
            },
            messageFlashColor1: {
              defaultValue: defaultValues["board.text.flashColor1"],
              label: "Flash 1",
              orderRole: "color",
              performanceReason:
                "Flash 1 changes the first phrase flash fill palette color.",
              performanceRole: "responsiveness",
              target: "board.text.flashColor1",
              type: "color",
            },
            messageFlashColor2: {
              defaultValue: defaultValues["board.text.flashColor2"],
              label: "Flash 2",
              orderRole: "color",
              performanceReason:
                "Flash 2 changes the second phrase flash fill palette color.",
              performanceRole: "responsiveness",
              target: "board.text.flashColor2",
              type: "color",
            },
            messageFlashColor3: {
              defaultValue: defaultValues["board.text.flashColor3"],
              label: "Flash 3",
              orderRole: "color",
              performanceReason:
                "Flash 3 changes the third phrase flash fill palette color.",
              performanceRole: "responsiveness",
              target: "board.text.flashColor3",
              type: "color",
            },
            messageFlashColor4: {
              defaultValue: defaultValues["board.text.flashColor4"],
              label: "Flash 4",
              orderRole: "color",
              performanceReason:
                "Flash 4 changes the fourth phrase flash fill palette color.",
              performanceRole: "responsiveness",
              target: "board.text.flashColor4",
              type: "color",
            },
            messageTypography: {
              defaultValue: defaultValues["board.text.messageTypography"],
              label: "Main font",
              orderRole: "primary",
              performanceReason:
                "Main font changes permanent phrase text measurement, glyph rendering, and export drawing.",
              performanceRole: "workload",
              target: "board.text.messageTypography",
              type: "fontPicker",
            },
            textColor: {
              defaultValue: defaultValues["board.text.color"],
              label: "Text",
              orderRole: "color",
              performanceReason:
                "Text color changes every visible character while keeping layout stable.",
              performanceRole: "responsiveness",
              target: "board.text.color",
              type: "color",
            },
          },
          layout: "standalone",
          title: "Board Message",
        },
        {
          controls: {
            flipMode: {
              defaultValue: defaultValues["board.flip.mode"],
              label: "Flip mode",
              options: [
                { label: "Drum", value: "drum" },
                { label: "Random", value: "random" },
              ],
              orderRole: "mode",
              performanceReason:
                "Flip mode switches every animated cell between the drum spin engine and the random flicker engine.",
              performanceRole: "workload",
              target: "board.flip.mode",
              type: "segmented",
            },
            flipWear: {
              defaultValue: defaultValues["board.flip.wear"],
              disabledWhen: {
                equals: "random",
                target: "board.flip.mode",
              },
              label: "Wear",
              max: 100,
              min: 0,
              orderRole: "primary",
              performanceReason:
                "Wear inserts seeded sticky pauses into drum spins and changes per-cell flip timelines.",
              performanceRole: "workload",
              step: 1,
              target: "board.flip.wear",
              type: "slider",
              unit: "%",
            },
            soundEnabled: {
              defaultValue: defaultValues["board.sound.enabled"],
              label: "Sound",
              orderRole: "primary",
              performanceReason:
                "Sound synthesizes WebAudio flap clicks from per-frame character changes during playback.",
              performanceRole: "responsiveness",
              target: "board.sound.enabled",
              type: "switch",
            },
            flipTrailOpacity: {
              defaultValue: defaultValues["board.flip.trailOpacity"],
              label: "Trail",
              max: 100,
              min: 0,
              orderRole: "strength",
              performanceReason:
                "Trail draws an extra ghost glyph for every actively flipping cell in preview and export.",
              performanceRole: "workload",
              step: 1,
              target: "board.flip.trailOpacity",
              type: "slider",
              unit: "%",
            },
            flipShake: {
              defaultValue: defaultValues["board.flip.shake"],
              label: "Vibration",
              max: 100,
              min: 0,
              orderRole: "strength",
              performanceReason:
                "Vibration moves the whole board layer by a sub-pixel offset on every animated frame.",
              performanceRole: "workload",
              step: 1,
              target: "board.flip.shake",
              type: "slider",
              unit: "%",
            },
            soundVolume: {
              defaultValue: defaultValues["board.sound.volume"],
              disabledWhen: {
                equals: false,
                target: "board.sound.enabled",
              },
              label: "Volume",
              max: 100,
              min: 0,
              orderRole: "strength",
              performanceReason:
                "Volume changes the WebAudio master gain without changing renderer workload.",
              performanceRole: "responsiveness",
              step: 1,
              target: "board.sound.volume",
              type: "slider",
              unit: "%",
            },
          },
          title: "Flip Mechanics",
        },
        {
          controls: {
            fillStart: {
              defaultValue: defaultValues["field.fillStart"],
              label: "Start fill",
              max: 100,
              min: 0,
              orderRole: "primary",
              performanceReason:
                "Start fill changes how many non-message cells render characters at the first timeline frame.",
              performanceRole: "workload",
              step: 1,
              target: "field.fillStart",
              type: "slider",
              unit: "%",
            },
            fillEnd: {
              defaultValue: defaultValues["field.fillEnd"],
              label: "End fill",
              max: 100,
              min: 0,
              orderRole: "primary",
              performanceReason:
                "End fill changes how many non-message cells render characters at the final timeline frame.",
              performanceRole: "workload",
              step: 1,
              target: "field.fillEnd",
              type: "slider",
              unit: "%",
            },
            fieldDurationRange: {
              defaultValue: defaultValues["field.durationRange"],
              disabledWhen: {
                equals: "drum",
                target: "board.flip.mode",
              },
              label: "Field duration",
              max: 95,
              min: 5,
              orderRole: "primary",
              performanceReason:
                "Field duration changes how long animated background cells flicker before settling.",
              performanceRole: "workload",
              step: 1,
              target: "field.durationRange",
              type: "rangeSlider",
              unit: "%",
            },
            fieldSpeed: {
              defaultValue: defaultValues["field.speed"],
              label: "Field speed",
              max: 100,
              min: 1,
              orderRole: "primary",
              performanceReason:
                "Field speed changes how quickly animated background cells cycle through flicker characters.",
              performanceRole: "workload",
              step: 1,
              target: "field.speed",
              type: "slider",
              unit: "%",
            },
            fieldTypography: {
              defaultValue: defaultValues["field.typography"],
              label: "Background font",
              orderRole: "primary",
              performanceReason:
                "Background font changes random field text measurement, glyph rendering, and export drawing.",
              performanceRole: "workload",
              target: "field.typography",
              type: "fontPicker",
            },
            opacityRange: {
              defaultValue: defaultValues["field.opacityRange"],
              label: "Opacity",
              max: 100,
              min: 0,
              orderRole: "strength",
              performanceReason:
                "Opacity range changes character paint values across the field.",
              performanceRole: "responsiveness",
              step: 1,
              target: "field.opacityRange",
              type: "rangeSlider",
              unit: "%",
            },
            seed: {
              defaultValue: defaultValues["field.seed"],
              label: "Seed",
              max: 9999,
              min: 1,
              orderRole: "advanced",
              performanceReason:
                "Seed regenerates deterministic filler characters and opacities.",
              performanceRole: "responsiveness",
              step: 1,
              target: "field.seed",
              type: "slider",
            },
          },
          title: "Random Field",
        },
        {
          controls: {
            videoFormat: {
              defaultValue: defaultValues["export.video.format"],
              label: "Format",
              options: [
                { label: "Auto", value: "auto" },
                { label: "WebM", value: "webm" },
                { label: "MP4", value: "mp4" },
              ],
              orderRole: "mode",
              performanceReason:
                "Video format changes the MediaRecorder MIME/container selection.",
              performanceRole: "responsiveness",
              target: "export.video.format",
              type: "select",
            },
            videoQuality: {
              defaultValue: defaultValues["export.video.quality"],
              label: "Quality",
              options: [
                { label: "High", value: "high" },
                { label: "4K", value: "4k" },
              ],
              orderRole: "advanced",
              performanceReason:
                "Video quality changes exported video dimensions and recording workload.",
              performanceRole: "workload",
              target: "export.video.quality",
              type: "select",
            },
          },
          title: "Video Export",
        },
        {
          controls: {
            background: {
              defaultValue: defaultValues["appearance.background"],
              label: "Background",
              orderRole: "color",
              performanceReason:
                "Background changes preview and PNG background fill without changing layout.",
              performanceRole: "responsiveness",
              target: "appearance.background",
              type: "color",
            },
            includeBackground: {
              defaultValue: defaultValues["export.includeBackground"],
              label: "Background",
              orderRole: "advanced",
              performanceReason:
                "Include background changes PNG alpha export while preview stays colored.",
              performanceRole: "responsiveness",
              target: "export.includeBackground",
              type: "switch",
            },
          },
          title: "Background",
        },
        {
          actionGroup: "primary",
          controls: {
            exportActions: {
              actions: [
                {
                  icon: "export",
                  label: "Export Video",
                  value: "export-video",
                  variant: "default",
                },
                {
                  icon: "download",
                  label: "Export PNG",
                  value: "export-png",
                  variant: "secondary",
                },
              ],
              target: "panel.actions",
              type: "panelActions",
            },
          },
          title: "Export",
        },
      ],
      title: "Vesta Split-Flap",
    },
    timeline: { mode: "playback" },
  },
  persistence: {
    include: ["values", "canvas", "panels", "timeline"],
    key: "creative-apps-kit:vesta-split-flap:state:v1",
    storage: "localStorage",
    version: vestaboardDefaultPersistenceVersion,
  },
  settingsTransfer: {
    appId: "vesta-split-flap",
    enabled: true,
    fileName: "vesta-split-flap-settings.json",
  },
  toolbar: {
    history: true,
    radar: true,
    theme: true,
    zoom: true,
  },
});

for (const section of vestaboardSchema.panels.controls?.sections ?? []) {
  for (const control of Object.values(section.controls)) {
    if (control.type === "settingsTransfer") {
      control.performanceReason =
        "Settings Transfer imports and exports schema-backed app settings without changing renderer workload.";
      control.performanceRole = "responsiveness";
    }
  }
}

export const appSchema = vestaboardSchema;
