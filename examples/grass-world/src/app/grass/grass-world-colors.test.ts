import { describe, expect, it } from "vitest";

import { grassDefaults } from "./grass-defaults";
import { readGrassWorldOklch } from "./grass-world-color-transform";
import {
  createGrassWorldColorPatch,
  createGrassWorldPaletteMarker,
  GRASS_WORLD_COLOR_TARGETS,
  recoverGrassWorldPaletteReference,
  type GrassWorldColorTarget,
  type GrassWorldPaletteMarker,
} from "./grass-world-colors";

const expectedTargets = [
  "appearance.groundColor",
  "surface.cloverColor",
  "appearance.bladeGradient",
  "appearance.instanceColor1",
  "appearance.instanceColor2",
  "appearance.instanceColor3",
  "lawn.bladeGradient",
  "lawn.instanceColor1",
  "lawn.instanceColor2",
  "lawn.instanceColor3",
  "scan.tufted.pbrTint",
  "scan.wild.pbrTint",
  "scan.white.pbrTint",
  "scan.yellow.pbrTint",
  "scan.rocks.pbrTint",
  "scan.boulder.pbrTint",
] as const;

describe("grass world colors", () => {
  it("owns exactly sixteen targets containing every current concrete color", () => {
    const patch = createGrassWorldColorPatch(grassDefaults, 18);
    expect(GRASS_WORLD_COLOR_TARGETS).toEqual(expectedTargets);
    expect(Object.keys(patch)).toEqual(expectedTargets);
    expect(collectColors(patch)).toHaveLength(21);
    expect(collectColors(patch).every((color) => /^#[\da-f]{6}$/u.test(color))).toBe(
      true,
    );
  });

  it("builds deterministic varied moods with correlated fresh semantics", () => {
    const patches = Array.from({ length: 96 }, (_, index) =>
      createGrassWorldColorPatch(grassDefaults, index * 12_163 + 907),
    );
    expect(createGrassWorldColorPatch(grassDefaults, 42)).toEqual(
      createGrassWorldColorPatch(grassDefaults, 42),
    );
    expect(new Set(patches.map((patch) => JSON.stringify(patch))).size).toBe(
      patches.length,
    );

    for (const patch of patches) assertFreshPalette(patch);
  });

  it("preserves all gradient metadata and changes only stop colors", () => {
    const reference = {
      ...grassDefaults,
      "appearance.bladeGradient": {
        angle: 37,
        customMetadata: { source: "authored" },
        gradientType: "radial",
        stops: [
          {
            color: "#173a26",
            customStopMetadata: "root",
            opacity: 43,
            position: "11%",
          },
          {
            color: "#789546",
            customStopMetadata: "middle",
            opacity: 67,
            position: "51%",
          },
          {
            color: "#eef29a",
            customStopMetadata: "tip",
            opacity: 87,
            position: "83%",
          },
        ],
      },
    };
    const generated = createGrassWorldColorPatch(reference, 51)[
      "appearance.bladeGradient"
    ] as unknown as typeof reference["appearance.bladeGradient"];

    expect(gradientMetadata(generated)).toEqual(
      gradientMetadata(reference["appearance.bladeGradient"]),
    );
    expect(generated.stops.map((stop) => stop.color)).not.toEqual(
      reference["appearance.bladeGradient"].stops.map((stop) => stop.color),
    );
  });

  it("recovers all authored palette values without drift across 96 worlds", () => {
    let current: Readonly<Record<string, unknown>> = { ...grassDefaults };
    let marker: GrassWorldPaletteMarker | null = null;
    let previousWorldId: number | undefined;

    for (let index = 0; index < 96; index += 1) {
      if (previousWorldId !== undefined) {
        current = recoverGrassWorldPaletteReference(
          current,
          previousWorldId,
          marker,
        );
      }
      const worldId = (index * 12_163 + 907) % 197_568;
      const patch = createGrassWorldColorPatch(current, worldId);
      marker = createGrassWorldPaletteMarker(current, patch, worldId);
      current = { ...current, ...patch };
      previousWorldId = worldId;
    }

    const recovered = recoverGrassWorldPaletteReference(
      current,
      previousWorldId,
      marker,
    );
    expect(paletteSlice(recovered)).toEqual(paletteSlice(grassDefaults));
  });

  it("reanchors only the manually edited target", () => {
    const worldId = 12_183;
    const generated = createGrassWorldColorPatch(grassDefaults, worldId);
    const marker = createGrassWorldPaletteMarker(
      grassDefaults,
      generated,
      worldId,
    );
    const nextWorldId = 24_346;

    for (const target of GRASS_WORLD_COLOR_TARGETS) {
      const manualValue = manualValueFor(target, generated[target]);
      const current = { ...grassDefaults, ...generated, [target]: manualValue };
      const recovered = recoverGrassWorldPaletteReference(
        current,
        worldId,
        marker,
      );
      expect(recovered[target], target).toEqual(manualValue);
      for (const otherTarget of GRASS_WORLD_COLOR_TARGETS) {
        if (otherTarget === target) continue;
        expect(recovered[otherTarget], otherTarget).toEqual(
          grassDefaults[otherTarget],
        );
      }

      const next = createGrassWorldColorPatch(recovered, nextWorldId);
      const expected = createGrassWorldColorPatch(
        { ...grassDefaults, [target]: manualValue },
        nextWorldId,
      );
      expect(next[target], target).toEqual(expected[target]);
    }
  });

  it("deep-clones marker values instead of retaining mutable gradient objects", () => {
    const reference = structuredClone(grassDefaults) as unknown as Record<
      string,
      unknown
    >;
    const generated = createGrassWorldColorPatch(reference, 12_183) as unknown as
      Record<string, unknown>;
    const marker = createGrassWorldPaletteMarker(reference, generated, 12_183);
    const originalReference = structuredClone(marker.referenceValues);
    const originalGenerated = structuredClone(marker.generatedValues);

    gradientStops(reference["appearance.bladeGradient"])[0]!.color = "#ff0000";
    gradientStops(generated["appearance.bladeGradient"])[0]!.color = "#0000ff";

    expect(marker.referenceValues).toEqual(originalReference);
    expect(marker.generatedValues).toEqual(originalGenerated);
  });
});

function assertFreshPalette(patch: Readonly<Record<string, unknown>>): void {
  const tallGradient = gradientColors(patch["appearance.bladeGradient"]);
  const lawnGradient = gradientColors(patch["lawn.bladeGradient"]);
  const tallInstances = instanceColors(patch, "appearance");
  const lawnInstances = instanceColors(patch, "lawn");
  const tallCoordinates = tallGradient.map(readGrassWorldOklch);
  const lawnCoordinates = lawnGradient.map(readGrassWorldOklch);
  const tallInstanceCoordinates = tallInstances.map(readGrassWorldOklch);
  const lawnInstanceCoordinates = lawnInstances.map(readGrassWorldOklch);

  expectIncreasingLightness(tallCoordinates, "Tall gradient");
  expectIncreasingLightness(lawnCoordinates, "Lawn gradient");
  expectIncreasingLightness(tallInstanceCoordinates, "Tall instances");
  expectIncreasingLightness(lawnInstanceCoordinates, "Lawn instances");

  for (const coordinates of [
    ...tallCoordinates,
    ...lawnCoordinates,
    ...tallInstanceCoordinates,
    ...lawnInstanceCoordinates,
    readGrassWorldOklch(String(patch["scan.wild.pbrTint"])),
  ]) {
    expect(coordinates.hue).toBeGreaterThanOrEqual(130);
    expect(coordinates.hue).toBeLessThanOrEqual(170);
  }
  for (const tip of [
    tallCoordinates.at(-1)!,
    lawnCoordinates.at(-1)!,
    tallInstanceCoordinates.at(-1)!,
    lawnInstanceCoordinates.at(-1)!,
  ]) {
    expect(tip.hue).toBeGreaterThanOrEqual(130);
    expect(tip.hue).toBeLessThanOrEqual(160);
    expect(tip.lightness).toBeLessThanOrEqual(0.87);
  }

  expect(hueDistance(tallCoordinates[1]!.hue, lawnCoordinates[1]!.hue)).toBeLessThanOrEqual(
    10,
  );
  expect(
    hueDistance(
      tallInstanceCoordinates[1]!.hue,
      lawnInstanceCoordinates[1]!.hue,
    ),
  ).toBeLessThanOrEqual(10);

  const ground = readGrassWorldOklch(String(patch["appearance.groundColor"]));
  const clover = readGrassWorldOklch(String(patch["surface.cloverColor"]));
  expect(ground.hue).toBeGreaterThanOrEqual(148);
  expect(ground.hue).toBeLessThanOrEqual(174);
  expect(ground.chroma).toBeGreaterThanOrEqual(0.138);
  expect(ground.chroma).toBeLessThanOrEqual(0.235);
  expect(ground.lightness).toBeGreaterThanOrEqual(0.5);
  expect(ground.lightness).toBeLessThanOrEqual(0.67);
  expect(clover.hue).toBeGreaterThanOrEqual(148);
  expect(clover.hue).toBeLessThanOrEqual(174);
  expect(clover.chroma).toBeGreaterThanOrEqual(0.14);
  expect(clover.chroma).toBeLessThanOrEqual(0.235);
  expect(clover.lightness).toBeGreaterThanOrEqual(0.5);
  expect(clover.lightness).toBeLessThanOrEqual(0.67);

  const tufted = readGrassWorldOklch(String(patch["scan.tufted.pbrTint"]));
  expect(tufted.hue).toBeGreaterThanOrEqual(134);
  expect(tufted.hue).toBeLessThanOrEqual(162);
  expect(tufted.chroma).toBeGreaterThanOrEqual(0.045);
  expect(tufted.chroma).toBeLessThanOrEqual(0.09);

  const wild = readGrassWorldOklch(String(patch["scan.wild.pbrTint"]));
  expect(wild.chroma).toBeGreaterThanOrEqual(0.09);
  expect(wild.chroma).toBeLessThanOrEqual(0.2);
  expect(wild.hue).toBeGreaterThanOrEqual(136);
  expect(wild.hue).toBeLessThanOrEqual(160);
  expect(wild.lightness).toBeGreaterThanOrEqual(0.58);
  expect(wild.lightness).toBeLessThanOrEqual(0.78);

  const white = readGrassWorldOklch(String(patch["scan.white.pbrTint"]));
  expect(white.lightness).toBeGreaterThanOrEqual(0.945);
  expect(white.lightness).toBeLessThanOrEqual(0.99);
  expect(white.chroma).toBeLessThanOrEqual(0.008);
  const yellow = readGrassWorldOklch(String(patch["scan.yellow.pbrTint"]));
  expect(yellow.lightness).toBeGreaterThanOrEqual(0.93);
  expect(yellow.lightness).toBeLessThanOrEqual(0.985);
  expect(yellow.chroma).toBeLessThanOrEqual(0.024);
  expect(yellow.hue).toBeGreaterThanOrEqual(92);
  expect(yellow.hue).toBeLessThanOrEqual(112);

  for (const target of [
    "scan.rocks.pbrTint",
    "scan.boulder.pbrTint",
  ] as const) {
    const stone = readGrassWorldOklch(String(patch[target]));
    expect(stone.chroma).toBeLessThanOrEqual(0.026);
    expect(stone.lightness).toBeGreaterThanOrEqual(0.77);
    expect(stone.lightness).toBeLessThanOrEqual(0.88);
  }
}

function expectIncreasingLightness(
  colors: readonly ReturnType<typeof readGrassWorldOklch>[],
  label: string,
): void {
  for (let index = 1; index < colors.length; index += 1) {
    expect(colors[index - 1]!.lightness, `${label} stop ${index - 1}`).toBeLessThan(
      colors[index]!.lightness,
    );
  }
}

function manualValueFor(target: GrassWorldColorTarget, value: unknown): unknown {
  if (!target.endsWith("bladeGradient")) return "#5b4630";
  const gradient = structuredClone(value) as Record<string, unknown>;
  gradientStops(gradient)[1]!.color = "#315f42";
  return gradient;
}

function collectColors(patch: Readonly<Record<string, unknown>>): string[] {
  return GRASS_WORLD_COLOR_TARGETS.flatMap((target) =>
    target.endsWith("bladeGradient")
      ? gradientColors(patch[target])
      : [String(patch[target])],
  );
}

function paletteSlice(values: Readonly<Record<string, unknown>>) {
  return Object.fromEntries(
    GRASS_WORLD_COLOR_TARGETS.map((target) => [target, values[target]]),
  );
}

function instanceColors(
  patch: Readonly<Record<string, unknown>>,
  prefix: "appearance" | "lawn",
): readonly string[] {
  return [1, 2, 3].map((index) =>
    String(patch[`${prefix}.instanceColor${index}`]),
  );
}

function gradientMetadata(value: Record<string, unknown>) {
  const { stops, ...metadata } = value;
  return {
    ...metadata,
    stops: gradientStops({ stops }).map(({ color: _color, ...stop }) => stop),
  };
}

function gradientColors(value: unknown): string[] {
  return gradientStops(value).map((stop) => String(stop.color));
}

function gradientStops(value: unknown): Record<string, unknown>[] {
  if (!isRecord(value) || !Array.isArray(value.stops)) {
    throw new Error("Expected a gradient value.");
  }
  return value.stops as Record<string, unknown>[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hueDistance(left: number, right: number): number {
  const difference = Math.abs(left - right) % 360;
  return Math.min(difference, 360 - difference);
}
