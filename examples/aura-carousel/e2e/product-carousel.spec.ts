import { DISPERSION_CAROUSEL_REFERENCE_BROWSER_TEST } from "../src/app/app-acceptance-data";
import {
  DISPERSION_CAROUSEL_GEOMETRY,
  DISPERSION_CAROUSEL_CYCLE_WIDTH,
  DISPERSION_CAROUSEL_DEFAULT_SCROLL,
  DISPERSION_CAROUSEL_LOOP_TRACK_WIDTH,
  DISPERSION_CAROUSEL_TITLE,
} from "../src/app/dispersion-carousel/dispersion-carousel-values";
import { expectToolcraftReferenceParity } from "./browser-acceptance-outcome-helpers";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import {
  openCleanDispersionCarousel,
  productSelector,
} from "./dispersion-carousel-test-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";

test.setTimeout(120_000);

test(DISPERSION_CAROUSEL_REFERENCE_BROWSER_TEST, async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1100 });
  await openCleanDispersionCarousel(page);
  const session = await createToolcraftBrowserProofSession(page);

  await expectToolcraftReferenceParity(
    () =>
      page.locator(productSelector).evaluate((surface) => {
        const header = surface.querySelector("[data-carousel-header]");
        const rail = surface.querySelector<HTMLElement>("[data-carousel-base]");
        const cards = [
          ...surface.querySelectorAll<HTMLImageElement>(
            "[data-carousel-loop-copy='1'] img",
          ),
        ];
        const testimonials = [
          ...surface.querySelectorAll<HTMLElement>(
            "[data-card-testimonial='true']",
          ),
        ];
        const cardRects = cards.map((image) => image.closest("article")!.getBoundingClientRect());
        const surfaceRect = surface.getBoundingClientRect();
        return {
          cardCount: cards.length,
          cardGap:
            cardRects.length > 1
              ? Math.round(cardRects[1]!.left - cardRects[0]!.right)
              : null,
          cardHeight: Math.round(cardRects[0]?.height ?? 0),
          cardRadius: getComputedStyle(cards[0]!).borderRadius,
          cardWidth: Math.round(cardRects[0]?.width ?? 0),
          headerHeight: Math.round(header?.getBoundingClientRect().height ?? 0),
          headerTop: Math.round(
            (header?.getBoundingClientRect().top ?? 0) - surfaceRect.top,
          ),
          naturalSizes: cards.map((card) => [card.naturalWidth, card.naturalHeight]),
          railTop: Math.round((rail?.getBoundingClientRect().top ?? 0) - surfaceRect.top),
          surfaceBackground: getComputedStyle(surface).backgroundColor,
          surfaceHeight: Math.round(surfaceRect.height),
          surfaceWidth: Math.round(surfaceRect.width),
          title: surface.querySelector("h1")?.textContent,
          testimonialBottom: getComputedStyle(testimonials[0]!).bottom,
          testimonialFontSize: getComputedStyle(testimonials[0]!).fontSize,
          testimonialFontWeight: getComputedStyle(testimonials[0]!).fontWeight,
          testimonialLineHeight: getComputedStyle(testimonials[0]!).lineHeight,
          testimonials: testimonials.map((item) => item.textContent?.trim()),
          trackWidth: rail?.scrollWidth ?? 0,
        };
      }),
    {
      cardCount: 5,
      cardGap: 16,
      cardHeight: 560,
      cardRadius: "12px",
      cardWidth: 448,
      headerHeight: 106,
      headerTop: 160,
      naturalSizes: Array.from({ length: 5 }, () => [896, 1120]),
      railTop: 314,
      surfaceBackground: "rgb(255, 255, 255)",
      surfaceHeight: 1034,
      surfaceWidth: 1920,
      title: DISPERSION_CAROUSEL_TITLE,
      testimonialBottom: "24px",
      testimonialFontSize: "20px",
      testimonialFontWeight: "400",
      testimonialLineHeight: "26px",
      testimonials: [
        "“Bringing our research into one clear view helped the team agree on priorities and decide what to build next.”",
        "“Learning why customers came back helped us improve our products and focus on the details they value most.”",
        "“A shared brief gave everyone a clear view of the goal and their role in reaching it. We made decisions sooner and kept work moving without extra meetings.”",
        "“We replaced disconnected reports with shared measures, so teams could spot problems early and make better decisions together.”",
        "“Simpler reporting freed up time to hear from customers, test new ideas, and improve the services they use daily.”",
      ],
      trackWidth: DISPERSION_CAROUSEL_LOOP_TRACK_WIDTH,
    },
    { requirementId: "carousel.scroll", target: "controls.setValue" },
  );

  await expectToolcraftProductObservableToChange(
    session,
    session.targetAction("controls.setValue", async (currentPage) => {
      const rail = currentPage.getByRole("region", { name: "Customer stories" });
      await rail.focus();
      await rail.press("ArrowRight");
      await expect
        .poll(
          () =>
            currentPage
              .locator(productSelector)
              .evaluate((node) =>
                Math.round(Number((node as HTMLElement).dataset.scrollLeft)),
              ),
          { timeout: 15_000 },
        )
        .toBe(
          (DISPERSION_CAROUSEL_DEFAULT_SCROLL +
            DISPERSION_CAROUSEL_GEOMETRY.cardWidth +
            DISPERSION_CAROUSEL_GEOMETRY.cardGap) % DISPERSION_CAROUSEL_CYCLE_WIDTH,
        );

      const surface = currentPage.locator(productSelector);
      const canvas = surface.locator("canvas");
      const readScroll = () => surface.evaluate((node) => Number((node as HTMLElement).dataset.scrollLeft));
      const boundsBefore = await surface.boundingBox();
      const beforeDragPixels = await canvas.evaluate((node) => node.toDataURL());
      await expect(rail).toHaveCSS("cursor", "grab");
      await currentPage.mouse.move(900, 550);
      await currentPage.mouse.down();
      await currentPage.mouse.move(610, 550, { steps: 8 });
      await expect(rail).toHaveCSS("cursor", "grabbing");
      await expect.poll(readScroll).toBeCloseTo(290, 0);
      // Holding longer than the ordinary wheel-settle delay must not snap.
      await currentPage.waitForTimeout(650);
      expect(await readScroll()).toBeCloseTo(290, 0);
      expect(await canvas.evaluate((node) => node.toDataURL())).not.toBe(beforeDragPixels);
      expect(await surface.boundingBox()).toEqual(boundsBefore);
      const backing = await canvas.evaluate((node) => ({
        width: node.width, height: node.height,
        expectedWidth: node.clientWidth * devicePixelRatio * 2,
        expectedHeight: node.clientHeight * devicePixelRatio * 2,
      }));
      expect(backing.width).toBe(backing.expectedWidth);
      expect(backing.height).toBe(backing.expectedHeight);

      // Move into the heading and release: capture retains the rail owner.
      await currentPage.mouse.move(260, 260, { steps: 8 });
      await expect.poll(readScroll).toBeCloseTo(640, 0);
      await currentPage.mouse.up();
      await expect(rail).toHaveCSS("cursor", "grab");
      await currentPage.waitForTimeout(800);
      expect(await readScroll()).toBe(640);
      await currentPage.mouse.move(500, 260);
      expect(await readScroll()).toBe(640);

      // Reverse drag crosses the beginning into the last card continuously.
      await currentPage.mouse.move(400, 550);
      await currentPage.mouse.down();
      await currentPage.mouse.move(1140, 550, { steps: 8 });
      await expect.poll(readScroll).toBeCloseTo(DISPERSION_CAROUSEL_CYCLE_WIDTH - 100, 0);
      await currentPage.mouse.up();
      await currentPage.waitForTimeout(800);
      expect(await readScroll()).toBe(DISPERSION_CAROUSEL_CYCLE_WIDTH - 100);
      expect(await surface.boundingBox()).toEqual(boundsBefore);
    }),
    {
      requirementId: "carousel.scroll",
      selector: productSelector,
      timeoutMs: 10_000,
    },
  );

  // The free-position release is persisted, not replaced with a card boundary.
  await page.reload();
  await expect(page.locator("[data-rail-renderer='webgl']")).toBeVisible();
  const restoredScroll = () => page.locator(productSelector).evaluate(
    (node) => Number((node as HTMLElement).dataset.scrollLeft),
  );
  expect(await restoredScroll()).toBe(DISPERSION_CAROUSEL_CYCLE_WIDTH - 100);
  const rail = page.getByRole("region", { name: "Customer stories" });
  await rail.focus();
  await rail.press("ArrowRight");
  await expect.poll(restoredScroll).toBe(0);
  await page.waitForTimeout(800);
  expect(await restoredScroll()).toBe(0);
});
