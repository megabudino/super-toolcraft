import { expect, test } from "./toolcraft-product-test";

import {
  micrographTemplates,
  templateTier,
  type MicrographTemplateTier,
} from "../src/app/template-catalog";
import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectToolcraftPersistenceState } from "./browser-state-evidence-helpers";
import {
  dragCanvasHandle,
  expectCanvasHandlesUseToolcraftVisualLanguage,
  expectExportExcludesCanvasHandles,
} from "./canvas-handle-helpers";
import {
  captureMicrographicsExport,
  chooseMicrographicsOption,
  inspectMicrographicsImage,
} from "./micrographics-browser-helpers";
import { expectToolcraftDiscreteSliderMarkers } from "./performance-control-layout-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";

const outputSelector = '[data-toolcraft-product-output="micrographics"]';

test.setTimeout(1_200_000);

test("browser: direct micrographics placement", async ({ page }) => {
  await page.goto("/");
  const zoomOut = page.getByRole("button", { name: "Zoom out", exact: true });
  await zoomOut.click();
  await zoomOut.click();
  await zoomOut.click();
  await zoomOut.click();
  const session = await createToolcraftBrowserProofSession(page);
  await expectToolcraftDiscreteSliderMarkers(
    page,
    "composition.count",
    "canvas-element-transform",
  );
  await expectToolcraftDiscreteSliderMarkers(
    page,
    "composition.count",
    "canvas-content-edit",
  );
  const poster = page.locator(outputSelector);
  const runtimeCanvas = page.locator('[data-slot="toolcraft-runtime-canvas"]');
  expect(
    await poster.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        borderStyle: style.borderStyle,
        boxShadow: style.boxShadow,
        outlineStyle: style.outlineStyle,
      };
    }),
  ).toEqual({
    borderStyle: "none",
    boxShadow: "none",
    outlineStyle: "none",
  });
  const firstElement = poster.locator('[data-element-index="0"]');
  const initialCount = await poster
    .locator("[data-element-index]")
    .count();

  await firstElement.click();
  await expectCanvasHandlesUseToolcraftVisualLanguage(page);

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("composition.count", async () => {
      await dragCanvasHandle(
        page,
        "micrographics-selection-handle",
        { x: 48, y: 32 },
        {
          requirementId: "canvas-element-transform",
          target: "composition.count",
        },
      );
    }),
    { requirementId: "canvas-element-transform", selector: outputSelector },
  );

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("composition.count", async () => {
      const box = await firstElement.boundingBox();
      if (!box) throw new Error("Could not measure the first micrographics element.");
      await page.mouse.move(box.x + 3, box.y + 3);
      await page.mouse.down();
      await page.mouse.move(box.x + 67, box.y + 47, {
        steps: 10,
      });
      await page.mouse.up();
    }),
    { requirementId: "canvas-element-transform", selector: outputSelector },
  );

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("composition.count", async () => {
      await firstElement
        .locator("[data-micrographics-element-hit-area]")
        .click({ position: { x: 4, y: 4 } });
      const textLine = firstElement.locator("text[data-text-index]").first();
      await textLine.dblclick();
      const editor = poster.locator("input");
      await expect(editor).toBeVisible();
      await editor.fill("MG-EDITED-88");
      await editor.press("Enter");
      await expect(editor).toHaveCount(0);
    }),
    { requirementId: "canvas-content-edit", selector: outputSelector },
  );
  await expect(
    poster.locator("text", { hasText: "MG-EDITED-88" }).first(),
  ).toBeVisible();

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("composition.count", async () => {
      await poster.press("Delete");
    }),
    { requirementId: "canvas-element-transform", selector: outputSelector },
  );
  await expect(poster.locator("[data-element-index]")).toHaveCount(initialCount - 1);

  const templateField = await getToolcraftControlFieldByTarget(
    page,
    "library.template",
  );
  let selectedTemplateTier: MicrographTemplateTier = "mega";
  const selectTemplateTier = async (
    tier: MicrographTemplateTier,
  ): Promise<void> => {
    if (selectedTemplateTier === tier) {
      return;
    }
    await templateField
      .getByRole("group", { name: "Template set", exact: true })
      .getByRole("button", {
        name: tier === "simple" ? "Simple" : "Mega",
        exact: true,
      })
      .click();
    selectedTemplateTier = tier;
  };
  const posterBox = await poster.boundingBox();
  if (!posterBox) throw new Error("Could not measure the micrographics poster.");
  await selectTemplateTier("simple");
  const radarButton = templateField.getByRole("button", {
    name: "Radar template",
    exact: true,
  });

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("library.template", async () => {
      await radarButton.click();
      await expect(poster).toHaveAttribute("data-placement-mode", "template");
      await page.mouse.click(
        posterBox.x + posterBox.width * 0.24,
        posterBox.y + posterBox.height * 0.24,
      );
      await expect(poster).toHaveAttribute("data-placement-mode", "select");
    }),
    { requirementId: "library-template", selector: outputSelector },
  );
  await expect(poster.locator('[data-template-id="radar"]').last()).toBeVisible();
  await expect(radarButton).toHaveAttribute("aria-pressed", "false");

  const barcodeButton = templateField.getByRole("button", {
    name: "Barcode template",
    exact: true,
  });
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("library.template", async () => {
      const barcodeBox = await barcodeButton.boundingBox();
      const runtimeBox = await runtimeCanvas.boundingBox();
      if (!barcodeBox || !runtimeBox) {
        throw new Error("Could not measure the template drag surfaces.");
      }
      const canvasMarginPoint = [
        { x: runtimeBox.x + 8, y: runtimeBox.y + 8 },
        { x: runtimeBox.x + runtimeBox.width - 8, y: runtimeBox.y + 8 },
        { x: runtimeBox.x + 8, y: runtimeBox.y + runtimeBox.height - 8 },
      ].find(
        ({ x, y }) =>
          x < posterBox.x ||
          x > posterBox.x + posterBox.width ||
          y < posterBox.y ||
          y > posterBox.y + posterBox.height,
      );
      if (!canvasMarginPoint) {
        throw new Error("Could not locate a runtime-canvas margin outside the poster.");
      }
      await page.mouse.move(
        barcodeBox.x + barcodeBox.width / 2,
        barcodeBox.y + barcodeBox.height / 2,
      );
      await page.mouse.down();
      await page.mouse.move(canvasMarginPoint.x, canvasMarginPoint.y, { steps: 12 });
      await expect(runtimeCanvas).toHaveAttribute("data-drag-over", "false");
      await page.mouse.move(
        posterBox.x + posterBox.width * 0.72,
        posterBox.y + posterBox.height * 0.26,
        { steps: 12 },
      );
      await expect(runtimeCanvas).toHaveAttribute("data-drag-over", "false");
      await page.mouse.up();
    }),
    { requirementId: "canvas-template-placement", selector: outputSelector },
  );
  await expect(poster.locator('[data-template-id="barcode"]').last()).toBeVisible();
  await expect(barcodeButton).toHaveAttribute("aria-pressed", "false");
  await expect(runtimeCanvas).toHaveAttribute("data-drag-over", "false");

  for (const [index, template] of micrographTemplates.entries()) {
    if (template.id === "radar" || template.id === "barcode") {
      continue;
    }
    await selectTemplateTier(templateTier(template.id));
    const templateButton = templateField.getByRole("button", {
      name: `${template.label} template`,
      exact: true,
    });
    await templateButton.click();
    const column = index % 3;
    const row = index % 4;
    const startX = posterBox.x + posterBox.width * (0.16 + column * 0.2);
    const startY = Math.max(
      80,
      posterBox.y + posterBox.height * (0.28 + row * 0.12),
    );
    await page.mouse.click(startX, startY);
    await expect(
      poster.locator(`[data-template-id="${template.id}"]`).last(),
    ).toBeVisible();
    await expect(templateButton).toHaveAttribute("aria-pressed", "false");
  }
});

