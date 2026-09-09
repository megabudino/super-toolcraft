import { expect, test, type Page } from "@playwright/test";
import { dragCanvasHandle } from "./canvas-handle-helpers";

import { appPerformance } from "../src/app/app-performance";
import {
  applyToolcraftPerformanceStressFixture,
  applyToolcraftPerformanceWorkloadFixture,
  dragToolcraftCanvasViewport,
  dragToolcraftSliderByLabel,
  dragToolcraftSliderToPerformanceStressValue,
  dragToolcraftSliderToValue,
  expectToolcraftCanvasBackingPixelsForRenderScale,
  expectToolcraftCanvasViewportStable,
  expectToolcraftDiscreteSliderDragSmoothness,
  expectToolcraftScenarioPerformanceBudget,
  getToolcraftFieldByLabel,
  getToolcraftPerformanceStressValue,
  getToolcraftPerformanceWorkloadValue,
  measureToolcraftAnimationFrames,
  measureToolcraftInteraction,
  waitForToolcraftAnimationFrames,
  zoomToolcraftCanvasViewport,
} from "./performance-helpers";

async function setRingRadiusRange(
  page: Page,
  value: unknown,
): Promise<void> {
  const range = Array.isArray(value) ? value.map(Number) : [0, 100];
  const field = await getToolcraftFieldByLabel(page, "Ring radius");
  await field
    .getByRole("button", { name: "Edit Ring radius value" })
    .click();
  const editor = field.getByRole("textbox", { name: "Ring radius value" });
  await editor.fill(`${range[0]} / ${range[1]}`);
  await editor.press("Enter");
}

async function dragRangeSliderThumb(
  page: Page,
  thumbIndex: number,
  deltaX: number,
): Promise<void> {
  const field = await getToolcraftFieldByLabel(page, "Ring radius");
  const thumb = field.locator('[data-slot="slider-thumb"]').nth(thumbIndex);
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

async function setSliderStressValue(
  page: Page,
  label: string,
  value: unknown,
): Promise<void> {
  const field = await getToolcraftFieldByLabel(page, label);
  await field
    .getByRole("button", { name: `Edit ${label} value` })
    .click();
  const editor = field.getByRole("textbox", { name: `${label} value` });
  await editor.fill(String(value));
  await editor.press("Enter");
  if (label === "Resolution scale") {
    await page.waitForTimeout(320);
  }
}

async function selectCustomPalette(page: Page): Promise<void> {
  const presetField = await getToolcraftFieldByLabel(page, "Preset");
  await presetField.getByRole("combobox").click();
  await page.getByText("Custom", { exact: true }).last().click();
}

function volumetricStressAppliers(page: Page) {
  return {
    ballWeight: async (value: unknown) =>
      setSliderStressValue(page, "Ball weight", value),
    coreOpening: async (value: unknown) =>
      setSliderStressValue(page, "Core opening", value),
    density: async (value: unknown) =>
      setSliderStressValue(page, "Density", value),
    dotSize: async (value: unknown) =>
      setSliderStressValue(page, "Dot size", value),
    glow: async (value: unknown) =>
      setSliderStressValue(page, "Glow", value),
    perspective: async (value: unknown) =>
      setSliderStressValue(page, "Perspective", value),
    radiusRange: async (value: unknown) => setRingRadiusRange(page, value),
    renderScale: async (value: unknown) =>
      setSliderStressValue(page, "Resolution scale", value),
    sparkle: async (value: unknown) =>
      setSliderStressValue(page, "Sparkle", value),
    speed: async (value: unknown) =>
      setSliderStressValue(page, "Speed", value),
    strength: async (value: unknown) =>
      setSliderStressValue(page, "Amount", value),
    turbulence: async (value: unknown) =>
      setSliderStressValue(page, "Drift", value),
    wavelength: async (value: unknown) =>
      setSliderStressValue(page, "Frequency", value),
    zBend: async (value: unknown) =>
      setSliderStressValue(page, "Z bend", value),
    zMotion: async (value: unknown) =>
      setSliderStressValue(page, "Z motion", value),
    zSpread: async (value: unknown) =>
      setSliderStressValue(page, "Z spread", value),
    zTwist: async (value: unknown) =>
      setSliderStressValue(page, "Z twist", value),
  };
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("browser perf: kinetic circle volume-radius-range-drag", async ({ page }) => {
  await applyToolcraftPerformanceWorkloadFixture(
    page,
    appPerformance,
    "volume-radius-range-drag",
    {
      density: async (value) =>
        setSliderStressValue(page, "Density", value),
      renderScale: async (value) =>
        setSliderStressValue(page, "Resolution scale", value),
    },
  );
  getToolcraftPerformanceWorkloadValue(
    appPerformance,
    "volume-radius-range-drag",
  );
  const stress = getToolcraftPerformanceStressValue(
    appPerformance,
    "volume-radius-range-drag",
  );
  const result = await measureToolcraftInteraction(page, async () => {
    await dragRangeSliderThumb(page, 0, 34);
    await dragRangeSliderThumb(page, 1, -28);
    await setRingRadiusRange(page, stress);
  });
  await expect(
    page.locator("canvas[data-toolcraft-product-output]"),
  ).toHaveAttribute("data-mosaic-radius-range", "0:100");
  expectToolcraftScenarioPerformanceBudget(
    result,
    appPerformance,
    "volume-radius-range-drag",
  );
});

test("browser perf: kinetic circle density-control-drag", async ({ page }) => {
  await applyToolcraftPerformanceWorkloadFixture(page, appPerformance, "density-control-drag", {
    renderScale: async (value) => dragToolcraftSliderToValue(page, "Resolution scale", Number(value)),
  });
  getToolcraftPerformanceWorkloadValue(appPerformance, "density-control-drag");
  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderByLabel(page, "Density", 0.95);
    await dragToolcraftSliderToPerformanceStressValue(
      page,
      "Density",
      appPerformance,
      "density-control-drag",
    );
  });
  getToolcraftPerformanceStressValue(appPerformance, "density-control-drag");
  await expectToolcraftCanvasBackingPixelsForRenderScale(page, "canvas[data-toolcraft-product-output]", 2);
  await expect(page.locator("canvas[data-toolcraft-product-output]")).toHaveAttribute(
    "data-mosaic-vertex-count",
    /[3-9]\d{3,}/,
  );
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "density-control-drag");
});

