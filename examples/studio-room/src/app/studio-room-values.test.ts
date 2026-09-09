import { describe, expect, it } from "vitest";

import {
  createStudioRoomSettingsFromValues,
  STUDIO_ROOM_DEFAULTS,
  studioRoomTargets,
} from "./studio-room-values";

describe("Studio Room values", () => {
  it("returns the website defaults when values are absent", () => {
    expect(createStudioRoomSettingsFromValues({}, 1080)).toEqual(STUDIO_ROOM_DEFAULTS);
    expect(STUDIO_ROOM_DEFAULTS.room.wallBorder).toEqual({
      colorOpacity: { hex: "#6F7946", opacity: 34 },
      width: 1.3,
    });
    expect(STUDIO_ROOM_DEFAULTS.room.wallFill).toBe("#F0F4E2");
    expect(STUDIO_ROOM_DEFAULTS.room.innerGrid).toEqual({
      depth: 22,
      enabled: false,
      falloff: 1.6,
      opacity: 40,
    });
  });

  it("clamps representative values from every group", () => {
    const settings = createStudioRoomSettingsFromValues(
      {
        [studioRoomTargets.compositionButtonGap]: 999,
        [studioRoomTargets.compositionFirstRowScale]: 1,
        [studioRoomTargets.compositionLineGap]: -999,
        [studioRoomTargets.compositionSecondRowScale]: 999,
        [studioRoomTargets.roomDepth]: 9,
        [studioRoomTargets.roomInnerGridDepth]: 99,
        [studioRoomTargets.roomInnerGridEnabled]: true,
        [studioRoomTargets.roomInnerGridFalloff]: 0,
        [studioRoomTargets.roomInnerGridOpacity]: -1,
        [studioRoomTargets.roomWallBorderWidth]: 20,
        [studioRoomTargets.roomVanishing]: { x: -9, y: 9 },
        [studioRoomTargets.gridColumns]: 40,
        [studioRoomTargets.gridThickness]: 0,
        [studioRoomTargets.fineGridSubdivision]: 12,
        [studioRoomTargets.fineGridOpacity]: -2,
        [studioRoomTargets.tilesPerSurface]: 9,
        [studioRoomTargets.tilesInterval]: 0,
        [studioRoomTargets.motionParallax]: 999,
        [studioRoomTargets.motionSmoothness]: -1,
        [studioRoomTargets.trailAmount]: 8,
        [studioRoomTargets.trailFade]: 8,
      },
      20_000,
    );
    expect(settings.composition).toEqual({
      buttonGap: 160,
      firstRowScale: 50,
      lineGap: -40,
      secondRowScale: 150,
    });
    expect(settings.room).toMatchObject({
      depth: 1,
      innerGrid: { depth: 60, enabled: true, falloff: 0.5, opacity: 0 },
      vanishing: { x: -1, y: 1 },
      wallBorder: { width: 12 },
    });
    expect(settings.grid).toMatchObject({ columns: 16, thickness: 0.5 });
    expect(settings.fineGrid).toMatchObject({ opacity: 0, subdivision: 6 });
    expect(settings.tiles).toMatchObject({ interval: 0.4, perSurface: 6 });
    expect(settings.motion).toMatchObject({ parallax: 150, smoothness: 0 });
    expect(settings.trail).toMatchObject({ amount: 3, fade: 2 });
    expect(settings.height).toBe(8192);
  });

  it("normalizes valid border color opacity and falls back from invalid color data", () => {
    const normalized = createStudioRoomSettingsFromValues(
      {
        [studioRoomTargets.roomWallBorderColorOpacity]: { hex: "#aBc123", opacity: 140 },
        [studioRoomTargets.roomWallBorderWidth]: -4,
      },
      1080,
    );
    expect(normalized.room.wallBorder).toEqual({
      colorOpacity: { hex: "#ABC123", opacity: 100 },
      width: 0,
    });

    const invalid = createStudioRoomSettingsFromValues(
      {
        [studioRoomTargets.roomWallBorderColorOpacity]: { hex: "#bad", opacity: "opaque" },
      },
      1080,
    );
    expect(invalid.room.wallBorder.colorOpacity).toEqual({ hex: "#6F7946", opacity: 34 });
  });

  it("normalizes the inner wall fill and falls back from invalid colors", () => {
    expect(
      createStudioRoomSettingsFromValues({
        [studioRoomTargets.roomWallFill]: "#123abc",
      }, 1080).room.wallFill,
    ).toBe("#123ABC");
    expect(
      createStudioRoomSettingsFromValues({
        [studioRoomTargets.roomWallFill]: "transparent",
      }, 1080).room.wallFill,
    ).toBe("#F0F4E2");
  });

  it("falls back from invalid inner-grid values using the nested defaults", () => {
    expect(
      createStudioRoomSettingsFromValues({
        [studioRoomTargets.roomInnerGridDepth]: Number.NaN,
        [studioRoomTargets.roomInnerGridEnabled]: "true",
        [studioRoomTargets.roomInnerGridFalloff]: null,
        [studioRoomTargets.roomInnerGridOpacity]: undefined,
      }, 1080).room.innerGrid,
    ).toEqual(STUDIO_ROOM_DEFAULTS.room.innerGrid);
  });
});
