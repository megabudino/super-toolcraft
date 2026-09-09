import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";

import type { Download, Page } from "@playwright/test";

import { dotRingBrowserTestName } from "../src/app/app-acceptance-data";
import {
  expectToolcraftInfinityCanvasImageExportEvidence,
  expectToolcraftInfinityCanvasModeEvidence,
  expectToolcraftInfinityCanvasVideoExportEvidence,
  observeInfinityCanvas,
  type InfinityCanvasObservation,
} from "./browser-infinity-canvas-evidence";
import { expect, test } from "./toolcraft-product-test";

const outputSelector = "[data-dot-ring-renderer]";
const persistenceKey = "toolcraft:dot-ring-studio:state:v2";

type SceneRect = NonNullable<InfinityCanvasObservation["sceneRect"]>;

function outwardRound(rect: SceneRect): SceneRect {
  const x = Math.floor(rect.x);
  const y = Math.floor(rect.y);
  return {
    height: Math.ceil(rect.y + rect.height) - y,
    width: Math.ceil(rect.x + rect.width) - x,
    x,
    y,
  };
}

function imageSize(
  frame: Pick<SceneRect, "height" | "width">,
  longEdge: number,
): Readonly<{ height: number; width: number }> {
  const ratio = longEdge / Math.max(frame.width, frame.height);
  return frame.width >= frame.height
    ? {
        height: Math.max(1, Math.round(frame.height * ratio)),
        width: longEdge,
      }
    : {
        height: longEdge,
        width: Math.max(1, Math.round(frame.width * ratio)),
      };
}

function videoCurrentSize(
  frame: Pick<SceneRect, "height" | "width">,
): Readonly<{ height: number; width: number }> {
  const roundEven = (value: number): number =>
    Math.max(2, Math.round(value / 2) * 2);
  return {
    height: roundEven(frame.height),
    width: roundEven(frame.width),
  };
}

async function pausePlayback(page: Page): Promise<void> {
  const pause = page.getByRole("button", { name: "Pause playback" });
  if (await pause.isVisible().catch(() => false)) await pause.click();
}

async function openFresh(page: Page): Promise<void> {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await pausePlayback(page);
  await expect(page.locator(outputSelector)).toBeVisible();
}

async function waitForSettledInfinityBounds(page: Page): Promise<void> {
  await expect(page.locator(outputSelector)).toHaveAttribute(
    "data-scene-bounds-status",
    "settled",
  );
}

async function toggleInfinity(page: Page, enabled: boolean): Promise<void> {
  const field = page.locator(
    '[data-toolcraft-control-target="canvas.infinity"]',
  );
  const toggle = field.getByRole("switch");
  const expected = enabled ? "true" : "false";

  if ((await toggle.getAttribute("aria-checked")) !== expected) {
    await toggle.click();
  }
  await expect(toggle).toHaveAttribute("aria-checked", expected);
  await expect(page.locator("[data-toolcraft-canvas-mode]")).toHaveAttribute(
    "data-toolcraft-canvas-mode",
    enabled ? "infinite" : "finite",
  );
  if (enabled) {
    await waitForSettledInfinityBounds(page);
  }
}

async function chooseOption(
  page: Page,
  target: string,
  label: string,
): Promise<void> {
  const control = page.locator(
    `[data-toolcraft-control-target="${target}"]`,
  );
  const trigger = control.getByRole("combobox");
  await trigger.click();
  await page.locator('[role="option"]').filter({ hasText: label }).last().click();
}

async function editTimelineDuration(
  page: Page,
  value: string,
): Promise<number> {
  const playback = page.getByRole("slider", { name: "Playback position" });
  if ((await playback.count()) === 0) {
    const timeline = page.locator(
      '[data-toolcraft-control-target="panels.timeline.extended"]',
    );
    await timeline.getByRole("switch").click();
  }
  await expect(playback).toBeVisible();
  await page.getByRole("button", { name: "Edit timeline duration" }).click();
  const input = page.getByRole("textbox", { name: "timeline duration" });
  await input.fill(value);
  await input.press("Enter");
  const duration = Number(
    await page
      .getByRole("slider", { name: "Playback position" })
      .getAttribute("aria-valuemax"),
  );
  expect(duration).toBeGreaterThan(0);
  return duration;
}

async function exportDownload(
  page: Page,
  label: "Export PNG" | "Export Video",
): Promise<Download> {
  const pending = page.waitForEvent("download", { timeout: 90_000 });
  await page.getByRole("button", { name: label }).click();
  return pending;
}

