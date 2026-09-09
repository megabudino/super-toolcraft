import { expect, test, type Page } from "@playwright/test";

import {
  expectToolcraftProductObservableToChange,
  getToolcraftProductObservableSnapshot,
} from "./product-observable-helpers";
import {
  dragToolcraftSliderByLabel,
  expectToolcraftDiscreteSliderDragSmoothness,
} from "./performance-helpers";

async function openFreshPoster(page: Page) {
  await page.goto("/");
  await expect(page.getByTestId("editorial-pattern-output")).toBeVisible();
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByTestId("editorial-pattern-output")).toBeVisible();
}

async function fillControl(page: Page, name: string, value: string) {
  let input = page.getByRole("textbox", { name, exact: true });
  if ((await input.count()) !== 1) {
    input = page
      .locator('[data-slot="field"]')
      .filter({ hasText: new RegExp(`^${name}`) })
      .getByRole("textbox");
  }
  await expect(input).toHaveCount(1);
  await input.fill(value);
  await input.press("Enter");
}

async function chooseSelect(page: Page, name: string, option: string) {
  const field = page
    .locator('[data-slot="field"]')
    .filter({ hasText: new RegExp(`^${name}`) });
  const combo = field.getByRole("combobox");
  await expect(combo).toHaveCount(1);
  await combo.click();
  const optionLabel = page
    .locator('[data-slot="select-item"]')
    .filter({ has: page.getByText(option, { exact: true }) })
    .last();
  await expect(optionLabel).toBeVisible();
  await optionLabel.click();
}

async function waitForPatternMorph(page: Page) {
  await expect(page.getByTestId("editorial-pattern-output")).toHaveAttribute(
    "data-pattern-morphing",
    "false",
    { timeout: 2_000 },
  );
}

function getSwitchByFieldLabel(page: Page, name: string) {
  return page
    .locator('[data-slot="field"]')
    .filter({ hasText: new RegExp(`^${name}`) })
    .getByRole("switch");
}

function getFieldByLabel(page: Page, name: string) {
  return page
    .locator('[data-slot="field"]')
    .filter({ hasText: new RegExp(`^${name}`) });
}

async function expectFormulaToClearEditorialRules(page: Page) {
  const result = await page.getByTestId("editorial-pattern-output").evaluate((output) => {
    const formula = output.querySelector('[data-testid="poster-equation"]');
    if (!(formula instanceof SVGGraphicsElement)) {
      throw new Error("Missing SVG equation block.");
    }
    const box = formula.getBBox();
    const minimumClearance = 8;
    const conflicts = Array.from(
      output.querySelectorAll('[data-editorial-rule-kind="editorial"]'),
    ).flatMap((element, index) => {
      if (!(element instanceof SVGLineElement)) return [];
      const x1 = Number(element.getAttribute("x1"));
      const x2 = Number(element.getAttribute("x2"));
      const y1 = Number(element.getAttribute("y1"));
      const y2 = Number(element.getAttribute("y2"));
      const left = Math.min(x1, x2);
      const right = Math.max(x1, x2);
      const top = Math.min(y1, y2);
      const bottom = Math.max(y1, y2);
      let clearance = Number.POSITIVE_INFINITY;

      if (y1 === y2 && right >= box.x && left <= box.x + box.width) {
        clearance =
          y1 < box.y
            ? box.y - y1
            : y1 > box.y + box.height
              ? y1 - (box.y + box.height)
              : 0;
      } else if (x1 === x2 && bottom >= box.y && top <= box.y + box.height) {
        clearance =
          x1 < box.x
            ? box.x - x1
            : x1 > box.x + box.width
              ? x1 - (box.x + box.width)
              : 0;
      }

      return clearance < minimumClearance
        ? [{ clearance, index, x1, x2, y1, y2 }]
        : [];
    });
    return {
      conflicts,
      formula: { height: box.height, width: box.width, x: box.x, y: box.y },
      template: output.getAttribute("data-editorial-template"),
    };
  });

  expect(result.conflicts, JSON.stringify(result)).toEqual([]);
}

function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map(
    (start) => Number.parseInt(hex.slice(start, start + 2), 16) / 255,
  );
  const linear = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return (linear[0] ?? 0) * 0.2126 + (linear[1] ?? 0) * 0.7152 + (linear[2] ?? 0) * 0.0722;
}

function contrastRatio(a: string, b: string): number {
  const lighter = Math.max(relativeLuminance(a), relativeLuminance(b));
  const darker = Math.min(relativeLuminance(a), relativeLuminance(b));
  return (lighter + 0.05) / (darker + 0.05);
}

function hslMetrics(hex: string): { lightness: number; saturation: number } {
  const [red, green, blue] = [1, 3, 5].map(
    (start) => Number.parseInt(hex.slice(start, start + 2), 16) / 255,
  );
  const max = Math.max(red ?? 0, green ?? 0, blue ?? 0);
  const min = Math.min(red ?? 0, green ?? 0, blue ?? 0);
  const delta = max - min;
  const lightness = (max + min) / 2;
  const saturation =
    delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  return { lightness: lightness * 100, saturation: saturation * 100 };
}

