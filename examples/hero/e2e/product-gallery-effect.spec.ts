import type { Locator, Page } from "@playwright/test";

import { heroDispersionTargets } from "../src/app/hero-dispersion-values";
import { heroGalleryTargets } from "../src/app/hero-gallery-values";
import { HERO_PREVIEW_PROTOCOL_VERSION } from "../src/app/hero-preview-protocol";
import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import { getCanvasHandle } from "./canvas-handle-helpers";
import {
  heroFrameSelector,
  waitForWebsitePreview,
} from "./hero-preview-browser-helpers";
import {
  type HeroGallerySnapshotArtifact,
  requestHeroGallerySnapshot,
} from "./hero-gallery-snapshot-helpers";
import { attachToolcraftBrowserRuntimeEvidence } from "./browser-runtime-evidence";
import { expect, test } from "./toolcraft-product-test";

type SampledSnapshot = Readonly<{
  height: number;
  pixels: readonly number[];
  width: number;
}>;

type MotionFrameCapture = Readonly<{
  frames: readonly SampledSnapshot[];
  pan: Readonly<{ x: number; y: number }>;
  renderedPan: string;
}>;

type RelativeRegion = Readonly<{
  bottom: number;
  left: number;
  right: number;
  top: number;
}>;

const fullRegion = { bottom: 1, left: 0, right: 1, top: 0 };
const firstSphereRowRegion = {
  bottom: 0.46,
  left: 0.08,
  right: 0.92,
  top: 0.08,
};
const secondSphereRowRegion = {
  bottom: 0.92,
  left: 0.08,
  right: 0.92,
  top: 0.54,
};

const rowOnePngFixture = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAAAJ1BMVEUAAAD///8aGhpERETc3Nzv7++7u7ufn5+AgIBgYGAwMDCQkJBwcHDh4iCjAAAACXBIWXMAAAsTAAALEwEAmpwYAAAADnRFWHRTb2Z0d2FyZQBGaWdtYZ6xlmMAAAEDSURBVHja7VXLEoQgDLOUIg///3t3HRi3oDsSnPFETh5o2iZtXZaJiYk7sLNE4hKPhcdvdIENA/FBSMFGOD812LB4Y+kZg6czoC5KAbUOiII5ZK1bAbxYj5SsCBzaQdo/dRemmyC/518xoBFGJdR+pO4lyO+1nkXUtwiiIthGCP5p4EdccIqA35uDbL6YQQ0P5VK9CwY4B3SxjX70FqFjGB7GV9tzQDb4GFVYB/TT4dEUAIt0CelhSNUdbRh6nNSzTyxwCbUE7GEzawn45EnEfkl80tRBEuwHwDUMdzdB2tdGoBLiOV2rY+g5BJqg/dNb0y9BbpiRabJXirmBgZ6YmHgdH9tYBkv+9ZJmAAAAAElFTkSuQmCC",
  "base64",
);
const rowTwoPngFixture = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAALQAAAC0CAMAAAAKE/YAAAAAG1BMVEUAAAD////b29sbGxtwcHC8vLyZmZlERETv7+/O7BXyAAAACXBIWXMAAAsTAAALEwEAmpwYAAAADnRFWHRTb2Z0d2FyZQBGaWdtYZ6xlmMAAALLSURBVHja7ZtRb8MwCIRrDCb//xcv0iZt65rG2Gk5T/c99+FEMZwxud0IIYQQQgghhBBCCCGEEEK6qa5NpOyIWFOv+JLdtnKHNIcOsv5R/MmGq9ulHCOKmCfVynMAZVcpp4hiaT7K5jsMKdhaOtl0Pc07DSWft4DoInWVMwinupWynGotZTnV0eSAUN3KCLk1pJYxdL1A712mrhfovaMvVTryE0QeWv79wgWcIH7k5HoKoeIcw68S3KE6K9RyrKTDRSlK7dDAGTWQ2iEhw5pyR7en7blh5sfflK4npeXwf0lM6d8qzvOjIlTpFvQliiDagz2+IRSPGnRTgtAP735w3hQBKp502Knsk2hnLc4ARcvZuWqAPfEC0ZovWv+DaGWkmdNrVY8L6rSzIw55j3vRG6D3mHd5hiDaT0c56X7aTyqYIl7H68nfjWjyHhy0LXYOBWOE4KGUVoz5Y2xYUzHGYj8moRX0tejpALJhjvIeHbXvUS/sq4vNDNUr0DuRdD5fpL1/+uOtH+1YtEl8aQ5teqA82doymu0bGdQs6zwtJya0Lqh5PI8zC4csqHk2pRtMQyngK5BtRrNVnBUP9E3TiZRuFcojoa8hj7WW5K8CRlpL+mb9tliQ56t0kkPVa0W/Z/nKrhX9nqYuF4t+x/Cjp7WIge2capf13LBC3bruf6HTKhApLcGVe0VwSxIsjK8ue977fxtQqFuvaAcKtXWfrIbTYfrLQazs1XS3JHGTYuluSQZcime7JRkwsZZ9AZCRWYMmX8Rl5NvKl83KNGgmFCHULSg6ZEFe1WEkats8v8PUuNe09A7jcdGhs2iZ41IZvbx74kVcRr/AtcRxqdxwQu1jlz5L7TA6JtpTO4wNXq9bZofZBkWHyp5mPVvIzMyyJo1LZWZoaUnjUpmaaXvOuFSmnh4TP4InhBBCCCGEEEIIIYQQQgghhHzyAcJgIJjW6MJFAAAAAElFTkSuQmCC",
  "base64",
);

