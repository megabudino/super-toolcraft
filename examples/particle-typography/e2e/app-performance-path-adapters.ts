import { expect, type Locator, type Page } from "@playwright/test";

import { deriveToolcraftPerformancePaths } from "@/toolcraft/runtime";

import { appPerformance } from "../src/app/app-performance";
import { appSchema } from "../src/app/app-schema";
import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import {
  dragToolcraftCanvasViewport,
  zoomToolcraftCanvasViewport,
} from "./performance-canvas-helpers";
import type { ToolcraftCompiledFixtureApplications } from "./performance-compiled-fixture-runtime";
import type {
  ToolcraftPerformancePathActionContext,
  ToolcraftPerformancePathAdapter,
} from "./performance-path-adapter-contract";

const outputSelector = '[data-dots-renderer="true"]';

async function waitForFixtureQuiescence(
  page: Page,
  durationMs = 200,
): Promise<void> {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }),
  );
  await page.waitForTimeout(durationMs);
}

function controlByTarget(page: Page, target: string): Locator {
  return page.locator(`[data-toolcraft-control-target="${target}"]`);
}

async function prepare(page: Page): Promise<void> {
  await page.goto("/");
  await expect(page.locator(outputSelector)).toBeVisible();
  await page.evaluate(async () => {
    if ("fonts" in document) await document.fonts.ready;
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
  });
  const pause = page.getByRole("button", { name: "Pause playback" });
  if ((await pause.count()) > 0) await pause.click();
}

async function prepareVideoExport(page: Page): Promise<void> {
  await prepare(page);
  const duration = page.getByRole("textbox", { name: "timeline duration" });
  if ((await duration.count()) === 0) {
    const editDuration = page.getByRole("button", { name: "Edit timeline duration" });
    if ((await editDuration.count()) === 0) {
      const timelineControl = await getToolcraftControlFieldByTarget(
        page,
        "panels.timeline.extended",
      );
      await timelineControl.getByRole("switch").click();
    }
    await expect(editDuration).toBeVisible();
    await editDuration.click();
  }
  await expect(duration).toBeVisible();
  await duration.fill("1");
  await duration.press("Enter");
  await expect(page.locator(outputSelector)).toHaveAttribute(
    "data-timeline-duration",
    "1",
  );
}

async function editSlider(page: Page, target: string, value: number): Promise<void> {
  const control = controlByTarget(page, target);
  const edit = control.getByRole("button", { name: /^Edit .+ value$/u });
  if ((await edit.count()) > 0) {
    await edit.click();
    const input = control.getByRole("textbox");
    await input.fill(String(value));
    await input.press("Enter");
    return;
  }
  await control.getByRole("slider").fill(String(value));
}

async function chooseOption(page: Page, target: string, label: string): Promise<void> {
  const control = controlByTarget(page, target);
  const combobox = control.getByRole("combobox");
  await combobox.scrollIntoViewIfNeeded();
  if ((await combobox.getAttribute("aria-expanded")) !== "true") {
    await combobox.click();
  }
  await expect(combobox).toHaveAttribute("aria-expanded", "true");
  const listboxId = await combobox.getAttribute("aria-controls");
  const listbox = listboxId
    ? page.locator(`[id="${listboxId}"]`)
    : page.locator('[role="listbox"]:visible').last();
  const option = listbox.getByText(label, { exact: true });
  await expect(option).toBeVisible();
  await option.click();
}

async function readSlider(page: Page, target: string): Promise<number> {
  const control = controlByTarget(page, target);
  return Number(
    await control.locator('input[type="range"]').first().getAttribute("aria-valuenow"),
  );
}

