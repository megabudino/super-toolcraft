import { inspectToolcraftImageDownload } from "./image-artifact-inspection";
import { expectExportExcludesCanvasHandles } from "./canvas-handle-helpers";
import {
  expectToolcraftOrientationAxisDrag,
  expectToolcraftOrientationAxisSnap,
  expectToolcraftOrientationCanvasMissPan,
  expectToolcraftOrientationModelDrag,
  expectToolcraftOrientationUndoReset,
} from "./browser-orientation-gizmo-evidence-helpers";
import { readToolcraftBrowserObservation } from "./browser-proof-session";
import { expectToolcraftControlApplicabilityState } from "./browser-control-applicability-evidence";
import { expectToolcraftSegmentedControlCellsPreservePadding } from "./performance-control-layout-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import {
  chooseLastSegment,
  createLogoSphereProofSession,
  logoSphereCanvasSelector,
  moveSliderToEnd,
  readLogoSphereOrientationObservation,
  waitForLogoSphereDraw,
} from "./logo-sphere-test-helpers";
import { expect, test } from "./toolcraft-product-test";
import {
  getLogoSphereApplicabilityCases,
  getLogoSphereApplicabilityRequirementId,
  selectLogoSphereApplicabilityCase,
} from "./logo-sphere-applicability-helpers";

test.setTimeout(120_000);

const sliderCases = [
  ["sphere.visible-count", "sphere.visibleCount"],
  ["sphere.radius", "sphere.radius"],
  ["sphere.logo-size", "sphere.logoSize"],
  ["sphere.depth", "sphere.depth"],
  ["sphere.perspective", "sphere.perspective"],
  ["sphere.fisheye", "sphere.fisheye"],
] as const;

for (const [requirementId, target] of sliderCases) {
  test(
    `browser: ${requirementId} updates logo sphere product output`,
    async ({ page }) => {
      const session = await createLogoSphereProofSession(page);
      for (const applicabilityCase of getLogoSphereApplicabilityCases(target)) {
        await expectToolcraftControlApplicabilityState(
          session,
          session.controlAction(
            applicabilityCase.selectorTarget,
            (control, currentPage) =>
              selectLogoSphereApplicabilityCase(
                control,
                currentPage,
                applicabilityCase,
              ),
          ),
          applicabilityCase,
          { baseRequirementId: requirementId },
        );
        const slider = page
          .locator(`[data-toolcraft-control-target="${target}"]`)
          .getByRole("slider");
        await slider.press("Home");
        await waitForLogoSphereDraw(page);
        await expectToolcraftProductObservableToChange(
          session,
          session.controlAction(target, moveSliderToEnd),
          {
            requirementId: getLogoSphereApplicabilityRequirementId(
              requirementId,
              applicabilityCase,
            ),
            selector: logoSphereCanvasSelector,
            stabilityIntervalMs: 0,
          },
        );
        if (target === "sphere.visibleCount") {
          await expect(page.locator(logoSphereCanvasSelector)).toHaveAttribute(
            "data-logo-count",
            "500",
          );
        }
      }
    },
  );
}

test(
  "browser: sphere.distribution updates logo sphere product output",
  async ({ page }) => {
    const session = await createLogoSphereProofSession(page);
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction("sphere.distribution", chooseLastSegment),
      {
        requirementId: "sphere.distribution",
        selector: logoSphereCanvasSelector,
        stabilityIntervalMs: 0,
      },
    );
    await expectToolcraftSegmentedControlCellsPreservePadding(
      page,
      "Distribution",
      {
        requirementId: "sphere.distribution",
        target: "sphere.distribution",
      },
    );
  },
);