async function enterSliderValue(
  control: Locator,
  value: string,
): Promise<void> {
  await control.getByRole("button", { name: /Edit .* value/ }).click();
  const input = control.getByRole("textbox");
  await input.fill(value);
  await input.press("Enter");
}

function regionMeanDelta(
  before: SampledSnapshot,
  after: SampledSnapshot,
  regions: readonly RelativeRegion[],
): number {
  if (before.width !== after.width || before.height !== after.height) {
    throw new Error("Hero gallery samples must use the same dimensions.");
  }

  let channelDelta = 0;
  let channelCount = 0;
  for (const region of regions) {
    const startX = Math.floor(before.width * region.left);
    const endX = Math.ceil(before.width * region.right);
    const startY = Math.floor(before.height * region.top);
    const endY = Math.ceil(before.height * region.bottom);
    for (let y = startY; y < endY; y += 1) {
      for (let x = startX; x < endX; x += 1) {
        const offset = (y * before.width + x) * 4;
        for (let channel = 0; channel < 4; channel += 1) {
          channelDelta += Math.abs(
            (before.pixels[offset + channel] ?? 0) -
              (after.pixels[offset + channel] ?? 0),
          );
          channelCount += 1;
        }
      }
    }
  }
  return channelDelta / Math.max(1, channelCount);
}

function regionOpaqueRatio(
  snapshot: SampledSnapshot,
  region: RelativeRegion,
): number {
  const startX = Math.floor(snapshot.width * region.left);
  const endX = Math.ceil(snapshot.width * region.right);
  const startY = Math.floor(snapshot.height * region.top);
  const endY = Math.ceil(snapshot.height * region.bottom);
  let opaquePixels = 0;
  let pixelCount = 0;

  for (let y = startY; y < endY; y += 1) {
    for (let x = startX; x < endX; x += 1) {
      if ((snapshot.pixels[(y * snapshot.width + x) * 4 + 3] ?? 0) > 24) {
        opaquePixels += 1;
      }
      pixelCount += 1;
    }
  }

  return opaquePixels / Math.max(1, pixelCount);
}

async function decodeHeroGallerySnapshot(
  page: Page,
  artifact: HeroGallerySnapshotArtifact,
): Promise<SampledSnapshot> {
  return page.evaluate(async (base64) => {
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (character) =>
      character.charCodeAt(0),
    );
    const bitmap = await createImageBitmap(
      new Blob([bytes], { type: "image/png" }),
    );
    try {
      const width = 160;
      const height = 90;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) {
        throw new Error("Unable to inspect hero gallery row pixels.");
      }
      context.imageSmoothingEnabled = false;
      context.drawImage(bitmap, 0, 0, width, height);
      return {
        height,
        pixels: Array.from(context.getImageData(0, 0, width, height).data),
        width,
      };
    } finally {
      bitmap.close();
    }
  }, artifact.base64);
}

