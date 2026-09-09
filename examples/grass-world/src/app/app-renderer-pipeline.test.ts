import { describe, expect, it } from "vitest";

import { grassRendererPipelineRegistration } from "./app-renderer-pipeline";

const countValue = (values: readonly string[], expected: string): number =>
  values.filter((value) => value === expected).length;

describe("grass renderer pipeline ownership", () => {
  it("keeps Tall distribution independent from ground geometry", () => {
    const distributionInteractions =
      grassRendererPipelineRegistration.interactionInvalidation.filter(
        ({ targets }) =>
          targets.includes("field.distributionScale") ||
          targets.includes("field.distributionOffset"),
      );

    expect(distributionInteractions).toHaveLength(2);
    for (const interaction of distributionInteractions) {
      expect(interaction.invalidates).toContain("grass-layout-build");
      expect(interaction.invalidates).toContain("grass-scene-render");
      expect(interaction.invalidates).not.toContain(
        "grass-ground-geometry-build",
      );
      expect(interaction.invalidates).not.toContain(
        "grass-lawn-layout-build",
      );
      expect(interaction.mustNotInvalidate).toContain(
        "grass-ground-geometry-build",
      );
    }
  });

  it("lists ground geometry exactly once in the scene-render dependencies", () => {
    const sceneRender = grassRendererPipelineRegistration.passes.find(
      ({ id }) => id === "grass-scene-render",
    );

    expect(
      countValue(sceneRender?.inputs ?? [], "grass-ground-geometry-build"),
    ).toBe(1);
    expect(
      countValue(
        sceneRender?.invalidatedBy ?? [],
        "grass-ground-geometry-build",
      ),
    ).toBe(1);
  });

  it("makes still export consume the deformed ground geometry", () => {
    const exportFrame = grassRendererPipelineRegistration.passes.find(
      ({ id }) => id === "grass-export-frame",
    );

    expect(
      countValue(exportFrame?.inputs ?? [], "grass-ground-geometry-build"),
    ).toBe(1);
    expect(
      countValue(
        exportFrame?.invalidatedBy ?? [],
        "grass-ground-geometry-build",
      ),
    ).toBe(1);
  });

  it("derives must-not-invalidate as the exact pass complement", () => {
    const allPassIds = grassRendererPipelineRegistration.passes.map(
      ({ id }) => id,
    );

    for (const interaction of grassRendererPipelineRegistration
      .interactionInvalidation) {
      const invalidated = new Set(interaction.invalidates);
      expect(interaction.mustNotInvalidate).toEqual(
        allPassIds.filter((passId) => !invalidated.has(passId)),
      );
    }
  });
});
