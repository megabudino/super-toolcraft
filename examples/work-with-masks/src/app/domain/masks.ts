import type { HeroVector } from "./camera";
import { waveDefaultValues } from "./wave-default-values";

export type HeroMaskRecord = Readonly<{
  enabled: boolean;
  feather: number;
  opacity: number;
  position: HeroVector;
  radius: number;
  rotation: number;
  stretch: number;
}>;

export type HeroMask = Readonly<{
  enabled: boolean;
  feather: number;
  opacity: number;
  position: HeroVector;
  radius: number;
  rotation: number;
  stretch: number;
}>;

export type HeroMasks = Readonly<{
  items: readonly HeroMask[];
  mode: "apply" | "off" | "preview";
}>;

export const maskItemDefaults: HeroMaskRecord = {
  enabled: true,
  feather: 20,
  opacity: 100,
  position: { x: 0, y: 0 },
  radius: 30,
  rotation: 0,
  stretch: 1,
};

export const maskDefaults = {
  enabled: waveDefaultValues["masks.enabled"],
  items: waveDefaultValues["masks.items"].map((mask) => ({
    ...mask,
    position: { ...mask.position },
  })) as readonly HeroMaskRecord[],
  preview: waveDefaultValues["masks.preview"],
} as const;

const maskReason =
  "Mask edits update compositor uniforms and re-run only the shade step; geometry, environment, and shadow maps stay cached.";

export const masksSection = {
  controls: {
    enabled: {
      applicability: { mode: "always" },
      defaultValue: maskDefaults.enabled,
      description: "Cuts the scene to the circles; off keeps them editable without cutting.",
      label: "Apply",
      orderRole: "mode",
      performanceReason: maskReason,
      performanceRole: "responsiveness",
      target: "masks.enabled",
      type: "switch",
    },
    preview: {
      applicability: { mode: "always" },
      defaultValue: maskDefaults.preview,
      description: "Shows circles as red overlays with handles instead of cutting the scene.",
      label: "Show",
      orderRole: "mode",
      performanceReason: maskReason,
      performanceRole: "responsiveness",
      target: "masks.preview",
      type: "switch",
    },
    items: {
      addLabel: "Add circle",
      applicability: { mode: "always" },
      defaultValue: maskDefaults.items,
      hardMaxItems: 16,
      itemControls: {
        position: {
          coordinateMode: "cartesian",
          defaultValue: maskItemDefaults.position,
          label: "Position",
          max: 1.5,
          min: -1.5,
          type: "vector",
          xLabel: "X",
          yLabel: "Y",
        },
        radius: {
          defaultValue: maskItemDefaults.radius,
          label: "Radius",
          max: 150,
          min: 2,
          sliderValueKind: "continuous",
          step: 0.5,
          type: "slider",
          unit: "%",
        },
        stretch: {
          defaultValue: maskItemDefaults.stretch,
          label: "Stretch",
          max: 5,
          min: 0.2,
          sliderValueKind: "continuous",
          step: 0.01,
          type: "slider",
        },
        rotation: {
          defaultValue: maskItemDefaults.rotation,
          label: "Rotation",
          max: 180,
          min: -180,
          sliderValueKind: "continuous",
          step: 0.5,
          type: "slider",
          unit: "°",
        },
        feather: {
          defaultValue: maskItemDefaults.feather,
          label: "Feather",
          max: 100,
          min: 0,
          sliderValueKind: "continuous",
          step: 1,
          type: "slider",
          unit: "%",
        },
        opacity: {
          defaultValue: maskItemDefaults.opacity,
          label: "Opacity",
          max: 100,
          min: 0,
          sliderValueKind: "continuous",
          step: 1,
          type: "slider",
          unit: "%",
        },
        enabled: {
          defaultValue: maskItemDefaults.enabled,
          label: "Active",
          type: "switch",
        },
      },
      label: "Circles",
      minItems: 0,
      orderRole: "primary",
      performanceReason: maskReason,
      performanceRole: "responsiveness",
      recommendedMaxItems: 8,
      removeLabel: "Remove last circle",
      target: "masks.items",
      type: "collectionActions",
    },
  },
  id: "masks",
  layout: "standalone",
  layoutGroups: [
    {
      columns: 2,
      controls: ["enabled", "preview"],
      layout: "inline",
    },
  ],
  title: "Masks",
} as const;

function boundedNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number | undefined {
  const candidate = value === undefined ? fallback : value;
  return typeof candidate === "number" &&
    Number.isFinite(candidate) &&
    candidate >= min &&
    candidate <= max
    ? candidate
    : undefined;
}

function readPosition(value: unknown): HeroVector | undefined {
  if (value === undefined) return { ...maskItemDefaults.position };
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }
  const candidate = value as Partial<HeroVector>;
  const x = boundedNumber(candidate.x, maskItemDefaults.position.x, -1.5, 1.5);
  const y = boundedNumber(candidate.y, maskItemDefaults.position.y, -1.5, 1.5);
  return x === undefined || y === undefined ? undefined : { x, y };
}

export function normalizeHeroMaskRecord(value: unknown): HeroMaskRecord | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }
  const candidate = value as Partial<HeroMaskRecord>;
  const position = readPosition(candidate.position);
  const radius = boundedNumber(candidate.radius, maskItemDefaults.radius, 2, 150);
  const stretch = boundedNumber(candidate.stretch, maskItemDefaults.stretch, 0.2, 5);
  const rotation = boundedNumber(candidate.rotation, maskItemDefaults.rotation, -180, 180);
  const feather = boundedNumber(candidate.feather, maskItemDefaults.feather, 0, 100);
  const opacity = boundedNumber(candidate.opacity, maskItemDefaults.opacity, 0, 100);
  const enabled = candidate.enabled === undefined ? maskItemDefaults.enabled : candidate.enabled;

  if (
    !position ||
    radius === undefined ||
    stretch === undefined ||
    rotation === undefined ||
    feather === undefined ||
    opacity === undefined ||
    typeof enabled !== "boolean"
  ) {
    return undefined;
  }

  return { enabled, feather, opacity, position, radius, rotation, stretch };
}

export function readHeroMaskRecords(
  values: Readonly<Record<string, unknown>>,
): readonly HeroMaskRecord[] {
  const source = values["masks.items"];
  if (!Array.isArray(source)) return [];
  return source.flatMap((value) => {
    const record = normalizeHeroMaskRecord(value);
    return record ? [record] : [];
  });
}

export function readHeroMasks(
  values: Readonly<Record<string, unknown>>,
  options: Readonly<{ preview?: boolean }> = {},
): HeroMasks {
  const enabled =
    values["masks.enabled"] === undefined ? maskDefaults.enabled : values["masks.enabled"] === true;
  const preview = options.preview === true && values["masks.preview"] === true;
  return {
    items: readHeroMaskRecords(values).map((record) => ({
      ...record,
      feather: record.feather / 100,
      opacity: record.opacity / 100,
      radius: record.radius / 100,
    })),
    mode: preview ? "preview" : enabled ? "apply" : "off",
  };
}
