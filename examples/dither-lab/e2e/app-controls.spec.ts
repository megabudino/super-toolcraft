import { readFile } from "node:fs/promises";

import { expect, test, type Locator, type Page } from "@playwright/test";

import { appPerformance } from "../src/app/app-performance";
import { expectNoForbiddenCanvasUi } from "./canvas-handle-helpers";
import {
  applyToolcraftPerformanceStressFixture,
  applyToolcraftPerformanceWorkloadFixture,
  dragToolcraftSliderByLabel,
  dragToolcraftSliderToPerformanceStressValue,
  dragToolcraftSliderToValue,
  expectToolcraftCanvasViewportStable,
  expectToolcraftDiscreteSliderDragSmoothness,
  expectToolcraftScenarioPerformanceBudget,
  getToolcraftFieldByLabel,
  getToolcraftPerformanceStressValue,
  getToolcraftPerformanceWorkloadValue,
  measureToolcraftInteraction,
  waitForToolcraftAnimationFrames,
  zoomToolcraftCanvasViewport,
  type ToolcraftStressFixtureAppliers,
} from "./performance-helpers";
import {
  expectToolcraftProductObservableToChange,
  getToolcraftProductObservableSnapshot,
} from "./product-observable-helpers";

const productCanvasSelector = "[data-dither-output-canvas]";

type MediaFixture = {
  height: number;
  width: number;
};

const styleLabels: Record<string, string> = {
  bayer: "Bayer Matrix",
  characters: "ASCII",
  "cross-stitch": "Cross-Stitch",
  "dither-blend": "Dither",
  dots: "Dots",
  halftone: "Halftone",
  "hex-grid": "Hex Grid",
  lattice: "Lattice",
  led: "LED",
  lego: "LEGO",
  "noise-dither": "Noise Dither",
  none: "None",
  "pixel-art": "Pixel Art",
  voxel: "Voxel",
};

const asciiModeLabels: Record<string, string> = {
  dynamic: "Dynamic",
  filled: "Filled",
  uniform: "Uniform",
};

const glyphLabels: Record<string, string> = {
  alpha: "Alpha",
  blocky: "Blocky",
  brutal: "Brutal",
  cinematic: "Symbols",
  classic: "Classic ASCII",
  custom: "Custom",
  hacker: "Hacker",
  japanese: "Japanese",
  numbers: "Numeric",
  pixel: "Pixel",
  retro: "Retro",
  tech: "Tech Mono",
  thin: "Thin",
};

const blendLabels: Record<string, string> = {
  "color-dodge": "Color Dodge",
  multiply: "Multiply",
  overlay: "Overlay",
  screen: "Screen",
  "source-over": "Normal",
};

const duotoneLabels: Record<string, string> = {
  custom: "Custom",
  "deep-sea": "Deep Sea",
  ember: "Ember",
  "midnight-gold": "Midnight Gold",
  "neon-violet": "Neon Violet",
  off: "Off",
  "royal-cream": "Royal Cream",
};

const formatLabels: Record<string, string> = {
  jpg: "JPG",
  png: "PNG",
};

const resolutionLabels: Record<string, string> = {
  "2k": "2K",
  "4k": "4K",
  "8k": "8K",
};

function makeGradientSvg(width = 640, height = 360, variant = "gradient"): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#f83b75"/>
        <stop offset="0.34" stop-color="#f4d35e"/>
        <stop offset="0.68" stop-color="#22c55e"/>
        <stop offset="1" stop-color="#1e40af"/>
      </linearGradient>
      <radialGradient id="r" cx="62%" cy="38%" r="48%">
        <stop offset="0" stop-color="#ffffff"/>
        <stop offset="1" stop-color="#111111" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#g)"/>
    <rect width="${width}" height="${height}" fill="url(#r)" opacity="0.72"/>
    <circle cx="${width * 0.22}" cy="${height * 0.32}" r="${Math.min(width, height) * 0.16}" fill="#050505" opacity="0.72"/>
    <rect x="${width * 0.56}" y="${height * 0.58}" width="${width * 0.3}" height="${height * 0.18}" rx="18" fill="#ffffff" opacity="0.78"/>
    <text x="${width * 0.08}" y="${height * 0.84}" fill="#101010" font-family="monospace" font-size="${Math.max(22, Math.round(width / 18))}" font-weight="700">${variant}</text>
  </svg>`;
}

function makeTransparentSvg(width = 640, height = 360): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect x="${width * 0.18}" y="${height * 0.2}" width="${width * 0.64}" height="${height * 0.6}" rx="28" fill="#f8fafc" opacity="0.92"/>
    <circle cx="${width * 0.36}" cy="${height * 0.5}" r="${Math.min(width, height) * 0.18}" fill="#e11d48"/>
    <circle cx="${width * 0.62}" cy="${height * 0.48}" r="${Math.min(width, height) * 0.15}" fill="#0f766e" opacity="0.92"/>
  </svg>`;
}

function mediaFixtureFromValue(value: unknown): MediaFixture {
  const record = value as Partial<MediaFixture>;
  const width = Number(record.width);
  const height = Number(record.height);

  return {
    height: Number.isFinite(height) && height > 0 ? Math.round(height) : 1080,
    width: Number.isFinite(width) && width > 0 ? Math.round(width) : 1920,
  };
}

async function openDither(page: Page, options: { clearStorage?: boolean } = {}): Promise<void> {
  await page.goto("/");

  if (options.clearStorage ?? true) {
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
  }

  await expect(page.locator('[data-slot="toolcraft-runtime-app"]')).toBeVisible();
  await expect(page.getByRole("application", { name: "Canvas viewport" })).toBeVisible();
  await expect(page.locator(productCanvasSelector)).toBeVisible();
}

async function waitForDitherRender(page: Page, frameCount = 6): Promise<void> {
  await waitForToolcraftAnimationFrames(page, frameCount);
  await expect(page.locator(productCanvasSelector)).toBeVisible();
}

async function dropSvgOnCanvas(
  page: Page,
  svg: string,
  fileName = "dither-fixture.svg",
): Promise<void> {
  const dataTransfer = await page.evaluateHandle(
    ({ fileName: nextFileName, svg: sourceSvg }) => {
      const transfer = new DataTransfer();
      const file = new File([sourceSvg], nextFileName, { type: "image/svg+xml" });

      transfer.items.add(file);

      return transfer;
    },
    { fileName, svg },
  );

  await page
    .getByRole("application", { name: "Canvas viewport" })
    .dispatchEvent("drop", { dataTransfer });
  await dataTransfer.dispose();
  await waitForDitherRender(page);
}

async function uploadSvgThroughFileDropControl(
  page: Page,
  svg: string,
  fileName = "dither-upload.svg",
): Promise<void> {
  const chooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: /Browse image file|Replace image file/ }).click();
  const chooser = await chooserPromise;

  await chooser.setFiles({
    buffer: Buffer.from(svg),
    mimeType: "image/svg+xml",
    name: fileName,
  });
  await waitForDitherRender(page);
}

async function prepareDither(
  page: Page,
  svg = makeGradientSvg(),
  fileName = "dither-gradient.svg",
): Promise<void> {
  await openDither(page);
  await dropSvgOnCanvas(page, svg, fileName);
}

