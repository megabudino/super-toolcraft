import fs from "node:fs/promises";

import { type Download, type Locator, type Page } from "@playwright/test";

import { expect } from "./toolcraft-product-test";
import type {
  ToolcraftBackgroundImageInspection,
} from "./browser-background-output-evidence";
import type {
  ToolcraftOrientationBrowserObservation,
} from "./browser-orientation-gizmo-evidence-helpers";
import { inspectToolcraftImageDownload } from "./image-artifact-inspection";

export const BACKGROUND_TARGET = "appearance.background";
export const BAND_DISTANCE_TARGET = "bands.distance";
export const BAND_1_POSITION_TARGET = "bands.band1.position";
export const BAND_1_WIDTH_TARGET = "bands.band1.width";
export const BAND_2_POSITION_TARGET = "bands.band2.position";
export const BAND_2_WIDTH_TARGET = "bands.band2.width";
export const BAND_3_POSITION_TARGET = "bands.band3.position";
export const BAND_3_WIDTH_TARGET = "bands.band3.width";
export const BAND_4_POSITION_TARGET = "bands.band4.position";
export const BAND_4_WIDTH_TARGET = "bands.band4.width";
export const BAND_COLUMN_SPACING_TARGET = "bands.columnSpacing";
export const BAND_DOT_SIZE_TARGET = "bands.dotSize";
export const CRT_INTENSITY_TARGET = "effects.crtIntensity";
export const INCLUDE_BACKGROUND_TARGET = "export.includeBackground";
export const SPHERE_TARGET = "globe.sphereColor";
export const LINE_TARGET = "globe.lineColor";
export const LATITUDES_TARGET = "globe.latitudeCount";
export const MERIDIANS_TARGET = "globe.meridianCount";
export const LINE_WIDTH_TARGET = "globe.lineWidth";
export const LOGO_DXC_FINAL_POSITION_TARGET = "logos.dxc.finalPosition";
export const LOGO_HOLD_SECONDS_TARGET = "logos.holdSeconds";
export const LOGO_INTRO_RUN_TARGET = "logos.intro.run";
export const LOGO_META_FINAL_POSITION_TARGET = "logos.meta.finalPosition";
export const LOGO_PRADA_FINAL_POSITION_TARGET = "logos.prada.finalPosition";
export const LOGO_SPEED_TARGET = "logos.speed";
export const LOGO_ZILLOW_FINAL_POSITION_TARGET = "logos.zillow.finalPosition";
export const ORIENTATION_TARGET = "globe.orientation";
export const OUTLINE_TARGET = "globe.outline";
export const ACTIONS_TARGET = "actions.output";
export const INFINITY_TARGET = "canvas.infinity";
export const RENDER_SCALE_TARGET = "canvas.renderScale";
export const PREVIEW_CANVAS_SELECTOR = 'canvas[aria-label="Landing globe preview"]';
export const BLACK: readonly [number, number, number, number] = [0, 0, 0, 255];
export const FINITE_SIZE = { height: 1080, width: 1920 };
export const SCENE_RECT = { height: 1080, width: 1920, x: -960, y: -540 };
export const GRID_EXPORT_BOUNDS = {
  height: 0.71875,
  width: 0.40625,
  x: 0.296875,
  y: 0.140625,
};

export function applicabilityRequirementId(
  baseRequirementId: string,
  selectorTarget: string,
  selectorValue: boolean | number | string,
): string {
  return `${baseRequirementId}#applicability:${selectorTarget}=${encodeURIComponent(
    JSON.stringify(selectorValue),
  )}:visible`;
}

export async function fillControlText(
  control: Locator,
  value: string,
): Promise<void> {
  const input = control.locator("input").first();
  await input.fill(value);
  await input.press("Enter");
}

export async function setRangeControl(
  control: Locator,
  value: number,
): Promise<void> {
  await control.scrollIntoViewIfNeeded();
  const editButton = control
    .locator('button[aria-label^="Edit "][aria-label$=" value"]')
    .first();
  await editButton.click();
  const valueInput = control.getByRole("textbox").first();
  await valueInput.fill(String(value));
  await valueInput.press("Enter");
}

export async function chooseSelectOption(
  control: Locator,
  label: string,
): Promise<void> {
  await control.scrollIntoViewIfNeeded();
  await control.getByRole("combobox").click();
  const option = control
    .page()
    .locator('[role="option"]')
    .filter({ hasText: new RegExp(`^${label}$`) })
    .last();
  await expect(option).toBeVisible();
  await option.click();
}

