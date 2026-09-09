import { expectToolcraftBackgroundOutputSemantics } from "./browser-background-output-evidence";
import { expectToolcraftControlApplicabilityState } from "./browser-control-applicability-evidence";
import {
  expectToolcraftInfinityCanvasBackgroundEvidence,
  observeInfinityCanvasBackground,
} from "./browser-infinity-canvas-evidence";
import { inspectToolcraftImageDownload } from "./image-artifact-inspection";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import {
  getLogoSphereApplicabilityCases,
  getLogoSphereApplicabilityRequirementId,
  selectLogoSphereApplicabilityCase,
} from "./logo-sphere-applicability-helpers";
import {
  createLogoSphereProofSession,
  logoSphereCanvasSelector,
  waitForLogoSphereDraw,
} from "./logo-sphere-test-helpers";
import { test } from "./toolcraft-product-test";

test.setTimeout(120_000);

function observeBackgroundPreview(root: HTMLElement): {
  backgroundVisible: boolean;
  outputSignature: string;
} {
  const backgroundSwitch = root.querySelector<HTMLElement>(
    '[data-toolcraft-control-target="export.includeBackground"] [role="switch"]',
  );
  const canvas = root.querySelector<HTMLCanvasElement>(
    'canvas[data-toolcraft-product-output="logo-sphere"]',
  );
  const sample = document.createElement("canvas");
  sample.width = sample.height = 1;
  const context = sample.getContext("2d", { willReadFrequently: true });
  if (canvas && context) context.drawImage(canvas, 0, 0, 1, 1, 0, 0, 1, 1);
  const alpha = context?.getImageData(0, 0, 1, 1).data[3] ?? -1;
  const backgroundVisible =
    backgroundSwitch?.getAttribute("aria-checked") === "true";
  return {
    backgroundVisible,
    outputSignature: `${backgroundVisible}:${alpha}`,
  };
}

test(
  "browser: background controls update preview Infinity and image export",
  async ({ page }) => {
    const session = await createLogoSphereProofSession(page);
    const excludeBackground = session.controlAction(
      "export.includeBackground",
      async (control) => {
        await control.getByRole("switch").click();
      },
    );
    const exportImage = session.targetAction(
      "actions.output",
      async (currentPage) => {
        const pending = currentPage.waitForEvent("download");
        await currentPage.getByRole("button", { name: "Export PNG" }).click();
        return pending;
      },
    );

    await expectToolcraftBackgroundOutputSemantics(
      session.observe(observeBackgroundPreview),
      excludeBackground,
      { backgroundVisible: false, outputSignature: "false:0" },
      exportImage,
      async (download) => {
        const inspected = await inspectToolcraftImageDownload({
          backgroundRgba: [0, 0, 0, 0],
          download,
          page,
        });
        return {
          ...inspected.inspection,
          backgroundAlpha: inspected.observation.normalizedPixels[3] ?? -1,
        };
      },
      {
        requirementId: "background.output",
        stabilityIntervalMs: 0,
      },
    );

    const backgroundExcluded = await observeInfinityCanvasBackground(page);
    await page
      .locator('[data-toolcraft-control-target="export.includeBackground"]')
      .getByRole("switch")
      .click();
    const backgroundRestored = await observeInfinityCanvasBackground(page);
    await page
      .locator('[data-toolcraft-control-target="canvas.infinity"]')
      .getByRole("switch")
      .click();
    const infinite = await observeInfinityCanvasBackground(page);
    await expectToolcraftInfinityCanvasBackgroundEvidence(
      { backgroundExcluded, backgroundRestored, infinite },
      {
        expectedBackgroundColor: "#F5F4F1",
        requirementId: "background.output",
        target: "export.includeBackground",
      },
    );
  },
);

test(
  "browser: background.color updates logo sphere product output",
  async ({ page }) => {
    const session = await createLogoSphereProofSession(page);
    for (const applicabilityCase of getLogoSphereApplicabilityCases(
      "appearance.background",
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
        { baseRequirementId: "background.color" },
      );

      const colorInput = page
        .locator('[data-toolcraft-control-target="appearance.background"]')
        .locator("input")
        .last();
      await colorInput.fill("#F5F4F1");
      await colorInput.press("Enter");
      await waitForLogoSphereDraw(page);

      await expectToolcraftProductObservableToChange(
        session,
        session.controlAction(
          "appearance.background",
          async (control, currentPage) => {
            const input = control.locator("input").last();
            await input.fill("#172033");
            await input.press("Enter");
            if (applicabilityCase.selectorValue === false) {
              await currentPage
                .locator(
                  '[data-toolcraft-control-target="export.includeBackground"]',
                )
                .getByRole("switch")
                .click();
            }
          },
        ),
        {
          requirementId: getLogoSphereApplicabilityRequirementId(
            "background.color",
            applicabilityCase,
          ),
          selector: logoSphereCanvasSelector,
          stabilityIntervalMs: 0,
        },
      );
    }
    await waitForLogoSphereDraw(page);
  },
);
