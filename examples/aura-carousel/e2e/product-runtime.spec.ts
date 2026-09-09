import { DISPERSION_CAROUSEL_PERSISTENCE_BROWSER_TEST } from "../src/app/app-acceptance-data";
import { appSchema } from "../src/app/app-schema";
import {
  DISPERSION_CAROUSEL_CYCLE_WIDTH,
  DISPERSION_CAROUSEL_GEOMETRY,
} from "../src/app/dispersion-carousel/dispersion-carousel-values";
import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectToolcraftPersistenceState } from "./browser-state-evidence-helpers";
import {
  dispersionCarouselTarget,
  openCleanDispersionCarousel,
  productSelector,
} from "./dispersion-carousel-test-helpers";
import { dragToolcraftSliderByTarget } from "./performance-slider-helpers";
import { expect, test } from "./toolcraft-product-test";

test.setTimeout(120_000);

const restoredLogicalScroll =
  DISPERSION_CAROUSEL_GEOMETRY.cardWidth +
  DISPERSION_CAROUSEL_GEOMETRY.cardGap;

test(DISPERSION_CAROUSEL_PERSISTENCE_BROWSER_TEST, async ({ page }) => {
  await openCleanDispersionCarousel(page);
  if (appSchema.persistence.storage !== "localStorage") {
    throw new Error("Dispersion Carousel requires local persistence.");
  }
  const session = await createToolcraftBrowserProofSession(page);
  const target = dispersionCarouselTarget;
  const observeWorkspace = session.observe((root) => {
    const raw = localStorage.getItem(
      "toolcraft:dispersion-carousel:state:v6",
    );
    let snapshot:
      | {
          state?: {
            canvas?: { size?: { width?: unknown } };
            panels?: { controls?: { collapsed?: unknown } };
            values?: Record<string, unknown>;
          };
        }
      | undefined;
    try {
      snapshot = raw ? JSON.parse(raw) : undefined;
    } catch {
      snapshot = undefined;
    }
    const surface = root.querySelector<HTMLElement>(
      "[data-dispersion-carousel='true']",
    );
    const cycleWidth = 2320;
    const rawScroll = Number(surface?.dataset.scrollLeft ?? 0);
    return {
      canvasWidth: Math.round(surface?.getBoundingClientRect().width ?? 0),
      collapsed: root.querySelector('[aria-label="Expand controls"]') !== null,
      edgeWidth: surface?.getAttribute("data-edge-width") ?? null,
      persistedCanvasWidth: snapshot?.state?.canvas?.size?.width ?? null,
      persistedCollapsed: snapshot?.state?.panels?.controls?.collapsed ?? null,
      persistedEdgeWidth: snapshot?.state?.values?.["edgeZone.width"] ?? null,
      persistedScroll: snapshot?.state?.values?.["carousel.scroll"] ?? null,
      scrollLeft: Math.round(
        ((rawScroll % cycleWidth) + cycleWidth) % cycleWidth,
      ),
    };
  });

  await expectToolcraftPersistenceState(
    observeWorkspace,
    session.targetAction("canvas.size.width", async (currentPage) => {
      await dragToolcraftSliderByTarget(currentPage, target.edgeWidth, 0.8);
      const rail = currentPage.getByRole("region", { name: "Customer stories" });
      await rail.focus();
      await rail.press("ArrowRight");
      await expect
        .poll(
          () =>
            currentPage
              .locator("[data-dispersion-carousel='true']")
              .evaluate((node, cycleWidth) => {
                const rawScroll = Number(
                  (node as HTMLElement).dataset.scrollLeft,
                );
                return Math.round(
                  ((rawScroll % cycleWidth) + cycleWidth) % cycleWidth,
                );
              }, DISPERSION_CAROUSEL_CYCLE_WIDTH),
          { timeout: 15_000 },
        )
        .toBe(restoredLogicalScroll);
      const width = await getToolcraftControlFieldByTarget(
        currentPage,
        "canvas.size.width",
      );
      const input = width.locator("input").first();
      await input.fill("1000");
      await input.press("Enter");
      await currentPage
        .getByRole("button", { name: "Collapse controls" })
        .click();
      await expect(
        currentPage.locator('[data-slot="toolcraft-runtime-app"]'),
      ).toHaveAttribute("data-toolcraft-persistence-status", "success");
    }),
    session.reload(),
    {
      canvasWidth: 1000,
      collapsed: true,
      edgeWidth: "41.00",
      persistedCanvasWidth: 1000,
      persistedCollapsed: true,
      persistedEdgeWidth: 41,
      persistedScroll: 464,
      scrollLeft: restoredLogicalScroll,
    },
    {
      assertRestoredOutput: async () => {
        await expect(page.locator(productSelector)).toHaveAttribute(
          "data-edge-width",
          "41.00",
        );
      },
      requirementId: "runtime.persistence.reload",
      stabilityIntervalMs: 40,
      timeoutMs: 15_000,
    },
  );
});
