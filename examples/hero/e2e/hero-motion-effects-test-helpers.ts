import type { Locator, Page } from "@playwright/test";

import {
  getToolcraftApplicabilityRequirementId,
  getToolcraftControlApplicabilityCases,
} from "../src/app/app-acceptance";
import { appControlSectionInventory } from "../src/app/app-acceptance-data";
import { appSchema } from "../src/app/app-schema";
import { heroEffectsTargets } from "../src/app/hero-effects-values";
import { heroGalleryTargets } from "../src/app/hero-gallery-values";
import { expectToolcraftControlApplicabilityState } from "./browser-control-applicability-evidence";
import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import type { createToolcraftBrowserProofSession } from "./browser-proof-session";
import {
  heroFrameSelector,
  heroPreviewSelector,
  waitForWebsitePreview,
} from "./hero-preview-browser-helpers";
import {
  armHeroMotionPixelCapture,
  beginHeroPanDrag,
  clearHeroMotionFrames,
  freezeHeroSphereRows,
  moveHeroPanDrag,
  prepareHeroMotionUniformCapture,
  readHeroMotionFrames,
  readLatestHeroMotionFrame,
  setHeroSwitch,
  type HeroMotionFrameEvidence,
  type HeroMotionPixelCaptureMatch,
  type HeroMotionRawPixelSample,
  waitForHeroMotionPixelSamples,
} from "./hero-motion-effects-evidence";
import { dragHeroSliderToValue } from "./hero-motion-live-slider-drag";
import { requestHeroGallerySnapshot } from "./hero-gallery-snapshot-helpers";
import { expect } from "./toolcraft-product-test";

type BrowserProofSession = Awaited<
  ReturnType<typeof createToolcraftBrowserProofSession>
>;

export type HeroPanTailCapture = Readonly<{
  firstFrameAfterLastMove: number;
  finalPan: string;
  frames: readonly HeroMotionFrameEvidence[];
  initialPan: string;
  lastSequenceBeforeLastMove: number;
  pixelSamples: readonly HeroMotionRawPixelSample[];
}>;

export function getSphereCanvas(page: Page): Locator {
  return page
    .frameLocator(heroFrameSelector)
    .locator(
      '[data-hero-gallery="sphere"][data-hero-gallery-ready="true"] [data-hero-gallery-canvas]',
    );
}

export async function prepareQuietSphere(
  page: Page,
  { motionCapture = true }: Readonly<{ motionCapture?: boolean }> = {},
): Promise<void> {
  if (motionCapture) await prepareHeroMotionUniformCapture(page);
  await page.goto("/");
  await waitForWebsitePreview(page, 60_000);
  await setHeroSwitch(page, heroGalleryTargets.autoScrollEnabled, false);
  await freezeHeroSphereRows(page);
  await setHeroSwitch(page, heroEffectsTargets.grainEnabled, false);
  await setHeroSwitch(page, heroEffectsTargets.crtEnabled, false);
  const canvas = getSphereCanvas(page);
  await expect
    .poll(() => canvas.evaluate((element) => getComputedStyle(element).opacity))
    .toBe("1");
}

export async function configureDisabledHeroGrainAmount(
  page: Page,
  value: number,
): Promise<void> {
  await setHeroSwitch(page, heroEffectsTargets.grainEnabled, true);
  await dragHeroSliderToValue(
    page,
    await getToolcraftControlFieldByTarget(
      page,
      heroEffectsTargets.grainAmount,
    ),
    value,
    async () => {},
  );
  await setHeroSwitch(page, heroEffectsTargets.grainEnabled, false);
  const grainControl = await getToolcraftControlFieldByTarget(
    page,
    heroEffectsTargets.grainEnabled,
  );
  await expect(grainControl.getByRole("switch")).toHaveAttribute(
    "aria-checked",
    "false",
  );
}

export async function startHeroAutoScrollMotion(
  page: Page,
  canvas: Locator,
  envelope: "crt" | "grain",
): Promise<void> {
  await setHeroSwitch(page, heroGalleryTargets.autoScrollEnabled, true);
  const durationControl = await getToolcraftControlFieldByTarget(
    page,
    heroGalleryTargets.autoScrollDuration,
  );
  await dragHeroSliderToValue(page, durationControl, 2, async () => {});
  const intervalControl = await getToolcraftControlFieldByTarget(
    page,
    heroGalleryTargets.autoScrollInterval,
  );
  await dragHeroSliderToValue(page, intervalControl, 0.5, async () => {});
  await setHeroSwitch(page, heroGalleryTargets.autoScrollEnabled, false);
  await expect
    .poll(async () => (await readLatestHeroMotionFrame(canvas))?.[envelope], {
      timeout: 30_000,
    })
    .toBe(0);
  await setHeroSwitch(page, heroGalleryTargets.autoScrollEnabled, true);
  await expect
    .poll(
      async () => {
        const frame = await readLatestHeroMotionFrame(canvas);
        return Boolean(frame && frame[envelope] > 0.0001 && frame.panRate > 0);
      },
      { timeout: 10_000 },
    )
    .toBe(true);
}

export async function stopHeroAutoScrollMotion(
  page: Page,
  canvas: Locator,
  envelope: "crt" | "grain",
): Promise<void> {
  await setHeroSwitch(page, heroGalleryTargets.autoScrollEnabled, false);
  await expect
    .poll(async () => (await readLatestHeroMotionFrame(canvas))?.[envelope], {
      timeout: 30_000,
    })
    .toBe(0);
}

