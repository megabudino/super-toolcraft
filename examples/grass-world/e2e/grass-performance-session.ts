import { expect, type Page } from "@playwright/test";

export const grassCanvasSelector = '[data-slot="grass-webgl-canvas"]';

export async function readGrassSignature(page: Page): Promise<string> {
  return (
    (await page
      .locator(grassCanvasSelector)
      .getAttribute("data-grass-frame-signature")) ?? "empty"
  );
}

export async function pauseGrassPlayback(page: Page): Promise<void> {
  const pause = page.getByRole("button", { name: "Pause playback" });
  if ((await pause.count()) > 0) await pause.click();
}

async function ensureGrassTimelineVisible(page: Page): Promise<boolean> {
  const timelineSwitch = page.locator(
    '[data-toolcraft-control-target="panels.timeline.extended"] [role="switch"]',
  );
  if ((await timelineSwitch.count()) > 0) {
    if ((await timelineSwitch.getAttribute("aria-checked")) === "false") {
      await timelineSwitch.click();
    }
  } else {
    return false;
  }
  await expect(
    page.getByRole("slider", { name: "Playback position" }),
  ).toBeVisible();
  return true;
}

export async function setGrassTimelinePosition(
  page: Page,
  fraction: number,
): Promise<void> {
  if (!(await ensureGrassTimelineVisible(page))) return;
  const slider = page.getByRole("slider", { name: "Playback position" });
  const box = await slider.boundingBox();
  expect(box).not.toBeNull();
  await slider.click({
    position: {
      x: Math.max(1, Math.min(box!.width - 1, box!.width * fraction)),
      y: Math.max(1, box!.height / 2),
    },
  });
}

export async function waitForGrassPreview(page: Page): Promise<void> {
  await expect(page.locator(grassCanvasSelector)).toBeVisible();
  await expect
    .poll(() => readGrassSignature(page), { timeout: 15_000 })
    .not.toBe("empty");
  await expect
    .poll(
      async () =>
        Number(
          (await page
            .locator(grassCanvasSelector)
            .getAttribute("data-grass-blade-count")) ?? 0,
        ),
      { timeout: 15_000 },
    )
    .toBeGreaterThan(0);
}

export async function prepareGrass(page: Page): Promise<void> {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  const play = page.getByRole("button", { name: "Play playback" });
  if ((await play.count()) > 0) await play.click();
  await waitForGrassPreview(page);

  await pauseGrassPlayback(page);
  await page.waitForTimeout(120);
}