test("browser perf: kinetic circle dot-size-control-drag", async ({ page }) => {
  await applyToolcraftPerformanceWorkloadFixture(page, appPerformance, "dot-size-control-drag", {
    density: async (value) => dragToolcraftSliderToValue(page, "Density", Number(value)),
    renderScale: async (value) => dragToolcraftSliderToValue(page, "Resolution scale", Number(value)),
  });
  getToolcraftPerformanceWorkloadValue(appPerformance, "dot-size-control-drag");
  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderByLabel(page, "Dot size", 0.95);
    await dragToolcraftSliderToPerformanceStressValue(
      page,
      "Dot size",
      appPerformance,
      "dot-size-control-drag",
    );
  });
  getToolcraftPerformanceStressValue(appPerformance, "dot-size-control-drag");
  await expectToolcraftCanvasBackingPixelsForRenderScale(page, "canvas[data-toolcraft-product-output]", 2);
  await expect(page.getByRole("slider", { name: "Dot size" })).toHaveValue("14");
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "dot-size-control-drag");
});

test("browser perf: kinetic circle image-export-8k", async ({ page }) => {
  const density = Number(getToolcraftPerformanceWorkloadValue(appPerformance, "image-export-8k"));
  await dragToolcraftSliderToValue(page, "Density", density);
  const resolution = String(getToolcraftPerformanceStressValue(appPerformance, "image-export-8k"));
  const result = await measureToolcraftInteraction(page, async () => {
    await page.getByRole("combobox", { name: "4K" }).click();
    await page.getByText(resolution.toUpperCase(), { exact: true }).click();
  });
  await expect(page.getByRole("combobox", { name: "8K" })).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "image-export-8k");
});

