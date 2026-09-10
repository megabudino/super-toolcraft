import { expect, test, type Page } from "@playwright/test";

import {
  dragToolcraftSliderByLabel,
  expectToolcraftDiscreteSliderDragSmoothness,
  getToolcraftFieldByLabel,
  expectToolcraftCanvasBackingPixelsForRenderScale,
  zoomToolcraftCanvasViewport,
} from "./performance-helpers";
import {
  dragCanvasHandle,
  expectCanvasHandlesUseToolcraftVisualLanguage,
  expectExportExcludesCanvasHandles,
  expectNoForbiddenCanvasUi,
} from "./canvas-handle-helpers";
import {
  expectToolcraftProductObservableToChange,
  getToolcraftProductObservableSnapshot,
} from "./product-observable-helpers";

async function dragRangeSliderThumb(
  page: Page,
  label: string,
  thumbIndex: number,
  deltaX: number,
): Promise<void> {
  const field = await getToolcraftFieldByLabel(page, label);
  const thumb = field.locator('[data-slot="slider-thumb"]').nth(thumbIndex);
  await thumb.scrollIntoViewIfNeeded();
  const bounds = await thumb.boundingBox();
  expect(bounds).not.toBeNull();
  if (!bounds) return;
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    bounds.x + bounds.width / 2 + deltaX,
    bounds.y + bounds.height / 2,
    { steps: 10 },
  );
  await page.mouse.up();
}

type ExpressiveCanvasSample = {
  pixels: number[];
  snapshot: string;
};

async function getExpressiveCanvasSample(
  page: Page,
): Promise<ExpressiveCanvasSample> {
  await page.waitForTimeout(80);
  const pixels = await page
    .locator("canvas[data-toolcraft-product-output]")
    .evaluate((canvas: HTMLCanvasElement) => {
      const sample = document.createElement("canvas");
      sample.width = 320;
      sample.height = 180;
      const context = sample.getContext("2d");
      if (!context) throw new Error("Unable to sample mosaic output.");
      context.drawImage(canvas, 0, 0, sample.width, sample.height);
      return Array.from(
        context.getImageData(0, 0, sample.width, sample.height).data,
      );
    });

  return {
    pixels,
    snapshot: await getToolcraftProductObservableSnapshot(page),
  };
}

function expectExpressiveCanvasDifference(
  label: string,
  before: ExpressiveCanvasSample,
  after: ExpressiveCanvasSample,
  thresholds: {
    changedPercent?: number;
    meanDifference?: number;
  } = {},
): void {
  let changedPixels = 0;
  let differenceSum = 0;
  const pixelCount = before.pixels.length / 4;

  for (let index = 0; index < before.pixels.length; index += 4) {
    const difference =
      (Math.abs(before.pixels[index] - after.pixels[index]) +
        Math.abs(before.pixels[index + 1] - after.pixels[index + 1]) +
        Math.abs(before.pixels[index + 2] - after.pixels[index + 2])) /
      3;
    differenceSum += difference;
    if (difference > 8) changedPixels += 1;
  }

  const meanDifference = differenceSum / pixelCount;
  const changedPercent = (changedPixels / pixelCount) * 100;
  expect(
    JSON.parse(after.snapshot).canvases[0].hash,
    `${label} must change final product pixels`,
  ).not.toBe(JSON.parse(before.snapshot).canvases[0].hash);
  expect(
    meanDifference,
    `${label} min/max mean pixel difference`,
  ).toBeGreaterThanOrEqual(thresholds.meanDifference ?? 3);
  expect(
    changedPercent,
    `${label} min/max changed-pixel coverage`,
  ).toBeGreaterThanOrEqual(thresholds.changedPercent ?? 6.5);
}

async function resetProductSection(page: Page, section: string): Promise<void> {
  await page
    .getByRole("button", { name: `Reset ${section} section` })
    .click();
}

async function selectCustomPalette(page: Page): Promise<void> {
  const presetField = await getToolcraftFieldByLabel(page, "Preset");
  await presetField.getByRole("combobox").click();
  await page.getByText("Custom", { exact: true }).last().click();
}

async function expectExpressiveSliderRange(
  page: Page,
  section: string,
  label: string,
  highRatio?: number,
  thresholds?: {
    changedPercent?: number;
    meanDifference?: number;
  },
): Promise<void> {
  await resetProductSection(page, section);
  const slider = page.getByRole("slider", { name: label, exact: true });
  await slider.press("Home");
  const lowValue = await slider.inputValue();
  const before = await getExpressiveCanvasSample(page);

  if (highRatio === undefined) {
    await slider.press("End");
  } else {
    await dragToolcraftSliderByLabel(page, label, highRatio);
  }

  await expect(slider).not.toHaveValue(lowValue);
  expectExpressiveCanvasDifference(
    label,
    before,
    await getExpressiveCanvasSample(page),
    thresholds,
  );
}

