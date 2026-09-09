import * as THREE from "three";
import { describe, expect, it } from "vitest";
import type { ToolcraftControlSchema, ToolcraftState } from "@/toolcraft/runtime";

import { appSchema } from "../app-schema";
import { createGrassGroundGeometry } from "./grass-geometry";
import {
  getGrassFieldRelativeDistance,
  getGrassFieldShapeSettings,
  isGrassFieldFootprintInside,
  isGrassFieldPointInside,
} from "./grass-field-shape";
import { createGrassLayout } from "./grass-layout";
import { grassDefaults } from "./grass-defaults";
import { grassScanLayerContracts, grassScanLayerKinds } from "./grass-scan-contract";
import { createGrassBoulderLayout, createGrassScanLayout } from "./grass-scan-layout";
import {
  getGrassSurfaceBendOffset,
  getGrassSurfacePlacementShapeSettings,
  isGrassSurfaceBendPoint,
} from "./grass-surface-bend";
import { readGrassSettings } from "./grass-values";

function findControl(target: string): ToolcraftControlSchema {
  for (const section of appSchema.panels.controls?.sections ?? []) {
    const control = Object.values(section.controls).find(
      (candidate) => candidate.target === target,
    );
    if (control) return control;
  }
  throw new Error(`Missing control ${target}`);
}

function settingsWith(values: Readonly<Record<string, unknown>> = {}) {
  return readGrassSettings({
    canvas: { size: { height: 1080, width: 1920 } },
    mediaAssets: [],
    timeline: {
      currentTimeSeconds: 0,
      durationSeconds: 6,
      isLooping: true,
      isPlaying: false,
    },
    values,
  } as unknown as ToolcraftState);
}