test("browser perf: kinetic circle video-export-4k", async ({ page }) => {
  await applyToolcraftPerformanceWorkloadFixture(page, appPerformance, "video-export-4k", {
    density: async (value) => dragToolcraftSliderToValue(page, "Density", Number(value)),
    renderScale: async (value) => dragToolcraftSliderToValue(page, "Resolution scale", Number(value)),
  });
  getToolcraftPerformanceWorkloadValue(appPerformance, "video-export-4k");
  const resolution = String(getToolcraftPerformanceStressValue(appPerformance, "video-export-4k"));
  const result = await measureToolcraftInteraction(page, async () => {
    await page.getByRole("combobox", { name: "Current" }).click();
    await page.getByText(resolution.toUpperCase(), { exact: true }).click();
  });
  await expectToolcraftCanvasBackingPixelsForRenderScale(page, "canvas[data-toolcraft-product-output]", 2);
  await expect(page.getByRole("combobox", { name: "4K" })).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "video-export-4k");
});

test("browser perf: kinetic circle shape-form-change", async ({ page }) => {
  const formField = await getToolcraftFieldByLabel(page, "Form");
  const result = await measureToolcraftInteraction(page, async () => {
    await formField.getByRole("combobox").click();
    await page.getByText("Flower", { exact: true }).click();
  });
  await expect(page.locator("canvas[data-toolcraft-product-output]")).toHaveAttribute(
    "data-mosaic-shape-form",
    "flower",
  );
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "shape-form-change");
});

test("browser perf: kinetic circle shape-bend-drag", async ({ page }) => {
  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderByLabel(page, "Bend", 0.84);
  });
  await expect(page.getByRole("slider", { name: "Bend" })).not.toHaveValue("22");
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "shape-bend-drag");
});

test("browser perf: kinetic circle shape-depth-drag", async ({ page }) => {
  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderByLabel(page, "Depth", 0.82);
  });
  await expect(page.getByRole("slider", { name: "Depth" })).not.toHaveValue("58");
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "shape-depth-drag");
});

test("browser perf: kinetic circle shape-repeats-drag", async ({ page }) => {
  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderByLabel(page, "Repeats", 0.76);
  });
  await expect(page.getByRole("slider", { name: "Repeats" })).not.toHaveValue("6");
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "shape-repeats-drag");
});

test("browser perf: kinetic circle shape-rotation-drag", async ({ page }) => {
  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderByLabel(page, "Contour angle", 0.72);
  });
  await expect(page.getByRole("slider", { name: "Contour angle" })).not.toHaveValue("0");
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "shape-rotation-drag");
});

test("browser perf: kinetic circle volume-z-spread-drag", async ({ page }) => {
  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderByLabel(page, "Z spread", 0.88);
  });
  await expect(page.getByRole("slider", { name: "Z spread" })).not.toHaveValue(
    "85",
  );
  expectToolcraftScenarioPerformanceBudget(
    result,
    appPerformance,
    "volume-z-spread-drag",
  );
});

test("browser perf: kinetic circle volume-z-bend-drag", async ({ page }) => {
  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderByLabel(page, "Z bend", 0.12);
  });
  await expect(page.getByRole("slider", { name: "Z bend" })).not.toHaveValue(
    "55",
  );
  expectToolcraftScenarioPerformanceBudget(
    result,
    appPerformance,
    "volume-z-bend-drag",
  );
});

test("browser perf: kinetic circle volume-z-twist-drag", async ({ page }) => {
  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderByLabel(page, "Z twist", 0.18);
  });
  await expect(page.getByRole("slider", { name: "Z twist" })).not.toHaveValue(
    "22",
  );
  expectToolcraftScenarioPerformanceBudget(
    result,
    appPerformance,
    "volume-z-twist-drag",
  );
});

test("browser perf: kinetic circle volume-perspective-drag", async ({
  page,
}) => {
  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderByLabel(page, "Perspective", 0.91);
  });
  await expect(
    page.getByRole("slider", { name: "Perspective" }),
  ).not.toHaveValue("68");
  expectToolcraftScenarioPerformanceBudget(
    result,
    appPerformance,
    "volume-perspective-drag",
  );
});

