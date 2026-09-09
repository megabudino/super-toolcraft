import { readFileSync } from "node:fs";

import type { Download, Page } from "@playwright/test";

import { expect } from "./toolcraft-product-test";

import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import {
  getToolcraftFieldByLabel,
} from "./performance-control-layout-helpers";
import { waitForToolcraftAnimationFrames } from "./performance-interaction-measurement";
import {
  expectToolcraftProductObservableToChange,
  getToolcraftProductObservableSnapshot,
} from "./product-observable-helpers";

const audioFixturePath = "e2e/fixtures/audio-pulse.wav";

export async function openFreshApp(page: Page): Promise<void> {
  await page.goto("/");
  await expect(page.locator("[data-dot-ring-canvas]")).toBeVisible();
  await waitForToolcraftAnimationFrames(page, 3);
}

export async function getDotCanvasHash(page: Page): Promise<string> {
  return page.locator("[data-dot-ring-canvas]").evaluate((canvas) => {
    const dotCanvas = canvas as HTMLCanvasElement;
    const sample = document.createElement("canvas");
    sample.width = 256;
    sample.height = 256;
    const context = sample.getContext("2d", { willReadFrequently: true });

    if (!context) {
      return "no-context";
    }

    context.drawImage(dotCanvas, 0, 0, sample.width, sample.height);
    const pixels = context.getImageData(0, 0, sample.width, sample.height).data;
    let hash = 2166136261;

    for (let index = 0; index < pixels.length; index += 1) {
      hash ^= pixels[index] ?? 0;
      hash = Math.imul(hash, 16777619);
    }

    const rect = dotCanvas.getBoundingClientRect();
    return `${dotCanvas.width}x${dotCanvas.height}:${Math.round(rect.width)}x${Math.round(rect.height)}:${(hash >>> 0).toString(16)}`;
  });
}

export async function expectDotCanvasChange(
  page: Page,
  action: () => Promise<void>,
): Promise<void> {
  const before = await getDotCanvasHash(page);

  await action();
  await waitForToolcraftAnimationFrames(page, 3);

  await expect.poll(() => getDotCanvasHash(page)).not.toBe(before);
}

export async function editSliderValueByLabel(
  page: Page,
  label: string,
  valueLabel: string,
): Promise<void> {
  const field = await getToolcraftFieldByLabel(page, label);
  await field.scrollIntoViewIfNeeded();
  await field.getByRole("button", { name: `Edit ${label} value` }).click();
  await page.getByRole("textbox", { name: `${label} value` }).fill(valueLabel);
  await page.getByRole("textbox", { name: `${label} value` }).press("Enter");
  await waitForToolcraftAnimationFrames(page, 3);
}

export async function expectSliderEditChangesDotCanvas(
  page: Page,
  label: string,
  valueLabel: string,
): Promise<void> {
  const canvasBefore = await getDotCanvasHash(page);

  await editSliderValueByLabel(page, label, valueLabel);

  const canvasAfter = await getDotCanvasHash(page);

  expect(canvasAfter).not.toBe(canvasBefore);
}

export async function uploadAudioFixture(page: Page): Promise<void> {
  const field = page.locator(
    '[data-toolcraft-control-target="audio.source"]',
  );

  await expect(field).toBeVisible();
  await field.locator('input[type="file"]').setInputFiles(audioFixturePath);
  await expect(field.getByTitle("audio-pulse.wav")).toBeVisible();
  await expect(page.locator("[data-dot-ring-canvas]")).toHaveAttribute(
    "data-audio-source",
    "audio-pulse.wav",
    { timeout: 7000 },
  );
  await waitForToolcraftAnimationFrames(page, 3);
}

export async function fillTextControl(
  page: Page,
  label: string,
  value: string,
): Promise<void> {
  const field = await getToolcraftFieldByLabel(page, label);
  const input = field.locator("input").first();

  await input.fill(value);
  await input.press("Enter");
  await input.blur();
}

export async function setColorControl(
  page: Page,
  label: string,
  hex: string,
): Promise<void> {
  const input = page.getByLabel(`${label} hex`);

  await input.fill(hex);
  await input.press("Enter");
  await input.blur();
}

export async function setColorControlByTarget(
  page: Page,
  target: string,
  hex: string,
): Promise<void> {
  const field = await getToolcraftControlFieldByTarget(page, target);
  const input = field.getByRole("textbox").first();

  await input.fill(hex);
  await input.press("Enter");
  await input.blur();
}

export async function selectControlOption(
  page: Page,
  label: string,
  option: string,
): Promise<void> {
  const field = await getToolcraftFieldByLabel(page, label);

  await field.locator('[data-slot="select-trigger"]').click();
  await page.locator('[data-slot="select-item"]').filter({ hasText: option }).click();
}

export async function selectControlOptionByTarget(
  page: Page,
  target: string,
  option: string,
): Promise<void> {
  const field = await getToolcraftControlFieldByTarget(page, target);

  await field.getByRole("combobox").click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

export async function readDownloadedImageSignature(
  download: Download,
): Promise<string> {
  const filePath = await download.path();

  if (!filePath) {
    throw new Error("Image download path is unavailable.");
  }

  return readFileSync(filePath).subarray(0, 4).toString("hex");
}

export async function downloadFromButton(page: Page, label: string): Promise<Download> {
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: label }).click(),
  ]);

  return download;
}

