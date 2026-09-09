import { defineToolcraft } from "@/toolcraft/runtime";

import { defaultMicrographicsValues } from "./default-settings";
import { micrographKits } from "./template-catalog";
import { micrographCoverPresets } from "./template-covers";

const responsive = {
  performanceReason:
    "The control updates the visible SVG micrographics overlay and must remain live during editing.",
  performanceRole: "responsiveness" as const,
};

export const appSchema = defineToolcraft({
  canvas: {
    draggable: true,
    enabled: true,
    renderScale: false,
    size: { height: 1350, unit: "px", width: 1080 },
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
            seed: {
              ...responsive,
              defaultValue: defaultMicrographicsValues["composition.seed"],
              description:
                "Selects the deterministic layout and content variation used by the generator.",
              label: "Seed",
              max: 999,
              min: 1,
              orderRole: "primary",
              sliderValueKind: "continuous",
              step: 1,
              target: "composition.seed",
              type: "slider",
            },
            count: {
              defaultValue: defaultMicrographicsValues["composition.count"],
              description:
                "Sets how many micrographic elements the generator places on the poster.",
              label: "Elements",
              markerCount: 14,
              max: 16,
              min: 3,
              orderRole: "primary",
              performanceReason:
                "Each element adds a complete template composition to the SVG overlay.",
              performanceRole: "workload",
              sliderValueKind: "discrete",
              step: 1,
              target: "composition.count",
              type: "slider",
              variant: "discrete",
            },
            kit: {
              ...responsive,
              defaultValue: defaultMicrographicsValues["composition.kit"],
              description:
                "Restricts generation to one template family for a tighter visual system.",
              label: "Kit",
              options: micrographKits.map((kit) => ({
                label: kit.label,
                value: kit.id,
              })),
              orderRole: "mode",
              target: "composition.kit",
              type: "select",
            },
            templateTier: {
              defaultValue: "both",
              description:
                "Chooses whether seeded random compositions use Simple templates, Mega templates, or both.",
              label: "Random type",
              options: [
                { label: "Simple", value: "simple" },
                { label: "Mega", value: "mega" },
                { label: "Both", value: "both" },
              ],
              orderRole: "mode",
              performanceReason:
                "Mega templates emit denser SVG grammars than Simple templates, so the selected random tier changes scene construction cost.",
              performanceRole: "workload",
              target: "composition.templateTier",
              type: "segmented",
            },
            commands: {
              actions: [
                { icon: "shuffle", label: "Shuffle", value: "shuffle" },
                { icon: "wand-sparkles", label: "Reset layout", value: "reset-layout" },
              ],
              defaultValue: defaultMicrographicsValues["composition.layout"],
              label: "Compose",
              orderRole: "action",
              performanceReason:
                "Composition commands update the visible poster through bounded runtime state changes.",
              performanceRole: "responsiveness",
              target: "composition.layout",
              type: "actions",
            },
          },
          title: "Composition",
        },
        {
          controls: {
            template: {
              ...responsive,
              defaultValue: "",
              description:
                "Click a template, then click the poster, or drag the template directly onto the poster.",
              label: false,
              orderRole: "primary",
              target: "library.template",
              type: "templateLibrary",
            } as never,
          },
          title: "Template Library",
        },
        {
          controls: {
            scale: {
              ...responsive,
              defaultValue: defaultMicrographicsValues["elements.scale"],
              description:
                "Scales the generated footprint of every element without changing canvas size.",
              label: "Scale",
              max: 160,
              min: 60,
              orderRole: "spatial",
              sliderValueKind: "continuous",
              step: 1,
              target: "elements.scale",
              type: "slider",
              unit: "%",
            },
            opacity: {
              ...responsive,
              defaultValue: 100,
              label: "Opacity",
              max: 100,
              min: 30,
              orderRole: "strength",
              sliderValueKind: "continuous",
              step: 1,
              target: "elements.opacity",
              type: "slider",
              unit: "%",
            },
          },
          title: "Elements",
        },
        {
          controls: {
            color: {
              ...responsive,
              defaultValue: "#FFFFFF",
              label: false,
              orderRole: "color",
              target: "ink.color",
              type: "color",
            },
            glow: {
              ...responsive,
              defaultValue: 0,
              description:
                "Adds a soft light halo around every element, glowing in each element's own color.",
              label: "Glow",
              max: 100,
              min: 0,
              orderRole: "strength",
              sliderValueKind: "continuous",
              step: 1,
              target: "ink.glow",
              type: "slider",
              unit: "%",
            },
          },
          title: "Global Color",
        },
        {
          controls: {
            colors: {
              addLabel: "Add color",
              defaultValue: [
                { hex: "#FFFFFF" },
                { hex: "#0F0F0F" },
                { hex: "#E6FF4A" },
                { hex: "#FF5C38" },
              ],
              itemControl: { label: false, type: "color" },
              label: "Colors",
              minItems: 1,
              orderRole: "color",
              performanceReason:
                "Palette colors feed the selection swatches that recolor individual elements in the live SVG overlay.",
              performanceRole: "responsiveness",
              recommendedMaxItems: 8,
              removeLabel: "Remove color",
              target: "palette.colors",
              type: "collectionActions",
            },
          },
          title: "Palette",
        },
        {
          controls: {
            preset: {
              ...responsive,
              defaultValue: defaultMicrographicsValues["source.preset"],
              description:
                "Applies one of the bundled cover backgrounds; an uploaded photo always wins over a preset.",
              items: micrographCoverPresets.map((preset) => ({
                alt: preset.label,
                src: preset.src,
                value: preset.id,
              })),
              label: "Cover",
              orderRole: "mode",
              target: "source.preset",
              type: "imagePicker",
            },
            image: {
              ...responsive,
              accept: "image/*",
              assetKind: "image",
              defaultValue: null,
              description:
                "Adds the full-bleed photograph the micrographics are stamped over.",
              label: "Photo",
              multiple: false,
              orderRole: "input",
              target: "source.image",
              type: "fileDrop",
            },
          },
          title: "Source Photo",
        },
        {
          controls: {
            include: {
              ...responsive,
              defaultValue: true,
              label: "Include",
              orderRole: "primary",
              target: "export.includeBackground",
              type: "switch",
            },
            color: {
              ...responsive,
              defaultValue: "#141414",
              label: false,
              orderRole: "color",
              target: "appearance.background",
              type: "color",
            },
          },
          layoutGroups: [
            {
              columns: 2,
              controls: ["include", "color"],
              layout: "inline",
            },
          ],
          title: "Background",
        },
        {
          controls: {
            format: {
              ...responsive,
              defaultValue: "png",
              label: "Format",
              options: [
                { label: "PNG", value: "png" },
                { label: "JPG", value: "jpg" },
              ],
              orderRole: "primary",
              target: "export.image.format",
              type: "select",
            },
            resolution: {
              ...responsive,
              defaultValue: "4k",
              label: "Resolution",
              options: [
                { label: "2K", value: "2k" },
                { label: "4K", value: "4k" },
                { label: "8K", value: "8k" },
              ],
              orderRole: "primary",
              target: "export.image.resolution",
              type: "select",
            },
          },
          layoutGroups: [
            {
              columns: 2,
              controls: ["format", "resolution"],
              layout: "inline",
            },
          ],
          title: "Image Export",
        },
        {
          actionGroup: "primary",
          controls: {
            export: {
              actions: [
                {
                  icon: "upload-simple",
                  label: "Export PNG",
                  role: "export-image",
                  value: "export-png",
                },
              ],
              label: false,
              target: "output.export",
              type: "panelActions",
            },
          },
        },
      ],
      title: "Micrographics",
    },
  },
  persistence: {
    include: ["values", "canvas", "media", "panels"],
    key: "toolcraft:micrographics:state:v2",
    storage: "localStorage",
    version: 2,
  },
  settingsTransfer: {
    appId: "micrographics",
    enabled: "auto",
    fileName: "micrographics-settings.json",
  },
  toolbar: {
    history: true,
    radar: true,
    theme: true,
    zoom: true,
  },
});
