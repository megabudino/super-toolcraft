import { expectToolcraftSegmentedControlCellsPreservePadding } from "./performance-control-layout-helpers";
import { expectToolcraftControlApplicabilityState } from "./browser-control-applicability-evidence";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import {
  chooseLastSegment,
  createLogoSphereProofSession,
  logoSphereCanvasSelector,
  moveSliderToEnd,
  waitForLogoSphereDraw,
} from "./logo-sphere-test-helpers";
import { expect, test } from "./toolcraft-product-test";
import {
  getLogoSphereApplicabilityCases,
  getLogoSphereApplicabilityRequirementId,
  selectLogoSphereApplicabilityCase,
} from "./logo-sphere-applicability-helpers";

test.setTimeout(120_000);

test(
  "browser: motion.spin-axis updates logo sphere product output",
  async ({ page }) => {
    const session = await createLogoSphereProofSession(page);
    const scrubber = page.getByRole("slider", { name: "Playback position" });
    if (!(await scrubber.isVisible())) {
      await page
        .locator('[data-toolcraft-control-target="panels.timeline.extended"]')
        .getByRole("switch")
        .click();
    }
    await scrubber.press("End");
    await scrubber.press("ArrowLeft");
    await waitForLogoSphereDraw(page);
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction("motion.spinAxis", chooseLastSegment),
      {
        requirementId: "motion.spin-axis",
        selector: logoSphereCanvasSelector,
        stabilityIntervalMs: 0,
      },
    );
    await expectToolcraftSegmentedControlCellsPreservePadding(
      page,
      "Spin axis",
      {
        requirementId: "motion.spin-axis",
        target: "motion.spinAxis",
      },
    );
  },
);

test(
  "browser: motion.spin-turns updates logo sphere product output",
  async ({ page }) => {
    const session = await createLogoSphereProofSession(page);
    const scrubber = page.getByRole("slider", { name: "Playback position" });
    if (!(await scrubber.isVisible())) {
      await page
        .locator('[data-toolcraft-control-target="panels.timeline.extended"]')
        .getByRole("switch")
        .click();
    }
    await scrubber.press("End");
    await scrubber.press("ArrowLeft");
    await waitForLogoSphereDraw(page);
    for (const applicabilityCase of getLogoSphereApplicabilityCases(
      "motion.spinAmount",
    )) {
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
        { baseRequirementId: "motion.spin-turns" },
      );
      await page
        .locator('[data-toolcraft-control-target="motion.spinAmount"]')
        .getByRole("slider")
        .press("Home");
      await waitForLogoSphereDraw(page);
      await expectToolcraftProductObservableToChange(
        session,
        session.controlAction("motion.spinAmount", moveSliderToEnd),
        {
          requirementId: getLogoSphereApplicabilityRequirementId(
            "motion.spin-turns",
            applicabilityCase,
          ),
          selector: logoSphereCanvasSelector,
          stabilityIntervalMs: 0,
        },
      );
    }
  },
);

test(
  "browser: motion.inertia updates logo sphere product output",
  async ({ page }) => {
    const session = await createLogoSphereProofSession(page);
    for (const applicabilityCase of getLogoSphereApplicabilityCases(
      "motion.inertia",
    )) {
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
        { baseRequirementId: "motion.inertia" },
      );
      await page
        .locator('[data-toolcraft-control-target="motion.inertia"]')
        .getByRole("slider")
        .press("Home");
      await expectToolcraftProductObservableToChange(
        session,
        session.controlAction(
          "motion.inertia",
          async (control, currentPage) => {
            await moveSliderToEnd(control);
            const canvas = currentPage.locator(logoSphereCanvasSelector);
            const box = await canvas.boundingBox();
            expect(box).not.toBeNull();
            if (!box) return;
            const x = box.x + box.width / 2;
            const y = box.y + box.height / 2;
            await currentPage.mouse.move(x, y);
            await currentPage.mouse.down();
            await currentPage.mouse.move(x + 72, y - 18, { steps: 8 });
            await currentPage.mouse.up();
            await currentPage.waitForTimeout(100);
          },
        ),
        {
          requirementId: getLogoSphereApplicabilityRequirementId(
            "motion.inertia",
            applicabilityCase,
          ),
          selector: logoSphereCanvasSelector,
          stabilityIntervalMs: 0,
        },
      );
    }
  },
);