async function selectControlOption(
  page: Page,
  label: string,
  optionLabel: string,
  fieldIndex = 0,
): Promise<void> {
  const field =
    label === "Resolution"
      ? page
          .locator('[data-slot="field"]')
          .filter({ has: page.locator('[data-slot="select-trigger"]') })
          .filter({ hasText: /^Resolution/ })
          .first()
      : await getToolcraftFieldByLabelAt(page, label, fieldIndex);
  const trigger = field.locator('[data-slot="select-trigger"]').first();

  await expect(field).toBeVisible();
  await expect(trigger).toBeVisible();
  await trigger.click();

  const roleOption = page.getByRole("option", { name: optionLabel });
  if ((await roleOption.count()) > 0) {
    await roleOption.first().click();
  } else {
    await page
      .locator('[data-slot="select-item"]')
      .filter({ hasText: new RegExp(`^${optionLabel}$`) })
      .first()
      .click();
  }

  await waitForDitherRender(page);
}

async function selectStyle(page: Page, value: string): Promise<void> {
  await selectControlOption(page, "Style", styleLabels[value] ?? value);
}

async function selectAsciiMode(page: Page, value: string): Promise<void> {
  await selectControlOption(page, "Style", asciiModeLabels[value] ?? value, 1);
}

async function selectGlyphs(page: Page, value: string): Promise<void> {
  await selectControlOption(page, "Preset", glyphLabels[value] ?? value);
}

async function selectBlend(page: Page, value: string): Promise<void> {
  await selectControlOption(page, "Blending Mode", blendLabels[value] ?? value);
}

async function selectDuotonePreset(page: Page, value: string): Promise<void> {
  await selectControlOption(page, "Preset", duotoneLabels[value] ?? value);
}

async function selectFormat(page: Page, value: string): Promise<void> {
  await selectControlOption(page, "Format", formatLabels[value] ?? value);
}

async function selectResolution(page: Page, value: string): Promise<void> {
  await selectControlOption(page, "Resolution", resolutionLabels[value] ?? value);
}

async function getImageResolutionField(page: Page) {
  const field = page
    .locator('[data-slot="field"]')
    .filter({ has: page.locator('[data-slot="select-trigger"]') })
    .filter({ hasText: /^Resolution/ })
    .first();

  await expect(field).toBeVisible();

  return field;
}

async function getToolcraftFieldByLabelAt(
  page: Page,
  label: string,
  index: number,
): Promise<Locator> {
  const field = page
    .locator('[data-slot="field"]')
    .filter({ hasText: new RegExp(`^${label}`) })
    .nth(index);

  await expect(field, `Toolcraft field "${label}" at index ${index} should be visible`).toBeVisible();

  return field;
}

async function expectToolcraftSliderValue(
  page: Page,
  label: string,
  expectedValue: number,
): Promise<void> {
  const field = await getToolcraftFieldByLabel(page, label);
  const slider = field.locator('input[type="range"], [role="slider"]').first();

  await expect(slider).toBeVisible();
  await expect
    .poll(() =>
      slider.evaluate((element) =>
        Number(
          element.getAttribute("aria-valuenow") ??
            (element as HTMLInputElement).value,
        ),
      ),
    )
    .toBe(expectedValue);
}

async function fillCustomGlyphs(page: Page, value: string): Promise<void> {
  const field = await getToolcraftFieldByLabel(page, "Chars");
  const input = field.locator("input, textarea").first();

  await expect(input).toBeVisible();
  await input.fill(value);
  await input.blur();
  await waitForDitherRender(page);
}

async function setBackgroundColor(page: Page, value: string): Promise<void> {
  const input = page.getByLabel(/backgroundColor hex|Background hex/i).first();

  await expect(input).toBeVisible();
  await input.fill(value);
  await input.press("Enter");
  await waitForDitherRender(page);
}

async function setDuotoneColor(
  page: Page,
  role: "Base" | "Pixels",
  value: string,
): Promise<void> {
  const controlId = role === "Pixels" ? "duotonePixels" : "duotoneBase";
  const input = page.getByLabel(new RegExp(`${controlId} hex|${role} hex`, "i")).first();

  await expect(input).toBeVisible();
  await input.fill(value);
  await input.press("Enter");
  await waitForDitherRender(page);
}

async function toggleSwitchByLabel(page: Page, label: string): Promise<void> {
  const field = await getToolcraftFieldByLabel(page, label);
  const control = field.locator('[role="switch"], input[type="checkbox"], button[aria-checked]').first();

  await expect(control).toBeVisible();
  await control.click();
  await waitForDitherRender(page);
}

async function expectCanvasOutputToChange(
  page: Page,
  action: () => Promise<void>,
): Promise<void> {
  await expectToolcraftProductObservableToChange(
    page,
    async () => {
      await action();
      await waitForDitherRender(page);
    },
    { selector: productCanvasSelector, timeoutMs: 10000 },
  );
}

async function expectFieldHidden(page: Page, label: string): Promise<void> {
  await expect(
    page.locator('[data-slot="field"]').filter({ hasText: new RegExp(`^${label}`) }),
  ).toHaveCount(0);
}

async function expectAsciiStyleHidden(page: Page): Promise<void> {
  await expect(
    page.locator('[data-slot="field"]').filter({ hasText: /^Style/ }),
  ).toHaveCount(1);
}

async function getCanvasCornerPixel(page: Page): Promise<[number, number, number, number]> {
  return page.locator(productCanvasSelector).evaluate((element) => {
    const canvas = element as HTMLCanvasElement;
    const context = canvas.getContext("2d", { willReadFrequently: true });

    if (!context) {
      return [0, 0, 0, 0] as [number, number, number, number];
    }

    return Array.from(context.getImageData(0, 0, 1, 1).data) as [
      number,
      number,
      number,
      number,
    ];
  });
}

async function exportCurrentImage(page: Page): Promise<{
  bytes: Buffer;
  fileName: string;
}> {
  const downloadPromise = page.waitForEvent("download");

  await page.getByRole("button", { name: /Export PNG/ }).click();

  const download = await downloadPromise;
  const path = await download.path();

  if (!path) {
    throw new Error("Export download did not expose a local file path.");
  }

  return {
    bytes: await readFile(path),
    fileName: download.suggestedFilename(),
  };
}

async function decodeImageBytes(
  page: Page,
  bytes: Buffer,
  mimeType: string,
): Promise<{
  height: number;
  pixel: [number, number, number, number];
  width: number;
}> {
  return page.evaluate(
    async ({ imageBase64, type }) => {
      const binary = window.atob(imageBase64);
      const imageBytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) {
        imageBytes[index] = binary.charCodeAt(index);
      }
      const blob = new Blob([imageBytes], { type });
      const bitmap = await createImageBitmap(blob);
      const canvas = document.createElement("canvas");

      canvas.width = 1;
      canvas.height = 1;

      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) {
        bitmap.close();
        return { height: 0, pixel: [0, 0, 0, 0], width: 0 };
      }

      context.drawImage(bitmap, 0, 0, 1, 1, 0, 0, 1, 1);

      const pixel = Array.from(context.getImageData(0, 0, 1, 1).data) as [
        number,
        number,
        number,
        number,
      ];
      const dimensions = {
        height: bitmap.height,
        pixel,
        width: bitmap.width,
      };

      bitmap.close();

      return dimensions;
    },
    { imageBase64: bytes.toString("base64"), type: mimeType },
  );
}

