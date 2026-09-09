import type { Download, Locator, Page } from "@playwright/test";

import type {
  ToolcraftComponentAcceptance,
  ToolcraftControlApplicabilityCase,
} from "../src/app/app-acceptance";
import { appAcceptance } from "../src/app/app-acceptance-data";
import { appSchema } from "../src/app/app-schema";
import { dispersionCarouselTargets } from "../src/app/dispersion-carousel/dispersion-carousel-values";
import { inspectToolcraftImageDownload } from "./image-artifact-inspection";
import type {
  ToolcraftBrowserAction,
  ToolcraftBrowserProofSession,
} from "./browser-proof-session";
import { expect } from "./toolcraft-product-test";

export const dispersionCarouselTarget = dispersionCarouselTargets;
export const paperCanvasSelector =
  "canvas[data-dispersion-carousel-canvas='true']";
export const productSelector = "[data-dispersion-carousel='true']";
export const carouselBackgroundRgba = [255, 255, 255, 255] as const;

export async function openCleanDispersionCarousel(page: Page): Promise<void> {
  await page.goto("/");
  if (appSchema.persistence.storage === "localStorage") {
    await page.evaluate(
      (key) => localStorage.removeItem(key),
      appSchema.persistence.key,
    );
    await page.reload({ waitUntil: "domcontentloaded" });
  }
  await expect(page.locator(productSelector)).toBeVisible();
  await expect(page.locator(paperCanvasSelector)).toBeVisible();
  await expect
    .poll(() =>
      page.locator("[data-carousel-base='true'] img").evaluateAll((images) =>
        images.every(
          (image) =>
            image instanceof HTMLImageElement &&
            image.complete &&
            image.naturalWidth === 896 &&
            image.naturalHeight === 1120,
        ),
      ),
    )
    .toBe(true);
}

export async function chooseDispersionCarouselOption(
  page: Page,
  control: Locator,
  label: string,
): Promise<void> {
  const combobox = control.getByRole("combobox");
  await combobox.scrollIntoViewIfNeeded();
  if ((await combobox.getAttribute("aria-expanded")) !== "true") {
    await combobox.click();
  }
  const option = page
    .locator('[data-slot="select-item"]')
    .filter({ hasText: label })
    .last();
  await expect(option).toBeVisible();
  await option.click();
}

export async function exportDispersionCarouselImage(
  page: Page,
): Promise<Download> {
  const pending = page.waitForEvent("download", { timeout: 120_000 });
  await page.getByRole("button", { name: "Export PNG", exact: true }).click();
  return pending;
}

export async function inspectDispersionCarouselImage(
  page: Page,
  download: Download,
) {
  return inspectToolcraftImageDownload({
    backgroundRgba: carouselBackgroundRgba,
    download,
    page,
  });
}

export function getDispersionCarouselExpectedProductPixel(
  normalizedPixels: Uint8ClampedArray,
): { rgba: [number, number, number, number]; xRatio: number; yRatio: number } {
  const size = 64;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const offset = (y * size + x) * 4;
      const rgba = Array.from(
        normalizedPixels.subarray(offset, offset + 4),
      ) as [number, number, number, number];
      const distance = Math.hypot(
        rgba[0] - carouselBackgroundRgba[0],
        rgba[1] - carouselBackgroundRgba[1],
        rgba[2] - carouselBackgroundRgba[2],
        rgba[3] - carouselBackgroundRgba[3],
      );
      if (distance > 48) {
        return {
          rgba,
          xRatio: (x + 0.5) / size,
          yRatio: (y + 0.5) / size,
        };
      }
    }
  }
  throw new Error("The exported carousel needs at least one product pixel.");
}

export function getDispersionCarouselAcceptanceRow(
  id: string,
): ToolcraftComponentAcceptance {
  const row = appAcceptance.find((entry) => entry.id === id);
  if (!row) throw new Error(`Missing acceptance row ${id}.`);
  return row;
}

async function selectApplicabilityCase(
  control: Locator,
  page: Page,
  applicabilityCase: ToolcraftControlApplicabilityCase,
): Promise<void> {
  switch (applicabilityCase.selectorControlType) {
    case "checkbox":
    case "switch": {
      const toggle = control.getByRole(applicabilityCase.selectorControlType);
      if (
        (await toggle.getAttribute("aria-checked")) !==
        String(applicabilityCase.selectorValue)
      ) {
        await toggle.click();
      }
      return;
    }
    case "imagePicker":
    case "segmented":
      await control
        .getByRole("button", {
          name: applicabilityCase.selectorOptionLabel,
        })
        .click();
      return;
    case "select":
      await chooseDispersionCarouselOption(
        page,
        control,
        applicabilityCase.selectorOptionLabel,
      );
      return;
    case "slider": {
      const slider = control.getByRole("slider");
      await slider.focus();
      await slider.press(
        Number(await slider.getAttribute("aria-valuenow")) ===
          applicabilityCase.selectorValue
          ? "ArrowRight"
          : "Home",
      );
      return;
    }
    case "tabs":
      await control
        .getByRole("tab", { name: applicabilityCase.selectorOptionLabel })
        .click();
  }
}

export function createDispersionCarouselBranchAction(
  session: ToolcraftBrowserProofSession,
  applicabilityCase: ToolcraftControlApplicabilityCase,
): ToolcraftBrowserAction {
  return session.controlAction(
    applicabilityCase.selectorTarget,
    (control, page) => selectApplicabilityCase(control, page, applicabilityCase),
  );
}