test("browser perf: kinetic circle orientation-handle-drag", async ({ page }) => {
  const canvas = page.locator("canvas[data-toolcraft-product-output]");
  const poseBefore = await canvas.getAttribute("data-mosaic-orientation");
  const result = await measureToolcraftInteraction(page, async () => {
    await dragCanvasHandle(page, "toolcraft-orientation-gizmo", {
      x: 14,
      y: -12,
    });
  });
  await expect(canvas).not.toHaveAttribute(
    "data-mosaic-orientation",
    poseBefore ?? "",
  );
  expectToolcraftScenarioPerformanceBudget(
    result,
    appPerformance,
    "orientation-handle-drag",
  );
});

test("browser perf: kinetic circle seed-drag", async ({ page }) => {
  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderByLabel(page, "Seed", 0.78);
    await expectToolcraftDiscreteSliderDragSmoothness(page, "Seed", {
      maxFrameGapMs: 100,
      maxInteractionMs: 700,
    });
  });
  await expect(page.locator('[data-slot="slider-marker"]').first()).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "seed-drag");
});

test("browser perf: kinetic circle layout-change", async ({ page }) => {
  const layoutField = await getToolcraftFieldByLabel(page, "Layout");
  const result = await measureToolcraftInteraction(page, async () => {
    await layoutField.getByRole("combobox").click();
    await page.getByText("Sunflower", { exact: true }).click();
  });
  await expect(page.locator("canvas[data-toolcraft-product-output]")).toHaveAttribute(
    "data-mosaic-layout",
    "phyllotaxis",
  );
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "layout-change");
});

test("browser perf: kinetic circle arms-drag", async ({ page }) => {
  const layoutField = await getToolcraftFieldByLabel(page, "Layout");
  await layoutField.getByRole("combobox").click();
  await page.getByText("Spiral arms", { exact: true }).click();
  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderByLabel(page, "Arms", 0.95);
  });
  await expect(page.getByRole("slider", { name: "Arms" })).not.toHaveValue("3");
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "arms-drag");
});

test("browser perf: kinetic circle arc-fill-drag", async ({ page }) => {
  const layoutField = await getToolcraftFieldByLabel(page, "Layout");
  await layoutField.getByRole("combobox").click();
  await page.getByText("Arcs", { exact: true }).click();
  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderByLabel(page, "Arc coverage", 0.12);
  });
  await expect(page.getByRole("slider", { name: "Arc coverage" })).not.toHaveValue(
    "55",
  );
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "arc-fill-drag");
});

test("browser perf: kinetic circle dot-shape-change", async ({ page }) => {
  const shapeField = await getToolcraftFieldByLabel(page, "Dot shape");
  const result = await measureToolcraftInteraction(page, async () => {
    await shapeField.getByRole("combobox").click();
    await page.getByText("Streak", { exact: true }).click();
  });
  await expect(page.locator("canvas[data-toolcraft-product-output]")).toHaveAttribute(
    "data-mosaic-dot-shape",
    "streak",
  );
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "dot-shape-change");
});

test("browser perf: kinetic circle taper-drag", async ({ page }) => {
  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderByLabel(page, "Taper", 0.9);
  });
  await expect(page.getByRole("slider", { name: "Taper" })).not.toHaveValue("0");
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "taper-drag");
});

test("browser perf: kinetic circle glow-drag", async ({ page }) => {
  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderByLabel(page, "Glow", 0.88);
  });
  await expect(page.getByRole("slider", { name: "Glow" })).not.toHaveValue("0");
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "glow-drag");
});

test("browser perf: kinetic circle palette-preset-change", async ({ page }) => {
  const presetField = await getToolcraftFieldByLabel(page, "Preset");
  const result = await measureToolcraftInteraction(page, async () => {
    await presetField.getByRole("combobox").click();
    await page.getByText("Neon", { exact: true }).click();
  });
  await expect(page.locator("canvas[data-toolcraft-product-output]")).toHaveAttribute(
    "data-mosaic-palette-preset",
    "neon",
  );
  expectToolcraftScenarioPerformanceBudget(
    result,
    appPerformance,
    "palette-preset-change",
  );
});

test("browser perf: kinetic circle color-mode-change", async ({ page }) => {
  const modeField = await getToolcraftFieldByLabel(page, "Mode");
  const result = await measureToolcraftInteraction(page, async () => {
    await modeField.getByRole("combobox").click();
    await page.getByText("Gradient", { exact: true }).click();
  });
  await expect(page.locator("canvas[data-toolcraft-product-output]")).toHaveAttribute(
    "data-mosaic-color-mode",
    "gradient",
  );
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "color-mode-change");
});

