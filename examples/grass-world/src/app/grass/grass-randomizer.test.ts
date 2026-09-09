import type { ToolcraftState } from "@/toolcraft/runtime";
import { describe, expect, it, vi } from "vitest";

import { grassControlSections } from "./grass-controls";
import { grassDefaults } from "./grass-defaults";
import { createGrassLayout } from "./grass-layout";
import { GRASS_WORLD_COLOR_TARGETS } from "./grass-world-colors";
import {
  applyGrassSceneRandomization,
  applyGrassSceneScratch,
  createGrassSceneVariation,
  type GrassSceneVariation,
} from "./grass-randomizer";
import {
  changedAxes,
  expectScaledNumber,
  expectScaledRange,
  occupiedCellRatio,
  paletteSlice,
  preservedSlice,
  rangeHigh,
} from "./grass-randomizer-test-utils";
import { grassScanLayerKinds } from "./grass-scan-contract";
import {
  createGrassBoulderLayout,
  createGrassScanLayout,
} from "./grass-scan-layout";
import { readGrassSettings } from "./grass-values";
import {
  GRASS_FORCED_VISIBLE_TARGETS,
  GRASS_GENERATED_WORLD_TARGETS,
  getGrassWorldScale,
} from "./grass-world-generator";

describe("scene randomizer", () => {
  it("exposes a randomized scene or surface-only scratch starting point", () => {
    const sectionIndex = grassControlSections.findIndex(
      (section) => "title" in section && section.title === "Scene Setup",
    );
    const previewIndex = grassControlSections.findIndex(
      (section) => "title" in section && section.title === "Preview Quality",
    );
    const environmentIndex = grassControlSections.findIndex(
      (section) => "title" in section && section.title === "Scene Environment",
    );
    expect(sectionIndex).toBe(previewIndex + 1);
    expect(sectionIndex).toBeLessThan(environmentIndex);
    expect(grassControlSections[sectionIndex]?.controls).toEqual({
      startingPoint: expect.objectContaining({
        actions: [
          { label: "Randomize", value: "randomize.scene" },
          { label: "Scratch", value: "scratch.scene" },
        ],
        label: "Starting point",
        target: "actions.sceneSetup",
        type: "actions",
      }),
    });
  });

  it("dispatches Scratch as a surface-only visibility preset", () => {
    const dispatch = vi.fn();
    applyGrassSceneScratch({
      dispatch,
      state: {
        mediaAssets: [],
        values: {
          ...grassDefaults,
          "scan.rocks.sizeMax": 1.37,
        },
      },
    });

    expect(dispatch).toHaveBeenCalledTimes(GRASS_FORCED_VISIBLE_TARGETS.length);
    const commands = dispatch.mock.calls.map(([command]) => command);
    expect(commands.map((command) => command.target)).toEqual(
      GRASS_FORCED_VISIBLE_TARGETS,
    );
    for (const command of commands) {
      expect(command).toMatchObject({
        history: "skip",
        label: "Start from scratch",
        type: "controls.setValue",
        value: command.target === "field.showGround",
      });
    }
    expect(commands).not.toContainEqual(
      expect.objectContaining({ target: "scan.rocks.sizeMax" }),
    );
  });

  it("advances deterministically while preserving the authored look", () => {
    const currentValues = Object.fromEntries(
      Object.entries(grassDefaults).map(([target, value], index) => [
        target,
        typeof value === "number" ? index + 0.25 : value,
      ]),
    );
    const first = createGrassSceneVariation({ currentValues });
    const second = createGrassSceneVariation({
      currentValues: { ...currentValues, ...first.patch },
      generatedScaleMarker: first.generatedScaleMarker,
    });

    expect(createGrassSceneVariation({ currentValues })).toEqual(first);
    expect(second.worldId).not.toBe(first.worldId);
    expect(second.axes.coverageTopology).not.toBe(first.axes.coverageTopology);
    expect(changedAxes(first.axes, second.axes)).toBeGreaterThanOrEqual(4);
    expect(Object.keys(first.patch).sort()).toEqual(
      [...GRASS_GENERATED_WORLD_TARGETS].sort(),
    );
    expect(preservedSlice({ ...currentValues, ...first.patch })).toEqual(
      preservedSlice(currentValues),
    );
    for (const target of GRASS_FORCED_VISIBLE_TARGETS) {
      expect(first.patch[target]).toBe(true);
    }
  });

  it("dispatches only the deterministic spatial patch and keeps custom HDRI", () => {
    const dispatch = vi.fn();
    const worldId = applyGrassSceneRandomization({
      dispatch,
      state: {
        mediaAssets: [
          {
            assetKind: "file",
            dataUrl: "data:application/octet-stream;base64,AA==",
            fileName: "custom.hdr",
            id: "custom-hdri",
            layerId: "environment",
            mimeType: "application/octet-stream",
            position: { x: 0, y: 0 },
            sourceTarget: "environment.hdriFile",
          },
        ],
        values: { ...grassDefaults },
      },
    });

    expect(worldId).not.toBe(grassDefaults["field.seed"]);
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "media.delete" }),
    );
    for (const [command] of dispatch.mock.calls) {
      expect(command).toMatchObject({
        history: "skip",
        label: "Randomize scene",
        type: "controls.setValue",
      });
      expect(command).not.toHaveProperty("historyGroup");
      expect(GRASS_GENERATED_WORLD_TARGETS).toContain(command.target);
    }
  });

  it("preserves every active project color exactly across repeated generations", () => {
    const initialValues: Readonly<Record<string, unknown>> = {
      ...grassDefaults,
      "appearance.groundColor": "#236b34",
      "appearance.instanceColor2": "#357a48",
      "scan.rocks.pbrTint": "#8a7965",
      "surface.cloverColor": "#315f2f",
    };
    const expectedColors = paletteSlice(initialValues);
    let currentValues = initialValues;
    let generatedScaleMarker: GrassSceneVariation["generatedScaleMarker"] | null =
      null;

    for (let index = 0; index < 48; index += 1) {
      const variation = createGrassSceneVariation({
        currentValues,
        generatedScaleMarker,
      });
      for (const target of GRASS_WORLD_COLOR_TARGETS) {
        expect(variation.patch).not.toHaveProperty(target);
      }
      currentValues = { ...currentValues, ...variation.patch };
      generatedScaleMarker = variation.generatedScaleMarker;
      expect(paletteSlice(currentValues)).toEqual(expectedColors);
    }
  });

  it(
    "keeps every scene layer present and varies coverage without changing colors",
    () => {
      let currentValues: Readonly<Record<string, unknown>> = grassDefaults;
      let generatedScaleMarker:
        | GrassSceneVariation["generatedScaleMarker"]
        | null = null;
      const occupiedTallCellRatios: number[] = [];
      const expectedColors = paletteSlice(currentValues);
      for (let index = 0; index < 24; index += 1) {
        const variation = createGrassSceneVariation({
          currentValues,
          generatedScaleMarker,
        });
        currentValues = { ...currentValues, ...variation.patch };
        generatedScaleMarker = variation.generatedScaleMarker;
        expect(paletteSlice(currentValues)).toEqual(expectedColors);
        expect(preservedSlice(currentValues)).toEqual(
          preservedSlice(grassDefaults),
        );
        const settings = readGrassSettings({
          canvas: { size: { height: 1080, width: 1920 } },
          mediaAssets: [],
          timeline: {
            currentTimeSeconds: 0,
            durationSeconds: 6,
            isLooping: true,
            isPlaying: false,
          },
          values: currentValues,
        } as unknown as ToolcraftState);

        const tallLayout = createGrassLayout(settings, "tall");
        expect(tallLayout.count).toBeGreaterThan(0);
        occupiedTallCellRatios.push(
          occupiedCellRatio(
            tallLayout.offsets,
            settings.field.width,
            settings.field.depth,
          ),
        );
        expect(createGrassLayout(settings, "lawn").count).toBeGreaterThan(0);
        for (const kind of grassScanLayerKinds) {
          expect(createGrassScanLayout(kind, settings).count).toBeGreaterThan(0);
        }
        expect(createGrassBoulderLayout(settings).count).toBe(1);
      }

      expect(Math.min(...occupiedTallCellRatios)).toBeLessThan(
        Math.max(...occupiedTallCellRatios) * 0.7,
      );
    },
    60_000,
  );

  it("keeps generated height and object scale at or below 120% of the active source scene without cumulative drift", () => {
    const initialValues: Readonly<Record<string, unknown>> = {
      ...grassDefaults,
      "blade.heightRange": [0.42, 0.78],
      "blade.thickness": 0.024,
      "field.depth": 8,
      "field.width": 10,
      "lawn.heightRange": [0.11, 0.22],
      "lawn.thickness": 0.016,
      "scan.boulder.size": 0.82,
      "scan.rocks.sizeRange": [0.5, 0.72],
      "scan.tufted.sizeRange": [0.5, 0.68],
      "scan.white.sizeRange": [0.5, 0.64],
      "scan.wild.sizeRange": [0.58, 0.88],
      "scan.yellow.sizeRange": [0.5, 0.62],
      "terrain.maxHeight": 1.4,
    };
    let currentValues = initialValues;
    let generatedScaleMarker: GrassSceneVariation["generatedScaleMarker"] | null =
      null;

    for (let index = 0; index < 64; index += 1) {
      const variation = createGrassSceneVariation({
        currentValues,
        generatedScaleMarker,
      });
      currentValues = { ...currentValues, ...variation.patch };
      generatedScaleMarker = variation.generatedScaleMarker;
      const expectedScale = getGrassWorldScale(variation.worldId);

      expectScaledNumber(
        currentValues,
        initialValues,
        "terrain.maxHeight",
        expectedScale,
      );
      expectScaledNumber(
        currentValues,
        initialValues,
        "blade.thickness",
        expectedScale,
      );
      expectScaledRange(
        currentValues,
        initialValues,
        "blade.heightRange",
        expectedScale,
      );
      expectScaledNumber(
        currentValues,
        initialValues,
        "lawn.thickness",
        expectedScale,
      );
      expectScaledRange(
        currentValues,
        initialValues,
        "lawn.heightRange",
        expectedScale,
      );
      expectScaledNumber(
        currentValues,
        initialValues,
        "scan.boulder.size",
        expectedScale,
      );
      for (const kind of grassScanLayerKinds) {
        expectScaledRange(
          currentValues,
          initialValues,
          `scan.${kind}.sizeRange`,
          expectedScale,
        );
      }
    }
  });

  it("promotes a manually edited height to the active scale baseline", () => {
    const first = createGrassSceneVariation({
      currentValues: {
        ...grassDefaults,
        "terrain.maxHeight": 1,
      },
    });
    const editedHeight = 1.6;
    const currentValues = {
      ...grassDefaults,
      ...first.patch,
      "terrain.maxHeight": editedHeight,
    };
    const next = createGrassSceneVariation({
      currentValues,
      generatedScaleMarker: first.generatedScaleMarker,
    });

    expect(Number(next.patch["terrain.maxHeight"])).toBeCloseTo(
      editedHeight * getGrassWorldScale(next.worldId),
      6,
    );
    expect(Number(next.patch["terrain.maxHeight"])).toBeLessThanOrEqual(
      editedHeight * 1.2,
    );
  });

  it("caps already oversized imported objects against the fixed field footprint", () => {
    const variation = createGrassSceneVariation({
      currentValues: {
        ...grassDefaults,
        "blade.heightRange": [2, 2.4],
        "field.depth": 5,
        "field.width": 7,
        "lawn.heightRange": [0.45, 0.55],
        "scan.boulder.size": 3.2,
        "scan.rocks.sizeRange": [1.8, 2.2],
        "scan.tufted.sizeRange": [1.7, 2],
        "terrain.maxHeight": 3,
      },
    });

    expect(rangeHigh(variation.patch["blade.heightRange"])).toBeLessThanOrEqual(
      1.25,
    );
    expect(rangeHigh(variation.patch["lawn.heightRange"])).toBeLessThanOrEqual(
      0.5,
    );
    expect(Number(variation.patch["scan.boulder.size"])).toBeLessThanOrEqual(
      Number(grassDefaults["scan.boulder.size"]),
    );
    expect(
      rangeHigh(variation.patch["scan.rocks.sizeRange"]),
    ).toBeLessThanOrEqual(0.9);
    expect(
      rangeHigh(variation.patch["scan.tufted.sizeRange"]),
    ).toBeLessThanOrEqual(1.1);
    expect(Number(variation.patch["terrain.maxHeight"])).toBeLessThanOrEqual(
      2.1,
    );
  });
});