test(
  "browser: orientation gizmo and direct sphere drag update shared pose",
  async ({ page }) => {
    const session = await createLogoSphereProofSession(page);
    const renderScaleSlider = page
      .locator('[data-toolcraft-control-target="canvas.renderScale"]')
      .getByRole("slider");
    await renderScaleSlider.evaluate((slider) => {
      const maximum = slider.getAttribute("max");
      if (maximum) slider.setAttribute("aria-valuemax", maximum);
    });
    await page
      .locator('[data-toolcraft-control-target="motion.inertia"]')
      .getByRole("slider")
      .press("Home");
    const observation = session.observe(readLogoSphereOrientationObservation);
    const baseline = await readToolcraftBrowserObservation(observation);
    const changed = await expectToolcraftOrientationAxisDrag(
      observation,
      session,
      {
        dragDelta: { x: 24, y: -16 },
        requirementId: "sphere.orbit",
        stabilityIntervalMs: 0,
        target: "view.orbit",
      },
    );
    await expectToolcraftOrientationUndoReset(
      observation,
      session.targetAction("view.orbit", async (currentPage) => {
        await currentPage.getByRole("button", { name: "Undo" }).click();
      }),
      session.targetAction("view.orbit", async (currentPage) => {
        await currentPage.getByRole("button", { name: "Redo" }).click();
      }),
      session.targetAction("view.orbit", async (currentPage) => {
        await currentPage
          .getByRole("button", { name: "Reset Sphere section" })
          .click();
      }),
      baseline,
      changed,
      {
        requirementId: "sphere.orbit",
        stabilityIntervalMs: 0,
        target: "view.orbit",
      },
    );
    await expectToolcraftOrientationAxisSnap(
      observation,
      session,
      "+x",
      {
        requirementId: "sphere.orbit",
        stabilityIntervalMs: 0,
        target: "view.orbit",
      },
    );
    await expectToolcraftOrientationModelDrag(observation, session, {
      dragDelta: { x: -34, y: 22 },
      requirementId: "sphere.orbit",
      stabilityIntervalMs: 0,
      target: "view.orbit",
    });
    await expect(page.locator(logoSphereCanvasSelector)).toHaveAttribute(
      "data-render-quality",
      "full",
      { timeout: 4_000 },
    );
    await expectToolcraftOrientationCanvasMissPan(
      observation,
      session.targetAction("view.orbit", async (currentPage) => {
        const canvas = currentPage.locator(logoSphereCanvasSelector);
        const bounds = await canvas.boundingBox();
        expect(bounds).not.toBeNull();
        if (!bounds) return;
        const x = Math.max(90, bounds.x + bounds.width * 0.18);
        const y = Math.max(90, bounds.y + bounds.height * 0.18);
        await currentPage.mouse.move(x, y);
        await currentPage.mouse.down();
        await currentPage.mouse.move(x + 42, y + 30, { steps: 6 });
        await currentPage.mouse.up();
      }),
      {
        requirementId: "sphere.orbit",
        stabilityIntervalMs: 0,
        target: "view.orbit",
      },
    );
  },
);

test(
  "browser: Grid orbit keeps full detail without release refinement or reduced backing",
  async ({ page }) => {
    await createLogoSphereProofSession(page);
    await page
      .locator('[data-toolcraft-control-target="sphere.distribution"]')
      .getByRole("button", { exact: true, name: "Grid" })
      .click();
    await page
      .locator('[data-toolcraft-control-target="sphere.visibleCount"]')
      .getByRole("slider")
      .press("End");
    await page
      .locator('[data-toolcraft-control-target="motion.inertia"]')
      .getByRole("slider")
      .press("Home");

    const canvas = page.locator(logoSphereCanvasSelector);
    await expect(canvas).toHaveAttribute("data-logo-count", "500");
    await expect(canvas).toHaveAttribute("data-render-quality", "full");
    const baselineOrbit = await canvas.getAttribute("data-orbit-position");
    const baselineBacking = await canvas.evaluate((element) => {
      const output = element as HTMLCanvasElement;
      return { height: output.height, width: output.width };
    });
    const bounds = await canvas.boundingBox();
    expect(bounds).not.toBeNull();
    if (!bounds) return;

    const x = bounds.x + bounds.width / 2;
    const y = bounds.y + bounds.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 84, y - 32, { steps: 8 });
    await expect(canvas).toHaveAttribute("data-render-quality", "full");
    expect(
      await canvas.evaluate((element) => {
        const output = element as HTMLCanvasElement;
        return { height: output.height, width: output.width };
      }),
    ).toEqual(baselineBacking);
    await page.mouse.up();

    await expect(canvas).not.toHaveAttribute(
      "data-orbit-position",
      baselineOrbit ?? "",
    );
    await page.waitForTimeout(100);
    const released = await canvas.screenshot();
    await page.waitForTimeout(800);
    expect(await canvas.screenshot()).toEqual(released);
    await expect(canvas).toHaveAttribute("data-render-quality", "full");
    await expect(canvas).toHaveAttribute("data-render-quality", "full", {
      timeout: 4_000,
    });
    expect(
      await canvas.evaluate((element) => {
        const output = element as HTMLCanvasElement;
        return { height: output.height, width: output.width };
      }),
    ).toEqual(baselineBacking);
  },
);

test("browser: logo sphere export excludes orientation gizmo", async ({ page }) => {
  await createLogoSphereProofSession(page);
  const exportImage = async () => {
    const pending = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export PNG" }).click();
    return pending;
  };

  await expectExportExcludesCanvasHandles(
    page,
    exportImage,
    async (download) =>
      (
        await inspectToolcraftImageDownload({
          backgroundRgba: [245, 244, 241, 255],
          download,
          page,
        })
      ).inspection,
    {
      requirementId: "sphere.orbit#export-clean",
      target: "view.orbit",
    },
  );
});