test("browser perf: kinetic circle highlight-drag", async ({ page }) => {
  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderByLabel(page, "Highlight", 0.15);
  });
  await expect(page.getByRole("slider", { name: "Highlight" })).not.toHaveValue(
    "64",
  );
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "highlight-drag");
});

test("browser perf: kinetic circle accents-drag", async ({ page }) => {
  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderByLabel(page, "Accents", 0.92);
  });
  await expect(page.getByRole("slider", { name: "Accents" })).not.toHaveValue("30");
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "accents-drag");
});

test("browser perf: kinetic circle sparkle-drag", async ({ page }) => {
  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderByLabel(page, "Sparkle", 0.85);
  });
  await expect(page.getByRole("slider", { name: "Sparkle" })).not.toHaveValue("0");
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "sparkle-drag");
});

test("browser perf: kinetic circle variations-actions", async ({ page }) => {
  const result = await measureToolcraftInteraction(page, async () => {
    await page.getByRole("button", { name: "Randomize look" }).click();
  });
  await page.getByRole("button", { name: "Randomize colors" }).click();
  await expect(page.locator("canvas[data-toolcraft-product-output]")).not.toHaveAttribute(
    "data-mosaic-palette-preset",
    "custom",
  );
  expectToolcraftScenarioPerformanceBudget(
    result,
    appPerformance,
    "variations-actions",
  );
});

test("browser perf: kinetic circle palette-base-change", async ({ page }) => {
  await selectCustomPalette(page);
  const result = await measureToolcraftInteraction(page, async () => {
    await page.getByRole("textbox", { name: "Base navy hex" }).fill("#6134D8");
  });
  await expect(page.getByRole("textbox", { name: "Base navy hex" })).toHaveValue("#6134D8");
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "palette-base-change");
});

test("browser perf: kinetic circle palette-bright-change", async ({ page }) => {
  await selectCustomPalette(page);
  const result = await measureToolcraftInteraction(page, async () => {
    await page.getByRole("textbox", { name: "Bright ice hex" }).fill("#FFF1CC");
  });
  await expect(page.getByRole("textbox", { name: "Bright ice hex" })).toHaveValue("#FFF1CC");
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "palette-bright-change");
});

test("browser perf: kinetic circle palette-cyan-change", async ({ page }) => {
  await selectCustomPalette(page);
  const result = await measureToolcraftInteraction(page, async () => {
    await page.getByRole("textbox", { name: "Cyan hex" }).fill("#00FFD5");
  });
  await expect(page.getByRole("textbox", { name: "Cyan hex" })).toHaveValue("#00FFD5");
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "palette-cyan-change");
});

test("browser perf: kinetic circle palette-violet-change", async ({ page }) => {
  await selectCustomPalette(page);
  const result = await measureToolcraftInteraction(page, async () => {
    await page.getByRole("textbox", { name: "Violet hex" }).fill("#E44CFF");
  });
  await expect(page.getByRole("textbox", { name: "Violet hex" })).toHaveValue("#E44CFF");
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "palette-violet-change");
});

test("browser perf: kinetic circle palette-warm-change", async ({ page }) => {
  await selectCustomPalette(page);
  const result = await measureToolcraftInteraction(page, async () => {
    await page.getByRole("textbox", { name: "Warm accent hex" }).fill("#FF542E");
  });
  await expect(page.getByRole("textbox", { name: "Warm accent hex" })).toHaveValue("#FF542E");
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "palette-warm-change");
});

test("browser perf: kinetic circle background-include-change", async ({ page }) => {
  const field = await getToolcraftFieldByLabel(page, "Include");
  const result = await measureToolcraftInteraction(page, async () => {
    await field.locator('[data-slot="switch"]').click();
  });
  await expect(field.getByRole("checkbox")).not.toBeChecked();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "background-include-change");
});

