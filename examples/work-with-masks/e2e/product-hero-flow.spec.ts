import type { Page } from "@playwright/test";

import { expectToolcraftStandardTimelinePlayback } from "./browser-standard-timeline-evidence";
import { createHeroSession, expectProductChange, heroCanvasSelector } from "./product-hero-support";
import { expect, test } from "./toolcraft-product-test";

async function setTimelineQuarter(page: Page): Promise<void> {
  const scrubber = page.getByRole("slider", { name: "Playback position" });
  if (!(await scrubber.isVisible())) {
    await page.locator('[data-toolcraft-control-target="panels.timeline.extended"]').getByRole("switch").click();
  }
  const pause = page.getByRole("button", { name: "Pause playback" });
  if (await pause.isVisible()) await pause.click();
  const box = await scrubber.boundingBox();
  if (!box) throw new Error("Playback position has no interactive bounds.");
  await page.mouse.click(box.x + box.width * 0.25, box.y + box.height / 2);
  await expect.poll(async () => Number(await page.locator(heroCanvasSelector).getAttribute("data-timeline-progress"))).toBeGreaterThan(0.1);
}

async function createFlowSession(page: Page) {
  const session = await createHeroSession(page, {
    includeBackground: true,
    sunIntensity: 2.8,
    // One pitch makes +quarter and −quarter visibly different; two pitches
    // would alias to the same half-pitch frame when Direction is switched.
    values: { "flow.travel": 1, "flow.glowOrbit": 1, "haze.glowStrength": 80, "flow.glowOrbitRadius": 0.15 },
  });
  await setTimelineQuarter(page);
  return session;
}

for (const [target, requirementId, key] of [
  ["flow.travel", "hero.flow.travel", "Home"],
  ["flow.glowOrbit", "hero.flow.glow-orbit", "End"],
  ["flow.glowOrbitRadius", "hero.flow.glow-radius", "End"],
] as const) {
  test(`browser: ${requirementId} changes 3d scene pixels`, async ({ page }) => {
    const session = await createFlowSession(page);
    await expectProductChange(session, target, requirementId, control => control.getByRole("slider").press(key));
  });
}

test("browser: hero.flow.direction changes 3d scene pixels", async ({ page }) => {
  const session = await createFlowSession(page);
  for (const label of ["Away", "Toward"]) {
    await expectProductChange(session, "flow.direction", "hero.flow.direction", control => control.getByRole("button", { name: label }).click());
  }
});

test("browser: hero.timeline.playback loops forward", async ({ page }) => {
  const session = await createFlowSession(page);
  const scrubber = page.getByRole("slider", { name: "Playback position" });
  const canvas = page.locator(heroCanvasSelector);
  const capture = async (key: "Home" | "End" | "ArrowRight") => {
    const before = await canvas.getAttribute("data-hero-render-count");
    await scrubber.press(key);
    await expect.poll(() => canvas.getAttribute("data-hero-render-count")).not.toBe(before);
    return canvas.screenshot();
  };
  const start = await capture("Home");
  await capture("ArrowRight");
  const end = await capture("End");
  expect(end.equals(start)).toBe(true);
  await expectToolcraftStandardTimelinePlayback(session, {
    markerSelector: '[data-hero-flow-marker="true"]',
    requirementId: "hero.timeline.playback",
  });
});
