import { expect } from "@playwright/test";

import { test } from "./toolcraft-product-test";

test("browser: color point add and selection stay independent", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Sunset", exact: true }).click();

  const editor = page.locator('[data-mesh-gradient-handles="true"]');
  const canvas = page.locator('[data-mesh-gradient-canvas="true"]');
  const columns = page.getByRole("slider", { name: "Columns", exact: true });
  const beforeFrame = await canvas.getAttribute("data-mesh-frame-signature");
  const beforeCanvasBox = await canvas.boundingBox();

  await expect(editor).toHaveAttribute("data-mesh-point-count", "12");
  await expect(columns).toHaveAttribute("aria-valuenow", "4");
  await page.getByRole("button", { name: "Add color point", exact: true }).click();

  await expect(editor).toHaveAttribute("data-mesh-point-count", "13");
  await expect(editor.locator("[data-mesh-point-handle]")).toHaveCount(13);
  await expect(editor.locator('[data-mesh-inserted-point="true"]')).toHaveCount(1);
  await expect(columns).toHaveAttribute("aria-valuenow", "4");
  await expect(page.locator('[data-mesh-grid-axis="horizontal"]')).toHaveCount(9);
  await expect(page.locator('[data-mesh-grid-axis="vertical"]')).toHaveCount(8);
  await expect(page.locator('[data-mesh-color-point="12"]')).toHaveAttribute(
    "data-active",
    "true",
  );
  await expect(page.getByText("Color points", { exact: true })).toBeVisible();
  await expect(
    page.locator('[data-mesh-color-points-control="true"] input[type="color"]'),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Pick Point 13", exact: true }).click();
  await expect(page.locator('[data-slot="style-guide-color-picker"]')).toBeVisible();
  await page.keyboard.press("Escape");

  const hoveredColor = page.locator('[data-mesh-color-point="0"]');
  const activeColor = page.locator('[data-mesh-color-point="12"]');
  const hoveredButton = hoveredColor.locator('[data-slot="button"]');
  const hoveredInput = hoveredColor.locator(
    '[data-slot="input"]:not([aria-hidden="true"])',
  );
  await page.mouse.move(0, 0);
  await page.waitForTimeout(200);
  const restingButtonBackground = await hoveredButton.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );
  await hoveredButton.hover();
  await page.waitForTimeout(200);
  const hoveredButtonStyles = await hoveredButton.evaluate((element) => ({
    background: getComputedStyle(element).backgroundColor,
    border: getComputedStyle(element).borderTopColor,
  }));
  await hoveredInput.hover();
  await page.waitForTimeout(200);
  const hoveredInputStyles = await hoveredInput.evaluate((element) => ({
    background: getComputedStyle(element).backgroundColor,
    border: getComputedStyle(element).borderTopColor,
  }));
  expect(hoveredButtonStyles.background).toBe(restingButtonBackground);

  await page.mouse.move(0, 0);
  const activeComponentStyles = await activeColor.evaluate((element) => {
    const button = element.querySelector<HTMLElement>('[data-slot="button"]');
    const input = element.querySelector<HTMLElement>(
      '[data-slot="input"]:not([aria-hidden="true"])',
    );
    if (!button || !input) return null;
    return {
      button: {
        background: getComputedStyle(button).backgroundColor,
        border: getComputedStyle(button).borderTopColor,
      },
      input: {
        background: getComputedStyle(input).backgroundColor,
        border: getComputedStyle(input).borderTopColor,
      },
    };
  });
  expect(activeComponentStyles).toEqual({
    button: hoveredButtonStyles,
    input: hoveredInputStyles,
  });
  await expect(activeColor).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(activeColor).toHaveCSS("border-top-width", "0px");
  await expect(activeColor).toHaveCSS("box-shadow", "none");

  const afterCanvasBox = await canvas.boundingBox();
  expect(afterCanvasBox).toEqual(beforeCanvasBox);
  if (beforeFrame) {
    await expect(canvas).not.toHaveAttribute("data-mesh-frame-signature", beforeFrame);
  }

  await editor.locator('[data-mesh-point-handle="0"]').click();
  await expect(page.locator('[data-mesh-color-point="0"]')).toHaveAttribute(
    "data-active",
    "true",
  );
  await page.locator('[data-mesh-color-point="12"]').click();
  await expect(editor.locator('[data-mesh-point-handle="12"]')).toHaveAttribute(
    "data-selected",
    "true",
  );

  await page.getByRole("button", { name: "Remove color point", exact: true }).click();
  await expect(editor).toHaveAttribute("data-mesh-point-count", "12");
  await expect(columns).toHaveAttribute("aria-valuenow", "4");

  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(editor).toHaveAttribute("data-mesh-point-count", "13");
  await expect(columns).toHaveAttribute("aria-valuenow", "4");

  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await expect(editor).toHaveAttribute("data-mesh-point-count", "12");
  await expect(columns).toHaveAttribute("aria-valuenow", "4");
});

test("browser: changing columns reflows a complete row-major mesh", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Sunset", exact: true }).click();

  const editor = page.locator('[data-mesh-gradient-handles="true"]');
  const canvas = page.locator('[data-mesh-gradient-canvas="true"]');
  const columns = page.getByRole("slider", { name: "Columns", exact: true });
  const beforeFrame = await canvas.getAttribute("data-mesh-frame-signature");
  const beforeCanvasBox = await canvas.boundingBox();

  await expect(editor).toHaveAttribute("data-mesh-point-count", "12");
  await expect(columns).toHaveAttribute("aria-valuenow", "4");
  await columns.focus();
  await columns.press("Home");

  await expect(columns).toHaveAttribute("aria-valuenow", "2");
  await expect(editor).toHaveAttribute("data-mesh-point-count", "12");
  await expect(editor.locator("[data-mesh-point-handle]")).toHaveCount(12);
  await expect(page.locator('[data-mesh-grid-axis="horizontal"]')).toHaveCount(6);
  await expect(page.locator('[data-mesh-grid-axis="vertical"]')).toHaveCount(10);

  const coordinates = await editor.locator("[data-mesh-point-handle]").evaluateAll(
    (handles) =>
      handles.map((handle) => {
        const point = handle.querySelector("circle");
        return {
          x: Number(point?.getAttribute("cx")),
          y: Number(point?.getAttribute("cy")),
        };
      }),
  );
  expect(coordinates).toHaveLength(12);
  for (let row = 0; row < 6; row += 1) {
    const left = coordinates[row * 2]!;
    const right = coordinates[row * 2 + 1]!;
    expect(left.y).toBeCloseTo(right.y, 4);
    expect(left.x).toBeCloseTo(coordinates[0]!.x, 4);
    expect(right.x).toBeCloseTo(coordinates[1]!.x, 4);
    expect(left.x).toBeLessThan(right.x);
    if (row > 0) {
      expect(left.y).toBeGreaterThan(coordinates[(row - 1) * 2]!.y);
    }
  }

  expect(await canvas.boundingBox()).toEqual(beforeCanvasBox);
  if (beforeFrame) {
    await expect(canvas).not.toHaveAttribute("data-mesh-frame-signature", beforeFrame);
  }
});
