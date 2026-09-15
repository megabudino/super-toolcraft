import { describe, expect, it } from "vitest";

import {
  GLOBE_CRT_EXPORT_PHASE_MS,
  getGlobeCrtEffectProfile,
} from "./globe-crt-effect";

describe("landing globe CRT effect", () => {
  it("scales strengthened flicker and scanlines by intensity", () => {
    for (const phaseMs of [0, 320, 1280, 2400, 5200]) {
      const profile = getGlobeCrtEffectProfile(phaseMs, 1080, 75);

      expect(profile.flickerAlpha).toBeGreaterThanOrEqual(0.015);
      expect(profile.flickerAlpha).toBeLessThanOrEqual(0.0413);
      expect(profile.scanlineAlpha).toBeGreaterThanOrEqual(0.0675);
      expect(profile.scanlineAlpha).toBeLessThanOrEqual(0.0938);
      expect(profile.rollAlpha).toBeCloseTo(0.0375);
    }
  });

  it("clamps intensity and can disable the foreground treatment", () => {
    expect(getGlobeCrtEffectProfile(800, 1080, -20)).toMatchObject({
      flickerAlpha: 0,
      rollAlpha: 0,
      scanlineAlpha: 0,
    });
    expect(getGlobeCrtEffectProfile(800, 1080, 160)).toEqual(
      getGlobeCrtEffectProfile(800, 1080, 100),
    );
  });

  it("uses a stable phase for image export", () => {
    expect(getGlobeCrtEffectProfile(GLOBE_CRT_EXPORT_PHASE_MS, 1080, 75))
      .toEqual(getGlobeCrtEffectProfile(GLOBE_CRT_EXPORT_PHASE_MS, 1080, 75));
  });
});
