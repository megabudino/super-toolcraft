import { expect } from "vitest";

import { GRASS_WORLD_COLOR_TARGETS } from "./grass-world-colors";
import {
  GRASS_PRESERVED_TARGETS,
  GRASS_WORLD_SCALE_MAX,
  GRASS_WORLD_SCALE_MIN,
} from "./grass-world-generator";

export function paletteSlice(values: Readonly<Record<string, unknown>>) {
  return Object.fromEntries(
    GRASS_WORLD_COLOR_TARGETS.map((target) => [target, values[target]]),
  );
}

export function expectNaturalCorrelatedPalette(
  values: Readonly<Record<string, unknown>>,
): void {
  const tallColors = [
    ...readGradientColors(values["appearance.bladeGradient"]),
    String(values["appearance.instanceColor1"]),
    String(values["appearance.instanceColor2"]),
    String(values["appearance.instanceColor3"]),
  ];
  const lawnColors = [
    ...readGradientColors(values["lawn.bladeGradient"]),
    String(values["lawn.instanceColor1"]),
    String(values["lawn.instanceColor2"]),
    String(values["lawn.instanceColor3"]),
  ];

  for (const [group, colors] of [
    ["Tall", tallColors],
    ["Lawn", lawnColors],
  ] as const) {
    for (const color of colors) {
      const hsl = hexToHsl(color);
      expect(hsl.hue, `${group} entered the scorched hue range`).toBeGreaterThanOrEqual(
        55,
      );
      expect(hsl.hue, `${group} left the fresh vegetation range`).toBeLessThanOrEqual(
        165,
      );
      expect(hsl.lightness, `${group} became visually black`).toBeGreaterThanOrEqual(
        0.08,
      );
    }
    expectIncreasingLightness(group, colors.slice(0, 3));
    expectIncreasingLightness(group, colors.slice(3));
  }

  expect(
    Math.abs(averageHue(tallColors) - averageHue(lawnColors)),
    "Tall and Lawn must share one palette mood",
  ).toBeLessThanOrEqual(28);

  const ground = hexToHsl(String(values["appearance.groundColor"]));
  expect(ground.hue).toBeGreaterThanOrEqual(40);
  expect(ground.hue).toBeLessThanOrEqual(165);
  expect(ground.lightness).toBeGreaterThanOrEqual(0.24);

  for (const target of ["scan.tufted.pbrTint", "scan.wild.pbrTint"]) {
    const color = hexToHsl(String(values[target]));
    expect(color.hue, `${target} must remain fresh vegetation`).toBeGreaterThanOrEqual(
      55,
    );
    expect(color.hue, `${target} must remain fresh vegetation`).toBeLessThanOrEqual(
      165,
    );
  }
  for (const target of ["scan.white.pbrTint", "scan.yellow.pbrTint"]) {
    const color = hexToHsl(String(values[target]));
    expect(color.lightness, `${target} must retain bright petals`).toBeGreaterThanOrEqual(
      0.8,
    );
    expect(
      hexChannelSpread(String(values[target])),
      `${target} must remain near-neutral`,
    ).toBeLessThanOrEqual(0.08);
  }
  for (const target of ["scan.rocks.pbrTint", "scan.boulder.pbrTint"]) {
    expect(
      hexToHsl(String(values[target])).saturation,
      `${target} must remain a neutral stone tint`,
    ).toBeLessThanOrEqual(0.3);
  }
}

export function changedAxes(
  first: Readonly<Record<string, number>>,
  second: Readonly<Record<string, number>>,
): number {
  return Object.keys(first).filter((key) => first[key] !== second[key]).length;
}

export function preservedSlice(values: Readonly<Record<string, unknown>>) {
  return Object.fromEntries(
    GRASS_PRESERVED_TARGETS.map((target) => [target, values[target]]),
  );
}

export function expectScaledNumber(
  current: Readonly<Record<string, unknown>>,
  initial: Readonly<Record<string, unknown>>,
  target: string,
  expectedScale: number,
): void {
  const value = Number(current[target]);
  const reference = Number(initial[target]);
  expect(value).toBeGreaterThanOrEqual(
    reference * GRASS_WORLD_SCALE_MIN - 0.0001,
  );
  expect(value).toBeLessThanOrEqual(reference * GRASS_WORLD_SCALE_MAX + 0.0001);
  expect(value / reference).toBeCloseTo(expectedScale, 4);
}

