import { describe, expect, it } from "vitest";

import {
  FINE_DETAILS_PREVIEW_IMAGE_CARD_AXIS_PX,
  FINE_DETAILS_PREVIEW_IMAGE_LONG_AXIS_PX,
  getFineDetailsPreviewImageDimensions,
} from "./fine-details-preview-image-derivative";

describe("Fine Details preview image derivative dimensions", () => {
  it.each([
    { height: 800, rotationDeg: 0, width: 1200 },
    { height: 533, rotationDeg: 90, width: 800 },
    { height: 800, rotationDeg: 180, width: 1200 },
    { height: 533, rotationDeg: 270, width: 800 },
  ] as const)(
    "keeps the existing card-axis scale for an ordinary photo at $rotationDeg°",
    ({ height, rotationDeg, width }) => {
      expect(
        getFineDetailsPreviewImageDimensions({
          height: 1600,
          rotationDeg,
          width: 2400,
        }),
      ).toEqual({ height, resized: true, width });
    },
  );

  it.each([
    { height: 400, rotationDeg: 0, width: 1600 },
    { height: 200, rotationDeg: 90, width: 800 },
    { height: 400, rotationDeg: 180, width: 1600 },
    { height: 200, rotationDeg: 270, width: 800 },
  ] as const)(
    "caps a horizontal panorama safely at $rotationDeg°",
    ({ height, rotationDeg, width }) => {
      expect(
        getFineDetailsPreviewImageDimensions({
          height: 2000,
          rotationDeg,
          width: 8000,
        }),
      ).toEqual({ height, resized: true, width });
    },
  );

  it.each([
    { height: 800, rotationDeg: 0, width: 200 },
    { height: 1600, rotationDeg: 90, width: 400 },
    { height: 800, rotationDeg: 180, width: 200 },
    { height: 1600, rotationDeg: 270, width: 400 },
  ] as const)(
    "caps a vertical panorama safely at $rotationDeg°",
    ({ height, rotationDeg, width }) => {
      const dimensions = getFineDetailsPreviewImageDimensions({
        height: 8000,
        rotationDeg,
        width: 2000,
      });

      expect(dimensions).toEqual({ height, resized: true, width });
      expect(Math.max(dimensions.width, dimensions.height)).toBeLessThanOrEqual(
        FINE_DETAILS_PREVIEW_IMAGE_LONG_AXIS_PX,
      );
    },
  );

  it("keeps both output axes inside their applicable bounds", () => {
    const dimensions = getFineDetailsPreviewImageDimensions({
      height: 2000,
      rotationDeg: 90,
      width: 8000,
    });

    expect(dimensions.width).toBe(FINE_DETAILS_PREVIEW_IMAGE_CARD_AXIS_PX);
    expect(Math.max(dimensions.width, dimensions.height)).toBeLessThanOrEqual(
      FINE_DETAILS_PREVIEW_IMAGE_LONG_AXIS_PX,
    );
  });

  it("does not upscale already bounded images", () => {
    expect(
      getFineDetailsPreviewImageDimensions({
        height: 600,
        rotationDeg: 180,
        width: 400,
      }),
    ).toEqual({ height: 600, resized: false, width: 400 });
  });

  it("sanitizes non-positive source dimensions without marking them resized", () => {
    expect(
      getFineDetailsPreviewImageDimensions({
        height: -100,
        rotationDeg: 270,
        width: 0,
      }),
    ).toEqual({ height: 1, resized: false, width: 1 });
  });
});