async function armMotionPostDrawCapture(canvas: Locator): Promise<void> {
  await canvas.evaluate((element, protocolVersion) => {
    type TestCanvas = HTMLCanvasElement & {
      __toolcraftMotionCapture?: Promise<MotionFrameCapture>;
      __toolcraftMotionMonitor?: {
        cleanup: () => void;
        unexpectedPanSettings: number;
      };
      __toolcraftReadCentralBand?: () => SampledSnapshot;
    };

    const target = element as TestCanvas;
    const context = target.getContext("webgl");
    if (!context) throw new Error("Unable to read the Sphere WebGL canvas.");
    target.__toolcraftReadCentralBand = () => {
      const left = Math.floor(target.width * 0.28);
      const bottom = Math.floor(target.height * 0.3);
      const width = Math.max(1, Math.ceil(target.width * 0.44));
      const height = Math.max(1, Math.ceil(target.height * 0.4));
      const source = new Uint8Array(width * height * 4);
      context.readPixels(
        left,
        bottom,
        width,
        height,
        context.RGBA,
        context.UNSIGNED_BYTE,
        source,
      );

      const sampledWidth = 64;
      const sampledHeight = 32;
      const pixels: number[] = [];
      for (let y = 0; y < sampledHeight; y += 1) {
        const sourceY = Math.min(
          height - 1,
          Math.floor(((y + 0.5) / sampledHeight) * height),
        );
        for (let x = 0; x < sampledWidth; x += 1) {
          const sourceX = Math.min(
            width - 1,
            Math.floor(((x + 0.5) / sampledWidth) * width),
          );
          const offset = (sourceY * width + sourceX) * 4;
          pixels.push(
            source[offset] ?? 0,
            source[offset + 1] ?? 0,
            source[offset + 2] ?? 0,
            source[offset + 3] ?? 0,
          );
        }
      }
      return { height: sampledHeight, pixels, width: sampledWidth };
    };

    let capturedPan: { x: number; y: number } | null = null;
    const capturedFrames: SampledSnapshot[] = [];
    let resolveCapture: (capture: MotionFrameCapture) => void = () => {};
    const originalDrawArrays = context.drawArrays;
    const monitor = {
      cleanup: () => {},
      unexpectedPanSettings: 0,
    };
    const restoreDrawArrays = () => {
      if (context.drawArrays === captureAfterPostDraw) {
        context.drawArrays = originalDrawArrays;
      }
    };
    const receiveSettings = (event: MessageEvent) => {
      const message = event.data as {
        channel?: unknown;
        payload?: {
          gallery?: { sphere?: { pan?: { x?: unknown; y?: unknown } } };
        };
        type?: unknown;
        version?: unknown;
      } | null;
      const pan = message?.payload?.gallery?.sphere?.pan;
      if (
        !message ||
        message.channel !== "recraft.hero-scene" ||
        message.type !== "settings" ||
        message.version !== protocolVersion ||
        typeof pan?.x !== "number" ||
        typeof pan.y !== "number"
      ) {
        return;
      }

      if (!capturedPan) {
        capturedPan = { x: pan.x, y: pan.y };
      } else if (capturedPan.x !== pan.x || capturedPan.y !== pan.y) {
        monitor.unexpectedPanSettings += 1;
      }
    };
    function captureAfterPostDraw(
      mode: number,
      first: number,
      count: number,
    ): void {
      originalDrawArrays.call(context, mode, first, count);
      if (
        !capturedPan ||
        mode !== context.TRIANGLES ||
        count !== 3 ||
        context.getParameter(context.FRAMEBUFFER_BINDING) !== null
      ) {
        return;
      }

      const renderedPan = target
        .closest<HTMLElement>('[data-hero-gallery="sphere"]')
        ?.getAttribute("data-hero-gallery-pan");
      const expectedRenderedPrefix = `${capturedPan.x.toFixed(4)}:${capturedPan.y.toFixed(4)}:`;
      const read = target.__toolcraftReadCentralBand;
      if (!renderedPan?.startsWith(expectedRenderedPrefix) || !read) return;

      capturedFrames.push(read());
      if (capturedFrames.length < 6) return;
      restoreDrawArrays();
      resolveCapture({ frames: capturedFrames, pan: capturedPan, renderedPan });
    }

    monitor.cleanup = () => {
      window.removeEventListener("message", receiveSettings);
      restoreDrawArrays();
    };
    target.__toolcraftMotionMonitor = monitor;
    target.__toolcraftMotionCapture = new Promise((resolve) => {
      resolveCapture = resolve;
    });
    window.addEventListener("message", receiveSettings);
    context.drawArrays = captureAfterPostDraw;
  }, HERO_PREVIEW_PROTOCOL_VERSION);
}

