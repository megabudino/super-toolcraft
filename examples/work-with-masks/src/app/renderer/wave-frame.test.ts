import { describe, expect, it } from "vitest";

import { getWaveFrame } from "./wave-frame";

describe("getWaveFrame", () => {
  it("centers the default rectangle in the product scene", () => {
    expect(
      getWaveFrame(
        { height: 1200, width: 2400, x: 0, y: 0 },
        { height: 1080, position: { x: 0, y: 0 }, width: 1920 },
      ),
    ).toEqual({ height: 1080, width: 1920, x: 240, y: 60 });
  });

  it("applies pixel center offsets without changing size", () => {
    expect(
      getWaveFrame(
        { height: 1200, width: 2400, x: 0, y: 0 },
        { height: 900, position: { x: 120, y: -56 }, width: 1600 },
      ),
    ).toEqual({ height: 900, width: 1600, x: 520, y: 94 });
  });

  it("preserves a non-zero scene origin", () => {
    expect(
      getWaveFrame(
        { height: 1200, width: 2400, x: -1200, y: -600 },
        { height: 1080, position: { x: 0, y: 0 }, width: 1920 },
      ),
    ).toEqual({ height: 1080, width: 1920, x: -960, y: -540 });
  });
});
