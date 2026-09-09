import {
  MAX_HERO_MOTION_FRAME_DT_DELTA,
  MAX_HERO_MOTION_PAN_RATE_DELTA,
  type HeroMotionTemporalExcessMatch,
} from "./hero-motion-pixel-evidence";
import type { HeroMotionSizeTripleSummary } from "./hero-motion-size-pixel-evidence";
import { expect } from "./toolcraft-product-test";

export function expectHeroMotionMatchQuality(
  summary: Readonly<{ matches: readonly HeroMotionTemporalExcessMatch[] }>,
): void {
  expect(summary.matches.length).toBeGreaterThanOrEqual(3);
  for (const match of summary.matches) {
    expect(match.frameDtDelta).toBeLessThanOrEqual(
      MAX_HERO_MOTION_FRAME_DT_DELTA,
    );
    expect(match.panRateDelta).toBeLessThanOrEqual(
      MAX_HERO_MOTION_PAN_RATE_DELTA,
    );
  }
}

export function expectHeroMotionSizeTripleMatchQuality(
  summary: HeroMotionSizeTripleSummary,
): void {
  expect(summary.matches.length).toBeGreaterThanOrEqual(3);
  for (const match of summary.matches) {
    expect(match.fineFrameDtDelta).toBeLessThanOrEqual(
      MAX_HERO_MOTION_FRAME_DT_DELTA,
    );
    expect(match.coarseFrameDtDelta).toBeLessThanOrEqual(
      MAX_HERO_MOTION_FRAME_DT_DELTA,
    );
    expect(match.finePanRateDelta).toBeLessThanOrEqual(
      MAX_HERO_MOTION_PAN_RATE_DELTA,
    );
    expect(match.coarsePanRateDelta).toBeLessThanOrEqual(
      MAX_HERO_MOTION_PAN_RATE_DELTA,
    );
  }
}