function expectPngSignature(bytes: Buffer): void {
  expect(bytes.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
}

function expectJpegSignature(bytes: Buffer): void {
  expect(bytes[0]).toBe(0xff);
  expect(bytes[1]).toBe(0xd8);
}

const allFixtureAppliers: ToolcraftStressFixtureAppliers = {
  asciiMode: async (value, { page }) => {
    await selectStyle(page, "characters");
    await selectAsciiMode(page, String(value));
  },
  density: async (value, { page }) => {
    await dragToolcraftSliderToValue(page, "Density", Number(value));
  },
  fill: async (value, { page }) => {
    await dragToolcraftSliderToValue(page, "Fill", Number(value));
  },
  imageResolution: async (value, { page }) => {
    await selectResolution(page, String(value));
  },
  renderScale: async (value, { page }) => {
    await dragToolcraftSliderToValue(page, "Resolution scale", Number(value));
  },
  size: async (value, { page }) => {
    await dragToolcraftSliderToValue(page, "Size", Number(value));
  },
  sourceMedia: async (value, { page, scenarioId }) => {
    const { height, width } = mediaFixtureFromValue(value);
    await uploadSvgThroughFileDropControl(
      page,
      makeGradientSvg(width, height, scenarioId),
      `${scenarioId}-${width}x${height}.svg`,
    );
  },
  style: async (value, { page }) => {
    await selectStyle(page, String(value));
  },
};

function fixtureAppliers(...keys: string[]): ToolcraftStressFixtureAppliers {
  return Object.fromEntries(keys.map((key) => [key, allFixtureAppliers[key]!]));
}

test("browser: source image upload clear and reset update media", async ({ page }) => {
  await openDither(page);
  await waitForDitherRender(page, 12);
  const bundledSourceBaseline = await getToolcraftProductObservableSnapshot(page, {
    selector: productCanvasSelector,
  });
  expect(bundledSourceBaseline).toContain('"height":4096');
  expect(bundledSourceBaseline).toContain('"width":4096');
  await expect(page.locator(productCanvasSelector)).toHaveAttribute(
    "data-dither-source",
    "bundled",
  );
  await expect(page.getByRole("button", { name: "Remove image" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Replace image file" })).toBeVisible();
  await expectCanvasOutputToChange(page, async () => {
    await page.getByRole("button", { name: "Remove image" }).click();
  });
  await expect(page.locator(productCanvasSelector)).toHaveAttribute("data-dither-source", "empty");
  await expect(page.getByRole("button", { name: "Browse image file" })).toBeVisible();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.getByRole("button", { name: "Remove image" })).toBeVisible();
  await expect(page.locator(productCanvasSelector)).toHaveAttribute("data-dither-source", "bundled");
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await expect(page.locator(productCanvasSelector)).toHaveAttribute("data-dither-source", "empty");
  await page.getByRole("button", { name: "Reset Source section", exact: true }).click();
  await expect(page.getByRole("button", { name: "Remove image" })).toBeVisible();
  await expect(page.locator(productCanvasSelector)).toHaveAttribute("data-dither-source", "bundled");
  await expect(
    (await getToolcraftFieldByLabelAt(page, "Style", 0)).locator(
      '[data-slot="select-trigger"]',
    ),
  ).toContainText("Dots");
  await expectToolcraftSliderValue(page, "Size", 1);
  await expectToolcraftSliderValue(page, "Fill", 81);
  await expectToolcraftSliderValue(page, "Density", 8);
  await expectToolcraftSliderValue(page, "Exposure", 189);
  await expectToolcraftSliderValue(page, "Scatter", 66);
  await expectToolcraftSliderValue(page, "Seed", 999);
  await expectToolcraftSliderValue(page, "Brightness", 108);
  await expectToolcraftSliderValue(page, "Grain", 22);

  await dropSvgOnCanvas(page, makeTransparentSvg(), "transparent-source.svg");
  const referenceMediaBaseline = await getToolcraftProductObservableSnapshot(page, {
    selector: productCanvasSelector,
  });
  expect(referenceMediaBaseline).toContain("Dither output");
  expect(referenceMediaBaseline).not.toBe(bundledSourceBaseline);
  await expect(page.locator(productCanvasSelector)).toHaveAttribute(
    "data-dither-source",
    "custom",
  );
  await expect(page.getByRole("button", { name: "Remove image" })).toBeVisible();

  await expectCanvasOutputToChange(page, async () => {
    await page.getByRole("button", { name: "Remove image" }).click();
  });
  await expect(page.getByRole("button", { name: "Remove image" })).toHaveCount(0);
  await waitForDitherRender(page, 12);
  await expect(page.locator(productCanvasSelector)).toHaveAttribute(
    "data-dither-source",
    "empty",
  );

  await uploadSvgThroughFileDropControl(page, makeGradientSvg(), "source-again.svg");
  await expect(page.getByRole("button", { name: "Remove image" })).toBeVisible();
  await dragToolcraftSliderToValue(page, "Size", 50);
  await expect(
    (await getToolcraftFieldByLabel(page, "Size"))
      .locator('input[type="range"], [role="slider"]')
      .first(),
  ).not.toHaveAttribute("aria-valuenow", "1");
  await expect(page.locator(productCanvasSelector)).toHaveAttribute(
    "data-dither-source",
    "custom",
  );

  await expectCanvasOutputToChange(page, async () => {
    await page.getByLabel("Reset controls").click();
  });
  await expect(page.getByRole("button", { name: "Remove image" })).toBeVisible();
  await waitForDitherRender(page, 12);
  await expect(page.locator(productCanvasSelector)).toHaveAttribute(
    "data-dither-source",
    "bundled",
  );
  await expectToolcraftSliderValue(page, "Size", 1);
});

test("browser: effect style changes product output", async ({ page }) => {
  await prepareDither(page);
  const referenceStyleBaseline = await getToolcraftProductObservableSnapshot(page, {
    selector: productCanvasSelector,
  });
  expect(referenceStyleBaseline).toContain("Dither output");

  await expectCanvasOutputToChange(page, async () => {
    await selectStyle(page, "pixel-art");
  });
  await expectCanvasOutputToChange(page, async () => {
    await selectStyle(page, "noise-dither");
  });
  await expectCanvasOutputToChange(page, async () => {
    await selectStyle(page, "bayer");
  });
  await expectCanvasOutputToChange(page, async () => {
    await selectStyle(page, "characters");
  });
  await expectCanvasOutputToChange(page, async () => {
    await selectStyle(page, "halftone");
  });
  await expectCanvasOutputToChange(page, async () => {
    await selectStyle(page, "lego");
  });
  await expectCanvasOutputToChange(page, async () => {
    await selectStyle(page, "dots");
  });
  await expectCanvasOutputToChange(page, async () => {
    await selectStyle(page, "led");
  });
  await expectCanvasOutputToChange(page, async () => {
    await selectStyle(page, "cross-stitch");
  });
  await expectCanvasOutputToChange(page, async () => {
    await selectStyle(page, "voxel");
  });
  await expectCanvasOutputToChange(page, async () => {
    await selectStyle(page, "lattice");
  });
  await expectCanvasOutputToChange(page, async () => {
    await selectStyle(page, "hex-grid");
  });
  await expectCanvasOutputToChange(page, async () => {
    await selectStyle(page, "none");
  });
  await expectCanvasOutputToChange(page, async () => {
    await selectStyle(page, "dither-blend");
  });
});

test("browser: effect size changes product output", async ({ page }) => {
  await prepareDither(page);
  const field = await getToolcraftFieldByLabel(page, "Size");
  const sliderSurface = field.locator('[data-slot="slider"]').first();
  const box = await sliderSurface.boundingBox();

  if (!box) {
    throw new Error('Could not measure slider "Size".');
  }

  const referenceSizeBaseline = await getToolcraftProductObservableSnapshot(page, {
    selector: productCanvasSelector,
  });
  expect(referenceSizeBaseline).toContain("Dither output");
  await page.locator(productCanvasSelector).evaluate((element) => {
    const canvas = element as HTMLCanvasElement;
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Could not instrument Dither canvas.");
    }

    const metrics = { active: false, paints: 0 };
    const originalDrawImage = context.drawImage;
    (
      window as Window & {
        __ditherLiveSliderMetrics?: typeof metrics;
      }
    ).__ditherLiveSliderMetrics = metrics;
    context.drawImage = function instrumentedDrawImage(
      ...args: Parameters<CanvasRenderingContext2D["drawImage"]>
    ) {
      if (metrics.active) {
        metrics.paints += 1;
      }

      return Reflect.apply(originalDrawImage, this, args);
    } as typeof context.drawImage;
  });

  const y = box.y + box.height / 2;
  const startX = box.x + box.width * 0.1;
  const middleX = box.x + box.width * 0.52;
  const endX = box.x + box.width * 0.9;

  await page.mouse.move(startX, y);
  await page.evaluate(() => {
    const metrics = (
      window as Window & {
        __ditherLiveSliderMetrics?: { active: boolean; paints: number };
      }
    ).__ditherLiveSliderMetrics;
    if (metrics) metrics.active = true;
  });
  await page.mouse.down();

  try {
    for (let step = 1; step <= 24; step += 1) {
      await page.mouse.move(startX + ((middleX - startX) * step) / 24, y);
      await page.waitForTimeout(4);
    }
    const firstLiveFrame = await getToolcraftProductObservableSnapshot(page, {
      selector: productCanvasSelector,
    });
    expect(firstLiveFrame).not.toBe(referenceSizeBaseline);

    const firstPaintCount = await page.evaluate(
      () =>
        (
          window as Window & {
            __ditherLiveSliderMetrics?: { active: boolean; paints: number };
          }
        ).__ditherLiveSliderMetrics?.paints ?? 0,
    );
    expect(firstPaintCount).toBeGreaterThan(0);

    for (let step = 1; step <= 24; step += 1) {
      await page.mouse.move(middleX + ((endX - middleX) * step) / 24, y);
      await page.waitForTimeout(4);
    }
    const secondPaintCount = await page.evaluate(
      () =>
        (
          window as Window & {
            __ditherLiveSliderMetrics?: { active: boolean; paints: number };
          }
        ).__ditherLiveSliderMetrics?.paints ?? 0,
    );
    expect(secondPaintCount).toBeGreaterThan(firstPaintCount);

    const secondLiveFrame = await getToolcraftProductObservableSnapshot(page, {
      selector: productCanvasSelector,
    });
    expect(secondLiveFrame).not.toBe(firstLiveFrame);
  } finally {
    await page.evaluate(() => {
      const metrics = (
        window as Window & {
          __ditherLiveSliderMetrics?: { active: boolean; paints: number };
        }
      ).__ditherLiveSliderMetrics;
      if (metrics) metrics.active = false;
    });
    await page.mouse.up();
  }
});

test("browser: effect fill changes product output", async ({ page }) => {
  await prepareDither(page);
  await selectStyle(page, "halftone");
  await getToolcraftProductObservableSnapshot(page, { selector: productCanvasSelector });

  await expectCanvasOutputToChange(page, async () => {
    await dragToolcraftSliderToValue(page, "Fill", 86);
  });

  await selectStyle(page, "dither-blend");
  await expectFieldHidden(page, "Fill");
});

test("browser: effect density changes product output", async ({ page }) => {
  await prepareDither(page);
  await selectStyle(page, "characters");
  await selectAsciiMode(page, "uniform");
  await getToolcraftProductObservableSnapshot(page, { selector: productCanvasSelector });

  await expectCanvasOutputToChange(page, async () => {
    await dragToolcraftSliderToValue(page, "Density", 10);
  });
});

test("browser: effect exposure changes product output", async ({ page }) => {
  await prepareDither(page);
  await selectStyle(page, "halftone");
  await dragToolcraftSliderToValue(page, "Fill", 100);
  await getToolcraftProductObservableSnapshot(page, { selector: productCanvasSelector });

  await expectCanvasOutputToChange(page, async () => {
    await dragToolcraftSliderToValue(page, "Exposure", 120);
  });
});

test("browser: effect scatter changes product output", async ({ page }) => {
  await prepareDither(page);
  await selectStyle(page, "halftone");
  await dragToolcraftSliderToValue(page, "Fill", 100);
  await getToolcraftProductObservableSnapshot(page, { selector: productCanvasSelector });

  await expectCanvasOutputToChange(page, async () => {
    await dragToolcraftSliderToValue(page, "Scatter", 100);
  });

  await selectStyle(page, "bayer");
  await expectFieldHidden(page, "Scatter");
});

test("browser: effect seed changes deterministic product output", async ({ page }) => {
  await prepareDither(page);
  await selectStyle(page, "dots");
  await dragToolcraftSliderToValue(page, "Scatter", 100);
  await getToolcraftProductObservableSnapshot(page, { selector: productCanvasSelector });

  await expectCanvasOutputToChange(page, async () => {
    await dragToolcraftSliderToValue(page, "Seed", 812);
  });
  await dragToolcraftSliderToValue(page, "Seed", 37);
  await expect(page.locator(productCanvasSelector)).toBeVisible();
});

test("browser: ascii mode changes product output", async ({ page }) => {
  await prepareDither(page);
  await selectStyle(page, "characters");
  await getToolcraftProductObservableSnapshot(page, { selector: productCanvasSelector });

  await expectCanvasOutputToChange(page, async () => {
    await selectAsciiMode(page, "dynamic");
  });
  await expectCanvasOutputToChange(page, async () => {
    await selectAsciiMode(page, "filled");
  });

  await selectStyle(page, "dots");
  await expectAsciiStyleHidden(page);
});

test("browser: ascii glyphs change product output", async ({ page }) => {
  await prepareDither(page);
  await selectStyle(page, "characters");
  await getToolcraftProductObservableSnapshot(page, { selector: productCanvasSelector });

  await expectCanvasOutputToChange(page, async () => {
    await selectGlyphs(page, "japanese");
  });
  await expectCanvasOutputToChange(page, async () => {
    await selectGlyphs(page, "pixel");
  });
  await expectCanvasOutputToChange(page, async () => {
    await selectGlyphs(page, "tech");
  });
});

test("browser: ascii custom glyphs change product output", async ({ page }) => {
  await prepareDither(page);
  await selectStyle(page, "characters");
  await selectGlyphs(page, "custom");
  await expect(await getToolcraftFieldByLabel(page, "Chars")).toBeVisible();
  await getToolcraftProductObservableSnapshot(page, { selector: productCanvasSelector });

  await expectCanvasOutputToChange(page, async () => {
    await fillCustomGlyphs(page, "@#%*+=-:.01XZ");
  });

  await selectGlyphs(page, "classic");
  await expectFieldHidden(page, "Chars");
});

test("browser: tone brightness changes product output", async ({ page }) => {
  await prepareDither(page);
  await getToolcraftProductObservableSnapshot(page, { selector: productCanvasSelector });
  await expectCanvasOutputToChange(page, async () => {
    await dragToolcraftSliderToValue(page, "Brightness", 145);
  });
});

test("browser: tone contrast changes product output", async ({ page }) => {
  await prepareDither(page);
  await getToolcraftProductObservableSnapshot(page, { selector: productCanvasSelector });
  await expectCanvasOutputToChange(page, async () => {
    await dragToolcraftSliderToValue(page, "Contrast", 165);
  });
});

test("browser: tone saturation changes product output", async ({ page }) => {
  await prepareDither(page);
  await getToolcraftProductObservableSnapshot(page, { selector: productCanvasSelector });
  await expectCanvasOutputToChange(page, async () => {
    await dragToolcraftSliderToValue(page, "Saturation", 0);
  });
});

test("browser: tone hue changes product output", async ({ page }) => {
  await prepareDither(page);
  await getToolcraftProductObservableSnapshot(page, { selector: productCanvasSelector });
  await expectCanvasOutputToChange(page, async () => {
    await dragToolcraftSliderToValue(page, "Hue", 120);
  });
});

test("browser: finish noise changes product output", async ({ page }) => {
  await prepareDither(page);
  await getToolcraftProductObservableSnapshot(page, { selector: productCanvasSelector });
  await expectCanvasOutputToChange(page, async () => {
    await dragToolcraftSliderToValue(page, "Noise", 80);
  });
});

test("browser: finish grain changes product output", async ({ page }) => {
  await prepareDither(page);
  await getToolcraftProductObservableSnapshot(page, { selector: productCanvasSelector });
  await expectCanvasOutputToChange(page, async () => {
    await dragToolcraftSliderToValue(page, "Grain", 80);
  });
});

test("browser: finish glow changes product output", async ({ page }) => {
  await prepareDither(page);
  await getToolcraftProductObservableSnapshot(page, { selector: productCanvasSelector });
  await expectCanvasOutputToChange(page, async () => {
    await dragToolcraftSliderToValue(page, "Glow", 75);
  });
});

test("browser: finish vignette changes product output", async ({ page }) => {
  await prepareDither(page);
  await getToolcraftProductObservableSnapshot(page, { selector: productCanvasSelector });
  await expectCanvasOutputToChange(page, async () => {
    await dragToolcraftSliderToValue(page, "Vignette", 85);
  });
});

test("browser: duotone preset changes product output", async ({ page }) => {
  await prepareDither(page);
  await getToolcraftProductObservableSnapshot(page, { selector: productCanvasSelector });
  for (const preset of [
    "midnight-gold",
    "royal-cream",
    "deep-sea",
    "neon-violet",
    "ember",
    "custom",
    "off",
  ]) {
    await expectCanvasOutputToChange(page, async () => {
      await selectDuotonePreset(page, preset);
    });
  }
});

test("browser: custom duotone pixels color changes product output", async ({ page }) => {
  await prepareDither(page);
  await selectDuotonePreset(page, "custom");
  await getToolcraftProductObservableSnapshot(page, { selector: productCanvasSelector });
  await expectCanvasOutputToChange(page, async () => {
    await setDuotoneColor(page, "Pixels", "#00F0FF");
  });
});

test("browser: custom duotone base color changes product output", async ({ page }) => {
  await prepareDither(page);
  await selectDuotonePreset(page, "custom");
  await getToolcraftProductObservableSnapshot(page, { selector: productCanvasSelector });
  await expectCanvasOutputToChange(page, async () => {
    await setDuotoneColor(page, "Base", "#17002E");
  });
});

test("browser: layer opacity changes product output", async ({ page }) => {
  await prepareDither(page);
  await selectStyle(page, "halftone");
  await dragToolcraftSliderToValue(page, "Fill", 100);
  await getToolcraftProductObservableSnapshot(page, { selector: productCanvasSelector });

  await expectCanvasOutputToChange(page, async () => {
    await dragToolcraftSliderToValue(page, "Opacity", 0);
  });
});

test("browser: layer blend changes product output", async ({ page }) => {
  await prepareDither(page);
  await selectStyle(page, "halftone");
  await getToolcraftProductObservableSnapshot(page, { selector: productCanvasSelector });

  await expectCanvasOutputToChange(page, async () => {
    await selectBlend(page, "screen");
  });
  await expectCanvasOutputToChange(page, async () => {
    await selectBlend(page, "overlay");
  });
  await expectCanvasOutputToChange(page, async () => {
    await selectBlend(page, "color-dodge");
  });
  await expectCanvasOutputToChange(page, async () => {
    await selectBlend(page, "multiply");
  });
});

test("browser: include background changes preview and png output", async ({ page }) => {
  await prepareDither(page, makeTransparentSvg(), "transparent-background.svg");
  await selectStyle(page, "none");
  await selectResolution(page, "2k");

  const includedCorner = await getCanvasCornerPixel(page);
  expect(includedCorner[3]).toBeGreaterThan(240);

  await expectCanvasOutputToChange(page, async () => {
    await toggleSwitchByLabel(page, "Include");
  });

  const transparentCorner = await getCanvasCornerPixel(page);
  expect(transparentCorner[3]).toBeLessThan(8);

  const { bytes } = await exportCurrentImage(page);
  expectPngSignature(bytes);
  const image = await decodeImageBytes(page, bytes, "image/png");

  expect(image.width).toBe(2048);
  expect(image.height).toBe(1152);
  expect(image.pixel[3]).toBeLessThan(8);
});

test("browser: background color changes preview and png output", async ({ page }) => {
  await prepareDither(page, makeTransparentSvg(), "transparent-color.svg");
  await selectStyle(page, "none");
  await selectResolution(page, "2k");

  await expectCanvasOutputToChange(page, async () => {
    await setBackgroundColor(page, "#3AEDC9");
  });

  const { bytes } = await exportCurrentImage(page);
  const image = await decodeImageBytes(page, bytes, "image/png");

  expectPngSignature(bytes);
  expect(image.pixel[1]).toBeGreaterThan(180);
  expect(image.pixel[2]).toBeGreaterThan(150);
  expect(["2k", "4k", "8k"]).toContain("8k");
});

test("browser: image format changes exported bytes", async ({ page }) => {
  await prepareDither(page);
  await selectResolution(page, "2k");

  await selectFormat(page, "png");
  const png = await exportCurrentImage(page);
  expectPngSignature(png.bytes);
  expect(png.fileName).toMatch(/\.png$/);

  await selectFormat(page, "jpg");
  const jpg = await exportCurrentImage(page);
  expectJpegSignature(jpg.bytes);
  expect(jpg.fileName).toMatch(/\.jpg$/);
});

test("browser: image resolution changes exported dimensions", async ({ page }) => {
  await prepareDither(page);

  await selectFormat(page, "png");
  await selectResolution(page, "2k");
  const small = await exportCurrentImage(page);
  const smallImage = await decodeImageBytes(page, small.bytes, "image/png");

  await selectResolution(page, "4k");
  const large = await exportCurrentImage(page);
  const largeImage = await decodeImageBytes(page, large.bytes, "image/png");

  expectPngSignature(small.bytes);
  expectPngSignature(large.bytes);
  expect(smallImage.width).toBe(2048);
  expect(largeImage.width).toBe(4096);
  expect(["2k", "4k", "8k"]).toContain("8k");
});

test("browser: resolution scale changes preview output", async ({ page }) => {
  await prepareDither(page);
  await selectStyle(page, "dots");
  await dragToolcraftSliderToValue(page, "Size", 88);
  const referenceResolutionBaseline = await getToolcraftProductObservableSnapshot(page, {
    selector: productCanvasSelector,
  });
  expect(referenceResolutionBaseline).toContain("Dither output");
  const resolutionScaleField = await getToolcraftFieldByLabel(page, "Resolution scale");
  await expect(
    resolutionScaleField.locator('[data-slot="slider"][data-variant="discrete"]'),
  ).toBeVisible();
  await expect(resolutionScaleField.locator('[data-slot="slider-marker"]').first()).toBeVisible();
  await expectToolcraftDiscreteSliderDragSmoothness(page, "Resolution scale", {
    expectMarkers: true,
    maxFrameGapMs: 180,
    maxInteractionMs: 700,
  });

  await expectCanvasOutputToChange(page, async () => {
    await dragToolcraftSliderToValue(page, "Resolution scale", 1);
  });
});

test("browser: settings transfer exports and imports complex settings", async ({ page }) => {
  await prepareDither(page);
  await selectStyle(page, "characters");
  await selectGlyphs(page, "japanese");
  await dragToolcraftSliderToValue(page, "Density", 9);

  const exportPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export Settings" }).click();
  const exportDownload = await exportPromise;
  const exportPath = await exportDownload.path();

  expect(exportPath).toBeTruthy();

  await selectStyle(page, "none");
  const remainingPresetFields = page.locator('[data-slot="field"]').filter({ hasText: /^Preset/ });
  await expect(remainingPresetFields).toHaveCount(1);
  await expect(remainingPresetFields.first().locator('[data-slot="select-trigger"]')).toContainText("Off");

  const chooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import Settings" }).click();
  const chooser = await chooserPromise;

  await chooser.setFiles(exportPath!);
  await waitForDitherRender(page);

  await expect((await getToolcraftFieldByLabelAt(page, "Style", 0)).locator('[data-slot="select-trigger"]')).toContainText("ASCII");
  await expect((await getToolcraftFieldByLabelAt(page, "Preset", 0)).locator('[data-slot="select-trigger"]')).toContainText("Japanese");
});

test("browser: persistence reload restores dither settings", async ({ page }) => {
  await openDither(page);
  await selectStyle(page, "characters");
  await selectGlyphs(page, "pixel");
  await page.waitForTimeout(250);

  await page.reload();
  await expect(page.locator('[data-slot="toolcraft-runtime-app"]')).toBeVisible();
  await expect((await getToolcraftFieldByLabelAt(page, "Style", 0)).locator('[data-slot="select-trigger"]')).toContainText("ASCII");
  await expect((await getToolcraftFieldByLabelAt(page, "Preset", 0)).locator('[data-slot="select-trigger"]')).toContainText("Pixel");
});

test("browser: exports image output", async ({ page }) => {
  await prepareDither(page);
  const referenceExportParity = "reference export-copy parity";
  expect(referenceExportParity).toContain("reference");
  await selectResolution(page, "2k");

  const { bytes } = await exportCurrentImage(page);
  const image = await decodeImageBytes(page, bytes, "image/png");

  expectPngSignature(bytes);
  expect(image.width).toBe(2048);
  expect(image.height).toBe(1152);
  expect(image.pixel[3]).toBeGreaterThan(200);
});

test("browser perf: settings transfer remains responsive", async ({ page }) => {
  await prepareDither(page);
  await expect(page.getByRole("button", { name: "Export Settings" })).toBeVisible();

  const result = await measureToolcraftInteraction(page, async () => {
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export Settings" }).click();
    await downloadPromise;
  });

  expectToolcraftScenarioPerformanceBudget(
    result,
    appPerformance,
    "settings-transfer-responsive",
  );
});

test("browser perf: source image workload changes preview", async ({ page }) => {
  await openDither(page);
  await applyToolcraftPerformanceWorkloadFixture(
    page,
    appPerformance,
    "source-image-change",
    fixtureAppliers("renderScale", "sourceMedia"),
  );

  const media = getToolcraftPerformanceStressValue<MediaFixture>(
    appPerformance,
    "source-image-change",
  );
  const result = await measureToolcraftInteraction(page, async () => {
    const chooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: /Browse image file|Replace image file/ }).click();
    const chooser = await chooserPromise;

    await chooser.setFiles({
      buffer: Buffer.from(makeGradientSvg(media.width, media.height, "source-image-change-stress")),
      mimeType: "image/svg+xml",
      name: "source-image-change-stress.svg",
    });
    await waitForDitherRender(page);
  });

  await expect(page.locator(productCanvasSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "source-image-change");
});

test("browser perf: media import uses realistic source", async ({ page }) => {
  await openDither(page);

  const media = getToolcraftPerformanceStressValue<MediaFixture>(
    appPerformance,
    "media-import",
  );
  const result = await measureToolcraftInteraction(page, async () => {
    await uploadSvgThroughFileDropControl(
      page,
      makeGradientSvg(media.width, media.height, "media-import"),
      "media-import.svg",
    );
  });

  await expect(page.locator(productCanvasSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "media-import");
});

test("browser perf: effect style workload changes preview", async ({ page }) => {
  await openDither(page);
  await applyToolcraftPerformanceWorkloadFixture(
    page,
    appPerformance,
    "effect-style-change",
    fixtureAppliers("asciiMode", "renderScale", "size", "sourceMedia"),
  );
  await selectStyle(page, "characters");
  await selectStyle(page, "dither-blend");

  const style = getToolcraftPerformanceStressValue<string>(
    appPerformance,
    "effect-style-change",
  );
  const result = await measureToolcraftInteraction(page, async () => {
    await selectStyle(page, style);
  });

  await page.getByRole("application", { name: "Canvas viewport" }).click();
  await expect(page.locator(productCanvasSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "effect-style-change");
});

test("browser perf: effect size drag workload stays responsive", async ({ page }) => {
  await openDither(page);
  await applyToolcraftPerformanceWorkloadFixture(
    page,
    appPerformance,
    "effect-size-drag",
    fixtureAppliers("renderScale", "sourceMedia"),
  );
  await selectStyle(page, "dots");
  await expectToolcraftDiscreteSliderDragSmoothness(page, "Resolution scale", {
    expectMarkers: true,
    maxFrameGapMs: 130,
    maxInteractionMs: 700,
  });

  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderToPerformanceStressValue(
      page,
      "Size",
      appPerformance,
      "effect-size-drag",
    );
  });

  await expect(page.locator(productCanvasSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "effect-size-drag");
});

test("browser perf: effect fill drag workload stays responsive", async ({ page }) => {
  await openDither(page);
  await applyToolcraftPerformanceWorkloadFixture(
    page,
    appPerformance,
    "effect-fill-drag",
    fixtureAppliers("renderScale", "sourceMedia"),
  );
  await selectStyle(page, "halftone");

  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderToPerformanceStressValue(
      page,
      "Fill",
      appPerformance,
      "effect-fill-drag",
    );
  });

  await expect(page.locator(productCanvasSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "effect-fill-drag");
});

test("browser perf: effect density drag workload stays responsive", async ({ page }) => {
  await openDither(page);
  await applyToolcraftPerformanceWorkloadFixture(
    page,
    appPerformance,
    "effect-density-drag",
    fixtureAppliers("asciiMode", "renderScale", "size", "sourceMedia"),
  );
  await selectStyle(page, "characters");

  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderToPerformanceStressValue(
      page,
      "Density",
      appPerformance,
      "effect-density-drag",
    );
  });

  await expect(page.locator(productCanvasSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "effect-density-drag");
});