function maxColorChannelDelta(a: string, b: string): number {
  return Math.max(
    ...[1, 3, 5].map((start) =>
      Math.abs(
        Number.parseInt(a.slice(start, start + 2), 16) -
          Number.parseInt(b.slice(start, start + 2), 16),
      ),
    ),
  );
}

test("browser: imported settings seed a clean first launch", async ({ page }) => {
  await openFreshPoster(page);

  const output = page.getByTestId("editorial-pattern-output");
  await expect(output).toHaveAttribute("viewBox", "0 0 1440 1080");
  await expect(output).toHaveAttribute("data-editorial-template", "negative-space");
  await expect(output).toHaveAttribute("data-pattern-preset", "harmonic-halo");
  await expect(output).toHaveAttribute("data-pattern-symmetry", "15");
  await expect(output).toHaveAttribute("data-pattern-resonance", "9");
  await expect(output).toHaveAttribute("data-pattern-coupling", "43");
  await expect(output).toHaveAttribute("data-pattern-phase", "106");
  await expect(output).toHaveAttribute("data-pattern-warp", "44");
  await expect(output).toHaveAttribute("data-pattern-position-x", "-0.180");
  await expect(output).toHaveAttribute("data-pattern-position-y", "-0.040");
  await expect(output).toHaveAttribute("data-pattern-segment-size", "0.50");
  await expect(output).toHaveAttribute("data-pattern-randomness", "60");
  await expect(output).toHaveAttribute("data-pattern-color-spread", "88");
  await expect(output).toHaveAttribute("data-background-color", "#0C925F");
  await expect(output).toHaveAttribute("data-headline-color", "#FFFFFF");
  await expect(output).toHaveAttribute("data-detail-color", "#FFFFFF");
  await expect(output).toHaveAttribute("data-rule-color", "#FFFFFF");
  await expect(output).toHaveAttribute("data-background-included", "true");

  await expect(getSwitchByFieldLabel(page, "Preserve colors")).toBeChecked();
  await expect(getSwitchByFieldLabel(page, "Custom copy")).not.toBeChecked();
  await expect(getSwitchByFieldLabel(page, "Include")).toBeChecked();
  await expect(getFieldByLabel(page, "Template").getByRole("combobox")).toContainText(
    "Negative Space",
  );
  await expect(getFieldByLabel(page, "Equation").getByRole("combobox")).toContainText(
    "Harmonic Halo",
  );

  for (const [name, value] of [
    ["Symmetry", "15"],
    ["Resonance", "9"],
    ["Coupling", "43"],
    ["Phase", "106"],
    ["Warp", "44"],
    ["Scale", "92"],
    ["Detail", "6400"],
    ["Stroke", "1.15"],
    ["Segment size", "0.5"],
    ["Randomness", "60"],
    ["Color spread", "88"],
  ] as const) {
    await expect(getFieldByLabel(page, name).getByRole("slider")).toHaveAttribute(
      "aria-valuenow",
      value,
    );
  }

  const colorValues = [
    ["background hex", "#0C925F"],
    ["colorA hex", "#E6D0F0"],
    ["colorB hex", "#EF6CB1"],
    ["colorC hex", "#9BED87"],
    ["Headline hex", "#FFFFFF"],
    ["Detail hex", "#FFFFFF"],
    ["Rule hex", "#FFFFFF"],
  ] as const;
  for (const [name, value] of colorValues) {
    await expect(page.getByRole("textbox", { name, exact: true })).toHaveValue(value);
  }

  await getSwitchByFieldLabel(page, "Custom copy").click();
  await expect(getFieldByLabel(page, "Eyebrow").getByRole("textbox")).toHaveValue(
    "SYSTEMS JOURNAL / 01",
  );
  await expect(page.getByRole("textbox", { name: "Headline", exact: true })).toHaveValue(
    "ORDER\nCREATES\nFREEDOM",
  );
  await expect(page.getByRole("textbox", { name: "Body", exact: true })).toHaveValue(
    "A modular grid turns many decisions into one repeatable logic. Columns hold alignment; intervals create rhythm; variation arrives without losing the whole.",
  );
  await expect(getFieldByLabel(page, "Footer").getByRole("textbox")).toHaveValue(
    "NOTES ON STRUCTURE — EDITION 01",
  );

  await expect(getFieldByLabel(page, "Format").getByRole("combobox")).toContainText("PNG");
  await expect(getFieldByLabel(page, "Resolution").getByRole("combobox")).toContainText(
    "4K",
  );
});

