import type { Locator, Page } from "@playwright/test";

import {
  getToolcraftApplicabilityRequirementId,
  getToolcraftControlApplicabilityCases,
  type ToolcraftControlApplicabilityCase,
} from "../src/app/app-acceptance";
import {
  appAcceptance,
  appControlSectionInventory,
} from "../src/app/app-acceptance-data";
import { appSchema } from "../src/app/app-schema";
import { heroDispersionTargets } from "../src/app/hero-dispersion-values";
import { expectToolcraftReferenceParity } from "./browser-acceptance-outcome-helpers";
import { expectToolcraftControlApplicabilityState } from "./browser-control-applicability-evidence";
import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expectToolcraftSegmentedControlCellsPreservePadding } from "./performance-control-layout-helpers";
import { expect, test } from "./toolcraft-product-test";

export const heroPreviewSelector =
  '[data-toolcraft-product-output="hero-external-preview"]';
export const heroFrameSelector =
  'iframe[title="Recraft hero website preview"]';

type HeroPreviewControlAction = Readonly<{
  action:
    | "color"
    | "motion-slider"
    | "numeric-input"
    | "segmented"
    | "slider"
    | "switch"
    | "text";
  target: string;
  value?: string;
}>;

export type HeroPreviewControlCase = Readonly<{
  acceptanceId: string;
  action: HeroPreviewControlAction["action"];
  observableSelector?: string;
  prerequisites?: readonly HeroPreviewControlAction[];
  value?: string;
}>;

export async function waitForWebsitePreview(
  page: Page,
  timeoutMs = 15_000,
): Promise<void> {
  const preview = page.frameLocator(heroFrameSelector);
  await expect(
    preview.getByRole("heading", { name: "Recraft Styles" }),
  ).toBeVisible({ timeout: timeoutMs });
  await expect(
    preview.locator('[data-hero-gallery][data-hero-gallery-ready="true"]'),
  ).toHaveCount(1, { timeout: timeoutMs });
}

async function selectApplicabilityBranch(
  control: Locator,
  applicabilityCase: ToolcraftControlApplicabilityCase,
): Promise<void> {
  if (
    applicabilityCase.selectorControlType === "switch" ||
    applicabilityCase.selectorControlType === "checkbox"
  ) {
    const selector = control.getByRole(applicabilityCase.selectorControlType);
    const desired = String(applicabilityCase.selectorValue);
    if ((await selector.getAttribute("aria-checked")) !== desired) {
      await selector.click();
    }
    return;
  }

  if (
    applicabilityCase.selectorControlType === "segmented" ||
    applicabilityCase.selectorControlType === "imagePicker"
  ) {
    if (!applicabilityCase.selectorOptionLabel) {
      throw new Error(
        `Missing option label for ${applicabilityCase.selectorTarget}.`,
      );
    }
    const option = control.getByRole("button", {
      name: applicabilityCase.selectorOptionLabel,
    });
    if ((await option.getAttribute("aria-pressed")) !== "true") {
      await option.click();
    }
    return;
  }

  throw new Error(
    `Unsupported hero applicability selector ${applicabilityCase.selectorControlType}.`,
  );
}

async function revealApplicabilitySelector(
  page: Page,
  selectorTarget: string,
): Promise<void> {
  if (selectorTarget !== heroDispersionTargets.warpWaveKind) return;

  const waveControl = await getToolcraftControlFieldByTarget(
    page,
    heroDispersionTargets.warpWaveEnabled,
  );
  const waveSwitch = waveControl.getByRole("switch");
  if ((await waveSwitch.getAttribute("aria-checked")) !== "true") {
    await waveSwitch.click();
  }
}

async function applyPrerequisites(
  page: Page,
  prerequisites: readonly HeroPreviewControlAction[],
  acceptanceId: string,
): Promise<void> {
  for (const prerequisite of prerequisites) {
    const control = await getToolcraftControlFieldByTarget(
      page,
      prerequisite.target,
    );
    if (prerequisite.action === "switch") {
      const selector = control.getByRole("switch");
      if ((await selector.getAttribute("aria-checked")) !== "true") {
        await selector.click();
      }
      continue;
    }
    if (prerequisite.action === "segmented" && prerequisite.value) {
      const option = control.getByRole("button", { name: prerequisite.value });
      if ((await option.getAttribute("aria-pressed")) !== "true") {
        await option.click();
      }
      continue;
    }
    throw new Error(`Unsupported prerequisite for ${acceptanceId}.`);
  }
}

