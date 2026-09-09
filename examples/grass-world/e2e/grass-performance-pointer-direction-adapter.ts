import { expect, type Page } from "@playwright/test";

import type { ToolcraftPerformancePath } from "@/toolcraft/runtime";

import {
  grassControl as control,
  setGrassSliderValue,
} from "./grass-performance-control-actions";
import { prepareGrass } from "./grass-performance-session";
import type { ToolcraftPerformancePathAdapter } from "./performance-path-adapter-contract";

const grassLivePreviewSelector = '[data-slot="grass-live-preview"]';

async function prepareGrassPointerDirection(page: Page): Promise<void> {
  await prepareGrass(page);
  const mode = control(page, "wind.mode");
  await mode.getByRole("button", { name: "Simulate", exact: true }).click();
  await setGrassSliderValue(page, "wind.directionAngle", 0);
  await setGrassSliderValue(page, "wind.rampUp", 0.1);
  await expect(page.locator(grassLivePreviewSelector)).toHaveAttribute(
    "data-grass-wind-mode",
    "simulation",
  );
}

async function triggerGrassPointerDirection(page: Page): Promise<void> {
  const output = page.locator(grassLivePreviewSelector);
  await page.evaluate(() => {
    const performanceWindow = window as typeof window & {
      __grassPerformancePointerFrame?: number;
    };
    if (performanceWindow.__grassPerformancePointerFrame !== undefined) {
      cancelAnimationFrame(performanceWindow.__grassPerformancePointerFrame);
      delete performanceWindow.__grassPerformancePointerFrame;
    }
  });

  const box = await output.boundingBox();
  expect(box).not.toBeNull();
  const viewport = page.viewportSize() ?? { height: 720, width: 1280 };
  const left = Math.max(16, box!.x + 16);
  const right = Math.min(viewport.width - 360, box!.x + box!.width - 16);
  const top = Math.max(16, box!.y + 16);
  const bottom = Math.min(viewport.height - 48, box!.y + box!.height - 16);
  const width = right - left;
  const height = bottom - top;
  const pointerCoordinates = [
    [0.25, 0.6],
    [0.45, 0.58],
    [0.62, 0.5],
    [0.35, 0.45],
  ].map(([x, y]) => ({
    x: left + width * x!,
    y: top + height * y!,
  }));

  await output.evaluate((element, coordinates) => {
    const performanceWindow = window as typeof window & {
      __grassPerformancePointerFrame?: number;
    };
    let frameCount = 0;
    const move = (): void => {
      const point = coordinates[frameCount % coordinates.length]!;
      element.dispatchEvent(
        new PointerEvent("pointermove", {
          bubbles: true,
          buttons: 0,
          clientX: point.x,
          clientY: point.y,
          isPrimary: true,
          pointerId: 1,
          pointerType: "mouse",
        }),
      );
      frameCount += 1;
      if (frameCount < 8) {
        performanceWindow.__grassPerformancePointerFrame =
          requestAnimationFrame(move);
      } else {
        delete performanceWindow.__grassPerformancePointerFrame;
      }
    };
    performanceWindow.__grassPerformancePointerFrame =
      requestAnimationFrame(move);
  }, pointerCoordinates);
}

export function createGrassPointerDirectionPerformanceAdapter(
  path: ToolcraftPerformancePath,
): ToolcraftPerformancePathAdapter {
  return {
    action: ({ page }) => triggerGrassPointerDirection(page),
    pathId: path.id,
    prepare: prepareGrassPointerDirection,
    verifyOutcome: async ({ page }) => {
      const output = page.locator(grassLivePreviewSelector);
      await expect(output).toHaveAttribute(
        "data-grass-pointer-direction-observed",
        "true",
      );
      await expect(output).toHaveAttribute(
        "data-grass-wind-pointer-active",
        "true",
      );
      expect(
        Number(await output.getAttribute("data-grass-wind-direction-angle")),
      ).not.toBe(0);
    },
  };
}
