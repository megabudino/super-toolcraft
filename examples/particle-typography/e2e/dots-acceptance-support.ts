import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { inflateSync } from "node:zlib";

import type { Download, Locator } from "@playwright/test";

import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, type ToolcraftProductTestFixtures } from "./toolcraft-product-test";

export type ProofSession = Awaited<ReturnType<typeof createToolcraftBrowserProofSession>>;
export type ProductPage = ToolcraftProductTestFixtures["page"];

export const outputSelector = '[data-dots-renderer="true"]';

export async function selectFiniteCanvas(page: ProductPage): Promise<void> {
  const toggle = page
    .locator('[data-toolcraft-control-target="canvas.infinity"]')
    .getByRole("switch");
  if ((await toggle.getAttribute("aria-checked")) === "true") await toggle.click();
  await expect(page.locator("[data-toolcraft-canvas-mode]")).toHaveAttribute(
    "data-toolcraft-canvas-mode",
    "finite",
  );
}

export async function pausePlayback(page: ProductPage): Promise<void> {
  const pause = page.getByRole("button", { name: "Pause playback" });
  if ((await pause.count()) > 0) await pause.click();
}

export async function ensureTimelineVisible(page: ProductPage): Promise<void> {
  const slider = page.getByRole("slider", { name: "Playback position" });
  if ((await slider.count()) > 0) return;
  await page
    .locator('[data-toolcraft-control-target="panels.timeline.extended"]')
    .getByRole("switch")
    .click();
  await expect(slider).toBeVisible();
}

export async function setTimelineFraction(
  page: ProductPage,
  fraction: number,
): Promise<void> {
  await ensureTimelineVisible(page);
  const slider = page.getByRole("slider", { name: "Playback position" });
  const box = await slider.boundingBox();
  expect(box).not.toBeNull();
  await slider.click({
    position: {
      x: Math.max(1, Math.min(box!.width - 1, box!.width * fraction)),
      y: Math.max(1, box!.height / 2),
    },
  });
  await expect
    .poll(async () => Number(await page.locator(outputSelector).getAttribute("data-timeline-progress")))
    .toBeCloseTo(fraction, 1);
}

export async function setSlider(control: Locator, value: number): Promise<void> {
  const edit = control.getByRole("button", { name: /^Edit .+ value$/u });
  if ((await edit.count()) > 0) {
    await edit.click();
    const editor = control.getByRole("textbox");
    await editor.fill(String(value));
    await editor.press("Enter");
    return;
  }
  await control.getByRole("slider").fill(String(value));
}

export async function chooseOption(
  page: ProductPage,
  control: Locator,
  label: string,
): Promise<void> {
  const combobox = control.getByRole("combobox");
  await combobox.click();
  const listboxId = await combobox.getAttribute("aria-controls");
  const listbox = listboxId
    ? page.locator(`[id="${listboxId}"]`)
    : page.locator('[role="listbox"]:visible').last();
  const option = listbox.getByText(label, { exact: true });
  await expect(option).toBeVisible();
  await option.click();
}

export async function canvasHash(page: ProductPage): Promise<string> {
  return page.locator('canvas[aria-label="Particle text formation"]').evaluate((canvas) => {
    const source = canvas as HTMLCanvasElement;
    const sample = document.createElement("canvas");
    sample.width = 96;
    sample.height = 96;
    const context = sample.getContext("2d", { willReadFrequently: true });
    if (!context) return "missing-context";
    context.drawImage(source, 0, 0, 96, 96);
    const bytes = context.getImageData(0, 0, 96, 96).data;
    let hash = 2166136261;
    for (const byte of bytes) hash = Math.imul(hash ^ byte, 16777619) >>> 0;
    return hash.toString(16);
  });
}

export async function timelineFrame(
  page: ProductPage,
): Promise<{ currentTimeSeconds: number; outputSignature: string }> {
  const output = page.locator(outputSelector);
  const duration = Number(await output.getAttribute("data-timeline-duration"));
  const progress = Number(await output.getAttribute("data-timeline-progress"));
  return { currentTimeSeconds: duration * progress, outputSignature: await canvasHash(page) };
}

export async function exportDownload(
  page: ProductPage,
  label: "Export PNG" | "Export Video",
): Promise<Download> {
  const pending = page.waitForEvent("download", { timeout: 90_000 });
  await page.getByRole("button", { name: label }).click();
  return pending;
}

export async function inspectPng(download: Download) {
  const file = await download.path();
  expect(file).not.toBeNull();
  const bytes = await readFile(file!);
  expect(bytes.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  const colorType = bytes[25];
  const idat: Buffer[] = [];
  for (let offset = 8; offset + 12 <= bytes.length; ) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.subarray(offset + 4, offset + 8).toString("ascii");
    if (type === "IDAT") idat.push(bytes.subarray(offset + 8, offset + 8 + length));
    offset += 12 + length;
  }
  const scanlines = inflateSync(Buffer.concat(idat));
  const backgroundAlpha = colorType === 6 ? scanlines[4] ?? 255 : colorType === 4 ? scanlines[2] ?? 255 : 255;
  return {
    backgroundAlpha,
    byteLength: bytes.byteLength,
    contentHash: createHash("sha256").update(bytes).digest("hex"),
    height,
    mediaType: "image/png",
    width,
  };
}

export async function inspectVideo(
  download: Download,
  expectedBackgroundColor?: string,
) {
  const file = await download.path();
  expect(file).not.toBeNull();
  const metadata = await stat(file!);
  const pixel = execFileSync("ffmpeg", [
    "-v", "error", "-ss", "0", "-i", file!, "-frames:v", "1", "-vf", "format=rgba,crop=1:1:0:0",
    "-f", "rawvideo", "-pix_fmt", "rgba", "pipe:1",
  ]);
  const filename = download.suggestedFilename();
  const expectedRgb = expectedBackgroundColor?.match(
    /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/iu,
  );
  const backgroundIncluded = expectedRgb
    ? pixel.length >= 4 &&
      [1, 2, 3].every(
        (group, index) =>
          Math.abs(
            pixel[index]! - Number.parseInt(expectedRgb[group]!, 16),
          ) <= 24,
      ) &&
      pixel[3] === 255
    : pixel.length >= 4 && pixel[3] === 255;
  return {
    backgroundIncluded,
    byteLength: metadata.size,
    durationMs: 1_000,
    mediaType: filename.endsWith(".mp4") ? "video/mp4" : "video/webm",
  };
}

export async function expectSimpleControlChange(
  session: ProofSession,
  target: string,
  action: (control: Locator, page: ProductPage) => Promise<void>,
): Promise<void> {
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction(target, action),
    { requirementId: target, selector: outputSelector, stabilityIntervalMs: 60, timeoutMs: 20_000 },
  );
}
