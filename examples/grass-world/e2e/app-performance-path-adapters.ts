import { expect, type Page } from "@playwright/test";

import {
  deriveToolcraftPerformancePaths,
  type ToolcraftPerformancePath,
} from "@/toolcraft/runtime";

import { appPerformance } from "../src/app/app-performance";
import { appSchema } from "../src/app/app-schema";
import { createGrassMediaImportPerformanceAdapter } from "./grass-performance-media-adapter";
import { addGrassButterflyFixtureApplication } from "./grass-performance-butterfly-adapter";
import {
  chooseGrassOption,
  grassControl as control,
  setGrassSliderValue,
  toggleGrassSwitch,
} from "./grass-performance-control-actions";
import {
  createGrassControlDragPerformanceAdapter,
  scanFixtureTargets,
} from "./grass-performance-control-drag-adapter";
import { createGrassPointerDirectionPerformanceAdapter } from "./grass-performance-pointer-direction-adapter";
import { addGrassLawnMaskFixtureApplication } from "./grass-performance-lawn-mask-adapter";
import {
  grassCanvasSelector,
  pauseGrassPlayback,
  prepareGrass,
  readGrassSignature,
  setGrassTimelinePosition,
  waitForGrassPreview,
} from "./grass-performance-session";
import {
  dragToolcraftCanvasViewport,
  readToolcraftCanvasViewport,
} from "./performance-canvas-helpers";
import type { ToolcraftPerformancePathAdapter } from "./performance-path-adapter-contract";