test("browser: kinetic circle renders one procedural object", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("textbox", { name: "background hex" })).toHaveValue(
    "#241814",
  );

  const canvas = page.locator("canvas[data-toolcraft-product-output]");
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute("data-mosaic-figure-count", "1");
  await expect
    .poll(async () => Number(await canvas.getAttribute("data-mosaic-vertex-count")))
    .toBeGreaterThan(2_500);
  await expect(page.getByRole("button", { name: "Export Video" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Export PNG" })).toBeVisible();
});

test("browser: kinetic circle controls change rendered output", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Pause playback" }).click();

  const strength = page.getByRole("slider", { name: "Amount" });
  await dragToolcraftSliderByLabel(page, "Amount", 0.92);
  await expect(strength).not.toHaveValue("58");
  const strongSnapshot = JSON.parse(await getToolcraftProductObservableSnapshot(page));
  await expectToolcraftProductObservableToChange(page, async () => {
    await dragToolcraftSliderByLabel(page, "Amount", 0.15);
  });
  const softSnapshot = JSON.parse(await getToolcraftProductObservableSnapshot(page));
  expect(softSnapshot.canvases[0].hash).not.toBe(strongSnapshot.canvases[0].hash);

  await selectCustomPalette(page);
  const color = page.getByRole("textbox", { name: "Base navy hex" });
  await color.click();
  await color.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
  await color.pressSequentially("#6C35D9");
  await color.press("Enter");
  await expect(color).toHaveValue("#6C35D9");
  await expect(page.locator("canvas[data-toolcraft-product-output]")).toHaveAttribute(
    "data-mosaic-base-color",
    "#6C35D9",
  );

  const canvasWorld = page.locator("[data-toolcraft-canvas-world]");
  const before = await canvasWorld.getAttribute("style");
  const viewport = page.getByRole("application", { name: "Canvas viewport" });
  const viewportBox = await viewport.boundingBox();
  expect(viewportBox).not.toBeNull();
  if (!viewportBox) return;
  await page.mouse.move(viewportBox.x + 120, viewportBox.y + 48);
  await page.mouse.down();
  await page.mouse.move(viewportBox.x + 156, viewportBox.y + 66, { steps: 8 });
  await page.mouse.up();
  await zoomToolcraftCanvasViewport(page, 1);
  await expect(canvasWorld).not.toHaveAttribute("style", before ?? "");
});

test("browser: dot field renders flat discs without pseudo-volume control", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Pause playback" }).click();
  await expect(page.getByText("3D beads", { exact: true })).toHaveCount(0);

  const canvas = page.locator("canvas[data-toolcraft-product-output]");
  await expect(canvas).toBeVisible();
  expect(await canvas.getAttribute("data-mosaic-pseudo-volume")).toBeNull();

  const { pixels } = await getExpressiveCanvasSample(page);
  const background = pixels.slice(0, 3);
  let foregroundPixels = 0;
  for (let index = 0; index < pixels.length; index += 4) {
    if (
      Math.max(
        Math.abs(pixels[index] - background[0]),
        Math.abs(pixels[index + 1] - background[1]),
        Math.abs(pixels[index + 2] - background[2]),
      ) > 12
    ) {
      foregroundPixels += 1;
    }
  }
  expect(foregroundPixels).toBeGreaterThan(100);
});

test("browser: kinetic circle shape forms change one object", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Pause playback" }).click();
  const canvas = page.locator("canvas[data-toolcraft-product-output]");
  const formField = await getToolcraftFieldByLabel(page, "Form");
  const formHashes = new Set<string>();

  for (const [label, value] of [
    ["Circle", "circle"],
    ["Flower", "flower"],
    ["Pinch", "pinch"],
    ["Vortex", "vortex"],
  ] as const) {
    await formField.getByRole("combobox").click();
    await page.getByText(label, { exact: true }).last().click();
    await expect(canvas).toHaveAttribute("data-mosaic-shape-form", value);
    const snapshot = JSON.parse(await getToolcraftProductObservableSnapshot(page));
    formHashes.add(snapshot.canvases[0].hash);
    await expect(canvas).toHaveAttribute("data-mosaic-figure-count", "1");
  }

  expect(formHashes.size).toBe(4);
});

test("browser: kinetic circle shape parameters change output", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Pause playback" }).click();
  const formField = await getToolcraftFieldByLabel(page, "Form");
  await formField.getByRole("combobox").click();
  await page.getByText("Flower", { exact: true }).last().click();

  for (const [label, ratio] of [
    ["Bend", 0.82],
    ["Depth", 0.78],
    ["Contour angle", 0.63],
  ] as const) {
    await expectToolcraftProductObservableToChange(page, async () => {
      await dragToolcraftSliderByLabel(page, label, ratio);
    });
  }
});

