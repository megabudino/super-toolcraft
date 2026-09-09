import { prepareGrassSession } from "./grass-test-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";

const canvasSelector = '[data-slot="grass-webgl-canvas"]';

function control(
  page: Parameters<typeof prepareGrassSession>[0],
  target: string,
) {
  return page.locator(`[data-toolcraft-control-target="${target}"]`);
}

async function setSlider(
  page: Parameters<typeof prepareGrassSession>[0],
  target: string,
  value: string,
): Promise<void> {
  const field = control(page, target);
  await field.getByRole("button", { name: /^Edit .+ value$/u }).click();
  const editor = field.getByRole("textbox");
  await editor.fill(value);
  await editor.press("Enter");
}

test("grass live PBR clumps preserve full authored export geometry", async ({
  page,
}) => {
  test.setTimeout(600_000);
  const session = await prepareGrassSession(page);
  const canvas = page.locator(canvasSelector);

  await expect(control(page, "preview.mode")).toHaveCount(0);
  await expect(control(page, "appearance.pbrEnabled")).toHaveCount(0);
  await expect(control(page, "interaction.cursorWindEnabled")).toHaveCount(0);
  await expect(canvas).toHaveAttribute("data-grass-pbr-enabled", "true");
  await expect(canvas).toHaveAttribute(
    "data-grass-preview-representation",
    "pbr-clumps",
  );
  await expect(canvas).toHaveAttribute(
    "data-grass-rendered-tall-blade-count",
    "12500",
  );
  await expect(canvas).toHaveAttribute(
    "data-grass-rendered-lawn-blade-count",
    "30000",
  );
  await expect(canvas).toHaveAttribute(
    "data-grass-rendered-lawn-clump-count",
    "5000",
  );
  await expect(canvas).toHaveAttribute(
    "data-grass-detailed-tall-blade-count",
    "6000",
  );
  await expect(canvas).toHaveAttribute(
    "data-grass-lightweight-tall-blade-count",
    "6500",
  );
  await expect(canvas).toHaveAttribute(
    "data-grass-detailed-lawn-blade-count",
    "12000",
  );
  await expect(canvas).toHaveAttribute(
    "data-grass-lightweight-lawn-blade-count",
    "18000",
  );

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("preview.bladeCount", async () => {
      await setSlider(page, "preview.bladeCount", "900");
    }),
    {
      requirementId: "grass.preview-blade-count",
      target: "preview.bladeCount",
      timeoutMs: 20_000,
    },
  );
  await expect(canvas).toHaveAttribute("data-grass-preview-blade-count", "900");
  await expect(canvas).toHaveAttribute(
    "data-grass-detailed-tall-blade-count",
    "900",
    { timeout: 30_000 },
  );
  await expect(canvas).toHaveAttribute(
    "data-grass-lightweight-tall-blade-count",
    "11600",
  );
  await expect(canvas).toHaveAttribute(
    "data-grass-rendered-tall-blade-count",
    "12500",
  );

  const geometryCounts = await canvas.evaluate((element) => ({
    authoredLawn: Number(element.dataset.grassLawnBladeCount),
    authoredTall: Number(element.dataset.grassTallBladeCount),
    renderedLawn: Number(element.dataset.grassRenderedLawnBladeCount),
    renderedTall: Number(element.dataset.grassRenderedTallBladeCount),
  }));
  expect(geometryCounts.authoredLawn).toBe(geometryCounts.renderedLawn);
  expect(geometryCounts.authoredTall).toBe(geometryCounts.renderedTall);
});
