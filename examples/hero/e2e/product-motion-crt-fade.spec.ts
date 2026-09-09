import { appAcceptance } from "../src/app/app-acceptance-data";
import { heroEffectsTargets } from "../src/app/hero-effects-values";
import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { heroPreviewSelector } from "./hero-preview-browser-helpers";
import {
  CRT_EFFECT_EPSILON,
  captureLongCrtFadeEvidence,
  captureShortCrtFadeEvidence,
  getCrtCheckpointPixelDelta,
  LOW_CRT_FADE_CLEAN_DELTA,
  LOW_CRT_FADE_MIDPOINT_DELTA,
  proveHeldLowCrtFadeBeforeRelease,
  type HeldCrtFadeEvidence,
  type LongCrtFadeEvidence,
  type ShortCrtFadeEvidence,
} from "./hero-motion-crt-fade-evidence";
import {
  disposeHeroMotionUniformCapture,
  installHeroMotionUniformCapture,
  resumeHeroMotionDraws,
  type HeroMotionRawPixelSample,
} from "./hero-motion-effects-evidence";
import {
  dragHeroSliderToValue,
  enterHeroSliderValue,
  prepareHeroSliderEndpointDrag,
} from "./hero-motion-live-slider-drag";
import {
  freezeHeroEffectFrameAtRestoredPan,
  getSphereCanvas,
  prepareQuietSphere,
  proveEffectControlApplicability,
  undoHeroPan,
} from "./hero-motion-effects-test-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";

const fadeAcceptance = appAcceptance.find(
  ({ id }) => id === heroEffectsTargets.crtFade,
);
if (!fadeAcceptance?.target) {
  throw new Error("Missing live CRT Fade out acceptance row.");
}

test.setTimeout(240_000);

test(fadeAcceptance.browserTestName, async ({ page }) => {
  await prepareQuietSphere(page);
  const session = await createToolcraftBrowserProofSession(page);
  const visibleRequirementId = await proveEffectControlApplicability(
    session,
    fadeAcceptance.id,
    fadeAcceptance.target,
  );
  await enterHeroSliderValue(
    await getToolcraftControlFieldByTarget(
      page,
      heroEffectsTargets.crtScanlines,
    ),
    "100",
  );
  await enterHeroSliderValue(
    await getToolcraftControlFieldByTarget(page, heroEffectsTargets.crtFlicker),
    "100",
  );
  await enterHeroSliderValue(
    await getToolcraftControlFieldByTarget(page, heroEffectsTargets.crtPitch),
    "16",
  );

  const output = page.locator(heroPreviewSelector);
  const baselinePan = await output.getAttribute("data-hero-gallery-pan");
  if (!baselinePan) throw new Error("The Fade baseline Pan must exist.");
  const canvas = getSphereCanvas(page);
  await installHeroMotionUniformCapture(canvas);
  let low: ShortCrtFadeEvidence | undefined;
  let high: LongCrtFadeEvidence | undefined;
  let held: HeldCrtFadeEvidence | undefined;
  let frozen: HeroMotionRawPixelSample | undefined;
  try {
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction(
        fadeAcceptance.target,
        async (control, currentPage) => {
          await dragHeroSliderToValue(currentPage, control, 0.05, async () => {
            await expect(output).toHaveAttribute("data-hero-crt-fade", "0.05");
          });
          low = await captureShortCrtFadeEvidence(currentPage, canvas);
          await undoHeroPan(currentPage, low.pan.initialPan);

          await dragHeroSliderToValue(currentPage, control, 3, async () => {
            await expect(output).toHaveAttribute("data-hero-crt-fade", "3");
          });
          high = await captureLongCrtFadeEvidence(currentPage, canvas);
          expect(high.pan.finalPan).toBe(low.pan.finalPan);
          expect(high.pan.initialPan).toBe(baselinePan);
          expect(high.common.frame.crt).toBeGreaterThan(CRT_EFFECT_EPSILON);
          expect(high.oneSecond.frame.crt).toBeGreaterThan(CRT_EFFECT_EPSILON);
          expect(
            getCrtCheckpointPixelDelta(high.commonPixel, low.cleanPixel),
          ).toBeGreaterThan(0);

          const liveControl = await getToolcraftControlFieldByTarget(
            currentPage,
            heroEffectsTargets.crtFade,
          );
          const lowDrag = await prepareHeroSliderEndpointDrag(
            liveControl,
            0.05,
          );
          held = await proveHeldLowCrtFadeBeforeRelease(
            currentPage,
            canvas,
            lowDrag,
          );
          expect(held.finalPan).toBe(high.pan.finalPan);
          await currentPage.getByRole("button", { name: "Undo" }).click();
          await expect(output).toHaveAttribute("data-hero-crt-fade", "3");
          await expect(liveControl.getByRole("slider")).toHaveAttribute(
            "aria-valuenow",
            "3",
          );

          frozen = await freezeHeroEffectFrameAtRestoredPan(
            currentPage,
            canvas,
            baselinePan,
            { crtMinimum: CRT_EFFECT_EPSILON },
          );
          expect(frozen.frame.crt).toBeGreaterThan(CRT_EFFECT_EPSILON);
          expect(await output.getAttribute("data-hero-gallery-pan")).toBe(
            baselinePan,
          );
        },
      ),
      {
        requirementId: visibleRequirementId,
        selector: heroPreviewSelector,
        baselineStabilitySamples: 1,
        stabilityIntervalMs: 80,
        stabilitySamples: 2,
        timeoutMs: 10_000,
      },
    );
  } finally {
    try {
      await resumeHeroMotionDraws(canvas);
    } finally {
      await disposeHeroMotionUniformCapture(canvas);
    }
  }

  expect(low!.midpoint.delta).toBeGreaterThanOrEqual(
    LOW_CRT_FADE_MIDPOINT_DELTA,
  );
  expect(low!.clean.delta).toBeGreaterThanOrEqual(LOW_CRT_FADE_CLEAN_DELTA);
  expect(high!.pan.finalPan).toBe(low!.pan.finalPan);
  expect(held!.clean.frame.crt).toBe(0);
  expect(frozen!.frame.crt).toBeGreaterThan(CRT_EFFECT_EPSILON);
});
