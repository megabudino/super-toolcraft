import { createHash } from "node:crypto";
import { resolve } from "node:path";

import { expect, type Locator, type Page } from "@playwright/test";
import { strFromU8, unzipSync } from "fflate";

import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";

export const spiralFixturePaths = {
  blue: resolve("e2e/fixtures/spiral-blue.svg"),
  coral: resolve("e2e/fixtures/spiral-coral.svg"),
  green: resolve("e2e/fixtures/spiral-green.svg"),
  violet: resolve("e2e/fixtures/spiral-violet.svg"),
} as const;

export const spiralSliderRequirements = [
  ["spiral-radius", "spiral.radius"],
  ["spiral-twistDegrees", "spiral.twistDegrees"],
  ["spiral-verticalGap", "spiral.verticalGap"],
  ["spiral-depth", "spiral.depth"],
  ["spiral-depthOffset", "spiral.depthOffset"],
  ["spiral-taper", "spiral.taper"],
  ["spiral-repetitions", "spiral.repetitions"],
  ["card-width", "card.width"],
  ["card-height", "card.height"],
  ["card-curveRadius", "card.curveRadius"],
  ["card-cornerRadius", "card.cornerRadius"],
  ["shadow-blur", "shadow.blur"],
  ["depth-tiltDegrees", "depth.tiltDegrees"],
  ["depth-focusFalloff", "depth.focusFalloff"],
  ["depth-focusFloor", "depth.focusFloor"],
  ["depth-scaleFalloff", "depth.scaleFalloff"],
  ["depth-minScale", "depth.minScale"],
  ["physics-wheelSpeed", "physics.wheelSpeed"],
  ["physics-dragSpeed", "physics.dragSpeed"],
  ["physics-keyStep", "physics.keyStep"],
  ["physics-inertia", "physics.inertia"],
  ["physics-flexStrength", "physics.flexStrength"],
  ["physics-flexResponse", "physics.flexResponse"],
  ["physics-snapStrength", "physics.snapStrength"],
  ["interaction-pressDepth", "interaction.pressDepth"],
  ["interaction-pressShrink", "interaction.pressShrink"],
  ["interaction-parallax", "interaction.parallax"],
  ["view-perspective", "view.perspective"],
  ["view-cameraDistance", "view.cameraDistance"],
  ["view-sceneOffset", "view.sceneOffset"],
  ["view-portraitScale", "view.portraitScale"],
] as const;

export type SpiralExportArtifact = {
  bytes: Uint8Array;
  fileName: string;
};

export type SpiralImageInspection = {
  backgroundAlpha: number;
  byteLength: number;
  contentHash: string;
  height: number;
  mediaType: string;
  width: number;
};

export type SpiralCodeInspection = {
  background: string;
  backgroundIncluded: boolean;
  byteLength: number;
  contentHash: string;
  entryNames: string[];
  hasAgentGuide: boolean;
  hasPhysicalBend: boolean;
  imageCount: number;
  layout: string;
  mediaType: "application/zip";
};

export async function resetSpiralTestPage(page: Page): Promise<void> {
  await page.goto("/.toolcraft/server-identity.json");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-image-gallery-canvas="true"]')).toBeVisible();
}

export async function uploadSpiralFixtures(
  page: Page,
  paths: readonly string[] = Object.values(spiralFixturePaths),
): Promise<void> {
  await clearSpiralGalleryImages(page);
  const field = await getToolcraftControlFieldByTarget(page, "source.images");
  await field.locator('input[type="file"]').setInputFiles([...paths]);
}

export async function clearSpiralGalleryImages(page: Page): Promise<void> {
  const field = await getToolcraftControlFieldByTarget(page, "source.images");
  const removeButtons = field.getByRole("button", { name: /^Remove /u });
  let remaining = await removeButtons.count();
  while (remaining > 0) {
    const removeButton = removeButtons.first();
    if (remaining === 1) {
      await removeButton.press("Enter");
    } else {
      await removeButton.click();
    }
    remaining -= 1;
    await expect(removeButtons).toHaveCount(remaining);
  }
  await expect(page.locator('[data-image-gallery-canvas="true"]')).toHaveAttribute(
    "data-image-gallery-card-count",
    "0",
  );
}

export async function waitForSpiralCards(
  page: Page,
  expectedCount: number,
): Promise<void> {
  await expect(page.locator('[data-image-gallery-canvas="true"]')).toHaveAttribute(
    "data-image-gallery-card-count",
    String(expectedCount),
    { timeout: 10_000 },
  );
  await expect(page.locator('[data-image-gallery-canvas="true"]')).toHaveAttribute(
    "data-image-gallery-textures-ready",
    "true",
    { timeout: 10_000 },
  );
  await page.waitForTimeout(250);
}

export async function waitForSpiralSettled(page: Page): Promise<void> {
  await expect(page.locator('[data-image-gallery-canvas="true"]')).toHaveAttribute(
    "data-image-gallery-settled",
    "true",
    { timeout: 10_000 },
  );
  await page.waitForTimeout(250);
  await expect(page.locator('[data-image-gallery-canvas="true"]')).toHaveAttribute(
    "data-image-gallery-settled",
    "true",
    { timeout: 10_000 },
  );
}

export async function dragSliderToFraction(
  control: Locator,
  page: Page,
  fraction: number,
): Promise<void> {
  const slider = control.getByRole("slider");
  await slider.scrollIntoViewIfNeeded();
  const box = await slider.boundingBox();
  expect(box).not.toBeNull();
  const y = box!.y + box!.height / 2;
  await page.mouse.move(box!.x + box!.width * 0.3, y);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width * fraction, y, { steps: 5 });
  await page.mouse.up();
}