test("browser: whole composition shuffle preserves contrast and morphs pattern", async ({ page }) => {
  await openFreshPoster(page);
  const preserveColors = getSwitchByFieldLabel(page, "Preserve colors");
  await expect(preserveColors).toBeChecked();
  await preserveColors.click();
  await expect(preserveColors).not.toBeChecked();
  const output = page.getByTestId("editorial-pattern-output");
  const patternLayer = page.getByTestId("pattern-layer");
  const beforeTransform = await patternLayer.getAttribute("data-pattern-transform");
  const before = await output.evaluate((element) => ({
    coupling: element.getAttribute("data-pattern-coupling"),
    phase: element.getAttribute("data-pattern-phase"),
    preset: element.getAttribute("data-pattern-preset"),
    resonance: element.getAttribute("data-pattern-resonance"),
    symmetry: element.getAttribute("data-pattern-symmetry"),
    template: element.getAttribute("data-editorial-template"),
    warp: element.getAttribute("data-pattern-warp"),
  }));
  await getSwitchByFieldLabel(page, "Custom copy").click();

  await expectToolcraftProductObservableToChange(page, async () => {
    await page.getByRole("button", { name: "Shuffle all", exact: true }).click();
  });
  await expect(output).toHaveAttribute("data-pattern-morphing", "true");
  const firstIntermediate = await page
    .getByTestId("pattern-layer")
    .locator("path")
    .first()
    .getAttribute("d");
  await page.waitForTimeout(90);
  const secondIntermediate = await page
    .getByTestId("pattern-layer")
    .locator("path")
    .first()
    .getAttribute("d");
  expect(secondIntermediate).not.toBe(firstIntermediate);
  const middleTransform = await patternLayer.getAttribute("data-pattern-transform");
  await page.waitForFunction(() => {
    const element = document.querySelector('[data-testid="editorial-pattern-output"]');
    return (
      element?.getAttribute("data-pattern-morphing") === "true" &&
      Number(element.getAttribute("data-pattern-morph-progress")) >= 0.9
    );
  });
  const nearEndSegments = await patternLayer.locator("path").evaluateAll((paths) => ({
    colors: [0, 1, 2].map(
      (index) =>
        paths.find((path) => path.getAttribute("data-pattern-color-index") === String(index))
          ?.getAttribute("stroke") ?? "",
    ),
    indices: paths.map((path) => path.getAttribute("data-pattern-color-index")),
    starts: paths.slice(0, 48).map((path) => {
      const point = (path as SVGPathElement).getPointAtLength(0);
      return [point.x, point.y] as const;
    }),
  }));
  await expect(output).toHaveAttribute("data-pattern-morphing", "false", {
    timeout: 2_000,
  });
  const finalTransform = await patternLayer.getAttribute("data-pattern-transform");
  const finalSegments = await patternLayer.locator("path").evaluateAll((paths) => ({
    colors: [0, 1, 2].map(
      (index) =>
        paths.find((path) => path.getAttribute("data-pattern-color-index") === String(index))
          ?.getAttribute("stroke") ?? "",
    ),
    indices: paths.map((path) => path.getAttribute("data-pattern-color-index")),
    starts: paths.slice(0, 48).map((path) => {
      const point = (path as SVGPathElement).getPointAtLength(0);
      return [point.x, point.y] as const;
    }),
  }));
  expect(finalTransform).not.toBe(beforeTransform);
  expect(middleTransform).not.toBe(beforeTransform);
  expect(middleTransform).not.toBe(finalTransform);
  expect(finalSegments.indices).toEqual(nearEndSegments.indices);
  expect(finalSegments.starts).toHaveLength(nearEndSegments.starts.length);
  const largestSegmentBoundaryMove = finalSegments.starts.reduce(
    (largest, [x, y], index) => {
      const [nearX, nearY] = nearEndSegments.starts[index] ?? [x, y];
      return Math.max(largest, Math.hypot(x - nearX, y - nearY));
    },
    0,
  );
  expect(largestSegmentBoundaryMove).toBeLessThanOrEqual(0.06);
  finalSegments.colors.forEach((color, index) => {
    expect(maxColorChannelDelta(nearEndSegments.colors[index] ?? color, color)).toBeLessThanOrEqual(15);
  });

  const after = await output.evaluate((element) => ({
    background: element.getAttribute("data-background-color") ?? "",
    coupling: element.getAttribute("data-pattern-coupling"),
    detail: element.getAttribute("data-detail-color") ?? "",
    headline: element.getAttribute("data-headline-color") ?? "",
    phase: element.getAttribute("data-pattern-phase"),
    preset: element.getAttribute("data-pattern-preset"),
    resonance: element.getAttribute("data-pattern-resonance"),
    rule: element.getAttribute("data-rule-color") ?? "",
    symmetry: element.getAttribute("data-pattern-symmetry"),
    template: element.getAttribute("data-editorial-template"),
    warp: element.getAttribute("data-pattern-warp"),
  }));
  expect(after.template).not.toBe(before.template);
  expect(after.preset).not.toBe(before.preset);
  for (const key of ["symmetry", "resonance", "coupling", "phase", "warp"] as const) {
    expect(after[key]).not.toBe(before[key]);
  }
  await expect(getSwitchByFieldLabel(page, "Custom copy")).not.toBeChecked();
  await expect(getSwitchByFieldLabel(page, "Include")).toBeChecked();
  expect(contrastRatio(after.headline, after.background)).toBeGreaterThanOrEqual(7);
  expect(contrastRatio(after.detail, after.background)).toBeGreaterThanOrEqual(7);
  expect(contrastRatio(after.rule, after.background)).toBeGreaterThanOrEqual(3);
  expect(hslMetrics(after.background).saturation).toBeGreaterThanOrEqual(90);
  expect(hslMetrics(after.background).lightness).toBeLessThanOrEqual(62.5);

  const lineColors = await page
    .getByTestId("pattern-layer")
    .locator("path")
    .evaluateAll((paths) =>
      Array.from(
        new Set(paths.map((path) => path.getAttribute("data-pattern-line-color") ?? "")),
      ),
    );
  expect(lineColors).toHaveLength(3);
  for (const color of lineColors) {
    expect(contrastRatio(color, after.background)).toBeGreaterThanOrEqual(3);
  }

  const backgroundPolarities = new Set<string>();
  let previousBackground = after.background;
  for (let iteration = 0; iteration < 8; iteration += 1) {
    await page.getByRole("button", { name: "Shuffle all", exact: true }).click();
    await page.waitForFunction(
      (previous) =>
        document
          .querySelector('[data-testid="editorial-pattern-output"]')
          ?.getAttribute("data-background-color") !== previous,
      previousBackground,
    );
    await expect(output).toHaveAttribute("data-pattern-morphing", "false", {
      timeout: 2_000,
    });

    const palette = await output.evaluate((element) => ({
      background: element.getAttribute("data-background-color") ?? "",
      detail: element.getAttribute("data-detail-color") ?? "",
      headline: element.getAttribute("data-headline-color") ?? "",
      rule: element.getAttribute("data-rule-color") ?? "",
    }));
    const metrics = hslMetrics(palette.background);
    expect(metrics.saturation).toBeGreaterThanOrEqual(90);
    expect(metrics.lightness).toBeGreaterThanOrEqual(21.5);
    expect(metrics.lightness).toBeLessThanOrEqual(62.5);
    expect(contrastRatio(palette.headline, palette.background)).toBeGreaterThanOrEqual(7);
    expect(contrastRatio(palette.detail, palette.background)).toBeGreaterThanOrEqual(7);
    expect(contrastRatio(palette.rule, palette.background)).toBeGreaterThanOrEqual(3);
    backgroundPolarities.add(
      contrastRatio(palette.background, "#000000") >=
        contrastRatio(palette.background, "#FFFFFF")
        ? "black-ink"
        : "white-ink",
    );
    previousBackground = palette.background;
  }
  expect(backgroundPolarities).toEqual(new Set(["black-ink", "white-ink"]));
});

