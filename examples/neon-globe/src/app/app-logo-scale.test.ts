import { describe, expect, it } from "vitest";

import { logoAcceptance } from "./app-logo-acceptance-data";
import { appSchema } from "./app-schema";
import { GLOBE_LOGO_SCALE } from "./globe-constants";
import { getLoopingLogos } from "./globe-logo-animation";
import { getGlobeLogoAsset } from "./globe-logo-assets";
import { getLogoMaskLayout } from "./globe-logo-mask";
import { readGlobeSettings } from "./globe-model";

const scaleRows = logoAcceptance.filter((row) => row.id.endsWith(".scale"));
const grid = { columnCount: 600, columnPitchPixels: 4.5, rowCount: 40, rowPitchPixels: 3.1 };

describe("independent logo scale", () => {
  for (const row of scaleRows) {
    it(row.automatedTestName, () => {
      const initial = readGlobeSettings({});
      const changed = readGlobeSettings({ [row.target!]: 55 });
      const logoId = row.id.split(".")[1];
      expect(changed.logos).toEqual(initial.logos.map((logo) =>
        logo.logoId === logoId ? { ...logo, scale: 55 } : logo,
      ));
      expect(changed.bands).toEqual(initial.bands);
      expect(changed.bandDotSize).toBe(initial.bandDotSize);
      expect(changed.bandColumnSpacing).toBe(initial.bandColumnSpacing);
      const moving = getLoopingLogos(changed.logos, 1500, changed.logoHoldSeconds, changed.logoSpeed);
      const originalMoving = getLoopingLogos(initial.logos, 1500, initial.logoHoldSeconds, initial.logoSpeed);
      expect(moving.map((logo) => logo.scale)).toEqual(changed.logos.map((logo) => logo.scale));
      expect(moving.map((logo) => logo.position)).toEqual(originalMoving.map((logo) => logo.position));
    });
  }

  it("declares four bounded continuous sliders with unchanged size by default", () => {
    const controls = appSchema.panels.controls?.sections.find((section) => section.id === "logo-scale")?.controls;
    expect(Object.values(controls ?? {})).toHaveLength(4);
    for (const control of Object.values(controls ?? {})) {
      expect(control).toMatchObject({
        ...GLOBE_LOGO_SCALE,
        applicability: { mode: "always" },
        sliderValueKind: "continuous",
        type: "slider",
        unit: "%",
      });
    }
    expect(readGlobeSettings({}).logos.map((logo) => logo.scale)).toEqual([100, 100, 100, 100]);
  });

  it.each([undefined, NaN, Infinity, "75"])("uses the default for invalid saved scale %s", (value) => {
    const values = Object.fromEntries(scaleRows.map((row) => [row.target!, value]));
    expect(readGlobeSettings(values).logos.map((logo) => logo.scale)).toEqual([100, 100, 100, 100]);
  });

  it.each([[-10, 25], [300, 135]])("clamps scale %s to %s", (value, expected) => {
    const values = Object.fromEntries(scaleRows.map((row) => [row.target!, value]));
    expect(readGlobeSettings(values).logos.map((logo) => logo.scale)).toEqual(Array(4).fill(expected));
  });

  it.each(["dxc", "meta", "prada", "zillow"] as const)("keeps %s proportions and center at every scale", (id) => {
    const asset = getGlobeLogoAsset(id)!;
    const initial = getLogoMaskLayout({ ...grid, aspectRatio: asset.aspectRatio, scale: 100 });
    expect(initial.rows).toBe(Math.round(grid.rowCount * 0.74));
    expect(initial.firstRow).toBe(Math.floor((grid.rowCount - initial.rows) / 2));
    for (const scale of [25, 55, 100, 135]) {
      const layout = getLogoMaskLayout({ ...grid, aspectRatio: asset.aspectRatio, scale });
      const pixelRatio = layout.widthColumns * grid.columnPitchPixels / (layout.rows * grid.rowPitchPixels);
      expect(pixelRatio).toBeCloseTo(asset.aspectRatio, 10);
      expect(layout.firstRow + layout.rows / 2).toBe(initial.firstRow + initial.rows / 2);
      expect(layout.firstRow).toBeGreaterThanOrEqual(0);
      expect(layout.firstRow + layout.rows).toBeLessThanOrEqual(grid.rowCount);
      if (scale <= 100) expect(layout.rows / initial.rows).toBeCloseTo(scale / 100, 10);
      else expect(layout.rows).toBeGreaterThan(initial.rows);
      expect(getLogoMaskLayout({
        ...grid, aspectRatio: asset.aspectRatio, scale,
        columnPitchPixels: grid.columnPitchPixels * 2,
        rowPitchPixels: grid.rowPitchPixels * 2,
      })).toEqual(layout);
    }
  });

  it("fits wide masks by shrinking both axes rather than stretching the logo", () => {
    const aspectRatio = getGlobeLogoAsset("dxc")!.aspectRatio;
    const layout = getLogoMaskLayout({
      aspectRatio, columnCount: 48, columnPitchPixels: 3, rowCount: 150, rowPitchPixels: 2, scale: 135,
    });
    expect(layout.widthColumns).toBeCloseTo(48 * 0.48, 10);
    expect(layout.widthColumns * 3 / (layout.rows * 2)).toBeCloseTo(aspectRatio, 10);
  });
});
