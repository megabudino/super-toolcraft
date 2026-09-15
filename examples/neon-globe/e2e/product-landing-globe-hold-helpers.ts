import type { Page } from "@playwright/test";

import { createToolcraftOrientationAxisSnapAction } from "./browser-orientation-gizmo-actions";
import { createToolcraftBrowserProofSession, runToolcraftBrowserAction } from "./browser-proof-session";
import { expectToolcraftProductObservableToChange, getToolcraftProductObservableSnapshot } from "./product-observable-helpers";
import { CRT_INTENSITY_TARGET, LOGO_DXC_FINAL_POSITION_TARGET, LOGO_HOLD_SECONDS_TARGET, setRangeControl } from "./product-landing-globe-helpers";
import { readGlobeRowPixels } from "./product-landing-globe-order-helpers";
import { expect } from "./toolcraft-product-test";

export async function expectLogoHoldTimingChange(page: Page): Promise<void> {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.clock.install();
  await page.goto("/");
  await setRangeControl(page.locator(`[data-toolcraft-control-target="${CRT_INTENSITY_TARGET}"]`), 0);
  await setRangeControl(page.locator(`[data-toolcraft-control-target="${LOGO_DXC_FINAL_POSITION_TARGET}"]`), 50);
  const session = await createToolcraftBrowserProofSession(page);
  await runToolcraftBrowserAction(createToolcraftOrientationAxisSnapAction(session, "globe.orientation", "+z"));
  await expect.poll(async () => {
    const pose = JSON.parse(await page.getByRole("application", { name: "3D orientation gizmo" })
      .getAttribute("data-toolcraft-orientation-pose") ?? "null");
    return Math.abs(pose.position[0]) + Math.abs(pose.position[1]);
  }).toBeLessThan(0.00001);

  const runButton = page.getByRole("button", { name: "Run logos", exact: true });
  await runButton.hover();
  await getToolcraftProductObservableSnapshot(page);
  const now = await page.evaluate(() => Date.now());
  await page.clock.pauseAt(new Date(now + 5000));
  await runButton.click();
  await page.clock.runFor(720);
  const firstRow = { position: 69, width: 17 };
  const settled = await readGlobeRowPixels(page, firstRow);
  expect(settled.whitePixels).toBeGreaterThan(0);

  // At 720 ms, the default 3 s pause holds this row; a 0.25 s pause has ended.
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction(LOGO_HOLD_SECONDS_TARGET, async (control) => {
      await setRangeControl(control, 0.25);
      await page.clock.runFor(64);
    }),
    { requirementId: "logos.hold-seconds", stabilityIntervalMs: 0 },
  );
  expect((await readGlobeRowPixels(page, firstRow)).hash).not.toBe(settled.hash);

  // The first row arrives at 304 ms and leaves at 554 ms with the edited pause.
  await runButton.click();
  await page.clock.runFor(384);
  expect((await readGlobeRowPixels(page, firstRow)).hash).toBe(settled.hash);
  await page.clock.runFor(140);
  expect((await readGlobeRowPixels(page, firstRow)).hash).toBe(settled.hash);
  await page.clock.runFor(190);
  expect((await readGlobeRowPixels(page, firstRow)).hash).not.toBe(settled.hash);
}
