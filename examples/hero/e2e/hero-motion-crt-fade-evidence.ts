import type { Locator, Page } from "@playwright/test";

import { heroEffectsTargets } from "../src/app/hero-effects-values";
import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import { heroPreviewSelector } from "./hero-preview-browser-helpers";
import {
  findFirstEffectTimeCheckpoint,
  findLastLocalEnvelopePeakIndex,
  getWrappedEffectTimeDelta,
  type HeroMotionCheckpoint,
} from "./hero-motion-effects-analysis";
import {
  armHeroMotionPixelCapture,
  beginHeroPanDrag,
  clearHeroMotionFrames,
  moveHeroPanDrag,
  readHeroMotionFrames,
  readLatestHeroMotionFrame,
  setHeroSwitch,
  type HeroMotionFrameEvidence,
  type HeroMotionRawPixelSample,
  waitForHeroMotionPixelSamples,
} from "./hero-motion-effects-evidence";
import {
  dragPreparedHeroSliderBeforeRelease,
  type PreparedHeroSliderEndpointDrag,
} from "./hero-motion-live-slider-drag";
import {
  getHeroMotionMeanAbsoluteLumaDelta,
  getHeroMotionPixelHash,
} from "./hero-motion-pixel-evidence";
import {
  captureForcedCleanFrame,
  captureHeroPanTail,
  undoHeroPan,
  type HeroPanTailCapture,
} from "./hero-motion-effects-test-helpers";
import { requestHeroGallerySnapshot } from "./hero-gallery-snapshot-helpers";
import { expect } from "./toolcraft-product-test";

export const CRT_EFFECT_EPSILON = 0.001;
export const LOW_CRT_FADE = 0.05;
export const LOW_CRT_FADE_CLEAN_DELTA = 0.35;
export const LOW_CRT_FADE_MIDPOINT_DELTA = LOW_CRT_FADE / 2;

export type ShortCrtFadeEvidence = Readonly<{
  clean: HeroMotionCheckpoint;
  cleanPixel: HeroMotionRawPixelSample;
  midpoint: HeroMotionCheckpoint;
  pan: HeroPanTailCapture;
  peak: HeroMotionFrameEvidence;
  peakIndex: number;
  predictedMidpoint: number;
  theoreticalClearBound: number;
}>;

export type LongCrtFadeEvidence = Readonly<{
  common: HeroMotionCheckpoint;
  commonPixel: HeroMotionRawPixelSample;
  cleanPixel: HeroMotionRawPixelSample;
  oneSecond: HeroMotionCheckpoint;
  pan: HeroPanTailCapture;
  peak: HeroMotionFrameEvidence;
  peakIndex: number;
}>;

export type HeldCrtFadeEvidence = Readonly<{
  active: HeroMotionRawPixelSample;
  clean: HeroMotionRawPixelSample;
  finalPan: string;
}>;

export function expectTightCrtCheckpoint(
  checkpoint: HeroMotionCheckpoint | null,
  threshold: number,
): asserts checkpoint is HeroMotionCheckpoint {
  expect(checkpoint).not.toBeNull();
  expect(checkpoint!.delta).toBeGreaterThanOrEqual(threshold);
  expect(checkpoint!.delta).toBeLessThan(
    threshold + checkpoint!.maxObservedFrameDt + 0.000_001,
  );
}

function getCrtPeak(
  frames: readonly HeroMotionFrameEvidence[],
  firstFrameAfterLastMove: number,
): Readonly<{ index: number; peak: HeroMotionFrameEvidence }> {
  const index = findLastLocalEnvelopePeakIndex(
    frames,
    firstFrameAfterLastMove,
    "crt",
  );
  expect(index).not.toBeNull();
  expect(index!).toBeGreaterThanOrEqual(firstFrameAfterLastMove);
  const peak = frames[index!]!;
  expect(peak.crt).toBeGreaterThan(0);
  expect(peak.panRate).toBeGreaterThan(0);
  return { index: index!, peak };
}

