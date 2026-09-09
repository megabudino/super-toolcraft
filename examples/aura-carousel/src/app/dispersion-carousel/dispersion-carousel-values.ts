import type { ToolcraftState } from "@/toolcraft/runtime";

export const DISPERSION_CAROUSEL_TITLE =
  "How focused teams turn insights into action.";

export const DISPERSION_CAROUSEL_TESTIMONIAL_STYLE = {
  fontSize: 20,
  fontWeight: 400,
  lineHeight: 26,
  padding: 24,
} as const;

export const DISPERSION_CAROUSEL_GEOMETRY = {
  cardGap: 16,
  cardHeight: 560,
  cardRadius: 12,
  cardWidth: 448,
  canvasHeight: 1034,
  /** Authored Figma composition width; the default editable crop can be wider. */
  canvasWidth: 1472,
  contentHeight: 714,
  /** Extra rail-canvas padding above and below the cards so the aura can bleed. */
  effectPadding: 64,
  headerHeight: 106,
  headerTop: 160,
  railTop: 314,
  trackWidth: 2304,
  verticalPadding: 160,
} as const;

/** Fresh-workspace finite crop from the user-exported settings recipe. */
export const DISPERSION_CAROUSEL_DEFAULT_CANVAS_SIZE = {
  height: DISPERSION_CAROUSEL_GEOMETRY.canvasHeight,
  width: 1920,
} as const;

// The browser build supplies BASE_URL; Node-based acceptance also imports these fixtures.
const assetBaseUrl = import.meta.env?.BASE_URL ?? "/";

export const DISPERSION_CAROUSEL_CARDS = [
  {
    alt: "Anthropic customer story",
    id: "anthropic-portrait",
    src: `${assetBaseUrl}assets/dispersion-carousel/card-anthropic-portrait@2x.png`,
    testimonial:
      "“Bringing our research into one clear view helped the team agree on priorities and decide what to build next.”",
  },
  {
    alt: "Shopify customer story",
    id: "shopify",
    src: `${assetBaseUrl}assets/dispersion-carousel/card-shopify@2x.png`,
    testimonial:
      "“Learning why customers came back helped us improve our products and focus on the details they value most.”",
  },
  {
    alt: "Anthropic studio customer story",
    id: "anthropic-studio",
    src: `${assetBaseUrl}assets/dispersion-carousel/card-anthropic-studio@2x.png`,
    testimonial:
      "“A shared brief gave everyone a clear view of the goal and their role in reaching it. We made decisions sooner and kept work moving without extra meetings.”",
  },
  {
    alt: "Walmart customer story",
    id: "walmart",
    src: `${assetBaseUrl}assets/dispersion-carousel/card-walmart@2x.png`,
    testimonial:
      "“We replaced disconnected reports with shared measures, so teams could spot problems early and make better decisions together.”",
  },
  {
    alt: "Google customer story",
    id: "google",
    src: `${assetBaseUrl}assets/dispersion-carousel/card-google@2x.png`,
    testimonial:
      "“Simpler reporting freed up time to hear from customers, test new ideas, and improve the services they use daily.”",
  },
] as const;

export const DISPERSION_CAROUSEL_CARD_PITCH =
  DISPERSION_CAROUSEL_GEOMETRY.cardWidth +
  DISPERSION_CAROUSEL_GEOMETRY.cardGap;

/** One complete five-card loop, including the gap between its last and first cards. */
export const DISPERSION_CAROUSEL_CYCLE_WIDTH =
  DISPERSION_CAROUSEL_CARD_PITCH * DISPERSION_CAROUSEL_CARDS.length;

/** Fresh-workspace position from the user-exported settings recipe. */
export const DISPERSION_CAROUSEL_DEFAULT_SCROLL = 1856;

/** Three copies keep a complete equivalent cycle available on either side. */
export const DISPERSION_CAROUSEL_LOOP_TRACK_WIDTH =
  DISPERSION_CAROUSEL_CYCLE_WIDTH * 3 -
  DISPERSION_CAROUSEL_GEOMETRY.cardGap;

export const dispersionCarouselTargets = {
  amount: "dispersion.amount",
  aura: "dispersion.aura",
  background: "appearance.background",
  blur: "dispersion.blur",
  count: "dispersion.count",
  curve: "edgeZone.curve",
  edgeFade: "edgeZone.fade",
  edgeWidth: "edgeZone.width",
  gateGlow: "auraGate.glow",
  gateOffset: "auraGate.offset",
  gateRefraction: "auraGate.refraction",
  gateWidth: "auraGate.width",
  hue: "dispersion.hue",
  imageFormat: "export.image.format",
  imageResolution: "export.image.resolution",
  includeBackground: "export.includeBackground",
  includeText: "dispersion.includeText",
  spectrum: "dispersion.spectrum",
  turbulence: "edgeZone.turbulence",
  turbulenceScale: "edgeZone.turbulenceScale",
  velocity: "dispersion.velocity",
  warp: "edgeZone.warp",
  warpFace: "edgeZone.warpFace",
  warpOffset: "edgeZone.warpOffset",
  warpSharpness: "edgeZone.warpSharpness",
  warpStyle: "edgeZone.warpStyle",
  warpWave: "edgeZone.warpWave",
  warpWaveBlur: "edgeZone.warpWaveBlur",
  warpWaveEnabled: "edgeZone.warpWaveEnabled",
  warpWaveKind: "edgeZone.warpWaveKind",
  warpWaveLength: "edgeZone.warpWaveLength",
} as const;