async function receiveMotionPostDrawCapture(
  canvas: Locator,
): Promise<MotionFrameCapture> {
  return canvas.evaluate(async (element) => {
    const target = element as HTMLCanvasElement & {
      __toolcraftMotionCapture?: Promise<MotionFrameCapture>;
    };
    if (!target.__toolcraftMotionCapture) {
      throw new Error("The WebGL motion capture was not armed.");
    }
    return target.__toolcraftMotionCapture;
  });
}

async function finishMotionSettingsMonitor(canvas: Locator): Promise<number> {
  return canvas.evaluate((element) => {
    const target = element as HTMLCanvasElement & {
      __toolcraftMotionMonitor?: {
        cleanup: () => void;
        unexpectedPanSettings: number;
      };
    };
    const monitor = target.__toolcraftMotionMonitor;
    if (!monitor) throw new Error("The motion settings monitor was not armed.");
    monitor.cleanup();
    delete target.__toolcraftMotionMonitor;
    return monitor.unexpectedPanSettings;
  });
}

async function armSettledPostDrawCapture(canvas: Locator): Promise<void> {
  await canvas.evaluate((element) => {
    type TestCanvas = HTMLCanvasElement & {
      __toolcraftReadCentralBand?: () => SampledSnapshot;
      __toolcraftSettledCapture?: Promise<SampledSnapshot>;
    };
    const target = element as TestCanvas;
    const context = target.getContext("webgl");
    const read = target.__toolcraftReadCentralBand;
    if (!context || !read) {
      throw new Error("The WebGL pixel reader was not installed.");
    }

    const originalDrawArrays = context.drawArrays;
    let resolveCapture: (capture: SampledSnapshot) => void = () => {};
    function captureAfterPostDraw(
      mode: number,
      first: number,
      count: number,
    ): void {
      originalDrawArrays.call(context, mode, first, count);
      if (
        mode !== context.TRIANGLES ||
        count !== 3 ||
        context.getParameter(context.FRAMEBUFFER_BINDING) !== null
      ) {
        return;
      }
      context.drawArrays = originalDrawArrays;
      resolveCapture(read());
    }
    target.__toolcraftSettledCapture = new Promise((resolve) => {
      resolveCapture = resolve;
    });
    context.drawArrays = captureAfterPostDraw;
  });
}

async function receiveSettledPostDrawCapture(
  canvas: Locator,
): Promise<SampledSnapshot> {
  return canvas.evaluate(async (element) => {
    const target = element as HTMLCanvasElement & {
      __toolcraftSettledCapture?: Promise<SampledSnapshot>;
    };
    if (!target.__toolcraftSettledCapture) {
      throw new Error("The settled WebGL capture was not armed.");
    }
    return target.__toolcraftSettledCapture;
  });
}

function normalizedRenderedPan(value: string | null): string {
  const [x, y, turns] = (value ?? "").split(":");
  return `${Number(x).toFixed(4)}:${Number(y).toFixed(4)}:${turns ?? ""}`;
}

function parseGalleryPan(value: string): {
  turns: number;
  x: number;
  y: number;
} {
  const [x, y, turns] = value.split(":").map(Number);
  return {
    turns: turns ?? Number.NaN,
    x: x ?? Number.NaN,
    y: y ?? Number.NaN,
  };
}

