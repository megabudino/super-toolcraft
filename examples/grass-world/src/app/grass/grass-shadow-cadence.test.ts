import { describe, expect, it } from "vitest";

import { GrassShadowCadence } from "./grass-shadow-cadence";

describe("GrassShadowCadence", () => {
  it("refreshes static edits immediately and caps live deformation shadows", () => {
    const cadence = new GrassShadowCadence();
    expect(
      cadence.shouldUpdate({
        deformationKey: "frame-0",
        now: 0,
        purpose: "interactive-preview",
        staticKey: "settings-a",
      }),
    ).toBe(true);
    expect(
      cadence.shouldUpdate({
        deformationKey: "frame-1",
        now: 20,
        purpose: "interactive-preview",
        staticKey: "settings-a",
      }),
    ).toBe(false);
    expect(
      cadence.shouldUpdate({
        deformationKey: "frame-2",
        now: 50,
        purpose: "interactive-preview",
        staticKey: "settings-a",
      }),
    ).toBe(true);
    expect(
      cadence.shouldUpdate({
        deformationKey: "frame-2",
        now: 51,
        purpose: "interactive-preview",
        staticKey: "settings-b",
      }),
    ).toBe(true);
  });

  it("always refreshes export shadows", () => {
    const cadence = new GrassShadowCadence();
    for (const now of [0, 1, 2]) {
      expect(
        cadence.shouldUpdate({
          deformationKey: "same",
          now,
          purpose: "export",
          staticKey: "same",
        }),
      ).toBe(true);
    }
  });
});
