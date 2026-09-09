import type { Locator, Page } from "@playwright/test";

import { expect } from "./toolcraft-product-test";

export async function enterHeroSliderValue(
  control: Locator,
  value: string,
  label?: string,
): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const slider = control.getByRole("slider", label ? { name: label } : {});
      const currentValue = await slider.getAttribute("aria-valuenow");
      const currentNumber = Number(currentValue);
      const requestedNumber = Number(value);
      if (
        currentValue === value ||
        (currentValue !== null &&
          Number.isFinite(currentNumber) &&
          Number.isFinite(requestedNumber) &&
          currentNumber === requestedNumber)
      ) {
        return;
      }
      const input = control.getByRole("textbox");
      if (!(await input.isVisible())) {
        await control
          .getByRole("button", {
            name: label ? `Edit ${label} value` : /Edit .* value/,
          })
          .click({ timeout: 5_000 });
      }
      await input.fill(value, { timeout: 5_000 });
      await input.press("Enter", { timeout: 5_000 });
      return;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

export async function dragHeroSliderToValue(
  page: Page,
  control: Locator,
  value: number,
  beforePointerUp: (slider: Locator) => Promise<void>,
): Promise<void> {
  const slider = control.getByRole("slider").first();
  const root = control.locator('[data-slot="slider"]').first();
  const thumb = root.locator('[data-slot="slider-thumb"]').first();
  const track = root.locator('[data-slot="slider-track"]').first();
  await expect(root).toBeVisible();
  await expect(thumb).toBeVisible();
  await expect(track).toBeVisible();
  await thumb.scrollIntoViewIfNeeded();

  const [range, thumbBounds, trackBounds] = await Promise.all([
    slider.evaluate((element) => ({
      max: Number(
        element.getAttribute("aria-valuemax") ||
          (element as HTMLInputElement).max,
      ),
      min: Number(
        element.getAttribute("aria-valuemin") ||
          (element as HTMLInputElement).min,
      ),
    })),
    thumb.boundingBox(),
    track.boundingBox(),
  ]);
  if (!thumbBounds || !trackBounds) {
    throw new Error("The Toolcraft slider thumb and track must be measurable.");
  }
  if (
    !Number.isFinite(range.min) ||
    !Number.isFinite(range.max) ||
    value < range.min ||
    value > range.max
  ) {
    throw new Error(
      `Slider target ${value} must be inside ${range.min}..${range.max}.`,
    );
  }

  const ratio = (value - range.min) / (range.max - range.min);
  const start = {
    x: thumbBounds.x + thumbBounds.width / 2,
    y: thumbBounds.y + thumbBounds.height / 2,
  };
  const usableTrackWidth = Math.max(0, trackBounds.width - thumbBounds.width);
  let targetX =
    trackBounds.x + thumbBounds.width / 2 + usableTrackWidth * ratio;
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  try {
    await page.mouse.move(targetX, start.y, { steps: 12 });
    for (let correction = 0; correction < 2; correction += 1) {
      const current = Number(await slider.getAttribute("aria-valuenow"));
      if (current === value) break;
      targetX +=
        ((value - current) / (range.max - range.min)) * usableTrackWidth;
      await page.mouse.move(targetX, start.y);
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => resolve()),
          ),
      );
    }
    await expect
      .poll(async () => Number(await slider.getAttribute("aria-valuenow")))
      .toBe(value);
    await expect
      .poll(async () => Number(await slider.inputValue()))
      .toBe(value);
    await beforePointerUp(slider);
  } finally {
    await page.mouse.up();
  }
}

export type PreparedHeroSliderEndpointDrag = Readonly<{
  slider: Locator;
  start: Readonly<{ x: number; y: number }>;
  target: Readonly<{ x: number; y: number }>;
  value: number;
}>;

export async function prepareHeroSliderEndpointDrag(
  control: Locator,
  value: number,
): Promise<PreparedHeroSliderEndpointDrag> {
  const slider = control.getByRole("slider").first();
  const root = control.locator('[data-slot="slider"]').first();
  const thumb = root.locator('[data-slot="slider-thumb"]').first();
  const track = root.locator('[data-slot="slider-track"]').first();
  await expect(root).toBeVisible();
  await expect(thumb).toBeVisible();
  await expect(track).toBeVisible();
  await thumb.scrollIntoViewIfNeeded();

  const [range, thumbBounds, trackBounds] = await Promise.all([
    slider.evaluate((element) => ({
      max: Number(
        element.getAttribute("aria-valuemax") ||
          (element as HTMLInputElement).max,
      ),
      min: Number(
        element.getAttribute("aria-valuemin") ||
          (element as HTMLInputElement).min,
      ),
    })),
    thumb.boundingBox(),
    track.boundingBox(),
  ]);
  if (!thumbBounds || !trackBounds) {
    throw new Error("The Toolcraft slider thumb and track must be measurable.");
  }
  if (value !== range.min && value !== range.max) {
    throw new Error(
      `The live slider drag target ${value} must be an endpoint (${range.min} or ${range.max}).`,
    );
  }

  const ratio = (value - range.min) / (range.max - range.min);
  const usableTrackWidth = Math.max(0, trackBounds.width - thumbBounds.width);
  return {
    slider,
    start: {
      x: thumbBounds.x + thumbBounds.width / 2,
      y: thumbBounds.y + thumbBounds.height / 2,
    },
    target: {
      x: trackBounds.x + thumbBounds.width / 2 + usableTrackWidth * ratio,
      y: thumbBounds.y + thumbBounds.height / 2,
    },
    value,
  };
}

export async function dragPreparedHeroSliderBeforeRelease(
  page: Page,
  prepared: PreparedHeroSliderEndpointDrag,
  beforePointerUp: (slider: Locator) => Promise<void>,
): Promise<void> {
  const direction = Math.sign(prepared.target.x - prepared.start.x);
  await page.mouse.move(prepared.start.x, prepared.start.y);
  await page.mouse.down();
  try {
    await page.mouse.move(prepared.start.x + direction, prepared.start.y);
    await page.mouse.move(prepared.target.x, prepared.target.y);
    await expect
      .poll(async () =>
        Number(await prepared.slider.getAttribute("aria-valuenow")),
      )
      .toBe(prepared.value);
    await expect
      .poll(async () => Number(await prepared.slider.inputValue()))
      .toBe(prepared.value);
    await beforePointerUp(prepared.slider);
  } finally {
    await page.mouse.up();
  }
}
