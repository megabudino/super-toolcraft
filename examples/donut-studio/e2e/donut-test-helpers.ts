import { expect, type Locator, type Page } from "@playwright/test";

import type { ToolcraftOrientationBrowserObservation } from "./browser-orientation-gizmo-evidence-helpers";
import {
  observeInfinityCanvas,
  type InfinityCanvasObservation,
} from "./browser-infinity-canvas-evidence";
import {
  type ToolcraftBrowserProofSession,
} from "./browser-proof-session";

export const DONUT_OUTPUT_SELECTOR = '[data-donut-renderer]';
export const DONUT_CANVAS_SELECTOR = '[data-donut-canvas]';
export const DONUT_SCENE_RECT = Object.freeze({
  height: 900,
  width: 1280,
  x: -640,
  y: -450,
});

export type DonutDownloadArtifact = Readonly<{
  bytes: Buffer;
  fileName: string;
}>;

export type DonutImageInspection = Readonly<{
  backgroundAlpha: number;
  byteLength: number;
  contentHash: string;
  height: number;
  mediaType: string;
  width: number;
}>;

export async function waitForDonut(page: Page): Promise<void> {
  const root = page.locator(DONUT_OUTPUT_SELECTOR);
  const canvas = page.locator(DONUT_CANVAS_SELECTOR);
  await expect(root).toHaveAttribute("data-load-state", "ready", {
    timeout: 20_000,
  });
  await expect(canvas).toHaveAttribute("data-donut-frame-ready", "true", {
    timeout: 20_000,
  });
  await expect(canvas).not.toHaveAttribute("data-donut-output-signature", "");
}

export async function openDonut(page: Page): Promise<void> {
  page.setDefaultTimeout(15_000);
  await page.goto("/");
  await waitForDonut(page);
}

export function fieldFor(page: Page, target: string): Locator {
  return page.locator(`[data-toolcraft-control-target="${target}"]`).first();
}

export async function readControlOptionLabel(control: Locator): Promise<string> {
  const combobox = control.getByRole("combobox");
  return (
    (await combobox.getAttribute("title")) ??
    (await combobox.textContent())?.replaceAll("▼", "").trim() ??
    ""
  );
}

export async function chooseControlOption(
  page: Page,
  control: Locator,
  label: string,
): Promise<void> {
  const combobox = control.getByRole("combobox");
  if ((await readControlOptionLabel(control)) === label) return;
  await combobox.click();
  await page
    .locator('[role="option"]')
    .filter({ hasText: label })
    .first()
    .click();
}

export async function chooseOption(
  page: Page,
  target: string,
  label: string,
): Promise<void> {
  await chooseControlOption(page, fieldFor(page, target), label);
}

export async function setControlText(
  control: Locator,
  value: string,
): Promise<void> {
  const input = control.getByRole("textbox").last();
  await input.fill(value);
  await input.press("Enter");
  await input.blur();
  await expect(input).toHaveValue(value);
}

export async function pickControlColor(
  page: Page,
  control: Locator,
): Promise<void> {
  const input = control.getByRole("textbox");
  const previous = await input.inputValue();
  await control.getByRole("button", { name: /^Pick / }).click();
  const surface = page.locator('[data-slot="style-guide-color-surface"]:visible');
  await expect(surface).toBeVisible();
  await surface.click({ position: { x: 42, y: 58 } });
  await expect(input).not.toHaveValue(previous);
  await page.waitForTimeout(100);
  await page.keyboard.press("Escape");
  await expect(surface).toBeHidden();
  await expect(input).not.toHaveValue(previous);
}

export async function setSliderValue(
  control: Locator,
  value: number,
): Promise<void> {
  await control.getByRole("slider").fill(String(value));
}

