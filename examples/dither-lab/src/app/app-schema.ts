import { defineToolcraft } from "@/toolcraft/runtime";

import {
  ditherDefaultCanvasSize,
  ditherDefaultSourceMediaAsset,
  ditherDefaultValues,
  ditherSourceImageTarget,
} from "./dither-defaults";

export const appSchema = defineToolcraft({
  canvas: {
    enabled: true,
    size: ditherDefaultCanvasSize,
    sizing: { mode: "intrinsic-media" },
    renderScale: true,
    upload: true,
  },
  export: {
    png: {
      background: "include",
    },
  },
  media: {
    defaultAssets: [ditherDefaultSourceMediaAsset],
  },
  panels: {
    controls: {
      title: "Dither Lab",
      sections: [
        {
          title: "Source",
          controls: {
            sourceImage: {
              accept: "PNG, JPEG, GIF, SVG, WebP",
              assetKind: "image",
              defaultValue: ditherDefaultValues.sourceImage,
              description:
                "Replace or remove the source image. Reset restores the Lyonecho artwork.",
              label: "Image",
              orderRole: "input",
              performanceReason:
                "A larger source image changes decode and pixel sampling workload.",
              performanceRole: "workload",
              target: ditherSourceImageTarget,
              type: "fileDrop",
            },
          },
        },
        {
          title: "Pixel Effect",
          controls: {
            effectStyle: {
              defaultValue: ditherDefaultValues.effectStyle,
              label: "Style",
              options: [
                { label: "None", value: "none" },
                { label: "Pixel Art", value: "pixel-art" },
                { label: "Dither", value: "dither-blend" },
                { label: "Noise Dither", value: "noise-dither" },
                { label: "Bayer Matrix", value: "bayer" },
                { label: "ASCII", value: "characters" },
                { label: "Halftone", value: "halftone" },
                { label: "Dots", value: "dots" },
                { label: "LED", value: "led" },
                { label: "LEGO", value: "lego" },
                { label: "Cross-Stitch", value: "cross-stitch" },
                { label: "Voxel", value: "voxel" },
                { label: "Lattice", value: "lattice" },
                { label: "Hex Grid", value: "hex-grid" },
              ],
              orderRole: "mode",
              performanceReason:
                "Switching style changes the renderer branch and output workload.",
              performanceRole: "workload",
              target: "effect.style",
              type: "select",
            },
            effectSize: {
              defaultValue: ditherDefaultValues.effectSize,
              label: "Size",
              max: 100,
              min: 1,
              orderRole: "primary",
              performanceReason:
                "Size changes the sampling cell size and dense effect primitive count.",
              performanceRole: "workload",
              step: 1,
              target: "effect.size",
              type: "slider",
            },
            effectFill: {
              defaultValue: ditherDefaultValues.effectFill,
              label: "Fill",
              max: 100,
              min: 0,
              orderRole: "strength",
              performanceReason:
                "Fill changes how many sampled primitives survive thresholding.",
              performanceRole: "workload",
              step: 1,
              target: "effect.fill",
              type: "slider",
              unit: "%",
              visibleWhen: {
                notEquals: "dither-blend",
                target: "effect.style",
              },
            },
            effectDensity: {
              defaultValue: ditherDefaultValues.effectDensity,
              label: "Density",
              max: 10,
              min: 1,
              orderRole: "detail",
              performanceReason:
                "Density changes contrast and ASCII spacing, affecting output workload.",
              performanceRole: "workload",
              step: 1,
              target: "effect.density",
              type: "slider",
            },
            effectExposure: {
              defaultValue: ditherDefaultValues.effectExposure,
              label: "Exposure",
              max: 200,
              min: 0,
              orderRole: "detail",
              performanceReason:
                "Exposure changes per-pixel color math but not renderer complexity.",
              performanceRole: "responsiveness",
              step: 1,
              target: "effect.exposure",
              type: "slider",
              unit: "%",
            },
            effectScatter: {
              defaultValue: ditherDefaultValues.effectScatter,
              label: "Scatter",
              max: 100,
              min: 0,
              orderRole: "advanced",
              performanceReason:
                "Scatter changes per-cell alpha distribution without adding passes.",
              performanceRole: "responsiveness",
              step: 1,
              target: "effect.scatter",
              type: "slider",
              unit: "%",
              visibleWhen: {
                notOneOf: ["dither-blend", "noise-dither", "bayer"],
                target: "effect.style",
              },
            },
            effectSeed: {
              defaultValue: ditherDefaultValues.effectSeed,
              description:
                "Changes the deterministic pattern used by Scatter, Noise, and Grain.",
              label: "Seed",
              max: 999,
              min: 1,
              orderRole: "advanced",
              performanceReason:
                "Seed changes deterministic cell opacity and texture tiles without adding passes.",
              performanceRole: "responsiveness",
              step: 1,
              target: "effect.seed",
              type: "slider",
            },
          },
        },
        {
          title: "ASCII",
          controls: {
            asciiMode: {
              defaultValue: ditherDefaultValues.asciiMode,
              label: "Style",
              options: [
                { label: "Uniform", value: "uniform" },
                { label: "Dynamic", value: "dynamic" },
                { label: "Filled", value: "filled" },
              ],
              orderRole: "mode",
              performanceReason:
                "ASCII mode switches glyph layout formulas and output density.",
              performanceRole: "workload",
              target: "effect.ascii.mode",
              type: "select",
            },
            asciiGlyphs: {
              defaultValue: ditherDefaultValues.asciiGlyphs,
              label: "Preset",
              options: [
                { label: "Classic ASCII", value: "classic" },
                { label: "Numeric", value: "numbers" },
                { label: "Hacker", value: "hacker" },
                { label: "Symbols", value: "cinematic" },
                { label: "Alpha", value: "alpha" },
                { label: "Blocky", value: "blocky" },
                { label: "Thin", value: "thin" },
                { label: "Japanese", value: "japanese" },
                { label: "Brutal", value: "brutal" },
                { label: "Retro", value: "retro" },
                { label: "Pixel", value: "pixel" },
                { label: "Tech Mono", value: "tech" },
                { label: "Custom", value: "custom" },
              ],
              orderRole: "mode",
              performanceReason:
                "Glyph choice changes text measurement and rasterization but keeps one text pass.",
              performanceRole: "workload",
              target: "effect.ascii.glyphs",
              type: "select",
            },
            asciiCustomGlyphs: {
              commitMode: "content",
              defaultValue: ditherDefaultValues.asciiCustomGlyphs,
              label: "Chars",
              orderRole: "primary",
              performanceReason:
                "Custom glyph text changes ASCII mapping content without changing canvas size.",
              performanceRole: "workload",
              target: "effect.ascii.customGlyphs",
              type: "text",
              visibleWhen: {
                equals: "custom",
                target: "effect.ascii.glyphs",
              },
            },
          },
          layoutGroups: [
            {
              columns: 2,
              controls: ["asciiMode", "asciiGlyphs"],
              layout: "inline",
            },
          ],
          visibleWhen: {
            equals: "characters",
            target: "effect.style",
          },
        },
        {
          title: "Tone",
          controls: {
            toneBrightness: {
              defaultValue: ditherDefaultValues.toneBrightness,
              label: "Brightness",
              max: 200,
              min: 0,
              orderRole: "primary",
              performanceReason:
                "Brightness invalidates the cached source preparation pass.",
              performanceRole: "responsiveness",
              step: 1,
              target: "tone.brightness",
              type: "slider",
              unit: "%",
            },
            toneContrast: {
              defaultValue: ditherDefaultValues.toneContrast,
              label: "Contrast",
              max: 200,
              min: 0,
              orderRole: "strength",
              performanceReason:
                "Contrast invalidates the cached source preparation pass.",
              performanceRole: "responsiveness",
              step: 1,
              target: "tone.contrast",
              type: "slider",
              unit: "%",
            },
            toneSaturation: {
              defaultValue: ditherDefaultValues.toneSaturation,
              label: "Saturation",
              max: 200,
              min: 0,
              orderRole: "detail",
              performanceReason:
                "Saturation invalidates the cached source preparation pass.",
              performanceRole: "responsiveness",
              step: 1,
              target: "tone.saturation",
              type: "slider",
              unit: "%",
            },
            toneHue: {
              defaultValue: ditherDefaultValues.toneHue,
              label: "Hue",
              max: 180,
              min: -180,
              orderRole: "detail",
              performanceReason:
                "Hue invalidates the cached source preparation pass.",
              performanceRole: "responsiveness",
              step: 1,
              target: "tone.hue",
              type: "slider",
              unit: "°",
            },
          },
        },
        {
          title: "Texture & Lens",
          controls: {
            finishGlow: {
              defaultValue: ditherDefaultValues.finishGlow,
              label: "Glow",
              max: 100,
              min: 0,
              orderRole: "strength",
              performanceReason:
                "Glow adds a full-canvas saturated screen-bloom pass.",
              performanceRole: "workload",
              step: 1,
              target: "finish.glow",
              type: "slider",
              unit: "%",
            },
            finishNoise: {
              defaultValue: ditherDefaultValues.finishNoise,
              label: "Noise",
              max: 100,
              min: 0,
              orderRole: "strength",
              performanceReason:
                "Noise composites a cached deterministic texture tile.",
              performanceRole: "responsiveness",
              step: 1,
              target: "finish.noise",
              type: "slider",
              unit: "%",
            },
            finishGrain: {
              defaultValue: ditherDefaultValues.finishGrain,
              label: "Grain",
              max: 100,
              min: 0,
              orderRole: "detail",
              performanceReason:
                "Grain composites a cached fine texture tile.",
              performanceRole: "responsiveness",
              step: 1,
              target: "finish.grain",
              type: "slider",
              unit: "%",
            },
            finishVignette: {
              defaultValue: ditherDefaultValues.finishVignette,
              label: "Vignette",
              max: 100,
              min: 0,
              orderRole: "detail",
              performanceReason:
                "Vignette adds a radial gradient composite without changing primitive count.",
              performanceRole: "responsiveness",
              step: 1,
              target: "finish.vignette",
              type: "slider",
              unit: "%",
            },
          },
        },
        {
          title: "Duotone",
          controls: {
            duotonePreset: {
              defaultValue: ditherDefaultValues.duotonePreset,
              label: "Preset",
              options: [
                { label: "Off", value: "off" },
                { label: "Midnight Gold", value: "midnight-gold" },
                { label: "Royal Cream", value: "royal-cream" },
                { label: "Deep Sea", value: "deep-sea" },
                { label: "Neon Violet", value: "neon-violet" },
                { label: "Ember", value: "ember" },
                { label: "Custom", value: "custom" },
              ],
              orderRole: "mode",
              performanceReason:
                "Duotone preset changes two cached finish colors and the finish composite.",
              performanceRole: "responsiveness",
              target: "duotone.preset",
              type: "select",
            },
            duotonePixels: {
              defaultValue: ditherDefaultValues.duotonePixels,
              label: "Pixels",
              orderRole: "color",
              performanceReason:
                "Pixel color changes the cached duotone finish composite.",
              performanceRole: "responsiveness",
              target: "duotone.pixels",
              type: "color",
              visibleWhen: {
                equals: "custom",
                target: "duotone.preset",
              },
            },
            duotoneBase: {
              defaultValue: ditherDefaultValues.duotoneBase,
              label: "Base",
              orderRole: "color",
              performanceReason:
                "Base color changes the cached duotone finish composite.",
              performanceRole: "responsiveness",
              target: "duotone.base",
              type: "color",
              visibleWhen: {
                equals: "custom",
                target: "duotone.preset",
              },
            },
          },
          layoutGroups: [
            {
              columns: 2,
              controls: ["duotonePixels", "duotoneBase"],
              layout: "inline",
            },
          ],
        },
        {
          title: "Layer",
          controls: {
            effectLayerOpacity: {
              defaultValue: ditherDefaultValues.effectLayerOpacity,
              label: "Opacity",
              max: 100,
              min: 0,
              orderRole: "strength",
              performanceReason:
                "Layer opacity changes final compositing only.",
              performanceRole: "responsiveness",
              step: 1,
              target: "effect.layer.opacity",
              type: "slider",
              unit: "%",
            },
            effectLayerBlend: {
              defaultValue: ditherDefaultValues.effectLayerBlend,
              label: "Blending Mode",
              options: [
                { label: "Normal", value: "source-over" },
                { label: "Screen", value: "screen" },
                { label: "Overlay", value: "overlay" },
                { label: "Color Dodge", value: "color-dodge" },
                { label: "Multiply", value: "multiply" },
              ],
              orderRole: "advanced",
              performanceReason:
                "Blend mode changes final compositing only.",
              performanceRole: "responsiveness",
              target: "effect.layer.blend",
              type: "select",
            },
          },
        },
        {
          title: "Background",
          controls: {
            includeBackground: {
              defaultValue: ditherDefaultValues.exportIncludeBackground,
              label: "Include",
              orderRole: "mode",
              performanceReason:
                "Background inclusion changes preview/export compositing only.",
              performanceRole: "responsiveness",
              target: "export.includeBackground",
              type: "switch",
            },
            backgroundColor: {
              defaultValue: ditherDefaultValues.appearanceBackground,
              label: false,
              orderRole: "color",
              performanceReason:
                "Background color changes a fill pass without changing renderer complexity.",
              performanceRole: "responsiveness",
              target: "appearance.background",
              type: "color",
            },
          },
          layoutGroups: [
            {
              columns: 2,
              controls: ["includeBackground", "backgroundColor"],
              layout: "inline",
            },
          ],
        },
        {
          title: "Image Export",
          controls: {
            imageFormat: {
              defaultValue: ditherDefaultValues.exportImageFormat,
              label: "Format",
              options: [
                { label: "PNG", value: "png" },
                { label: "JPG", value: "jpg" },
              ],
              orderRole: "mode",
              performanceReason:
                "Image format changes encoding only after rendering.",
              performanceRole: "responsiveness",
              target: "export.image.format",
              type: "select",
            },
            imageResolution: {
              defaultValue: ditherDefaultValues.exportImageResolution,
              label: "Resolution",
              options: [
                { label: "2K", value: "2k" },
                { label: "4K", value: "4k" },
                { label: "8K", value: "8k" },
              ],
              orderRole: "mode",
              performanceReason:
                "Image export resolution changes final export pixel dimensions.",
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
        },
        {
          actionGroup: "primary",
          controls: {
            exportActions: {
              actions: [
                {
                  label: "Export PNG",
                  value: "export-png",
                  variant: "default",
                },
              ],
              label: "Export",
              target: "export.actions",
              type: "panelActions",
            },
          },
          title: "Export",
        },
      ],
    },
  },
  persistence: {
    include: ["values", "canvas", "panels"],
    key: "toolcraft:dither-lab:state:v3",
    storage: "localStorage",
    version: 3,
  },
  settingsTransfer: "auto",
  toolbar: {
    history: true,
    radar: true,
    theme: true,
    zoom: true,
  },
});
