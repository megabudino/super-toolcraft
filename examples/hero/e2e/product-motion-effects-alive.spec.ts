import type { Locator, Page } from "@playwright/test";

import { appAcceptance } from "../src/app/app-acceptance-data";
import { heroEffectsTargets } from "../src/app/hero-effects-values";
import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { heroPreviewSelector } from "./hero-preview-browser-helpers";
import {
  findAdjacentLiveGrainFrames,
  getWrappedEffectTimeDelta,
} from "./hero-motion-effects-analysis";
import {
  disposeHeroMotionUniformCapture,
  installHeroMotionUniformCapture,
  readHeroMotionFrames,
  readLatestHeroMotionFrame,
  resumeHeroMotionDraws,
  waitForHeroMotionCaptureToSettle,
} from "./hero-motion-effects-evidence";
import {
  dragHeroSliderToValue,
  prepareHeroSliderEndpointDrag,
} from "./hero-motion-live-slider-drag";
import { proveHeldAmountZeroPixels } from "./hero-motion-amount-evidence";
import {
  evaluateHeroMotionAmountMateriality,
  getHeroMotionPixelHash,
  getMatchedHeroMotionPixelDelta,
  summarizeHeroGrainPixelWindow,
  summarizeHeroMotionTemporalExcess,
  type HeroGrainPixelSummary,
} from "./hero-motion-pixel-evidence";
import {
  expectHeroMotionMatchQuality,
  expectHeroMotionSizeTripleMatchQuality,
} from "./hero-motion-match-assertions";
import { proveHeldHeroGrainSizePixels } from "./hero-motion-size-evidence";
import {
  evaluateHeroMotionSizeCorrelationMateriality,
  summarizeHeroMotionSizeTriples,
  type HeroMotionSizeTripleSummary,
} from "./hero-motion-size-pixel-evidence";
import {
  captureForcedCleanFrame,
  captureHeroPanTail,
  configureDisabledHeroGrainAmount,
  freezeHeroEffectFrameAtRestoredPan,
  getSphereCanvas,
  prepareQuietSphere,
  proveEffectControlApplicability,
  undoHeroPan,
  type HeroPanTailCapture,
} from "./hero-motion-effects-test-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";

const grainAcceptance = appAcceptance.find(
  ({ id }) => id === heroEffectsTargets.grainEnabled,
);
const amountAcceptance = appAcceptance.find(
  ({ id }) => id === heroEffectsTargets.grainAmount,
);
const sizeAcceptance = appAcceptance.find(
  ({ id }) => id === heroEffectsTargets.grainSize,
);
if (
  !grainAcceptance?.target ||
  !amountAcceptance?.target ||
  !sizeAcceptance?.target
) {
  throw new Error("Missing live Grain acceptance rows.");
}

const MINIMUM_GRAIN_CONTROL_LUMA_DELTA = 0.25;
const MINIMUM_GRAIN_TEMPORAL_EXCESS_LUMA = 0.15; // One luma step on ~2.25% by RMS.

type GrainCapture = Readonly<{
  pan: HeroPanTailCapture;
  summary: HeroGrainPixelSummary;
}>;

async function captureActiveGrain(
  page: Page,
  canvas: Locator,
  grainSize?: number,
  maximumSamples = 8,
): Promise<GrainCapture> {
  const pan = await captureHeroPanTail(page, canvas, "grain", {
    match: { grainMinimum: 0.0001, grainSize },
    maximumSamples,
    minimumSamples: 4,
  });
  const summary = summarizeHeroGrainPixelWindow(pan.pixelSamples);
  expect(summary).not.toBeNull();
  return { pan, summary: summary! };
}

async function captureDisabledGrainControl(
  page: Page,
  canvas: Locator,
  maximumSamples = 6,
): Promise<HeroPanTailCapture> {
  return captureHeroPanTail(page, canvas, "grain", {
    match: { grainMaximum: 0 },
    maximumSamples,
    minimumSamples: 4,
  });
}

test.setTimeout(240_000);