describe("surface perimeter bend", () => {
  it("surface perimeter bend maps controls to Terrain and placement", () => {
    expect(findControl("surface.bendEnabled")).toMatchObject({
      defaultValue: true,
      label: "Include",
      type: "switch",
    });
    expect(findControl("surface.bendDepth")).toMatchObject({
      defaultValue: grassDefaults["surface.bendDepth"],
      max: 2.5,
      min: 0,
      step: 0.05,
      type: "slider",
      unit: "m",
      visibleWhen: { equals: true, target: "surface.bendEnabled" },
    });
    expect(findControl("surface.bendWidth")).toMatchObject({
      defaultValue: grassDefaults["surface.bendWidth"],
      max: 40,
      min: 5,
      step: 1,
      type: "slider",
      unit: "%",
      visibleWhen: { equals: true, target: "surface.bendEnabled" },
    });
    for (const target of [
      "surface.bendRoundness",
      "surface.bendSmoothness",
    ] as const) {
      expect(findControl(target)).toMatchObject({
        defaultValue: grassDefaults[target],
        max: 100,
        min: 0,
        step: 1,
        type: "slider",
        unit: "%",
        visibleWhen: { equals: true, target: "surface.bendEnabled" },
      });
    }
  });

  it("normalizes settings and evaluates an exact bounded profile", () => {
    const settings = settingsWith();
    expect(settings.surface.bend).toEqual({
      depth: 0.05,
      enabled: true,
      roundness: 1,
      smoothness: 0.07,
      width: 0.05,
    });
    expect(
      settingsWith({
        "surface.bendDepth": 9,
        "surface.bendRoundness": -20,
        "surface.bendSmoothness": 140,
        "surface.bendWidth": 90,
      }).surface.bend,
    ).toEqual({
      depth: 2.5,
      enabled: true,
      roundness: 0,
      smoothness: 1,
      width: 0.4,
    });

    const start = 1 - settings.surface.bend.width;
    const profileSample = start + settings.surface.bend.width * 0.35;
    expect(getGrassSurfaceBendOffset(0, settings.surface.bend)).toBe(0);
    expect(getGrassSurfaceBendOffset(start, settings.surface.bend)).toBe(0);
    expect(getGrassSurfaceBendOffset(1, settings.surface.bend)).toBeCloseTo(
      -settings.surface.bend.depth,
      8,
    );
    expect(
      getGrassSurfaceBendOffset(profileSample, {
        ...settings.surface.bend,
        roundness: 0,
      }),
    ).not.toBeCloseTo(
      getGrassSurfaceBendOffset(profileSample, {
        ...settings.surface.bend,
        roundness: 1,
      }),
      4,
    );
    expect(
      getGrassSurfaceBendOffset(profileSample, {
        ...settings.surface.bend,
        smoothness: 0,
      }),
    ).not.toBeCloseTo(
      getGrassSurfaceBendOffset(profileSample, {
        ...settings.surface.bend,
        smoothness: 1,
      }),
      4,
    );
    expect(
      getGrassSurfaceBendOffset(1, {
        ...settings.surface.bend,
        enabled: false,
      }),
    ).toBe(0);
  });

  it("derives the exact bend-free placement perimeter", () => {
    const settings = settingsWith();
    const fieldShape = getGrassFieldShapeSettings(settings);
    const placementShape = getGrassSurfacePlacementShapeSettings(settings);
    const scale = 1 - settings.surface.bend.width;
    expect(placementShape).toEqual({
      ...fieldShape,
      depth: fieldShape.depth * scale,
      width: fieldShape.width * scale,
    });
    expect(
      getGrassSurfacePlacementShapeSettings(
        settingsWith({ "surface.bendEnabled": false }),
      ),
    ).toEqual(fieldShape);
    expect(isGrassSurfaceBendPoint(0, 0, settings)).toBe(false);
    const edgeX = fieldShape.width * 0.5 * 0.99;
    expect(isGrassSurfaceBendPoint(edgeX, 0, settings)).toBe(true);
  });

  it("deforms only the outer Terrain band and keeps normals finite", () => {
    const settings = settingsWith({
      "field.edgeIrregularity": 0,
      "field.shapeRoundness": 100,
      "surface.bendDepth": 1.25,
      "surface.bendWidth": 30,
      "terrain.maxHeight": 0,
    });
    const flat = settingsWith({
      "field.edgeIrregularity": 0,
      "field.shapeRoundness": 100,
      "surface.bendEnabled": false,
      "terrain.maxHeight": 0,
    });
    const bentGeometry = createGrassGroundGeometry(settings);
    const flatGeometry = createGrassGroundGeometry(flat);
    const bentPositions = bentGeometry.getAttribute("position") as THREE.BufferAttribute;
    const flatPositions = flatGeometry.getAttribute("position") as THREE.BufferAttribute;
    const normals = bentGeometry.getAttribute("normal") as THREE.BufferAttribute;
    const shape = getGrassFieldShapeSettings(settings);
    let centerDifference = Number.POSITIVE_INFINITY;
    let edgeDifference = 0;
    for (let index = 0; index < bentPositions.count; index += 1) {
      const x = bentPositions.getX(index);
      const z = bentPositions.getZ(index);
      const distance = getGrassFieldRelativeDistance(x, z, shape);
      const difference = bentPositions.getY(index) - flatPositions.getY(index);
      if (distance < 0.02) centerDifference = difference;
      if (distance > 0.999) edgeDifference = Math.min(edgeDifference, difference);
      expect(Number.isFinite(normals.getX(index))).toBe(true);
      expect(Number.isFinite(normals.getY(index))).toBe(true);
      expect(Number.isFinite(normals.getZ(index))).toBe(true);
    }
    expect(centerDifference).toBeCloseTo(0, 8);
    expect(edgeDifference).toBeCloseTo(-1.25, 5);
    bentGeometry.dispose();
    flatGeometry.dispose();
  });

  it("keeps every generated root and scan footprint off the bend", () => {
    const settings = settingsWith({
      "field.densityMax": 240,
      "lawn.densityMax": 320,
      "scan.boulder.enabled": true,
      "scan.rocks.count": 20,
      "scan.tufted.count": 20,
      "scan.white.count": 20,
      "scan.wild.count": 20,
      "scan.yellow.count": 20,
      "surface.bendWidth": 40,
    });
    const placementShape = getGrassSurfacePlacementShapeSettings(settings);

    for (const layer of ["tall", "lawn"] as const) {
      const layout = createGrassLayout(settings, layer);
      for (let index = 0; index < layout.count; index += 1) {
        expect(
          isGrassFieldPointInside(
            layout.offsets[index * 3]!,
            layout.offsets[index * 3 + 2]!,
            placementShape,
          ),
        ).toBe(true);
      }
    }

    for (const kind of grassScanLayerKinds) {
      const layout = createGrassScanLayout(kind, settings);
      const contract = grassScanLayerContracts[kind];
      for (let index = 0; index < layout.count; index += 1) {
        expect(
          isGrassFieldFootprintInside(
            layout.offsets[index * 3]!,
            layout.offsets[index * 3 + 2]!,
            layout.scales[index]! * contract.baseSize * 0.5,
            placementShape,
          ),
        ).toBe(true);
      }
    }

    const boulder = createGrassBoulderLayout(settings);
    expect(boulder.count).toBe(1);
    expect(
      isGrassFieldFootprintInside(
        boulder.offset[0],
        boulder.offset[2],
        boulder.scale * 0.5,
        placementShape,
      ),
    ).toBe(true);
  });
});
