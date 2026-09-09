import {
  getToolcraftApplicabilityRequirementId,
  getToolcraftControlApplicabilityCases,
} from "../src/app/app-acceptance";
import {
  appAcceptance,
  appControlSectionInventory,
} from "../src/app/app-acceptance-data";
import { appSchema } from "../src/app/app-schema";
import { expectToolcraftControlApplicabilityState } from "./browser-control-applicability-evidence";
import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import {
  heroFrameSelector,
  heroPreviewSelector,
  registerHeroPreviewControlTests,
  waitForWebsitePreview,
} from "./hero-preview-browser-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";

registerHeroPreviewControlTests([
  { acceptanceId: "background.enabled", action: "switch" },
]);

const backgroundColorAcceptance = appAcceptance.find(
  (entry) => entry.id === "background.color",
);
if (!backgroundColorAcceptance?.target) {
  throw new Error("Missing target-backed background color acceptance.");
}
const backgroundColorCases = getToolcraftControlApplicabilityCases({
  schema: appSchema,
  sectionInventory: appControlSectionInventory,
  target: backgroundColorAcceptance.target,
});

test(backgroundColorAcceptance.browserTestName, async ({ page }) => {
  await page.goto("/");
  await waitForWebsitePreview(page);
  const session = await createToolcraftBrowserProofSession(page);

  for (const applicabilityCase of backgroundColorCases) {
    await expectToolcraftControlApplicabilityState(
      session,
      session.controlAction(
        applicabilityCase.selectorTarget,
        async (control) => {
          const selector = control.getByRole("switch");
          const desired = String(applicabilityCase.selectorValue);
          if ((await selector.getAttribute("aria-checked")) !== desired) {
            await selector.click();
          }
        },
      ),
      applicabilityCase,
      { baseRequirementId: backgroundColorAcceptance.id },
    );

    if (applicabilityCase.expectation === "visible") {
      const selectedColor =
        applicabilityCase.selectorValue === false ? "#7B2DFF" : "#22C55E";
      const expectedColor =
        applicabilityCase.selectorValue === false
          ? "rgb(123, 45, 255)"
          : "rgb(34, 197, 94)";
      await waitForWebsitePreview(page);
      await expectToolcraftProductObservableToChange(
        session,
        session.controlAction(
          backgroundColorAcceptance.target,
          async (control, currentPage) => {
            const input = control.locator('input[type="text"]').first();
            await input.fill(selectedColor);
            await input.press("Enter");
            if (applicabilityCase.selectorValue === false) {
              const backgroundControl = await getToolcraftControlFieldByTarget(
                currentPage,
                applicabilityCase.selectorTarget,
              );
              const backgroundSwitch = backgroundControl.getByRole("switch");
              if ((await backgroundSwitch.getAttribute("aria-checked")) !== "true") {
                await backgroundSwitch.click();
              }
            }
            await expect
              .poll(() =>
                currentPage
                  .frameLocator(heroFrameSelector)
                  .locator("section")
                  .first()
                  .evaluate((element) => getComputedStyle(element).backgroundColor),
              )
              .toBe(expectedColor);
          },
        ),
        {
          requirementId: getToolcraftApplicabilityRequirementId(
            backgroundColorAcceptance.id,
            applicabilityCase,
          ),
          selector: heroPreviewSelector,
          stabilityIntervalMs: 50,
          stabilitySamples: 2,
          timeoutMs: 10_000,
        },
      );
    }
  }
});
