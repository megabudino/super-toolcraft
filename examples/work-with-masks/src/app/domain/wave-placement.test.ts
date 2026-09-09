import { describe, expect, it } from "vitest";

import {
  readWavePlacement,
  wavePlacementDefaults,
  wavePlacementPositionScale,
} from "./wave-placement";

describe("wave placement", () => {
  it("defaults to the approved 2826 by 1080 offset rectangle", () => {
    expect(wavePlacementDefaults).toEqual({
      height: 1080,
      position: { x: -0.14, y: 0 },
      width: 2826,
    });
  });

  it("converts the default normalized offset to CSS pixels for empty values", () => {
    expect(readWavePlacement({})).toEqual({
      height: 1080,
      position: { x: -336, y: 0 },
      width: 2826,
    });
    expect(readWavePlacement({ "wave.frame.position": null }).position).toEqual({ x: -336, y: 0 });
  });

  it("maps normalized pad coordinates to CSS pixels and falls back for invalid values", () => {
    expect(
      readWavePlacement({
        "wave.frame.height": Number.NaN,
        "wave.frame.position": { x: "0.25", y: -0.5 },
        "wave.frame.width": 1600,
      }),
    ).toEqual({
      height: 1080,
      position: {
        x: wavePlacementPositionScale * 0.25,
        y: wavePlacementPositionScale * -0.5,
      },
      width: 1600,
    });
  });

  it("clamps imported dimensions and normalized pad coordinates", () => {
    expect(
      readWavePlacement({
        "wave.frame.height": 50_000,
        "wave.frame.position": { x: -50, y: 50 },
        "wave.frame.width": -12,
      }),
    ).toEqual({
      height: 2160,
      position: {
        x: -wavePlacementPositionScale,
        y: wavePlacementPositionScale,
      },
      width: 320,
    });
  });
});
