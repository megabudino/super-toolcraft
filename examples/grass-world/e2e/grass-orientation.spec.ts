import type { Page } from "@playwright/test";

import { expectExportExcludesCanvasHandles } from "./canvas-handle-helpers";
import {
  expectToolcraftOrientationAxisDrag,
  expectToolcraftOrientationAxisSnap,
  expectToolcraftOrientationCanvasMissPan,
  expectToolcraftOrientationModelDrag,
  expectToolcraftOrientationUndoReset,
  type ToolcraftOrientationBrowserObservation,
} from "./browser-orientation-gizmo-evidence-helpers";
import { readToolcraftBrowserObservation } from "./browser-proof-session";
import {
  chooseGrassOption,
  inspectGrassImage,
  prepareGrassSession,
  readGrassArtifact,
} from "./grass-test-helpers";
import { expect, test } from "./toolcraft-product-test";

const requirementId = "grass.view-orientation";
const orientationTarget = "view.orientation";

async function findGizmoAxisPoint(
  page: Page,
  axis: "+x" | "+y" | "+z" | "-x" | "-y" | "-z",
): Promise<{ x: number; y: number }> {
  const gizmo = page.getByTestId("toolcraft-orientation-gizmo");
  await expect(gizmo).toBeVisible();
  const box = await gizmo.boundingBox();
  if (!box) throw new Error("Orientation gizmo could not be measured.");

  for (let localY = 5; localY <= box.height - 5; localY += 4) {
    for (let localX = 5; localX <= box.width - 5; localX += 4) {
      const x = box.x + localX;
      const y = box.y + localY;
      await page.mouse.move(x, y);
      if ((await gizmo.getAttribute("data-hovered-axis")) === axis) {
        return { x, y };
      }
    }
  }
  throw new Error(`Could not find the ${axis} orientation endpoint.`);
}

async function resetGrassControls(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Reset controls" }).click();
  await expect(page.getByTestId("toolcraft-orientation-gizmo")).toHaveAttribute(
    "data-toolcraft-orientation-pose",
    /0\.019943/u,
  );
}

async function findCanvasMissPoint(
  page: Page,
): Promise<{ x: number; y: number }> {
  const viewport = page.locator('[data-slot="toolcraft-runtime-canvas"]');
  const world = page.locator("[data-toolcraft-canvas-world]");
  const gizmo = page.getByTestId("toolcraft-orientation-gizmo");
  const box = await viewport.boundingBox();
  if (!box) throw new Error("Canvas viewport could not be measured.");
  const candidates: { x: number; y: number }[] = [];
  for (let y = box.y + 12; y < box.y + box.height - 12; y += 48) {
    for (let x = box.x + 12; x < box.x + box.width - 12; x += 64) {
      candidates.push({ x, y });
    }
  }

  for (const { x, y } of candidates) {
    const belongsToCanvas = await page.evaluate(
      ({ clientX, clientY }) =>
        Boolean(
          document
            .elementFromPoint(clientX, clientY)
            ?.closest(
              '[data-slot="grass-live-preview"], [data-slot="toolcraft-runtime-canvas"]',
            ),
        ),
      { clientX: x, clientY: y },
    );
    if (!belongsToCanvas) continue;

    const poseBefore = await gizmo.getAttribute(
      "data-toolcraft-orientation-pose",
    );
    const offsetBefore = {
      x: Number(await world.getAttribute("data-toolcraft-canvas-offset-x")),
      y: Number(await world.getAttribute("data-toolcraft-canvas-offset-y")),
    };
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 20, y + 12, { steps: 4 });
    await page.mouse.up();
    await page.waitForTimeout(80);
    const poseAfter = await gizmo.getAttribute(
      "data-toolcraft-orientation-pose",
    );
    const offsetAfter = {
      x: Number(await world.getAttribute("data-toolcraft-canvas-offset-x")),
      y: Number(await world.getAttribute("data-toolcraft-canvas-offset-y")),
    };
    const poseChanged = poseAfter !== poseBefore;
    const offsetChanged =
      offsetAfter.x !== offsetBefore.x || offsetAfter.y !== offsetBefore.y;

    if (poseChanged) await resetGrassControls(page);
    if (offsetChanged) {
      await page.getByRole("button", { name: "Center canvas" }).click();
      await expect(world).toHaveAttribute(
        "data-toolcraft-canvas-offset-x",
        "0",
      );
      await expect(world).toHaveAttribute(
        "data-toolcraft-canvas-offset-y",
        "0",
      );
    }
    if (!poseChanged && offsetChanged) return { x, y };
  }
  throw new Error(
    "No geometry miss point was found on the visible canvas background.",
  );
}

