import type { Download, Page } from "@playwright/test";

import {
  getToolcraftApplicabilityRequirementId,
  getToolcraftControlApplicabilityCases,
} from "../src/app/app-acceptance";
import {
  appControlSectionInventory,
  DISPERSION_CAROUSEL_ACTION_BROWSER_TEST,
  DISPERSION_CAROUSEL_BACKGROUND_EXPORT_BROWSER_TEST,
  DISPERSION_CAROUSEL_FORMAT_BROWSER_TEST,
  DISPERSION_CAROUSEL_RESOLUTION_BROWSER_TEST,
} from "../src/app/app-acceptance-data";
import { appSchema } from "../src/app/app-schema";
import {
  expectToolcraftExportedArtifact,
  expectToolcraftReferenceParity,
} from "./browser-acceptance-outcome-helpers";
import { expectToolcraftBackgroundOutputSemantics } from "./browser-background-output-evidence";
import { expectToolcraftControlApplicabilityState } from "./browser-control-applicability-evidence";
import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import {
  expectToolcraftInfinityCanvasBackgroundEvidence,
  observeInfinityCanvasBackground,
} from "./browser-infinity-canvas-evidence";
import { expectToolcraftImageExportArtifact } from "./browser-media-export-evidence";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import {
  carouselBackgroundRgba,
  chooseDispersionCarouselOption,
  createDispersionCarouselBranchAction,
  dispersionCarouselTarget,
  exportDispersionCarouselImage,
  getDispersionCarouselExpectedProductPixel,
  inspectDispersionCarouselImage,
  openCleanDispersionCarousel,
} from "./dispersion-carousel-test-helpers";
import { expect, test } from "./toolcraft-product-test";

test.setTimeout(180_000);

async function prepareImageExport(page: Page) {
  await openCleanDispersionCarousel(page);
  const session = await createToolcraftBrowserProofSession(page);
  const target = dispersionCarouselTarget;
  const format = await getToolcraftControlFieldByTarget(page, target.imageFormat);
  const resolution = await getToolcraftControlFieldByTarget(
    page,
    target.imageResolution,
  );
  await chooseDispersionCarouselOption(page, format, "PNG");
  await chooseDispersionCarouselOption(page, resolution, "2K");
  return { format, resolution, session, target };
}

test(DISPERSION_CAROUSEL_FORMAT_BROWSER_TEST, async ({ page }) => {
  const { session, target } = await prepareImageExport(page);
  const applicabilityCases = getToolcraftControlApplicabilityCases({
    schema: appSchema,
    sectionInventory: appControlSectionInventory,
    target: target.imageFormat,
  });
  for (const applicabilityCase of applicabilityCases) {
    await expectToolcraftControlApplicabilityState(
      session,
      createDispersionCarouselBranchAction(session, applicabilityCase),
      applicabilityCase,
      { baseRequirementId: target.imageFormat },
    );
    const requirementId = getToolcraftApplicabilityRequirementId(
      target.imageFormat,
      applicabilityCase,
    );
    await expectToolcraftExportedArtifact(
      session.controlAction(target.imageFormat, async (control, currentPage) => {
        await chooseDispersionCarouselOption(currentPage, control, "JPG");
        return exportDispersionCarouselImage(currentPage);
      }),
      async (download) =>
        (await inspectDispersionCarouselImage(page, download)).inspection,
      { requirementId },
    );
  }
});

test(DISPERSION_CAROUSEL_RESOLUTION_BROWSER_TEST, async ({ page }) => {
  const { session, target } = await prepareImageExport(page);
  const applicabilityCases = getToolcraftControlApplicabilityCases({
    schema: appSchema,
    sectionInventory: appControlSectionInventory,
    target: target.imageResolution,
  });
  for (const applicabilityCase of applicabilityCases) {
    await expectToolcraftControlApplicabilityState(
      session,
      createDispersionCarouselBranchAction(session, applicabilityCase),
      applicabilityCase,
      { baseRequirementId: target.imageResolution },
    );
    const requirementId = getToolcraftApplicabilityRequirementId(
      target.imageResolution,
      applicabilityCase,
    );
    await expectToolcraftExportedArtifact(
      session.controlAction(
        target.imageResolution,
        async (control, currentPage) => {
          await chooseDispersionCarouselOption(currentPage, control, "2K");
          return exportDispersionCarouselImage(currentPage);
        },
      ),
      async (download) =>
        (await inspectDispersionCarouselImage(page, download)).inspection,
      { requirementId },
    );
  }
});