export async function captureShortCrtFadeEvidence(
  page: Page,
  canvas: Locator,
): Promise<ShortCrtFadeEvidence> {
  const initialPan = await captureHeroPanTail(page, canvas, "crt");
  let frames = initialPan.frames;
  let peak = getCrtPeak(frames, initialPan.firstFrameAfterLastMove);
  await expect
    .poll(async () => {
      frames = await readHeroMotionFrames(canvas);
      peak = getCrtPeak(frames, initialPan.firstFrameAfterLastMove);
      const checkpoint = findFirstEffectTimeCheckpoint(
        frames,
        peak.index,
        LOW_CRT_FADE_CLEAN_DELTA,
      );
      if (checkpoint) return true;
      await requestHeroGallerySnapshot(page);
      return false;
    })
    .toBe(true);
  const midpoint = findFirstEffectTimeCheckpoint(
    frames,
    peak.index,
    LOW_CRT_FADE_MIDPOINT_DELTA,
  );
  const clean = findFirstEffectTimeCheckpoint(
    frames,
    peak.index,
    LOW_CRT_FADE_CLEAN_DELTA,
  );
  expectTightCrtCheckpoint(midpoint, LOW_CRT_FADE_MIDPOINT_DELTA);
  expectTightCrtCheckpoint(clean, LOW_CRT_FADE_CLEAN_DELTA);

  const predictedMidpoint =
    peak.peak.crt * Math.exp(-LOW_CRT_FADE_MIDPOINT_DELTA / LOW_CRT_FADE);
  expect(predictedMidpoint).toBeGreaterThan(CRT_EFFECT_EPSILON);
  const theoreticalClearBound =
    LOW_CRT_FADE * Math.log(peak.peak.crt / CRT_EFFECT_EPSILON);
  expect(theoreticalClearBound).toBeLessThanOrEqual(0.3454);
  expect(midpoint.frame.crt).toBeGreaterThan(CRT_EFFECT_EPSILON);
  expect(midpoint.frame.crtFlicker).toBeGreaterThan(CRT_EFFECT_EPSILON);
  expect(midpoint.frame.crtScanlines).toBeGreaterThan(CRT_EFFECT_EPSILON);
  expect(clean.frame.crt).toBe(0);
  expect(clean.frame.crtFlicker).toBe(0);
  expect(clean.frame.crtScanlines).toBe(0);
  const cleanPixel = await captureForcedCleanFrame(page, canvas);
  expect(cleanPixel.frame.crt).toBe(0);

  const monotonicTail = frames.slice(peak.index, clean.index + 1);
  for (let index = 1; index < monotonicTail.length; index += 1) {
    expect(monotonicTail[index]!.crt).toBeLessThanOrEqual(
      monotonicTail[index - 1]!.crt,
    );
  }
  return {
    clean,
    cleanPixel,
    midpoint,
    pan: { ...initialPan, frames },
    peak: peak.peak,
    peakIndex: peak.index,
    predictedMidpoint,
    theoreticalClearBound,
  };
}

export async function captureLongCrtFadeEvidence(
  page: Page,
  canvas: Locator,
): Promise<LongCrtFadeEvidence> {
  const output = page.locator(heroPreviewSelector);
  const initialPan = await output.getAttribute("data-hero-gallery-pan");
  if (!initialPan) throw new Error("The initial Fade 3 Pan must exist.");
  await clearHeroMotionFrames(canvas);
  const start = await beginHeroPanDrag(page);
  let firstFrameAfterLastMove = 0;
  let lastSequenceBeforeLastMove = 0;
  try {
    for (let step = 1; step < 4; step += 1) {
      await moveHeroPanDrag(page, start, step);
    }
    const beforeLastMove = await readHeroMotionFrames(canvas);
    firstFrameAfterLastMove = beforeLastMove.length;
    lastSequenceBeforeLastMove = beforeLastMove.at(-1)?.sequence ?? 0;
    await moveHeroPanDrag(page, start, 4);
  } finally {
    await page.mouse.up();
  }
  await expect
    .poll(() => output.getAttribute("data-hero-gallery-pan"))
    .not.toBe(initialPan);

  let frames: readonly HeroMotionFrameEvidence[] = [];
  let peakIndex: number | null = null;
  let common: HeroMotionCheckpoint | null = null;
  await expect
    .poll(async () => {
      frames = await readHeroMotionFrames(canvas);
      peakIndex = findLastLocalEnvelopePeakIndex(
        frames,
        firstFrameAfterLastMove,
        "crt",
      );
      common =
        peakIndex === null
          ? null
          : findFirstEffectTimeCheckpoint(
              frames,
              peakIndex,
              LOW_CRT_FADE_CLEAN_DELTA,
            );
      return common !== null;
    })
    .toBe(true);
  const peak = getCrtPeak(frames, firstFrameAfterLastMove);
  expectTightCrtCheckpoint(common, LOW_CRT_FADE_CLEAN_DELTA);
  expect(common.frame.crt).toBeGreaterThan(CRT_EFFECT_EPSILON);
  const commonPixelRequest = await armHeroMotionPixelCapture(canvas, {
    afterSequence: (await readLatestHeroMotionFrame(canvas))?.sequence ?? 0,
    match: { crtMinimum: CRT_EFFECT_EPSILON },
    maximumSamples: 1,
  });
  await requestHeroGallerySnapshot(page);
  const [commonPixel] = await waitForHeroMotionPixelSamples(
    canvas,
    commonPixelRequest,
    1,
  );
  expect(commonPixel).toBeDefined();

  let oneSecond: HeroMotionCheckpoint | null = null;
  await expect
    .poll(async () => {
      frames = await readHeroMotionFrames(canvas);
      oneSecond = findFirstEffectTimeCheckpoint(frames, peak.index, 1);
      return oneSecond !== null;
    })
    .toBe(true);
  expectTightCrtCheckpoint(oneSecond, 1);
  expect(oneSecond.frame.crt).toBeGreaterThan(CRT_EFFECT_EPSILON);
  const finalPan = await output.getAttribute("data-hero-gallery-pan");
  if (!finalPan) throw new Error("The final Fade 3 Pan must exist.");

  await setHeroSwitch(page, heroEffectsTargets.crtEnabled, false);
  const cleanPixel = await captureForcedCleanFrame(page, canvas);
  expect(cleanPixel.frame.crt).toBe(0);
  expect(getHeroMotionPixelHash(commonPixel!)).not.toBe(
    getHeroMotionPixelHash(cleanPixel),
  );
  expect(
    getHeroMotionMeanAbsoluteLumaDelta(commonPixel!, cleanPixel),
  ).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Undo" }).click();
  const crtControl = await getToolcraftControlFieldByTarget(
    page,
    heroEffectsTargets.crtEnabled,
  );
  await expect(crtControl.getByRole("switch")).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await undoHeroPan(page, initialPan);
  await setHeroSwitch(page, heroEffectsTargets.crtEnabled, false);
  expect((await captureForcedCleanFrame(page, canvas)).frame.crt).toBe(0);
  await setHeroSwitch(page, heroEffectsTargets.crtEnabled, true);
  expect((await captureForcedCleanFrame(page, canvas)).frame.crt).toBe(0);

  return {
    common,
    commonPixel: commonPixel!,
    cleanPixel,
    oneSecond,
    pan: {
      finalPan,
      firstFrameAfterLastMove,
      frames,
      initialPan,
      lastSequenceBeforeLastMove,
      pixelSamples: [commonPixel!],
    },
    peak: peak.peak,
    peakIndex: peak.index,
  };
}