export async function setSwitchControl(
  control: Locator,
  checked: boolean,
): Promise<void> {
  const switchControl = control.getByRole("switch");
  if ((await switchControl.getAttribute("aria-checked")) !== String(checked)) {
    await switchControl.click();
  }
}

export async function exportImage(page: Page): Promise<Download> {
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Export PNG" }).click(),
  ]);
  return download;
}

export async function inspectImage(
  page: Page,
  download: Download,
  backgroundRgba = BLACK,
) {
  return inspectToolcraftImageDownload({ backgroundRgba, download, page });
}

export async function inspectBackgroundImage(
  page: Page,
  download: Download,
): Promise<ToolcraftBackgroundImageInspection> {
  const inspected = await inspectImage(page, download, [0, 0, 0, 0]);
  const path = await download.path();
  if (!path) throw new Error("Missing downloaded image path.");
  const bytes = await fs.readFile(path);
  const backgroundAlpha = await page.evaluate(async ({ pathBase64 }) => {
    const binary = atob(pathBase64);
    const data = Uint8Array.from(binary, (character) =>
      character.charCodeAt(0),
    );
    const bitmap = await createImageBitmap(new Blob([data], { type: "image/png" }));
    try {
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("Unable to inspect background alpha.");
      context.drawImage(bitmap, 0, 0);
      return context.getImageData(0, 0, 1, 1).data[3] ?? 255;
    } finally {
      bitmap.close();
    }
  }, { pathBase64: bytes.toString("base64") });

  return {
    ...inspected.inspection,
    backgroundAlpha,
    height: inspected.inspection.height,
    mediaType: inspected.inspection.mediaType,
    width: inspected.inspection.width,
  };
}

export async function readImageDimensions(page: Page, download: Download) {
  return (await inspectImage(page, download)).inspection;
}

export async function dragCanvasPan(page: Page): Promise<void> {
  const viewport = page.getByRole("application", { name: "Canvas viewport" });
  const box = await viewport.boundingBox();
  expect(box).not.toBeNull();
  if (!box) throw new Error("Missing canvas viewport bounds.");
  await page.mouse.move(box.x + 80, box.y + box.height - 80);
  await page.mouse.down();
  await page.mouse.move(box.x + 200, box.y + box.height - 160, { steps: 8 });
  await page.mouse.up();
}

export async function exposeRenderScaleAriaForOrientationHelper(
  page: Page,
): Promise<void> {
  await page
    .locator('[data-toolcraft-control-target="canvas.renderScale"] input[type="range"]')
    .evaluate((element) => {
      const input = element as HTMLInputElement;
      input.setAttribute("aria-valuemax", input.max);
      input.setAttribute("aria-valuenow", input.value);
    });
}

export async function globeCanvasSignature(page: Page): Promise<string> {
  return page.locator(PREVIEW_CANVAS_SELECTOR).evaluate(async (element) => {
    const source = element as HTMLCanvasElement;
    const canvas = document.createElement("canvas");
    canvas.width = 96;
    canvas.height = 54;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Unable to sample globe canvas.");
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const hash = await crypto.subtle.digest("SHA-256", pixels);
    return Array.from(new Uint8Array(hash), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
  });
}

export function observeOrientation(
  root: HTMLElement,
): ToolcraftOrientationBrowserObservation {
  const gizmo = root.querySelector<HTMLElement>(
    '[data-testid="toolcraft-orientation-gizmo"]',
  );
  const world = root.querySelector<HTMLElement>("[data-toolcraft-canvas-world]");
  if (!gizmo) throw new Error("Orientation observation requires the gizmo.");
  const pose = JSON.parse(
    gizmo.dataset.toolcraftOrientationPose ?? "null",
  ) as ToolcraftOrientationBrowserObservation["pose"] | null;
  if (!pose) throw new Error("Missing orientation pose.");
  const signature = JSON.stringify({
    position: pose.position.map((value) => Number(value.toFixed(4))),
    up: pose.up.map((value) => Number(value.toFixed(4))),
  });
  return {
    outputSignature: signature,
    pixelSignature: signature,
    pose,
    poseTarget: gizmo.dataset.toolcraftOrientationTarget ?? "",
    presentationCacheKey: "landing-globe-grid",
    presentationDocumentId: "landing-globe",
    viewportOffsetX: Number(world?.dataset.toolcraftCanvasOffsetX ?? 0),
    viewportOffsetY: Number(world?.dataset.toolcraftCanvasOffsetY ?? 0),
  };
}