test(DISPERSION_CAROUSEL_ACTION_BROWSER_TEST, async ({ page }) => {
  const { session } = await prepareImageExport(page);
  let actionDownload: Download | undefined;
  await expectToolcraftExportedArtifact(
    session.targetAction("actions.output", async (currentPage) => {
      actionDownload = await exportDispersionCarouselImage(currentPage);
      return actionDownload;
    }),
    async (download) =>
      (await inspectDispersionCarouselImage(page, download)).inspection,
    { requirementId: "export.actions" },
  );
  if (!actionDownload) throw new Error("The image export action did not download.");
  const inspectedAction = await inspectDispersionCarouselImage(
    page,
    actionDownload,
  );
  await expectToolcraftReferenceParity(
    async () => ({
      height: inspectedAction.inspection.height,
      mediaType: inspectedAction.inspection.mediaType,
      width: inspectedAction.inspection.width,
    }),
    { height: 1439, mediaType: "image/png", width: 2048 },
    { requirementId: "export.actions", target: "actions.output" },
  );
  expect(inspectedAction.inspection.nonBackgroundBounds).not.toBeNull();
  await expectToolcraftImageExportArtifact(
    session.targetAction("actions.output", async () => actionDownload!),
    {
      backgroundRgba: carouselBackgroundRgba,
      expectedBounds: inspectedAction.inspection.nonBackgroundBounds!,
      expectedHeight: 1439,
      expectedMediaType: "image/png",
      expectedPixels: [
        getDispersionCarouselExpectedProductPixel(
          inspectedAction.observation.normalizedPixels,
        ),
      ],
      expectedWidth: 2048,
      page,
      requirementId: "export.actions",
    },
  );
});

test(DISPERSION_CAROUSEL_BACKGROUND_EXPORT_BROWSER_TEST, async ({ page }) => {
  const { session, target } = await prepareImageExport(page);
  const include = await getToolcraftControlFieldByTarget(
    page,
    target.includeBackground,
  );
  const includeSwitch = include.getByRole("switch");
  if ((await includeSwitch.getAttribute("aria-checked")) !== "true") {
    await includeSwitch.click();
  }
  const observePreview = session.observe((root) => {
    const surface = root.querySelector<HTMLElement>(
      "[data-dispersion-carousel='true']",
    );
    const background = surface
      ? getComputedStyle(surface).backgroundColor
      : "missing";
    return {
      backgroundVisible: background !== "rgba(0, 0, 0, 0)",
      outputSignature: background,
    };
  });
  await expectToolcraftBackgroundOutputSemantics(
    observePreview,
    session.controlAction(target.includeBackground, (control) =>
      control.getByRole("switch").click(),
    ),
    {
      backgroundVisible: false,
      outputSignature: "rgba(0, 0, 0, 0)",
    },
    session.targetAction(target.includeBackground, (currentPage) =>
      exportDispersionCarouselImage(currentPage),
    ),
    async (download) => {
      const inspected = await inspectDispersionCarouselImage(page, download);
      return {
        ...inspected.inspection,
        backgroundAlpha: inspected.observation.normalizedPixels[3] ?? 255,
      };
    },
    { requirementId: target.includeBackground, timeoutMs: 120_000 },
  );

  const backgroundExcluded = await observeInfinityCanvasBackground(page);
  await includeSwitch.click();
  const backgroundRestored = await observeInfinityCanvasBackground(page);
  const infinity = await getToolcraftControlFieldByTarget(page, "canvas.infinity");
  await infinity.getByRole("switch").click();
  const infinite = await observeInfinityCanvasBackground(page);
  await infinity.getByRole("switch").click();
  await expectToolcraftInfinityCanvasBackgroundEvidence(
    { backgroundExcluded, backgroundRestored, infinite },
    {
      expectedBackgroundColor: "#FFFFFF",
      requirementId: target.includeBackground,
      target: target.includeBackground,
    },
  );
});