export async function proveHeldLowCrtFadeBeforeRelease(
  page: Page,
  canvas: Locator,
  prepared: PreparedHeroSliderEndpointDrag,
): Promise<HeldCrtFadeEvidence> {
  const output = page.locator(heroPreviewSelector);
  await clearHeroMotionFrames(canvas);
  const start = await beginHeroPanDrag(page);
  let activeRequest = 0;
  try {
    for (let step = 1; step < 4; step += 1) {
      await moveHeroPanDrag(page, start, step);
    }
    activeRequest = await armHeroMotionPixelCapture(canvas, {
      afterSequence: (await readLatestHeroMotionFrame(canvas))?.sequence ?? 0,
      match: { crtMinimum: CRT_EFFECT_EPSILON },
      maximumSamples: 4,
    });
    await moveHeroPanDrag(page, start, 4);
  } finally {
    await page.mouse.up();
  }
  const active = [
    ...(await waitForHeroMotionPixelSamples(canvas, activeRequest, 1)),
  ].sort((first, second) => second.frame.crt - first.frame.crt)[0]!;
  const finalPan = await output.getAttribute("data-hero-gallery-pan");
  if (!finalPan) throw new Error("The held Fade Pan must exist.");

  let clean: HeroMotionRawPixelSample | undefined;
  await dragPreparedHeroSliderBeforeRelease(page, prepared, async () => {
    await expect(output).toHaveAttribute("data-hero-crt-fade", "0.05");
    const request = await armHeroMotionPixelCapture(canvas, {
      afterSequence: (await readLatestHeroMotionFrame(canvas))?.sequence ?? 0,
      match: { crtMaximum: 0 },
      maximumSamples: 1,
    });
    await requestHeroGallerySnapshot(page);
    [clean] = await waitForHeroMotionPixelSamples(canvas, request, 1);
    expect(clean?.frame.crt).toBe(0);
    expect(clean?.frame.crtFlicker).toBe(0);
    expect(clean?.frame.crtScanlines).toBe(0);
    expect(getHeroMotionPixelHash(clean!)).not.toBe(
      getHeroMotionPixelHash(active),
    );
    expect(getHeroMotionMeanAbsoluteLumaDelta(active, clean!)).toBeGreaterThan(
      0,
    );
    await expect(output).toHaveAttribute("data-hero-gallery-pan", finalPan);
  });
  return { active, clean: clean!, finalPan };
}

export function getCrtCheckpointPixelDelta(
  dirty: HeroMotionRawPixelSample,
  clean: HeroMotionRawPixelSample,
): number {
  return getHeroMotionMeanAbsoluteLumaDelta(dirty, clean);
}

export function getCrtCheckpointEffectDelta(
  peak: HeroMotionFrameEvidence,
  sample: HeroMotionRawPixelSample,
): number {
  return getWrappedEffectTimeDelta(peak.effectTime, sample.frame.effectTime);
}