function fixtureApplications(
  page: Page,
  dimensions: readonly string[],
): ToolcraftCompiledFixtureApplications {
  const applications: ToolcraftCompiledFixtureApplications = {};
  if (dimensions.includes("particle-count")) {
    applications["particle-count"] = {
      applyValue: async (value) => {
        await editSlider(page, "particles.count", Number(value));
        await expect(page.locator(outputSelector)).toHaveAttribute(
          "data-dot-count",
          String(value),
        );
        await page.evaluate(
          () =>
            new Promise<void>((resolve) => {
              requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
            }),
        );
        await page.waitForTimeout(320);
      },
      observeValue: () => readSlider(page, "particles.count"),
    };
  }
  if (dimensions.includes("image-long-edge")) {
    applications["image-long-edge"] = {
      applyValue: async (value) => {
        const resolution = value === "2k" ? "2k" : value === "8k" ? "8k" : "4k";
        await chooseOption(
          page,
          "export.image.resolution",
          resolution === "2k" ? "2K" : resolution === "8k" ? "8K" : "4K",
        );
        await expect(page.locator(outputSelector)).toHaveAttribute(
          "data-export-image-resolution",
          resolution,
        );
        await waitForFixtureQuiescence(page);
      },
      observeValue: () =>
        page.locator(outputSelector).getAttribute("data-export-image-resolution"),
    };
  }
  if (dimensions.includes("video-long-edge")) {
    applications["video-long-edge"] = {
      applyValue: async (value) => {
        const resolution = value === "4k" ? "4k" : "current";
        await chooseOption(
          page,
          "export.video.resolution",
          resolution === "4k" ? "4K" : "Current",
        );
        await expect(page.locator(outputSelector)).toHaveAttribute(
          "data-export-video-resolution",
          resolution,
        );
        await waitForFixtureQuiescence(page);
      },
      observeValue: () =>
        page.locator(outputSelector).getAttribute("data-export-video-resolution"),
    };
  }
  return applications;
}

async function outputSignature(page: Page): Promise<string> {
  return page.locator(outputSelector).evaluate((node) => {
    const output = node as HTMLElement;
    return JSON.stringify({ ...output.dataset });
  });
}

async function dragSlider(control: Locator, ratio: number, page: Page): Promise<void> {
  const slider = control.locator('input[type="range"]').first();
  const sliderControl = control.locator("[data-base-ui-slider-control]").first();
  await sliderControl.scrollIntoViewIfNeeded();
  const box = await sliderControl.boundingBox();
  if (!box) throw new Error("Could not measure the Dot Formation slider.");
  const [value, minimum, maximum] = await Promise.all([
    slider.getAttribute("aria-valuenow"),
    slider.getAttribute("min"),
    slider.getAttribute("max"),
  ]);
  const numericValue = Number(value);
  const numericMinimum = Number(minimum);
  const numericMaximum = Number(maximum);
  const currentRatio =
    Number.isFinite(numericValue) &&
    Number.isFinite(numericMinimum) &&
    Number.isFinite(numericMaximum) &&
    numericMaximum > numericMinimum
      ? (numericValue - numericMinimum) / (numericMaximum - numericMinimum)
      : ratio < 0.5
        ? 0.72
        : 0.28;
  const targetRatio = Math.abs(currentRatio - ratio) < 0.08 ? 1 - ratio : ratio;
  const startX = box.x + box.width * currentRatio;
  const endX = box.x + box.width * targetRatio;
  const y = box.y + box.height / 2;
  await page.mouse.move(startX, y);
  await page.mouse.down();
  await page.mouse.move(endX, y, { steps: 5 });
  await page.mouse.up();
}

async function dragPerformanceControl({
  page,
  path,
}: ToolcraftPerformancePathActionContext): Promise<void> {
  const target = path.targets.includes("particles.count")
    ? "particles.count"
    : "appearance.glow";
  const control = controlByTarget(page, target);
  const currentValue = await readSlider(page, target);
  const slider = control.locator('input[type="range"]').first();
  const minimum = Number(await slider.getAttribute("min"));
  const maximum = Number(await slider.getAttribute("max"));
  const currentRatio =
    Number.isFinite(minimum) && Number.isFinite(maximum) && maximum > minimum
      ? (currentValue - minimum) / (maximum - minimum)
      : 0.5;
  const targetRatio = currentRatio > 0.55 ? 0.32 : 0.76;
  await dragSlider(control, targetRatio, page);
}