test("browser: kinetic circle volume controls build 3D depth", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Pause playback" }).click();
  const canvas = page.locator("canvas[data-toolcraft-product-output]");
  const initialRange = await canvas.getAttribute("data-mosaic-radius-range");

  await test.step("rangeSlider.lower", async () => {
    await expectToolcraftProductObservableToChange(page, async () => {
      await dragRangeSliderThumb(page, "Ring radius", 0, 46);
    });
  });
  await expect(canvas).not.toHaveAttribute(
    "data-mosaic-radius-range",
    initialRange ?? "",
  );

  const afterLower = await canvas.getAttribute("data-mosaic-radius-range");
  await test.step("rangeSlider.upper", async () => {
    await expectToolcraftProductObservableToChange(page, async () => {
      await dragRangeSliderThumb(page, "Ring radius", 1, -38);
    });
  });
  await expect(canvas).not.toHaveAttribute(
    "data-mosaic-radius-range",
    afterLower ?? "",
  );

  for (const [label, ratio, attribute] of [
    ["Z spread", 0.9, "data-mosaic-z-spread"],
    ["Z twist", 0.16, "data-mosaic-z-twist"],
    ["Perspective", 0.92, "data-mosaic-perspective"],
  ] as const) {
    const before = await canvas.getAttribute(attribute);
    await expectToolcraftProductObservableToChange(page, async () => {
      await dragToolcraftSliderByLabel(page, label, ratio);
    });
    await expect(canvas).not.toHaveAttribute(attribute, before ?? "");
  }
});

test("browser: kinetic circle motion types change animation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Pause playback" }).click();
  await dragToolcraftSliderByLabel(page, "Amount", 0.86);
  const canvas = page.locator("canvas[data-toolcraft-product-output]");
  const typeField = await getToolcraftFieldByLabel(page, "Type");
  const motionHashes = new Set<string>();

  for (const [label, value] of [
    ["Ripple", "ripple"],
    ["Breathe", "breathe"],
    ["Twist", "twist"],
    ["Orbit", "orbit"],
    ["Flow", "flow"],
    ["Sweep", "sweep"],
    ["Pulse", "pulse"],
  ] as const) {
    await typeField.getByRole("combobox").click();
    await page.getByText(label, { exact: true }).last().click();
    await expect(canvas).toHaveAttribute("data-mosaic-motion-type", value);
    const snapshot = JSON.parse(await getToolcraftProductObservableSnapshot(page));
    motionHashes.add(snapshot.canvases[0].hash);
  }

  expect(motionHashes.size).toBe(7);
});

test("browser: kinetic circle dynamics controls change volumetric motion", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Pause playback" }).click();
  const canvas = page.locator("canvas[data-toolcraft-product-output]");

  for (const [label, ratio, attribute] of [
    ["Falloff", 0.72, null],
    ["Drift", 0.84, null],
    ["Z motion", 0.93, "data-mosaic-z-motion"],
    ["Core opening", 0.9, "data-mosaic-core-opening"],
    ["Ball weight", 0.86, "data-mosaic-ball-weight"],
  ] as const) {
    const before = attribute ? await canvas.getAttribute(attribute) : null;
    await expectToolcraftProductObservableToChange(page, async () => {
      await dragToolcraftSliderByLabel(page, label, ratio);
    });
    if (attribute) {
      await expect(canvas).not.toHaveAttribute(attribute, before ?? "");
    }
  }
});

