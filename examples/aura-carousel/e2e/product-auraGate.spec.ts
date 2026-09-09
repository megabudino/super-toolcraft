import { getDispersionCarouselControlBrowserTestName } from "../src/app/app-acceptance-data";
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

const auraGateTargets = [
  dispersionCarouselTarget.gateOffset,
  dispersionCarouselTarget.gateWidth,
  dispersionCarouselTarget.gateGlow,
  dispersionCarouselTarget.gateRefraction,
] as const;

for (const target of auraGateTargets) {
  test(getDispersionCarouselControlBrowserTestName(target), async ({ page }) => {
    await openCleanDispersionCarousel(page);
    const session = await createToolcraftBrowserProofSession(page);
    if (target === dispersionCarouselTarget.gateGlow) {
      await expectToolcraftReferenceParity(
        () =>
          page.locator(productSelector).evaluate((surface) => ({
            glow: surface.getAttribute("data-aura-gate"),
            railRenderer: surface.getAttribute("data-rail-renderer"),
          })),
        { glow: "0.55", railRenderer: "webgl" },
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
