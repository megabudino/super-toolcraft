import type { Locator } from "@playwright/test";

import { collectWorldPalette } from "./grass-scene-randomizer-palette-helpers";
import { pauseGrassPlayback, prepareGrassSession } from "./grass-test-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";

test("scene setup randomizes the authored look and scratches back to surface", async ({
  page,
}) => {
  test.setTimeout(600_000);
  const session = await prepareGrassSession(page);
  await pauseGrassPlayback(page);
  const canvas = page.locator('[data-slot="grass-webgl-canvas"]');
  await expect(
    page.locator('[data-toolcraft-control-target="randomizer.global"]'),
  ).toHaveCount(0);
  const sceneSetup = page.locator(
    '[data-toolcraft-control-target="actions.sceneSetup"]',
  );
  const randomizeButton = sceneSetup.getByRole("button", {
    name: "Randomize",
  });
  const scratchButton = sceneSetup.getByRole("button", { name: "Scratch" });
  await expect(sceneSetup).toBeVisible();
  await expectButtonsToShareRow(randomizeButton, scratchButton);
  const initial = await readWorldState(canvas);

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("actions.sceneSetup", async (field) => {
      await field.getByRole("button", { name: "Randomize" }).click();
    }),
    {
      requirementId: "grass.scene-setup",
      timeoutMs: 90_000,
    },
  );
  const first = await readWorldState(canvas);
  assertSpatialVariation(initial, first);
  assertOrganicObjectScale(first);
  assertRelativeObjectScale(initial, first);
  assertPreservedLook(initial, first);
  expect(first.palette).toEqual(initial.palette);
  assertEveryLayerPresent(first);

  let previous = first;
  for (let index = 0; index < 2; index += 1) {
    const previousSettings = await canvas.getAttribute(
      "data-grass-settings-signature",
    );
    await randomizeButton.click();
    await expect
      .poll(() => canvas.getAttribute("data-grass-settings-signature"), {
        timeout: 90_000,
      })
      .not.toBe(previousSettings);
    const current = await readWorldState(canvas);
    assertSpatialVariation(previous, current);
    assertOrganicObjectScale(current);
    assertRelativeObjectScale(initial, current);
    assertPreservedLook(initial, current);
    expect(current.palette).toEqual(initial.palette);
    assertEveryLayerPresent(current);
    previous = current;
  }

  const beforeScratch = previous;
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("actions.sceneSetup", async (field) => {
      await field.getByRole("button", { name: "Scratch" }).click();
    }),
    {
      requirementId: "grass.scene-setup",
      timeoutMs: 90_000,
    },
  );
  const scratched = await readWorldState(canvas);
  assertSurfaceOnly(scratched);
  assertScratchPreservesAuthoredSettings(beforeScratch, scratched);
});

async function expectButtonsToShareRow(
  first: Locator,
  second: Locator,
): Promise<void> {
  const [firstBox, secondBox] = await Promise.all([
    first.boundingBox(),
    second.boundingBox(),
  ]);
  expect(firstBox).not.toBeNull();
  expect(secondBox).not.toBeNull();
  expect(Math.abs(firstBox!.y - secondBox!.y)).toBeLessThanOrEqual(2);
  expect(secondBox!.x).toBeGreaterThan(firstBox!.x);
}

function assertSpatialVariation(before: WorldState, after: WorldState): void {
  expect(after.dimensions).toEqual(before.dimensions);
  expect(after.layout).not.toBe(before.layout);
  expect(after.spatial).not.toEqual(before.spatial);
}

function assertPreservedLook(initial: WorldState, current: WorldState): void {
  expect(current.canvas).toEqual(initial.canvas);
  expect(current.look).toEqual(initial.look);
  expect(current.lighting).toEqual(initial.lighting);
  expect(current.technical).toEqual(initial.technical);
  expect(current.environmentSignature).toBe(initial.environmentSignature);
  expect(current.windSignature).toBe(initial.windSignature);
}

function assertEveryLayerPresent(state: WorldState): void {
  expect(Object.values(state.enabled).every(Boolean)).toBe(true);
  expect(Object.values(state.actualCounts).every((count) => count > 0)).toBe(
    true,
  );
}

function assertSurfaceOnly(state: WorldState): void {
  expect(state.enabled.ground).toBe(true);
  expect(
    Object.entries(state.enabled)
      .filter(([layer]) => layer !== "ground")
      .every(([, enabled]) => !enabled),
  ).toBe(true);
}

function assertScratchPreservesAuthoredSettings(
  before: WorldState,
  after: WorldState,
): void {
  expect(after.canvas).toEqual(before.canvas);
  expect(after.dimensions).toEqual(before.dimensions);
  expect(after.environmentSignature).toBe(before.environmentSignature);
  expect(after.lighting).toEqual(before.lighting);
  expect(after.look).toEqual(before.look);
  expect(after.objectScale).toEqual(before.objectScale);
  expect(after.palette).toEqual(before.palette);
  expect(after.spatial).toEqual(before.spatial);
  expect(after.technical).toEqual(before.technical);
  expect(after.windSignature).toBe(before.windSignature);
}

