import { expect } from "@playwright/test";

type NormalizedColorCollection = Readonly<{ colors: readonly string[] }>;

type GrassScenePaletteSource = Readonly<{
  appearance: Readonly<{
    bladeGradient: NormalizedColorCollection;
    groundColor: string;
    instanceColors: NormalizedColorCollection;
  }>;
  lawn: Readonly<{
    bladeGradient: NormalizedColorCollection;
    instanceColors: NormalizedColorCollection;
  }>;
  surface: Readonly<{
    clover: Readonly<{ color: string }>;
  }>;
  scans: Readonly<
    Record<
      "boulder" | "rocks" | "tufted" | "white" | "wild" | "yellow",
      Readonly<{ pbrTint: string }>
    >
  >;
}>;

type PaletteWorldState = Readonly<{
  palette: Readonly<Record<string, string>>;
}>;

const expectedPaletteTargets = [
  "appearance.groundColor",
  "surface.cloverColor",
  "appearance.bladeGradient.0",
  "appearance.bladeGradient.1",
  "appearance.bladeGradient.2",
  "appearance.instanceColors.0",
  "appearance.instanceColors.1",
  "appearance.instanceColors.2",
  "lawn.bladeGradient.0",
  "lawn.bladeGradient.1",
  "lawn.bladeGradient.2",
  "lawn.instanceColors.0",
  "lawn.instanceColors.1",
  "lawn.instanceColors.2",
  "scan.boulder.pbrTint",
  "scan.rocks.pbrTint",
  "scan.tufted.pbrTint",
  "scan.white.pbrTint",
  "scan.wild.pbrTint",
  "scan.yellow.pbrTint",
] as const;

export function assertCorrelatedNaturalPaletteVariation(
  initial: PaletteWorldState,
  generatedWorlds: readonly PaletteWorldState[],
): void {
  const initialTargets = Object.keys(initial.palette);
  expect(initialTargets).toEqual(expectedPaletteTargets);
  expect(
    new Set(generatedWorlds.map((world) => JSON.stringify(world.palette))).size,
  ).toBe(generatedWorlds.length);

  for (const world of generatedWorlds) {
    expect(Object.keys(world.palette)).toEqual(initialTargets);
    expect(world.palette).not.toEqual(initial.palette);
    for (const [target, color] of Object.entries(world.palette)) {
      expect(color, `${target} must remain a literal color`).toMatch(
        /^#[\da-f]{6}$/iu,
      );
    }
    expectChangedPaletteFamily(initial.palette, world.palette, "appearance.");
    expectChangedPaletteFamily(initial.palette, world.palette, "surface.");
    expectChangedPaletteFamily(initial.palette, world.palette, "lawn.");
    expectChangedPaletteFamily(initial.palette, world.palette, "scan.");
    expectNaturalPalette(world.palette);
  }
}

export function collectWorldPalette(
  settings: GrassScenePaletteSource,
): Readonly<Record<string, string>> {
  const entries: [string, string][] = [
    ["appearance.groundColor", settings.appearance.groundColor],
    ["surface.cloverColor", settings.surface.clover.color],
  ];
  appendColors(
    entries,
    "appearance.bladeGradient",
    settings.appearance.bladeGradient.colors,
  );
  appendColors(
    entries,
    "appearance.instanceColors",
    settings.appearance.instanceColors.colors,
  );
  appendColors(entries, "lawn.bladeGradient", settings.lawn.bladeGradient.colors);
  appendColors(
    entries,
    "lawn.instanceColors",
    settings.lawn.instanceColors.colors,
  );
  for (const kind of [
    "boulder",
    "rocks",
    "tufted",
    "white",
    "wild",
    "yellow",
  ] as const) {
    entries.push([`scan.${kind}.pbrTint`, settings.scans[kind].pbrTint]);
  }
  return Object.fromEntries(entries);
}

function appendColors(
  entries: [string, string][],
  target: string,
  colors: readonly string[],
): void {
  colors.forEach((color, index) => entries.push([`${target}.${index}`, color]));
}

function expectChangedPaletteFamily(
  reference: Readonly<Record<string, string>>,
  generated: Readonly<Record<string, string>>,
  prefix: string,
): void {
  expect(
    Object.keys(reference)
      .filter((target) => target.startsWith(prefix))
      .some((target) => generated[target] !== reference[target]),
    `${prefix} palette family must participate in the generated mood`,
  ).toBe(true);
}

