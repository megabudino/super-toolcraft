import { expect, type Locator, type Page } from "@playwright/test";
import {
  deriveToolcraftPerformancePaths,
  type ToolcraftPerformancePath,
} from "@/toolcraft/runtime";

import { appPerformance } from "../src/app/app-performance";
import { appSchema } from "../src/app/app-schema";
import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import { readToolcraftCanvasViewport } from "./performance-canvas-helpers";
import type { ToolcraftPerformancePathAdapter } from "./performance-path-adapter-contract";
import {
  dragSliderToFraction,
  getSpiralCanvasPoint,
  resetSpiralTestPage,
  setSpiralCanvasSize,
  spiralFixturePaths,
  uploadSpiralFixtures,
  waitForSpiralCards,
  waitForSpiralSettled,
} from "./spiral-gallery-test-helpers";

const canvasSelector = '[data-image-gallery-canvas="true"]';

async function readCardCount(page: Page): Promise<number> {
  return Number(
    (await page.locator(canvasSelector).getAttribute("data-image-gallery-card-count")) ?? 0,
  );
}

async function readRepetitionCount(page: Page): Promise<number> {
  const control = await getToolcraftControlFieldByTarget(
    page,
    "spiral.repetitions",
  );
  return Math.max(
    1,
    Math.round(
      Number(await control.getByRole("slider").getAttribute("aria-valuenow")),
    ),
  );
}

async function readRenderedSourceCount(page: Page): Promise<number> {
  const repetitions = await readRepetitionCount(page);
  return Math.round((await readCardCount(page)) / repetitions);
}

async function readGalleryOutcome(page: Page): Promise<string> {
  const canvas = page.locator(canvasSelector);
  return JSON.stringify({
    cards: await canvas.getAttribute("data-image-gallery-card-count"),
    frame: await canvas.getAttribute("data-image-gallery-frame-signature"),
    index: await canvas.getAttribute("data-image-gallery-current-index"),
    width: await canvas.getAttribute("width"),
  });
}

async function readInitialRenderOutcome(page: Page): Promise<string> {
  try {
    return JSON.stringify({
      documentTimeOrigin: await page.evaluate(() => performance.timeOrigin),
      gallery: JSON.parse(await readGalleryOutcome(page)),
    });
  } catch (error) {
    if (
      error instanceof Error &&
      /Execution context was destroyed|navigation/iu.test(error.message)
    ) {
      return JSON.stringify({ documentLifecycle: "navigating" });
    }
    throw error;
  }
}

async function prepareGallery(
  page: Page,
  fixturePaths: readonly string[] = [
    spiralFixturePaths.coral,
    spiralFixturePaths.green,
    spiralFixturePaths.violet,
  ],
): Promise<void> {
  await resetSpiralTestPage(page);
  await setSpiralCanvasSize(page, 960, 540);
  await uploadSpiralFixtures(page, fixturePaths);
  await waitForSpiralCards(page, fixturePaths.length * 3);
}

async function setRepetitionCount(page: Page, value: unknown): Promise<void> {
  const desired = Math.max(1, Math.min(8, Math.round(Number(value))));
  const sourceCount = await readRenderedSourceCount(page);
  const control = await getToolcraftControlFieldByTarget(page, "spiral.repetitions");
  const slider = control.getByRole("slider");
  await slider.scrollIntoViewIfNeeded();
  await slider.press("End");
  for (let valueStep = 8; valueStep > desired; valueStep -= 1) {
    await slider.press("PageDown");
  }
  await expect.poll(() => readCardCount(page)).toBe(sourceCount * desired);
}

function fixtureApplications(page: Page, path: ToolcraftPerformancePath) {
  if (!path.workloadDimensions.includes("repetition-count")) return {};
  return {
    "repetition-count": {
      applyValue: (value: unknown) => setRepetitionCount(page, value),
      observeValue: async () => {
        const sources = await readRenderedSourceCount(page);
        return String(sources > 0 ? (await readCardCount(page)) / sources : 0);
      },
    },
  };
}

async function dragViewport(page: Page): Promise<void> {
  const viewport = page.getByRole("application", { name: "Canvas viewport" });
  const box = await viewport.boundingBox();
  expect(box).not.toBeNull();
  const x = box!.x + box!.width * 0.24;
  const y = box!.y + 28;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 72, y + 38, { steps: 6 });
  await page.mouse.up();
}

