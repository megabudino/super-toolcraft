export type WavePlacement = Readonly<{
  height: number;
  position: Readonly<{ x: number; y: number }>;
  width: number;
}>;

export const wavePlacementBounds = {
  height: { max: 2160, min: 180 },
  width: { max: 3840, min: 320 },
} as const;

export const wavePlacementPositionScale = 2400;

export const wavePlacementDefaults: WavePlacement = {
  height: 1080,
  position: { x: -0.14, y: 0 },
  width: 2826,
};

const placementSizeReason =
  "Wave dimensions control WebGL backing area and the number of shaded pixels.";
const placementPositionReason =
  "Wave position updates the retained canvas transform without changing scene workload.";

export const wavePlacementSection = {
  controls: {
    width: {
      applicability: { mode: "always" },
      defaultValue: wavePlacementDefaults.width,
      label: "Width",
      max: wavePlacementBounds.width.max,
      min: wavePlacementBounds.width.min,
      performanceReason: placementSizeReason,
      performanceRole: "workload",
      sliderValueKind: "continuous",
      step: 1,
      target: "wave.frame.width",
      type: "slider",
      unit: "px",
    },
    height: {
      applicability: { mode: "always" },
      defaultValue: wavePlacementDefaults.height,
      label: "Height",
      max: wavePlacementBounds.height.max,
      min: wavePlacementBounds.height.min,
      performanceReason: placementSizeReason,
      performanceRole: "workload",
      sliderValueKind: "continuous",
      step: 1,
      target: "wave.frame.height",
      type: "slider",
      unit: "px",
    },
    position: {
      applicability: { mode: "always" },
      defaultValue: wavePlacementDefaults.position,
      description:
        "Offsets the wave canvas from the center of the hero preview. Full pad travel equals 2400 CSS pixels.",
      label: "Position",
      performanceReason: placementPositionReason,
      performanceRole: "responsiveness",
      target: "wave.frame.position",
      type: "vector",
      xLabel: "X",
      yLabel: "Y",
    },
  },
  id: "wave-placement",
  layout: "standalone",
  title: "Wave placement",
} as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function readNumber(value: unknown, fallback: number, min: number, max: number) {
  return typeof value === "number" && Number.isFinite(value) ? clamp(value, min, max) : fallback;
}

function readPosition(value: unknown): WavePlacement["position"] {
  const candidate =
    typeof value === "object" && value !== null
      ? (value as Partial<Record<"x" | "y", unknown>>)
      : wavePlacementDefaults.position;
  return {
    x: Math.round(
      readNormalizedAxis(candidate.x, wavePlacementDefaults.position.x) *
        wavePlacementPositionScale,
    ),
    y: Math.round(
      readNormalizedAxis(candidate.y, wavePlacementDefaults.position.y) *
        wavePlacementPositionScale,
    ),
  };
}

function readNormalizedAxis(value: unknown, fallback: number): number {
  const numericValue =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim().length > 0
        ? Number(value)
        : Number.NaN;

  return Number.isFinite(numericValue) ? clamp(numericValue, -1, 1) : fallback;
}

export function readWavePlacement(values: Readonly<Record<string, unknown>>): WavePlacement {
  return {
    height: readNumber(
      values["wave.frame.height"],
      wavePlacementDefaults.height,
      wavePlacementBounds.height.min,
      wavePlacementBounds.height.max,
    ),
    position: readPosition(values["wave.frame.position"]),
    width: readNumber(
      values["wave.frame.width"],
      wavePlacementDefaults.width,
      wavePlacementBounds.width.min,
      wavePlacementBounds.width.max,
    ),
  };
}