function expectNaturalPalette(
  palette: Readonly<Record<string, string>>,
): void {
  const grassTargets = Object.keys(palette).filter(
    (target) =>
      target.startsWith("appearance.bladeGradient") ||
      target.startsWith("appearance.instanceColors") ||
      target.startsWith("lawn.bladeGradient") ||
      target.startsWith("lawn.instanceColors"),
  );
  const grassHues = grassTargets.map((target) => {
    const color = colorToHsl(palette[target]!);
    expect(color.hue, `${target} entered a scorched hue`).toBeGreaterThanOrEqual(
      75,
    );
    expect(color.hue, `${target} left the fresh vegetation range`).toBeLessThanOrEqual(
      165,
    );
    expect(color.lightness, `${target} became visually black`).toBeGreaterThanOrEqual(
      0.08,
    );
    expect(color.saturation, `${target} lost its fresh chroma`).toBeGreaterThanOrEqual(
      0.16,
    );
    return color.hue;
  });

  for (let roleIndex = 0; roleIndex < 6; roleIndex += 1) {
    expect(
      circularHueDistance(grassHues[roleIndex]!, grassHues[roleIndex + 6]!),
      `Tall and Lawn role ${roleIndex + 1} must share one vegetation mood`,
    ).toBeLessThanOrEqual(24);
  }

  expectAscendingLightness(palette, "appearance.bladeGradient");
  expectAscendingLightness(palette, "appearance.instanceColors");
  expectAscendingLightness(palette, "lawn.bladeGradient");
  expectAscendingLightness(palette, "lawn.instanceColors");

  for (const target of ["appearance.groundColor", "surface.cloverColor"]) {
    const surfaceColor = colorToHsl(palette[target]!);
    expect(surfaceColor.hue, `${target} left the fresh surface range`).toBeGreaterThanOrEqual(
      100,
    );
    expect(surfaceColor.hue, `${target} left the fresh surface range`).toBeLessThanOrEqual(
      175,
    );
    expect(surfaceColor.lightness, `${target} became visually black`).toBeGreaterThanOrEqual(
      0.25,
    );
    expect(surfaceColor.lightness, `${target} became washed out`).toBeLessThanOrEqual(
      0.6,
    );
    expect(surfaceColor.saturation, `${target} lost its fresh chroma`).toBeGreaterThanOrEqual(
      0.35,
    );
    expect(surfaceColor.saturation, `${target} became invalid`).toBeLessThanOrEqual(1);
  }

  for (const target of ["scan.tufted.pbrTint", "scan.wild.pbrTint"]) {
    const color = colorToHsl(palette[target]!);
    expect(color.hue, `${target} must remain fresh vegetation`).toBeGreaterThanOrEqual(
      75,
    );
    expect(color.hue, `${target} must remain fresh vegetation`).toBeLessThanOrEqual(
      165,
    );
  }
  for (const target of ["scan.white.pbrTint", "scan.yellow.pbrTint"]) {
    const color = colorToHsl(palette[target]!);
    expect(color.lightness, `${target} must retain bright petals`).toBeGreaterThanOrEqual(
      0.88,
    );
    expect(
      hexChannelSpread(palette[target]!),
      `${target} must stay near-neutral`,
    ).toBeLessThanOrEqual(0.08);
  }
  for (const target of ["scan.rocks.pbrTint", "scan.boulder.pbrTint"]) {
    const stone = colorToHsl(palette[target]!);
    expect(
      stone.saturation,
      `${target} must remain a neutral stone tint`,
    ).toBeLessThanOrEqual(0.3);
    expect(stone.lightness, `${target} must not become charred`).toBeGreaterThanOrEqual(
      0.68,
    );
  }
}

function expectAscendingLightness(
  palette: Readonly<Record<string, string>>,
  prefix: string,
): void {
  const lightness = [0, 1, 2].map((index) =>
    colorToHsl(palette[`${prefix}.${index}`]!).lightness,
  );
  expect(lightness[0], `${prefix} color order`).toBeLessThan(lightness[1]!);
  expect(lightness[1], `${prefix} color order`).toBeLessThan(lightness[2]!);
}

function colorToHsl(hex: string): Readonly<{
  hue: number;
  lightness: number;
  saturation: number;
}> {
  const match = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/iu.exec(hex);
  if (!match) throw new Error(`Expected a six-digit hex color, received ${hex}`);
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

function hexChannelSpread(hex: string): number {
  const match = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/iu.exec(hex);
  if (!match) throw new Error(`Expected a six-digit hex color, received ${hex}`);
  const channels = match
    .slice(1)
    .map((value) => Number.parseInt(value!, 16) / 255);
  return Math.max(...channels) - Math.min(...channels);
}

function circularHueDistance(first: number, second: number): number {
  const distance = Math.abs(first - second) % 360;
  return Math.min(distance, 360 - distance);
}