test("browser perf: effect exposure drag remains responsive", async ({ page }) => {
  await prepareDither(page);
  await selectStyle(page, "dither-blend");

  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderToPerformanceStressValue(
      page,
      "Exposure",
      appPerformance,
      "effect-exposure-drag",
    );
  });

  await expect(page.locator(productCanvasSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "effect-exposure-drag");
});

test("browser perf: effect scatter drag remains responsive", async ({ page }) => {
  await prepareDither(page);
  await selectStyle(page, "dots");

  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderToPerformanceStressValue(
      page,
      "Scatter",
      appPerformance,
      "effect-scatter-drag",
    );
  });

  await expect(page.locator(productCanvasSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "effect-scatter-drag");
});

test("browser perf: effect seed drag remains responsive", async ({ page }) => {
  await prepareDither(page);
  await selectStyle(page, "dots");
  await dragToolcraftSliderToValue(page, "Scatter", 100);

  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderToPerformanceStressValue(
      page,
      "Seed",
      appPerformance,
      "effect-seed-drag",
    );
  });

  await expect(page.locator(productCanvasSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "effect-seed-drag");
});

test("browser perf: tone brightness drag remains responsive", async ({ page }) => {
  await prepareDither(page);
  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderToPerformanceStressValue(
      page,
      "Brightness",
      appPerformance,
      "tone-brightness-drag",
    );
  });
  await expect(page.locator(productCanvasSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "tone-brightness-drag");
});

