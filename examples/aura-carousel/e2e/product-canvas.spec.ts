import {
  DISPERSION_CAROUSEL_CANVAS_HEIGHT_BROWSER_TEST,
  DISPERSION_CAROUSEL_CANVAS_WIDTH_BROWSER_TEST,
  DISPERSION_CAROUSEL_INFINITY_BROWSER_TEST,
  DISPERSION_CAROUSEL_INFINITY_EXPORT_BROWSER_TEST,
  DISPERSION_CAROUSEL_QUALITY_BROWSER_TEST,
} from "../src/app/app-acceptance-data";
import { expectToolcraftReferenceParity } from "./browser-acceptance-outcome-helpers";
import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import {
  expectToolcraftInfinityCanvasImageExportEvidence,
  expectToolcraftInfinityCanvasModeEvidence,
  observeInfinityCanvas,
} from "./browser-infinity-canvas-evidence";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectToolcraftCanvasRenderScaleEvidence } from "./browser-render-scale-evidence";
import {
  chooseDispersionCarouselOption,
  dispersionCarouselTarget,
  exportDispersionCarouselImage,
  inspectDispersionCarouselImage,
  openCleanDispersionCarousel,
  paperCanvasSelector,
  productSelector,
} from "./dispersion-carousel-test-helpers";
import { dragToolcraftSliderByTarget } from "./performance-slider-helpers";
import { expectToolcraftDiscreteSliderMarkers } from "./performance-control-layout-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { test } from "./toolcraft-product-test";

test.setTimeout(120_000);

test(DISPERSION_CAROUSEL_CANVAS_WIDTH_BROWSER_TEST, async ({ page }) => {
  await openCleanDispersionCarousel(page);
  const session = await createToolcraftBrowserProofSession(page);
  await expectToolcraftReferenceParity(
    () =>
      page.locator(productSelector).evaluate((surface) => ({
        height: Math.round(surface.getBoundingClientRect().height),
        overflow: getComputedStyle(surface).overflow,
        width: Math.round(surface.getBoundingClientRect().width),
      })),
    { height: 1034, overflow: "hidden", width: 1920 },
    { requirementId: "canvas.size.width", target: "canvas.size.width" },
  );
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("canvas.size.width", async (control) => {
      const input = control.locator("input").first();
      await input.fill("1000");
      await input.press("Enter");
    }),
    { requirementId: "canvas.size.width", selector: productSelector },
  );
});

test(DISPERSION_CAROUSEL_CANVAS_HEIGHT_BROWSER_TEST, async ({ page }) => {
  await openCleanDispersionCarousel(page);
  const session = await createToolcraftBrowserProofSession(page);
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("canvas.size.height", async (control) => {
      const input = control.locator("input").first();
      await input.fill("620");
      await input.press("Enter");
    }),
    { requirementId: "canvas.size.height", selector: productSelector },
  );
});

test(DISPERSION_CAROUSEL_QUALITY_BROWSER_TEST, async ({ page }) => {
  await openCleanDispersionCarousel(page);
  await createToolcraftBrowserProofSession(page);
  await expectToolcraftDiscreteSliderMarkers(
    page,
    "canvas.renderScale",
    "canvas.renderScale",
  );
  await expectToolcraftCanvasRenderScaleEvidence(page, {
    canvasSelector: paperCanvasSelector,
    requirementId: "canvas.renderScale",
    selectedScale: 2,
    stateTransitions: [
      {
        run: async () => {
          const field = await getToolcraftControlFieldByTarget(
            page,
            dispersionCarouselTarget.amount,
          );
          await field.scrollIntoViewIfNeeded();
          await dragToolcraftSliderByTarget(
            page,
            dispersionCarouselTarget.amount,
            0.72,
          );
        },
        state: "interaction",
      },
      {
        run: async () => {
          await page.waitForTimeout(180);
        },
        state: "steady",
      },
    ],
    target: "canvas.renderScale",
  });
});

test(DISPERSION_CAROUSEL_INFINITY_BROWSER_TEST, async ({ page }) => {
  await openCleanDispersionCarousel(page);
  const before = await observeInfinityCanvas(page);
  const infinity = await getToolcraftControlFieldByTarget(page, "canvas.infinity");
  await infinity.getByRole("switch").click();
  const enabled = await observeInfinityCanvas(page);

  const viewport = page.getByRole("application", { name: "Canvas viewport" });
  const box = await viewport.boundingBox();
  if (!box) throw new Error("Canvas viewport needs visible bounds.");
  await page.mouse.move(box.x + 60, box.y + 90);
  await page.mouse.down();
  await page.mouse.move(box.x + 150, box.y + 145, { steps: 6 });
  await page.mouse.up();
  const afterPan = await observeInfinityCanvas(page);

  await page.reload({ waitUntil: "domcontentloaded" });
  const afterReload = await observeInfinityCanvas(page);
  const restoredInfinity = await getToolcraftControlFieldByTarget(
    page,
    "canvas.infinity",
  );
  await restoredInfinity.getByRole("switch").click();
  const restored = await observeInfinityCanvas(page);
  await page.getByRole("button", { name: "Undo" }).click();
  const undone = await observeInfinityCanvas(page);
  await page.getByRole("button", { name: "Redo" }).click();
  const redone = await observeInfinityCanvas(page);

  await expectToolcraftInfinityCanvasModeEvidence(
    { afterPan, afterReload, before, enabled, redone, restored, undone },
    {
      expectedFiniteSize: { height: 1034, width: 1920 },
      expectedSceneRect: { height: 1034, width: 2304, x: 0, y: 0 },
      requirementId: "canvas.infinity.mode-and-restoration",
      target: "canvas.infinity",
    },
  );
});

test(DISPERSION_CAROUSEL_INFINITY_EXPORT_BROWSER_TEST, async ({ page }) => {
  await openCleanDispersionCarousel(page);
  const resolution = await getToolcraftControlFieldByTarget(
    page,
    dispersionCarouselTarget.imageResolution,
  );
  await chooseDispersionCarouselOption(page, resolution, "2K");
  const finite = await inspectDispersionCarouselImage(
    page,
    await exportDispersionCarouselImage(page),
  );

  const infinity = await getToolcraftControlFieldByTarget(page, "canvas.infinity");
  await infinity.getByRole("switch").click();
  const infinite = await inspectDispersionCarouselImage(
    page,
    await exportDispersionCarouselImage(page),
  );

  await expectToolcraftInfinityCanvasImageExportEvidence(
    {
      finite: finite.inspection,
      infinite: infinite.inspection,
    },
    {
      expectedFiniteSize: { height: 1103, width: 2048 },
      expectedInfiniteSize: { height: 919, width: 2048 },
      requirementId: "canvas.infinity.scene-bounds-image-export",
      target: "canvas.infinity",
    },
  );
});