test("micrographics export excludes editing handles", async ({ page }) => {
  await page.goto("/");
  const zoomOut = page.getByRole("button", { name: "Zoom out", exact: true });
  await zoomOut.click();
  await zoomOut.click();
  await zoomOut.click();
  await zoomOut.click();
  const poster = page.locator(outputSelector);
  const resolution = await getToolcraftControlFieldByTarget(
    page,
    "export.image.resolution",
  );
  await chooseMicrographicsOption(page, resolution, "2K");
  await poster.locator('[data-element-index="0"]').click();
  await expect(page.locator("[data-toolcraft-canvas-handle]")).not.toHaveCount(0);
  await expectExportExcludesCanvasHandles(
    page,
    () => captureMicrographicsExport(page),
    (artifact) => inspectMicrographicsImage(page, artifact),
    {
      requirementId: "canvas-element-transform",
      target: "controls.setValue",
    },
  );
});

test("browser: micrographics persistence reload", async ({ page }) => {
  await page.goto("/");
  const session = await createToolcraftBrowserProofSession(page);
  const seedSignature = session.observe(
    (root) =>
      root
        .querySelector('[data-micrographics-layer="foreground"]')
        ?.childElementCount?.toString() ?? "",
  );
  const mutate = session.controlAction("composition.count", async (field) => {
    const slider = field.getByRole("slider").first();
    await slider.focus();
    for (let step = 0; step < 4; step += 1) {
      await slider.press("ArrowRight");
    }
  });
  await expectToolcraftPersistenceState(seedSignature, mutate, session.reload(), "12", {
    requirementId: "persistence-reload",
  });
});