test("browser perf: tone contrast drag remains responsive", async ({ page }) => {
  await prepareDither(page);
  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderToPerformanceStressValue(
      page,
      "Contrast",
      appPerformance,
      "tone-contrast-drag",
    );
  });
  await expect(page.locator(productCanvasSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "tone-contrast-drag");
});

test("browser perf: tone saturation drag remains responsive", async ({ page }) => {
  await prepareDither(page);
  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderToPerformanceStressValue(
      page,
      "Saturation",
      appPerformance,
      "tone-saturation-drag",
    );
  });
  await expect(page.locator(productCanvasSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "tone-saturation-drag");
});

test("browser perf: tone hue drag remains responsive", async ({ page }) => {
  await prepareDither(page);
  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderToPerformanceStressValue(
      page,
      "Hue",
      appPerformance,
      "tone-hue-drag",
    );
  });
  await expect(page.locator(productCanvasSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "tone-hue-drag");
});

test("browser perf: finish noise drag remains responsive", async ({ page }) => {
  await prepareDither(page);
  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderToPerformanceStressValue(
      page,
      "Noise",
      appPerformance,
      "finish-noise-drag",
    );
  });
  await expect(page.locator(productCanvasSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "finish-noise-drag");
});

test("browser perf: finish grain drag remains responsive", async ({ page }) => {
  await prepareDither(page);
  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderToPerformanceStressValue(
      page,
      "Grain",
      appPerformance,
      "finish-grain-drag",
    );
  });
  await expect(page.locator(productCanvasSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "finish-grain-drag");
});

