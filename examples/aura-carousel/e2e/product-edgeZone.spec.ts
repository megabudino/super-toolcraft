import {
  DISPERSION_CAROUSEL_EDGE_BROWSER_TEST,
  getDispersionCarouselControlBrowserTestName,
} from "../src/app/app-acceptance-data";
import { expectToolcraftReferenceParity } from "./browser-acceptance-outcome-helpers";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import {
  dispersionCarouselTarget,
  openCleanDispersionCarousel,
  productSelector,
} from "./dispersion-carousel-test-helpers";
import { dragToolcraftSliderByTarget } from "./performance-slider-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { test } from "./toolcraft-product-test";

test.setTimeout(120_000);

test(DISPERSION_CAROUSEL_EDGE_BROWSER_TEST, async ({ page }) => {
  await openCleanDispersionCarousel(page);
  const session = await createToolcraftBrowserProofSession(page);
  const target = dispersionCarouselTarget.edgeWidth;
  await expectToolcraftReferenceParity(
    () =>
      page.locator(productSelector).evaluate((surface) => ({
        edgeWidth: surface.getAttribute("data-edge-width"),
        railRenderer: surface.getAttribute("data-rail-renderer"),
      })),
    {
      edgeWidth: "30.00",
      railRenderer: "webgl",
    },
    { requirementId: target, target },
  );
  await expectToolcraftProductObservableToChange(
    session,
    session.targetAction(target, (currentPage) =>
      dragToolcraftSliderByTarget(currentPage, target, 0.8),
    ),
    {
      requirementId: target,
      selector: "[data-dispersion-rail]",
      timeoutMs: 10_000,
    },
  );
});

const edgeZoneTargets = [
  dispersionCarouselTarget.curve,
  dispersionCarouselTarget.edgeFade,
  dispersionCarouselTarget.turbulence,
  dispersionCarouselTarget.turbulenceScale,
  dispersionCarouselTarget.warp,
  dispersionCarouselTarget.warpOffset,
] as const;

for (const target of edgeZoneTargets) {
  test(getDispersionCarouselControlBrowserTestName(target), async ({ page }) => {
    await openCleanDispersionCarousel(page);
    const session = await createToolcraftBrowserProofSession(page);
    if (target === dispersionCarouselTarget.turbulence) {
      await expectToolcraftReferenceParity(
        () =>
          page.locator(productSelector).evaluate((surface) => ({
            railRenderer: surface.getAttribute("data-rail-renderer"),
            turbulence: surface.getAttribute("data-edge-turbulence"),
          })),
        { railRenderer: "webgl", turbulence: "0.70" },
        { requirementId: target, target },
      );
    }
    if (target === dispersionCarouselTarget.warp) {
      await expectToolcraftReferenceParity(
        () =>
          page.locator(productSelector).evaluate((surface) => ({
            railRenderer: surface.getAttribute("data-rail-renderer"),
            warp: surface.getAttribute("data-edge-warp"),
          })),
        { railRenderer: "webgl", warp: "40.00" },
        { requirementId: target, target },
      );
    }
    await expectToolcraftProductObservableToChange(
      session,
      session.targetAction(target, async (currentPage) => {
        const field = await getToolcraftControlFieldByTarget(currentPage, target);
        await field.scrollIntoViewIfNeeded();
        await dragToolcraftSliderByTarget(currentPage, target, 0.78);
      }),
      {
        requirementId: target,
        selector: "[data-dispersion-rail]",
        timeoutMs: 10_000,
      },
    );
  });
}

test(
  getDispersionCarouselControlBrowserTestName(dispersionCarouselTarget.warpStyle),
  async ({ page }) => {
    await openCleanDispersionCarousel(page);
    const session = await createToolcraftBrowserProofSession(page);
    const target = dispersionCarouselTarget.warpStyle;
    await expectToolcraftReferenceParity(
      () =>
        page.locator(productSelector).evaluate((surface) => ({
          railRenderer: surface.getAttribute("data-rail-renderer"),
          warpStyle: surface.getAttribute("data-edge-warp-style"),
        })),
      { railRenderer: "webgl", warpStyle: "stretch" },
      { requirementId: target, target },
    );
    await expectToolcraftProductObservableToChange(
      session,
      session.targetAction(target, async (currentPage) => {
        const field = await getToolcraftControlFieldByTarget(currentPage, target);
        await field.scrollIntoViewIfNeeded();
        await field.getByRole("button", { name: "Prism" }).click();
      }),
      {
        requirementId: target,
        selector: "[data-dispersion-rail]",
        timeoutMs: 10_000,
      },
    );
  },
);