test("browser: preserve colors keeps user palette during composition shuffle", async ({ page }) => {
  test.setTimeout(60_000);
  await openFreshPoster(page);

  const colorValues = [
    ["background hex", "#F2E7D5"],
    ["colorA hex", "#003F5C"],
    ["colorB hex", "#9B1B30"],
    ["colorC hex", "#4B2E83"],
    ["Headline hex", "#1A1A1A"],
    ["Detail hex", "#243447"],
    ["Rule hex", "#6B3A2E"],
  ] as const;

  for (const [label, value] of colorValues) {
    await fillControl(page, label, value);
  }
  await waitForPatternMorph(page);

  const includeBackground = getSwitchByFieldLabel(page, "Include");
  await includeBackground.click();
  await expect(includeBackground).not.toBeChecked();

  const preserveColors = getSwitchByFieldLabel(page, "Preserve colors");
  await expect(preserveColors).toBeChecked();
  await page.waitForTimeout(350);
  await page.reload();
  await expect(page.getByTestId("editorial-pattern-output")).toBeVisible();
  await expect(getSwitchByFieldLabel(page, "Preserve colors")).toBeChecked();
  await expect(getSwitchByFieldLabel(page, "Include")).not.toBeChecked();

  const colorInputs = colorValues.map(([label]) =>
    page.getByRole("textbox", { name: label, exact: true }),
  );
  const colorsBefore = await Promise.all(colorInputs.map((input) => input.inputValue()));
  const output = page.getByTestId("editorial-pattern-output");
  const compositionBefore = await output.evaluate((element) => ({
    coupling: element.getAttribute("data-pattern-coupling"),
    phase: element.getAttribute("data-pattern-phase"),
    preset: element.getAttribute("data-pattern-preset"),
    resonance: element.getAttribute("data-pattern-resonance"),
    symmetry: element.getAttribute("data-pattern-symmetry"),
    template: element.getAttribute("data-editorial-template"),
    warp: element.getAttribute("data-pattern-warp"),
  }));

  await expectToolcraftProductObservableToChange(page, async () => {
    await page.getByRole("button", { name: "Shuffle all", exact: true }).click();
  });
  await waitForPatternMorph(page);

  const colorsAfter = await Promise.all(colorInputs.map((input) => input.inputValue()));
  expect(colorsAfter).toEqual(colorsBefore);
  await expect(getSwitchByFieldLabel(page, "Include")).not.toBeChecked();
  await expect(page.getByTestId("poster-background")).toHaveCount(0);

  const compositionAfter = await output.evaluate((element) => ({
    coupling: element.getAttribute("data-pattern-coupling"),
    phase: element.getAttribute("data-pattern-phase"),
    preset: element.getAttribute("data-pattern-preset"),
    resonance: element.getAttribute("data-pattern-resonance"),
    symmetry: element.getAttribute("data-pattern-symmetry"),
    template: element.getAttribute("data-editorial-template"),
    warp: element.getAttribute("data-pattern-warp"),
  }));
  expect(compositionAfter.template).not.toBe(compositionBefore.template);
  expect(compositionAfter.preset).not.toBe(compositionBefore.preset);
  for (const key of ["symmetry", "resonance", "coupling", "phase", "warp"] as const) {
    expect(compositionAfter[key]).not.toBe(compositionBefore[key]);
  }
});

