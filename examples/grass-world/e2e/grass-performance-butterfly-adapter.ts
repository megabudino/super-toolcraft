import { expect, type Page } from "@playwright/test";
import type { ToolcraftPerformancePath } from "@/toolcraft/runtime";

import {
  grassControl,
  setGrassSliderValue,
} from "./grass-performance-control-actions";
import { grassCanvasSelector } from "./grass-performance-session";

type FixtureApplications = Record<
  string,
  {
    applyValue: (value: unknown) => Promise<void>;
    observeValue: () => Promise<unknown>;
  }
>;

export function addGrassButterflyFixtureApplication(
  applications: FixtureApplications,
  page: Page,
  path: ToolcraftPerformancePath,
): void {
  if (!path.workloadDimensions.includes("butterfly-count")) return;
  applications["butterfly-count"] = {
    applyValue: async (value) => {
      await setGrassSliderValue(page, "butterflies.count", Number(value));
      await expect
        .poll(
          async () =>
            Number(
              await grassControl(page, "butterflies.count")
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
                .getAttribute("data-grass-butterfly-count")) ?? 0,
            ),
          { timeout: 30_000 },
        )
        .toBe(Number(value));
    },
    observeValue: async () =>
      Number(
        await grassControl(page, "butterflies.count")
          .getByRole("slider")
          .inputValue(),
      ),
  };
}
