import {
  getToolcraftApplicabilityRequirementId,
  getToolcraftControlApplicabilityCases,
} from "../src/app/app-acceptance";
import {
  appControlSectionInventory,
  DISPERSION_CAROUSEL_APPEARANCE_BROWSER_TEST,
} from "../src/app/app-acceptance-data";
import { appSchema } from "../src/app/app-schema";
import { expectToolcraftControlApplicabilityState } from "./browser-control-applicability-evidence";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import {
  createDispersionCarouselBranchAction,
  dispersionCarouselTarget,
  getDispersionCarouselAcceptanceRow,
  openCleanDispersionCarousel,
  productSelector,
} from "./dispersion-carousel-test-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { test } from "./toolcraft-product-test";

test.setTimeout(120_000);

test(DISPERSION_CAROUSEL_APPEARANCE_BROWSER_TEST, async ({ page }) => {
  await openCleanDispersionCarousel(page);
  const session = await createToolcraftBrowserProofSession(page);
  const target = dispersionCarouselTarget.background;
  const row = getDispersionCarouselAcceptanceRow(target);
  const applicabilityCases = getToolcraftControlApplicabilityCases({
    schema: appSchema,
    sectionInventory: appControlSectionInventory,
    target,
  });
  let visibleCaseIndex = 0;
  for (const applicabilityCase of applicabilityCases) {
    await expectToolcraftControlApplicabilityState(
      session,
      createDispersionCarouselBranchAction(session, applicabilityCase),
      applicabilityCase,
      { baseRequirementId: row.id },
    );
    if (applicabilityCase.expectation === "hidden") continue;
    const requirementId = getToolcraftApplicabilityRequirementId(
      row.id,
      applicabilityCase,
    );
    const nextColor = visibleCaseIndex === 0 ? "#9CEFD6" : "#F6B6DC";
    visibleCaseIndex += 1;
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction(target, async (control) => {
        const input = control.getByRole("textbox").first();
        await input.fill(nextColor);
        await input.press("Enter");
      }),
      { requirementId, selector: productSelector },
    );
  }
});
