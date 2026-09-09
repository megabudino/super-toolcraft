import type { ToolcraftControlSectionSchema } from "@/toolcraft/runtime";

import {
  HERO_DISPERSION_DEFAULTS,
  heroDispersionTargets,
} from "./hero-dispersion-values";

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
      "Updates one uniform in the retained website dispersion pass.",
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

const defaults = HERO_DISPERSION_DEFAULTS;
const target = heroDispersionTargets;

export const heroDispersionControlSections = [
  {
    controls: {
      edgeWidth: effectSlider(
        target.edgeWidth,
        "Edge width",
        defaults.edgeWidth,
        0,
        50,
        1,
        "Sets how far the effect reaches inward. Sphere bands follow the lens-surface curved columns, and the value is their width at the equator; Rows retain their existing per-card viewport band behavior.",
        { orderRole: "primary", unit: "%" },
      ),
      curve: effectSlider(
        target.curve,
        "Falloff",
        defaults.curve,
        0.5,
        3,
        0.05,
        "Shapes how quickly the effect strengthens toward the treated-zone boundary; higher values keep more inner card pixels clean.",
      ),
      edgeFade: effectSlider(
        target.edgeFade,
        "Edge fade",
        defaults.edgeFade,
        0,
        1,
        0.01,
        "Dissolves card pixels nearest the treated-zone boundary into transparency.",
      ),
      turbulence: effectSlider(
        target.turbulence,
        "Turbulence",
        defaults.turbulence,
        0,
        1,
        0.01,
        "Makes the edge halo ragged and organic; zero keeps a smooth envelope.",
      ),
      turbulenceScale: effectSlider(
        target.turbulenceScale,
        "Turbulence size",
        defaults.turbulenceScale,
        40,
        280,
        2,
        "Sets the wavelength of the ragged halo contour along the treated-zone boundary.",
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
        "Sets how far card pixels geometrically bend. Stretch grows toward the rim; Prism shifts through a refractive face.",
        { orderRole: "primary", semanticGroup: "zone-warp-shape", unit: "px" },
      ),
      warpStyle: {
        applicability: { mode: "always" },
        defaultValue: defaults.warpStyle,
        description:
          "Stretch uses a gradual barrel. Prism places a refractive interface inside the outward edge zone.",
        label: "Style",
        options: [
          { label: "Stretch", value: "stretch" },
          { label: "Prism", value: "prism" },
        ],
        orderRole: "mode",
        semanticGroup: "zone-warp-shape",
        target: target.warpStyle,
        type: "segmented",
        ...responsive("Selects the retained website warp profile."),
      },
      warpOffset: effectSlider(
        target.warpOffset,
        "Offset",
        defaults.warpOffset,
        0,
        40,
        1,
        "Slides the warp inward from the treated-zone boundary. Zero pins it to that boundary.",
        { semanticGroup: "zone-warp-shape", unit: "%" },
      ),
      warpWaveEnabled: {
        applicability: { mode: "always" },
        defaultValue: defaults.warpWaveEnabled,
        description:
          "Turns on wave distortion in the warp band. Kind chooses a sine ripple or refractive glass slab.",
        label: "Wave",
        orderRole: "primary",
        semanticGroup: "zone-warp-wave",
        target: target.warpWaveEnabled,
        type: "switch",
        ...responsive("Enables the wave uniforms in the website renderer."),
      },
      warpWaveKind: {
        applicability: {
          all: [{ equals: true, target: target.warpWaveEnabled }],
          mode: "conditional",
        },
        defaultValue: defaults.warpWaveKind,
        description:
          "Ripple is a sideways sine. Glass refracts through a rippled slab with surface normals and lensing.",
        label: "Kind",
        options: [
          { label: "Glass", value: "glass" },
          { label: "Ripple", value: "ripple" },
        ],
        orderRole: "mode",
        semanticGroup: "zone-warp-wave",
        target: target.warpWaveKind,
        type: "segmented",
        ...responsive("Selects the retained website wave profile."),
      },
      warpWave: effectSlider(
        target.warpWave,
        "Strength",
        defaults.warpWave,
        0,
        48,
        1,
        "Sets how far Ripple shifts pixels, or how thick the Glass slab is.",
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
        "Sets the dominant ripple scale; shorter values create tighter folds.",
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
        "Softens the wave pattern and defocuses pixels inside the warp band.",
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
        "Sets how thick the prism face is; narrow values read as a sharp glass edge.",
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
        "Concentrates the kink on the prism face; higher values make the crossing snap.",
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
      amount: effectSlider(
        target.amount,
        "Dispersion",
        defaults.amount,
        0,
        200,
        1,
        "Sets the maximum spectral offset reached at the treated-zone boundary.",
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
            "Controls bounded per-pixel sampling loops in the retained Rows shaders and the Sphere post pass.",
        },
      ),
      spectrum: effectSlider(
        target.spectrum,
        "Spectrum",
        defaults.spectrum,
        0,
        1,
        0.01,
        "Blends the smear from a neutral streak into the generated spectrum.",
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
        "Sets the maximum defocus radius at each treated-zone boundary.",
        {
          unit: "px",
          workloadReason:
            "Widens the bounded defocus radius in the retained Rows shaders and the Sphere post pass.",
        },
      ),
      aura: effectSlider(
        target.aura,
        "Aura",
        defaults.aura,
        0,
        1,
        0.01,
        "Adds a soft spectral halo that bleeds beyond the treated band.",
      ),
      velocity: effectSlider(
        target.velocity,
        "Motion boost",
        defaults.velocity,
        0,
        1,
        0.01,
        "Adds a movement-dependent streak from gallery row and pan motion, then settles to the static recipe.",
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
        "Moves the light band inward from each treated-zone boundary independently of Edge width.",
        { orderRole: "primary", unit: "%" },
      ),
      gateWidth: effectSlider(
        target.gateWidth,
        "Band width",
        defaults.gateWidth,
        20,
        240,
        1,
        "Sets how wide the stationary light band is inside the treated band.",
        { unit: "px" },
      ),
      gateGlow: effectSlider(
        target.gateGlow,
        "Glow",
        defaults.gateGlow,
        0,
        1,
        0.01,
        "Sets how strongly card pixels flare while they cross the boundary band.",
      ),
      gateRefraction: effectSlider(
        target.gateRefraction,
        "Refraction",
        defaults.gateRefraction,
        0,
        60,
        1,
        "Bends pixels through a glass ridge at the light-band boundary.",
      ),
    },
    id: "aura-gate",
    title: "Boundary Aura",
  },
] as const satisfies readonly ToolcraftControlSectionSchema[];