export async function proveEffectControlApplicability(
  session: BrowserProofSession,
  acceptanceId: string,
  target: string,
): Promise<string> {
  const applicabilityCases = getToolcraftControlApplicabilityCases({
    schema: appSchema,
    sectionInventory: appControlSectionInventory,
    target,
  });
  let visibleRequirementId = acceptanceId;
  for (const applicabilityCase of applicabilityCases) {
    await expectToolcraftControlApplicabilityState(
      session,
      session.controlAction(
        applicabilityCase.selectorTarget,
        async (control) => {
          const toggle = control.getByRole("switch");
          const desired = String(applicabilityCase.selectorValue);
          if ((await toggle.getAttribute("aria-checked")) !== desired) {
            await toggle.click();
          }
        },
      ),
      applicabilityCase,
      { baseRequirementId: acceptanceId },
    );
    if (applicabilityCase.expectation === "visible") {
      visibleRequirementId = getToolcraftApplicabilityRequirementId(
        acceptanceId,
        applicabilityCase,
      );
    }
  }
  return visibleRequirementId;
}

export async function captureHeroPanTail(
  page: Page,
  canvas: Locator,
  envelope: "crt" | "grain",
  pixelCapture?: Readonly<{
    match?: HeroMotionPixelCaptureMatch;
    maximumSamples: number;
    minimumSamples: number;
  }>,
): Promise<HeroPanTailCapture> {
  const output = page.locator(heroPreviewSelector);
  const initialPan = await output.getAttribute("data-hero-gallery-pan");
  if (!initialPan)
    throw new Error("The initial Sphere Pan must be observable.");
  await clearHeroMotionFrames(canvas);
  const start = await beginHeroPanDrag(page);
  let firstFrameAfterLastMove = 0;
  let lastSequenceBeforeLastMove = 0;
  let pixelRequestId: number | undefined;
  try {
    for (let step = 1; step < 4; step += 1) {
      await moveHeroPanDrag(page, start, step);
    }
    const beforeLastMove = await readHeroMotionFrames(canvas);
    firstFrameAfterLastMove = beforeLastMove.length;
    lastSequenceBeforeLastMove = beforeLastMove.at(-1)?.sequence ?? 0;
    if (pixelCapture) {
      pixelRequestId = await armHeroMotionPixelCapture(canvas, {
        afterSequence: lastSequenceBeforeLastMove,
        match: pixelCapture.match,
        maximumSamples: pixelCapture.maximumSamples,
      });
    }
    await moveHeroPanDrag(page, start, 4);
  } finally {
    await page.mouse.up();
  }
  await expect
    .poll(() => output.getAttribute("data-hero-gallery-pan"))
    .not.toBe(initialPan);
  await expect
    .poll(async () => (await readLatestHeroMotionFrame(canvas))?.[envelope], {
      timeout: 30_000,
    })
    .toBe(0);
  const finalPan = await output.getAttribute("data-hero-gallery-pan");
  if (!finalPan) throw new Error("The final Sphere Pan must be observable.");
  const pixelSamples =
    pixelRequestId === undefined
      ? []
      : await waitForHeroMotionPixelSamples(
          canvas,
          pixelRequestId,
          pixelCapture!.minimumSamples,
        );
  return {
    firstFrameAfterLastMove,
    finalPan,
    frames: await readHeroMotionFrames(canvas),
    initialPan,
    lastSequenceBeforeLastMove,
    pixelSamples,
  };
}

export async function undoHeroPan(
  page: Page,
  expectedPan: string,
): Promise<void> {
  const output = page.locator(heroPreviewSelector);
  await page.getByRole("button", { name: "Undo" }).click();
  await expect
    .poll(() => output.getAttribute("data-hero-gallery-pan"))
    .toBe(expectedPan);
}

export async function freezeHeroEffectFrameAtRestoredPan(
  page: Page,
  canvas: Locator,
  expectedPan: string,
  match: Readonly<{
    crtMinimum?: number;
    grainMinimum?: number;
    grainSize?: number;
  }>,
): Promise<HeroMotionRawPixelSample> {
  const afterSequence =
    (await readLatestHeroMotionFrame(canvas))?.sequence ?? 0;
  const requestId = await armHeroMotionPixelCapture(canvas, {
    afterSequence,
    freezeAfterCapture: true,
    match,
    maximumSamples: 1,
  });
  await undoHeroPan(page, expectedPan);
  const [sample] = await waitForHeroMotionPixelSamples(canvas, requestId, 1);
  if (!sample)
    throw new Error("The restored-Pan effect frame must be captured.");
  await expect(page.locator(heroPreviewSelector)).toHaveAttribute(
    "data-hero-gallery-pan",
    expectedPan,
  );
  return sample;
}

export async function captureForcedCleanFrame(
  page: Page,
  canvas: Locator,
): Promise<HeroMotionRawPixelSample> {
  const afterSequence =
    (await readLatestHeroMotionFrame(canvas))?.sequence ?? 0;
  const requestId = await armHeroMotionPixelCapture(canvas, {
    afterSequence,
    match: { crtMaximum: 0, grainMaximum: 0 },
    maximumSamples: 1,
  });
  await requestHeroGallerySnapshot(page);
  const [sample] = await waitForHeroMotionPixelSamples(canvas, requestId, 1);
  if (!sample) throw new Error("The forced Sphere snapshot must draw a frame.");
  return sample;
}