async function captureVelocityPanStimulus(
  page: Page,
  velocityValue: "0" | "1",
): Promise<{ delta: number; initialPan: string; pan: string }> {
  const velocity = await getToolcraftControlFieldByTarget(
    page,
    heroDispersionTargets.velocity,
  );
  await enterSliderValue(velocity, velocityValue);
  await page.waitForTimeout(700);

  const output = page.locator(
    '[data-toolcraft-product-output="hero-external-preview"]',
  );
  const canvas = page
    .frameLocator(heroFrameSelector)
    .locator("[data-hero-gallery-canvas]");
  await expect(canvas).toBeVisible();
  const initialPan = await output.getAttribute("data-hero-gallery-pan");
  if (!initialPan)
    throw new Error("The initial gallery Pan must be observable.");
  const handle = getCanvasHandle(page, "hero-gallery-pan-handle");
  const bounds = await handle.boundingBox();
  if (!bounds) throw new Error("The Sphere pan handle must be measurable.");

  const start = {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  for (let step = 1; step <= 5; step += 1) {
    await page.mouse.move(start.x + step * 24, start.y + step * 3, {
      steps: 2,
    });
    await page.waitForTimeout(18);
  }
  await expect
    .poll(() => output.getAttribute("data-hero-gallery-pan"))
    .not.toBe(initialPan);
  const beforeFinalMovesPan = await output.getAttribute(
    "data-hero-gallery-pan",
  );
  for (let step = 6; step <= 7; step += 1) {
    await page.mouse.move(start.x + step * 24, start.y + step * 3, {
      steps: 1,
    });
  }
  await expect
    .poll(() => output.getAttribute("data-hero-gallery-pan"))
    .not.toBe(beforeFinalMovesPan);
  await page.waitForTimeout(700);

  await armMotionPostDrawCapture(canvas);
  await page.mouse.move(start.x + 8 * 24, start.y + 8 * 3, { steps: 1 });
  const movingCapture = await receiveMotionPostDrawCapture(canvas);
  await expect
    .poll(async () =>
      normalizedRenderedPan(await output.getAttribute("data-hero-gallery-pan")),
    )
    .toBe(movingCapture.renderedPan);
  const draggedPan = await output.getAttribute("data-hero-gallery-pan");
  if (!draggedPan) throw new Error("The final gallery Pan must be observable.");
  const parsedPan = parseGalleryPan(draggedPan);
  expect(movingCapture.pan.x).toBeCloseTo(parsedPan.x, 4);
  expect(movingCapture.pan.y).toBeCloseTo(parsedPan.y, 4);
  await page.mouse.up();

  await expect
    .poll(() => output.getAttribute("data-hero-gallery-pan"))
    .toBe(draggedPan);
  await page.waitForTimeout(700);
  expect(await finishMotionSettingsMonitor(canvas)).toBe(0);
  await armSettledPostDrawCapture(canvas);
  await requestHeroGallerySnapshot(page);
  const settledPixels = await receiveSettledPostDrawCapture(canvas);
  expect(await output.getAttribute("data-hero-gallery-pan")).toBe(draggedPan);

  return {
    delta: Math.max(
      ...movingCapture.frames.map((frame) =>
        regionMeanDelta(frame, settledPixels, [fullRegion]),
      ),
    ),
    initialPan,
    pan: draggedPan,
  };
}

async function selectSegmented(
  page: Page,
  target: string,
  option: string,
): Promise<void> {
  const control = await getToolcraftControlFieldByTarget(page, target);
  const button = control.getByRole("button", { name: option });
  if ((await button.getAttribute("aria-pressed")) !== "true") {
    await button.click();
  }
}

test.setTimeout(120_000);

test("browser: Sphere exposes one scene→field→post gallery pipeline", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await waitForWebsitePreview(page);

  const preview = page.frameLocator(heroFrameSelector);
  const gallery = preview.locator(
    '[data-hero-gallery="sphere"][data-hero-gallery-ready="true"]',
  );
  await expect(gallery).toHaveAttribute("data-hero-gallery-renderer", "webgl");
  await expect(gallery).toHaveAttribute("data-hero-gallery-effect", "post");
  await expect(gallery).toHaveAttribute(
    "data-hero-gallery-passes",
    "scene→field→post",
  );
  await expect(gallery.locator("[data-hero-gallery-canvas]")).toHaveCount(1);
  await expect(gallery.locator("[data-hero-dispersion-canvas]")).toHaveCount(0);
});