export async function readDownloadedText(download: Download): Promise<string> {
  const filePath = await download.path();

  if (!filePath) {
    throw new Error("Download path is unavailable.");
  }

  return readFileSync(filePath, "utf8");
}

export async function readDownloadedPngInfo(page: Page, download: Download): Promise<{
  cornerAlpha: number;
  height: number;
  width: number;
}> {
  const filePath = await download.path();

  if (!filePath) {
    throw new Error("PNG download path is unavailable.");
  }

  const encoded = readFileSync(filePath).toString("base64");

  return page.evaluate(async (base64) => {
    const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
    const blob = new Blob([bytes], { type: "image/png" });
    const bitmap = await createImageBitmap(blob);
    const sample = document.createElement("canvas");
    sample.width = bitmap.width;
    sample.height = bitmap.height;
    const context = sample.getContext("2d", { willReadFrequently: true });

    if (!context) {
      throw new Error("PNG sample context is unavailable.");
    }

    context.drawImage(bitmap, 0, 0);
    const cornerAlpha = context.getImageData(0, 0, 1, 1).data[3] ?? 0;

    return {
      cornerAlpha,
      height: bitmap.height,
      width: bitmap.width,
    };
  }, encoded);
}

export async function readDownloadedVideoDurationMetadata(
  page: Page,
  download: Download,
  durationSeconds: number,
): Promise<{
  height: number;
  videoDuration: number;
  width: number;
}> {
  const filePath = await download.path();

  if (!filePath) {
    throw new Error("Video download path is unavailable.");
  }

  const encoded = readFileSync(filePath).toString("base64");
  const mime = download.suggestedFilename().endsWith(".mp4")
    ? "video/mp4"
    : "video/webm";
  const metadataPage = await page.context().newPage();

  try {
    return await metadataPage.evaluate(
      ({ encoded: videoBytes, mime: videoMime }) =>
        new Promise<{ height: number; videoDuration: number; width: number }>(
        (resolve, reject) => {
          const video = document.createElement("video");
          const bytes = Uint8Array.from(atob(videoBytes), (character) =>
            character.charCodeAt(0),
          );
          const url = URL.createObjectURL(new Blob([bytes], { type: videoMime }));

          video.addEventListener(
            "loadedmetadata",
            () => {
              const videoDuration = video.duration;
              const width = video.videoWidth;
              const height = video.videoHeight;
              URL.revokeObjectURL(url);
              resolve({ height, videoDuration, width });
            },
            { once: true },
          );
          video.addEventListener(
            "error",
            () => {
              URL.revokeObjectURL(url);
              reject(new Error("Video metadata failed to load."));
            },
            { once: true },
          );
          video.src = url;
        },
      ),
      { durationSeconds, encoded, mime },
    );
  } finally {
    await metadataPage.close();
  }
}

export async function editTimelineDuration(
  page: Page,
  valueLabel: string,
): Promise<number> {
  await ensureExtendedTimeline(page);
  await page.getByRole("button", { name: "Edit timeline duration" }).click();
  await page.getByRole("textbox", { name: "timeline duration" }).fill(valueLabel);
  await page.getByRole("textbox", { name: "timeline duration" }).press("Enter");
  await waitForToolcraftAnimationFrames(page, 3);

  const durationSeconds = Number(
    await page.getByRole("slider", { name: "Playback position" }).getAttribute("aria-valuemax"),
  );

  expect(durationSeconds).toBeGreaterThan(0);
  return durationSeconds;
}

export async function pausePlayback(page: Page): Promise<void> {
  const pausePlayback = page.getByRole("button", { name: "Pause playback" });

  if (await pausePlayback.isVisible().catch(() => false)) {
    await pausePlayback.click();
    await waitForToolcraftAnimationFrames(page, 2);
  }
}

async function ensureExtendedTimeline(page: Page): Promise<void> {
  const playbackSlider = page.getByRole("slider", {
    name: "Playback position",
  });

  if ((await playbackSlider.count()) === 0) {
    const field = await getToolcraftControlFieldByTarget(
      page,
      "panels.timeline.extended",
    );
    const toggle = field.getByRole("switch");

    if ((await toggle.getAttribute("aria-checked")) !== "true") {
      await toggle.click();
    }
  }

  await expect(playbackSlider).toBeVisible();
}

export async function scrubPlayback(page: Page, ratio: number): Promise<void> {
  await pausePlayback(page);
  await ensureExtendedTimeline(page);

  const playbackSlider = page.getByRole("slider", { name: "Playback position" });
  const box = await playbackSlider.boundingBox();

  if (!box) {
    throw new Error("Playback position slider could not be measured.");
  }

  await page.mouse.move(box.x + box.width * 0.05, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * ratio, box.y + box.height / 2, { steps: 8 });
  await page.mouse.up();
  await waitForToolcraftAnimationFrames(page, 3);
}