function fixtureApplications(page: Page, path: ToolcraftPerformancePath) {
  const applications: Record<
    string,
    {
      applyValue: (value: unknown) => Promise<void>;
      observeValue: () => Promise<unknown>;
    }
  > = {};
  if (path.workloadDimensions.includes("blade-count")) {
    applications["blade-count"] = {
      applyValue: async (value) => {
        await setGrassSliderValue(page, "field.densityMax", Number(value));
        await expect
          .poll(
            async () =>
              Number(
                await control(page, "field.densityMax")
                  .getByRole("slider")
                  .inputValue(),
              ),
            { timeout: 30_000 },
          )
          .toBe(Number(value));
        await expect
          .poll(
            async () =>
              Number(
                (await page
                  .locator(grassCanvasSelector)
                  .getAttribute("data-grass-tall-requested-root-count")) ?? 0,
              ),
            { timeout: 30_000 },
          )
          .toBe(Number(value));
      },
      observeValue: async () =>
        Number(
          await control(page, "field.densityMax")
            .getByRole("slider")
            .inputValue(),
        ),
    };
  }
  if (path.workloadDimensions.includes("lawn-blade-count")) {
    applications["lawn-blade-count"] = {
      applyValue: async (value) => {
        await setGrassSliderValue(page, "lawn.densityMax", Number(value));
        await expect
          .poll(
            async () =>
              Number(
                await control(page, "lawn.densityMax")
                  .getByRole("slider")
                  .inputValue(),
              ),
            { timeout: 30_000 },
          )
          .toBe(Number(value));
        await expect
          .poll(
            async () =>
              Number(
                (await page
                  .locator(grassCanvasSelector)
                  .getAttribute("data-grass-lawn-blade-count")) ?? 0,
              ),
            { timeout: 30_000 },
          )
          .toBe(Number(value));
      },
      observeValue: async () =>
        Number(
          await control(page, "lawn.densityMax")
            .getByRole("slider")
            .inputValue(),
        ),
    };
  }
  addGrassButterflyFixtureApplication(applications, page, path);
  for (const [dimension, target, kind] of scanFixtureTargets) {
    if (!path.workloadDimensions.includes(dimension)) continue;
    applications[dimension] = {
      applyValue: async (value) => {
        await setGrassSliderValue(page, target, Number(value));
        await expect
          .poll(
            async () =>
              Number(
                await control(page, target).getByRole("slider").inputValue(),
              ),
            { timeout: 30_000 },
          )
          .toBe(Number(value));
        await expect
          .poll(
            async () =>
              Number(
                (await page
                  .locator(grassCanvasSelector)
                  .getAttribute(`data-grass-scan-${kind}-count`)) ?? 0,
              ),
            { timeout: 30_000 },
          )
          .toBe(Number(value));
      },
      observeValue: async () =>
        Number(await control(page, target).getByRole("slider").inputValue()),
    };
  }
  if (path.workloadDimensions.includes("live-preview-tall-count")) {
    applications["live-preview-tall-count"] = {
      applyValue: async (value) => {
        await setGrassSliderValue(page, "preview.bladeCount", Number(value));
        await expect
          .poll(async () =>
            Number(
              await control(page, "preview.bladeCount")
                .getByRole("slider")
                .inputValue(),
            ),
          )
          .toBe(Number(value));
        await expect(page.locator(grassCanvasSelector)).toHaveAttribute(
          "data-grass-preview-blade-count",
          String(value),
        );
      },
      observeValue: async () =>
        Number(
          await page
            .locator(grassCanvasSelector)
            .getAttribute("data-grass-preview-blade-count"),
        ),
    };
  }
  if (path.workloadDimensions.includes("live-preview-lawn-count")) {
    applications["live-preview-lawn-count"] = {
      applyValue: async (value) => {
        await setGrassSliderValue(
          page,
          "preview.lawnBladeCount",
          Number(value),
        );
        await expect
          .poll(async () =>
            Number(
              await control(page, "preview.lawnBladeCount")
                .getByRole("slider")
                .inputValue(),
            ),
          )
          .toBe(Number(value));
        await expect(page.locator(grassCanvasSelector)).toHaveAttribute(
          "data-grass-preview-lawn-blade-count",
          String(value),
        );
      },
      observeValue: async () =>
        Number(
          await page
            .locator(grassCanvasSelector)
            .getAttribute("data-grass-preview-lawn-blade-count"),
        ),
    };
  }
  if (path.workloadDimensions.includes("preview-render-scale")) {
    applications["preview-render-scale"] = {
      applyValue: async (value) => {
        await setGrassSliderValue(page, "canvas.renderScale", Number(value));
        await expect
          .poll(
            async () =>
              Number(
                await control(page, "canvas.renderScale")
                  .getByRole("slider")
                  .inputValue(),
              ),
            { timeout: 30_000 },
          )
          .toBe(Number(value));
        await expect(page.locator(grassCanvasSelector)).toHaveAttribute(
          "data-grass-render-scale",
          String(value),
          { timeout: 30_000 },
        );
      },
      observeValue: async () =>
        Number(
          await control(page, "canvas.renderScale")
            .getByRole("slider")
            .inputValue(),
        ),
    };
  }
  if (path.workloadDimensions.includes("terrain-octaves")) {
    applications["terrain-octaves"] = {
      applyValue: async (value) => {
        await setGrassSliderValue(page, "terrain.detail", Number(value));
        await expect
          .poll(async () =>
            Number(
              await control(page, "terrain.detail")
                .getByRole("slider")
                .inputValue(),
            ),
          )
          .toBe(Number(value));
        await expect(page.locator(grassCanvasSelector)).toHaveAttribute(
          "data-grass-terrain-signature",
          new RegExp(`\\"detail\\":${Number(value)}`),
        );
      },
      observeValue: async () =>
        control(page, "terrain.detail").getByRole("slider").inputValue(),
    };
  }
  if (path.workloadDimensions.includes("tall-mask-octaves")) {
    applications["tall-mask-octaves"] = {
      applyValue: async (value) => {
        await setGrassSliderValue(
          page,
          "field.distributionDetail",
          Number(value),
        );
        await expect
          .poll(async () =>
            Number(
              await control(page, "field.distributionDetail")
                .getByRole("slider")
                .inputValue(),
            ),
          )
          .toBe(Number(value));
        await expect(page.locator(grassCanvasSelector)).toHaveAttribute(
          "data-grass-distribution-signature",
          new RegExp(`\\"detail\\":${Number(value)}`),
        );
      },
      observeValue: async () =>
        control(page, "field.distributionDetail")
          .getByRole("slider")
          .inputValue(),
    };
  }
  addGrassLawnMaskFixtureApplication(applications, page, path);
  if (path.workloadDimensions.includes("clover-mask-octaves")) {
    applications["clover-mask-octaves"] = {
      applyValue: async (value) => {
        await setGrassSliderValue(
          page,
          "surface.cloverMaskDetail",
          Number(value),
        );
        await expect
          .poll(async () =>
            Number(
              await control(page, "surface.cloverMaskDetail")
                .getByRole("slider")
                .inputValue(),
            ),
          )
          .toBe(Number(value));
        await expect(page.locator(grassCanvasSelector)).toHaveAttribute(
          "data-grass-clover-blend-signature",
          new RegExp(`\\"detail\\":${Number(value)}`),
        );
      },
      observeValue: async () =>
        control(page, "surface.cloverMaskDetail")
          .getByRole("slider")
          .inputValue(),
    };
  }
  return applications;
}