async function expectReferenceEffectSurfaceParity(
  page: Page,
  requirementId: string,
  target: string,
): Promise<void> {
  const preview = page.frameLocator(heroFrameSelector);
  const gallery = preview.locator(
    '[data-hero-gallery][data-hero-gallery-ready="true"]',
  );
  if ((await gallery.getAttribute("data-hero-gallery")) === "sphere") {
    await expectToolcraftReferenceParity(
      async () => {
        const [effect, passes, renderer, readyCanvasCount, rowCanvasCount] =
          await Promise.all([
            gallery.getAttribute("data-hero-gallery-effect"),
            gallery.getAttribute("data-hero-gallery-passes"),
            gallery.getAttribute("data-hero-gallery-renderer"),
            gallery
              .locator(
                '[data-hero-gallery-canvas][data-dispersion-ready="true"]',
              )
              .count(),
            gallery.locator("[data-hero-dispersion-canvas]").count(),
          ]);
        return { effect, passes, readyCanvasCount, renderer, rowCanvasCount };
      },
      {
        effect: "post",
        passes: "scene→field→post",
        readyCanvasCount: 1,
        renderer: "webgl",
        rowCanvasCount: 0,
      },
      { requirementId, target },
    );
    return;
  }

  await expect
    .poll(() =>
      preview.locator("[data-hero-card]").evaluateAll((cards) => {
        const scene = cards[0]?.closest<HTMLElement>("[data-hero-scene]");
        if (!scene) return { sceneReady: false, visibleNotReady: -1 };
        const viewport = scene.getBoundingClientRect();
        return {
          sceneReady: true,
          visibleNotReady: cards.filter((card) => {
            const bounds = card.getBoundingClientRect();
            const isVisible =
              bounds.right > viewport.left && bounds.left < viewport.right;
            return (
              isVisible &&
              card.querySelector('[data-dispersion-ready="true"]') === null
            );
          }).length,
        };
      }),
    )
    .toEqual({ sceneReady: true, visibleNotReady: 0 });
  await expectToolcraftReferenceParity(
    async () => {
      const [cardCount, leftCount, rightCount, hasReadySurfaces] = await Promise.all([
        preview.locator("[data-hero-card]").count(),
        preview.locator('[data-hero-card="left"]').count(),
        preview.locator('[data-hero-card="right"]').count(),
        preview
          .locator('[data-dispersion-ready="true"]')
          .count()
          .then((count) => count > 0),
      ]);
      return { cardCount, hasReadySurfaces, leftCount, rightCount };
    },
    { cardCount: 16, hasReadySurfaces: true, leftCount: 8, rightCount: 8 },
    { requirementId, target },
  );
}

async function expectCenteredSafetyCorridor(
  page: Page,
  expectedWidth: number,
): Promise<void> {
  const preview = page.frameLocator(heroFrameSelector);
  await expect
    .poll(() =>
      preview.locator("[data-hero-card-row]").evaluateAll(
        (rows, expected) => {
          const left = rows.find(
            (row) => row.getAttribute("data-hero-card-row") === "left",
          );
          const right = rows.find(
            (row) => row.getAttribute("data-hero-card-row") === "right",
          );
          const scene = left?.closest<HTMLElement>("[data-hero-scene]");
          if (!left || !right || !scene) return false;

          const leftBounds = left.getBoundingClientRect();
          const rightBounds = right.getBoundingClientRect();
          const sceneBounds = scene.getBoundingClientRect();
          const corridorWidth = rightBounds.left - leftBounds.right;
          const corridorCenter = (rightBounds.left + leftBounds.right) / 2;
          const sceneCenter = (sceneBounds.left + sceneBounds.right) / 2;

          return (
            Math.abs(corridorWidth - expected) <= 1 &&
            Math.abs(corridorCenter - sceneCenter) <= 1
          );
        },
        expectedWidth,
      ),
    )
    .toBe(true);
}

