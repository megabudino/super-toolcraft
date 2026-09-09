import { describe, expect, it } from "vitest";

import {
  applyHeroGalleryPanDrag,
  getHeroGalleryPanelPeriod,
  readHeroGalleryPanDragInputs,
  wrapHeroGalleryPanUnit,
} from "./hero-gallery-pan";

describe("hero gallery panel pan", () => {
  it("wraps both axes into the canonical unit interval", () => {
    expect(wrapHeroGalleryPanUnit(1)).toBe(-1);
    expect(wrapHeroGalleryPanUnit(-1.25)).toBe(0.75);
    expect(wrapHeroGalleryPanUnit(0.5)).toBe(0.5);
  });

  it("uses the shared guarded vertical panel period", () => {
    expect(
      getHeroGalleryPanelPeriod({
        cardHeight: 340,
        rowCount: 3,
        rowGap: 17,
      }),
    ).toBe(1071);
    expect(
      getHeroGalleryPanelPeriod({
        cardHeight: 340,
        rowCount: 3,
        rowGap: -300,
      }),
    ).toBe(510);
  });

  it("sphere.pan.handle converts pointer deltas into wrapped pan values", () => {
    const sphereWidth = 900;
    const panelPeriod = 1071;

    expect(
      applyHeroGalleryPanDrag({
        deltaPx: { x: Math.PI * sphereWidth, y: panelPeriod / 4 },
        panelPeriod,
        sphereWidth,
        start: { x: 0, y: 0 },
      }),
    ).toEqual({ x: -1, y: 0.5 });
    expect(
      applyHeroGalleryPanDrag({
        deltaPx: { x: -Math.PI * sphereWidth / 2, y: -panelPeriod / 4 },
        panelPeriod,
        sphereWidth,
        start: { x: 0, y: 0 },
      }),
    ).toEqual({ x: -0.5, y: -0.5 });
  });

  it("reads bounded geometry inputs from canonical values", () => {
    expect(
      readHeroGalleryPanDragInputs({
        "cards.height": 5000,
        "gallery.type": "rows",
        "sphere.rowGap": -500,
        "sphere.rows": [{ offset: 0, speed: 3 }, { offset: 0, speed: 3 }],
        "sphere.width": 100,
      }),
    ).toEqual({ panelPeriod: 1760, sphereWidth: 200, type: "rows" });
  });
});