test("browser: every kinetic circle slider has an expressive independent range", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.goto("/");
  await page.getByRole("button", { name: "Pause playback" }).click();
  const initialProductObservable =
    await getToolcraftProductObservableSnapshot(page);
  await page.getByRole("slider", { name: "Resolution scale" }).press("Home");
  const timelineField = await getToolcraftFieldByLabel(page, "Timeline");
  await timelineField.locator('[data-slot="switch"]').click();
  const playback = page.getByRole("slider", { name: "Playback position" });
  await expect(playback).toBeVisible();
  const playbackBounds = await playback.boundingBox();
  expect(playbackBounds).not.toBeNull();
  if (!playbackBounds) return;
  await page.mouse.click(
    playbackBounds.x + playbackBounds.width * 0.19,
    playbackBounds.y + playbackBounds.height / 2,
  );

  for (const [label, highRatio] of [
    ["Bend", undefined],
    ["Contour angle", 0.25],
    ["Depth", undefined],
    ["Repeats", undefined],
  ] as const) {
    await expectExpressiveSliderRange(page, "Shape", label, highRatio);
  }

  for (const thumbIndex of [0, 1] as const) {
    await test.step(
      thumbIndex === 0 ? "rangeSlider.lower" : "rangeSlider.upper",
      async () => {
        await resetProductSection(page, "Volume");
        const thumbs = page
          .locator('[data-slot="field"]')
          .filter({ hasText: "Ring radius" })
          .first()
          .locator('input[type="range"]');
        const thumb = thumbs.nth(thumbIndex);
        await thumb.press("Home");
        const lowValue = await thumb.inputValue();
        const before = await getExpressiveCanvasSample(page);
        await thumb.press("End");
        await expect(thumb).not.toHaveValue(lowValue);
        expectExpressiveCanvasDifference(
          thumbIndex === 0 ? "Ring radius lower" : "Ring radius upper",
          before,
          await getExpressiveCanvasSample(page),
          thumbIndex === 0 ? { changedPercent: 6 } : undefined,
        );
      },
    );
  }

  for (const label of ["Z spread", "Z bend", "Z twist", "Perspective"]) {
    await expectExpressiveSliderRange(page, "Volume", label);
  }

  for (const label of ["Density", "Dot size", "Seed"]) {
    await expectExpressiveSliderRange(page, "Dot Field", label);
  }

  for (const label of ["Taper", "Glow"]) {
    await expectExpressiveSliderRange(page, "Dot Style", label);
  }

  await expectExpressiveSliderRange(page, "Coloring", "Highlight");
  await expectExpressiveSliderRange(page, "Coloring", "Accents", undefined, {
    changedPercent: 1.2,
    meanDifference: 0.5,
  });

  for (const label of ["Speed", "Amount", "Frequency"]) {
    await expectExpressiveSliderRange(page, "Motion", label);
  }

  for (const label of [
    "Z motion",
    "Core opening",
    "Falloff",
    "Drift",
    "Ball weight",
  ]) {
    await expectExpressiveSliderRange(page, "Dynamics", label);
  }
  await expectExpressiveSliderRange(page, "Dynamics", "Sparkle", undefined, {
    changedPercent: 3,
    meanDifference: 1.5,
  });

  expect(await getToolcraftProductObservableSnapshot(page)).not.toBe(
    initialProductObservable,
  );
});

test("browser: kinetic circle layouts restructure the dot field", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Pause playback" }).click();
  const canvas = page.locator("canvas[data-toolcraft-product-output]");
  const layoutField = await getToolcraftFieldByLabel(page, "Layout");
  const layoutHashes = new Set<string>();
  const selectLayout = async (label: string, value: string) => {
    await layoutField.getByRole("combobox").click();
    await page.getByText(label, { exact: true }).last().click();
    await expect(canvas).toHaveAttribute("data-mosaic-layout", value);
  };

  for (const [label, value] of [
    ["Rings", "rings"],
    ["Sunflower", "phyllotaxis"],
    ["Spiral arms", "spiral"],
    ["Arcs", "arcs"],
  ] as const) {
    await selectLayout(label, value);
    const snapshot = JSON.parse(await getToolcraftProductObservableSnapshot(page));
    layoutHashes.add(snapshot.canvases[0].hash);
    await expect(canvas).toHaveAttribute("data-mosaic-figure-count", "1");
    await expect(page.getByRole("slider", { name: "Arms" })).toHaveCount(
      value === "spiral" ? 1 : 0,
    );
    await expect(page.getByRole("slider", { name: "Arc coverage" })).toHaveCount(
      value === "arcs" ? 1 : 0,
    );
  }

  expect(layoutHashes.size).toBe(4);

  await selectLayout("Spiral arms", "spiral");
  const armsField = await getToolcraftFieldByLabel(page, "Arms");
  await expect(
    armsField.locator('[data-slot="slider"][data-variant="discrete"]'),
  ).toBeVisible();
  await expect(armsField.locator('[data-slot="slider-marker"]').first()).toBeVisible();
  await expectToolcraftProductObservableToChange(page, async () => {
    await expectToolcraftDiscreteSliderDragSmoothness(page, "Arms", {
      maxFrameGapMs: 120,
      maxInteractionMs: 1_500,
    });
  });
  const armsValue = await page.getByRole("slider", { name: "Arms" }).inputValue();
  await selectLayout("Rings", "rings");
  await selectLayout("Spiral arms", "spiral");
  await expect(page.getByRole("slider", { name: "Arms" })).toHaveValue(armsValue);

  await selectLayout("Arcs", "arcs");
  const denseVertexCount = Number(await canvas.getAttribute("data-mosaic-vertex-count"));
  await expectToolcraftProductObservableToChange(page, async () => {
    await page.getByRole("slider", { name: "Arc coverage" }).press("Home");
  });
  await expect
    .poll(async () => Number(await canvas.getAttribute("data-mosaic-vertex-count")))
    .toBeLessThan(denseVertexCount);
});

