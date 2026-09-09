import { expect, type Page } from "@playwright/test";

import {
  deriveToolcraftPerformancePaths,
  type ToolcraftPerformancePath,
} from "@/toolcraft/runtime";

import { appPerformance } from "../src/app/app-performance";
import { appSchema } from "../src/app/app-schema";
import { dragCanvasHandle } from "./canvas-handle-helpers";
import {
  readToolcraftCanvasViewport,
} from "./performance-canvas-helpers";
import type { ToolcraftPerformancePathAdapter } from "./performance-path-adapter-contract";

const meshCanvasSelector = '[data-mesh-gradient-canvas="true"]';

function control(page: Page, target: string) {
  return page.locator(`[data-toolcraft-control-target="${target}"]`);
}

async function readMeshSignature(page: Page): Promise<string> {
  return (await page.locator(meshCanvasSelector).getAttribute("data-mesh-frame-signature")) ?? "";
}

async function readMeshPointCount(page: Page): Promise<number> {
  return Number(
    (await page
      .locator('[data-mesh-gradient-handles="true"]')
      .getAttribute("data-mesh-point-count")) ?? 0,
  );
}

async function ensureTimelineVisible(page: Page): Promise<void> {
  const timelineSwitch = control(page, "panels.timeline.extended").getByRole("switch");
  if (!(await timelineSwitch.isChecked())) await timelineSwitch.click();
  await expect(page.getByRole("slider", { name: "Playback position" })).toBeVisible();
}

async function pausePlayback(page: Page): Promise<void> {
  const pause = page.getByRole("button", { name: "Pause playback" });
  if ((await pause.count()) > 0) await pause.click();
}

async function waitForMeshPreview(page: Page): Promise<void> {
  await expect(page.locator(meshCanvasSelector)).toBeVisible();
  await expect.poll(() => readMeshSignature(page), { timeout: 15_000 }).not.toBe("");
  await expect.poll(() => readMeshPointCount(page), { timeout: 15_000 }).toBeGreaterThanOrEqual(4);
}

async function prepareMesh(page: Page): Promise<void> {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await waitForMeshPreview(page);
  await ensureTimelineVisible(page);
  await pausePlayback(page);
  await page.waitForTimeout(120);
}

async function setTimelinePosition(page: Page, fraction: number): Promise<void> {
  await ensureTimelineVisible(page);
  const slider = page.getByRole("slider", { name: "Playback position" });
  const box = await slider.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(
    box!.x + Math.max(1, Math.min(box!.width - 1, box!.width * fraction)),
    box!.y + box!.height / 2,
  );
}

async function chooseOption(page: Page, target: string, label: string): Promise<void> {
  const combobox = control(page, target).getByRole("combobox");
  await combobox.scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);
  await combobox.click();
  const listboxId = await combobox.getAttribute("aria-controls");
  expect(listboxId).not.toBeNull();
  await page
    .locator(`[id="${listboxId}"] [data-slot="select-item"]`)
    .filter({ hasText: new RegExp(`^${label}$`, "i") })
    .click();
}

async function dragSlider(page: Page, target: string): Promise<void> {
  const wrapper = control(page, target);
  await wrapper.scrollIntoViewIfNeeded();
  const slider = wrapper.getByRole("slider");
  const current = Number(await slider.getAttribute("aria-valuenow"));
  await slider.focus();
  await slider.press(current > 50 ? "Home" : "End");
}

async function dragViewport(page: Page, delta: { x: number; y: number }): Promise<void> {
  const viewport = page.getByRole("application", { name: "Canvas viewport" });
  const box = await viewport.boundingBox();
  expect(box).not.toBeNull();
  const startX = box!.x + box!.width * 0.22;
  const startY = box!.y + box!.height * 0.34;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + delta.x, startY + delta.y, { steps: 6 });
  await page.mouse.up();
}

async function setMeshPointCount(page: Page, value: unknown): Promise<void> {
  const desired = Math.max(4, Math.min(16, Math.round(Number(value))));
  let current = await readMeshPointCount(page);
  while (current < desired) {
    await page.getByRole("button", { name: "Add color point", exact: true }).click();
    current += 1;
    await expect.poll(() => readMeshPointCount(page)).toBe(current);
  }
  while (current > desired) {
    await page.getByRole("button", { name: "Remove color point", exact: true }).click();
    current -= 1;
    await expect.poll(() => readMeshPointCount(page)).toBe(current);
  }
  await page.waitForTimeout(180);
}

function fixtureApplications(page: Page, path: ToolcraftPerformancePath) {
  if (!path.workloadDimensions.includes("mesh-point-count")) return {};
  return {
    "mesh-point-count": {
      applyValue: async (value: unknown) => {
        await setMeshPointCount(page, value);
        if (path.interaction === "initial-render") {
          const expandedSections = page.locator(
            '[data-control-section-collapse-button][aria-expanded="true"]',
          );
          while ((await expandedSections.count()) > 0) {
            await expandedSections.first().click();
          }
          await page.waitForTimeout(240);
        }
      },
      observeValue: async () => String(await readMeshPointCount(page)),
    },
  };
}

