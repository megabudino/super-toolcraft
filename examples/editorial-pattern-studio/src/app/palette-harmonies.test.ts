import { describe, expect, it } from "vitest";

import {
  contrastRatio,
  createAccessiblePosterPalette,
  createHarmoniousPalette,
  interpolateHexColor,
} from "./palette-harmonies";

const hexColor = /^#[0-9A-F]{6}$/;

function hslMetrics(hex: string): { lightness: number; saturation: number } {
  const [red, green, blue] = [1, 3, 5].map(
    (start) => Number.parseInt(hex.slice(start, start + 2), 16) / 255,
  );
  const max = Math.max(red ?? 0, green ?? 0, blue ?? 0);
  const min = Math.min(red ?? 0, green ?? 0, blue ?? 0);
  const delta = max - min;
  const lightness = (max + min) / 2;
  const saturation =
    delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  return { lightness: lightness * 100, saturation: saturation * 100 };
}

describe("accessible poster palettes", () => {
  it("is deterministic and advances to vivid backgrounds across ink polarities", () => {
    expect(createAccessiblePosterPalette(42)).toEqual(
      createAccessiblePosterPalette(42),
    );
    expect(createAccessiblePosterPalette(42)).not.toEqual(
      createAccessiblePosterPalette(43),
    );

    const backgrounds = Array.from({ length: 512 }, (_, seed) =>
      createAccessiblePosterPalette(seed).background,
    );
    const lightnessClasses = new Set(
      backgrounds.map((background) =>
        contrastRatio(background, "#000000") >
        contrastRatio(background, "#FFFFFF")
          ? "light"
          : "dark",
      ),
    );
    expect(lightnessClasses).toEqual(new Set(["light", "dark"]));
    expect(new Set(backgrounds).size).toBeGreaterThan(400);
    for (const background of backgrounds) {
      const { lightness, saturation } = hslMetrics(background);
      expect(saturation).toBeGreaterThanOrEqual(90);
      expect(lightness).toBeGreaterThanOrEqual(21.5);
      expect(lightness).toBeLessThanOrEqual(62.5);
      expect(
        Math.max(
          contrastRatio(background, "#000000"),
          contrastRatio(background, "#FFFFFF"),
        ),
      ).toBeGreaterThanOrEqual(7);
    }
  });

  it("guarantees readable text and visible, distinct line colors", () => {
    for (let seed = 0; seed < 256; seed += 1) {
      const palette = createAccessiblePosterPalette(seed);
      const colors = [
        palette.background,
        palette.headline,
        palette.detail,
        palette.rule,
        ...palette.lines,
      ];

      expect(colors.every((color) => hexColor.test(color))).toBe(true);
      expect(hslMetrics(palette.background).saturation).toBeGreaterThanOrEqual(90);
      expect(contrastRatio(palette.headline, palette.background)).toBeGreaterThanOrEqual(7);
      expect(contrastRatio(palette.detail, palette.background)).toBeGreaterThanOrEqual(7);
      expect(contrastRatio(palette.rule, palette.background)).toBeGreaterThanOrEqual(3);
      expect(new Set(palette.lines).size).toBe(3);
      for (const line of palette.lines) {
        expect(contrastRatio(line, palette.background)).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("keeps the local line-only harmony visible on either background polarity", () => {
    for (const background of ["#F4F0E5", "#121827"]) {
      const lines = createHarmoniousPalette(
        ["#171717", "#FF4F8A", "#4A6CFF"],
        background,
      );
      expect(new Set(lines).size).toBe(3);
      expect(
        lines.every((line) => contrastRatio(line, background) >= 3),
      ).toBe(true);
    }
  });

  it("interpolates exact color endpoints without format drift", () => {
    expect(interpolateHexColor("#000000", "#FFFFFF", 0)).toBe("#000000");
    expect(interpolateHexColor("#000000", "#FFFFFF", 0.5)).toBe("#808080");
    expect(interpolateHexColor("#000000", "#FFFFFF", 1)).toBe("#FFFFFF");
  });
});