test("browser: kinetic circle color modes and presets recolor the field", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Pause playback" }).click();
  const canvas = page.locator("canvas[data-toolcraft-product-output]");
  const modeField = await getToolcraftFieldByLabel(page, "Mode");
  const modeHashes = new Set<string>();

  for (const [label, value] of [
    ["Bands", "bands"],
    ["Gradient", "gradient"],
    ["Sectors", "sectors"],
    ["Spiral", "spiral"],
    ["Depth", "depth"],
    ["Patches", "patches"],
    ["Duotone", "duotone"],
  ] as const) {
    await modeField.getByRole("combobox").click();
    await page.getByText(label, { exact: true }).last().click();
    await expect(canvas).toHaveAttribute("data-mosaic-color-mode", value);
    const snapshot = JSON.parse(await getToolcraftProductObservableSnapshot(page));
    modeHashes.add(snapshot.canvases[0].hash);
  }

  expect(modeHashes.size).toBe(7);
  await modeField.getByRole("combobox").click();
  await page.getByText("Bands", { exact: true }).last().click();

  const presetField = await getToolcraftFieldByLabel(page, "Preset");
  await presetField.getByRole("combobox").click();
  await page.getByText("Custom", { exact: true }).last().click();
  const baseColor = page.getByRole("textbox", { name: "Base navy hex" });
  await expect(baseColor).toBeVisible();
  const presetHashes = new Set<string>();

  for (const [label, value] of [
    ["Neon", "neon"],
    ["Ember", "ember"],
    ["Pastel candy", "candy"],
    ["Sunset", "sunset"],
    ["Deep sea", "sea"],
    ["Forest", "forest"],
    ["Ultraviolet", "ultraviolet"],
    ["Monochrome", "mono"],
  ] as const) {
    await presetField.getByRole("combobox").click();
    await page.getByText(label, { exact: true }).last().click();
    await expect(canvas).toHaveAttribute("data-mosaic-palette-preset", value);
    await expect(baseColor).toHaveCount(0);
    const snapshot = JSON.parse(await getToolcraftProductObservableSnapshot(page));
    presetHashes.add(snapshot.canvases[0].hash);
  }

  expect(presetHashes.size).toBe(8);

  await presetField.getByRole("combobox").click();
  await page.getByText("Custom", { exact: true }).last().click();
  await expect(canvas).toHaveAttribute("data-mosaic-palette-preset", "custom");
  await expect(page.getByRole("textbox", { name: "Base navy hex" })).toHaveValue(
    "#173A78",
  );
});

test("browser: kinetic circle dot style changes point rendering", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Pause playback" }).click();
  const canvas = page.locator("canvas[data-toolcraft-product-output]");
  const shapeField = await getToolcraftFieldByLabel(page, "Dot shape");
  const shapeHashes = new Set<string>();
  const vertexCount = await canvas.getAttribute("data-mosaic-vertex-count");

  for (const [label, value] of [
    ["Disc", "disc"],
    ["Ring", "ring"],
    ["Square", "square"],
    ["Diamond", "diamond"],
    ["Streak", "streak"],
  ] as const) {
    await shapeField.getByRole("combobox").click();
    await page.getByText(label, { exact: true }).last().click();
    await expect(canvas).toHaveAttribute("data-mosaic-dot-shape", value);
    await expect(canvas).toHaveAttribute(
      "data-mosaic-vertex-count",
      vertexCount ?? "",
    );
    const snapshot = JSON.parse(await getToolcraftProductObservableSnapshot(page));
    shapeHashes.add(snapshot.canvases[0].hash);
  }

  expect(shapeHashes.size).toBe(5);

  await expectToolcraftProductObservableToChange(page, async () => {
    await dragToolcraftSliderByLabel(page, "Glow", 0.85);
  });
  await expect(canvas).not.toHaveAttribute("data-mosaic-glow", "0");
  await expectToolcraftProductObservableToChange(page, async () => {
    await dragToolcraftSliderByLabel(page, "Taper", 0.92);
  });
  await expect(canvas).not.toHaveAttribute("data-mosaic-taper", "0");
});

