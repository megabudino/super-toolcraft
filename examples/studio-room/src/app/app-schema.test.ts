import { describe, expect, it } from "vitest";

import { validateProductAcceptanceCoverage } from "./app-acceptance";
import {
  appAcceptance,
  appControlSectionInventory,
  appProductReadiness,
} from "./app-acceptance-data";
import { appPerformance } from "./app-performance";
import { appSchema } from "./app-schema";

describe("Recraft Studio Room schema", () => {
  it("publishes the expected standalone workspace", () => {
    expect(appSchema.identity).toEqual({ id: "studio-room", title: "Recraft Studio Room" });
    expect(appSchema.canvas).toMatchObject({
      draggable: true,
      enabled: true,
      size: { height: 1080, unit: "px", width: 1920 },
      sizing: { mode: "editable-output" },
      upload: false,
    });
    expect(appSchema.panels.controls?.title).toBe("Controls");
    expect(appSchema.panels.layers).toBeUndefined();
    expect(appSchema.panels.timeline).toBeUndefined();
  });

  it("declares production reload coverage for the Studio Room bridge", () => {
    expect(appSchema.persistence.storage).toBe("localStorage");
    expect(appAcceptance.find((entry) => entry.id === "persistence.reload")).toMatchObject({
      persistenceCoverage: "reload",
      persistenceSlices:
        appSchema.persistence.storage === "localStorage" ? appSchema.persistence.include : [],
    });
  });

  it("declares the controlled DOM preview inventory and bounded workload", () => {
    expect(appProductReadiness).toMatchObject({
      mode: "product",
      productName: "Recraft Studio Room",
      viewInteraction: { mode: "fixed-camera", source: "inspected-reference" },
    });
    if (appProductReadiness.mode !== "product") throw new Error("Expected product readiness.");
    expect(appProductReadiness.interactionOwnership).toHaveLength(10);
    expect(appControlSectionInventory.map((entry) => entry.title)).toEqual([
      "Center Composition",
      "Room",
      "Inner Grid",
      "Main Grid",
      "Fine Grid",
      "Tiles",
      "Tile Images",
      "Motion",
      "Depth Trail",
    ]);
    expect(appPerformance.rendererStrategy).toBe("dom");
    expect(appPerformance.workloadEnvelope.dimensions.map((dimension) => dimension.id)).toEqual([
      "grid-columns",
      "grid-rows",
      "grid-depth-divisions",
      "fine-grid-subdivision",
      "tiles-per-surface",
      "trail-line-amount",
      "tile-image-count",
    ]);
    expect(appPerformance.rendererTechnique?.exportRenderer).toBe("none");
    expect(validateProductAcceptanceCoverage()).toEqual([]);
  });
});