test("browser: per-row images fill only their sphere row", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const preview = page.frameLocator(heroFrameSelector);
  const gallery = preview.locator('[data-hero-gallery="sphere"]');
  await expect(
    preview.getByRole("heading", { name: "Recraft Styles" }),
  ).toBeVisible({ timeout: 30_000 });
  await expect(gallery).toHaveCount(1, { timeout: 30_000 });
  await expect(gallery).toHaveAttribute("data-hero-gallery-ready", "true", {
    timeout: 30_000,
  });
  await expect(gallery).toHaveAttribute("data-hero-gallery-rows", "1");

  const rowsControlOwner = page.locator(
    `[data-slot="toolcraft-runtime-app"] [data-toolcraft-control-target="${heroGalleryTargets.sphereRows}"]`,
  );
  await expect(rowsControlOwner).toHaveCount(1);
  const addRow = rowsControlOwner.getByRole("button", { name: "Add Row" });
  const removeRow = rowsControlOwner.getByRole("button", {
    name: "Remove Row",
  });
  await expect(addRow).toBeVisible();
  await expect(removeRow).toBeVisible();

  await addRow.click();
  await expect(gallery).toHaveAttribute("data-hero-gallery-rows", "2");
  await getToolcraftControlFieldByTarget(page, heroGalleryTargets.rowImages1);
  await removeRow.click();
  await expect(gallery).toHaveAttribute("data-hero-gallery-rows", "1");
  await addRow.click();
  await expect(gallery).toHaveAttribute("data-hero-gallery-rows", "2");
  await expect(gallery).toHaveAttribute("data-hero-gallery-ready", "true");

  const authoredOrder = await gallery.getAttribute("data-hero-gallery-order");
  const authoredSignature = await gallery.getAttribute(
    "data-hero-gallery-signature",
  );
  expect(authoredOrder).toBeTruthy();
  expect(authoredSignature).toBeTruthy();
  const authoredPixels = await decodeHeroGallerySnapshot(
    page,
    await requestHeroGallerySnapshot(page),
  );
  const authoredFirstRowOpacity = regionOpaqueRatio(
    authoredPixels,
    firstSphereRowRegion,
  );
  const authoredSecondRowOpacity = regionOpaqueRatio(
    authoredPixels,
    secondSphereRowRegion,
  );
  expect(authoredFirstRowOpacity).toBeGreaterThan(0.5);
  expect(authoredSecondRowOpacity).toBeGreaterThan(0.5);

  const rowOneImagesOwner = page.locator(
    `[data-slot="toolcraft-runtime-app"] [data-toolcraft-control-target="${heroGalleryTargets.rowImages0}"]`,
  );
  await expect(rowOneImagesOwner).toHaveCount(1);
  await rowOneImagesOwner.locator('input[type="file"]').setInputFiles({
    buffer: rowOnePngFixture,
    mimeType: "image/png",
    name: "row-one-fixture.png",
  });
  await expect
    .poll(() => gallery.getAttribute("data-hero-gallery-order"))
    .not.toBe(authoredOrder);
  const uploadedOrder = await gallery.getAttribute("data-hero-gallery-order");
  const [fixtureId] = (uploadedOrder ?? "").split(",");
  expect(fixtureId).toMatch(/^media-\d+$/);
  expect(uploadedOrder).toBe(fixtureId);
  await expect
    .poll(() => gallery.getAttribute("data-hero-gallery-signature"))
    .not.toBe(authoredSignature);
  await expect(gallery).toHaveAttribute("data-hero-gallery-ready", "true");

  const uploadedPixels = await decodeHeroGallerySnapshot(
    page,
    await requestHeroGallerySnapshot(page),
  );
  const firstRowDelta = regionMeanDelta(authoredPixels, uploadedPixels, [
    firstSphereRowRegion,
  ]);
  const uploadedFirstRowOpacity = regionOpaqueRatio(
    uploadedPixels,
    firstSphereRowRegion,
  );
  const uploadedSecondRowOpacity = regionOpaqueRatio(
    uploadedPixels,
    secondSphereRowRegion,
  );
  expect(firstRowDelta).toBeGreaterThan(1);
  expect(uploadedFirstRowOpacity).toBeGreaterThan(
    authoredFirstRowOpacity * 0.75,
  );
  expect(uploadedSecondRowOpacity).toBeLessThan(
    authoredSecondRowOpacity * 0.25,
  );
  expect(uploadedSecondRowOpacity).toBeLessThan(uploadedFirstRowOpacity * 0.25);

  const rowTwoImagesOwner = page.locator(
    `[data-slot="toolcraft-runtime-app"] [data-toolcraft-control-target="${heroGalleryTargets.rowImages1}"]`,
  );
  await expect(rowTwoImagesOwner).toHaveCount(1);
  await rowTwoImagesOwner.locator('input[type="file"]').setInputFiles({
    buffer: rowTwoPngFixture,
    mimeType: "image/png",
    name: "row-two-fixture.png",
  });
  await expect
    .poll(() => gallery.getAttribute("data-hero-gallery-order"))
    .toMatch(new RegExp(`^${fixtureId},media-\\d+$`));
  const twoRowOrder = await gallery.getAttribute("data-hero-gallery-order");
  const [, rowTwoFixtureId] = (twoRowOrder ?? "").split(",");
  expect(rowTwoFixtureId).toMatch(/^media-\d+$/);
  expect(rowTwoFixtureId).not.toBe(fixtureId);
  await expect(gallery).toHaveAttribute("data-hero-gallery-ready", "true");

  const populatedRowsPixels = await decodeHeroGallerySnapshot(
    page,
    await requestHeroGallerySnapshot(page),
  );
  const populatedSecondRowOpacity = regionOpaqueRatio(
    populatedRowsPixels,
    secondSphereRowRegion,
  );
  expect(populatedSecondRowOpacity).toBeGreaterThan(
    authoredSecondRowOpacity * 0.75,
  );

  await removeRow.click();
  await expect(gallery).toHaveAttribute("data-hero-gallery-rows", "1");
  await expect
    .poll(() => gallery.getAttribute("data-hero-gallery-order"))
    .toBe(fixtureId);
  await expect(
    rowTwoImagesOwner.getByRole("button", {
      name: "Remove row-two-fixture.png",
    }),
  ).toBeVisible();

  await addRow.click();
  await expect(gallery).toHaveAttribute("data-hero-gallery-rows", "2");
  await expect
    .poll(() => gallery.getAttribute("data-hero-gallery-order"))
    .toBe(twoRowOrder);
  await expect(gallery).toHaveAttribute("data-hero-gallery-ready", "true");
  const restoredRowTwoPixels = await decodeHeroGallerySnapshot(
    page,
    await requestHeroGallerySnapshot(page),
  );
  const restoredRowTwoOpacity = regionOpaqueRatio(
    restoredRowTwoPixels,
    secondSphereRowRegion,
  );
  expect(restoredRowTwoOpacity).toBeGreaterThan(
    authoredSecondRowOpacity * 0.75,
  );

  await rowTwoImagesOwner
    .getByRole("button", { name: "Remove row-two-fixture.png" })
    .click();
  await expect
    .poll(() => gallery.getAttribute("data-hero-gallery-order"))
    .toBe(fixtureId);
  await rowOneImagesOwner
    .getByRole("button", { name: "Remove row-one-fixture.png" })
    .click();
  await expect
    .poll(() => gallery.getAttribute("data-hero-gallery-order"))
    .toBe(authoredOrder);
  await expect
    .poll(() => gallery.getAttribute("data-hero-gallery-signature"))
    .toBe(authoredSignature);
  await expect(gallery).toHaveAttribute("data-hero-gallery-ready", "true");

  const restoredPixels = await decodeHeroGallerySnapshot(
    page,
    await requestHeroGallerySnapshot(page),
  );
  const restoredFirstRowDelta = regionMeanDelta(
    authoredPixels,
    restoredPixels,
    [firstSphereRowRegion],
  );
  const restoredSecondRowDelta = regionMeanDelta(
    authoredPixels,
    restoredPixels,
    [secondSphereRowRegion],
  );
  expect(restoredFirstRowDelta).toBeLessThan(0.1);
  expect(restoredSecondRowDelta).toBeLessThan(0.1);
});

