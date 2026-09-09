import { expect, test } from "@playwright/test";

import { deriveToolcraftPerformancePaths } from "@/toolcraft/runtime";

import { appPerformance } from "../src/app/app-performance";
import { appSchema } from "../src/app/app-schema";
import { appPerformancePathAdapters } from "./app-performance-path-adapters";
import {
  compileToolcraftPerformancePathAdapterMatrix,
  runToolcraftPerformancePath,
} from "./performance-path-helpers";
import { selectToolcraftPerformanceSmokeEntries } from "./performance-smoke-selection";

const performancePathMatrix = compileToolcraftPerformancePathAdapterMatrix(
  deriveToolcraftPerformancePaths(appSchema, appPerformance),
  appPerformancePathAdapters,
);

test.setTimeout(180_000);

test("browser smoke: toolcraft prototype responsiveness", async ({ page }) => {
  const selectedEntries = selectToolcraftPerformanceSmokeEntries(
    performancePathMatrix,
  );

  if (selectedEntries.length === 0) {
    await page.goto("/");
    await expect(page.locator("[data-toolcraft-editable-canvas]")).toBeVisible();
    return;
  }

  for (const entry of selectedEntries) {
    await runToolcraftPerformancePath(
      page,
      appSchema,
      appPerformance,
      entry,
      {
        budgetMode: "prototype-smoke",
        fixtureResolutionMode: "strict-development",
      },
    );
  }
});