async function inspectPng(download: Download): Promise<Readonly<{
  byteLength: number;
  height: number;
  width: number;
}>> {
  const path = await download.path();
  expect(path).not.toBeNull();
  const bytes = readFileSync(path!);
  expect(bytes.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  return {
    byteLength: bytes.byteLength,
    height: bytes.readUInt32BE(20),
    width: bytes.readUInt32BE(16),
  };
}

async function inspectVideo(download: Download): Promise<Readonly<{
  byteLength: number;
  durationMs: number;
  height: number;
  width: number;
}>> {
  const path = await download.path();
  expect(path).not.toBeNull();
  const metadata = JSON.parse(
    execFileSync(
      "ffprobe",
      [
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=width,height,duration:format=duration",
        "-of",
        "json",
        path!,
      ],
      { encoding: "utf8" },
    ),
  ) as {
    format?: { duration?: string };
    streams?: Array<{ duration?: string; height?: number; width?: number }>;
  };
  const stream = metadata.streams?.[0];
  return {
    byteLength: statSync(path!).size,
    durationMs:
      Number(metadata.format?.duration ?? stream?.duration ?? 0) * 1_000,
    height: Number(stream?.height ?? 0),
    width: Number(stream?.width ?? 0),
  };
}

async function currentSceneRect(page: Page): Promise<SceneRect> {
  const output = page.locator(outputSelector);
  const rect = {
    height: Number(await output.getAttribute("data-current-scene-height")),
    width: Number(await output.getAttribute("data-current-scene-width")),
    x: Number(await output.getAttribute("data-current-scene-x")),
    y: Number(await output.getAttribute("data-current-scene-y")),
  };
  expect(Object.values(rect).every(Number.isFinite)).toBe(true);
  expect(rect.width).toBeGreaterThan(0);
  expect(rect.height).toBeGreaterThan(0);
  return rect;
}

test.setTimeout(180_000);

test(dotRingBrowserTestName("canvas.infinity.mode"), async ({ page }) => {
  await openFresh(page);
  const initialDefault = await observeInfinityCanvas(page, outputSelector);
  expect(initialDefault.canvasMode).toBe("infinite");
  expect(initialDefault.artboardPresent).toBe(false);
  expect(initialDefault.finiteControlsPresent).toBe(false);
  await toggleInfinity(page, false);
  const before = await observeInfinityCanvas(page, outputSelector);
  await toggleInfinity(page, true);
  const enabled = await observeInfinityCanvas(page, outputSelector);
  expect(enabled.sceneRect).not.toBeNull();
  const expectedSceneRect = enabled.sceneRect!;

  const viewport = page.locator('[data-slot="toolcraft-runtime-canvas"]');
  const box = await viewport.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width * 0.65, box!.y + box!.height * 0.6);
  await page.mouse.down();
  await page.mouse.move(
    box!.x + box!.width * 0.65 + 84,
    box!.y + box!.height * 0.6 + 52,
    { steps: 5 },
  );
  await page.mouse.up();
  const afterPan = await observeInfinityCanvas(page, outputSelector);

  await expect
    .poll(() =>
      page.evaluate((key) => {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const snapshot = JSON.parse(raw) as {
          state?: { canvas?: { mode?: unknown } };
        };
        return snapshot.state?.canvas?.mode ?? null;
      }, persistenceKey),
    )
    .toBe("infinite");
  await page.reload();
  await pausePlayback(page);
  await expect(page.locator(outputSelector)).toBeVisible();
  await waitForSettledInfinityBounds(page);
  const afterReload = await observeInfinityCanvas(page, outputSelector);

  await toggleInfinity(page, false);
  const restored = await observeInfinityCanvas(page, outputSelector);
  await page.getByRole("button", { name: "Undo" }).click();
  const undone = await observeInfinityCanvas(page, outputSelector);
  await page.getByRole("button", { name: "Redo" }).click();
  const redone = await observeInfinityCanvas(page, outputSelector);

  await expectToolcraftInfinityCanvasModeEvidence(
    {
      afterPan,
      afterReload,
      before,
      enabled,
      redone,
      restored,
      undone,
    },
    {
      expectedSceneRect,
      requirementId: "canvas.infinity.mode",
      target: "canvas.infinity",
    },
  );
});

test(
  dotRingBrowserTestName("canvas.infinity.image-export"),
  async ({ page }) => {
    await openFresh(page);
    await chooseOption(page, "export.image.resolution", "2K");
    await toggleInfinity(page, false);
    const finite = await inspectPng(await exportDownload(page, "Export PNG"));
    await toggleInfinity(page, true);
    const frame = outwardRound(await currentSceneRect(page));
    const infinite = await inspectPng(await exportDownload(page, "Export PNG"));

    await expectToolcraftInfinityCanvasImageExportEvidence(
      { finite, infinite },
      {
        expectedFiniteSize: { height: 2048, width: 2048 },
        expectedInfiniteSize: imageSize(frame, 2048),
        requirementId: "canvas.infinity.image-export",
        target: "canvas.infinity",
      },
    );
  },
);

test(
  dotRingBrowserTestName("canvas.infinity.video-export"),
  async ({ page }) => {
    await openFresh(page);
    await editTimelineDuration(page, "0.4s");
    await chooseOption(page, "export.video.format", "WebM");
    await toggleInfinity(page, false);
    const finite = await inspectVideo(
      await exportDownload(page, "Export Video"),
    );
    await toggleInfinity(page, true);
    const observation = await observeInfinityCanvas(page, outputSelector);
    expect(observation.sceneRect).not.toBeNull();
    const frame = outwardRound(observation.sceneRect!);
    const infinite = await inspectVideo(
      await exportDownload(page, "Export Video"),
    );

    await expectToolcraftInfinityCanvasVideoExportEvidence(
      { finite, infinite },
      {
        expectedFiniteSize: { height: 1024, width: 1024 },
        expectedInfiniteSize: videoCurrentSize(frame),
        requirementId: "canvas.infinity.video-export",
        target: "canvas.infinity",
      },
    );
  },
);
