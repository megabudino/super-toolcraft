import type { Locator, Page } from "@playwright/test";

import { heroPreviewSelector } from "./hero-preview-browser-helpers";
import {
  armHeroMotionPixelCapture,
  beginHeroPanDrag,
  disposeHeroMotionUniformCapture,
  installHeroMotionUniformCapture,
  moveHeroPanDrag,
  readHeroMotionFrames,
  readLatestHeroMotionFrame,
  resumeHeroMotionDraws,
  waitForHeroMotionPixelSamples,
} from "./hero-motion-effects-evidence";
import {
  getSphereCanvas,
  prepareQuietSphere,
  undoHeroPan,
} from "./hero-motion-effects-test-helpers";
import { requestHeroGallerySnapshot } from "./hero-gallery-snapshot-helpers";
import { expect, test } from "./toolcraft-product-test";

type RafProbeWindow = Window & {
  __toolcraftMotionRafProbe?: {
    cleanup(): void;
    timestamps: number[];
  };
};

type PostCountCanvas = HTMLCanvasElement & {
  __toolcraftPostCount?: {
    count: number;
  };
};

function median(values: readonly number[]): number {
  const sorted = [...values].sort((first, second) => first - second);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

const MAX_P95_ABSOLUTE_DELTA_MS = 20;
const MAX_P95_RATIO = 1.5;
const MAX_STALL_COUNT_EXCESS = 1;
const MAX_GAP_EXCESS_MS = 100;

function percentile(values: readonly number[], ratio: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((first, second) => first - second);
  return sorted[Math.max(0, Math.ceil(sorted.length * ratio) - 1)] ?? 0;
}

function summarizeFrameGaps(values: readonly number[]): Readonly<{
  count: number;
  maximum: number;
  median: number;
  p95: number;
  stallCount: number;
  stallMaximum: number;
}> {
  const stalls = values.filter((value) => value > 50);
  return {
    count: values.length,
    maximum: Math.max(0, ...values),
    median: median(values),
    p95: percentile(values, 0.95),
    stallCount: stalls.length,
    stallMaximum: Math.max(0, ...stalls),
  };
}

async function installRafProbe(canvas: Locator): Promise<void> {
  await canvas.evaluate(() => {
    const owner = window as RafProbeWindow;
    owner.__toolcraftMotionRafProbe?.cleanup();
    const original = window.requestAnimationFrame;
    const timestamps: number[] = [];
    window.requestAnimationFrame = (callback) =>
      original.call(window, (timestamp) => {
        timestamps.push(timestamp);
        callback(timestamp);
      });
    owner.__toolcraftMotionRafProbe = {
      cleanup() {
        window.requestAnimationFrame = original;
      },
      timestamps,
    };
  });
}

async function readAndDisposeRafProbe(canvas: Locator): Promise<number[]> {
  return canvas.evaluate(() => {
    const owner = window as RafProbeWindow;
    const timestamps = owner.__toolcraftMotionRafProbe?.timestamps ?? [];
    owner.__toolcraftMotionRafProbe?.cleanup();
    delete owner.__toolcraftMotionRafProbe;
    return timestamps
      .slice(1)
      .map((timestamp, index) => timestamp - timestamps[index]!)
      .filter((delta) => delta > 0);
  });
}

async function preparePostCountProbe(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function getContext(
      contextId: string,
      options?: unknown,
    ) {
      const context = originalGetContext.call(this, contextId, options);
      if (
        contextId !== "webgl" ||
        !(context instanceof WebGLRenderingContext) ||
        (this as PostCountCanvas).__toolcraftPostCount
      ) {
        return context;
      }
      const target = this as PostCountCanvas;
      const gl = context;
      const state = { count: 0 };
      const originalBindFramebuffer = gl.bindFramebuffer;
      const originalDrawArrays = gl.drawArrays;
      let currentFramebuffer: WebGLFramebuffer | null = null;
      gl.bindFramebuffer = function bindFramebuffer(
        bindingTarget,
        framebuffer,
      ) {
        originalBindFramebuffer.call(gl, bindingTarget, framebuffer);
        if (bindingTarget === gl.FRAMEBUFFER) currentFramebuffer = framebuffer;
      };
      gl.drawArrays = function drawArrays(mode, first, count): void {
        originalDrawArrays.call(gl, mode, first, count);
        if (
          mode === gl.TRIANGLES &&
          count === 3 &&
          currentFramebuffer === null
        ) {
          state.count += 1;
        }
      };
      target.__toolcraftPostCount = state;
      return context;
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
}

async function resetPostCount(canvas: Locator): Promise<void> {
  await canvas.evaluate((element) => {
    const state = (element as PostCountCanvas).__toolcraftPostCount;
    if (!state) throw new Error("The post count probe is unavailable.");
    state.count = 0;
  });
}

async function readPostCount(canvas: Locator): Promise<number> {
  return canvas.evaluate((element) => {
    const state = (element as PostCountCanvas).__toolcraftPostCount;
    if (!state) throw new Error("The post count probe is unavailable.");
    return state.count;
  });
}

function getWrappedEffectTimeDelta(start: number, end: number): number {
  return end >= start ? end - start : 1000 - start + end;
}

async function runFourMovePan(page: Page): Promise<string> {
  const output = page.locator(heroPreviewSelector);
  const initialPan = await output.getAttribute("data-hero-gallery-pan");
  if (!initialPan) throw new Error("The initial Pan must be observable.");
  const start = await beginHeroPanDrag(page);
  try {
    for (let step = 1; step <= 4; step += 1) {
      await moveHeroPanDrag(page, start, step);
    }
  } finally {
    await page.mouse.up();
  }
  await expect
    .poll(() => output.getAttribute("data-hero-gallery-pan"))
    .not.toBe(initialPan);
  return (await output.getAttribute("data-hero-gallery-pan"))!;
}

test.setTimeout(180_000);

test("motion observer preserves real Pan and renderer frame cadence", async ({
  page,
}) => {
  await preparePostCountProbe(page);
  await prepareQuietSphere(page, { motionCapture: false });
  const canvas = getSphereCanvas(page);
  const output = page.locator(heroPreviewSelector);
  const initialPan = await output.getAttribute("data-hero-gallery-pan");
  if (!initialPan) throw new Error("The baseline Pan must be observable.");

  await resetPostCount(canvas);
  await installRafProbe(canvas);
  const observerOffPan = await runFourMovePan(page);
  const observerOffFrameGaps = await readAndDisposeRafProbe(canvas);
  const observerOffPostCount = await readPostCount(canvas);
  await undoHeroPan(page, initialPan);

  await prepareQuietSphere(page);
  const observerCanvas = getSphereCanvas(page);
  await installHeroMotionUniformCapture(observerCanvas);
  await resetPostCount(observerCanvas);
  await installRafProbe(observerCanvas);
  const observerOnPan = await runFourMovePan(page);
  const observerOnFrameGaps = await readAndDisposeRafProbe(observerCanvas);
  const observerOnPostCount = await readPostCount(observerCanvas);
  const observerFrames = await readHeroMotionFrames(observerCanvas);
  const frameDtErrors = observerFrames.slice(1).map((frame, index) => {
    const previous = observerFrames[index]!;
    return Math.abs(
      getWrappedEffectTimeDelta(previous.effectTime, frame.effectTime) -
        frame.frameDt,
    );
  });

  const observerOffGaps = summarizeFrameGaps(observerOffFrameGaps);
  const observerOnGaps = summarizeFrameGaps(observerOnFrameGaps);
  const p95Ratio =
    observerOffGaps.p95 === 0
      ? observerOnGaps.p95 === 0
        ? 1
        : Number.POSITIVE_INFINITY
      : observerOnGaps.p95 / observerOffGaps.p95;
  const postCountRatio =
    observerOffPostCount === 0
      ? observerOnPostCount === 0
        ? 1
        : Number.POSITIVE_INFINITY
      : observerOnPostCount / observerOffPostCount;
  expect(observerOnPan).toBe(observerOffPan);
  expect(observerOffPostCount).toBeGreaterThan(0);
  expect(observerOnPostCount).toBeGreaterThan(0);
  expect(
    Math.abs(observerOnPostCount - observerOffPostCount),
  ).toBeLessThanOrEqual(2);
  expect(postCountRatio).toBeGreaterThanOrEqual(0.95);
  expect(postCountRatio).toBeLessThanOrEqual(1.05);
  expect(
    Math.max(0, ...observerFrames.map(({ panRate }) => panRate)),
  ).toBeGreaterThan(0);
  expect(observerOffGaps.count).toBeGreaterThan(0);
  expect(observerOnGaps.count).toBeGreaterThan(0);
  expect(
    Math.abs(observerOnGaps.p95 - observerOffGaps.p95),
  ).toBeLessThanOrEqual(MAX_P95_ABSOLUTE_DELTA_MS);
  expect(p95Ratio).toBeLessThanOrEqual(MAX_P95_RATIO);
  expect(
    observerOnGaps.stallCount - observerOffGaps.stallCount,
  ).toBeLessThanOrEqual(MAX_STALL_COUNT_EXCESS);
  expect(observerOnGaps.maximum - observerOffGaps.maximum).toBeLessThanOrEqual(
    MAX_GAP_EXCESS_MS,
  );
  expect(Math.max(0, ...frameDtErrors)).toBeLessThan(0.000_01);

  const lastSequence = (await readLatestHeroMotionFrame(observerCanvas))!
    .sequence;
  const freezeRequest = await armHeroMotionPixelCapture(observerCanvas, {
    afterSequence: lastSequence,
    freezeAfterCapture: true,
    maximumSamples: 1,
  });
  await requestHeroGallerySnapshot(page);
  const [frozenSample] = await waitForHeroMotionPixelSamples(
    observerCanvas,
    freezeRequest,
    1,
  );
  expect(frozenSample).toBeDefined();
  try {
    await requestHeroGallerySnapshot(page);
    expect((await readLatestHeroMotionFrame(observerCanvas))?.sequence).toBe(
      frozenSample!.frame.sequence,
    );
  } finally {
    await resumeHeroMotionDraws(observerCanvas);
  }
  await requestHeroGallerySnapshot(page);
  expect(
    (await readLatestHeroMotionFrame(observerCanvas))!.sequence,
  ).toBeGreaterThan(frozenSample!.frame.sequence);
  await disposeHeroMotionUniformCapture(observerCanvas);
  expect(
    await observerCanvas.evaluate(
      (element) => "__toolcraftMotionCapture" in (element as HTMLCanvasElement),
    ),
  ).toBe(false);
});