test("browser: kinetic circle variations randomize the look", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Pause playback" }).click();
  const canvas = page.locator("canvas[data-toolcraft-product-output]");
  await selectCustomPalette(page);
  await expect(canvas).toHaveAttribute("data-mosaic-palette-preset", "custom");

  await expectToolcraftProductObservableToChange(page, async () => {
    await page.getByRole("button", { name: "Randomize look" }).click();
  });
  await expect(canvas).not.toHaveAttribute("data-mosaic-palette-preset", "custom");
  await expect(canvas).toHaveAttribute("data-mosaic-figure-count", "1");

  await page.getByRole("button", { name: "Undo" }).click();
  await expect(canvas).toHaveAttribute("data-mosaic-palette-preset", "custom");

  const layoutBefore = await canvas.getAttribute("data-mosaic-layout");
  const formBefore = await canvas.getAttribute("data-mosaic-shape-form");
  await expectToolcraftProductObservableToChange(page, async () => {
    await page.getByRole("button", { name: "Randomize colors" }).click();
  });
  await expect(canvas).not.toHaveAttribute("data-mosaic-palette-preset", "custom");
  await expect(canvas).toHaveAttribute("data-mosaic-layout", layoutBefore ?? "rings");
  await expect(canvas).toHaveAttribute(
    "data-mosaic-shape-form",
    formBefore ?? "circle",
  );
});

test("browser: kinetic circle discrete controls are smooth", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Pause playback" }).click();

  await expectToolcraftProductObservableToChange(page, async () => {
    await expectToolcraftDiscreteSliderDragSmoothness(page, "Seed", {
      maxFrameGapMs: 160,
      maxInteractionMs: 1_500,
    });
  });
  const seedField = await getToolcraftFieldByLabel(page, "Seed");
  await expect(seedField.locator('[data-slot="slider"][data-variant="discrete"]')).toBeVisible();
  await expect(seedField.locator('[data-slot="slider-marker"]').first()).toBeVisible();

  for (const label of ["Repeats", "Speed"]) {
    await expectToolcraftProductObservableToChange(page, async () => {
      await expectToolcraftDiscreteSliderDragSmoothness(page, label, {
        maxFrameGapMs: 160,
        maxInteractionMs: 1_500,
      });
    });
    const field = await getToolcraftFieldByLabel(page, label);
    await expect(field.locator('[data-slot="slider"][data-variant="discrete"]')).toBeVisible();
    await expect(field.locator('[data-slot="slider-marker"]').first()).toBeVisible();
  }
});

test("browser: kinetic circle resolution scale is discrete and smooth", async ({ page }) => {
  await page.goto("/");
  await expectToolcraftDiscreteSliderDragSmoothness(page, "Resolution scale", {
    maxFrameGapMs: 250,
    maxInteractionMs: 7_000,
  });
  const scaleField = await getToolcraftFieldByLabel(page, "Resolution scale");
  await expect(scaleField.locator('[data-slot="slider"][data-variant="discrete"]')).toBeVisible();
  await expect(scaleField.locator('[data-slot="slider-marker"]').first()).toBeVisible();
  await expectToolcraftProductObservableToChange(page, async () => {
    await page.getByRole("slider", { name: "Resolution scale" }).press("End");
  });
  await expectToolcraftCanvasBackingPixelsForRenderScale(
    page,
    "canvas[data-toolcraft-product-output]",
    2,
  );
});

