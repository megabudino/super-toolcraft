import type { Locator, Page } from "@playwright/test";

import { expectToolcraftReferenceParity } from "./browser-acceptance-outcome-helpers";
import { expectToolcraftCompoundControlPartOutcome } from "./browser-state-evidence-helpers";
import type { ToolcraftBrowserAction, ToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { commitVector, createHeroSession, heroCanvasSelector } from "./product-hero-support";
import { expect, test } from "./toolcraft-product-test";

const waveLayerSelector = '[data-testid="hero-wave-layer"]';
const waveFrameSelector = "[data-wave-frame-width]";

const placementStability = {
  baselineStabilityIntervalMs: 32,
  baselineStabilitySamples: 1,
  selector: waveLayerSelector,
  stabilityIntervalMs: 32,
  stabilitySamples: 1,
} as const;

function getControl(page: Page, target: string): Locator {
  return page
    .locator(`[data-toolcraft-control-target="${target}"]`)
    .locator('[data-slot="field"]')
    .first();
}

function controlAction(
  session: ToolcraftBrowserProofSession,
  target: string,
  mutate: (control: Locator, page: Page) => Promise<void>,
): ToolcraftBrowserAction {
  return session.targetAction(target, async (page) => {
    const control = getControl(page, target);
    await control.scrollIntoViewIfNeeded();
    await mutate(control, page);
  });
}

async function dragSlider(control: Locator, page: Page, targetRatio: number) {
  const slider = control.locator('[data-slot="slider"]').first();
  const thumb = control.getByRole("slider").first();
  const before = await thumb.getAttribute("aria-valuenow");
  const bounds = await slider.boundingBox();
  if (!bounds) throw new Error("Missing visible wave slider bounds.");
  const y = bounds.y + bounds.height / 2;

  await page.mouse.move(bounds.x + bounds.width * 0.15, y);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width * targetRatio, y, { steps: 1 });
  await page.mouse.up();
  await expect(thumb).not.toHaveAttribute("aria-valuenow", before ?? "");
}

test("browser: wave width changes the middle-layer renderer frame", async ({ page }) => {
  const session = await createHeroSession(page);

  await expectToolcraftProductObservableToChange(
    session,
    controlAction(session, "wave.frame.width", (control, currentPage) =>
      dragSlider(control, currentPage, 0.35),
    ),
    { ...placementStability, requirementId: "hero.wave.frame.width" },
  );
  await expect(page.locator(waveFrameSelector)).toHaveAttribute(
    "data-wave-frame-width",
    /^(?!320$)\d+$/u,
  );
  const widthControl = getControl(page, "wave.frame.width");
  await expectToolcraftReferenceParity(
    async () => {
      const controlValue = await widthControl.getByRole("slider").getAttribute("aria-valuenow");
      const frameValue = await page
        .locator(waveFrameSelector)
        .getAttribute("data-wave-frame-width");
      return controlValue === frameValue;
    },
    true,
    { requirementId: "hero.wave.frame.width", target: "wave.frame.width" },
  );
});

test("browser: wave height changes the middle-layer renderer frame", async ({ page }) => {
  const session = await createHeroSession(page);

  await expectToolcraftProductObservableToChange(
    session,
    controlAction(session, "wave.frame.height", (control, currentPage) =>
      dragSlider(control, currentPage, 0.4),
    ),
    { ...placementStability, requirementId: "hero.wave.frame.height" },
  );
  await expect(page.locator(waveFrameSelector)).toHaveAttribute(
    "data-wave-frame-height",
    /^(?!180$)\d+$/u,
  );
});

test("browser: wave position pad moves the middle-layer renderer frame", async ({ page }) => {
  const session = await createHeroSession(page);
  const observeX = session.observe((root) =>
    Number(root.querySelector<HTMLElement>("[data-wave-frame-x]")?.dataset.waveFrameX),
  );
  const observeY = session.observe((root) =>
    Number(root.querySelector<HTMLElement>("[data-wave-frame-y]")?.dataset.waveFrameY),
  );

  await expectToolcraftProductObservableToChange(
    session,
    controlAction(session, "wave.frame.position", (control) =>
      commitVector(control, "Position", "0.25, 0"),
    ),
    { ...placementStability, requirementId: "hero.wave.frame.position" },
  );
  await expectToolcraftCompoundControlPartOutcome(
    observeX,
    controlAction(session, "wave.frame.position", (control) =>
      commitVector(control, "Position", "0.5, 0"),
    ),
    1200,
    {
      part: "vector.x",
      requirementId: "hero.wave.frame.position",
      stabilityIntervalMs: 32,
      stabilitySamples: 1,
    },
  );
  await expectToolcraftCompoundControlPartOutcome(
    observeY,
    controlAction(session, "wave.frame.position", (control) =>
      commitVector(control, "Position", "0.5, -0.25"),
    ),
    -600,
    {
      part: "vector.y",
      requirementId: "hero.wave.frame.position",
      stabilityIntervalMs: 32,
      stabilitySamples: 1,
    },
  );
});

test("browser: wave renderer stays retained beneath the foreground hero", async ({ page }) => {
  const session = await createHeroSession(page, { wave: 0 });
  const canvas = page.locator(heroCanvasSelector);
  const canvasHandle = await canvas.elementHandle();
  if (!canvasHandle) throw new Error("Missing retained wave canvas.");

  await expectToolcraftProductObservableToChange(
    session,
    controlAction(session, "structure.wave", (control, currentPage) =>
      dragSlider(control, currentPage, 0.75),
    ),
    { ...placementStability, requirementId: "hero.renderer.state" },
  );

  const currentCanvasHandle = await canvas.elementHandle();
  if (!currentCanvasHandle) throw new Error("Wave canvas was removed after editing.");
  const hasRetainedCanvas = await canvasHandle.evaluate(
    (node, current) => node === current,
    currentCanvasHandle,
  );
  expect(hasRetainedCanvas).toBe(true);
  await expect(page.locator('[data-testid="hero-base-layer"]')).toBeVisible();
  await expect(page.locator('[data-testid="hero-native-foreground"]')).toBeVisible();
  const layerOrder = await page
    .locator('[data-toolcraft-product-output="percents-hero-preview"]')
    .evaluate((root) => {
      const base = root.querySelector('[data-testid="hero-base-layer"]');
      const wave = root.querySelector('canvas[data-toolcraft-product-output="hero"]');
      const foreground = root.querySelector('[data-testid="hero-native-foreground"]');
      if (!base || !wave || !foreground) return [];
      const nodes = [...root.querySelectorAll("*")];
      return [nodes.indexOf(base), nodes.indexOf(wave), nodes.indexOf(foreground)];
    });
  expect(layerOrder[0]).toBeLessThan(layerOrder[1] ?? -1);
  expect(layerOrder[1]).toBeLessThan(layerOrder[2] ?? -1);
  await expectToolcraftReferenceParity(
    async () => ({
      hasOrderedLayers:
        layerOrder[0] < (layerOrder[1] ?? -1) && (layerOrder[1] ?? -1) < (layerOrder[2] ?? -1),
      hasRetainedCanvas,
    }),
    { hasOrderedLayers: true, hasRetainedCanvas: true },
    { requirementId: "hero.renderer.state", target: "structure.wave" },
  );
});
