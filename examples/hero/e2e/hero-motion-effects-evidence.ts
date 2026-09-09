import type { Locator, Page } from "@playwright/test";

import { heroGalleryTargets } from "../src/app/hero-gallery-values";
import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import { getCanvasHandle } from "./canvas-handle-helpers";
import { enterHeroSliderValue } from "./hero-motion-live-slider-drag";
import { expect } from "./toolcraft-product-test";

import type { HeroMotionFrameEvidence, HeroMotionRawPixelSample } from "../src/app/hero-motion-pixel-types";
export type { HeroMotionFrameEvidence, HeroMotionRawPixelSample } from "../src/app/hero-motion-pixel-types";

export type HeroMotionPixelCaptureMatch = Readonly<{
  crtMaximum?: number;
  crtMinimum?: number;
  grainMaximum?: number;
  grainMinimum?: number;
  grainSize?: number;
}>;

export type HeroMotionPixelCaptureRequest = Readonly<{
  afterSequence: number;
  freezeAfterCapture?: boolean;
  match?: HeroMotionPixelCaptureMatch;
  maximumSamples: number;
}>;



type CapturedPixelSample = Omit<HeroMotionRawPixelSample, "pixels"> & {
  pixels: Uint8Array;
};

type PixelRequestState = {
  afterSequence: number;
  freezeAfterCapture: boolean;
  id: number;
  match: HeroMotionPixelCaptureMatch;
  maximumSamples: number;
  samples: CapturedPixelSample[];
};

type CapturedCanvas = HTMLCanvasElement & {
  __toolcraftMotionCapture?: {
    active: boolean;
    armPixelCapture(request: HeroMotionPixelCaptureRequest): number;
    cleanup(): void;
    frames: HeroMotionFrameEvidence[];
    frozen: boolean;
    pixelRequests: PixelRequestState[];
    resume(): void;
  };
};

export async function setHeroSwitch(
  page: Page,
  target: string,
  enabled: boolean,
): Promise<void> {
  const control = await getToolcraftControlFieldByTarget(page, target);
  const toggle = control.getByRole("switch");
  if ((await toggle.getAttribute("aria-checked")) !== String(enabled)) {
    await toggle.click();
  }
}

export async function freezeHeroSphereRows(page: Page): Promise<void> {
  const rows = page.locator(
    `[data-slot="toolcraft-runtime-app"] [data-toolcraft-control-target="${heroGalleryTargets.sphereRows}"]`,
  );
  await expect(rows).toBeVisible();
  const rowGroups = rows.locator('[data-slot="collection-item-group"]');
  const rowCount = await rowGroups.count();
  expect(rowCount).toBeGreaterThan(0);
  for (let index = 0; index < rowCount; index += 1) {
    const rowGroup = rowGroups.nth(index);
    const slider = rowGroup.getByRole("slider", { name: "Speed" });
    if ((await slider.getAttribute("aria-valuenow")) !== "0") {
      await enterHeroSliderValue(rowGroup, "0", "Speed");
    }
    await expect
      .poll(async () => Number(await slider.getAttribute("aria-valuenow")))
      .toBe(0);
    await expect.poll(async () => Number(await slider.inputValue())).toBe(0);
  }
}

export async function setFirstHeroSphereRowSpeed(
  page: Page,
  value: number,
): Promise<void> {
  const rows = page.locator(
    `[data-slot="toolcraft-runtime-app"] [data-toolcraft-control-target="${heroGalleryTargets.sphereRows}"]`,
  );
  const firstRow = rows.locator('[data-slot="collection-item-group"]').first();
  const slider = firstRow.getByRole("slider", { name: "Speed" });
  await enterHeroSliderValue(firstRow, String(value), "Speed");
  await expect
    .poll(async () => Number(await slider.getAttribute("aria-valuenow")))
    .toBe(value);
  await expect.poll(async () => Number(await slider.inputValue())).toBe(value);
}

