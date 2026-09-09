import { expect } from "@playwright/test";

import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { dragCanvasHandle } from "./canvas-handle-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { test } from "./toolcraft-product-test";

test("browser: mesh canvas matches ColorFlow geometry and backing quality", async ({
  page,
}) => {
  await page.goto("/");

  const canvas = page.locator('[data-mesh-gradient-canvas="true"]');
  const editor = page.locator('[data-mesh-gradient-handles="true"]');
  const point = page.locator('[data-testid="mesh-point-primary"]');

  await expect(canvas).toHaveAttribute("data-mesh-tessellation", "64");
  expect(
    await canvas.evaluate((node) => {
      const element = node as HTMLCanvasElement;
      return {
        clientHeight: element.clientHeight,
        clientWidth: element.clientWidth,
        height: element.height,
        width: element.width,
      };
    }),
  ).toEqual({ clientHeight: 600, clientWidth: 800, height: 1200, width: 1600 });
  await expect(editor).toHaveAttribute("viewBox", "-1000 -1000 2800 2600");
  await expect(page.locator('[data-mesh-point-handle]')).toHaveCount(12);
  await expect(page.locator('[data-mesh-point-handle][data-selected="true"]')).toHaveCount(0);

  const pointBox = await point.boundingBox();
  expect(pointBox).not.toBeNull();
  expect(pointBox!.width).toBeCloseTo(44, 0);
  expect(pointBox!.height).toBeCloseTo(44, 0);

  await page.mouse.move(
    pointBox!.x + pointBox!.width / 2,
    pointBox!.y + pointBox!.height / 2,
  );
  await page.mouse.down();
  await expect(canvas).toHaveAttribute("data-mesh-tessellation", "16");
  await page.mouse.up();
  await expect(canvas).toHaveAttribute("data-mesh-tessellation", "64");
  await expect(page.locator('[data-mesh-handle-direction]')).toHaveCount(4);

  await page.getByRole("button", { name: "Zoom out", exact: true }).click();
  await page.getByRole("button", { name: "Zoom out", exact: true }).click();
  const zoomedPointBox = await point.boundingBox();
  expect(zoomedPointBox).not.toBeNull();
  expect(zoomedPointBox!.width).toBeCloseTo(44, 0);
  expect(zoomedPointBox!.height).toBeCloseTo(44, 0);
});

test("browser: ColorFlow selection overflow and deletion preserve mesh topology", async ({
  page,
}) => {
  await page.goto("/");
  const session = await createToolcraftBrowserProofSession(page);

  const canvas = page.locator('[data-mesh-gradient-canvas="true"]');
  const editor = page.locator('[data-mesh-gradient-handles="true"]');
  const portal = page.locator('[data-mesh-editor-portal="true"]');
  const primary = page.locator('[data-testid="mesh-point-primary"]');
  const second = page.locator('[data-testid="mesh-point-7"]');
  const dragBy = async (
    locator: typeof primary,
    delta: Readonly<{ x: number; y: number }>,
  ) => {
    const box = await locator.boundingBox();
    expect(box).not.toBeNull();
    const start = { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 };
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + delta.x, start.y + delta.y, { steps: 4 });
    await page.mouse.up();
  };

  await primary.click();
  await second.click({ modifiers: ["Shift"] });
  await expect(portal).toHaveAttribute("data-mesh-selected-count", "2");
  await expect(page.locator('[data-mesh-handle-direction]')).toHaveCount(0);

  const [primaryBefore, secondBefore] = await Promise.all([
    primary.boundingBox(),
    second.boundingBox(),
  ]);
  await dragBy(primary, { x: 38, y: 26 });
  const [primaryAfter, secondAfter] = await Promise.all([
    primary.boundingBox(),
    second.boundingBox(),
  ]);
  expect((primaryAfter?.x ?? 0) - (primaryBefore?.x ?? 0)).toBeCloseTo(38, 0);
  expect((primaryAfter?.y ?? 0) - (primaryBefore?.y ?? 0)).toBeCloseTo(26, 0);
  expect((secondAfter?.x ?? 0) - (secondBefore?.x ?? 0)).toBeCloseTo(38, 0);
  expect((secondAfter?.y ?? 0) - (secondBefore?.y ?? 0)).toBeCloseTo(26, 0);

  const canvasBox = await canvas.boundingBox();
  expect(canvasBox).not.toBeNull();
  await page.mouse.move(canvasBox!.x - 30, canvasBox!.y - 30);
  await page.mouse.down();
  await page.mouse.move(canvasBox!.x + 350, canvasBox!.y + 350, { steps: 5 });
  await expect(page.locator('[data-mesh-marquee="true"]')).toBeVisible();
  await page.mouse.up();
  await expect(portal).toHaveAttribute("data-mesh-selected-count", "4");

  await page.mouse.click(canvasBox!.x - 60, canvasBox!.y - 60);
  await page.locator('[data-testid="mesh-point-1"]').click();
  await page.keyboard.press("Delete");
  await expect(editor).toHaveAttribute("data-mesh-point-count", "8");
  await expect(portal).toHaveAttribute("data-mesh-selected-count", "0");

  await page.locator('[data-testid="mesh-point-5"]').click();
  await page.keyboard.press("Backspace");
  await expect(editor).toHaveAttribute("data-mesh-point-count", "6");
  await expect(
    page.getByRole("slider", { name: "Columns", exact: true }),
  ).toHaveAttribute("aria-valuenow", "3");

  const remainingPrimary = page.locator('[data-testid="mesh-point-primary"]');
  const remainingPrimaryBox = await remainingPrimary.boundingBox();
  expect(remainingPrimaryBox).not.toBeNull();
  const moveOutsideDelta = {
    x:
      canvasBox!.x -
      50 -
      (remainingPrimaryBox!.x + remainingPrimaryBox!.width / 2),
    y: -24,
  };
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("mesh.points", async (_control, currentPage) => {
      await dragCanvasHandle(
        currentPage,
        "mesh-point-primary",
        moveOutsideDelta,
        { requirementId: "mesh-canvas-handle", target: "mesh.points" },
      );
    }),
    {
      requirementId: "mesh-canvas-handle",
      selector: '[data-mesh-gradient-root="true"]',
    },
  );
  const outsideBox = await remainingPrimary.boundingBox();
  expect(outsideBox).not.toBeNull();
  expect(outsideBox!.x + outsideBox!.width / 2).toBeLessThan(canvasBox!.x);
  await expect(remainingPrimary).toBeVisible();
});