test(grainAcceptance.browserTestName, async ({ page }) => {
  await prepareQuietSphere(page);
  const session = await createToolcraftBrowserProofSession(page);
  const canvas = getSphereCanvas(page);
  await installHeroMotionUniformCapture(canvas);
  await waitForHeroMotionCaptureToSettle(canvas);
  await configureDisabledHeroGrainAmount(page, 100);
  await waitForHeroMotionCaptureToSettle(canvas);
  const firstBaseline = await captureForcedCleanFrame(page, canvas);
  const secondBaseline = await captureForcedCleanFrame(page, canvas);
  expect(getHeroMotionPixelHash(secondBaseline)).toBe(
    getHeroMotionPixelHash(firstBaseline),
  );
  expect(secondBaseline.pixels).toEqual(firstBaseline.pixels);

  let controlCapture: HeroPanTailCapture | undefined;
  let activeCapture: GrainCapture | undefined;
  try {
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction(
        grainAcceptance.target,
        async (control, currentPage) => {
          controlCapture = await captureDisabledGrainControl(
            currentPage,
            canvas,
          );
          await undoHeroPan(currentPage, controlCapture.initialPan);
          await control.getByRole("switch").click();

          activeCapture = await captureActiveGrain(currentPage, canvas);
          const materialDelta = getMatchedHeroMotionPixelDelta(
            controlCapture.pixelSamples,
            activeCapture.pan.pixelSamples,
          );
          const temporalStrength = summarizeHeroMotionTemporalExcess(
            controlCapture.pixelSamples,
            activeCapture.pan.pixelSamples,
          );
          expect(activeCapture.pan.finalPan).toBe(controlCapture.finalPan);
          expect(materialDelta).toBeGreaterThanOrEqual(
            MINIMUM_GRAIN_CONTROL_LUMA_DELTA,
          );
          expectHeroMotionMatchQuality(temporalStrength);
          expect(temporalStrength.score).toBeGreaterThanOrEqual(
            MINIMUM_GRAIN_TEMPORAL_EXCESS_LUMA,
          );
          const livePixelPair = activeCapture.pan.pixelSamples
            .slice(1)
            .map(
              (current, index) =>
                [activeCapture!.pan.pixelSamples[index]!, current] as const,
            )
            .find(
              ([previous, current]) =>
                findAdjacentLiveGrainFrames([previous.frame, current.frame]) !==
                  null &&
                getHeroMotionPixelHash(previous) !==
                  getHeroMotionPixelHash(current),
            );
          expect(livePixelPair).toBeDefined();
          const [firstLive, secondLive] = livePixelPair!;
          expect(
            getWrappedEffectTimeDelta(
              firstLive.frame.effectTime,
              secondLive.frame.effectTime,
            ),
          ).toBeGreaterThan(0);
          const activeClean = await captureForcedCleanFrame(
            currentPage,
            canvas,
          );
          const repeatedClean = await captureForcedCleanFrame(
            currentPage,
            canvas,
          );
          expect(activeClean.frame.grain).toBe(0);
          expect(getHeroMotionPixelHash(repeatedClean)).toBe(
            getHeroMotionPixelHash(activeClean),
          );
          const frozen = await freezeHeroEffectFrameAtRestoredPan(
            currentPage,
            canvas,
            activeCapture.pan.initialPan,
            { grainMinimum: 0.0001 },
          );
          expect(frozen.frame.grain).toBeGreaterThan(0);
          expect(getHeroMotionPixelHash(frozen)).not.toBe(
            getHeroMotionPixelHash(firstBaseline),
          );
        },
      ),
      {
        requirementId: grainAcceptance.id,
        selector: heroPreviewSelector,
        baselineStabilitySamples: 1,
        stabilityIntervalMs: 80,
        stabilitySamples: 2,
        timeoutMs: 10_000,
      },
    );
  } finally {
    await resumeHeroMotionDraws(canvas);
  }
  expect(activeCapture?.pan.initialPan).toBe(controlCapture?.initialPan);
  await disposeHeroMotionUniformCapture(canvas);
});