test("browser perf: kinetic circle background-color-change", async ({ page }) => {
  const result = await measureToolcraftInteraction(page, async () => {
    await page.getByRole("textbox", { name: "background hex" }).fill("#14213D");
  });
  await expect(page.getByRole("textbox", { name: "background hex" })).toHaveValue("#14213D");
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "background-color-change");
});

test("browser perf: kinetic circle image-format-change", async ({ page }) => {
  const result = await measureToolcraftInteraction(page, async () => {
    await page.getByRole("combobox", { name: "PNG" }).click();
    await page.getByText("JPG", { exact: true }).click();
  });
  await expect(page.getByRole("combobox", { name: "JPG" })).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "image-format-change");
});

test("browser perf: kinetic circle video-format-change", async ({ page }) => {
  const result = await measureToolcraftInteraction(page, async () => {
    await page.getByRole("combobox", { name: "MP4" }).click();
    await page.getByText("WebM", { exact: true }).click();
  });
  await expect(page.getByRole("combobox", { name: "WebM" })).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "video-format-change");
});

test("browser perf: kinetic circle motion-type-change", async ({ page }) => {
  const typeField = await getToolcraftFieldByLabel(page, "Type");
  const result = await measureToolcraftInteraction(page, async () => {
    await typeField.getByRole("combobox").click();
    await page.getByText("Orbit", { exact: true }).click();
  });
  await expect(page.locator("canvas[data-toolcraft-product-output]")).toHaveAttribute(
    "data-mosaic-motion-type",
    "orbit",
  );
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "motion-type-change");
});

test("browser perf: kinetic circle infinity-canvas-change", async ({ page }) => {
  const field = await getToolcraftFieldByLabel(page, "Infinity canvas");
  const result = await measureToolcraftInteraction(page, async () => {
    await field.locator('[data-slot="switch"]').click();
  });
  await expect(
    page.locator("[data-toolcraft-editable-canvas]"),
  ).toHaveAttribute("data-toolcraft-canvas-mode", "infinite");
  expectToolcraftScenarioPerformanceBudget(
    result,
    appPerformance,
    "infinity-canvas-change",
  );
});

test("browser perf: kinetic circle speed-drag", async ({ page }) => {
  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderByLabel(page, "Speed", 0.92);
  });
  await expect(page.getByRole("slider", { name: "Speed" })).not.toHaveValue("2");
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "speed-drag");
});

test("browser perf: kinetic circle strength-drag", async ({ page }) => {
  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderByLabel(page, "Amount", 0.88);
  });
  await expect(page.getByRole("slider", { name: "Amount" })).not.toHaveValue("58");
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "strength-drag");
});

test("browser perf: kinetic circle wavelength-drag", async ({ page }) => {
  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderByLabel(page, "Frequency", 0.84);
  });
  await expect(page.getByRole("slider", { name: "Frequency" })).not.toHaveValue("42");
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "wavelength-drag");
});

test("browser perf: kinetic circle damping-drag", async ({ page }) => {
  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderByLabel(page, "Falloff", 0.81);
  });
  await expect(page.getByRole("slider", { name: "Falloff" })).not.toHaveValue("34");
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "damping-drag");
});

test("browser perf: kinetic circle turbulence-drag", async ({ page }) => {
  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderByLabel(page, "Drift", 0.79);
  });
  await expect(page.getByRole("slider", { name: "Drift" })).not.toHaveValue("24");
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "turbulence-drag");
});

test("browser perf: kinetic circle z-motion-drag", async ({ page }) => {
  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderByLabel(page, "Z motion", 0.9);
  });
  await expect(page.getByRole("slider", { name: "Z motion" })).not.toHaveValue(
    "66",
  );
  expectToolcraftScenarioPerformanceBudget(
    result,
    appPerformance,
    "z-motion-drag",
  );
});

test("browser perf: kinetic circle core-opening-drag", async ({ page }) => {
  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderByLabel(page, "Core opening", 0.88);
  });
  await expect(
    page.getByRole("slider", { name: "Core opening" }),
  ).not.toHaveValue("38");
  expectToolcraftScenarioPerformanceBudget(
    result,
    appPerformance,
    "core-opening-drag",
  );
});