async function applyControlCaseAction(
  controlCase: HeroPreviewControlCase,
  control: Locator,
  currentPage: Page,
): Promise<void> {
  if (controlCase.action === "switch") {
    await control.getByRole("switch").click();
    return;
  }
  if (controlCase.action === "color") {
    if (!controlCase.value) {
      throw new Error(`${controlCase.acceptanceId} requires a color value.`);
    }
    const input = control.locator('input[type="text"]').first();
    await input.fill(controlCase.value);
    await input.press("Enter");
    return;
  }
  if (controlCase.action === "text") {
    if (!controlCase.value) {
      throw new Error(`${controlCase.acceptanceId} requires a text value.`);
    }
    const input = control.getByRole("textbox").first();
    await input.fill(controlCase.value);
    await input.press("Enter");
    return;
  }
  if (controlCase.action === "segmented") {
    if (!controlCase.value) {
      throw new Error(
        `${controlCase.acceptanceId} requires a segmented option label.`,
      );
    }
    const preferred = control.getByRole("button", {
      name: controlCase.value,
    });
    if ((await preferred.getAttribute("aria-pressed")) === "true") {
      await control.locator('button[aria-pressed="false"]').first().click();
    } else {
      await preferred.click();
    }
    return;
  }
  if (controlCase.action === "motion-slider") {
    await control.getByRole("slider").press("ArrowRight");
    const gapControl = await getToolcraftControlFieldByTarget(
      currentPage,
      "cards.gap",
    );
    const gapSlider = gapControl.getByRole("slider");
    await gapSlider.press("ArrowRight");
    await currentPage.evaluate(
      () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
    );
    await gapSlider.press("ArrowLeft");
    return;
  }
  if (controlCase.action === "numeric-input") {
    if (!controlCase.value) {
      throw new Error(`${controlCase.acceptanceId} requires a numeric value.`);
    }
    await control.getByRole("button", { name: /Edit .* value/ }).click();
    const input = control.getByRole("textbox");
    await input.fill(controlCase.value);
    await input.press("Enter");
    return;
  }
  const slider = control.getByRole("slider");
  const [current, maximum] = await Promise.all([
    slider.getAttribute("aria-valuenow"),
    slider.getAttribute("max"),
  ]);
  const currentNumber = Number(current);
  const maximumNumber = Number(maximum);
  await slider.press(currentNumber < maximumNumber ? "End" : "Home");
}

export function registerHeroPreviewControlTests(
  controlCases: readonly HeroPreviewControlCase[],
): void {
  test.setTimeout(60_000);
  for (const controlCase of controlCases) {
    const acceptance = appAcceptance.find(
      (entry) => entry.id === controlCase.acceptanceId,
    );
    const acceptanceTarget = acceptance?.target;
    if (!acceptance || !acceptanceTarget) {
      throw new Error(
        `Missing target-backed acceptance ${controlCase.acceptanceId}.`,
      );
    }
    const applicabilityCases = getToolcraftControlApplicabilityCases({
      schema: appSchema,
      sectionInventory: appControlSectionInventory,
      target: acceptanceTarget,
    });

    test(acceptance.browserTestName, async ({ page }) => {
      if (controlCase.action !== "motion-slider") {
        await page.emulateMedia({ reducedMotion: "reduce" });
      }
      await page.goto("/");
      await waitForWebsitePreview(page);
      const session = await createToolcraftBrowserProofSession(page);
      const prerequisites = controlCase.prerequisites ?? [];

      const verifyVisibleControl = async (requirementId: string) => {
        await waitForWebsitePreview(page);
        await expectToolcraftProductObservableToChange(
          session,
          session.controlAction(
            acceptanceTarget,
            async (control, currentPage) =>
              applyControlCaseAction(controlCase, control, currentPage),
          ),
          {
            requirementId,
            selector: controlCase.observableSelector ?? heroPreviewSelector,
            stabilityIntervalMs: 50,
            stabilitySamples: 2,
            timeoutMs: 10_000,
          },
        );

        if (
          acceptanceTarget === "cards.safetyWidth" &&
          controlCase.value
        ) {
          await expectCenteredSafetyCorridor(
            page,
            Number(controlCase.value),
          );
        }

        if (controlCase.action === "segmented") {
          await expectToolcraftSegmentedControlCellsPreservePadding(
            page,
            acceptanceTarget,
            { requirementId, target: acceptanceTarget },
          );
        }
        if (acceptance.referenceCoverage) {
          await expectReferenceEffectSurfaceParity(
            page,
            requirementId,
            acceptanceTarget,
          );
        }
      };

      if (applicabilityCases.length === 0) {
        await applyPrerequisites(page, prerequisites, controlCase.acceptanceId);
        await verifyVisibleControl(acceptance.id);
        return;
      }

      for (const applicabilityCase of applicabilityCases) {
        await applyPrerequisites(page, prerequisites, controlCase.acceptanceId);
        await revealApplicabilitySelector(
          page,
          applicabilityCase.selectorTarget,
        );
        await expectToolcraftControlApplicabilityState(
          session,
          session.controlAction(
            applicabilityCase.selectorTarget,
            async (control) =>
              selectApplicabilityBranch(control, applicabilityCase),
          ),
          applicabilityCase,
          { baseRequirementId: acceptance.id },
        );

        if (applicabilityCase.expectation === "visible") {
          if (controlCase.action === "slider") {
            const control = await getToolcraftControlFieldByTarget(
              page,
              acceptanceTarget,
            );
            await control.getByRole("slider").press("Home");
            await page.evaluate(
              () =>
                new Promise<void>((resolve) =>
                  requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
                ),
            );
          }
          await verifyVisibleControl(
            getToolcraftApplicabilityRequirementId(
              acceptance.id,
              applicabilityCase,
            ),
          );
        }
      }
    });
  }
}
