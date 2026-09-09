import {
  DISPERSION_CAROUSEL_BLUR_BROWSER_TEST,
  DISPERSION_CAROUSEL_TEXT_EFFECT_BROWSER_TEST,
  getDispersionCarouselControlBrowserTestName,
} from "../src/app/app-acceptance-data";
import { expectToolcraftReferenceParity } from "./browser-acceptance-outcome-helpers";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import {
  dispersionCarouselTarget,
  openCleanDispersionCarousel,
  paperCanvasSelector,
} from "./dispersion-carousel-test-helpers";
import { dragToolcraftSliderByTarget } from "./performance-slider-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";

test.setTimeout(120_000);

const target = dispersionCarouselTarget;
const effectTargets = [
  target.amount,
  target.count,
  target.spectrum,
  target.hue,
  target.aura,
  target.velocity,
] as const;

for (const schemaTarget of effectTargets) {
  test(getDispersionCarouselControlBrowserTestName(schemaTarget), async ({ page }) => {
    await openCleanDispersionCarousel(page);
    const session = await createToolcraftBrowserProofSession(page);
    if (schemaTarget === target.amount) {
      await expectToolcraftReferenceParity(
        () =>
          page.locator("[data-dispersion-carousel]").evaluate((surface) => ({
            flatGeometry:
              surface.querySelector("[data-dispersion-rail]") !== null &&
              surface.querySelector("[data-carousel-base]") !== null,
            railRenderer: surface.getAttribute("data-rail-renderer"),
          })),
        {
          flatGeometry: true,
          railRenderer: "webgl",
        },
        { requirementId: target.amount, target: target.amount },
      );
    }
    await expectToolcraftProductObservableToChange(
      session,
      session.targetAction(schemaTarget, async (currentPage) => {
        const field = await getToolcraftControlFieldByTarget(
          currentPage,
          schemaTarget,
        );
        await field.scrollIntoViewIfNeeded();
        await dragToolcraftSliderByTarget(
          currentPage,
          schemaTarget,
          schemaTarget === target.count ? 0.42 : 0.78,
        );
        if (schemaTarget === target.velocity) {
          // The motion boost is visible only while the rail moves, so drive
          // one native card step to change pixels through the streak path.
          const rail = currentPage.getByRole("region", {
            name: "Customer stories",
          });
          await rail.focus();
          await rail.press("ArrowRight");
        }
      }),
      {
        baselineStabilityIntervalMs: 12,
        baselineStabilitySamples: 2,
        requirementId: schemaTarget,
        selector: "[data-dispersion-rail]",
        stabilityIntervalMs: 12,
        stabilitySamples: 2,
        timeoutMs: 10_000,
      },
    );
  });
}

test(DISPERSION_CAROUSEL_BLUR_BROWSER_TEST, async ({ page }) => {
  await openCleanDispersionCarousel(page);
  const session = await createToolcraftBrowserProofSession(page);
  const schemaTarget = target.blur;
  await expectToolcraftReferenceParity(
    () =>
      page.locator("[data-dispersion-carousel]").evaluate((surface) => {
        const canvas = surface.querySelector<HTMLCanvasElement>(
          "canvas[data-dispersion-carousel-canvas='true']",
        );
        return {
          edgeBlur: surface.getAttribute("data-edge-blur"),
          hasRailCanvas: canvas !== null && canvas.width > 0,
        };
      }),
    { edgeBlur: "22.00", hasRailCanvas: true },
    { requirementId: schemaTarget, target: schemaTarget },
  );
  await expectToolcraftProductObservableToChange(
    session,
    session.targetAction(schemaTarget, async (currentPage) => {
      const field = await getToolcraftControlFieldByTarget(
        currentPage,
        schemaTarget,
      );
      await field.scrollIntoViewIfNeeded();
      await dragToolcraftSliderByTarget(currentPage, schemaTarget, 0.8);
    }),
    {
      requirementId: schemaTarget,
      selector: paperCanvasSelector,
      timeoutMs: 10_000,
    },
  );
});

test(DISPERSION_CAROUSEL_TEXT_EFFECT_BROWSER_TEST, async ({ page }) => {
  await openCleanDispersionCarousel(page);
  const session = await createToolcraftBrowserProofSession(page);
  const surface = page.locator("[data-dispersion-carousel]");
  await expectToolcraftReferenceParity(
    () =>
      surface.evaluate((node) => ({
        cleanOverlay: node.querySelector("[data-clean-text-overlay]") !== null,
        mode: node.getAttribute("data-text-effect"),
        testimonials: node.querySelectorAll("[data-card-testimonial]").length,
      })),
    { cleanOverlay: false, mode: "shader", testimonials: 5 },
    { requirementId: target.includeText, target: target.includeText },
  );
  await expect(surface).toHaveAttribute("data-text-effect", "shader");
  await expect(surface.locator("[data-clean-text-overlay]")).toHaveCount(0);
  await expect(surface.locator("[data-card-testimonial]")).toHaveCount(5);

  await expectToolcraftProductObservableToChange(
    session,
    session.targetAction(target.includeText, async (currentPage) => {
      const field = await getToolcraftControlFieldByTarget(
        currentPage,
        target.includeText,
      );
      await field.scrollIntoViewIfNeeded();
      await field.getByRole("switch").click();
    }),
    {
      requirementId: target.includeText,
      selector: "[data-dispersion-rail]",
      timeoutMs: 10_000,
    },
  );

  await expect(surface).toHaveAttribute("data-text-effect", "clean");
  await expect(surface.locator("[data-clean-text-overlay]")).toHaveCount(1);
});