test("browser: orientation gizmo and direct object drag rotate one 3D relief", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Pause playback" }).click();
  const canvas = page.locator("canvas[data-toolcraft-product-output]");
  const gizmo = page.getByTestId("toolcraft-orientation-gizmo");
  await expect(gizmo).toBeVisible();
  await expectNoForbiddenCanvasUi(page);
  await expectCanvasHandlesUseToolcraftVisualLanguage(page);

  const initialPose = await canvas.getAttribute("data-mosaic-orientation");
  const initialPixels = await getToolcraftProductObservableSnapshot(page);
  const gizmoBoxBefore = await gizmo.boundingBox();
  await page.getByRole("slider", { name: "Resolution scale" }).press("End");
  await expectToolcraftCanvasBackingPixelsForRenderScale(
    page,
    "canvas[data-toolcraft-product-output]",
    2,
  );
  await dragCanvasHandle(page, "toolcraft-orientation-gizmo", {
    x: 15,
    y: -13,
  });
  await expect(canvas).toHaveAttribute(
    "data-mosaic-interaction-quality",
    "full",
  );
  await expectToolcraftCanvasBackingPixelsForRenderScale(
    page,
    "canvas[data-toolcraft-product-output]",
    2,
  );
  await expect(canvas).not.toHaveAttribute(
    "data-mosaic-orientation",
    initialPose ?? "",
  );
  expect(await getToolcraftProductObservableSnapshot(page)).not.toBe(
    initialPixels,
  );

  const canvasBox = await canvas.boundingBox();
  expect(canvasBox).not.toBeNull();
  if (!canvasBox) return;
  const poseBeforeDirectDrag = await canvas.getAttribute(
    "data-mosaic-orientation",
  );
  await page.mouse.move(
    canvasBox.x + canvasBox.width * 0.62,
    canvasBox.y + canvasBox.height * 0.5,
  );
  await page.mouse.down();
  await page.mouse.move(
    canvasBox.x + canvasBox.width * 0.68,
    canvasBox.y + canvasBox.height * 0.42,
    { steps: 8 },
  );
  await page.mouse.up();
  await expect(canvas).not.toHaveAttribute(
    "data-mosaic-orientation",
    poseBeforeDirectDrag ?? "",
  );

  const poseBeforeBackgroundPan = await canvas.getAttribute(
    "data-mosaic-orientation",
  );
  const world = page.locator("[data-toolcraft-canvas-world]");
  const viewport = page.locator('[data-slot="toolcraft-runtime-canvas"]');
  const viewportBox = await viewport.boundingBox();
  expect(viewportBox).not.toBeNull();
  if (!viewportBox) return;
  const worldStyleBefore = await world.getAttribute("style");
  await page.mouse.move(
    viewportBox.x + 120,
    viewportBox.y + 48,
  );
  await page.mouse.down();
  await page.mouse.move(
    viewportBox.x + 154,
    viewportBox.y + 67,
    { steps: 6 },
  );
  await page.mouse.up();
  await expect(world).not.toHaveAttribute("style", worldStyleBefore ?? "");
  await expect(canvas).toHaveAttribute(
    "data-mosaic-orientation",
    poseBeforeBackgroundPan ?? "",
  );

  await zoomToolcraftCanvasViewport(page, 1);
  const gizmoBoxAfter = await gizmo.boundingBox();
  expect(gizmoBoxAfter?.x).toBeCloseTo(gizmoBoxBefore?.x ?? 0, 0);
  expect(gizmoBoxAfter?.y).toBeCloseTo(gizmoBoxBefore?.y ?? 0, 0);
});

test("browser: exported mosaic follows orientation without editor gizmo pixels", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Pause playback" }).click();
  await expectToolcraftProductObservableToChange(page, async () => {
    await dragCanvasHandle(page, "toolcraft-orientation-gizmo", { x: 15, y: -13 });
  });
  const resolution = page
    .locator('[data-slot="field"]')
    .filter({
      has: page
        .locator('[data-slot="field-label"]')
        .filter({ hasText: /^\s*Resolution\s*$/ }),
    })
    .first();
  await expect(resolution).toBeVisible();
  await resolution.getByRole("combobox").click();
  await page.getByText("2K", { exact: true }).last().click();
  await expectExportExcludesCanvasHandles(page, async () => {
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export PNG" }).click();
    await download;
  });
});

test("browser: Infinity canvas preserves finite size, history, and persistence", async ({
  page,
}) => {
  await page.goto("/");
  const infinityField = await getToolcraftFieldByLabel(
    page,
    "Infinity canvas",
  );
  const infinitySwitch = infinityField.locator('[data-slot="switch"]');
  const canvasSurface = page.locator("[data-toolcraft-editable-canvas]");
  const widthField = await getToolcraftFieldByLabel(page, "Canvas width");

  await expect(widthField.locator('input[data-slot="input"]')).toBeVisible();
  await infinitySwitch.click();
  await expect(canvasSurface).toHaveAttribute(
    "data-toolcraft-canvas-mode",
    "infinite",
  );
  await expect(
    page.getByText("Canvas width", { exact: true }),
  ).not.toBeVisible();
  await expect(
    page.getByText("Canvas height", { exact: true }),
  ).not.toBeVisible();
  await expect(
    page.getByText("Aspect ratio", { exact: true }),
  ).not.toBeVisible();

  await page.getByRole("button", { name: "Undo" }).click();
  await expect(canvasSurface).toHaveAttribute(
    "data-toolcraft-canvas-mode",
    "finite",
  );
  await page.getByRole("button", { name: "Redo" }).click();
  await expect(canvasSurface).toHaveAttribute(
    "data-toolcraft-canvas-mode",
    "infinite",
  );

  await page.waitForTimeout(180);
  await page.reload();
  await expect(canvasSurface).toHaveAttribute(
    "data-toolcraft-canvas-mode",
    "infinite",
  );

  const restoredInfinityField = await getToolcraftFieldByLabel(
    page,
    "Infinity canvas",
  );
  await restoredInfinityField.locator('[data-slot="switch"]').click();
  await expect(canvasSurface).toHaveAttribute(
    "data-toolcraft-canvas-mode",
    "finite",
  );
  const restoredWidthField = await getToolcraftFieldByLabel(
    page,
    "Canvas width",
  );
  const restoredHeightField = await getToolcraftFieldByLabel(
    page,
    "Canvas height",
  );
  await expect(
    restoredWidthField.locator('input[data-slot="input"]'),
  ).toHaveValue("1920");
  await expect(
    restoredHeightField.locator('input[data-slot="input"]'),
  ).toHaveValue("1080");
});

