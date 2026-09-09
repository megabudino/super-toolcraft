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
import { heroHeadingCtaTargets } from "../src/app/hero-heading-cta-values";
import { heroHeadingTargets } from "../src/app/hero-heading-values";
import { expectToolcraftControlApplicabilityState } from "./browser-control-applicability-evidence";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectToolcraftCompoundControlPartOutcome } from "./browser-state-evidence-helpers";
import {
  heroFrameSelector,
  registerHeroPreviewControlTests,
  waitForWebsitePreview,
} from "./hero-preview-browser-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";

registerHeroPreviewControlTests([
  {
    acceptanceId: heroHeadingTargets.badgeColor,
    action: "color",
    observableSelector: heroFrameSelector,
    value: "#FF00AA",
  },
  {
    acceptanceId: heroHeadingTargets.shadowEnabled,
    action: "switch",
    observableSelector: heroFrameSelector,
  },
  {
    acceptanceId: heroHeadingTargets.shadowBlur,
    action: "slider",
    observableSelector: heroFrameSelector,
    prerequisites: [
      { action: "switch", target: heroHeadingTargets.shadowEnabled },
    ],
  },
  {
    acceptanceId: heroHeadingTargets.shadowSpread,
    action: "slider",
    observableSelector: heroFrameSelector,
    prerequisites: [
      { action: "switch", target: heroHeadingTargets.shadowEnabled },
    ],
  },
  {
    acceptanceId: heroHeadingCtaTargets.text,
    action: "text",
    observableSelector: heroFrameSelector,
    value: "Explore Recraft",
  },
  {
    acceptanceId: heroHeadingCtaTargets.fontSize,
    action: "slider",
    observableSelector: heroFrameSelector,
  },
  {
    acceptanceId: heroHeadingCtaTargets.horizontalPadding,
    action: "slider",
    observableSelector: heroFrameSelector,
  },
  {
    acceptanceId: heroHeadingCtaTargets.verticalPadding,
    action: "slider",
    observableSelector: heroFrameSelector,
  },
  {
    acceptanceId: heroHeadingCtaTargets.textColor,
    action: "color",
    observableSelector: heroFrameSelector,
    value: "#FF00AA",
  },
  {
    acceptanceId: heroHeadingCtaTargets.backgroundColor,
    action: "color",
    observableSelector: heroFrameSelector,
    value: "#22CC88",
  },
  {
    acceptanceId: heroHeadingCtaTargets.gap,
    action: "slider",
    observableSelector: heroFrameSelector,
  },
  {
    acceptanceId: heroHeadingCtaTargets.shadowEnabled,
    action: "switch",
    observableSelector: heroFrameSelector,
  },
  {
    acceptanceId: heroHeadingCtaTargets.shadowBlur,
    action: "slider",
    observableSelector: heroFrameSelector,
    prerequisites: [
      { action: "switch", target: heroHeadingCtaTargets.shadowEnabled },
    ],
  },
  {
    acceptanceId: heroHeadingCtaTargets.shadowSpread,
    action: "slider",
    observableSelector: heroFrameSelector,
    prerequisites: [
      { action: "switch", target: heroHeadingCtaTargets.shadowEnabled },
    ],
  },
]);

type ShadowElement = "cta" | "heading";

type ShadowVectorCase = Readonly<{
  element: ShadowElement;
  target: string;
}>;

type ShadowColorCase = Readonly<{
  element: ShadowElement;
  target: string;
}>;

function getAcceptance(target: string) {
  const acceptance = appAcceptance.find((entry) => entry.id === target);
  if (!acceptance?.target) {
    throw new Error(`Missing target-backed ${target} acceptance.`);
  }
  return acceptance;
}

async function selectShadowBranch(
  control: Locator,
  applicabilityCase: ToolcraftControlApplicabilityCase,
): Promise<void> {
  const shadowSwitch = control.getByRole("switch");
  const desired = String(applicabilityCase.selectorValue);
  if ((await shadowSwitch.getAttribute("aria-checked")) !== desired) {
    await shadowSwitch.click();
  }
}

function getCompoundApplicabilityPart(
  baseRequirementId: string,
  part: string,
  applicabilityRequirementId: string,
): string {
  return `${part}${applicabilityRequirementId.slice(baseRequirementId.length)}`;
}

async function clickShadowPad(
  control: Locator,
  position: Readonly<{ x: number; y: number }>,
): Promise<void> {
  const pad = control.getByRole("button", { name: "Shadow offset X/Y pad" });
  const bounds = await pad.boundingBox();
  if (!bounds) throw new Error("The shadow offset pad must be visible.");
  await pad.click({
    position: {
      x: bounds.width * position.x,
      y: bounds.height * position.y,
    },
  });
}

