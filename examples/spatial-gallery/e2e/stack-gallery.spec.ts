import { expectToolcraftExportedArtifact } from "./browser-acceptance-outcome-helpers";
import { expectToolcraftConditionalControlVisibility } from "./browser-conditional-output-evidence-helpers";
import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectToolcraftSegmentedControlCellsPreservePadding } from "./performance-control-layout-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import {
  dragSliderToFraction,
  exportSpiralCode,
  exportSpiralImage,
  inspectSpiralCode,
  inspectSpiralImage,
  nudgeSpiralWithArrow,
  resetSpiralTestPage,
  selectToolcraftOption,
  setSpiralCanvasSize,
  uploadSpiralFixtures,
  waitForSpiralCards,
  waitForSpiralSettled,
} from "./spiral-gallery-test-helpers";
import { expect, test } from "./toolcraft-product-test";

const stackControlsBrowserTest =
  "browser: deck layout controls update rendered output";
const stackBehaviorBrowserTest =
  "browser: deck navigation and image-only export stay in sync";

const stackSliderRequirements = [
  ["stack-gap", "stack.gap", false],
  ["stack-depth-step", "stack.depthStep", false],
  ["stack-back-tilt", "stack.backTiltDegrees", false],
  ["stack-fall-distance", "stack.fallDistance", true],
  ["stack-fall-tilt", "stack.fallTiltDegrees", true],
  ["stack-scroll-weight", "stack.scrollWeight", true],
] as const;

async function setGalleryLayout(
  page: Parameters<typeof getToolcraftControlFieldByTarget>[0],
  layout: "Flow" | "Deck",
): Promise<void> {
  const control = await getToolcraftControlFieldByTarget(page, "layout.mode");
  await control.getByRole("button", { name: layout, exact: true }).click();
}

test.setTimeout(600_000);

test(stackControlsBrowserTest, async ({ page }) => {
  await resetSpiralTestPage(page);
  await setSpiralCanvasSize(page, 960, 540);
  await uploadSpiralFixtures(page);
  await waitForSpiralCards(page, 12);
  const session = await createToolcraftBrowserProofSession(page);
  await waitForSpiralCards(page, 12);

  await expectToolcraftSegmentedControlCellsPreservePadding(page, "Layout", {
    requirementId: "layout-mode",
    target: "layout.mode",
  });

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("layout.mode", async (control, currentPage) => {
      await control.getByRole("button", { name: "Deck", exact: true }).click();
      await waitForSpiralCards(currentPage, 4);
    }),
    { requirementId: "layout-mode", stabilityIntervalMs: 120, timeoutMs: 10_000 },
  );
  await waitForSpiralSettled(page);
  await expect(
    page.locator('[data-image-gallery-root="true"]'),
  ).toHaveAttribute("data-gallery-layout", "stack");

  for (const [requirementId, target, needsAdvance] of stackSliderRequirements) {
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction(target, async (control, currentPage) => {
        await dragSliderToFraction(control, currentPage, 0.82);
        await control.getByRole("slider").press("End");
        if (needsAdvance) {
          await nudgeSpiralWithArrow(currentPage, 2);
        }
      }),
      { requirementId, stabilityIntervalMs: 120, timeoutMs: 10_000 },
    );
    await waitForSpiralSettled(page);
    await page.getByRole("button", { name: "Reset Deck section" }).click();
    await page.waitForTimeout(180);
    await waitForSpiralSettled(page);
  }

  for (const [requirementId, target] of stackSliderRequirements.map(
    ([id, sliderTarget]) => [id, sliderTarget] as const,
  )) {
    await expectToolcraftConditionalControlVisibility(
      session,
      session.controlAction("layout.mode", async (control) => {
        await control.getByRole("button", { name: "Flow", exact: true }).click();
      }),
      session.controlAction("layout.mode", async (control) => {
        await control.getByRole("button", { name: "Deck", exact: true }).click();
      }),
      { requirementId, target },
    );
  }
});

test(stackBehaviorBrowserTest, async ({ page }) => {
  await resetSpiralTestPage(page);
  await uploadSpiralFixtures(page);
  await waitForSpiralCards(page, 12);
  await setGalleryLayout(page, "Deck");
  await waitForSpiralCards(page, 4);
  await waitForSpiralSettled(page);
  const session = await createToolcraftBrowserProofSession(page);
  await waitForSpiralCards(page, 4);

  const canvas = page.locator('[data-image-gallery-canvas="true"]');

  const indexBefore = await canvas.getAttribute(
    "data-image-gallery-current-index",
  );
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("physics.keyStep", async (_control, currentPage) => {
      await nudgeSpiralWithArrow(currentPage, 2);
    }),
    {
      requirementId: "deck-canvas-navigation",
      stabilityIntervalMs: 120,
      timeoutMs: 12_000,
    },
  );
  await waitForSpiralSettled(page);
  await expect(canvas).toHaveAttribute("data-image-gallery-card-count", "4");
  await expect(canvas).not.toHaveAttribute(
    "data-image-gallery-current-index",
    String(indexBefore),
  );

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("layout.mode", async (control, currentPage) => {
      await control.getByRole("button", { name: "Flow", exact: true }).click();
      await waitForSpiralCards(currentPage, 12);
    }),
    {
      requirementId: "image-only-output",
      stabilityIntervalMs: 120,
      timeoutMs: 10_000,
    },
  );
  await expect(page.locator("[data-toolcraft-product-text]")).toHaveCount(0);
  await expect(page.locator('[data-stack-gallery-title="true"]')).toHaveCount(0);
  await expect(page.locator('[data-stack-gallery-dots="true"]')).toHaveCount(0);
  await expect(page.locator('[data-stack-gallery-shadow="true"]')).toHaveCount(0);
  await expect(page.getByText(/scroll \/ drag \/ arrow keys/iu)).toHaveCount(0);

  await setGalleryLayout(page, "Deck");
  await waitForSpiralCards(page, 4);
  await waitForSpiralSettled(page);

  const codeArtifact = await exportSpiralCode(page);
  const codeInspection = await inspectSpiralCode(codeArtifact);
  expect(codeInspection.layout).toBe("stack");
  expect(codeInspection.imageCount).toBe(4);
  expect(codeInspection.hasPhysicalBend).toBe(true);

  await selectToolcraftOption(page, "export.image.resolution", "2K");
  const artifact = await expectToolcraftExportedArtifact(
    session.controlAction("export.actions", (_control, currentPage) =>
      exportSpiralImage(currentPage),
    ),
    (download) => inspectSpiralImage(page, download),
    { requirementId: "deck-export" },
  );
  const inspection = await inspectSpiralImage(page, artifact);
  expect(artifact.fileName).toBe("image-gallery.png");
  expect(inspection).toMatchObject({
    height: 1152,
    mediaType: "image/png",
    width: 2048,
  });
});