function createMeshPathAdapter(
  path: ToolcraftPerformancePath,
): ToolcraftPerformancePathAdapter {
  if (path.interaction === "export") {
    return {
      pathId: path.id,
      prepare: async (page) => {
        await prepareMesh(page);
        await chooseOption(page, "export.image.resolution", "2K");
      },
      output: {
        kind: "download",
        label: "Export PNG",
        verify: async (download) => {
          const stream = await download.createReadStream();
          expect(stream).not.toBeNull();
          let byteLength = 0;
          for await (const chunk of stream!) byteLength += (chunk as Uint8Array).byteLength;
          expect(byteLength).toBeGreaterThan(1_000);
          expect(download.suggestedFilename()).toMatch(/mesh-gradient\.(?:jpg|png)$/u);
        },
      },
    };
  }

  if (path.interaction === "initial-render") {
    return {
      action: async ({ page }) => {
        await page.waitForTimeout(180);
        await page.reload();
        await waitForMeshPreview(page);
      },
      pathId: path.id,
      prepare: prepareMesh,
    };
  }

  if (path.interaction === "control-drag") {
    if (path.workloadDimensions.includes("mesh-point-count")) {
      return {
        action: ({ page }) =>
          dragCanvasHandle(page, "mesh-point-primary", { x: 36, y: 24 }),
        observeOutcome: ({ page }) => readMeshSignature(page),
        pathId: path.id,
        prepare: prepareMesh,
      };
    }
    return {
      action: ({ page }) => dragSlider(page, "mix.spread"),
      observeOutcome: ({ page }) => readMeshSignature(page),
      pathId: path.id,
      prepare: prepareMesh,
    };
  }

  if (path.interaction === "control-change") {
    if (path.workloadDimensions.includes("mesh-point-count")) {
      return {
        action: async ({ page }) => {
          const pointCount = await readMeshPointCount(page);
          await page
            .getByRole("button", {
              exact: true,
              name: pointCount >= 16 ? "Remove color point" : "Add color point",
            })
            .click();
        },
        observeOutcome: ({ page }) => readMeshSignature(page),
        pathId: path.id,
        prepare: prepareMesh,
      };
    }
    return {
      action: async ({ page }) => {
        const srgb = control(page, "mix.interpolation").getByRole("button", {
          name: "sRGB",
          exact: true,
        });
        const oklab = control(page, "mix.interpolation").getByRole("button", {
          name: "OKLab",
          exact: true,
        });
        await ((await srgb.getAttribute("aria-pressed")) === "true" ? oklab : srgb).click();
      },
      observeOutcome: ({ page }) => readMeshSignature(page),
      pathId: path.id,
      prepare: prepareMesh,
    };
  }

  if (path.interaction === "timeline-playback") {
    return {
      action: async ({ page }) => {
        await page.getByRole("button", { name: "Play playback" }).click();
        await page.getByRole("application", { name: "Canvas viewport" }).hover({
          position: { x: 40, y: 40 },
        });
        await page.waitForTimeout(240);
        await pausePlayback(page);
      },
      observeOutcome: ({ page }) => readMeshSignature(page),
      pathId: path.id,
      prepare: async (page) => {
        await prepareMesh(page);
        await setTimelinePosition(page, 0.08);
        await pausePlayback(page);
      },
    };
  }

  if (path.interaction === "timeline-scrub") {
    return {
      action: ({ page, phase }) =>
        setTimelinePosition(page, phase === "cold" ? 0.72 : phase === "warm" ? 0.34 : 0.86),
      observeOutcome: ({ page }) => readMeshSignature(page),
      pathId: path.id,
      prepare: async (page) => {
        await prepareMesh(page);
        await setTimelinePosition(page, 0.08);
        await pausePlayback(page);
      },
    };
  }

  if (path.interaction === "viewport-drag") {
    return {
      action: ({ page, phase }) =>
        dragViewport(
          page,
          phase === "baseline" ? { x: 64, y: -42 } : { x: -64, y: 42 },
        ),
      pathId: path.id,
      prepare: prepareMesh,
    };
  }

  if (path.interaction === "viewport-zoom") {
    return {
      action: async ({ page }) => {
        const viewport = await readToolcraftCanvasViewport(page);
        await page
          .getByRole("button", { name: viewport.zoom < 30 ? "Zoom in" : "Zoom out" })
          .click();
      },
      pathId: path.id,
      prepare: prepareMesh,
    };
  }

  throw new Error(`Unsupported mesh performance path interaction: ${path.interaction}`);
}

const meshPerformancePaths = deriveToolcraftPerformancePaths(appSchema, appPerformance);

export const appPerformancePathAdapters = meshPerformancePaths.map((path) => {
  const adapter = createMeshPathAdapter(path);
  if (path.workloadDimensions.length === 0) return adapter;
  return {
    ...adapter,
    fixtureApplications: (page: Page) => fixtureApplications(page, path),
  } satisfies ToolcraftPerformancePathAdapter;
}) satisfies readonly ToolcraftPerformancePathAdapter[];
