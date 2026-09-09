import { expect, type Locator, type Page } from "@playwright/test";

import {
  createToolcraftBrowserProofSession,
  type ToolcraftBrowserProofSession,
} from "./browser-proof-session";
import type { ToolcraftOrientationBrowserObservation } from "./browser-orientation-gizmo-evidence-helpers";

export const logoSphereCanvasSelector =
  'canvas[data-toolcraft-product-output="logo-sphere"]';

export async function createLogoSphereProofSession(
  page: Page,
): Promise<ToolcraftBrowserProofSession> {
  await page.goto("/");
  const session = await createToolcraftBrowserProofSession(page);
  const canvas = page.locator(logoSphereCanvasSelector);

  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute("data-ready-image-count", "30", {
    timeout: 20_000,
  });
  const pause = page.getByRole("button", { name: "Pause playback" });
  if (await pause.isVisible()) {
    await pause.click();
  }
  await expect(page.getByRole("button", { name: "Play playback" })).toBeVisible();
  await page.waitForTimeout(150);
  await waitForLogoSphereDraw(page);
  return session;
}

export async function moveSliderToEnd(control: Locator): Promise<void> {
  const slider = control.getByRole("slider");
  await expect(slider).toHaveCount(1);
  await slider.press("End");
}

export async function chooseLastSegment(control: Locator): Promise<void> {
  const options = control.locator('[data-slot="toggle-group-item"]');
  expect(await options.count()).toBeGreaterThan(1);
  await options.last().click();
}

export async function chooseLastSelectOption(
  control: Locator,
  page: Page,
): Promise<void> {
  const combobox = control.getByRole("combobox");
  await combobox.click();
  const options = page.locator('[data-slot="select-item"]:visible');
  await expect(options.first()).toBeVisible();
  await options.last().click();
  await expect(options).toHaveCount(0);
}

export async function chooseFirstSelectOption(
  control: Locator,
  page: Page,
): Promise<void> {
  const combobox = control.getByRole("combobox");
  await combobox.click();
  const options = page.locator('[data-slot="select-item"]:visible');
  await expect(options.first()).toBeVisible();
  await options.first().click();
  await expect(options).toHaveCount(0);
}

export async function chooseSecondSelectOption(
  control: Locator,
  page: Page,
): Promise<void> {
  const combobox = control.getByRole("combobox");
  await combobox.click();
  const options = page.locator('[data-slot="select-item"]:visible');
  await expect(options.first()).toBeVisible();
  expect(await options.count()).toBeGreaterThan(1);
  await options.nth(1).click();
  await expect(options).toHaveCount(0);
}

export function readLogoSphereCanvasSignature(root: HTMLElement): string {
  const canvas = root.querySelector<HTMLCanvasElement>(
    'canvas[data-toolcraft-product-output="logo-sphere"]',
  );
  if (!canvas) {
    return "missing";
  }
  const sampleWidth = Math.min(canvas.width, 256);
  const sampleHeight = Math.min(canvas.height, 144);
  const sample = document.createElement("canvas");
  sample.width = sampleWidth;
  sample.height = sampleHeight;
  const sampleContext = sample.getContext("2d", { willReadFrequently: true });
  if (!sampleContext) {
    return "no-sample-context";
  }
  sampleContext.drawImage(canvas, 0, 0, sampleWidth, sampleHeight);
  const pixels = sampleContext.getImageData(
    0,
    0,
    sampleWidth,
    sampleHeight,
  ).data;
  let hash = 2166136261;
  for (let index = 0; index < pixels.length; index += 4) {
    hash ^= pixels[index] ?? 0;
    hash = Math.imul(hash, 16777619);
    hash ^= pixels[index + 1] ?? 0;
    hash = Math.imul(hash, 16777619);
    hash ^= pixels[index + 2] ?? 0;
    hash = Math.imul(hash, 16777619);
    hash ^= pixels[index + 3] ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return `${canvas.width}x${canvas.height}:${(hash >>> 0).toString(16)}`;
}

export function readLogoSphereOrientationObservation(
  root: HTMLElement,
): ToolcraftOrientationBrowserObservation {
  const canvas = root.querySelector<HTMLCanvasElement>(
    'canvas[data-toolcraft-product-output="logo-sphere"]',
  );
  if (!canvas) {
    throw new Error("Logo sphere orientation proof requires the product canvas.");
  }
  const sample = document.createElement("canvas");
  sample.width = Math.min(canvas.width, 256);
  sample.height = Math.min(canvas.height, 144);
  const sampleContext = sample.getContext("2d", { willReadFrequently: true });
  if (!sampleContext) {
    throw new Error("Logo sphere orientation proof could not sample pixels.");
  }
  sampleContext.drawImage(canvas, 0, 0, sample.width, sample.height);
  const pixels = sampleContext.getImageData(
    0,
    0,
    sample.width,
    sample.height,
  ).data;
  let hash = 2166136261;
  for (let index = 0; index < pixels.length; index += 4) {
    hash ^= pixels[index] ?? 0;
    hash = Math.imul(hash, 16777619);
    hash ^= pixels[index + 1] ?? 0;
    hash = Math.imul(hash, 16777619);
    hash ^= pixels[index + 2] ?? 0;
    hash = Math.imul(hash, 16777619);
    hash ^= pixels[index + 3] ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  const pixelSignature = `${canvas.width}x${canvas.height}:${(
    hash >>> 0
  ).toString(16)}`;
  const position = JSON.parse(canvas.dataset.orbitPosition ?? "null") as
    | readonly [number, number, number]
    | null;
  const up = JSON.parse(canvas.dataset.orbitUp ?? "null") as
    | readonly [number, number, number]
    | null;
  if (!position || !up) {
    throw new Error("Logo sphere orientation proof requires the runtime pose.");
  }
  const world = root.querySelector<HTMLElement>(
    "[data-toolcraft-canvas-world]",
  );

  return {
    outputSignature: pixelSignature,
    pixelSignature,
    pose: { position, up },
    poseTarget: "view.orbit",
    presentationCacheKey:
      canvas.dataset.presentationCacheKey ?? "missing-cache",
    presentationDocumentId:
      canvas.dataset.presentationDocumentId ?? "missing-document",
    viewportOffsetX: Number(world?.dataset.toolcraftCanvasOffsetX ?? 0),
    viewportOffsetY: Number(world?.dataset.toolcraftCanvasOffsetY ?? 0),
  };
}

export async function waitForLogoSphereDraw(page: Page): Promise<void> {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }),
  );
}