test("browser: thirty editorial templates and custom copy update poster", async ({ page }) => {
  test.setTimeout(120_000);
  await openFreshPoster(page);

  await expect(page.getByRole("textbox", { name: "Eyebrow", exact: true })).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "Headline", exact: true })).toHaveCount(0);

  await chooseSelect(page, "Equation", "Superformula");

  for (const [label, id, count, headline] of [
    ["Edge Catalogue", "edge-catalogue", "7", "FORM"],
    ["Service Grid", "service-grid", "12", "PRINT AS"],
    ["Baseline Field", "baseline-field", "10", "EVERY LINE"],
    ["Type Scale", "type-scale", "14", "SIZE IS"],
    ["Negative Space", "negative-space", "6", "SPACE"],
    ["Column Rhythm", "column-rhythm", "13", "RHYTHM"],
    ["Optical Balance", "optical-balance", "9", "CENTERED"],
    ["Margin System", "margin-system", "11", "THE MARGIN"],
    ["Variable Order", "variable-order", "15", "ONE SYSTEM"],
    ["Border Ledger", "border-ledger", "6", "THE PAGE"],
    ["Split Colophon", "split-colophon", "7", "SMALL TYPE"],
    ["Running Header", "running-header", "8", "READING"],
    ["Center Cascade", "center-cascade", "9", "WORDS FIND"],
    ["Lower Band", "lower-band", "10", "THE BOTTOM"],
    ["Twin Rails", "twin-rails", "11", "TWO EDGES"],
    ["Micro Index", "micro-index", "12", "DETAIL IS"],
    ["Grand Folio", "grand-folio", "13", "WAYS TO"],
    ["Bracket Field", "bracket-field", "14", "A FRAME"],
    ["Cross Axis", "cross-axis", "15", "ALIGNMENT"],
    ["Stacked Inquiry", "stacked-inquiry", "16", "WHO SETS"],
    ["Peripheral Notes", "peripheral-notes", "17", "THE CENTER"],
    ["Citation Grid", "citation-grid", "18", "EVERY FORM"],
    ["Festival Band", "festival-band", "19", "TYPE CAN"],
    ["Tall Register", "tall-register", "20", "LISTS MAKE"],
    ["Sidecar Essay", "sidecar-essay", "21", "THE NOTE"],
    ["Modular Proof", "modular-proof", "22", "TEST THE"],
    ["Empty Center", "empty-center", "23", "LEAVE ROOM"],
    ["Caption Matrix", "caption-matrix", "24", "CAPTIONS"],
    ["Archive Spine", "archive-spine", "25", "AN ARCHIVE"],
    ["Modular Index", "modular-index", "8", "ORDER"],
  ] as const) {
    await expectToolcraftProductObservableToChange(page, async () => {
      await chooseSelect(page, "Template", label);
    });
    await expect(page.getByTestId("editorial-pattern-output")).toHaveAttribute(
      "data-editorial-template",
      id,
    );
    await expect(page.getByTestId("editorial-pattern-output")).toHaveAttribute(
      "data-text-element-count",
      count,
    );
    await expect(page.getByTestId("poster-headline")).toContainText(headline);
    await expectFormulaToClearEditorialRules(page);
  }

  await expect(page.getByTestId("poster-headline")).toHaveAttribute(
    "font-family",
    /Geist Variable/,
  );

  await chooseSelect(page, "Template", "Service Grid");
  await expect(page.getByTestId("editorial-grid").locator("line")).toHaveCount(39);

  const customCopy = getSwitchByFieldLabel(page, "Custom copy");
  await expectToolcraftProductObservableToChange(page, async () => {
    await customCopy.click();
  });

  await expectToolcraftProductObservableToChange(page, async () => {
    await fillControl(page, "Eyebrow", "SYSTEM / 24");
  });
  await expectToolcraftProductObservableToChange(page, async () => {
    await page.getByRole("textbox", { name: "Headline", exact: true }).fill("NEW\nFREQUENCIES");
  });
  await expectToolcraftProductObservableToChange(page, async () => {
    await page
      .getByRole("textbox", { name: "Body", exact: true })
      .fill("A compact editorial column.\nBuilt from a strict modular grid.");
  });
  await expectToolcraftProductObservableToChange(page, async () => {
    await fillControl(page, "Footer", "STUDY 03 — CLOSED CURVES");
  });

  await expect(page.getByTestId("poster-eyebrow")).toContainText("SYSTEM / 24");
  await expect(page.getByTestId("poster-headline")).toContainText("NEW");
  await expect(page.getByTestId("poster-body")).toContainText("compact editorial");
  await expect(page.getByTestId("poster-footer")).toContainText("STUDY 03");

  await expectToolcraftProductObservableToChange(page, async () => {
    await customCopy.click();
  });
  await expect(page.getByTestId("poster-headline")).toContainText("PRINT AS");
  await expect(page.getByRole("textbox", { name: "Headline", exact: true })).toHaveCount(0);

  await customCopy.click();
  await expect(page.getByTestId("poster-headline")).toContainText("NEW");
});

