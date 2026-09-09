import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  appAcceptance,
  validateProductAcceptanceCoverage,
} from "../app-acceptance";
import {
  DONUT_AUTOMATED_ACCEPTANCE_TEST,
  appTransferMode,
} from "../app-acceptance-data";
import { appPerformance } from "../app-performance";
import { appSchema } from "../app-schema";
import { DONUT_GEOMETRY } from "./donut-reference";

describe("Donut Studio product contract", () => {
  it(DONUT_AUTOMATED_ACCEPTANCE_TEST, () => {
    expect(validateProductAcceptanceCoverage()).toEqual([]);
    expect(appSchema.panels.timeline).toBeUndefined();
    expect(appSchema.panels.layers).toBeUndefined();
    expect(appSchema.canvas.upload).toBe(false);
    expect(appAcceptance.length).toBeGreaterThanOrEqual(24);
    expect(
      new Set(appAcceptance.map((entry) => entry.id)).size,
    ).toBe(appAcceptance.length);
    expect(appPerformance.workloadEnvelope.dimensions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "sprinkle-flow",
          interactiveMax: 2,
        }),
        expect.objectContaining({
          batchMax: 8192,
          id: "image-long-edge",
        }),
      ]),
    );
    expect(DONUT_GEOMETRY.sprinkleMaxCount).toBe(900);

    const reference = JSON.parse(
      readFileSync("public/donut-studio/reference-manifest.json", "utf8"),
    ) as {
      geometryNodes: { groups: Record<string, { nodeCount: number }> };
      meshes: readonly { name: string; polygons: number }[];
      source: { byteLength: number; fileName: string };
    };
    expect(reference.source).toMatchObject({
      byteLength: 4_342_411,
      fileName: "Donut Simulation Blender Geometry Nodes.blend",
    });
    expect(reference.meshes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Base", polygons: 21_504 }),
        expect.objectContaining({ name: "Plate", polygons: 3_840 }),
      ]),
    );
    expect(reference.geometryNodes.groups["Main group"]?.nodeCount).toBe(314);
    expect(appTransferMode).toMatchObject({
      mode: "reference-runtime-clone",
      referenceTimeline: { mode: "none" },
    });
  });
});