export type DispersionCarouselWarpStyle = "prism" | "stretch";
export type DispersionCarouselWaveKind = "glass" | "ripple";

export const DISPERSION_CAROUSEL_DEFAULTS = {
  amount: 85,
  aura: 0.69,
  background: "#FFFFFF",
  blur: 0,
  count: 20,
  curve: 1.15,
  edgeFade: 0.51,
  edgeWidth: 13,
  gateGlow: 0.49,
  gateOffset: 9,
  gateRefraction: 7,
  gateWidth: 147,
  hue: 0,
  includeBackground: true,
  includeText: true,
  spectrum: 0.67,
  turbulence: 0.79,
  turbulenceScale: 168,
  velocity: 0.45,
  warp: 8,
  warpFace: 133,
  warpOffset: 1,
  warpSharpness: 2.35,
  warpStyle: "stretch" as DispersionCarouselWarpStyle,
  warpWave: 3,
  warpWaveBlur: 0,
  warpWaveEnabled: true,
  warpWaveKind: "ripple" as DispersionCarouselWaveKind,
  warpWaveLength: 336,
} as const;

function readNumber(
  state: Pick<ToolcraftState, "values">,
  target: string,
  fallback: number,
): number {
  const value = Number(state.values[target]);
  return Number.isFinite(value) ? value : fallback;
}

function readColor(value: unknown, fallback: string): string {
  if (typeof value === "string") return value;
  if (
    typeof value === "object" &&
    value !== null &&
    "hex" in value &&
    typeof value.hex === "string"
  ) {
    return value.hex;
  }
  return fallback;
}

export type DispersionCarouselSettings = Readonly<{
  amount: number;
  aura: number;
  background: string;
  blur: number;
  count: number;
  curve: number;
  edgeFade: number;
  edgeWidth: number;
  gateGlow: number;
  gateOffset: number;
  gateRefraction: number;
  gateWidth: number;
  hue: number;
  includeBackground: boolean;
  includeText: boolean;
  spectrum: number;
  turbulence: number;
  turbulenceScale: number;
  velocity: number;
  warp: number;
  warpFace: number;
  warpOffset: number;
  warpSharpness: number;
  warpStyle: DispersionCarouselWarpStyle;
  warpWave: number;
  warpWaveBlur: number;
  warpWaveEnabled: boolean;
  warpWaveKind: DispersionCarouselWaveKind;
  warpWaveLength: number;
}>;

export function readDispersionCarouselSettings(
  state: Pick<ToolcraftState, "values">,
): DispersionCarouselSettings {
  const target = dispersionCarouselTargets;
  const defaults = DISPERSION_CAROUSEL_DEFAULTS;
  return {
    amount: readNumber(state, target.amount, defaults.amount),
    aura: readNumber(state, target.aura, defaults.aura),
    background: readColor(state.values[target.background], defaults.background),
    blur: readNumber(state, target.blur, defaults.blur),
    count: readNumber(state, target.count, defaults.count),
    curve: readNumber(state, target.curve, defaults.curve),
    edgeFade: readNumber(state, target.edgeFade, defaults.edgeFade),
    edgeWidth: readNumber(state, target.edgeWidth, defaults.edgeWidth),
    gateGlow: readNumber(state, target.gateGlow, defaults.gateGlow),
    gateOffset: readNumber(state, target.gateOffset, defaults.gateOffset),
    gateRefraction: readNumber(
      state,
      target.gateRefraction,
      defaults.gateRefraction,
    ),
    gateWidth: readNumber(state, target.gateWidth, defaults.gateWidth),
    hue: readNumber(state, target.hue, defaults.hue),
    includeBackground: state.values[target.includeBackground] !== false,
    includeText: state.values[target.includeText] !== false,
    spectrum: readNumber(state, target.spectrum, defaults.spectrum),
    turbulence: readNumber(state, target.turbulence, defaults.turbulence),
    turbulenceScale: readNumber(
      state,
      target.turbulenceScale,
      defaults.turbulenceScale,
    ),
    velocity: readNumber(state, target.velocity, defaults.velocity),
    warp: readNumber(state, target.warp, defaults.warp),
    warpFace: readNumber(state, target.warpFace, defaults.warpFace),
    warpOffset: readNumber(state, target.warpOffset, defaults.warpOffset),
    warpSharpness: readNumber(
      state,
      target.warpSharpness,
      defaults.warpSharpness,
    ),
    warpStyle:
      state.values[target.warpStyle] === "prism" ? "prism" : "stretch",
    warpWave: readNumber(state, target.warpWave, defaults.warpWave),
    warpWaveBlur: readNumber(state, target.warpWaveBlur, defaults.warpWaveBlur),
    warpWaveEnabled: state.values[target.warpWaveEnabled] === true,
    warpWaveKind:
      state.values[target.warpWaveKind] === "ripple" ? "ripple" : "glass",
    warpWaveLength: readNumber(
      state,
      target.warpWaveLength,
      defaults.warpWaveLength,
    ),
  };
}