test("browser: dispersion.velocity changes the embedded hero output", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await waitForWebsitePreview(page);
  const edgeWidth = await getToolcraftControlFieldByTarget(
    page,
    heroDispersionTargets.edgeWidth,
  );
  await enterSliderValue(edgeWidth, "0");

  const withoutMotionBoost = await captureVelocityPanStimulus(page, "0");
  await page.getByRole("button", { name: "Undo" }).click();
  const output = page.locator(
    '[data-toolcraft-product-output="hero-external-preview"]',
  );
  await expect
    .poll(() => output.getAttribute("data-hero-gallery-pan"))
    .toBe(withoutMotionBoost.initialPan);
  await page.waitForTimeout(700);
  const withMotionBoost = await captureVelocityPanStimulus(page, "1");
  const restingPan = parseGalleryPan(withoutMotionBoost.pan);
  const movingPan = parseGalleryPan(withMotionBoost.pan);

  expect(movingPan.x).toBeCloseTo(restingPan.x, 10);
  expect(movingPan.y).toBeCloseTo(restingPan.y, 10);
  expect(movingPan.turns).toBe(restingPan.turns);
  expect(withMotionBoost.initialPan).toBe(withoutMotionBoost.initialPan);
  expect(withoutMotionBoost.delta).toBeLessThanOrEqual(0.01);
  expect(withMotionBoost.delta).toBeGreaterThan(0.05);
  expect(withMotionBoost.delta).toBeGreaterThan(
    withoutMotionBoost.delta + 0.05,
  );
  await attachToolcraftBrowserRuntimeEvidence({
    evidenceType: "product-observable-change",
    requirementId: heroDispersionTargets.velocity,
    target: heroDispersionTargets.velocity,
  });
});

