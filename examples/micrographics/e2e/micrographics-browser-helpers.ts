import { readFile } from "node:fs/promises";

import { expect, type Page } from "@playwright/test";

import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";

export type MicrographicsExportedImage = {
  bytes: Buffer;
  fileName: string;
  mediaType: string;
};

export async function chooseMicrographicsOption(
  page: Page,
  field: Awaited<ReturnType<typeof getToolcraftControlFieldByTarget>>,
  option: string,
  comboboxName?: string,
): Promise<void> {
  await field
    .getByRole("combobox", comboboxName ? { name: comboboxName } : {})
    .click();
  await page.getByText(option, { exact: true }).last().click({ timeout: 5_000 });
}

export async function captureMicrographicsExport(
  page: Page,
): Promise<MicrographicsExportedImage> {
  const button = page.getByRole("button", { name: "Export PNG", exact: true });
  const progressPromise = page.evaluate(
    () =>
      new Promise<string>((resolve, reject) => {
        const selector =
          '[data-slot="toolcraft-panel-sticky-actions"][data-sticky-footer-active="true"]';
        const readProgress = () => {
          const element = document.querySelector(selector);
          const value = element?.getAttribute("data-sticky-footer-progress");
          return value ?? null;
        };
        const initial = readProgress();
        if (initial !== null) {
          resolve(initial);
          return;
        }
        const observer = new MutationObserver(() => {
          const value = readProgress();
          if (value !== null) {
            observer.disconnect();
            resolve(value);
          }
        });
        observer.observe(document.body, {
          attributes: true,
          childList: true,
          subtree: true,
        });
        window.setTimeout(() => {
          observer.disconnect();
          reject(new Error("Export progress did not become visible."));
        }, 5_000);
      }),
  );
  const downloadPromise = page.waitForEvent("download");
  await button.click();
  const progress = page.locator(
    '[data-slot="toolcraft-panel-sticky-actions"][data-sticky-footer-active="true"]',
  );
  expect(await progressPromise).toMatch(/^(?:0(?:\.\d+)?|1)$/u);
  const download = await downloadPromise;
  await expect(progress).toHaveCount(0);
  expect(await download.failure()).toBeNull();
  const path = await download.path();
  if (!path) throw new Error("Micrographics export did not produce a local artifact.");
  const fileName = download.suggestedFilename();
  return {
    bytes: await readFile(path),
    fileName,
    mediaType: fileName.endsWith(".jpg") ? "image/jpeg" : "image/png",
  };
}

export async function inspectMicrographicsImage(
  page: Page,
  artifact: MicrographicsExportedImage,
) {
  return page.evaluate(
    async ({ base64, byteLength, mediaType }) => {
      const binary = atob(base64);
      const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
      const blob = new Blob([bytes], { type: mediaType });
      const bitmap = await createImageBitmap(blob);
      const sample = document.createElement("canvas");
      sample.width = 64;
      sample.height = 64;
      const context = sample.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("Could not inspect the exported image canvas.");
      context.drawImage(bitmap, 0, 0, sample.width, sample.height);
      const pixels = context.getImageData(0, 0, sample.width, sample.height).data;
      let hash = 2166136261;
      for (const value of pixels) {
        hash ^= value;
        hash = Math.imul(hash, 16777619);
      }
      let backgroundAlpha = 255;
      for (let index = 3; index < pixels.length; index += 4) {
        backgroundAlpha = Math.min(backgroundAlpha, pixels[index] ?? 255);
      }
      const result = {
        backgroundAlpha,
        byteLength,
        contentHash: (hash >>> 0).toString(16),
        height: bitmap.height,
        mediaType,
        width: bitmap.width,
      };
      bitmap.close();
      return result;
    },
    {
      base64: artifact.bytes.toString("base64"),
      byteLength: artifact.bytes.byteLength,
      mediaType: artifact.mediaType,
    },
  );
}

export async function dragMicrographicsSliderTargetToValue(
  page: Page,
  target: string,
  value: number,
  options: { ensureExact?: boolean; steps?: number } = {},
): Promise<void> {
  const field = await getToolcraftControlFieldByTarget(page, target);
  const track = field.locator('[data-slot="slider"]').first();
  const thumb = field.getByRole("slider").first();
  const visualThumb = field.locator('[data-slot="slider-thumb"]').first();
  await visualThumb.hover();
  const [trackBox, range] = await Promise.all([
    track.boundingBox(),
    thumb.evaluate((element) => ({
      current: Number(
        element.getAttribute("aria-valuenow") ??
          (element as HTMLInputElement).value ??
          0,
      ),
      max: Number(
        element.getAttribute("aria-valuemax") ??
          element.getAttribute("max") ??
          100,
      ),
      min: Number(
        element.getAttribute("aria-valuemin") ??
          element.getAttribute("min") ??
          0,
      ),
    })),
  ]);
  if (!trackBox || !(await visualThumb.boundingBox())) {
    throw new Error(`Could not measure Toolcraft slider "${target}".`);
  }
  const ratio = Math.max(0, Math.min(1, (value - range.min) / (range.max - range.min)));
  const inset = Math.min(10, trackBox.width * 0.04);
  const endX = trackBox.x + inset + (trackBox.width - inset * 2) * ratio;
  const visualThumbBox = (await visualThumb.boundingBox())!;
  const y = visualThumbBox.y + visualThumbBox.height / 2;
  await page.mouse.down();
  await page.mouse.move(endX, y, { steps: options.steps ?? 14 });
  await page.mouse.up();
  await expect(thumb).not.toHaveAttribute("aria-valuenow", String(range.current));
  const observed = Number(await thumb.getAttribute("aria-valuenow"));
  if (options.ensureExact === false || Math.abs(observed - value) <= 0.25) {
    return;
  }

  const edit = field.getByRole("button", { name: /^Edit .+ value$/u }).first();
  await edit.click();
  const editor = field.getByRole("textbox").first();
  await editor.fill(String(value));
  await editor.press("Enter");
  await expect
    .poll(async () => Number(await thumb.getAttribute("aria-valuenow")))
    .toBeCloseTo(value, 0);
}