test("browser: equation library and variables reshape output", async ({ page }) => {
  test.setTimeout(60_000);
  await openFreshPoster(page);

  for (const equation of [
    "Coupled Pendulum",
    "Magnetic Orbit",
    "Standing Wave",
    "Torus Knot",
    "Hypotrochoid",
    "Duffing Trace",
    "Vortex Ring",
    "Wave Packet",
    "Membrane Mode",
    "Superformula",
    "Shell Interference",
    "Harmonic Halo",
  ]) {
    await expectToolcraftProductObservableToChange(page, async () => {
      await chooseSelect(page, "Equation", equation);
    });
    await expect(page.getByTestId("poster-equation")).toContainText(equation);
  }
  await expect(page.getByTestId("editorial-pattern-output")).toHaveAttribute(
    "data-pattern-morphing",
    "false",
  );

  for (const label of ["Symmetry", "Resonance"]) {
    await test.step(`${label} discrete morph drag`, async () => {
      const field = page.locator('[data-slot="field"]').filter({ hasText: new RegExp(`^${label}`) });
      await expect(field.locator('[data-slot="slider"]')).toHaveAttribute("data-variant", "discrete");
      await expect(field.locator('[data-slot="slider-marker"]').first()).toBeVisible();
      const before = await getToolcraftProductObservableSnapshot(page);
      await expectToolcraftDiscreteSliderDragSmoothness(page, label, {
        maxFrameGapMs: 90,
        maxInteractionMs: 600,
        steps: 8,
      });
      expect(await getToolcraftProductObservableSnapshot(page)).not.toBe(before);
    });
  }

  for (const [name, ratio] of [
    ["Coupling", 0.82],
    ["Phase", 0.71],
    ["Warp", 0.88],
  ] as const) {
    await expectToolcraftProductObservableToChange(page, async () => {
      await dragToolcraftSliderByLabel(page, name, ratio);
    });
  }
});

test("browser: reduced motion presents equation target immediately", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openFreshPoster(page);
  const output = page.getByTestId("editorial-pattern-output");
  await expectToolcraftProductObservableToChange(page, async () => {
    await chooseSelect(page, "Equation", "Torus Knot");
  });
  await expect(output).toHaveAttribute("data-pattern-preset", "torus-knot");
  await expect(output).toHaveAttribute("data-pattern-morphing", "false");
  await expect(output).toHaveAttribute("data-pattern-morph-progress", "1.000");
});

test("browser: line form and position update output", async ({ page }) => {
  await openFreshPoster(page);

  await test.step("vector.x", async () => {
    await page.getByRole("button", { name: "Edit Position value", exact: true }).click();
    await expectToolcraftProductObservableToChange(page, async () => {
      await fillControl(page, "Position value", "0.55 / 0.35");
    });
    await expect(page.getByTestId("editorial-pattern-output")).toHaveAttribute(
      "data-pattern-position-x",
      "0.550",
    );
  });

  await test.step("vector.y", async () => {
    await page.getByRole("button", { name: "Edit Position value", exact: true }).click();
    await expectToolcraftProductObservableToChange(page, async () => {
      await fillControl(page, "Position value", "0.55 / -0.45");
    });
    await expect(page.getByTestId("editorial-pattern-output")).toHaveAttribute(
      "data-pattern-position-y",
      "-0.450",
    );
  });

  for (const [name, ratio] of [
    ["Scale", 0.72],
    ["Detail", 0.64],
    ["Stroke", 0.82],
  ] as const) {
    await expectToolcraftProductObservableToChange(page, async () => {
      await dragToolcraftSliderByLabel(page, name, ratio);
    });
  }

  await expect(page.getByTestId("pattern-layer").locator("path").first()).toBeVisible();
});