function assertOrganicObjectScale(state: WorldState): void {
  const fieldMinimum = Math.min(state.dimensions.width, state.dimensions.depth);
  const tolerance = 0.0001;
  expect(state.objectScale.terrain).toBeLessThanOrEqual(
    fieldMinimum * 0.42 + tolerance,
  );
  expect(state.objectScale.tall).toBeLessThanOrEqual(
    fieldMinimum * 0.25 + tolerance,
  );
  expect(state.objectScale.lawn).toBeLessThanOrEqual(
    fieldMinimum * 0.1 + tolerance,
  );
  expect(state.objectScale.boulder).toBeLessThanOrEqual(
    Math.max(0.6, fieldMinimum * 0.22) + tolerance,
  );
  expect(state.objectScale.rocks).toBeLessThanOrEqual(
    fieldMinimum * 0.18 + tolerance,
  );
  for (const value of state.objectScale.features) {
    expect(value).toBeLessThanOrEqual(fieldMinimum * 0.22 + tolerance);
  }
}

function assertRelativeObjectScale(
  source: WorldState,
  state: WorldState,
): void {
  const tolerance = 0.0001;
  expect(state.objectScale.terrain).toBeLessThanOrEqual(
    source.objectScale.terrain * 1.2 + tolerance,
  );
  expect(state.objectScale.tall).toBeLessThanOrEqual(
    source.objectScale.tall * 1.2 + tolerance,
  );
  expect(state.objectScale.lawn).toBeLessThanOrEqual(
    source.objectScale.lawn * 1.2 + tolerance,
  );
  expect(state.objectScale.boulder).toBeLessThanOrEqual(
    source.objectScale.boulder * 1.2 + tolerance,
  );
  expect(state.objectScale.rocks).toBeLessThanOrEqual(
    source.objectScale.rocks * 1.2 + tolerance,
  );
  for (const [index, value] of state.objectScale.features.entries()) {
    expect(value).toBeLessThanOrEqual(
      (source.objectScale.features[index] ?? 0) * 1.2 + tolerance,
    );
  }
}

type RandomizedGrassSettings = Readonly<{
  appearance: Readonly<Record<string, unknown>> & {
    bladeGradient: NormalizedGradient;
    groundColor: string;
    instanceColors: NormalizedInstanceColors;
  };
  blade: Readonly<{
    curveResolution: number;
    heightMax: number;
    use3d: boolean;
  }>;
  environment: unknown;
  export: unknown;
  field: Readonly<{
    depth: number;
    distribution: unknown;
    showGround: boolean;
    width: number;
  }>;
  grass: Readonly<{ enabled: boolean }>;
  lawn: Readonly<Record<string, unknown>> & {
    bladeGradient: NormalizedGradient;
    curveResolution: number;
    enabled: boolean;
    instanceColors: NormalizedInstanceColors;
    use3d: boolean;
  };
  preview: unknown;
  scans: Readonly<
    Record<
      "boulder" | "rocks" | "tufted" | "white" | "wild" | "yellow",
      Readonly<Record<string, unknown>> & { enabled: boolean; pbrTint: string }
    >
  >;
  scene: unknown;
  surface: Readonly<Record<string, unknown>> & {
    clover: Readonly<Record<string, unknown>> & { color: string };
  };
  terrain: Readonly<{ maxHeight: number }>;
  view: unknown;
  wind: unknown;
}>;

type NormalizedGradient = Readonly<Record<string, unknown>> & {
  colors: readonly string[];
};

type NormalizedInstanceColors = Readonly<Record<string, unknown>> & {
  colors: readonly string[];
  weights: readonly number[];
};

type WorldState = Awaited<ReturnType<typeof readWorldState>>;

