import { describe, expect, it } from "vitest";

import { appAcceptance } from "./app-acceptance-data";
import { appComposition } from "./app-composition";
import { appSchema } from "./app-schema";
import { HERO_PREVIEW_SCENE_BOUNDS } from "./hero-preview-protocol";

function runtimeAcceptance(id: string) {
  const acceptance = appAcceptance.find((entry) => entry.id === id);
  if (!acceptance) {
    throw new Error(`Missing runtime acceptance ${id}.`);
  }
  return acceptance;
}

describe("Hero Scene Lab runtime contracts", () => {
  const infinityAcceptance = runtimeAcceptance("canvas.infinity");
  const persistenceAcceptance = runtimeAcceptance("persistence.reload");

  it(infinityAcceptance.automatedTestName, () => {
    expect(appSchema.canvas.sizing).toEqual({ mode: "editable-output" });
    expect(appComposition.sceneBoundsProvider).toBeDefined();
    expect(HERO_PREVIEW_SCENE_BOUNDS).toEqual({
      height: 1080,
      width: 1920,
      x: 0,
      y: 0,
    });
  });

  it(persistenceAcceptance.automatedTestName, () => {
    expect(appSchema.persistence.storage).toBe("localStorage");
    if (appSchema.persistence.storage !== "localStorage") {
      throw new Error("Hero Scene Lab must persist its workspace.");
    }
    expect(persistenceAcceptance).toMatchObject({
      persistenceCoverage: "reload",
      persistenceSlices: appSchema.persistence.include,
    });
    expect(appSchema.persistence.include).toEqual(
      expect.arrayContaining(["canvas", "panels", "values"]),
    );
  });
});