test("browser: short color segmentation controls update output", async ({ page }) => {
  await openFreshPoster(page);

  await expectToolcraftProductObservableToChange(page, async () => {
    await dragToolcraftSliderByLabel(page, "Segment size", 0.02);
  });
  await waitForPatternMorph(page);
  const paths = page.getByTestId("pattern-layer").locator("path");
  await expect.poll(() => paths.count()).toBeGreaterThan(200);

  await expectToolcraftProductObservableToChange(page, async () => {
    await dragToolcraftSliderByLabel(page, "Randomness", 0.96);
  });
  await waitForPatternMorph(page);
  const variedLengths = await paths.evaluateAll((elements) =>
    new Set(elements.map((element) => element.getAttribute("d")?.length ?? 0)).size,
  );
  expect(variedLengths).toBeGreaterThan(5);

  await expectToolcraftProductObservableToChange(page, async () => {
    await dragToolcraftSliderByLabel(page, "Randomness", 0.01);
  });
  await waitForPatternMorph(page);
  await expectToolcraftProductObservableToChange(page, async () => {
    await dragToolcraftSliderByLabel(page, "Color spread", 0.98);
  });
  await waitForPatternMorph(page);
  const highSpreadTransitions = await paths.evaluateAll((elements) => {
    const colors = elements.map((element) => element.getAttribute("data-pattern-color-index"));
    return colors.slice(1).filter((color, index) => color !== colors[index]).length;
  });
  await expectToolcraftProductObservableToChange(page, async () => {
    await dragToolcraftSliderByLabel(page, "Color spread", 0.02);
  });
  await waitForPatternMorph(page);
  const lowSpreadTransitions = await paths.evaluateAll((elements) => {
    const colors = elements.map((element) => element.getAttribute("data-pattern-color-index"));
    return colors.slice(1).filter((color, index) => color !== colors[index]).length;
  });
  expect(lowSpreadTransitions).toBeLessThan(highSpreadTransitions);
});

test("browser: palette colors, shuffle, and ink recolor poster", async ({ page }) => {
  await openFreshPoster(page);

  for (const [label, value] of [
    ["colorA hex", "#008F75"],
    ["colorB hex", "#F2397A"],
    ["colorC hex", "#5848FF"],
    ["Headline hex", "#2B183F"],
    ["Detail hex", "#174A3F"],
    ["Rule hex", "#CE3D67"],
  ] as const) {
    await expectToolcraftProductObservableToChange(page, async () => {
      await fillControl(page, label, value);
    });
  }
  await waitForPatternMorph(page);

  await expect(page.locator('[data-pattern-color-index="0"]').first()).toHaveAttribute("stroke", "#008F75");
  await expect(page.locator('[data-pattern-color-index="1"]').first()).toHaveAttribute("stroke", "#F2397A");
  await expect(page.locator('[data-pattern-color-index="2"]').first()).toHaveAttribute("stroke", "#5848FF");
  await expect(page.getByTestId("poster-headline")).toHaveAttribute("fill", "#2B183F");
  await expect(page.getByTestId("poster-body")).toHaveAttribute("fill", "#174A3F");
  await expect(page.getByTestId("editorial-rule")).toHaveAttribute("stroke", "#CE3D67");

  const paletteInputs = ["colorA hex", "colorB hex", "colorC hex"].map((name) =>
    page.getByRole("textbox", { name, exact: true }),
  );
  const beforeShuffle = await Promise.all(paletteInputs.map((input) => input.inputValue()));
  await test.step("shuffle-palette", async () => {
    await expectToolcraftProductObservableToChange(page, async () => {
      await page.getByRole("button", { name: "Shuffle", exact: true }).click();
    });
  });
  const firstShuffle = await Promise.all(paletteInputs.map((input) => input.inputValue()));
  expect(firstShuffle).not.toEqual(beforeShuffle);
  expect(new Set(firstShuffle).size).toBe(3);

  await expectToolcraftProductObservableToChange(page, async () => {
    await page.getByRole("button", { name: "Shuffle", exact: true }).click();
  });
  const secondShuffle = await Promise.all(paletteInputs.map((input) => input.inputValue()));
  expect(secondShuffle).not.toEqual(firstShuffle);

  await expectToolcraftProductObservableToChange(page, async () => {
    await page.getByRole("button", { name: "Reset Line Palette section", exact: true }).click();
  });
  await expect(paletteInputs[0]).toHaveValue("#E6D0F0");
  await expect(paletteInputs[1]).toHaveValue("#EF6CB1");
  await expect(paletteInputs[2]).toHaveValue("#9BED87");
});

