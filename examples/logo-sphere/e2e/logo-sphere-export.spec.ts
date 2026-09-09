import { expectToolcraftControlApplicabilityState } from "./browser-control-applicability-evidence";
import { expectToolcraftImageExportArtifact } from "./browser-media-export-evidence";
import {
  getLogoSphereApplicabilityCases,
  getLogoSphereApplicabilityRequirementId,
  selectLogoSphereApplicabilityCase,
} from "./logo-sphere-applicability-helpers";
import {
  chooseFirstSelectOption,
  chooseLastSelectOption,
  chooseSecondSelectOption,
  createLogoSphereProofSession,
  waitForLogoSphereDraw,
} from "./logo-sphere-test-helpers";
import { test } from "./toolcraft-product-test";

test.setTimeout(300_000);

const imageBounds = {
  height: 0.65625,
  width: 0.375,
  x: 0.3125,
  y: 0.171875,
} as const;

const imageDimensions = {
  "2k": { height: 1152, width: 2048 },
  "4k": { height: 2304, width: 4096 },
  "8k": { height: 4608, width: 8192 },
} as const;

const selectCases = [
  ["export.image-format", "export.image.format"],
  ["export.image-resolution", "export.image.resolution"],
] as const;

for (const [requirementId, target] of selectCases) {
  test(
    `browser: ${requirementId} updates logo sphere product output`,
    async ({ page }) => {
      const session = await createLogoSphereProofSession(page);
      const scrubber = page.getByRole("slider", { name: "Playback position" });
      if (!(await scrubber.isVisible())) {
        await page
          .locator('[data-toolcraft-control-target="panels.timeline.extended"]')
          .getByRole("switch")
          .click();
      }
      await scrubber.press("Home");
      await waitForLogoSphereDraw(page);
      const control = page.locator(
        `[data-toolcraft-control-target="${target}"]`,
      );
      for (const applicabilityCase of getLogoSphereApplicabilityCases(target)) {
        await expectToolcraftControlApplicabilityState(
          session,
          session.controlAction(
            applicabilityCase.selectorTarget,
            (selectorControl, currentPage) =>
              selectLogoSphereApplicabilityCase(
                selectorControl,
                currentPage,
                applicabilityCase,
              ),
          ),
          applicabilityCase,
          { baseRequirementId: requirementId },
        );
        await chooseFirstSelectOption(control, page);
        const caseRequirementId = getLogoSphereApplicabilityRequirementId(
          requirementId,
          applicabilityCase,
        );
        const selectedFormat =
          target === "export.image.format"
            ? "jpg"
            : String(applicabilityCase.selectorValue);
        const selectedResolution =
          target === "export.image.resolution"
            ? "4k"
            : String(applicabilityCase.selectorValue);
        const dimensions =
          imageDimensions[selectedResolution as keyof typeof imageDimensions];
        await expectToolcraftImageExportArtifact(
          session.controlAction(target, async (targetControl, currentPage) => {
            if (target === "export.image.resolution") {
              await chooseSecondSelectOption(targetControl, currentPage);
            } else {
              await chooseLastSelectOption(targetControl, currentPage);
            }
            const pending = currentPage.waitForEvent("download");
            await currentPage
              .getByRole("button", { name: "Export PNG" })
              .click();
            return pending;
          }),
          {
            additionalArtifactRequirements: [
              { requirementId: caseRequirementId, target },
            ],
            backgroundRgba: [245, 244, 241, 255],
            expectedBounds: imageBounds,
            expectedHeight: dimensions.height,
            expectedMediaType:
              selectedFormat === "jpg" ? "image/jpeg" : "image/png",
            expectedPixels: [
              {
                rgba: [246, 37, 47, 255],
                xRatio: 0.5,
                yRatio: 0.3125,
              },
            ],
            expectedWidth: dimensions.width,
            page,
            requirementId: caseRequirementId,
          },
        );
      }
    },
  );
}

test(
  "browser: image export produces decoded non-empty logo sphere artifacts",
  async ({ page }) => {
    const session = await createLogoSphereProofSession(page);
    const scrubber = page.getByRole("slider", { name: "Playback position" });
    if (!(await scrubber.isVisible())) {
      await page
        .locator('[data-toolcraft-control-target="panels.timeline.extended"]')
        .getByRole("switch")
        .click();
    }
    await scrubber.press("Home");
    await waitForLogoSphereDraw(page);

    await expectToolcraftImageExportArtifact(
      session.targetAction("actions.output", async (currentPage) => {
        const pending = currentPage.waitForEvent("download");
        await currentPage.getByRole("button", { name: "Export PNG" }).click();
        return pending;
      }),
      {
        backgroundRgba: [245, 244, 241, 255],
        expectedBounds: imageBounds,
        expectedHeight: 2304,
        expectedMediaType: "image/png",
        expectedPixels: [
          {
            rgba: [246, 37, 47, 255],
            xRatio: 0.5,
            yRatio: 0.3125,
          },
        ],
        expectedWidth: 4096,
        page,
        requirementId: "export.image",
      },
    );
  },
);