export async function downloadFromButton(
  page: Page,
  label = "Export PNG",
): Promise<DonutDownloadArtifact> {
  const downloadPromise = page.waitForEvent("download", { timeout: 120_000 });
  await page.getByRole("button", { exact: true, name: label }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Object.freeze({
    bytes: Buffer.concat(chunks),
    fileName: download.suggestedFilename(),
  });
}

export async function inspectDonutImage(
  page: Page,
  artifact: DonutDownloadArtifact,
): Promise<DonutImageInspection> {
  const result = await page.evaluate(
    async ({ base64, fileName }) => {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
      }
      const mediaType = fileName.toLowerCase().endsWith(".jpg")
        ? "image/jpeg"
        : "image/png";
      const bitmap = await createImageBitmap(new Blob([bytes], { type: mediaType }));
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("Image inspection requires a 2D context.");
      context.drawImage(bitmap, 0, 0);
      bitmap.close();
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      const stride = Math.max(4, Math.floor(pixels.length / 80_000 / 4) * 4);
      let hash = 0x811c9dc5;
      for (let index = 0; index < pixels.length; index += stride) {
        hash ^= pixels[index] ?? 0;
        hash = Math.imul(hash, 0x01000193);
        hash ^= pixels[index + 1] ?? 0;
        hash = Math.imul(hash, 0x01000193);
        hash ^= pixels[index + 2] ?? 0;
        hash = Math.imul(hash, 0x01000193);
        hash ^= pixels[index + 3] ?? 0;
        hash = Math.imul(hash, 0x01000193);
      }
      return {
        backgroundAlpha: pixels[3] ?? 0,
        contentHash: (hash >>> 0).toString(16),
        height: canvas.height,
        mediaType,
        width: canvas.width,
      };
    },
    {
      base64: artifact.bytes.toString("base64"),
      fileName: artifact.fileName,
    },
  );
  return Object.freeze({
    ...result,
    byteLength: artifact.bytes.byteLength,
  });
}

export async function observeDonutInfinity(
  page: Page,
): Promise<InfinityCanvasObservation> {
  return {
    ...(await observeInfinityCanvas(page)),
    sceneRect: DONUT_SCENE_RECT,
  };
}

export async function toggleInfinity(page: Page): Promise<void> {
  await fieldFor(page, "canvas.infinity").getByRole("switch").click();
}

export function observeDonutOrientation(session: ToolcraftBrowserProofSession) {
  return session.observe((root): ToolcraftOrientationBrowserObservation => {
    const output = root.querySelector<HTMLElement>("[data-donut-renderer]");
    const canvas = root.querySelector<HTMLCanvasElement>("[data-donut-canvas]");
    const world = root.querySelector<HTMLElement>(
      "[data-toolcraft-canvas-world]",
    );
    const pose = JSON.parse(
      canvas?.dataset.donutOrientation ??
        '{"position":[4.9,4.1,5.4],"up":[0,1,0]}',
    ) as ToolcraftOrientationBrowserObservation["pose"];
    const sample = document.createElement("canvas");
    sample.width = 64;
    sample.height = 64;
    const context = sample.getContext("2d", { willReadFrequently: true });
    if (context && canvas) context.drawImage(canvas, 0, 0, 64, 64);
    const pixels = context?.getImageData(0, 0, 64, 64).data;
    let pixelHash = 0x811c9dc5;
    if (pixels) {
      for (let index = 0; index < pixels.length; index += 4) {
        pixelHash ^= pixels[index] ?? 0;
        pixelHash = Math.imul(pixelHash, 0x01000193);
        pixelHash ^= pixels[index + 1] ?? 0;
        pixelHash = Math.imul(pixelHash, 0x01000193);
        pixelHash ^= pixels[index + 2] ?? 0;
        pixelHash = Math.imul(pixelHash, 0x01000193);
      }
    }
    const poseSignature = JSON.stringify(pose);
    return {
      outputSignature: `${canvas?.dataset.donutOutputSignature ?? ""}:${poseSignature}`,
      pixelSignature: `webgl-${(pixelHash >>> 0).toString(36)}`,
      pose,
      poseTarget: "scene.orientation",
      presentationCacheKey: "donut-studio.renderer@1",
      presentationDocumentId: "donut-reference-scene",
      viewportOffsetX: Number(world?.dataset.toolcraftCanvasOffsetX ?? 0),
      viewportOffsetY: Number(world?.dataset.toolcraftCanvasOffsetY ?? 0),
    };
  });
}
