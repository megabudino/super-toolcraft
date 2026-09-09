import { execFileSync } from "node:child_process";
import { stat } from "node:fs/promises";

import type { Download, Page } from "@playwright/test";

import { dotsBrowserTestName } from "../src/app/dots/dots-acceptance";
import { DOTS_DEFAULT_CYCLE_SECONDS } from "../src/app/dots/dots-timing";
import {
  expectToolcraftInfinityCanvasImageExportEvidence,
  expectToolcraftInfinityCanvasModeEvidence,
  expectToolcraftInfinityCanvasVideoExportEvidence,
  observeInfinityCanvas,
  type InfinityCanvasObservation,
} from "./browser-infinity-canvas-evidence";
import {
  chooseOption,
  exportDownload,
  inspectPng,
  outputSelector,
  pausePlayback,
} from "./dots-acceptance-support";
import { expect, test } from "./toolcraft-product-test";

type SceneRect = NonNullable<InfinityCanvasObservation["sceneRect"]>;

async function readCurrentSceneRect(page: Page): Promise<SceneRect> {
  const output = page.locator(outputSelector);
  const rect = {
    height: Number(
      await output.getAttribute("data-current-scene-height"),
    ),
    width: Number(
      await output.getAttribute("data-current-scene-width"),
    ),
    x: Number(await output.getAttribute("data-current-scene-x")),
    y: Number(await output.getAttribute("data-current-scene-y")),
  };
  expect(Object.values(rect).every(Number.isFinite)).toBe(true);
  expect(rect.width).toBeGreaterThan(0);
  expect(rect.height).toBeGreaterThan(0);
  return rect;
}

function outwardRoundSceneRect(rect: SceneRect): SceneRect {
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
  const pixelRatio = longEdge / Math.max(frame.width, frame.height);
  return frame.width >= frame.height
    ? {
        height: Math.max(1, Math.round(frame.height * pixelRatio)),
        width: longEdge,
      }
    : {
        height: longEdge,
        width: Math.max(1, Math.round(frame.width * pixelRatio)),
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

async function inspectVideo(download: Download): Promise<Readonly<{
  byteLength: number;
  durationMs: number;
  height: number;
  width: number;
}>> {
  const file = await download.path();
  expect(file).not.toBeNull();
  const metadata = await stat(file!);
  const probe = JSON.parse(
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
        file!,
      ],
      { encoding: "utf8" },
    ),
  ) as {
    format?: { duration?: string };
    streams?: Array<{ duration?: string; height?: number; width?: number }>;
  };
  const stream = probe.streams?.[0];
  const durationSeconds = Number(
    probe.format?.duration ?? stream?.duration ?? 0,
  );

  return {
    byteLength: metadata.size,
    durationMs: durationSeconds * 1_000,
    height: Number(stream?.height ?? 0),
    width: Number(stream?.width ?? 0),
  };
}

async function toggleInfinity(page: Page, enabled: boolean): Promise<void> {
  const control = page.locator(
    '[data-toolcraft-control-target="canvas.infinity"]',
  );
  const toggle = control.getByRole("switch");
  const expected = enabled ? "true" : "false";

  if ((await toggle.getAttribute("aria-checked")) !== expected) {
    await toggle.click();
  }
  await expect(toggle).toHaveAttribute("aria-checked", expected);
  await expect(
    page.locator("[data-toolcraft-canvas-mode]"),
  ).toHaveAttribute(
    "data-toolcraft-canvas-mode",
    enabled ? "infinite" : "finite",
  );
}

async function waitForPersistence(page: Page): Promise<void> {
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const raw = localStorage.getItem(
          "toolcraft:particle-typography:state:v2",
        );
        if (!raw) return null;
        const snapshot = JSON.parse(raw) as {
          state?: {
            canvas?: { mode?: unknown };
            timeline?: { durationSeconds?: unknown };
          };
        };
        return {
          duration: snapshot.state?.timeline?.durationSeconds,
          mode: snapshot.state?.canvas?.mode,
        };
      }),
    )
    .toEqual({
      duration: DOTS_DEFAULT_CYCLE_SECONDS,
      mode: "infinite",
    });
  await expect(
    page.locator('[data-slot="toolcraft-runtime-app"]'),
  ).toHaveAttribute("data-toolcraft-persistence-status", "success", {
    timeout: 10_000,
  });
}

