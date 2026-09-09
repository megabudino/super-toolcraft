export function clampSliderValue(
  value: number,
  min: number,
  max: number,
): number {
  return Math.min(max, Math.max(min, value));
}

export function getDecimalPrecision(step: number): number {
  return String(step).split(".")[1]?.length ?? 0;
}

export function formatSliderValue(value: number, step: number): string {
  const decimals = getDecimalPrecision(step);
  const rounded = Number(value.toFixed(decimals));

  return String(rounded);
}

export function applySliderValueLabelUnit(
  valueLabel: string,
  unit?: string,
): string {
  if (!unit || typeof parseSliderValueLabel(valueLabel) !== "number") {
    return valueLabel;
  }

  return valueLabel.replaceAll(/-?\d+(?:\.\d+)?/g, (match, offset) => {
    const textAfterMatch = valueLabel.slice(offset + match.length).trimStart();

    return textAfterMatch.startsWith(unit) ? match : `${match}${unit}`;
  });
}

export function formatSliderValueWithUnit(
  value: number,
  step: number,
  unit?: string,
): string {
  return applySliderValueLabelUnit(formatSliderValue(value, step), unit);
}

export function parseSliderValueLabel(valueLabel: string): number | undefined {
  const match = valueLabel.match(/-?\d+(?:\.\d+)?/);
  const parsedValue = match ? Number.parseFloat(match[0]) : Number.NaN;

  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

export function getSliderControlValue(
  nextValue: number | readonly number[],
): number | undefined {
  const resolvedValue = Array.isArray(nextValue) ? nextValue[0] : nextValue;

  return typeof resolvedValue === "number" ? resolvedValue : undefined;
}