test("browser: double-clicking a mesh line inserts a ColorFlow divider", async ({
  page,
}) => {
  await page.goto("/");
  const session = await createToolcraftBrowserProofSession(page);
  const editor = page.locator('[data-mesh-gradient-handles="true"]');
  const columnsControl = page.getByRole("slider", { name: "Columns", exact: true });
  const doubleClickSegment = async (segment: string) => {
    const path = page.locator(`[data-mesh-grid-segment="${segment}"]`);
    const point = await path.evaluate((node) => {
      const curve = node as SVGPathElement;
      const local = curve.getPointAtLength(curve.getTotalLength() / 2);
      const matrix = curve.getScreenCTM();
      if (!matrix) throw new Error("Mesh curve must have a screen transform.");
      return {
        x: matrix.a * local.x + matrix.c * local.y + matrix.e,
        y: matrix.b * local.x + matrix.d * local.y + matrix.f,
      };
    });
    await page.mouse.dblclick(point.x, point.y, { delay: 40 });
  };

  await expect(editor).toHaveAttribute("data-mesh-point-count", "12");
  await expect(columnsControl).toHaveAttribute("aria-valuenow", "4");
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("mesh.points", async () => {
      await doubleClickSegment("horizontal-1-1");
    }),
    {
      requirementId: "mesh-line-insertion",
      selector: '[data-mesh-gradient-root="true"]',
    },
  );
  await expect(editor).toHaveAttribute("data-mesh-point-count", "15");
  await expect(columnsControl).toHaveAttribute("aria-valuenow", "5");
  await expect(page.locator('[data-mesh-grid-axis="horizontal"]')).toHaveCount(12);
  await expect(page.locator('[data-mesh-grid-axis="vertical"]')).toHaveCount(10);

  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(editor).toHaveAttribute("data-mesh-point-count", "12");
  await expect(columnsControl).toHaveAttribute("aria-valuenow", "4");
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await expect(editor).toHaveAttribute("data-mesh-point-count", "15");
  await expect(columnsControl).toHaveAttribute("aria-valuenow", "5");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(editor).toHaveAttribute("data-mesh-point-count", "12");
  await expect(columnsControl).toHaveAttribute("aria-valuenow", "4");

  await doubleClickSegment("vertical-0-1");
  await expect(editor).toHaveAttribute("data-mesh-point-count", "16");
  await expect(columnsControl).toHaveAttribute("aria-valuenow", "4");
  await expect(page.locator('[data-mesh-grid-axis="horizontal"]')).toHaveCount(12);
  await expect(page.locator('[data-mesh-grid-axis="vertical"]')).toHaveCount(12);
});