async function changePerformanceControl({
  page,
  path,
  phase,
}: ToolcraftPerformancePathActionContext): Promise<void> {
  if (path.targets.includes("text.content")) {
    const control = controlByTarget(page, "text.content");
    await control.getByRole("textbox").fill(phase === "warm" ? "FLOW" : "DOTS");
    return;
  }
  const currentFormat = await page
    .locator(outputSelector)
    .getAttribute("data-export-image-format");
  await chooseOption(
    page,
    "export.image.format",
    currentFormat === "png" ? "JPG" : "PNG",
  );
}

async function ensureTimeline(page: Page): Promise<Locator> {
  const slider = page.getByRole("slider", { name: "Playback position" });
  if ((await slider.count()) === 0) {
    const control = controlByTarget(page, "panels.timeline.extended");
    await control.getByRole("switch").click();
  }
  await expect(slider).toBeVisible();
  return slider;
}

async function playTimeline({ page }: ToolcraftPerformancePathActionContext): Promise<void> {
  await ensureTimeline(page);
  const play = page.getByRole("button", { name: "Play" });
  if ((await play.count()) > 0) await play.click();
  await page.waitForTimeout(80);
  const pause = page.getByRole("button", { name: "Pause playback" });
  if ((await pause.count()) > 0) await pause.click();
}

async function scrubTimeline({
  page,
  phase,
}: ToolcraftPerformancePathActionContext): Promise<void> {
  const slider = await ensureTimeline(page);
  const box = await slider.boundingBox();
  if (!box) throw new Error("Could not measure the Dot Formation timeline.");
  const ratio = phase === "warm" ? 0.28 : 0.72;
  await slider.click({ position: { x: box.width * ratio, y: box.height / 2 } });
}

const performancePaths = deriveToolcraftPerformancePaths(appSchema, appPerformance);

function adapterForPath(
  path: (typeof performancePaths)[number],
): ToolcraftPerformancePathAdapter {
  const base = {
    pathId: path.id,
    prepare,
    ...(path.workloadDimensions.length > 0
      ? {
          fixtureApplications: (page: Page) =>
            fixtureApplications(page, path.workloadDimensions),
        }
      : {}),
  } as const;

  switch (path.interaction) {
    case "export": {
      const video = path.targets.includes("export.video");
      return {
        ...base,
        ...(video ? { prepare: prepareVideoExport } : {}),
        output: {
          kind: "download",
          label: video ? "Export Video" : "Export PNG",
          verify: async (download) => {
            expect(await download.failure()).toBeNull();
            expect(download.suggestedFilename()).toMatch(
              video ? /\.(mp4|webm)$/u : /\.(png|jpg)$/u,
            );
            expect(await download.path()).toBeTruthy();
          },
        },
      };
    }
    case "initial-render":
      return {
        ...base,
        action: async ({ page }) => {
          await page.reload();
          await expect(page.locator(outputSelector)).toBeVisible();
          await page.evaluate(
            () =>
              new Promise<void>((resolve) => {
                let remainingFrames = 20;
                const tick = () => {
                  remainingFrames -= 1;
                  if (remainingFrames <= 0) resolve();
                  else requestAnimationFrame(tick);
                };
                requestAnimationFrame(tick);
              }),
          );
        },
      };
    case "animation-frame":
    case "timeline-playback":
      return {
        ...base,
        action: playTimeline,
        observeOutcome: ({ page }) => outputSignature(page),
      };
    case "timeline-scrub":
      return {
        ...base,
        action: scrubTimeline,
        observeOutcome: ({ page }) => outputSignature(page),
      };
    case "control-drag":
      return {
        ...base,
        action: dragPerformanceControl,
        observeOutcome: ({ page }) => outputSignature(page),
      };
    case "control-change":
      return {
        ...base,
        action: changePerformanceControl,
        observeOutcome: ({ page }) => outputSignature(page),
      };
    case "viewport-drag":
      return { ...base, action: ({ page }) => dragToolcraftCanvasViewport(page) };
    case "viewport-zoom":
      return { ...base, action: ({ page }) => zoomToolcraftCanvasViewport(page, 1) };
    default:
      throw new Error(`Unsupported Dot Formation performance path: ${path.interaction}`);
  }
}

export const appPerformancePathAdapters = performancePaths.map(adapterForPath);
