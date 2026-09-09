import type { ToolcraftControlSectionSchema } from "@/toolcraft/runtime";

import {
  DISPERSION_CAROUSEL_DEFAULTS,
  dispersionCarouselTargets,
} from "./dispersion-carousel-values";

const responsive = (reason: string) => ({
  performanceReason: reason,
  performanceRole: "responsiveness" as const,
});

function effectSlider(
  target: string,
  label: string,
  defaultValue: number,
  min: number,
  max: number,
  step: number,
  description: string,
  options: {
    applicability?:
      | { readonly mode: "always" }
      | {
          readonly all: ReadonlyArray<{
            equals?: boolean | string;
            target: string;
          }>;
          readonly mode: "conditional";
        };
    orderRole?: "primary" | "detail";
    semanticGroup?: string;
    unit?: string;
    workloadReason?: string;
  } = {},
) {
  return {
    applicability: options.applicability ?? ({ mode: "always" } as const),
    defaultValue,
    description,
    label,
    max,
    min,
    orderRole: options.orderRole ?? ("detail" as const),
    performanceReason:
      options.workloadReason ??
      "Updates one uniform in the retained screen-space dispersion pass.",
    performanceRole: options.workloadReason
      ? ("workload" as const)
      : ("responsiveness" as const),
    ...(options.semanticGroup ? { semanticGroup: options.semanticGroup } : {}),
    sliderValueKind: "continuous" as const,
    step,
    target,
    type: "slider" as const,
    ...(options.unit ? { unit: options.unit } : {}),
  };
}

const defaults = DISPERSION_CAROUSEL_DEFAULTS;
const target = dispersionCarouselTargets;

