import { describe, expect, it } from "vitest";
import {
  assessToolcraftRenderPlan,
  compileToolcraftPerformanceFixturePlan,
  deriveToolcraftPerformancePaths,
  validateToolcraftPerformanceCoverage,
} from "@/toolcraft/runtime";

import { appPerformance } from "../app-performance";
import { appSchema } from "../app-schema";
import {
  donutPassIds,
  rendererPipelineRegistration,
} from "./donut-pipeline";

describe("donut renderer pipeline", () => {
  it("uses one assessed executable pipeline", () => {
    expect(appPerformance.rendererPipeline).toBe(rendererPipelineRegistration);
    expect(rendererPipelineRegistration.runtimeId).toBe(
      "donut-studio.renderer@11",
    );
    expect(assessToolcraftRenderPlan(appSchema, appPerformance)).toMatchObject({
      errors: [],
      requiredBenchmarks: [],
    });
  });

  it("retains source geometry across focused product changes", () => {
    const paths = deriveToolcraftPerformancePaths(appSchema, appPerformance);
    const sprinklePath = paths.find(
      (path) =>
        path.interaction === "control-drag" &&
        path.targets.includes("sprinkles.flow"),
    );
    const orbitPath = paths.find(
      (path) =>
        path.interaction === "control-drag" &&
        path.targets.includes("scene.orientation"),
    );
    const basePath = paths.find(
      (path) =>
        path.interaction === "control-drag" &&
        path.targets.includes("donut.majorRadius"),
    );
    const edibleMaterialPath = paths.find(
      (path) =>
        path.interaction === "control-drag" &&
        path.targets.includes("material.donut.pores"),
    );
    const hdriPath = paths.find(
      (path) =>
        path.interaction === "control-drag" &&
        path.targets.includes("studio.environmentBlur"),
    );
    const shadowPath = paths.find(
      (path) =>
        path.interaction === "control-drag" &&
        path.targets.includes("studio.shadowSoftness"),
    );
    const icingClearPath = paths.find(
      (path) =>
        path.interaction === "control-change" &&
        path.targets.includes("icing.clearMode"),
    );
    const presetLibraryPath = paths.find(
      (path) =>
        path.interaction === "control-change" &&
        path.targets.includes("donut.presetLibrary"),
    );

    expect(sprinklePath?.invalidates).toEqual([
      donutPassIds.previewRender,
      donutPassIds.sprinkleLayout,
    ]);
    expect(sprinklePath?.invalidates).not.toContain(
      donutPassIds.sceneBootstrap,
    );
    expect(orbitPath?.invalidates).toEqual([donutPassIds.previewRender]);
    expect(orbitPath?.invalidates).not.toContain(donutPassIds.icingGeometry);
    expect(basePath?.invalidates).toEqual([
      donutPassIds.baseGeometry,
      donutPassIds.icingGeometry,
      donutPassIds.previewRender,
      donutPassIds.sprinkleLayout,
    ]);
    expect(edibleMaterialPath?.invalidates).toEqual([
      donutPassIds.previewRender,
    ]);
    expect(hdriPath?.invalidates).toEqual([donutPassIds.previewRender]);
    expect(shadowPath?.invalidates).toEqual([donutPassIds.previewRender]);
    expect(icingClearPath?.invalidates).toEqual([
      donutPassIds.icingGeometry,
      donutPassIds.previewRender,
      donutPassIds.sprinkleLayout,
    ]);
    expect(presetLibraryPath?.invalidates).toEqual([]);
  });

  it("derives one scenario and exact fixtures for every path", () => {
    const paths = deriveToolcraftPerformancePaths(appSchema, appPerformance);
    expect(appPerformance.scenarios).toHaveLength(paths.length);
    expect(validateToolcraftPerformanceCoverage(appSchema, appPerformance)).toEqual(
      [],
    );
    for (const path of paths) {
      const plan = compileToolcraftPerformanceFixturePlan(appPerformance, path);
      expect(plan.pathId).toBe(path.id);
      expect(plan.maximum.normalizedPressure).toBe(1);
    }
  });
});