test("grass orientation gizmo and direct field orbit share canvas ownership", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const session = await prepareGrassSession(page);
  const observation = session.observe<ToolcraftOrientationBrowserObservation>(
    (root) => {
      const output = root.querySelector<HTMLElement>(
        '[data-slot="grass-live-preview"]',
      );
      const gizmo = root.querySelector<HTMLElement>(
        '[data-testid="toolcraft-orientation-gizmo"]',
      );
      const world = root.querySelector<HTMLElement>(
        "[data-toolcraft-canvas-world]",
      );
      if (!output || !gizmo || !world) {
        throw new Error(
          "Grass orientation proof requires output, gizmo, and canvas world.",
        );
      }
      return {
        outputSignature: output.dataset.grassFrameSignature ?? "",
        pose: JSON.parse(
          output.dataset.grassOrientation ??
            gizmo.getAttribute("data-toolcraft-orientation-pose") ??
            "null",
        ),
        poseTarget:
          gizmo.getAttribute("data-toolcraft-orientation-target") ?? "",
        viewportOffsetX: Number(
          world.getAttribute("data-toolcraft-canvas-offset-x") ?? 0,
        ),
        viewportOffsetY: Number(
          world.getAttribute("data-toolcraft-canvas-offset-y") ?? 0,
        ),
      };
    },
  );
  const options = {
    requirementId,
    stabilityIntervalMs: 80,
    target: orientationTarget,
    timeoutMs: 15_000,
  } as const;

  await expectToolcraftOrientationAxisDrag(
    observation,
    session.action(async (currentPage) => {
      const point = await findGizmoAxisPoint(currentPage, "+x");
      const gizmoBox = await currentPage
        .getByTestId("toolcraft-orientation-gizmo")
        .boundingBox();
      if (!gizmoBox)
        throw new Error("Orientation gizmo could not be measured.");
      const centerX = gizmoBox.x + gizmoBox.width / 2;
      const centerY = gizmoBox.y + gizmoBox.height / 2;
      await currentPage.mouse.move(point.x, point.y);
      await currentPage.mouse.down();
      await currentPage.mouse.move(
        point.x + Math.sign(centerX - point.x || 1) * 14,
        point.y + Math.sign(centerY - point.y || 1) * 9,
        { steps: 8 },
      );
      await currentPage.mouse.up();
    }),
    options,
  );

  await resetGrassControls(page);
  await expectToolcraftOrientationAxisSnap(
    observation,
    session.action(async (currentPage) => {
      const point = await findGizmoAxisPoint(currentPage, "+x");
      await currentPage.mouse.click(point.x, point.y);
      await currentPage.waitForTimeout(750);
    }),
    "+x",
    options,
  );

  await resetGrassControls(page);
  const baseline = await readToolcraftBrowserObservation(observation);
  await expectToolcraftOrientationModelDrag(
    observation,
    session.action(async (currentPage) => {
      const output = currentPage.locator('[data-slot="grass-live-preview"]');
      const box = await output.boundingBox();
      if (!box) throw new Error("Grass output could not be measured.");
      const startX = box.x + box.width * 0.5;
      const startY = box.y + box.height * 0.56;
      await currentPage.mouse.move(startX, startY);
      await currentPage.mouse.down();
      await currentPage.mouse.move(startX + 72, startY - 28, { steps: 10 });
      await currentPage.mouse.up();
    }),
    options,
  );
  const changed = await readToolcraftBrowserObservation(observation);
  await expectToolcraftOrientationUndoReset(
    observation,
    session.action(async (currentPage) => {
      await currentPage.getByRole("button", { name: "Undo" }).click();
    }),
    session.action(async (currentPage) => {
      await currentPage.getByRole("button", { name: "Redo" }).click();
    }),
    session.action(async (currentPage) => {
      await currentPage.getByRole("button", { name: "Reset controls" }).click();
    }),
    baseline,
    changed,
    options,
  );

  const canvasMissPoint = await findCanvasMissPoint(page);
  await expectToolcraftOrientationCanvasMissPan(
    observation,
    session.action(async (currentPage) => {
      const startX = canvasMissPoint.x;
      const startY = canvasMissPoint.y;
      await currentPage.mouse.move(startX, startY);
      await currentPage.mouse.down();
      await currentPage.mouse.move(startX + 48, startY + 32, { steps: 8 });
      await currentPage.mouse.up();
    }),
    options,
  );
});

test("grass export excludes orientation gizmo", async ({ page }) => {
  test.setTimeout(120_000);
  await prepareGrassSession(page);
  await chooseGrassOption(
    page.locator('[data-toolcraft-control-target="export.image.resolution"]'),
    page,
    "2K",
  );
  await expectExportExcludesCanvasHandles(
    page,
    () => readGrassArtifact(page, "Export PNG"),
    (artifact) => inspectGrassImage(page, artifact),
    {
      requirementId: `${requirementId}#export-clean`,
      target: orientationTarget,
    },
  );
});
