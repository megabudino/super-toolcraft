import { expect, type Page } from "@playwright/test";
import type { ToolcraftPerformancePath } from "@/toolcraft/runtime";

import {
  grassControl,
  setGrassSliderValue,
} from "./grass-performance-control-actions";

type FixtureApplications = Record<
  string,
  {
    applyValue: (value: unknown) => Promise<void>;
    observeValue: () => Promise<unknown>;
  }
>;

export function addGrassLawnMaskFixtureApplication(
  applications: FixtureApplications,
  page: Page,
  path: ToolcraftPerformancePath,
): void {
  if (!path.workloadDimensions.includes("lawn-mask-octaves")) return;
  applications["lawn-mask-octaves"] = {
    applyValue: async (value) => {
      await setGrassSliderValue(page, "lawn.distributionDetail", Number(value));
      await expect
        .poll(async () =>
          Number(
            await grassControl(page, "lawn.distributionDetail")
              .getByRole("slider")
              .inputValue(),
          ),
        )
        .toBe(Number(value));
    },
    observeValue: async () =>
      grassControl(page, "lawn.distributionDetail")
        .getByRole("slider")
        .inputValue(),
  };
}