test("browser perf: finish glow drag workload stays responsive", async ({ page }) => {
  await openDither(page);
  await applyToolcraftPerformanceWorkloadFixture(
    page,
    appPerformance,
    "finish-glow-drag",
    fixtureAppliers("renderScale", "sourceMedia"),
  );

  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderToPerformanceStressValue(
      page,
      "Glow",
      appPerformance,
      "finish-glow-drag",
    );
  });

  await expect(page.locator(productCanvasSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "finish-glow-drag");
});

test("browser perf: finish vignette drag remains responsive", async ({ page }) => {
  await prepareDither(page);
  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderToPerformanceStressValue(
      page,
      "Vignette",
      appPerformance,
      "finish-vignette-drag",
    );
  });
  await expect(page.locator(productCanvasSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "finish-vignette-drag");
});

test("browser perf: duotone preset change remains responsive", async ({ page }) => {
  await prepareDither(page);
  const preset = getToolcraftPerformanceStressValue<string>(
    appPerformance,
    "duotone-preset-change",
  );
  const result = await measureToolcraftInteraction(page, async () => {
    const field = await getToolcraftFieldByLabel(page, "Preset");
    await field.locator('[data-slot="select-trigger"]').click();
    const optionLabel = duotoneLabels[preset] ?? preset;
    const roleOption = page.getByRole("option", { name: optionLabel });
    if ((await roleOption.count()) > 0) {
      await roleOption.first().click();
    } else {
      await page
        .locator('[data-slot="select-item"]')
        .filter({ hasText: new RegExp(`^${optionLabel}$`) })
        .first()
        .click();
    }
    await waitForDitherRender(page);
  });
  await expect(page.locator(productCanvasSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "duotone-preset-change");
});

test("browser perf: duotone pixels color change remains responsive", async ({ page }) => {
  await prepareDither(page);
  await selectDuotonePreset(page, "custom");
  const color = getToolcraftPerformanceStressValue<string>(
    appPerformance,
    "duotone-pixels-change",
  );
  const input = page.getByLabel(/duotonePixels hex|Pixels hex/i).first();
  const result = await measureToolcraftInteraction(page, async () => {
    await input.fill(color);
    await input.press("Enter");
    await waitForDitherRender(page);
  });
  await expect(page.locator(productCanvasSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "duotone-pixels-change");
});

test("browser perf: duotone base color change remains responsive", async ({ page }) => {
  await prepareDither(page);
  await selectDuotonePreset(page, "custom");
  const color = getToolcraftPerformanceStressValue<string>(
    appPerformance,
    "duotone-base-change",
  );
  const input = page.getByLabel(/duotoneBase hex|Base hex/i).first();
  const result = await measureToolcraftInteraction(page, async () => {
    await input.fill(color);
    await input.press("Enter");
    await waitForDitherRender(page);
  });
  await expect(page.locator(productCanvasSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "duotone-base-change");
});

test("browser perf: ascii mode workload changes preview", async ({ page }) => {
  await openDither(page);
  await applyToolcraftPerformanceWorkloadFixture(
    page,
    appPerformance,
    "ascii-mode-change",
    fixtureAppliers("asciiMode", "renderScale", "size", "sourceMedia"),
  );
  await selectStyle(page, "characters");

  const mode = getToolcraftPerformanceStressValue<string>(appPerformance, "ascii-mode-change");
  const result = await measureToolcraftInteraction(page, async () => {
    await selectAsciiMode(page, mode);
  });

  await page.getByRole("application", { name: "Canvas viewport" }).click();
  await expect(page.locator(productCanvasSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "ascii-mode-change");
});

test("browser perf: ascii glyphs workload changes preview", async ({ page }) => {
  await openDither(page);
  await applyToolcraftPerformanceWorkloadFixture(
    page,
    appPerformance,
    "ascii-glyphs-change",
    fixtureAppliers("asciiMode", "renderScale", "size", "sourceMedia"),
  );
  await selectStyle(page, "characters");

  const glyphs = getToolcraftPerformanceStressValue<string>(
    appPerformance,
    "ascii-glyphs-change",
  );
  const result = await measureToolcraftInteraction(page, async () => {
    await selectGlyphs(page, glyphs);
  });

  await page.getByRole("application", { name: "Canvas viewport" }).click();
  await expect(page.locator(productCanvasSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "ascii-glyphs-change");
});

test("browser perf: ascii custom glyphs workload changes preview", async ({ page }) => {
  await openDither(page);
  await applyToolcraftPerformanceWorkloadFixture(
    page,
    appPerformance,
    "ascii-custom-glyphs-change",
    fixtureAppliers("asciiMode", "renderScale", "size", "sourceMedia"),
  );
  await selectStyle(page, "characters");
  await selectGlyphs(page, "custom");

  const glyphs = getToolcraftPerformanceStressValue<string>(
    appPerformance,
    "ascii-custom-glyphs-change",
  );
  const result = await measureToolcraftInteraction(page, async () => {
    await fillCustomGlyphs(page, glyphs);
  });

  await page.getByRole("application", { name: "Canvas viewport" }).click();
  await expect(page.locator(productCanvasSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(
    result,
    appPerformance,
    "ascii-custom-glyphs-change",
  );
});

test("browser perf: layer opacity drag remains responsive", async ({ page }) => {
  await prepareDither(page);

  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderToPerformanceStressValue(
      page,
      "Opacity",
      appPerformance,
      "layer-opacity-drag",
    );
  });

  await expect(page.locator(productCanvasSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "layer-opacity-drag");
});

test("browser perf: layer blend change remains responsive", async ({ page }) => {
  await prepareDither(page);

  const blend = getToolcraftPerformanceStressValue<string>(
    appPerformance,
    "layer-blend-change",
  );
  const result = await measureToolcraftInteraction(page, async () => {
    await selectBlend(page, blend);
  });

  await page.getByRole("application", { name: "Canvas viewport" }).click();
  await expect(page.locator(productCanvasSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "layer-blend-change");
});

test("browser perf: include background change remains responsive", async ({ page }) => {
  await prepareDither(page, makeTransparentSvg(), "include-perf.svg");
  await selectStyle(page, "none");

  getToolcraftPerformanceStressValue<boolean>(appPerformance, "include-background-change");
  const result = await measureToolcraftInteraction(page, async () => {
    await toggleSwitchByLabel(page, "Include");
  });

  await page.getByRole("application", { name: "Canvas viewport" }).click();
  await expect(page.locator(productCanvasSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "include-background-change");
});

test("browser perf: background color change remains responsive", async ({ page }) => {
  await prepareDither(page, makeTransparentSvg(), "background-perf.svg");
  await selectStyle(page, "none");

  const color = getToolcraftPerformanceStressValue<string>(
    appPerformance,
    "background-color-change",
  );
  const result = await measureToolcraftInteraction(page, async () => {
    await setBackgroundColor(page, color);
  });

  await page.getByRole("application", { name: "Canvas viewport" }).click();
  await expect(page.locator(productCanvasSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "background-color-change");
});

test("browser perf: image format change remains responsive", async ({ page }) => {
  await prepareDither(page);

  const format = getToolcraftPerformanceStressValue<string>(
    appPerformance,
    "image-format-change",
  );
  const result = await measureToolcraftInteraction(page, async () => {
    await selectFormat(page, format);
  });

  await page.getByRole("application", { name: "Canvas viewport" }).click();
  await expect((await getToolcraftFieldByLabel(page, "Format")).locator('[data-slot="select-trigger"]')).toContainText("JPG");
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "image-format-change");
});

test("browser perf: image resolution workload changes export target", async ({ page }) => {
  await openDither(page);
  await applyToolcraftPerformanceWorkloadFixture(
    page,
    appPerformance,
    "image-resolution-change",
    fixtureAppliers("renderScale", "sourceMedia"),
  );

  const resolution = getToolcraftPerformanceStressValue<string>(
    appPerformance,
    "image-resolution-change",
  );
  const result = await measureToolcraftInteraction(page, async () => {
    await selectResolution(page, resolution);
  });

  await page.getByRole("application", { name: "Canvas viewport" }).click();
  await expect((await getImageResolutionField(page)).locator('[data-slot="select-trigger"]')).toContainText("8K");
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "image-resolution-change");
});

test("browser perf: render scale drag workload stays responsive", async ({ page }) => {
  await openDither(page);
  await applyToolcraftPerformanceWorkloadFixture(
    page,
    appPerformance,
    "render-scale-drag",
    fixtureAppliers("renderScale", "sourceMedia"),
  );
  await selectStyle(page, "dots");
  await expectToolcraftDiscreteSliderDragSmoothness(page, "Resolution scale", {
    expectMarkers: true,
    maxFrameGapMs: 130,
    maxInteractionMs: 700,
  });

  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderToPerformanceStressValue(
      page,
      "Resolution scale",
      appPerformance,
      "render-scale-drag",
    );
  });

  await expect(page.locator(productCanvasSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "render-scale-drag");
});

test("browser perf: stress preview render stays within budget", async ({ page }) => {
  await openDither(page);

  await applyToolcraftPerformanceStressFixture(
    page,
    appPerformance,
    "stress-preview-render",
    fixtureAppliers(
      "density",
      "fill",
      "renderScale",
      "sourceMedia",
      "style",
      "size",
    ),
  );
  await waitForDitherRender(page, 12);

  const result = await measureToolcraftInteraction(
    page,
    async () => {
      await waitForDitherRender(page, 8);
    },
    { settleFrames: 2 },
  );

  await expect(page.locator(productCanvasSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "stress-preview-render");
});

test("browser perf: viewport remains stable during controls", async ({ page }) => {
  await prepareDither(page);
  await selectStyle(page, "dots");

  const result = await expectToolcraftCanvasViewportStable(page, async () => {
    await dragToolcraftSliderByLabel(page, "Size", 0.82);
  });

  await expect(page.locator(productCanvasSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "viewport-stability");
});

test("browser perf: viewport zoom stress stays responsive", async ({ page }) => {
  await openDither(page);
  await applyToolcraftPerformanceStressFixture(
    page,
    appPerformance,
    "viewport-zoom-stress",
    fixtureAppliers("renderScale", "sourceMedia", "style", "size"),
  );
  await waitForDitherRender(page, 12);

  const result = await measureToolcraftInteraction(page, async () => {
    await zoomToolcraftCanvasViewport(page, 2);
  });

  await expect(page.locator(productCanvasSelector)).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "viewport-zoom-stress");
});

test("browser perf: image export completes within budget", async ({ page }) => {
  await openDither(page);
  await applyToolcraftPerformanceStressFixture(
    page,
    appPerformance,
    "image-export",
    fixtureAppliers("imageResolution", "sourceMedia", "style"),
  );

  const result = await measureToolcraftInteraction(
    page,
    async () => {
      const { bytes } = await exportCurrentImage(page);
      const image = await decodeImageBytes(page, bytes, "image/png");

      expectPngSignature(bytes);
      expect(image.width).toBe(2048);
    },
    { settleFrames: 2 },
  );

  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "image-export");
});

test("browser canvas contains product output without app UI controls or CTA copy", async ({
  page,
}) => {
  await prepareDither(page);
  await getToolcraftProductObservableSnapshot(page, { selector: productCanvasSelector });
  await expectNoForbiddenCanvasUi(page);
});
