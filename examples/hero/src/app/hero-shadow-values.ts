export type HeroColorOpacity = Readonly<{
  hex: string;
  opacity: number;
}>;

export type HeroShadowSettings = Readonly<{
  blur: number;
  colorOpacity: HeroColorOpacity;
  enabled: boolean;
  offset: Readonly<{
    x: number;
    y: number;
  }>;
  spread: number;
}>;

export type HeroShadowTargets = Readonly<{
  blur: string;
  colorOpacity: string;
  enabled: string;
  offset: string;
  spread: string;
}>;

function clampNumber(
  value: unknown,
  minimum: number,
  maximum: number,
  fallback: number,
): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(maximum, Math.max(minimum, value))
    : fallback;
}

function colorValue(value: unknown, fallback: string): string {
  return typeof value === "string" && /^#[0-9A-F]{6}$/.test(value)
    ? value
    : fallback;
}

export function createHeroShadowSettingsFromValues(
  values: Readonly<Record<string, unknown>>,
  targets: HeroShadowTargets,
  fallback: HeroShadowSettings,
): HeroShadowSettings {
  const colorOpacityValue = values[targets.colorOpacity];
  const colorOpacity =
    typeof colorOpacityValue === "object" &&
    colorOpacityValue !== null &&
    !Array.isArray(colorOpacityValue)
      ? (colorOpacityValue as Record<string, unknown>)
      : null;
  const offsetValue = values[targets.offset];
  const offset =
    typeof offsetValue === "object" &&
    offsetValue !== null &&
    !Array.isArray(offsetValue)
      ? (offsetValue as Record<string, unknown>)
      : null;
  const enabledValue = values[targets.enabled];

  return {
    blur: clampNumber(values[targets.blur], 0, 100, fallback.blur),
    colorOpacity: {
      hex: colorValue(colorOpacity?.hex, fallback.colorOpacity.hex),
      opacity: clampNumber(
        colorOpacity?.opacity,
        0,
        100,
        fallback.colorOpacity.opacity,
      ),
    },
    enabled:
      typeof enabledValue === "boolean" ? enabledValue : fallback.enabled,
    offset: {
      x: clampNumber(offset?.x, -1, 1, fallback.offset.x),
      y: clampNumber(offset?.y, -1, 1, fallback.offset.y),
    },
    spread: clampNumber(values[targets.spread], -32, 32, fallback.spread),
  };
}
