import { describe, expect, it } from "vitest";

import {
  appAcceptance,
  validateProductAcceptanceCoverage,
} from "./app-acceptance";
import { appPerformance } from "./app-performance";
import { appSchema } from "./app-schema";

describe("Recraft Fine Details schema", () => {
  it("publishes an editable website-section workspace", () => {
    expect(appSchema.identity.title).toBe("Fine Details");
    expect(appSchema.canvas).toMatchObject({
      draggable: true,
      enabled: true,
      size: { height: 1080, unit: "px", width: 1920 },
      sizing: { mode: "editable-output" },
      upload: false,
    });
    expect(appSchema.panels.controls?.sections).toHaveLength(3);
    expect(appSchema.panels.controls?.sections[0]?.title).toBe("Setup");
    expect(
      appSchema.panels.controls?.sections[0]?.controls.canvasHeight,
    ).toMatchObject({ target: "canvas.size.height", type: "text" });
    expect(appSchema.panels.controls?.sections[1]?.title).toBe("Background");
    expect(appSchema.panels.layers).toBeUndefined();
    expect(appSchema.panels.timeline).toBeUndefined();
  });

  it("declares a live DOM bridge without workload dimensions", () => {
    expect(appPerformance.rendererStrategy).toBe("dom");
    expect(appPerformance.usesCustomRenderer).toBe(true);
    expect(appPerformance.workloadEnvelope).toEqual({ dimensions: [] });
  });

  it("declares production reload coverage for the Fine Details bridge", () => {
    expect(appSchema.persistence.storage).toBe("localStorage");
    if (appSchema.persistence.storage !== "localStorage") {
      throw new Error("The Fine Details bridge must persist its workspace.");
    }

    expect(
      appAcceptance.find((entry) => entry.id === "persistence.reload"),
    ).toMatchObject({
      persistenceCoverage: "reload",
      persistenceSlices: appSchema.persistence.include,
    });
    expect(validateProductAcceptanceCoverage()).toEqual([]);
  });
});
