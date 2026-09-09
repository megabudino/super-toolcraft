import { expect, type Page } from "@playwright/test";

import { createToolcraftBrowserProofSession } from "./browser-proof-session";

export type GrassArtifact = Readonly<{
  bytes: number[];
  fileName: string;
}>;

export const grassLayerVisibilityTargets = [
  "field.showGround",
  "grass.enabled",
  "lawn.enabled",
  "butterflies.enabled",
  "scan.tufted.enabled",
  "scan.wild.enabled",
  "scan.white.enabled",
  "scan.yellow.enabled",
  "scan.rocks.enabled",
  "scan.boulder.enabled",
] as const;

export async function setGrassLayerVisibility(
  page: Page,
  target: (typeof grassLayerVisibilityTargets)[number],
  visible: boolean,
): Promise<void> {
  const layerSwitch = page
    .locator(`[data-toolcraft-control-target="${target}"]`)
    .getByRole("switch");
  const current = (await layerSwitch.getAttribute("aria-checked")) === "true";
  if (current !== visible) await layerSwitch.click();
}

export async function pauseGrassPlayback(page: Page): Promise<void> {
  const pause = page.getByRole("button", { name: "Pause playback" });
  if ((await pause.count()) > 0) await pause.click();
}

export async function disableGrassScanLayers(page: Page): Promise<void> {
  for (const kind of ["tufted", "wild", "white", "yellow", "rocks"]) {
    const scanSwitch = page
      .locator(`[data-toolcraft-control-target="scan.${kind}.enabled"]`)
      .getByRole("switch");
    if ((await scanSwitch.getAttribute("aria-checked")) === "true") {
      await scanSwitch.click();
    }
  }
}

export async function ensureGrassTimelineVisible(page: Page): Promise<boolean> {
  const timelineSwitch = page.locator(
    '[data-toolcraft-control-target="panels.timeline.extended"] [role="switch"]',
  );
  if ((await timelineSwitch.count()) === 0) return false;
  if ((await timelineSwitch.getAttribute("aria-checked")) === "false") {
    await timelineSwitch.click();
  }
  await expect(
    page.getByRole("slider", { name: "Playback position" }),
  ).toBeVisible();
  return true;
}

export async function prepareGrassSession(
  page: Page,
  options: Readonly<{ pausePlayback?: boolean }> = {},
) {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  const session = await createToolcraftBrowserProofSession(page);
  await page.keyboard.press("Tab");
  await expect(
    page.locator('[data-slot="grass-webgl-canvas"]'),
  ).toHaveAttribute("data-grass-frame-signature", /.+/u, { timeout: 15_000 });
  if (options.pausePlayback !== false) await pauseGrassPlayback(page);
  return session;
}

export async function chooseGrassOption(
  control: ReturnType<Page["locator"]>,
  page: Page,
  option: string,
): Promise<void> {
  await control.getByRole("combobox").click();
  await page
    .locator('[role="listbox"]:visible [role="option"]')
    .filter({ hasText: option })
    .click();
}