async function openFresh(page: Page): Promise<void> {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator("[data-toolcraft-canvas-mode]")).toHaveAttribute(
    "data-toolcraft-canvas-mode",
    "infinite",
  );
  await toggleInfinity(page, false);
  await pausePlayback(page);
  await expect(page.locator(outputSelector)).toHaveAttribute(
    "data-timeline-duration",
    String(DOTS_DEFAULT_CYCLE_SECONDS),
  );
  await expect(page.locator(outputSelector)).toBeVisible();
}

async function readFiniteFrame(
  page: Page,
): Promise<Readonly<{ height: number; width: number }>> {
  return {
    height: Number(
      await page.locator(outputSelector).getAttribute("data-canvas-height"),
    ),
    width: Number(
      await page.locator(outputSelector).getAttribute("data-canvas-width"),
    ),
  };
}

test.setTimeout(180_000);

test(dotsBrowserTestName("canvas.infinity.mode"), async ({ page }) => {
    await openFresh(page);
    const before = await observeInfinityCanvas(page, outputSelector);
    await toggleInfinity(page, true);
    const enabled = await observeInfinityCanvas(page, outputSelector);
    expect(enabled.sceneRect).not.toBeNull();
    const expectedSceneRect = enabled.sceneRect!;

    const viewport = page.locator(
      '[data-slot="toolcraft-runtime-canvas"]',
    );
    const viewportBox = await viewport.boundingBox();
    expect(viewportBox).not.toBeNull();
    await page.mouse.move(
      viewportBox!.x + viewportBox!.width * 0.7,
      viewportBox!.y + viewportBox!.height * 0.7,
    );
    await page.mouse.down();
    await page.mouse.move(
      viewportBox!.x + viewportBox!.width * 0.7 + 80,
      viewportBox!.y + viewportBox!.height * 0.7 + 48,
      { steps: 5 },
    );
    await page.mouse.up();
    const afterPan = await observeInfinityCanvas(page, outputSelector);

    await waitForPersistence(page);
    await page.reload();
    await pausePlayback(page);
    await expect(page.locator(outputSelector)).toHaveAttribute(
      "data-timeline-duration",
      String(DOTS_DEFAULT_CYCLE_SECONDS),
    );
    await expect
      .poll(
        async () =>
          (await observeInfinityCanvas(page, outputSelector)).sceneRect,
        { timeout: 10_000 },
      )
      .toEqual(expectedSceneRect);
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
  },
);

test(
  dotsBrowserTestName("canvas.infinity.image-export"),
  async ({ page }) => {
    await openFresh(page);
    const imageResolution = page.locator(
      '[data-toolcraft-control-target="export.image.resolution"]',
    );
    await chooseOption(page, imageResolution, "2K");
    const finiteFrame = await readFiniteFrame(page);
    const finiteImage = await inspectPng(
      await exportDownload(page, "Export PNG"),
    );
    await toggleInfinity(page, true);
    const infiniteImageFrame = outwardRoundSceneRect(
      await readCurrentSceneRect(page),
    );
    const infiniteImage = await inspectPng(
      await exportDownload(page, "Export PNG"),
    );

    await expectToolcraftInfinityCanvasImageExportEvidence(
      { finite: finiteImage, infinite: infiniteImage },
      {
        expectedFiniteSize: imageSize(finiteFrame, 2048),
        expectedInfiniteSize: imageSize(infiniteImageFrame, 2048),
        requirementId: "canvas.infinity.image-export",
        target: "canvas.infinity",
      },
    );
  },
);

test(
  dotsBrowserTestName("canvas.infinity.video-export"),
  async ({ page }) => {
    await openFresh(page);
    const finiteFrame = await readFiniteFrame(page);
    const finiteVideo = await inspectVideo(
      await exportDownload(page, "Export Video"),
    );
    await toggleInfinity(page, true);
    const infiniteObservation = await observeInfinityCanvas(
      page,
      outputSelector,
    );
    expect(infiniteObservation.sceneRect).not.toBeNull();
    const infiniteFrame = outwardRoundSceneRect(
      infiniteObservation.sceneRect!,
    );
    const infiniteVideo = await inspectVideo(
      await exportDownload(page, "Export Video"),
    );

    await expectToolcraftInfinityCanvasVideoExportEvidence(
      { finite: finiteVideo, infinite: infiniteVideo },
      {
        expectedFiniteSize: videoCurrentSize(finiteFrame),
        expectedInfiniteSize: videoCurrentSize(infiniteFrame),
        requirementId: "canvas.infinity.video-export",
        target: "canvas.infinity",
      },
    );
  },
);