export async function setControlText(
  control: Locator,
  value: string,
): Promise<void> {
  const text = control.getByRole("textbox").last();
  await text.scrollIntoViewIfNeeded();
  await text.fill(value);
  await text.press("Enter");
  await text.blur();
}

export async function setSpiralCanvasSize(
  page: Page,
  width: number,
  height: number,
): Promise<void> {
  await setControlText(
    await getToolcraftControlFieldByTarget(page, "canvas.size.width"),
    String(width),
  );
  await setControlText(
    await getToolcraftControlFieldByTarget(page, "canvas.size.height"),
    String(height),
  );
}

export async function selectToolcraftOption(
  page: Page,
  target: string,
  optionName: string,
): Promise<void> {
  const control = await getToolcraftControlFieldByTarget(page, target);
  const combobox = control.getByRole("combobox");
  await combobox.scrollIntoViewIfNeeded();
  await combobox.click();
  await expect(combobox).toHaveAttribute("aria-expanded", "true");
  const option = page
    .locator('[data-slot="select-item"]')
    .filter({ hasText: new RegExp(`^${optionName}$`, "iu") });
  await expect(option).toBeVisible({ timeout: 10_000 });
  await option.click();
}

export async function exportSpiralImage(page: Page): Promise<SpiralExportArtifact> {
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export PNG", exact: true }).click();
  const stickyFooter = page.locator('[data-slot="toolcraft-panel-sticky-actions"]');
  await expect(stickyFooter).toHaveAttribute("data-sticky-footer-active", "true");
  await expect(stickyFooter).toHaveAttribute("data-sticky-footer-progress", /.+/u);
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const bytes = Buffer.concat(chunks);
  await expect(stickyFooter).not.toHaveAttribute("data-sticky-footer-active", "true");
  return { bytes, fileName: download.suggestedFilename() };
}

export async function exportSpiralCode(page: Page): Promise<SpiralExportArtifact> {
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export Code", exact: true }).click();
  const stickyFooter = page.locator('[data-slot="toolcraft-panel-sticky-actions"]');
  await expect(stickyFooter).toHaveAttribute("data-sticky-footer-active", "true");
  await expect(stickyFooter).toHaveAttribute("data-sticky-footer-progress", /.+/u);
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const bytes = Buffer.concat(chunks);
  await expect(stickyFooter).not.toHaveAttribute("data-sticky-footer-active", "true");
  return { bytes, fileName: download.suggestedFilename() };
}

export async function inspectSpiralCode(
  artifact: SpiralExportArtifact,
): Promise<SpiralCodeInspection> {
  const bytes = Buffer.from(artifact.bytes);
  const files = unzipSync(bytes);
  const config = JSON.parse(strFromU8(files["gallery.config.json"]!)) as {
    images: unknown[];
    values: Record<string, unknown>;
  };
  const guide = strFromU8(files["AGENT-INTEGRATION.md"]!);
  const webgl = strFromU8(files["src/image-gallery-webgl.ts"]!);
  return {
    background: String(config.values["appearance.background"] ?? ""),
    backgroundIncluded: config.values["export.includeBackground"] === true,
    byteLength: bytes.byteLength,
    contentHash: createHash("sha256").update(bytes).digest("hex"),
    entryNames: Object.keys(files).sort(),
    hasAgentGuide: guide.includes("Preserve both vertex-shader bends"),
    hasPhysicalBend:
      webgl.includes("float curveAngle = p.x / safeCurveRadius") &&
      webgl.includes("p.z -= arcDepth * sign(uEdgePull)"),
    imageCount: config.images.length,
    layout: String(config.values["layout.mode"] ?? ""),
    mediaType: "application/zip",
  };
}

export async function inspectSpiralImage(
  page: Page,
  artifact: SpiralExportArtifact,
): Promise<SpiralImageInspection> {
  const bytes = Buffer.from(artifact.bytes);
  const mediaType = artifact.fileName.endsWith(".jpg")
    ? "image/jpeg"
    : "image/png";
  const decoded = await page.evaluate(
    async ({ base64, type }) => {
      const binary = atob(base64);
      const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
      const bitmap = await createImageBitmap(new Blob([bytes], { type }));
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("Could not inspect the exported image.");
      context.drawImage(bitmap, 0, 0);
      const backgroundAlpha = context.getImageData(0, 0, 1, 1).data[3] ?? 0;
      bitmap.close();
      return {
        backgroundAlpha,
        height: canvas.height,
        width: canvas.width,
      };
    },
    { base64: bytes.toString("base64"), type: mediaType },
  );
  return {
    ...decoded,
    byteLength: bytes.byteLength,
    contentHash: createHash("sha256").update(bytes).digest("hex"),
    mediaType,
  };
}

export async function getSpiralCanvasPoint(page: Page): Promise<{ x: number; y: number }> {
  const canvas = page.locator('[data-image-gallery-canvas="true"]');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  return {
    x: Math.max(40, Math.min(640, box!.x + box!.width * 0.5)),
    y: Math.max(80, Math.min(640, box!.y + box!.height * 0.45)),
  };
}

export async function nudgeSpiralWithArrow(page: Page, count = 2): Promise<void> {
  const point = await getSpiralCanvasPoint(page);
  await page.mouse.click(point.x, point.y);
  for (let index = 0; index < count; index += 1) {
    await page.keyboard.press("ArrowDown");
  }
}
