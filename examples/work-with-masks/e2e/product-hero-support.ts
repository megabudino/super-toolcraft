import type { Locator, Page } from "@playwright/test";

import {
  appControlSectionInventory,
  getToolcraftControlApplicabilityCases,
  getToolcraftApplicabilityRequirementId,
} from "../src/app/app-acceptance";
import { appSchema } from "../src/app/app-schema";
import { expectToolcraftControlApplicabilityState } from "./browser-control-applicability-evidence";
import {
  createToolcraftBrowserProofSession,
  type ToolcraftBrowserProofSession,
} from "./browser-proof-session";
import { expectToolcraftCompoundControlPartOutcome } from "./browser-state-evidence-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { installHeroBrowserFixture } from "./product-hero-fixture";
import { expect } from "./toolcraft-product-test";

export const heroCanvasSelector = 'canvas[data-toolcraft-product-output="hero"]';

export const quickStability = {
  baselineStabilityIntervalMs: 32,
  baselineStabilitySamples: 1,
  selector: heroCanvasSelector,
  stabilityIntervalMs: 32,
  stabilitySamples: 1,
} as const;
export async function waitForHero(page: Page): Promise<Locator> {
  const canvas = page.locator(heroCanvasSelector);
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute("data-hero-render-count", /^[1-9]\d*$/u);
  return canvas;
}
export async function createHeroSession(
  page: Page,
  options: Readonly<{
    includeBackground?: boolean;
    sunIntensity?: number;
    values?: Readonly<Record<string, unknown>>;
    wave?: number;
  }> = {},
) {
  await installHeroBrowserFixture(page, options);
  await page.goto("/");
  const session = await createToolcraftBrowserProofSession(page);
  await waitForHero(page);
  return session;
}
export async function selectOption(
  control: Locator,
  page: Page,
  label: string,
): Promise<void> {
  await control.getByRole("combobox").click();
  await page
    .locator('[data-slot="select-item"]')
    .filter({ hasText: label })
    .click();
}
export async function commitHex(control: Locator, value: string): Promise<void> {
  const input = control.getByRole("textbox").last();
  await input.fill(value);
  await input.press("Enter");
}
export async function commitVector(
  control: Locator,
  label: string,
  value: string,
): Promise<void> {
  await control.getByRole("button", { name: `Edit ${label} value` }).click();
  const input = control.getByRole("textbox", { name: `${label} value` });
  await input.fill(value);
  await input.press("Enter");
}
export async function setSwitch(control: Locator, value: boolean): Promise<void> {
  const toggle = control.getByRole("switch");
  const checked = (await toggle.getAttribute("aria-checked")) === "true";
  if (checked !== value) await toggle.click();
}
export async function commitRange(control: Locator, value: string): Promise<void> {
  await control.getByRole("button", { name: "Edit Arc value" }).click();
  const input = control.getByRole("textbox", { name: "Arc value" });
  await input.fill(value);
  await input.press("Enter");
}
export async function expectProductChange(
  session: ToolcraftBrowserProofSession,
  target: string,
  requirementId: string,
  mutate: (control: Locator, page: Page) => Promise<void>,
): Promise<void> {
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction(target, mutate),
    { ...quickStability, requirementId },
  );
}
export async function expectCompoundRender(
  session: ToolcraftBrowserProofSession,
  page: Page,
  target: string,
  requirementId: string,
  part: string,
  mutate: (control: Locator, page: Page) => Promise<void>,
): Promise<void> {
  const canvas = await waitForHero(page);
  const before = Number(await canvas.getAttribute("data-hero-render-count"));
  const observeRender = session.observe((root) => {
    const product = root.querySelector<HTMLCanvasElement>(
      'canvas[data-toolcraft-product-output="hero"]',
    );
    return Number(product?.dataset.heroRenderCount ?? 0);
  });
  await expectToolcraftCompoundControlPartOutcome(
    observeRender,
    session.controlAction(target, mutate),
    before + 1,
    { part, requirementId, stabilityIntervalMs: 32, stabilitySamples: 1 },
  );
}
export async function exerciseGradient(
  session: ToolcraftBrowserProofSession,
  page: Page,
  target: "haze.gradient" | "sky.gradient" | "sky.lightGradient",
  requirementId: "hero.haze.gradient" | "hero.sky.gradient" | "hero.sky.light-gradient",
): Promise<void> {
  for (const [part, mutate] of [
    [
      "gradient.gradientType",
      (control: Locator, currentPage: Page) =>
        selectOption(control, currentPage, "Radial"),
    ],
    [
      "gradient.angle",
      async (control: Locator) => {
        const input = control.getByRole("textbox", { name: "Gradient angle" });
        await input.fill("30");
        await input.press("Enter");
      },
    ],
    [
      "gradient.stops.position",
      async (control: Locator) => {
        const input = control.getByRole("textbox", { name: "Stop 1 position" });
        await input.fill("12");
        await input.press("Enter");
      },
    ],
    [
      "gradient.stops.color",
      async (control: Locator) => {
        const input = control.getByRole("textbox", { name: "Stop 1 hex" });
        await input.fill("#4F6FAE");
        await input.press("Enter");
      },
    ],
    [
      "gradient.stops.opacity",
      async (control: Locator) => {
        const input = control.getByRole("textbox", { name: "Stop 1 opacity" });
        await input.fill("72");
        await input.press("Enter");
      },
    ],
  ] as const) {
    await expectCompoundRender(
      session,
      page,
      target,
      requirementId,
      part,
      mutate,
    );
  }
  await page.waitForTimeout(300);
  await expectProductChange(
    session,
    target,
    requirementId,
    async (control) => {
      const input = control.getByRole("textbox", { name: "Stop 3 hex" });
      await input.fill("#5A2F17");
      await input.press("Enter");
    },
  );
}
export async function expectGatedSliderChange(
  session: ToolcraftBrowserProofSession,
  target: string,
  requirementId: string,
  gate: string,
  key: "End" | "Home",
): Promise<void> {
  const cases = getToolcraftControlApplicabilityCases({
    schema: appSchema,
    sectionInventory: appControlSectionInventory,
    target,
  });
  expect(cases).toHaveLength(2);
  for (const applicabilityCase of cases) {
    await expectToolcraftControlApplicabilityState(
      session,
      session.controlAction(gate, (control) =>
        setSwitch(control, applicabilityCase.selectorValue === true),
      ),
      applicabilityCase,
      { baseRequirementId: requirementId },
    );
    if (applicabilityCase.expectation === "hidden") continue;
    await expectProductChange(
      session,
      target,
      getToolcraftApplicabilityRequirementId(requirementId, applicabilityCase),
      (control) => control.getByRole("slider").press(key),
    );
  }
  await expectProductChange(session, target, requirementId, (control) =>
    control.getByRole("slider").press(key === "Home" ? "End" : "Home"),
  );
}

export async function expectGateSwitchChange(
  session: ToolcraftBrowserProofSession,
  target: string,
  requirementId: string,
  gated: string,
): Promise<void> {
  const cases = getToolcraftControlApplicabilityCases({
    schema: appSchema,
    sectionInventory: appControlSectionInventory,
    target: gated,
  });
  expect(cases).toHaveLength(2);
  for (const applicabilityCase of cases) {
    await expectToolcraftControlApplicabilityState(
      session,
      session.controlAction(target, (control) =>
        setSwitch(control, applicabilityCase.selectorValue === true),
      ),
      applicabilityCase,
      { baseRequirementId: requirementId },
    );
  }
  const restingValue = cases.at(-1)?.selectorValue === true;
  await expectProductChange(session, target, requirementId, (control) =>
    setSwitch(control, !restingValue),
  );
  await expectProductChange(session, target, requirementId, (control) =>
    setSwitch(control, restingValue),
  );
}
