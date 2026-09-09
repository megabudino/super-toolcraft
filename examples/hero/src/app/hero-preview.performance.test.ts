import { describe, expect, it } from "vitest";

import { appPerformance } from "./app-performance";
import { heroPreviewPipelineRegistration } from "./hero-preview-pipeline";

describe("external hero preview performance model", () => {
  for (const scenario of appPerformance.scenarios) {
    it(scenario.automatedTestName, () => {
      const invalidation = heroPreviewPipelineRegistration.interactionInvalidation.find(
        (entry) => entry.interaction === scenario.interaction,
      );

      expect(invalidation).toBeDefined();
      expect([...scenario.coversTargets].sort()).toEqual(
        [...(invalidation?.targets ?? [])].sort(),
      );
      expect(scenario.pathId).toMatch(/^performance-path:/);

      if (
        scenario.interaction === "viewport-drag" ||
        scenario.interaction === "viewport-zoom"
      ) {
        expect(invalidation?.invalidates).toEqual([]);
        expect(invalidation?.mustNotInvalidate).toContain("preview-sync");
      } else {
        expect(invalidation?.invalidates).toContain("preview-sync");
      }
    });
  }
});