test("browser: background and export settings update output", async ({ page }) => {
  await page.addInitScript(() => {
    const original = URL.createObjectURL.bind(URL);
    URL.createObjectURL = ((value: Blob | MediaSource) => {
      if (value instanceof Blob) {
        (window as typeof window & { __lastToolcraftExport?: Blob }).__lastToolcraftExport = value;
      }
      return original(value);
    }) as typeof URL.createObjectURL;
  });
  await openFreshPoster(page);

  await expectToolcraftProductObservableToChange(page, async () => {
    await fillControl(page, "background hex", "#FFD36A");
  });
  await waitForPatternMorph(page);
  await expect(page.getByTestId("poster-background")).toHaveAttribute("fill", "#FFD36A");
  const includeSwitch = getSwitchByFieldLabel(page, "Include");
  await expect(includeSwitch).toHaveCount(1);
  await expectToolcraftProductObservableToChange(page, async () => {
    await includeSwitch.click();
  });
  await expect(page.getByTestId("poster-background")).toHaveCount(0);
  await chooseSelect(page, "Resolution", "8K");
  await chooseSelect(page, "Resolution", "2K");

  const firstDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export PNG", exact: true }).click();
  await expect(page.locator('[data-sticky-footer-active="true"]')).toBeVisible();
  await firstDownload;
  await expect(page.locator('[data-sticky-footer-active="true"]')).toHaveCount(0);
  const png = await page.evaluate(async () => {
    const blob = (window as typeof window & { __lastToolcraftExport?: Blob }).__lastToolcraftExport;
    if (!blob) throw new Error("Missing PNG export blob.");
    const bitmap = await createImageBitmap(blob);
    const sample = document.createElement("canvas");
    sample.width = 1;
    sample.height = 1;
    const context = sample.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Missing sample context.");
    context.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height, 0, 0, 1, 1);
    return {
      alpha: context.getImageData(0, 0, 1, 1).data[3],
      height: bitmap.height,
      size: blob.size,
      type: blob.type,
      width: bitmap.width,
    };
  });
  expect(png.type).toBe("image/png");
  expect(Math.max(png.width, png.height)).toBe(2048);
  expect(png.alpha).toBe(0);
  expect(png.size).toBeGreaterThan(1000);

  await includeSwitch.click();
  await chooseSelect(page, "Format", "JPG");
  await chooseSelect(page, "Resolution", "4K");
  const secondDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export PNG", exact: true }).click();
  await secondDownload;
  const jpg = await page.evaluate(async () => {
    const blob = (window as typeof window & { __lastToolcraftExport?: Blob }).__lastToolcraftExport;
    if (!blob) throw new Error("Missing JPG export blob.");
    const bitmap = await createImageBitmap(blob);
    return { height: bitmap.height, size: blob.size, type: blob.type, width: bitmap.width };
  });
  expect(jpg.type).toBe("image/jpeg");
  expect(Math.max(jpg.width, jpg.height)).toBe(4096);
  expect(jpg.size).toBeGreaterThan(1000);
});

test("browser: poster settings persist through reload", async ({ page }) => {
  await openFreshPoster(page);
  await chooseSelect(page, "Template", "Margin System");
  await getSwitchByFieldLabel(page, "Custom copy").click();
  const headline = page.getByRole("textbox", { name: "Headline", exact: true });
  await headline.fill("PERSISTENT\nSIGNALS");
  await expect(page.getByTestId("poster-headline")).toContainText("PERSISTENT");
  await page.waitForTimeout(350);
  await page.reload();
  await expect(page.getByTestId("editorial-pattern-output")).toHaveAttribute(
    "data-editorial-template",
    "margin-system",
  );
  await expect(getSwitchByFieldLabel(page, "Custom copy")).toBeChecked();
  await expect(page.getByRole("textbox", { name: "Headline", exact: true })).toHaveValue(
    "PERSISTENT\nSIGNALS",
  );
  await expect(page.getByTestId("poster-headline")).toContainText("PERSISTENT");
});

test("browser: canvas sizing and toolbar remain stable", async ({ page }) => {
  await openFreshPoster(page);
  const before = await getToolcraftProductObservableSnapshot(page);

  await fillControl(page, "Canvas width", "1280");
  const previewWidth = await page.getByTestId("editorial-pattern-output").evaluate((element) =>
    element.getBoundingClientRect().width,
  );
  const outputWidth = 1280;
  expect(previewWidth).toBeGreaterThan(0);
  expect(outputWidth).toBe(1280);
  await expect(page.getByTestId("editorial-pattern-output")).toHaveAttribute(
    "viewBox",
    "0 0 1280 1080",
  );
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await page.getByRole("button", { name: "Center canvas", exact: true }).click();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.getByTestId("editorial-pattern-output")).toBeVisible();
  expect(await getToolcraftProductObservableSnapshot(page)).not.toBe(before);
});