export function expectScaledRange(
  current: Readonly<Record<string, unknown>>,
  initial: Readonly<Record<string, unknown>>,
  target: string,
  expectedScale: number,
): void {
  const values = current[target] as readonly number[];
  const references = initial[target] as readonly number[];
  expect(values).toHaveLength(2);
  for (let index = 0; index < 2; index += 1) {
    const value = Number(values[index]);
    const reference = Number(references[index]);
    expect(value).toBeGreaterThanOrEqual(
      reference * GRASS_WORLD_SCALE_MIN - 0.0001,
    );
    expect(value).toBeLessThanOrEqual(
      reference * GRASS_WORLD_SCALE_MAX + 0.0001,
    );
    expect(value / reference).toBeCloseTo(expectedScale, 4);
  }
}

export function rangeHigh(value: unknown): number {
  return Number((value as readonly unknown[])[1]);
}

export function occupiedCellRatio(
  offsets: Float32Array,
  width: number,
  depth: number,
): number {
  const resolution = 10;
  const occupied = new Set<number>();
  for (let index = 0; index < offsets.length / 3; index += 1) {
    const x = offsets[index * 3] ?? 0;
    const z = offsets[index * 3 + 2] ?? 0;
    const column = Math.max(
      0,
      Math.min(resolution - 1, Math.floor((x / width + 0.5) * resolution)),
    );
    const row = Math.max(
      0,
      Math.min(resolution - 1, Math.floor((z / depth + 0.5) * resolution)),
    );
    occupied.add(row * resolution + column);
  }
  return occupied.size / (resolution * resolution);
}

function readGradientColors(value: unknown): string[] {
  if (typeof value !== "object" || value === null || !("stops" in value)) {
    throw new Error("Expected a generated gradient with stops.");
  }
  const stops = (value as { stops?: unknown }).stops;
  if (!Array.isArray(stops)) {
    throw new Error("Expected a generated gradient with stops.");
  }
  return stops.map((stop) => {
    if (typeof stop !== "object" || stop === null || !("color" in stop)) {
      throw new Error("Expected a generated gradient stop color.");
    }
    return String((stop as { color: unknown }).color);
  });
}

function expectIncreasingLightness(label: string, colors: readonly string[]): void {
  const lightness = colors.map((color) => hexToHsl(color).lightness);
  expect(lightness).toHaveLength(3);
  expect(lightness[0], `${label} color 1 must be darker than color 2`).toBeLessThan(
    lightness[1]!,
  );
  expect(lightness[1], `${label} color 2 must be darker than color 3`).toBeLessThan(
    lightness[2]!,
  );
}

function averageHue(colors: readonly string[]): number {
  return (
    colors.reduce((sum, color) => sum + hexToHsl(color).hue, 0) /
    colors.length
  );
}

function hexToHsl(value: string): Readonly<{
  hue: number;
  lightness: number;
  saturation: number;
}> {
  const match = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/iu.exec(value);
  if (!match) throw new Error(`Expected a six-digit hex color, received ${value}.`);
  const red = Number.parseInt(match[1]!, 16) / 255;
  const green = Number.parseInt(match[2]!, 16) / 255;
  const blue = Number.parseInt(match[3]!, 16) / 255;
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const delta = maximum - minimum;
  const lightness = (maximum + minimum) / 2;
  if (delta === 0) return { hue: 0, lightness, saturation: 0 };
  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  const hue =
    maximum === red
      ? 60 * (((green - blue) / delta) % 6)
      : maximum === green
        ? 60 * ((blue - red) / delta + 2)
        : 60 * ((red - green) / delta + 4);
  return { hue: (hue + 360) % 360, lightness, saturation };
}

function hexChannelSpread(value: string): number {
  const match = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/iu.exec(value);
  if (!match) throw new Error(`Expected a six-digit hex color, received ${value}.`);
  const channels = match
    .slice(1)
    .map((channel) => Number.parseInt(channel!, 16) / 255);
  return Math.max(...channels) - Math.min(...channels);
}