export async function prepareHeroMotionUniformCapture(
  page: Page,
): Promise<void> {
  await page.addInitScript(() => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function getContext(
      this: HTMLCanvasElement,
      contextId: string,
      options?: unknown,
    ) {
      const context = originalGetContext.call(this, contextId, options);
      if (
        contextId !== "webgl" ||
        !(context instanceof WebGLRenderingContext) ||
        (this as CapturedCanvas).__toolcraftMotionCapture
      ) {
        return context;
      }
      const target = this as CapturedCanvas;
      const gl = context;
      type UniformField =
        | Exclude<keyof HeroMotionFrameEvidence, "panRate" | "sequence">
        | "panRate";
      const uniformFields = new Map<string, UniformField>([
        ["uCrt", "crt"],
        ["uCrtFlicker", "crtFlicker"],
        ["uCrtPitch", "crtPitch"],
        ["uCrtScanlines", "crtScanlines"],
        ["uEffectTime", "effectTime"],
        ["uFrameDt", "frameDt"],
        ["uGrain", "grain"],
        ["uGrainSize", "grainSize"],
        ["uPanRate", "panRate"],
      ]);
      const scalarCache: Record<UniformField, number> = {
        crt: 0,
        crtFlicker: 0,
        crtPitch: 0,
        crtScanlines: 0,
        effectTime: 0,
        frameDt: 0,
        grain: 0,
        grainSize: 0,
        panRate: 0,
      };
      const locationFields = new WeakMap<WebGLUniformLocation, UniformField>();
      const frames: HeroMotionFrameEvidence[] = [];
      const pixelRequests: PixelRequestState[] = [];
      const originalBindFramebuffer = gl.bindFramebuffer;
      const originalDrawArrays = gl.drawArrays;
      const originalGetUniformLocation = gl.getUniformLocation;
      const originalUniform1f = gl.uniform1f;
      const originalUniform2f = gl.uniform2f;
      const originalUseProgram = gl.useProgram;
      let currentFramebuffer: WebGLFramebuffer | null = null;
      let currentProgram: WebGLProgram | null = null;
      let nextPixelRequestId = 1;
      let nextSequence = 1;
      let postProgram: WebGLProgram | null = null;

      const captureMatches = (
        frame: HeroMotionFrameEvidence,
        match: HeroMotionPixelCaptureMatch,
      ): boolean =>
        (match.crtMaximum === undefined || frame.crt <= match.crtMaximum) &&
        (match.crtMinimum === undefined || frame.crt >= match.crtMinimum) &&
        (match.grainMaximum === undefined ||
          frame.grain <= match.grainMaximum) &&
        (match.grainMinimum === undefined ||
          frame.grain >= match.grainMinimum) &&
        (match.grainSize === undefined || frame.grainSize === match.grainSize);
      const readPixelSample = (
        frame: HeroMotionFrameEvidence,
      ): CapturedPixelSample => {
        const width = Math.max(2, Math.min(128, target.width));
        const height = Math.max(2, Math.min(64, target.height));
        const pixels = new Uint8Array(width * height * 4);
        gl.readPixels(
          Math.max(0, Math.floor((target.width - width) / 2)),
          Math.max(0, Math.floor((target.height - height) / 2)),
          width,
          height,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          pixels,
        );
        return { frame, height, pixels, width };
      };

      gl.getUniformLocation = function getUniformLocation(program, name) {
        const location = originalGetUniformLocation.call(gl, program, name);
        const field = uniformFields.get(name);
        if (location && field) locationFields.set(location, field);
        if (location && field === "effectTime") postProgram = program;
        return location;
      };
      gl.useProgram = function useProgram(program): void {
        originalUseProgram.call(gl, program);
        currentProgram = program;
      };
      gl.bindFramebuffer = function bindFramebuffer(
        bindingTarget,
        framebuffer,
      ) {
        originalBindFramebuffer.call(gl, bindingTarget, framebuffer);
        if (bindingTarget === gl.FRAMEBUFFER) currentFramebuffer = framebuffer;
      };
      gl.uniform1f = function uniform1f(location, value): void {
        originalUniform1f.call(gl, location, value);
        const field = location ? locationFields.get(location) : undefined;
        if (field && field !== "panRate") scalarCache[field] = value;
      };
      gl.uniform2f = function uniform2f(location, first, second): void {
        originalUniform2f.call(gl, location, first, second);
        if (location && locationFields.get(location) === "panRate") {
          scalarCache.panRate = Math.hypot(first, second);
        }
      };

      const capture = {
        active: false,
        armPixelCapture(request: HeroMotionPixelCaptureRequest): number {
          const id = nextPixelRequestId;
          nextPixelRequestId += 1;
          pixelRequests.push({
            afterSequence: request.afterSequence,
            freezeAfterCapture: request.freezeAfterCapture === true,
            id,
            match: request.match ?? {},
            maximumSamples: request.maximumSamples,
            samples: [],
          });
          return id;
        },
        cleanup(): void {
          gl.bindFramebuffer = originalBindFramebuffer;
          gl.drawArrays = originalDrawArrays;
          gl.getUniformLocation = originalGetUniformLocation;
          gl.uniform1f = originalUniform1f;
          gl.uniform2f = originalUniform2f;
          gl.useProgram = originalUseProgram;
        },
        frames,
        frozen: false,
        pixelRequests,
        resume(): void {
          capture.frozen = false;
        },
      };
      gl.drawArrays = function drawArrays(mode, first, count): void {
        const isPostDraw =
          mode === gl.TRIANGLES &&
          count === 3 &&
          currentFramebuffer === null &&
          currentProgram !== null &&
          currentProgram === postProgram;
        if (isPostDraw && capture.frozen) return;
        originalDrawArrays.call(gl, mode, first, count);
        if (!isPostDraw || !capture.active) return;
        const frame: HeroMotionFrameEvidence = {
          ...scalarCache,
          sequence: nextSequence,
        };
        nextSequence += 1;
        frames.push(frame);
        if (frames.length > 600) frames.splice(0, frames.length - 600);
        let sample: CapturedPixelSample | undefined;
        for (const request of pixelRequests) {
          if (
            request.samples.length >= request.maximumSamples ||
            frame.sequence <= request.afterSequence ||
            !captureMatches(frame, request.match)
          ) {
            continue;
          }
          sample ??= readPixelSample(frame);
          request.samples.push(sample);
          if (request.freezeAfterCapture) capture.frozen = true;
        }
      };
      target.__toolcraftMotionCapture = capture;
      return context;
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
}

export async function installHeroMotionUniformCapture(
  canvas: Locator,
): Promise<void> {
  await canvas.evaluate((element) => {
    const capture = (element as CapturedCanvas).__toolcraftMotionCapture;
    if (!capture) {
      throw new Error(
        "The motion capture bootstrap must run before WebGL starts.",
      );
    }
    capture.active = true;
    capture.frozen = false;
    capture.frames.length = 0;
  });
}

export async function readHeroMotionFrames(
  canvas: Locator,
  afterSequence = 0,
): Promise<HeroMotionFrameEvidence[]> {
  return canvas.evaluate((element, minimumSequence) => {
    const capture = (element as CapturedCanvas).__toolcraftMotionCapture;
    if (!capture) throw new Error("The motion capture is not installed.");
    return capture.frames.filter(({ sequence }) => sequence > minimumSequence);
  }, afterSequence);
}

export async function readLatestHeroMotionFrame(
  canvas: Locator,
): Promise<HeroMotionFrameEvidence | undefined> {
  return canvas.evaluate((element) => {
    const capture = (element as CapturedCanvas).__toolcraftMotionCapture;
    if (!capture) throw new Error("The motion capture is not installed.");
    return capture.frames.at(-1);
  });
}

export async function clearHeroMotionFrames(canvas: Locator): Promise<void> {
  await canvas.evaluate((element) => {
    const capture = (element as CapturedCanvas).__toolcraftMotionCapture;
    if (!capture) throw new Error("The motion capture is not installed.");
    capture.frames.length = 0;
  });
}

export async function armHeroMotionPixelCapture(
  canvas: Locator,
  request: HeroMotionPixelCaptureRequest,
): Promise<number> {
  if (
    !Number.isInteger(request.maximumSamples) ||
    request.maximumSamples < 1 ||
    request.maximumSamples > 12 ||
    (request.freezeAfterCapture === true && request.maximumSamples !== 1)
  ) {
    throw new Error(
      "Motion pixel capture must request 1..12 samples; freeze requires one.",
    );
  }
  return canvas.evaluate((element, captureRequest) => {
    const capture = (element as CapturedCanvas).__toolcraftMotionCapture;
    if (!capture) throw new Error("The motion capture is not installed.");
    return capture.armPixelCapture(captureRequest);
  }, request);
}

export async function readHeroMotionPixelSamples(
  canvas: Locator,
  requestId: number,
): Promise<HeroMotionRawPixelSample[]> {
  return canvas.evaluate((element, id) => {
    const capture = (element as CapturedCanvas).__toolcraftMotionCapture;
    if (!capture) throw new Error("The motion capture is not installed.");
    const request = capture.pixelRequests.find(
      (candidate) => candidate.id === id,
    );
    if (!request) throw new Error(`Unknown motion pixel request ${id}.`);
    return request.samples.map(({ pixels, ...sample }) => ({
      ...sample,
      pixels: Array.from(pixels),
    }));
  }, requestId);
}

export async function waitForHeroMotionPixelSamples(
  canvas: Locator,
  requestId: number,
  minimumSamples: number,
): Promise<HeroMotionRawPixelSample[]> {
  let samples: HeroMotionRawPixelSample[] = [];
  await expect
    .poll(async () => {
      samples = await readHeroMotionPixelSamples(canvas, requestId);
      return samples.length;
    })
    .toBeGreaterThanOrEqual(minimumSamples);
  return samples;
}

export async function resumeHeroMotionDraws(canvas: Locator): Promise<void> {
  await canvas.evaluate((element) => {
    const capture = (element as CapturedCanvas).__toolcraftMotionCapture;
    if (!capture) throw new Error("The motion capture is not installed.");
    capture.resume();
  });
}

export async function waitForHeroMotionCaptureToSettle(
  canvas: Locator,
): Promise<void> {
  let previousSequence = -1;
  let stableSamples = 0;
  await expect
    .poll(
      async () => {
        const sequence =
          (await readLatestHeroMotionFrame(canvas))?.sequence ?? 0;
        stableSamples = sequence === previousSequence ? stableSamples + 1 : 0;
        previousSequence = sequence;
        return stableSamples;
      },
      { intervals: [80], timeout: 10_000 },
    )
    .toBeGreaterThanOrEqual(2);
}

export async function disposeHeroMotionUniformCapture(
  canvas: Locator,
): Promise<void> {
  await canvas.evaluate((element) => {
    const target = element as CapturedCanvas;
    target.__toolcraftMotionCapture?.cleanup();
    delete target.__toolcraftMotionCapture;
  });
}

export async function beginHeroPanDrag(
  page: Page,
): Promise<Readonly<{ x: number; y: number }>> {
  const handle = getCanvasHandle(page, "hero-gallery-pan-handle");
  const bounds = await handle.boundingBox();
  if (!bounds) throw new Error("The Sphere pan handle must be measurable.");
  const start = {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  return start;
}

export async function moveHeroPanDrag(
  page: Page,
  start: Readonly<{ x: number; y: number }>,
  step: number,
): Promise<void> {
  await page.mouse.move(start.x + step * 18, start.y + step * 2, { steps: 2 });
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
  );
}
