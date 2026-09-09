import { expect, test } from "./toolcraft-product-test";

import { micrographKits } from "../src/app/template-catalog";
import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectNoForbiddenCanvasUi } from "./canvas-handle-helpers";
import {
  expectToolcraftDiscreteSliderMarkers,
  expectToolcraftSegmentedControlCellsPreservePadding,
} from "./performance-control-helpers";
import {
  chooseMicrographicsOption,
  dragMicrographicsSliderTargetToValue,
} from "./micrographics-browser-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";

const outputSelector = '[data-toolcraft-product-output="micrographics"]';

test.setTimeout(180_000);

async function setColor(
  field: Awaited<ReturnType<typeof getToolcraftControlFieldByTarget>>,
  value: string,
): Promise<void> {
  const input = field.getByRole("textbox", { name: /hex$/iu });
  await input.fill(value);
  await input.press("Enter");
}

test("browser: micrographics controls update poster", async ({ page }) => {
  await page.goto("/");
  const session = await createToolcraftBrowserProofSession(page);

  await expect(
    page.getByRole("button", { name: "Collapse Format section", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText("Aspect ratio", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Canvas width", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Canvas height", { exact: true }).first()).toBeVisible();

  await expectNoForbiddenCanvasUi(page, {
    allowedProductText: [/./u],
  });
  await expectToolcraftDiscreteSliderMarkers(
    page,
    "composition.count",
    "composition-count",
  );
  await expectToolcraftSegmentedControlCellsPreservePadding(page, "Random type", {
    requirementId: "composition-template-tier",
    target: "composition.templateTier",
  });

  const sliderChecks = [
    ["composition.seed", "composition-seed", 604],
    ["composition.count", "composition-count", 12],
    ["elements.scale", "elements-scale", 132],
    ["elements.opacity", "elements-opacity", 62],
    ["ink.glow", "ink-glow", 55],
  ] as const;
  for (const [target, requirementId, value] of sliderChecks) {
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction(target, async () => {
        await dragMicrographicsSliderTargetToValue(page, target, value);
      }),
      {
        message: `Control ${requirementId} should change poster output.`,
        requirementId,
        selector: outputSelector,
      },
    );
  }

  for (const kit of micrographKits) {
    if (kit.id === "full") {
      continue;
    }
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction("composition.kit", async (field) => {
        await chooseMicrographicsOption(page, field, kit.label);
      }),
      { requirementId: "composition-kit", selector: outputSelector },
    );
  }
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("composition.kit", async (field) => {
      await chooseMicrographicsOption(page, field, "Full kit");
    }),
    { requirementId: "composition-kit", selector: outputSelector },
  );

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("composition.layout", async (field) => {
      await field.getByRole("button", { name: "Shuffle", exact: true }).click();
    }),
    { requirementId: "composition-commands", selector: outputSelector },
  );

  for (const label of ["Simple", "Mega", "Both"] as const) {
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction("composition.templateTier", async (field) => {
        await field.getByRole("button", { name: label, exact: true }).click();
      }),
      { requirementId: "composition-template-tier", selector: outputSelector },
    );
  }

  const poster = page.locator(outputSelector);
  const zoomOut = page.getByRole("button", { name: "Zoom out", exact: true });
  await zoomOut.click();
  await zoomOut.click();
  await zoomOut.click();
  await zoomOut.click();
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("composition.layout", async () => {
      const element = poster.locator('[data-element-index="0"]');
      const box = await element.boundingBox();
      if (!box) throw new Error("Could not measure the first micrographics element.");
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 48, box.y + box.height / 2 + 36, {
        steps: 8,
      });
      await page.mouse.up();
    }),
    { requirementId: "composition-commands", selector: outputSelector },
  );
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("composition.layout", async (field) => {
      await field.getByRole("button", { name: "Reset layout", exact: true }).click();
    }),
    { requirementId: "composition-commands", selector: outputSelector },
  );

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("ink.color", async (field) => setColor(field, "#E6FF4A")),
    { requirementId: "ink-color", selector: outputSelector },
  );

  const paletteElement = poster.locator("[data-element-index]").last();
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("composition.layout", async () => {
      await paletteElement.click();
      await page.getByTestId("micrographics-palette-swatch-1").click();
    }),
    { requirementId: "canvas-color-edit", selector: outputSelector },
  );

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("palette.colors", async (_field, currentPage) => {
      const secondSwatch = currentPage
        .getByRole("textbox", { name: "hex", exact: true })
        .nth(1);
      await secondSwatch.fill("#6A5CFF");
      await secondSwatch.press("Enter");
      await paletteElement.click();
      await page.getByTestId("micrographics-palette-swatch-1").click();
    }),
    { requirementId: "palette-colors", selector: outputSelector },
  );

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("ink.color", async (field) => {
      await setColor(field, "#F2F2F2");
      const recolored = await paletteElement
        .locator('path[stroke="#6A5CFF"], path[fill="#6A5CFF"]')
        .count();
      if (recolored === 0) {
        throw new Error(
          "The individually painted element must keep its palette color after a Global Color change.",
        );
      }
    }),
    { requirementId: "ink-color", selector: outputSelector },
  );

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("appearance.background", async (field) =>
      setColor(field, "#10283A"),
    ),
    { requirementId: "background-color", selector: outputSelector },
  );

});