async function readRenderedShadowOffset(
  page: Page,
  element: ShadowElement,
): Promise<Readonly<{ x: number; y: number }>> {
  const preview = page.frameLocator(heroFrameSelector);
  if (element === "cta") {
    return preview.locator("[data-hero-heading-cta]").evaluate((node) => {
      const offsets = (node as HTMLElement).style.boxShadow.match(/-?\d+(?:\.\d+)?px/g);
      return {
        x: Number.parseFloat(offsets?.[0] ?? "0"),
        y: Number.parseFloat(offsets?.[1] ?? "0"),
      };
    });
  }
  return preview.locator("[data-hero-heading-group] feOffset").evaluate((node) => ({
    x: Number(node.getAttribute("dx")),
    y: Number(node.getAttribute("dy")),
  }));
}

for (const vectorCase of [
  { element: "heading", target: heroHeadingTargets.shadowOffset },
  { element: "cta", target: heroHeadingCtaTargets.shadowOffset },
] as const satisfies readonly ShadowVectorCase[]) {
  const acceptance = getAcceptance(vectorCase.target);

  test(acceptance.browserTestName, async ({ page }) => {
    await page.goto("/");
    await waitForWebsitePreview(page);
    const session = await createToolcraftBrowserProofSession(page);
    const applicabilityCases = getToolcraftControlApplicabilityCases({
      schema: appSchema,
      sectionInventory: appControlSectionInventory,
      target: acceptance.target,
    });
    const observeVectorValue = session.observe((root) => {
      const value = root.querySelector<HTMLElement>(
        `[data-toolcraft-control-target="${vectorCase.target}"] [aria-label="Edit Shadow offset value"]`,
      );
      return value?.textContent?.trim() ?? "";
    });

    for (const applicabilityCase of applicabilityCases) {
      await expectToolcraftControlApplicabilityState(
        session,
        session.controlAction(
          applicabilityCase.selectorTarget,
          async (control) => selectShadowBranch(control, applicabilityCase),
        ),
        applicabilityCase,
        { baseRequirementId: acceptance.id },
      );
      if (applicabilityCase.expectation === "hidden") continue;

      const requirementId = getToolcraftApplicabilityRequirementId(
        acceptance.id,
        applicabilityCase,
      );
      await expectToolcraftProductObservableToChange(
        session,
        session.controlAction(acceptance.target, async (control, currentPage) => {
          await clickShadowPad(control, { x: 0.75, y: 0.5 });
          const offset = await readRenderedShadowOffset(
            currentPage,
            vectorCase.element,
          );
          expect(offset.x).toBeGreaterThan(20);
          expect(Math.abs(offset.y)).toBeLessThanOrEqual(1);
        }),
        {
          requirementId,
          selector: heroFrameSelector,
          stabilityIntervalMs: 50,
          stabilitySamples: 2,
          timeoutMs: 10_000,
        },
      );

      await expectToolcraftCompoundControlPartOutcome(
        observeVectorValue,
        session.controlAction(acceptance.target, async (control, currentPage) => {
          await clickShadowPad(control, { x: 0.25, y: 0.5 });
          const offset = await readRenderedShadowOffset(
            currentPage,
            vectorCase.element,
          );
          expect(offset.x).toBeLessThan(-20);
          expect(Math.abs(offset.y)).toBeLessThanOrEqual(1);
        }),
        "-0.50, 0.00",
        {
          part: getCompoundApplicabilityPart(
            acceptance.id,
            "vector.x",
            requirementId,
          ),
          requirementId: acceptance.id,
          stabilityIntervalMs: 50,
          stabilitySamples: 2,
          timeoutMs: 10_000,
        },
      );

      await expectToolcraftCompoundControlPartOutcome(
        observeVectorValue,
        session.controlAction(acceptance.target, async (control, currentPage) => {
          await clickShadowPad(control, { x: 0.25, y: 0.75 });
          const offset = await readRenderedShadowOffset(
            currentPage,
            vectorCase.element,
          );
          expect(offset.x).toBeLessThan(-20);
          expect(offset.y).toBeGreaterThan(20);
        }),
        "-0.50, 0.50",
        {
          part: getCompoundApplicabilityPart(
            acceptance.id,
            "vector.y",
            requirementId,
          ),
          requirementId: acceptance.id,
          stabilityIntervalMs: 50,
          stabilitySamples: 2,
          timeoutMs: 10_000,
        },
      );
    }
  });
}