test("browser: frozen Rows keeps the per-card dispersion path without Sphere post-pass data", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await waitForWebsitePreview(page);
  await selectSegmented(page, heroGalleryTargets.type, "Rows");

  const preview = page.frameLocator(heroFrameSelector);
  const gallery = preview.locator(
    '[data-hero-gallery="rows"][data-hero-gallery-ready="true"]',
  );
  await expect(gallery).toHaveCount(1);
  await expect(gallery).not.toHaveAttribute("data-hero-gallery-effect", /.+/);
  await expect(gallery).not.toHaveAttribute("data-hero-gallery-passes", /.+/);
  await expect(gallery.locator("[data-hero-card]")).toHaveCount(16);
  await expect(gallery.locator("[data-hero-dispersion-canvas]")).toHaveCount(
    16,
  );
  await expect
    .poll(() => gallery.locator('[data-dispersion-ready="true"]').count())
    .toBeGreaterThan(0);
  await expect
    .poll(() =>
      gallery.locator("[data-hero-card]").evaluateAll((cards) => {
        const scene = cards[0]?.closest<HTMLElement>("[data-hero-scene]");
        if (!scene) return false;
        const viewport = scene.getBoundingClientRect();
        return cards.every((card) => {
          const bounds = card.getBoundingClientRect();
          const isVisible =
            bounds.right > viewport.left && bounds.left < viewport.right;
          return (
            !isVisible ||
            card.querySelector('[data-dispersion-ready="true"]') !== null
          );
        });
      }),
    )
    .toBe(true);
  await expect(getCanvasHandle(page, "hero-gallery-pan-handle")).toHaveCount(0);

  await page.waitForTimeout(300);
  const before = await gallery.screenshot();
  await page.waitForTimeout(200);
  const after = await gallery.screenshot();
  expect(after.equals(before)).toBe(true);
});
