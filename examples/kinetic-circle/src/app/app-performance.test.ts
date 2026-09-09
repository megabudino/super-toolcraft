import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { validateToolcraftPerformanceCoverage } from "@/toolcraft/runtime";

import { appPerformance } from "./app-performance";
import { appSchema } from "./app-schema";

describe("Kinetic Circle performance coverage", () => {
  it("requires valid performance coverage for declared workload scenarios", () => {
    expect(validateToolcraftPerformanceCoverage(appSchema, appPerformance)).toEqual([]);
  });

  it("declares agent browser as preferred and Playwright as fallback", () => {
    expect(appPerformance.browserCheckPolicy).toEqual({
      fallbackRunner: "playwright",
      fallbackWhen: ["agent-browser-unavailable", "ci"],
      preferredRunner: "agent-browser",
    });
  });

  it("uses a GPU pixel-output renderer with typed layer and pipeline inventories", () => {
    expect(appPerformance).toMatchObject({
      rendererStrategy: "webgl",
      rendererWorkload: "pixel-output",
      usesCustomRenderer: true,
    });
    expect(appPerformance.rendererTechnique?.layers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "kinetic-mosaic-field",
          primitiveCount: "high",
          renderer: "webgl",
        }),
      ]),
    );
    expect(appPerformance.rendererPipeline?.passes.map((pass) => pass.id)).toEqual([
      "geometry-build",
      "shader-program",
      "gpu-preview",
      "export-frame",
    ]);
  });

  it("covers every visible product control exactly through a performance target", () => {
    const actionTargets = new Set(["panel.exports"]);
    const visibleTargets =
      appSchema.panels.controls?.sections.flatMap((section) =>
        Object.values(section.controls)
          .map((control) => control.target)
          .filter(
            (target) =>
              !target.startsWith("runtime.") &&
              !target.startsWith("canvas.") &&
              !target.startsWith("panels.") &&
              !actionTargets.has(target),
          ),
      ) ?? [];
    const scenarioTargets = new Set(appPerformance.scenarios.map((scenario) => scenario.target));

    for (const target of visibleTargets) {
      expect(scenarioTargets.has(target), `${target} should have a performance scenario`).toBe(true);
    }
  });

  it("guarantees the exposed hard limits without a reduced smooth range", () => {
    for (const scenario of appPerformance.scenarios) {
      for (const fixture of [scenario.stressFixture, scenario.workloadFixture]) {
        if (!fixture?.loadProfile) continue;
        expect(fixture.loadProfile.smoothTargetRatio).toBe(1);
        expect(fixture.loadProfile.smoothTarget).toEqual(fixture.loadProfile.hardLimit);
        expect(fixture.loadProfile.userFacingRange).toBe("fully-guaranteed");
      }
    }
  });

  it("keeps WebGL lifecycle and scheduled-frame cleanup outside React render", () => {
    const renderer = readFileSync(
      resolve("src/app/kinetic-mosaic-renderer.tsx"),
      "utf8",
    );

    expect(renderer).toContain("createMosaicGlRenderer");
    expect(renderer).toContain("gl.bufferData");
    expect(renderer).toContain("window.requestAnimationFrame");
    expect(renderer).toContain("window.cancelAnimationFrame");
    expect(renderer).toContain("renderer.dispose()");
  });
});