function createPathAdapter(path: ToolcraftPerformancePath): ToolcraftPerformancePathAdapter {
  if (path.interaction === "export") {
    return {
      pathId: path.id,
      prepare: async (page) => {
        await prepareGallery(page, [spiralFixturePaths.coral]);
      },
      output: {
        kind: "download",
        label: "Export PNG",
        verify: async (download) => {
          const stream = await download.createReadStream();
          expect(stream).not.toBeNull();
          const chunks: Buffer[] = [];
          for await (const chunk of stream!) {
            chunks.push(Buffer.from(chunk as Uint8Array));
          }
          const bytes = Buffer.concat(chunks);
          expect(bytes.byteLength).toBeGreaterThan(1_000);
          expect(download.suggestedFilename()).toBe("image-gallery.png");
          expect(bytes.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
          expect(bytes.readUInt32BE(16)).toBe(4096);
          expect(bytes.readUInt32BE(20)).toBe(2304);
        },
      },
    };
  }

  if (path.interaction === "media-import") {
    let mediaInput: Locator | null = null;
    return {
      action: async ({ page }) => {
        const cardCountBefore = await readCardCount(page);
        if (!mediaInput) {
          throw new Error("Image gallery media input is not prepared.");
        }
        await mediaInput.setInputFiles([spiralFixturePaths.blue]);
        await expect.poll(() => readCardCount(page)).toBeGreaterThan(cardCountBefore);
      },
      observeOutcome: ({ page }) => readGalleryOutcome(page),
      pathId: path.id,
      prepare: async (page) => {
        await prepareGallery(page, [spiralFixturePaths.coral]);
        const field = await getToolcraftControlFieldByTarget(
          page,
          "source.images",
        );
        mediaInput = field.locator('input[type="file"]');
        await expect(mediaInput).toBeAttached();
      },
    };
  }

  if (path.interaction === "initial-render") {
    return {
      action: async ({ page }) => {
        await page.reload({ waitUntil: "domcontentloaded" });
        await expect(page.locator(canvasSelector)).toBeVisible();
        await expect.poll(() => readCardCount(page)).toBeGreaterThan(0);
      },
      observeOutcome: ({ page }) => readInitialRenderOutcome(page),
      pathId: path.id,
      prepare: (page) =>
        prepareGallery(page, [spiralFixturePaths.coral]),
    };
  }

  if (path.interaction === "animation-frame") {
    return {
      action: async ({ page }) => {
        const point = await getSpiralCanvasPoint(page);
        await page.mouse.click(point.x, point.y);
        await page.keyboard.press("ArrowDown");
        await page.keyboard.press("ArrowDown");
        await page.keyboard.press("ArrowDown");
        await waitForSpiralSettled(page);
      },
      observeOutcome: ({ page }) => readGalleryOutcome(page),
      pathId: path.id,
      prepare: prepareGallery,
    };
  }

  if (path.interaction === "control-drag") {
    let radiusControl: Locator | null = null;
    return {
      action: async ({ page }) => {
        if (!radiusControl) {
          throw new Error("Image gallery radius control is not prepared.");
        }
        await dragSliderToFraction(radiusControl, page, 0.72);
      },
      observeOutcome: ({ page }) => readGalleryOutcome(page),
      pathId: path.id,
      prepare: async (page) => {
        await prepareGallery(page);
        radiusControl = await getToolcraftControlFieldByTarget(
          page,
          "spiral.radius",
        );
        await expect(radiusControl.getByRole("slider")).toBeVisible();
      },
    };
  }

  if (path.interaction === "viewport-drag") {
    return {
      action: ({ page }) => dragViewport(page),
      observeOutcome: ({ page }) => readToolcraftCanvasViewport(page),
      pathId: path.id,
      prepare: prepareGallery,
    };
  }

  if (path.interaction === "viewport-zoom") {
    return {
      action: async ({ page }) => {
        const viewport = await readToolcraftCanvasViewport(page);
        await page
          .getByRole("button", { name: viewport.zoom <= 20 ? "Zoom in" : "Zoom out" })
          .click();
      },
      observeOutcome: ({ page }) => readToolcraftCanvasViewport(page),
      pathId: path.id,
      prepare: prepareGallery,
    };
  }

  if (path.interaction === "control-change") {
    let backgroundSwitch: Locator | null = null;
    return {
      action: async () => {
        if (!backgroundSwitch) {
          throw new Error("Image gallery background control is not prepared.");
        }
        await backgroundSwitch.click();
      },
      observeOutcome: ({ page }) => readGalleryOutcome(page),
      pathId: path.id,
      prepare: async (page) => {
        await prepareGallery(page);
        const control = await getToolcraftControlFieldByTarget(
          page,
          "export.includeBackground",
        );
        backgroundSwitch = control.getByRole("switch");
        await expect(backgroundSwitch).toBeVisible();
      },
    };
  }

  throw new Error(`Unsupported image gallery performance path: ${path.interaction}`);
}

const performancePaths = deriveToolcraftPerformancePaths(appSchema, appPerformance);

export const appPerformancePathAdapters = performancePaths.map((path) => {
  const adapter = createPathAdapter(path);
  if (path.workloadDimensions.length === 0) return adapter;
  return {
    ...adapter,
    fixtureApplications: (page: Page) => fixtureApplications(page, path),
  } satisfies ToolcraftPerformancePathAdapter;
}) satisfies readonly ToolcraftPerformancePathAdapter[];