test(amountAcceptance.browserTestName, async ({ page }) => {
  await prepareQuietSphere(page);
  const session = await createToolcraftBrowserProofSession(page);
  const requirementId = await proveEffectControlApplicability(
    session,
    amountAcceptance.id,
    amountAcceptance.target,
  );
  const canvas = getSphereCanvas(page);
  await installHeroMotionUniformCapture(canvas);
  let controlCapture: HeroPanTailCapture | undefined;
  let low: GrainCapture | undefined;
  let high: GrainCapture | undefined;
  try {
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction(
        amountAcceptance.target,
        async (control, currentPage) => {
          await dragHeroSliderToValue(currentPage, control, 0, async () => {});
          controlCapture = await captureDisabledGrainControl(
            currentPage,
            canvas,
            10,
          );
          await undoHeroPan(currentPage, controlCapture.initialPan);

          await dragHeroSliderToValue(currentPage, control, 20, async () => {});
          low = await captureActiveGrain(currentPage, canvas, undefined, 10);
          expect(low.pan.finalPan).toBe(controlCapture.finalPan);
          await undoHeroPan(currentPage, low.pan.initialPan);

          await dragHeroSliderToValue(
            currentPage,
            control,
            100,
            async () => {},
          );
          high = await captureActiveGrain(currentPage, canvas, undefined, 10);
          const lowStrength = summarizeHeroMotionTemporalExcess(
            controlCapture.pixelSamples,
            low.pan.pixelSamples,
          );
          const highStrength = summarizeHeroMotionTemporalExcess(
            controlCapture.pixelSamples,
            high.pan.pixelSamples,
          );
          const materiality = evaluateHeroMotionAmountMateriality(
            lowStrength.score,
            highStrength.score,
          );
          expect(high.pan.finalPan).toBe(low.pan.finalPan);
          expect(high.summary.grain).toBeGreaterThan(low.summary.grain * 2.5);
          expectHeroMotionMatchQuality(lowStrength);
          expectHeroMotionMatchQuality(highStrength);
          expect(highStrength.score).toBeGreaterThanOrEqual(
            materiality.absoluteMinimum,
          );
          expect(highStrength.score).toBeGreaterThanOrEqual(
            materiality.relativeMinimum,
          );
          await undoHeroPan(currentPage, high.pan.initialPan);

          const zeroDrag = await prepareHeroSliderEndpointDrag(control, 0);
          await proveHeldAmountZeroPixels(currentPage, canvas, zeroDrag);
          await currentPage.getByRole("button", { name: "Undo" }).click();
          await expect(control.getByRole("slider")).toHaveAttribute(
            "aria-valuenow",
            "100",
          );
          await expect
            .poll(async () => (await readLatestHeroMotionFrame(canvas))?.grain)
            .toBe(0);
          const frozen = await freezeHeroEffectFrameAtRestoredPan(
            currentPage,
            canvas,
            high.pan.initialPan,
            { grainMinimum: 0.0001 },
          );
          expect(frozen.frame.grain).toBeGreaterThan(0);
        },
      ),
      {
        requirementId,
        selector: heroPreviewSelector,
        baselineStabilitySamples: 1,
        stabilityIntervalMs: 80,
        stabilitySamples: 2,
        timeoutMs: 10_000,
      },
    );
  } finally {
    await resumeHeroMotionDraws(canvas);
  }
  expect(controlCapture?.finalPan).toBe(high?.pan.finalPan);
  await disposeHeroMotionUniformCapture(canvas);
});