test("browser: kinetic circle timeline playback is seamless and duration aware", async ({
  page,
}) => {
  await page.goto("/");
  const canvas = page.locator("canvas[data-toolcraft-product-output]");
  await page.getByRole("button", { name: "Pause playback" }).click();
  const timelineField = await getToolcraftFieldByLabel(page, "Timeline");
  await timelineField.locator('[data-slot="switch"]').click();
  const playback = page.getByRole("slider", { name: "Playback position" });
  await expect(playback).toBeVisible();
  await playback.press("Home");
  const firstFrame = await getToolcraftProductObservableSnapshot(page);
  const pausedPhase = await canvas.getAttribute("data-mosaic-phase");
  await page.waitForTimeout(120);
  await expect(canvas).toHaveAttribute("data-mosaic-phase", pausedPhase ?? "");

  await page.getByRole("button", { name: "Play playback" }).click();
  await expect
    .poll(async () => canvas.getAttribute("data-mosaic-phase"))
    .not.toBe(pausedPhase);

  await page.getByRole("button", { name: "Disable loop" }).click();
  await page.getByRole("button", { name: "Enable loop" }).click();
  await page.getByRole("button", { name: "Pause playback" }).click();

  await playback.press("Home");
  const wrappedFirstFrame = await getToolcraftProductObservableSnapshot(page);
  expect(wrappedFirstFrame).toBe(firstFrame);
});

test("browser: kinetic circle canvas hover keeps animation playing", async ({ page }) => {
  await page.goto("/");
  const viewport = page.locator('[data-slot="toolcraft-runtime-canvas"]');
  const viewportBox = await viewport.boundingBox();
  expect(viewportBox).not.toBeNull();
  if (!viewportBox) return;

  const startX = viewportBox.x + viewportBox.width * 0.38;
  const startY = viewportBox.y + viewportBox.height * 0.42;
  await page.mouse.move(startX, startY);
  await page.waitForTimeout(140);
  const before = JSON.parse(await getToolcraftProductObservableSnapshot(page));

  for (let step = 0; step < 10; step += 1) {
    await page.mouse.move(startX + step * 5, startY + (step % 2 === 0 ? 12 : -12));
    await page.waitForTimeout(35);
  }

  const duringHover = JSON.parse(await getToolcraftProductObservableSnapshot(page));
  expect(duringHover.canvases[0].hash).not.toBe(before.canvases[0].hash);
  await expect(page.getByRole("button", { name: "Pause playback" })).toBeVisible();
});

test("browser: kinetic circle restores settings after reload", async ({ page }) => {
  await page.goto("/");
  const formField = await getToolcraftFieldByLabel(page, "Form");
  await formField.getByRole("combobox").click();
  await page.getByText("Vortex", { exact: true }).last().click();
  const strength = page.getByRole("slider", { name: "Amount" });
  await dragToolcraftSliderByLabel(page, "Amount", 0.84);
  const persistedValue = await strength.inputValue();
  await dragToolcraftSliderByLabel(page, "Ball weight", 0.79);
  const persistedBallWeight = await page
    .getByRole("slider", { name: "Ball weight" })
    .inputValue();

  await page.waitForTimeout(180);
  await page.reload();

  await expect(page.getByRole("slider", { name: "Amount" })).toHaveValue(persistedValue);
  await expect(page.getByRole("slider", { name: "Ball weight" })).toHaveValue(
    persistedBallWeight,
  );
  await expect(page.locator("canvas[data-toolcraft-product-output]")).toHaveAttribute(
    "data-mosaic-shape-form",
    "vortex",
  );
});

test("browser: kinetic circle exports image and video", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Pause playback" }).click();

  const imageFormat = page.getByRole("combobox", { name: "PNG" });
  await imageFormat.click();
  await page.getByText("JPG", { exact: true }).click();
  await page.getByRole("combobox", { name: "JPG" }).click();
  await page.getByText("PNG", { exact: true }).click();

  const imageResolution = page.getByRole("combobox", { name: "4K" });
  await imageResolution.click();
  await page.getByText("2K", { exact: true }).click();
  const pngDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export PNG" }).click();
  const pngDownload = await pngDownloadPromise;
  expect(pngDownload.suggestedFilename()).toBe("kinetic-circle.png");

  await expect(page.getByRole("button", { name: "Export Video" })).toBeEnabled();
  await expect(page.getByRole("combobox", { name: "MP4" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Current" })).toBeVisible();
});