async function readWorldState(canvas: Locator) {
  const signature = await canvas.getAttribute("data-grass-settings-signature");
  if (!signature) throw new Error("Grass settings signature is unavailable");
  const settings = JSON.parse(signature) as RandomizedGrassSettings;
  const layout = await canvas.getAttribute("data-grass-layout-signature");
  if (!layout) throw new Error("Grass actual layout signature is unavailable");
  const actualCounts = Object.fromEntries(
    await Promise.all(
      [
        "tall-blade",
        "lawn-blade",
        "scan-boulder",
        "scan-rocks",
        "scan-tufted",
        "scan-white",
        "scan-wild",
        "scan-yellow",
      ].map(async (layer) => [
        layer,
        Number(await canvas.getAttribute(`data-grass-${layer}-count`)),
      ]),
    ),
  );
  return {
    actualCounts,
    canvas: {
      backingHeight: await readCanvasNumberAttribute(canvas, "height"),
      backingWidth: await readCanvasNumberAttribute(canvas, "width"),
      renderScale: await readCanvasNumberAttribute(
        canvas,
        "data-grass-render-scale",
      ),
      timelineProgress: await readCanvasFiniteNumberAttribute(
        canvas,
        "data-grass-timeline-progress",
      ),
    },
    dimensions: { depth: settings.field.depth, width: settings.field.width },
    enabled: {
      boulder: settings.scans.boulder.enabled,
      grass: settings.grass.enabled,
      ground: settings.field.showGround,
      lawn: settings.lawn.enabled,
      rocks: settings.scans.rocks.enabled,
      tufted: settings.scans.tufted.enabled,
      white: settings.scans.white.enabled,
      wild: settings.scans.wild.enabled,
      yellow: settings.scans.yellow.enabled,
    },
    environmentSignature: await canvas.getAttribute(
      "data-grass-environment-signature",
    ),
    layout,
    lighting: settings.environment,
    look: {
      appearance: omitGeneratedGrassColors(settings.appearance, true),
      lawn: omitSpatialLayerValues(
        omitGeneratedGrassColors(settings.lawn, false),
      ),
      scans: Object.fromEntries(
        Object.entries(settings.scans).map(([kind, layer]) => [
          kind,
          omitSpatialLayerValues(layer, true),
        ]),
      ),
      scene: settings.scene,
      surface: omitGeneratedSurfaceColor(settings.surface),
    },
    objectScale: {
      boulder: Number(settings.scans.boulder.size),
      features: [
        Number(settings.scans.tufted.sizeMax),
        Number(settings.scans.white.sizeMax),
        Number(settings.scans.wild.sizeMax),
        Number(settings.scans.yellow.sizeMax),
      ],
      lawn: Number(settings.lawn.heightMax),
      rocks: Number(settings.scans.rocks.sizeMax),
      tall: Number(settings.blade.heightMax),
      terrain: Number(settings.terrain.maxHeight),
    },
    palette: collectWorldPalette(settings),
    spatial: {
      clumping: Object.fromEntries(
        Object.entries(settings.scans)
          .filter(([kind]) => kind !== "boulder")
          .map(([kind, layer]) => [kind, layer.clumping]),
      ),
      distribution: settings.field.distribution,
      terrain: settings.terrain,
    },
    technical: {
      bladeQuality: {
        curveResolution: settings.blade.curveResolution,
        use3d: settings.blade.use3d,
      },
      export: settings.export,
      lawnQuality: {
        curveResolution: settings.lawn.curveResolution,
        use3d: settings.lawn.use3d,
      },
      preview: settings.preview,
      view: settings.view,
      wind: settings.wind,
    },
    windSignature: await canvas.getAttribute(
      "data-grass-wind-settings-signature",
    ),
  };
}

async function readCanvasNumberAttribute(
  canvas: Locator,
  attribute: string,
): Promise<number> {
  const raw = await canvas.getAttribute(attribute);
  const value = Number(raw);
  if (raw === null || !Number.isFinite(value) || value <= 0) {
    throw new Error(`Canvas attribute ${attribute} must be a positive number.`);
  }
  return value;
}

async function readCanvasFiniteNumberAttribute(
  canvas: Locator,
  attribute: string,
): Promise<number> {
  const raw = await canvas.getAttribute(attribute);
  const value = Number(raw);
  if (raw === null || !Number.isFinite(value)) {
    throw new Error(`Canvas attribute ${attribute} must be a finite number.`);
  }
  return value;
}

function omitSpatialLayerValues(
  layer: Readonly<Record<string, unknown>>,
  omitTint = false,
): Readonly<Record<string, unknown>> {
  const {
    clumping: _clumping,
    count: _count,
    densityMax: _densityMax,
    depthOffset: _depthOffset,
    distanceMin: _distanceMin,
    enabled: _enabled,
    heightMax: _heightMax,
    heightMin: _heightMin,
    seed: _seed,
    size: _size,
    sizeMax: _sizeMax,
    sizeMin: _sizeMin,
    surfaceOffset: _surfaceOffset,
    taperEnd: _taperEnd,
    thickness: _thickness,
    tilt2d: _tilt2d,
    ...look
  } = layer;
  if (omitTint) delete look.pbrTint;
  return look;
}

function omitGeneratedGrassColors(
  layer: Readonly<Record<string, unknown>> & {
    bladeGradient: NormalizedGradient;
    instanceColors: NormalizedInstanceColors;
  },
  omitGroundColor: boolean,
): Readonly<Record<string, unknown>> {
  const {
    bladeColors: _bladeColors,
    bladeGradient,
    groundColor: _groundColor,
    instanceColors,
    ...look
  } = layer;
  const { colors: _gradientColors, ...gradientResponse } = bladeGradient;
  const { colors: _instanceColors, ...instanceDistribution } = instanceColors;
  return {
    ...look,
    ...(!omitGroundColor && _groundColor !== undefined
      ? { groundColor: _groundColor }
      : {}),
    bladeGradient: gradientResponse,
    instanceColors: instanceDistribution,
  };
}

function omitGeneratedSurfaceColor(
  surface: Readonly<Record<string, unknown>> & {
    clover: Readonly<Record<string, unknown>> & { color: string };
  },
): Readonly<Record<string, unknown>> {
  const { clover, ...surfaceResponse } = surface;
  const { color: _color, ...cloverResponse } = clover;
  return { ...surfaceResponse, clover: cloverResponse };
}