export async function setGrassTimelineDuration(
  page: Page,
  durationSeconds: number,
): Promise<void> {
  if (!(await ensureGrassTimelineVisible(page))) return;
  await page.getByRole("button", { name: "Edit timeline duration" }).click();
  const input = page.getByRole("textbox", { name: "timeline duration" });
  await input.fill(String(durationSeconds));
  await input.press("Enter");
  await expect(
    page.getByRole("button", { name: "Edit timeline duration" }),
  ).toHaveText(`${durationSeconds}s`);
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

export async function readGrassArtifact(
  page: Page,
  buttonName: "Export PNG" | "Export Video",
  timeoutMs = 90_000,
): Promise<GrassArtifact> {
  const downloadPromise = page.waitForEvent("download", { timeout: timeoutMs });
  const stickyFooter = page.locator(
    '[data-slot="toolcraft-panel-sticky-actions"]',
  );
  await stickyFooter.evaluate((footer) => {
    const observerKey = Symbol.for("grass.sticky-footer-observer");
    const existing = Reflect.get(footer, observerKey) as
      MutationObserver | undefined;
    existing?.disconnect();
    const recordActiveState = () => {
      if (footer.getAttribute("data-sticky-footer-active") !== "true")
        return false;
      footer.setAttribute("data-grass-sticky-active-observed", "true");
      footer.setAttribute(
        "data-grass-sticky-progress-observed",
        footer.getAttribute("data-sticky-footer-progress") ?? "0",
      );
      return true;
    };
    if (!recordActiveState()) {
      const observer = new MutationObserver(() => {
        if (recordActiveState()) observer.disconnect();
      });
      observer.observe(footer, { attributes: true });
      Reflect.set(footer, observerKey, observer);
    }
  });
  await page.getByRole("button", { name: buttonName }).click();
  await expect(stickyFooter).toHaveAttribute(
    "data-grass-sticky-active-observed",
    "true",
  );
  const progress = Number(
    await stickyFooter.getAttribute("data-grass-sticky-progress-observed"),
  );
  expect(progress).toBeGreaterThanOrEqual(0);
  expect(progress).toBeLessThanOrEqual(1);
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  expect(stream).not.toBeNull();
  const bytes: number[] = [];
  for await (const chunk of stream!) {
    for (const byte of chunk as Uint8Array) bytes.push(byte);
  }
  await expect(stickyFooter).not.toHaveAttribute(
    "data-sticky-footer-active",
    "true",
  );
  await stickyFooter.evaluate((footer) => {
    const observerKey = Symbol.for("grass.sticky-footer-observer");
    const observer = Reflect.get(footer, observerKey) as
      MutationObserver | undefined;
    observer?.disconnect();
    Reflect.deleteProperty(footer, observerKey);
    footer.removeAttribute("data-grass-sticky-active-observed");
    footer.removeAttribute("data-grass-sticky-progress-observed");
  });
  expect(bytes.length).toBeGreaterThan(0);
  return { bytes, fileName: download.suggestedFilename() };
}

export async function inspectGrassImage(page: Page, artifact: GrassArtifact) {
  return page.evaluate(async ({ bytes, fileName }) => {
    const mediaType = fileName.endsWith(".jpg") ? "image/jpeg" : "image/png";
    const blob = new Blob([new Uint8Array(bytes)], { type: mediaType });
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context)
      throw new Error("Image inspection requires a 2D canvas context.");
    context.drawImage(bitmap, 0, 0);
    const corner = context.getImageData(0, 0, 1, 1).data;
    const hashCanvas = document.createElement("canvas");
    hashCanvas.width = 64;
    hashCanvas.height = 64;
    const hashContext = hashCanvas.getContext("2d", {
      willReadFrequently: true,
    });
    if (!hashContext)
      throw new Error("Image inspection requires a hash canvas context.");
    hashContext.drawImage(canvas, 0, 0, hashCanvas.width, hashCanvas.height);
    const hashPixels = hashContext.getImageData(
      0,
      0,
      hashCanvas.width,
      hashCanvas.height,
    ).data;
    let hash = 2_166_136_261;
    for (const byte of hashPixels) {
      hash ^= byte;
      hash = Math.imul(hash, 16_777_619);
    }
    bitmap.close();
    return {
      backgroundAlpha: corner[3] ?? 0,
      byteLength: bytes.length,
      contentHash: `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`,
      height: canvas.height,
      mediaType,
      width: canvas.width,
    };
  }, artifact);
}

export async function inspectGrassVideo(page: Page, artifact: GrassArtifact) {
  return page.evaluate(async ({ bytes, fileName }) => {
    const mediaType = fileName.endsWith(".mp4") ? "video/mp4" : "video/webm";
    const blob = new Blob([new Uint8Array(bytes)], { type: mediaType });
    const url = URL.createObjectURL(blob);
    const video = document.createElement("video");
    video.muted = true;
    video.preload = "auto";
    video.src = url;
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () =>
        reject(new Error("Exported video metadata did not decode."));
    });
    video.currentTime = Math.min(
      Math.max(0.04, video.duration * 0.08),
      video.duration,
    );
    await new Promise<void>((resolve, reject) => {
      video.onseeked = () => resolve();
      video.onerror = () =>
        reject(new Error("Exported video frame did not decode."));
    });
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context)
      throw new Error("Video inspection requires a 2D canvas context.");
    context.drawImage(video, 0, 0);
    const corner = context.getImageData(1, 1, 1, 1).data;
    URL.revokeObjectURL(url);
    return {
      backgroundIncluded:
        (corner[0] ?? 0) > 120 &&
        (corner[1] ?? 0) > 120 &&
        (corner[2] ?? 0) > 120,
      byteLength: bytes.length,
      durationMs: video.duration * 1_000,
      height: video.videoHeight,
      mediaType,
      width: video.videoWidth,
    };
  }, artifact);
}

export async function readGrassCanvasSignature(page: Page): Promise<string> {
  return (
    (await page
      .locator('[data-slot="grass-webgl-canvas"]')
      .getAttribute("data-grass-frame-signature")) ?? "missing"
  );
}

export async function readGrassTimelineTime(page: Page): Promise<number> {
  const text = await page.locator('[data-slot="timeline-panel"]').textContent();
  const match = text?.match(
    /([0-9]+(?:\.[0-9]+)?)\s*\/\s*([0-9]+(?:\.[0-9]+)?)s/u,
  );
  if (!match)
    throw new Error(`Could not read timeline time from ${String(text)}.`);
  return Number(match[1]);
}