test(
  getDispersionCarouselControlBrowserTestName(
    dispersionCarouselTarget.warpWaveEnabled,
  ),
  async ({ page }) => {
    await openCleanDispersionCarousel(page);
    const session = await createToolcraftBrowserProofSession(page);
    const target = dispersionCarouselTarget.warpWaveEnabled;
    await expectToolcraftReferenceParity(
      () =>
        page.locator(productSelector).evaluate((surface) => ({
          railRenderer: surface.getAttribute("data-rail-renderer"),
          waveEnabled: surface.getAttribute("data-edge-warp-wave-enabled"),
        })),
      { railRenderer: "webgl", waveEnabled: "off" },
      { requirementId: target, target },
    );
    await expectToolcraftProductObservableToChange(
      session,
      session.targetAction(target, async (currentPage) => {
        const field = await getToolcraftControlFieldByTarget(currentPage, target);
        await field.scrollIntoViewIfNeeded();
        await field.getByRole("switch").click();
      }),
      {
        requirementId: target,
        selector: "[data-dispersion-rail]",
        timeoutMs: 10_000,
      },
    );
  },
);

test(
  getDispersionCarouselControlBrowserTestName(
    dispersionCarouselTarget.warpWaveKind,
  ),
  async ({ page }) => {
    await openCleanDispersionCarousel(page);
    const session = await createToolcraftBrowserProofSession(page);
    const waveField = await getToolcraftControlFieldByTarget(
      page,
      dispersionCarouselTarget.warpWaveEnabled,
    );
    await waveField.scrollIntoViewIfNeeded();
    await waveField.getByRole("switch").click();
    const target = dispersionCarouselTarget.warpWaveKind;
    await expectToolcraftReferenceParity(
      () =>
        page.locator(productSelector).evaluate((surface) => ({
          railRenderer: surface.getAttribute("data-rail-renderer"),
          waveKind: surface.getAttribute("data-edge-warp-wave-kind"),
        })),
      { railRenderer: "webgl", waveKind: "glass" },
      { requirementId: target, target },
    );
    await expectToolcraftProductObservableToChange(
      session,
      session.targetAction(target, async (currentPage) => {
        const field = await getToolcraftControlFieldByTarget(currentPage, target);
        await field.scrollIntoViewIfNeeded();
        await field.getByRole("button", { name: "Ripple" }).click();
      }),
      {
        requirementId: target,
        selector: "[data-dispersion-rail]",
        timeoutMs: 10_000,
      },
    );
  },
);

const waveWarpTargets = [
  dispersionCarouselTarget.warpWave,
  dispersionCarouselTarget.warpWaveLength,
  dispersionCarouselTarget.warpWaveBlur,
] as const;

for (const target of waveWarpTargets) {
  test(getDispersionCarouselControlBrowserTestName(target), async ({ page }) => {
    await openCleanDispersionCarousel(page);
    const session = await createToolcraftBrowserProofSession(page);
    const waveField = await getToolcraftControlFieldByTarget(
      page,
      dispersionCarouselTarget.warpWaveEnabled,
    );
    await waveField.scrollIntoViewIfNeeded();
    await waveField.getByRole("switch").click();
    await expectToolcraftProductObservableToChange(
      session,
      session.targetAction(target, async (currentPage) => {
        const field = await getToolcraftControlFieldByTarget(currentPage, target);
        await field.scrollIntoViewIfNeeded();
        await dragToolcraftSliderByTarget(currentPage, target, 0.78);
      }),
      {
        requirementId: target,
        selector: "[data-dispersion-rail]",
        timeoutMs: 10_000,
      },
    );
  });
}

const prismWarpTargets = [
  dispersionCarouselTarget.warpFace,
  dispersionCarouselTarget.warpSharpness,
] as const;

for (const target of prismWarpTargets) {
  test(getDispersionCarouselControlBrowserTestName(target), async ({ page }) => {
    await openCleanDispersionCarousel(page);
    const session = await createToolcraftBrowserProofSession(page);
    const styleField = await getToolcraftControlFieldByTarget(
      page,
      dispersionCarouselTarget.warpStyle,
    );
    await styleField.scrollIntoViewIfNeeded();
    await styleField.getByRole("button", { name: "Prism" }).click();
    await expectToolcraftProductObservableToChange(
      session,
      session.targetAction(target, async (currentPage) => {
        const field = await getToolcraftControlFieldByTarget(currentPage, target);
        await field.scrollIntoViewIfNeeded();
        await dragToolcraftSliderByTarget(currentPage, target, 0.78);
      }),
      {
        requirementId: target,
        selector: "[data-dispersion-rail]",
        timeoutMs: 10_000,
      },
    );
  });
}
