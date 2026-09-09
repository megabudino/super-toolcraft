import { expect, type Page } from "@playwright/test";

import type { ToolcraftPerformancePath } from "@/toolcraft/runtime";

import type { ToolcraftPerformancePathAdapter } from "./performance-path-adapter-contract";

const grassCanvasSelector = '[data-slot="grass-webgl-canvas"]';

function control(page: Page, target: string) {
  return page.locator(`[data-toolcraft-control-target="${target}"]`);
}

export function createGrassMediaImportPerformanceAdapter(
  path: ToolcraftPerformancePath,
  prepareGrass: (page: Page) => Promise<void>,
): ToolcraftPerformancePathAdapter {
  let expectedHdriFile = "";
  return {
    action: async ({ page }) => {
      const hdriControl = control(page, "environment.hdriFile");
      const currentFile = await hdriControl.evaluate(
        (root) =>
          root
            .querySelector<HTMLButtonElement>('button[aria-label^="Remove "]')
            ?.getAttribute("aria-label") ?? "",
      );
      const nextFile = currentFile.includes("bloem_field_sunrise")
        ? "alps_field_perf.hdr"
        : "bloem_field_sunrise_perf.hdr";
      expectedHdriFile = nextFile;
      await hdriControl
        .locator('input[type="file"]')
        .setInputFiles(`e2e/fixtures/${nextFile}`);
    },
    observeOutcome: ({ page }) =>
      page.evaluate(() => {
        const remove = document.querySelector<HTMLButtonElement>(
          '[data-toolcraft-control-target="environment.hdriFile"] button[aria-label^="Remove "]',
        );
        return remove?.getAttribute("aria-label") ?? "none";
      }),
    pathId: path.id,
    prepare: async (page) => {
      await prepareGrass(page);
      await expect(control(page, "environment.hdriFile")).toBeVisible();
    },
    verifyOutcome: async ({ page }) => {
      await expect(page.locator(grassCanvasSelector)).toHaveAttribute(
        "data-grass-environment-source",
        "custom",
        { timeout: 30_000 },
      );
      await expect(page.locator(grassCanvasSelector)).toHaveAttribute(
        "data-grass-environment-signature",
        new RegExp(expectedHdriFile, "u"),
        { timeout: 30_000 },
      );
    },
  };
}
