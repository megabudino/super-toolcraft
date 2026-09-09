import { expect, type Locator, type Page } from "@playwright/test";

export async function selectControlOption(
  control: Locator,
  page: Page,
  label: string,
): Promise<void> {
  const combobox = control.getByRole("combobox");
  await combobox.scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);
  await combobox.click();
  await expect(combobox).toHaveAttribute("aria-expanded", "true");
  const listboxId = await combobox.getAttribute("aria-controls");
  expect(listboxId).not.toBeNull();
  const option = page
    .locator(`[id="${listboxId}"] [data-slot="select-item"]`)
    .filter({ hasText: new RegExp(`^${label}$`, "i") });
  await expect(option).toBeVisible();
  await option.click();
  await expect(combobox).toContainText(label);
}

export async function expectControlOptions(
  control: Locator,
  page: Page,
  labels: readonly string[],
): Promise<void> {
  for (const label of labels) {
    await selectControlOption(control, page, label);
  }
}

export async function ensureTimelineVisible(page: Page): Promise<void> {
  const timelineSwitch = page
    .locator('[data-toolcraft-control-target="panels.timeline.extended"]')
    .getByRole("switch");
  if (!(await timelineSwitch.isChecked())) {
    await timelineSwitch.click();
  }
  const play = page.getByRole("button", { name: "Play playback", exact: true });
  if ((await play.count()) === 1) {
    await play.click();
  }
  await expect(page.getByRole("button", { name: "Pause playback", exact: true })).toBeVisible();
}

export async function pauseAtVisibleFrame(page: Page): Promise<void> {
  const play = page.getByRole("button", { name: "Play playback", exact: true });
  if ((await play.count()) === 1) {
    await play.click();
  }
  await page.waitForTimeout(350);
  const pause = page.getByRole("button", { name: "Pause playback", exact: true });
  if ((await pause.count()) === 1) {
    await pause.click();
  }
}

export async function dragBy(
  locator: Locator,
  page: Page,
  delta: { x: number; y: number },
): Promise<void> {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  const x = box!.x + box!.width / 2;
  const y = box!.y + box!.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + delta.x, y + delta.y, { steps: 8 });
  await page.mouse.up();
}

export async function pressSliderRight(
  control: Locator,
  page: Page,
): Promise<void> {
  const slider = control.getByRole("slider");
  await expect(slider).toBeVisible();
  await slider.scrollIntoViewIfNeeded();
  const sliderRoot = control.locator('[data-slot="slider"]').first();
  await expect(sliderRoot).toBeVisible();
  const box = await sliderRoot.boundingBox();
  expect(box).not.toBeNull();
  const minimum = Number(await slider.getAttribute("aria-valuemin"));
  const maximum = Number(await slider.getAttribute("aria-valuemax"));
  const current = Number(await slider.getAttribute("aria-valuenow"));
  const ratio = Number.isFinite(current) && maximum > minimum
    ? (current - minimum) / (maximum - minimum)
    : 0.5;
  const targetRatio = ratio > 0.68 ? 0.32 : 0.86;
  const inset = Math.min(8, box!.width * 0.08);
  const startX = box!.x + inset + ratio * (box!.width - inset * 2);
  const endX = box!.x + inset + targetRatio * (box!.width - inset * 2);
  const y = box!.y + box!.height / 2;
  await page.mouse.move(startX, y);
  await page.mouse.down();
  await page.mouse.move(endX, y, { steps: 8 });
  await page.mouse.up();
}
