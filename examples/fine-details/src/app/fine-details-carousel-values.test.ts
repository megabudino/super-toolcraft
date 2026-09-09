import { describe, expect, it } from "vitest";

import {
  createFineDetailsCarouselFromValues,
  createFineDetailsImagesModeFromValues,
  FINE_DETAILS_CAROUSEL_DEFAULTS,
  FINE_DETAILS_IMAGES_MODE_DEFAULT,
  fineDetailsCarouselTargets,
  normalizeFineDetailsImagesMode,
} from "./fine-details-carousel-values";

describe("Fine Details carousel values", () => {
  it("uses the authored trail mode and carousel defaults", () => {
    expect(createFineDetailsImagesModeFromValues({})).toBe(
      FINE_DETAILS_IMAGES_MODE_DEFAULT,
    );
    expect(createFineDetailsCarouselFromValues({})).toEqual(
      FINE_DETAILS_CAROUSEL_DEFAULTS,
    );
  });

  it("accepts the strict trail, loading, and carousel image-mode union", () => {
    expect(normalizeFineDetailsImagesMode("trail")).toBe("trail");
    expect(normalizeFineDetailsImagesMode("loading")).toBe("loading");
    expect(normalizeFineDetailsImagesMode("carousel")).toBe("carousel");

    for (const invalidMode of [null, undefined, "Carousel", "grid", "pending"]) {
      expect(normalizeFineDetailsImagesMode(invalidMode)).toBe("trail");
      expect(
        createFineDetailsImagesModeFromValues({
          [fineDetailsCarouselTargets.imagesMode]: invalidMode,
        }),
      ).toBe("trail");
    }

    expect(
      createFineDetailsImagesModeFromValues({
        [fineDetailsCarouselTargets.imagesMode]: "loading",
      }),
    ).toBe("loading");
  });

  it("clamps geometry and rounds the image count", () => {
    expect(
      createFineDetailsCarouselFromValues({
        [fineDetailsCarouselTargets.count]: 2.6,
        [fineDetailsCarouselTargets.gap]: 999,
        [fineDetailsCarouselTargets.radius]: -4,
        [fineDetailsCarouselTargets.speed]: 5,
        [fineDetailsCarouselTargets.textGap]: 999,
      }),
    ).toMatchObject({ count: 3, gap: 120, radius: 0, speed: 10, textGap: 200 });
  });

  it("normalizes shared border and shadow values while preserving disabled settings", () => {
    expect(
      createFineDetailsCarouselFromValues({
        [fineDetailsCarouselTargets.borderColorOpacity]: {
          hex: "#aabbcc",
          opacity: 150,
        },
        [fineDetailsCarouselTargets.borderEnabled]: false,
        [fineDetailsCarouselTargets.borderWidth]: 40,
        [fineDetailsCarouselTargets.shadowBlur]: 200,
        [fineDetailsCarouselTargets.shadowColorOpacity]: {
          hex: "#1234ab",
          opacity: -5,
        },
        [fineDetailsCarouselTargets.shadowEnabled]: false,
        [fineDetailsCarouselTargets.shadowOffset]: { x: -2, y: 2 },
        [fineDetailsCarouselTargets.shadowSpread]: -80,
      }),
    ).toMatchObject({
      border: {
        colorOpacity: { hex: "#AABBCC", opacity: 100 },
        enabled: false,
        width: 20,
      },
      shadow: {
        blur: 100,
        colorOpacity: { hex: "#1234AB", opacity: 0 },
        enabled: false,
        offset: { x: -1, y: 1 },
        spread: -32,
      },
    });
  });

  it("falls back field-by-field for invalid colors, opacity and vectors", () => {
    expect(
      createFineDetailsCarouselFromValues({
        [fineDetailsCarouselTargets.borderColorOpacity]: {
          hex: "white",
          opacity: Number.NaN,
        },
        [fineDetailsCarouselTargets.shadowColorOpacity]: null,
        [fineDetailsCarouselTargets.shadowOffset]: { x: "left", y: 0.5 },
      }),
    ).toMatchObject({
      border: {
        colorOpacity: { hex: "#FFFFFF", opacity: 100 },
      },
      shadow: {
        colorOpacity: { hex: "#000000", opacity: 35 },
        offset: { x: 0, y: 0.5 },
      },
    });
  });
});