export const dispersionCarouselControlSections = [
  {
    controls: {
      edgeWidth: effectSlider(
        target.edgeWidth,
        "Edge width",
        defaults.edgeWidth,
        0,
        50,
        1,
        "Sets how far the stationary aura zone reaches inward from each side of the viewport.",
        { orderRole: "primary", unit: "%" },
      ),
      curve: effectSlider(
        target.curve,
        "Falloff",
        defaults.curve,
        0.5,
        3,
        0.05,
        "Shapes how quickly the effect strengthens inside the zone; higher values keep more of the center clean.",
      ),
      edgeFade: effectSlider(
        target.edgeFade,
        "Edge fade",
        defaults.edgeFade,
        0,
        1,
        0.01,
        "Dissolves the outermost pixels into the page background at the viewport boundary.",
      ),
      turbulence: effectSlider(
        target.turbulence,
        "Turbulence",
        defaults.turbulence,
        0,
        1,
        0.01,
        "Makes the edge halos ragged and organic; zero keeps a perfectly smooth envelope.",
      ),
      turbulenceScale: effectSlider(
        target.turbulenceScale,
        "Turbulence size",
        defaults.turbulenceScale,
        40,
        280,
        2,
        "Sets the wavelength of the ragged halo contour along the card edges.",
        { unit: "px" },
      ),
    },
    id: "edge-zone",
    title: "Edge Zone",
  },
  {
    controls: {
      warp: effectSlider(
        target.warp,
        "Warp",
        defaults.warp,
        0,
        80,
        1,
        "Sets how far cards geometrically bend. Stretch grows toward the outer rim; Prism uses it as the shift through the refractive face.",
        { orderRole: "primary", semanticGroup: "zone-warp-shape", unit: "px" },
      ),
      warpStyle: {
        applicability: { mode: "always" },
        defaultValue: defaults.warpStyle,
        description:
          "Stretch keeps the current gradual barrel. Prism places a refractive interface at the inner zone boundary so cards kink and offset as they cross the face.",
        label: "Style",
        options: [
          { label: "Stretch", value: "stretch" },
          { label: "Prism", value: "prism" },
        ],
        orderRole: "mode",
        semanticGroup: "zone-warp-shape",
        target: target.warpStyle,
        type: "segmented",
        ...responsive(
          "Selects the warp profile without changing the retained rail textures.",
        ),
      },
      warpOffset: effectSlider(
        target.warpOffset,
        "Offset",
        defaults.warpOffset,
        0,
        40,
        1,
        "Slides the warp inward from both viewport edges. Zero pins it flush to the rim so cards still touch the edge; higher values move the band inward.",
        { semanticGroup: "zone-warp-shape", unit: "%" },
      ),
      warpWaveEnabled: {
        applicability: { mode: "always" },
        defaultValue: defaults.warpWaveEnabled,
        description:
          "Turns on wave distortion in the warp band. Kind chooses the previous sine ripple or the refractive glass slab.",
        label: "Wave",
        orderRole: "primary",
        semanticGroup: "zone-warp-wave",
        target: target.warpWaveEnabled,
        type: "switch",
        ...responsive(
          "Enables wave uniforms without changing the retained rail textures.",
        ),
      },
      warpWaveKind: {
        applicability: {
          all: [{ equals: true, target: target.warpWaveEnabled }],
          mode: "conditional",
        },
        defaultValue: defaults.warpWaveKind,
        description:
          "Ripple is the earlier sideways sine. Glass refracts through a rippled slab with surface normals and lensing.",
        label: "Kind",
        options: [
          { label: "Glass", value: "glass" },
          { label: "Ripple", value: "ripple" },
        ],
        orderRole: "mode",
        semanticGroup: "zone-warp-wave",
        target: target.warpWaveKind,
        type: "segmented",
        ...responsive(
          "Selects the wave profile without changing the retained rail textures.",
        ),
      },
      warpWave: effectSlider(
        target.warpWave,
        "Strength",
        defaults.warpWave,
        0,
        48,
        1,
        "Sets how far Ripple shifts cards, or how thick the Glass slab is.",
        {
          applicability: {
            all: [{ equals: true, target: target.warpWaveEnabled }],
            mode: "conditional",
          },
          semanticGroup: "zone-warp-wave",
          unit: "px",
        },
      ),
      warpWaveLength: effectSlider(
        target.warpWaveLength,
        "Length",
        defaults.warpWaveLength,
        40,
        400,
        2,
        "Sets the dominant ripple scale. Shorter values stack tighter folds; longer values make slower waves.",
        {
          applicability: {
            all: [{ equals: true, target: target.warpWaveEnabled }],
            mode: "conditional",
          },
          semanticGroup: "zone-warp-wave",
          unit: "px",
        },
      ),
      warpWaveBlur: effectSlider(
        target.warpWaveBlur,
        "Blur",
        defaults.warpWaveBlur,
        0,
        28,
        1,
        "Softens the wave pattern and defocuses cards inside the warp band. Zero keeps the selected Kind sharp.",
        {
          applicability: {
            all: [{ equals: true, target: target.warpWaveEnabled }],
            mode: "conditional",
          },
          semanticGroup: "zone-warp-wave",
          unit: "px",
        },
      ),
      warpFace: effectSlider(
        target.warpFace,
        "Face width",
        defaults.warpFace,
        12,
        160,
        1,
        "Sets how thick the prism face is. Narrower values read as a sharp glass edge; wider values read as a slab the cards travel through.",
        {
          applicability: {
            all: [{ equals: "prism", target: target.warpStyle }],
            mode: "conditional",
          },
          semanticGroup: "zone-warp-prism",
          unit: "px",
        },
      ),
      warpSharpness: effectSlider(
        target.warpSharpness,
        "Sharpness",
        defaults.warpSharpness,
        0.4,
        4,
        0.05,
        "Concentrates the kink on the prism face. Higher values make the crossing snap; lower values soften the entry.",
        {
          applicability: {
            all: [{ equals: "prism", target: target.warpStyle }],
            mode: "conditional",
          },
          semanticGroup: "zone-warp-prism",
        },
      ),
    },
    id: "edge-warp",
    title: "Edge Warp",
  },
  {
    controls: {
      includeText: {
        applicability: { mode: "always" },
        defaultValue: defaults.includeText,
        description:
          "Includes testimonial copy in the same dispersion, blur, aura, and edge-fade sampling as the card images. Turn it off to keep the copy sharp.",
        label: "Text effect",
        orderRole: "primary",
        target: target.includeText,
        type: "switch",
        ...responsive(
          "Changes one texture-composition uniform in the retained screen-space dispersion pass.",
        ),
      },
    },
    id: "card-content",
    title: "Card Content",
  },
  {
    controls: {
      amount: effectSlider(
        target.amount,
        "Dispersion",
        defaults.amount,
        0,
        200,
        1,
        "Sets the maximum spectral offset a card reaches while it travels through the outer edge.",
        { orderRole: "primary", unit: "px" },
      ),
      count: effectSlider(
        target.count,
        "Samples",
        defaults.count,
        6,
        48,
        1,
        "Sets the spectral tap count; higher values smooth the smear and cost more GPU work.",
        {
          workloadReason:
            "Controls the bounded per-pixel sampling loop of the screen-space dispersion shader.",
        },
      ),
      spectrum: effectSlider(
        target.spectrum,
        "Spectrum",
        defaults.spectrum,
        0,
        1,
        0.01,
        "Blends the smear from a neutral streak into the fully saturated generated spectrum.",
      ),
      hue: effectSlider(
        target.hue,
        "Hue",
        defaults.hue,
        0,
        360,
        1,
        "Rotates the generated spectrum around the hue wheel.",
        { unit: "°" },
      ),
      blur: effectSlider(
        target.blur,
        "Blur",
        defaults.blur,
        0,
        48,
        1,
        "Sets the maximum defocus radius at the outside edges; focus returns progressively toward the zone boundary.",
        {
          unit: "px",
          workloadReason:
            "Widens the bounded defocus radius sampled inside the same dispersion loop.",
        },
      ),
      aura: effectSlider(
        target.aura,
        "Aura",
        defaults.aura,
        0,
        1,
        0.01,
        "Adds a soft spectral halo that bleeds past the card edges inside the zone.",
      ),
      velocity: effectSlider(
        target.velocity,
        "Motion boost",
        defaults.velocity,
        0,
        1,
        0.01,
        "Adds a scroll-speed streak so cards visibly smear while they move through the aura.",
      ),
    },
    id: "edge-dispersion",
    title: "Dispersion & Aura",
  },
  {
    controls: {
      gateOffset: effectSlider(
        target.gateOffset,
        "Edge offset",
        defaults.gateOffset,
        0,
        50,
        1,
        "Moves each light band inward from its nearest canvas edge independently of the Edge Zone width.",
        { orderRole: "primary", unit: "%" },
      ),
      gateWidth: effectSlider(
        target.gateWidth,
        "Band width",
        defaults.gateWidth,
        20,
        240,
        1,
        "Sets how wide the stationary light band at each zone boundary is.",
        { unit: "px" },
      ),
      gateGlow: effectSlider(
        target.gateGlow,
        "Glow",
        defaults.gateGlow,
        0,
        1,
        0.01,
        "Sets how strongly cards flare while they cross the boundary band; scroll speed briefly intensifies it.",
      ),
      gateRefraction: effectSlider(
        target.gateRefraction,
        "Refraction",
        defaults.gateRefraction,
        0,
        60,
        1,
        "Bends the pixels crossing the band like a glass ridge at the zone boundary.",
      ),
    },
    id: "aura-gate",
    title: "Boundary Aura",
  },
  {
    controls: {
      includeBackground: {
        applicability: { mode: "always" },
        defaultValue: defaults.includeBackground,
        description:
          "Controls the bounded preview and still-image background behind the carousel.",
        label: "Include",
        orderRole: "primary",
        target: target.includeBackground,
        type: "switch",
        ...responsive(
          "Changes one background fill without changing rail geometry or shader samples.",
        ),
      },
      background: {
        applicability: {
          all: [{ equals: true, target: target.includeBackground }],
          mode: "conditional",
        },
        defaultValue: defaults.background,
        label: false,
        orderRole: "color",
        target: target.background,
        type: "color",
        ...responsive(
          "Changes one background fill in preview and image export.",
        ),
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
      format: {
        applicability: { mode: "always" },
        defaultValue: "png",
        label: "Format",
        options: [
          { label: "PNG", value: "png" },
          { label: "JPG", value: "jpg" },
        ],
        orderRole: "mode",
        target: target.imageFormat,
        type: "select",
        ...responsive(
          "Selects runtime-owned image encoding without changing preview pixels.",
        ),
      },
      resolution: {
        applicability: { mode: "always" },
        defaultValue: "4k",
        label: "Resolution",
        options: [
          { label: "2K", value: "2k" },
          { label: "4K", value: "4k" },
          { label: "8K", value: "8k" },
        ],
        orderRole: "detail",
        performanceReason:
          "Changes batch render and encoding pixels up to the real 8K output boundary.",
        performanceRole: "workload",
        target: target.imageResolution,
        type: "select",
      },
    },
    id: "image-export",
    layoutGroups: [
      { columns: 2, controls: ["format", "resolution"], layout: "inline" },
    ],
    title: "Image Export",
  },
  {
    actionGroup: "primary",
    controls: {
      outputActions: {
        applicability: { mode: "always" },
        actions: [
          {
            icon: "upload-simple",
            label: "Export PNG",
            role: "export-image",
            value: "export.png",
          },
        ],
        label: false,
        target: "actions.output",
        type: "panelActions",
      },
    },
    id: "output-actions",
    title: "Export",
  },
] as const satisfies readonly ToolcraftControlSectionSchema[];