function createGrassPathAdapter(
  path: ToolcraftPerformancePath,
): ToolcraftPerformancePathAdapter {
  if (path.interaction === "initial-render") {
    return {
      action: async ({ page }) => {
        await page.reload();
        const play = page.getByRole("button", { name: "Play playback" });
        if ((await play.count()) > 0) await play.click();
        await waitForGrassPreview(page);
      },
      pathId: path.id,
      prepare: prepareGrass,
    };
  }

  if (path.interaction === "export") {
    return {
      pathId: path.id,
      prepare: async (page) => {
        await prepareGrass(page);
        await chooseGrassOption(page, "export.image.resolution", "2K");
      },
      output: {
        kind: "download",
        label: "Export PNG",
        verify: async (download) => {
          const stream = await download.createReadStream();
          expect(stream).not.toBeNull();
          let byteLength = 0;
          for await (const chunk of stream!) {
            byteLength += (chunk as Uint8Array).byteLength;
          }
          expect(byteLength).toBeGreaterThan(1_000);
          expect(download.suggestedFilename()).toMatch(
            /grass-field\.(?:jpg|png)$/u,
          );
        },
      },
    };
  }

  if (path.interaction === "control-drag") {
    return createGrassControlDragPerformanceAdapter(path);
  }

  if (path.interaction === "control-change") {
    const scanEnabledTarget = [
      "scan.tufted.enabled",
      "scan.wild.enabled",
      "scan.white.enabled",
      "scan.yellow.enabled",
      "scan.rocks.enabled",
    ].find((target) => path.targets.includes(target));
    if (scanEnabledTarget) {
      return {
        action: ({ page }) => toggleGrassSwitch(page, scanEnabledTarget),
        observeOutcome: ({ page }) => readGrassSignature(page),
        pathId: path.id,
        prepare: prepareGrass,
      };
    }
    if (path.targets.includes("blade.use3d")) {
      return {
        action: ({ page }) => toggleGrassSwitch(page, "blade.use3d"),
        observeOutcome: ({ page }) => readGrassSignature(page),
        pathId: path.id,
        prepare: prepareGrass,
      };
    }
    if (path.targets.includes("field.showGround")) {
      return {
        action: ({ page }) => toggleGrassSwitch(page, "field.showGround"),
        observeOutcome: ({ page }) => readGrassSignature(page),
        pathId: path.id,
        prepare: prepareGrass,
      };
    }
    return {
      action: async ({ page }) => {
        const combobox = control(page, "export.image.format").getByRole(
          "combobox",
        );
        const current = await combobox.textContent();
        await chooseGrassOption(
          page,
          "export.image.format",
          current?.includes("PNG") ? "JPG" : "PNG",
        );
      },
      observeOutcome: async ({ page }) =>
        control(page, "export.image.format")
          .getByRole("combobox")
          .textContent(),
      pathId: path.id,
      prepare: prepareGrass,
    };
  }

  if (path.interaction === "media-import") {
    return createGrassMediaImportPerformanceAdapter(path, prepareGrass);
  }

  if (path.interaction === "timeline-playback") {
    return {
      action: async ({ page }) => {
        await page.getByRole("button", { name: "Play playback" }).click();
        await page.waitForTimeout(180);
        await pauseGrassPlayback(page);
      },
      observeOutcome: ({ page }) => readGrassSignature(page),
      pathId: path.id,
      prepare: async (page) => {
        await prepareGrass(page);
        await setGrassTimelinePosition(page, 0.08);
        await pauseGrassPlayback(page);
      },
    };
  }

  if (path.interaction === "timeline-scrub") {
    return {
      action: ({ page, phase }) =>
        setGrassTimelinePosition(
          page,
          phase === "cold" ? 0.72 : phase === "warm" ? 0.34 : 0.86,
        ),
      observeOutcome: ({ page }) => readGrassSignature(page),
      pathId: path.id,
      prepare: async (page) => {
        await prepareGrass(page);
        await setGrassTimelinePosition(page, 0.08);
        await pauseGrassPlayback(page);
      },
    };
  }

  if (path.interaction === "animation-frame") {
    return createGrassPointerDirectionPerformanceAdapter(path);
  }

  if (path.interaction === "viewport-drag") {
    return {
      action: ({ page, phase }) =>
        dragToolcraftCanvasViewport(
          page,
          phase === "baseline" ? { x: 68, y: -44 } : { x: -68, y: 44 },
        ),
      pathId: path.id,
      prepare: prepareGrass,
    };
  }

  if (path.interaction === "viewport-zoom") {
    return {
      action: async ({ page }) => {
        const viewport = await readToolcraftCanvasViewport(page);
        await page
          .getByRole("button", {
            name: viewport.zoom < 30 ? "Zoom in" : "Zoom out",
          })
          .click();
      },
      pathId: path.id,
      prepare: prepareGrass,
    };
  }

  throw new Error(
    `Unsupported grass performance path interaction: ${path.interaction}`,
  );
}

const grassPerformancePaths = deriveToolcraftPerformancePaths(
  appSchema,
  appPerformance,
);

export const appPerformancePathAdapters = grassPerformancePaths.map((path) => {
  const adapter = createGrassPathAdapter(path);
  if (path.workloadDimensions.length === 0) return adapter;
  return {
    ...adapter,
    fixtureApplications: (page: Page) => fixtureApplications(page, path),
  } satisfies ToolcraftPerformancePathAdapter;
}) satisfies readonly ToolcraftPerformancePathAdapter[];
