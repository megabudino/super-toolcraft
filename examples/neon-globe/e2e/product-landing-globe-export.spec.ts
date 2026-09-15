import { expectToolcraftExportedArtifact } from "./browser-acceptance-outcome-helpers";
import { expectToolcraftControlApplicabilityState } from "./browser-control-applicability-evidence";
import { expectToolcraftImageExportArtifact } from "./browser-media-export-evidence";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expect, test } from "./toolcraft-product-test";
import {
  ACTIONS_TARGET,
  BLACK,
  GRID_EXPORT_BOUNDS,
  applicabilityRequirementId,
  chooseSelectOption,
  exportImage,
  inspectImage,
  readImageDimensions,
} from "./product-landing-globe-helpers";

test.setTimeout(180_000);

test("browser: image export format changes runtime output encoding", async ({
  page,
}) => {
  await page.goto("/");
  const session = await createToolcraftBrowserProofSession(page);
  const cases = [
    { label: "2K", value: "2k" },
    { label: "4K", value: "4k" },
    { label: "8K", value: "8k" },
  ] as const;

  for (const { label, value } of cases) {
    await expectToolcraftControlApplicabilityState(
      session,
      session.controlAction("export.image.resolution", (control) =>
        chooseSelectOption(control, label),
      ),
      {
        expectation: "visible",
        selectorControlType: "select",
        selectorLabel: "Resolution",
        selectorOptionLabel: label,
        selectorTarget: "export.image.resolution",
        selectorValue: value,
        target: "export.image.format",
      },
      { baseRequirementId: "export.image.format" },
    );
    await chooseSelectOption(
      page.locator(`[data-toolcraft-control-target="export.image.format"]`),
      "JPG",
    );
    await expectToolcraftExportedArtifact(
      session.targetAction("export.image.format", (currentPage) =>
        exportImage(currentPage),
      ),
      async (download) => {
        const inspected = await inspectImage(page, download);
        expect(inspected.inspection.mediaType).toBe("image/jpeg");
        return inspected.inspection;
      },
      {
        requirementId: applicabilityRequirementId(
          "export.image.format",
          "export.image.resolution",
          value,
        ),
      },
    );
    if (value !== "8k") {
      await chooseSelectOption(
        page.locator(`[data-toolcraft-control-target="export.image.format"]`),
        "PNG",
      );
    }
  }
});

test("browser: image export resolution changes artifact dimensions", async ({
  page,
}) => {
  await page.goto("/");
  const session = await createToolcraftBrowserProofSession(page);
  const cases = [
    { expectedMediaType: "image/png", label: "PNG", value: "png" },
    { expectedMediaType: "image/jpeg", label: "JPG", value: "jpg" },
  ] as const;

  for (const { expectedMediaType, label, value } of cases) {
    await expectToolcraftControlApplicabilityState(
      session,
      session.controlAction("export.image.format", (control) =>
        chooseSelectOption(control, label),
      ),
      {
        expectation: "visible",
        selectorControlType: "select",
        selectorLabel: "Format",
        selectorOptionLabel: label,
        selectorTarget: "export.image.format",
        selectorValue: value,
        target: "export.image.resolution",
      },
      { baseRequirementId: "export.image.resolution" },
    );
    await chooseSelectOption(
      page.locator(`[data-toolcraft-control-target="export.image.resolution"]`),
      "2K",
    );
    await expectToolcraftExportedArtifact(
      session.targetAction("export.image.resolution", (currentPage) =>
        exportImage(currentPage),
      ),
      async (download) => {
        const inspection = await readImageDimensions(page, download);
        expect(inspection.mediaType).toBe(expectedMediaType);
        expect(inspection.width).toBe(2048);
        expect(inspection.height).toBe(1152);
        return inspection;
      },
      {
        requirementId: applicabilityRequirementId(
          "export.image.resolution",
          "export.image.format",
          value,
        ),
      },
    );
    if (value !== "jpg") {
      await chooseSelectOption(
        page.locator(`[data-toolcraft-control-target="export.image.resolution"]`),
        "4K",
      );
    }
  }
});

test("browser: export png downloads configured landing globe image", async ({
  page,
}) => {
  await page.goto("/");
  const session = await createToolcraftBrowserProofSession(page);
  await expectToolcraftImageExportArtifact(
    session.targetAction(ACTIONS_TARGET, (currentPage) => exportImage(currentPage)),
    {
      additionalArtifactRequirements: [],
      backgroundRgba: BLACK,
      expectedBounds: GRID_EXPORT_BOUNDS,
      expectedHeight: 2304,
      expectedMediaType: "image/png",
      expectedPixels: [
        { rgba: [236, 236, 236, 255], xRatio: 30 / 64, yRatio: 10 / 64 },
      ],
      expectedWidth: 4096,
      page,
      requirementId: "export.image",
    },
  );
});
