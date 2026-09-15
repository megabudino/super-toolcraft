import { afterEach, describe, expect, it, vi } from "vitest";
import { GLOBE_CRT_EXPORT_PHASE_MS } from "../app/globe-crt-effect";
import { drawGlobeFrame } from "../app/globe-frame";
import { getLoopingLogos } from "../app/globe-logo-animation";
import { createGlobeGeometry, readGlobeSettings } from "../app/globe-model";
import { drawWebsiteGlobe, getGlobeBackingSize } from "./globe-frame";

vi.mock("../app/globe-frame", () => ({ drawGlobeFrame: vi.fn() }));

afterEach(() => vi.clearAllMocks());

describe("website frame adapter", () => {
  it.each([
    [1920, 1080, 1, 2, 3840, 2160],
    [390, 844, 3, 2, 2340, 5064],
    [640, 360, 1.25, 1.5, 1200, 675],
    [640, 360, NaN, 2, 1280, 720],
    [640, 360, 0, 2, 1280, 720],
    [0, 0, 2, 2, 0, 0],
  ])("backs %sx%s at DPR %s and scale %s exactly", (width, height, dpr, scale, w, h) => {
    expect(getGlobeBackingSize(width, height, dpr, scale)).toMatchObject({ width: w, height: h });
  });

  it.each([[1920, 1080, 1.5], [960, 540, 1.5], [390, 844, 8 / 3]])(
    "preserves proportional line width at %sx%s",
    (width, height, expectedWidth) => {
      const settings = readGlobeSettings({});
      const geometry = createGlobeGeometry(settings);
      drawWebsiteGlobe({} as CanvasRenderingContext2D, width, height, settings, geometry, 300, true);
      const call = vi.mocked(drawGlobeFrame).mock.lastCall!;
      expect(call[3].lineWidth).toBeCloseTo(expectedWidth);
      expect(call[3].logos).toBe(settings.logos);
      expect(call[4]).toEqual({ clear: true, geometry, includeBackground: true, crtPhaseMs: GLOBE_CRT_EXPORT_PHASE_MS });
    },
  );

  it("uses the editor's existing loop timing and keeps transparent output transparent", () => {
    const settings = readGlobeSettings({ "export.includeBackground": false });
    const geometry = createGlobeGeometry(settings);
    drawWebsiteGlobe({} as CanvasRenderingContext2D, 1920, 1080, settings, geometry, 4800, false);
    const call = vi.mocked(drawGlobeFrame).mock.lastCall!;
    expect(call[3].logos).toEqual(getLoopingLogos(settings.logos, 4800, settings.logoHoldSeconds, settings.logoSpeed));
    expect(call[4]).toMatchObject({ includeBackground: false, crtPhaseMs: 4800 });
  });
});