test(sizeAcceptance.browserTestName, async ({ page }) => {
  await prepareQuietSphere(page);
  const session = await createToolcraftBrowserProofSession(page);
  const requirementId = await proveEffectControlApplicability(
    session,
    sizeAcceptance.id,
    sizeAcceptance.target,
  );
  await dragHeroSliderToValue(
    page,
    await getToolcraftControlFieldByTarget(
      page,
      heroEffectsTargets.grainAmount,
    ),
    100,
    async () => {},
  );
  const canvas = getSphereCanvas(page);
  await installHeroMotionUniformCapture(canvas);
  const sizeControl = await getToolcraftControlFieldByTarget(
    page,
    heroEffectsTargets.grainSize,
  );
  await dragHeroSliderToValue(page, sizeControl, 8, async () => {});
  await proveHeldHeroGrainSizePixels(page, canvas);
  await waitForHeroMotionCaptureToSettle(canvas);
  const protectedBaselinePan = await page
    .locator(heroPreviewSelector)
    .getAttribute("data-hero-gallery-pan");
  if (!protectedBaselinePan) throw new Error("Size baseline Pan must exist.");
  let fine: GrainCapture | undefined;
  let coarse: GrainCapture | undefined;
  let controlCapture: HeroPanTailCapture | undefined;
  let sizeCorrelation: HeroMotionSizeTripleSummary | undefined;
  try {
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction(
        sizeAcceptance.target,
        async (control, currentPage) => {
          const amountControl = await getToolcraftControlFieldByTarget(
            currentPage,
            heroEffectsTargets.grainAmount,
          );
          await dragHeroSliderToValue(
            currentPage,
            amountControl,
            0,
            async () => {},
          );
          controlCapture = await captureDisabledGrainControl(
            currentPage,
            canvas,
            10,
          );
          await undoHeroPan(currentPage, controlCapture.initialPan);
          await dragHeroSliderToValue(
            currentPage,
            amountControl,
            100,
            async () => {},
          );

          await dragHeroSliderToValue(currentPage, control, 8, async () => {});
          coarse = await captureActiveGrain(currentPage, canvas, 8, 10);
          expect(coarse.summary.grainSize).toBe(8);
          await undoHeroPan(currentPage, coarse.pan.initialPan);

          await dragHeroSliderToValue(currentPage, control, 1, async () => {});
          fine = await captureActiveGrain(currentPage, canvas, 1, 10);
          expect(fine.summary.grainSize).toBe(1);
          expect(coarse.pan.finalPan).toBe(fine.pan.finalPan);
          expect(controlCapture.finalPan).toBe(coarse.pan.finalPan);
          expect(controlCapture.finalPan).toBe(fine.pan.finalPan);
          sizeCorrelation = summarizeHeroMotionSizeTriples(
            controlCapture.pixelSamples,
            fine.pan.pixelSamples,
            coarse.pan.pixelSamples,
          );
          expectHeroMotionSizeTripleMatchQuality(sizeCorrelation);
          const materiality =
            evaluateHeroMotionSizeCorrelationMateriality(sizeCorrelation);
          expect(sizeCorrelation.coarseCorrelation).toBeGreaterThanOrEqual(
            materiality.absoluteMinimum,
          );
          expect(sizeCorrelation.coarseCorrelation).toBeGreaterThanOrEqual(
            materiality.relativeMinimum,
          );
          await undoHeroPan(currentPage, fine.pan.initialPan);

          const finalMotion = await captureActiveGrain(currentPage, canvas, 1);
          expect(finalMotion.pan.initialPan).toBe(protectedBaselinePan);
          const frozen = await freezeHeroEffectFrameAtRestoredPan(
            currentPage,
            canvas,
            protectedBaselinePan,
            { grainMinimum: 0.0001, grainSize: 1 },
          );
          expect(frozen.frame.grainSize).toBe(1);
        },
      ),
      {
        requirementId,
        selector: heroPreviewSelector,
        baselineStabilitySamples: 1,
        stabilityIntervalMs: 80,
        stabilitySamples: 2,
        timeoutMs: 10_000,
      },
    );
  } finally {
    await resumeHeroMotionDraws(canvas);
  }
  expectHeroMotionSizeTripleMatchQuality(sizeCorrelation!);
  const materiality = evaluateHeroMotionSizeCorrelationMateriality(
    sizeCorrelation!,
  );
  expect(sizeCorrelation!.coarseCorrelation).toBeGreaterThanOrEqual(
    materiality.absoluteMinimum,
  );
  expect(sizeCorrelation!.coarseCorrelation).toBeGreaterThanOrEqual(
    materiality.relativeMinimum,
  );
  await disposeHeroMotionUniformCapture(canvas);
});