async function readRenderedShadowColor(
  page: Page,
  element: ShadowElement,
): Promise<string> {
  const preview = page.frameLocator(heroFrameSelector);
  if (element === "cta") {
    return preview
      .locator("[data-hero-heading-cta]")
      .evaluate((node) => (node as HTMLElement).style.boxShadow);
  }
  return preview
    .locator("[data-hero-heading-group] feFlood")
    .evaluate(
      (node) =>
        `${node.getAttribute("flood-color")} ${node.getAttribute("flood-opacity")}`,
    );
}

for (const colorCase of [
  { element: "heading", target: heroHeadingTargets.shadowColorOpacity },
  { element: "cta", target: heroHeadingCtaTargets.shadowColorOpacity },
] as const satisfies readonly ShadowColorCase[]) {
  const acceptance = getAcceptance(colorCase.target);

  test(acceptance.browserTestName, async ({ page }) => {
    await page.goto("/");
    await waitForWebsitePreview(page);
    const session = await createToolcraftBrowserProofSession(page);
    const applicabilityCases = getToolcraftControlApplicabilityCases({
      schema: appSchema,
      sectionInventory: appControlSectionInventory,
      target: acceptance.target,
    });
    const observeRenderedColor = session.observe(
      (root) => {
        const control = root.querySelector<HTMLElement>(
          `[data-toolcraft-control-target="${colorCase.target}"]`,
        );
        const hex = control?.querySelector<HTMLInputElement>(
          'input[aria-label$="hex"]',
        )?.value;
        const opacity = control?.querySelector<HTMLInputElement>(
          'input[aria-label$="opacity"]',
        )?.value;
        return `${hex ?? ""} ${opacity ?? ""}`;
      },
    );

    for (const applicabilityCase of applicabilityCases) {
      await expectToolcraftControlApplicabilityState(
        session,
        session.controlAction(
          applicabilityCase.selectorTarget,
          async (control) => selectShadowBranch(control, applicabilityCase),
        ),
        applicabilityCase,
        { baseRequirementId: acceptance.id },
      );
      if (applicabilityCase.expectation === "hidden") continue;

      const requirementId = getToolcraftApplicabilityRequirementId(
        acceptance.id,
        applicabilityCase,
      );
      await expectToolcraftProductObservableToChange(
        session,
        session.controlAction(acceptance.target, async (control, currentPage) => {
          const hex = control.locator('input[aria-label$="hex"]');
          await hex.fill("#E533FF");
          await hex.press("Enter");
          const rendered = await readRenderedShadowColor(
            currentPage,
            colorCase.element,
          );
          if (colorCase.element === "cta") {
            expect(rendered).toMatch(/229[, ]+51[, ]+255/i);
          } else {
            expect(rendered.toLowerCase()).toContain("#e533ff");
          }
        }),
        {
          requirementId,
          selector: heroFrameSelector,
          stabilityIntervalMs: 50,
          stabilitySamples: 2,
          timeoutMs: 10_000,
        },
      );

      await expectToolcraftCompoundControlPartOutcome(
        observeRenderedColor,
        session.controlAction(acceptance.target, async (control) => {
          const hex = control.locator('input[aria-label$="hex"]');
          await hex.fill("#00AA66");
          await hex.press("Enter");
        }),
        colorCase.element === "cta" ? "#00AA66 25" : "#00AA66 35",
        {
          part: getCompoundApplicabilityPart(
            acceptance.id,
            "colorOpacity.hex",
            requirementId,
          ),
          requirementId: acceptance.id,
          stabilityIntervalMs: 50,
          stabilitySamples: 2,
          timeoutMs: 10_000,
        },
      );

      await expectToolcraftCompoundControlPartOutcome(
        observeRenderedColor,
        session.controlAction(acceptance.target, async (control, currentPage) => {
          const opacity = control.locator('input[aria-label$="opacity"]');
          await opacity.fill("72");
          await opacity.press("Enter");
          const rendered = await readRenderedShadowColor(
            currentPage,
            colorCase.element,
          );
          expect(rendered).toMatch(/(?:0\.72|72%)/);
        }),
        "#00AA66 72",
        {
          part: getCompoundApplicabilityPart(
            acceptance.id,
            "colorOpacity.opacity",
            requirementId,
          ),
          requirementId: acceptance.id,
          stabilityIntervalMs: 50,
          stabilitySamples: 2,
          timeoutMs: 10_000,
        },
      );
    }
  });
}
