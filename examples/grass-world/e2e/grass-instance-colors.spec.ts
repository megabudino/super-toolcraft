import type { Page } from "@playwright/test";

import { expectToolcraftConditionalControlVisibility } from "./browser-conditional-output-evidence-helpers";
import { runToolcraftBrowserAction } from "./browser-proof-session";
import {
  grassLayerVisibilityTargets,
  prepareGrassSession,
  setGrassLayerVisibility,
} from "./grass-test-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";

const layers = [
  {
    browserTestName: "Tall Grass instance colors distribute by Field seed",
    enabledTarget: "grass.enabled",
    id: "tall",
    owner: "appearance",
    seedTarget: "field.seed",
  },
  {
    browserTestName: "Lawn instance colors distribute by Cover seed",
    enabledTarget: "lawn.enabled",
    id: "lawn",
    owner: "lawn",
    seedTarget: "lawn.seed",
  },
] as const;

async function setSliderEdge(page: Page, target: string, key: "End" | "Home") {
  const slider = page
    .locator(`[data-toolcraft-control-target="${target}"]`)
    .getByRole("slider");
  await slider.focus();
  await slider.press(key);
}

for (const layer of layers) {
  test(layer.browserTestName, async ({ page }) => {
    test.setTimeout(600_000);
    const shaderErrors: string[] = [];
    page.on("console", (message) => {
      if (
        message.type() === "error" &&
        /shader|webglprogram|validate_status/iu.test(message.text())
      ) {
        shaderErrors.push(message.text());
      }
    });
    const session = await prepareGrassSession(page);
    const canvas = page.locator('[data-slot="grass-webgl-canvas"]');
    await expect(canvas).toHaveAttribute("data-grass-frame-signature", /.+/u);

    for (const target of grassLayerVisibilityTargets) {
      await setGrassLayerVisibility(
        page,
        target,
        target === layer.enabledTarget,
      );
    }

    for (const suffix of [
      "instanceColor1",
      "instanceColor2",
      "instanceColor3",
      "instanceColorWeight1",
      "instanceColorWeight2",
      "instanceColorWeight3",
    ] as const) {
      const index = suffix.endsWith("1") ? 1 : suffix.endsWith("2") ? 2 : 3;
      const isWeight = suffix.includes("Weight");
      await expectToolcraftConditionalControlVisibility(
        session,
        session.controlAction(layer.enabledTarget, async (field) => {
          await field.getByRole("switch").click();
        }),
        session.controlAction(layer.enabledTarget, async (field) => {
          await field.getByRole("switch").click();
        }),
        {
          requirementId: `grass.instance-color-${isWeight ? "weight-" : ""}${layer.id}-${index}`,
          target: `${layer.owner}.${suffix}`,
          timeoutMs: 15_000,
        },
      );
    }

    for (const [index, color] of [
      [1, "#ff3030"],
      [2, "#30ff4b"],
      [3, "#3060ff"],
    ] as const) {
      const target = `${layer.owner}.instanceColor${index}`;
      await expectToolcraftProductObservableToChange(
        session,
        session.controlAction(target, async (field) => {
          const textbox = field.getByRole("textbox");
          await textbox.fill(color);
          await textbox.press("Enter");
        }),
        {
          requirementId: `grass.instance-color-${layer.id}-${index}`,
          timeoutMs: 20_000,
        },
      );
    }

    for (const [index, key] of [
      [1, "End"],
      [2, "Home"],
      [3, "Home"],
    ] as const) {
      const target = `${layer.owner}.instanceColorWeight${index}`;
      await expectToolcraftProductObservableToChange(
        session,
        session.controlAction(target, async (_field, currentPage) => {
          await setSliderEdge(currentPage, target, key);
        }),
        {
          requirementId: `grass.instance-color-weight-${layer.id}-${index}`,
          timeoutMs: 20_000,
        },
      );
    }

    await setSliderEdge(page, `${layer.owner}.instanceColorWeight2`, "End");
    await setSliderEdge(page, `${layer.owner}.instanceColorWeight3`, "End");
    await expectToolcraftProductObservableToChange(
      page,
      async () => setSliderEdge(page, layer.seedTarget, "End"),
      { timeoutMs: 20_000 },
    );

    const settings = JSON.parse(
      (await canvas.getAttribute("data-grass-settings-signature")) ?? "{}",
    ) as Record<string, unknown>;
    const ownerSettings = settings[layer.owner as "appearance" | "lawn"] as {
      instanceColors: { colors: string[]; weights: number[] };
    };
    expect(ownerSettings.instanceColors.colors).toEqual([
      "#FF3030",
      "#30FF4B",
      "#3060FF",
    ]);
    expect(ownerSettings.instanceColors.weights).toEqual([1 / 3, 1 / 3, 1 / 3]);
    expect(shaderErrors).toEqual([]);
  });
}
