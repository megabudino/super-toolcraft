import type { Locator, Page } from "@playwright/test";

import {
  appControlSectionInventory,
  getToolcraftApplicabilityRequirementId,
  getToolcraftControlApplicabilityCases,
  type ToolcraftControlApplicabilityCase,
} from "../src/app/app-acceptance";
import { appSchema } from "../src/app/app-schema";

export function getLogoSphereApplicabilityCases(
  target: string,
): readonly ToolcraftControlApplicabilityCase[] {
  return getToolcraftControlApplicabilityCases({
    schema: appSchema,
    sectionInventory: appControlSectionInventory,
    target,
  });
}

export function getLogoSphereApplicabilityRequirementId(
  requirementId: string,
  applicabilityCase: ToolcraftControlApplicabilityCase,
): string {
  return getToolcraftApplicabilityRequirementId(
    requirementId,
    applicabilityCase,
  );
}

export async function selectLogoSphereApplicabilityCase(
  control: Locator,
  page: Page,
  applicabilityCase: ToolcraftControlApplicabilityCase,
): Promise<void> {
  const optionLabel = applicabilityCase.selectorOptionLabel;

  switch (applicabilityCase.selectorControlType) {
    case "checkbox":
    case "switch": {
      const input = control.getByRole(applicabilityCase.selectorControlType);
      if (
        (await input.getAttribute("aria-checked")) !==
        String(applicabilityCase.selectorValue)
      ) {
        await input.click();
      }
      return;
    }
    case "imagePicker":
    case "segmented":
      if (!optionLabel) throw new Error("Segmented case requires a label.");
      await control
        .getByRole("button", { exact: true, name: optionLabel })
        .click();
      return;
    case "select": {
      if (!optionLabel) throw new Error("Select case requires a label.");
      await control.getByRole("combobox").click();
      await page
        .locator('[data-slot="select-item"]:visible')
        .filter({ hasText: optionLabel })
        .click();
      return;
    }
    case "slider": {
      const slider = control.getByRole("slider");
      await slider.focus();
      const minimum = Number(await slider.getAttribute("aria-valuemin"));
      const maximum = Number(await slider.getAttribute("aria-valuemax"));
      const desired = Number(applicabilityCase.selectorValue);
      await slider.press(
        desired === minimum ? "Home" : desired === maximum ? "End" : "Home",
      );
      while (Number(await slider.getAttribute("aria-valuenow")) < desired) {
        await slider.press("ArrowRight");
      }
      return;
    }
    case "tabs":
      if (!optionLabel) throw new Error("Tabs case requires a label.");
      await control.getByRole("tab", { exact: true, name: optionLabel }).click();
  }
}
