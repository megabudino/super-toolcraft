import {
  compileToolcraftPerformanceFixturePlan,
  deriveToolcraftPerformancePaths,
} from "@/toolcraft/runtime";
import { describe, expect, it } from "vitest";

import {
  appPerformance,
  logoSphereRenderPlanAssessment,
} from "./app-performance";
import { appSchema } from "./app-schema";

describe("logo sphere performance model", () => {
  it("models Grid plus the current 500-point limit as the maximum workload", () => {
    const paths = deriveToolcraftPerformancePaths(appSchema, appPerformance);
    const animationPath = paths.find(
      ({ interaction }) => interaction === "animation-frame",
    );

    expect(animationPath).toBeDefined();
    expect(animationPath?.workloadDimensions).toEqual([
      "distribution-complexity",
      "visible-logos",
    ]);

    const fixture = compileToolcraftPerformanceFixturePlan(
      appPerformance,
      animationPath!,
    );
    expect(fixture.development).toMatchObject({
      checkpoint: {
        kind: "development",
        values: {
          "distribution-complexity": 2,
        },
      },
      status: "available",
    });
    if (fixture.development.status !== "available") {
      throw new Error("Expected a reachable Grid development fixture.");
    }
    expect(
      fixture.development.checkpoint.values["visible-logos"],
    ).toBeCloseTo(325.2, 8);
    expect(fixture.maximum).toMatchObject({
      kind: "interactive-max",
      values: {
        "distribution-complexity": 2,
        "visible-logos": 500,
      },
    });
  });

  it("keeps the renderer plan structurally valid at the true maximum", () => {
    expect(logoSphereRenderPlanAssessment.errors).toEqual([]);
    expect(logoSphereRenderPlanAssessment.requiredBenchmarks).toEqual([
      expect.objectContaining({
        passId: "sphere-composite",
        workload: {
          "distribution-complexity": 2,
          "visible-logos": 500,
        },
      }),
    ]);
  });
});