test("browser perf: kinetic circle ball-weight-drag", async ({ page }) => {
  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftSliderByLabel(page, "Ball weight", 0.84);
  });
  await expect(
    page.getByRole("slider", { name: "Ball weight" }),
  ).not.toHaveValue("44");
  expectToolcraftScenarioPerformanceBudget(
    result,
    appPerformance,
    "ball-weight-drag",
  );
});

test("browser perf: kinetic circle dense-preview-render", async ({ page }) => {
  await applyToolcraftPerformanceStressFixture(
    page,
    appPerformance,
    "dense-preview-render",
    volumetricStressAppliers(page),
  );
  getToolcraftPerformanceStressValue(appPerformance, "dense-preview-render");
  const result = await measureToolcraftInteraction(page, async () => {
    await waitForToolcraftAnimationFrames(page, 12);
  });
  await expectToolcraftCanvasBackingPixelsForRenderScale(page, "canvas[data-toolcraft-product-output]", 2);
  await expect(page.locator("canvas[data-toolcraft-product-output]")).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "dense-preview-render");
});

test("browser perf: kinetic circle export-actions", async ({ page }) => {
  const imageResolution = page.getByRole("combobox", { name: "4K" });
  await imageResolution.click();
  await page.getByText("2K", { exact: true }).click();
  const downloadPromise = page.waitForEvent("download");
  const result = await measureToolcraftInteraction(page, async () => {
    await page.locator('button:has-text("Export PNG")').click();
    await downloadPromise;
  });
  await expect(page.getByRole("button", { name: "Export Video" })).toBeEnabled();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "export-actions");
});

test("browser perf: kinetic circle timeline-playback", async ({ page }) => {
  await page.getByRole("button", { name: "Pause playback" }).click();
  await applyToolcraftPerformanceStressFixture(
    page,
    appPerformance,
    "timeline-playback",
    volumetricStressAppliers(page),
  );
  getToolcraftPerformanceStressValue(appPerformance, "timeline-playback");
  const result = await measureToolcraftInteraction(page, async () => {
    await page.getByRole("button", { name: "Play playback" }).click();
    await waitForToolcraftAnimationFrames(page, 12);
    await page.getByRole("button", { name: "Pause playback" }).click();
  });
  await expectToolcraftCanvasBackingPixelsForRenderScale(page, "canvas[data-toolcraft-product-output]", 2);
  await expect(page.locator('[data-slot="timeline-playback"]')).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "timeline-playback");
});

test("browser perf: kinetic circle animation-viewport-drag", async ({ page }) => {
  await applyToolcraftPerformanceStressFixture(
    page,
    appPerformance,
    "animation-viewport-drag",
    volumetricStressAppliers(page),
  );
  getToolcraftPerformanceStressValue(appPerformance, "animation-viewport-drag");
  const result = await measureToolcraftInteraction(page, async () => {
    await dragToolcraftCanvasViewport(page, { x: 80, y: 42 });
  });
  await expectToolcraftCanvasBackingPixelsForRenderScale(page, "canvas[data-toolcraft-product-output]", 2);
  await expect(page.locator("canvas[data-toolcraft-product-output]")).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "animation-viewport-drag");
});

test("browser perf: kinetic circle viewport-zoom-stress", async ({ page }) => {
  await applyToolcraftPerformanceStressFixture(
    page,
    appPerformance,
    "viewport-zoom-stress",
    volumetricStressAppliers(page),
  );
  getToolcraftPerformanceStressValue(appPerformance, "viewport-zoom-stress");
  const result = await measureToolcraftInteraction(page, async () => {
    await zoomToolcraftCanvasViewport(page, 1, false);
  });
  await expectToolcraftCanvasBackingPixelsForRenderScale(page, "canvas[data-toolcraft-product-output]", 2);
  await expect(page.getByRole("button", { name: "Zoom out" })).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "viewport-zoom-stress");
});

test("browser perf: kinetic circle viewport-stability", async ({ page }) => {
  const result = await expectToolcraftCanvasViewportStable(page, async () => {
    await dragToolcraftSliderByLabel(page, "Amount", 0.72);
  });
  await expect(page.locator("canvas[data-toolcraft-product-output]")).toBeVisible();
  expectToolcraftScenarioPerformanceBudget(result, appPerformance, "viewport-stability");
});
