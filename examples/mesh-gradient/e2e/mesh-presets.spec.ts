import { expect } from "@playwright/test";

import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { dragCanvasHandle } from "./canvas-handle-helpers";
import { pauseAtVisibleFrame } from "./mesh-editor-test-helpers";
import {
  expectToolcraftProductObservableToChange,
  getToolcraftProductObservableSnapshot,
} from "./product-observable-helpers";
import { test } from "./toolcraft-product-test";

const meshOutputSelector = '[data-mesh-gradient-root="true"]';

const presetFixtures = [
  { columns: 4, id: "aurora", name: "Aurora", points: 12 },
  { columns: 4, id: "sunset", name: "Sunset", points: 12 },
  { columns: 3, id: "lagoon", name: "Lagoon", points: 9 },
  { columns: 5, id: "sorbet", name: "Sorbet", points: 15 },
  { columns: 4, id: "ember", name: "Ember", points: 16 },
  { columns: 4, id: "glacier", name: "Glacier", points: 12 },
  { columns: 3, id: "forest", name: "Forest", points: 12 },
  { columns: 4, id: "plasma", name: "Plasma", points: 12 },
  { columns: 5, id: "dune", name: "Dune", points: 15 },
  { columns: 4, id: "nocturne", name: "Nocturne", points: 12 },
  { columns: 4, id: "citrus", name: "Citrus", points: 12 },
  { columns: 3, id: "iris", name: "Iris", points: 15 },
] as const;

test("browser: mesh preset gallery applies twelve rectangular mesh gradients", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.goto("/");
  await pauseAtVisibleFrame(page);
  await page.getByRole("button", { name: "Reset controls", exact: true }).click();

  const session = await createToolcraftBrowserProofSession(page);
  const presetControl = page.locator(
    '[data-toolcraft-control-target="mesh.preset"]',
  );
  const presetButtons = presetControl.getByRole("button");
  const output = page.locator(meshOutputSelector);
  const canvas = page.locator('[data-mesh-gradient-canvas="true"]');
  const pointOverlay = page.locator('[data-mesh-gradient-handles="true"]');
  const columnSlider = page
    .locator('[data-toolcraft-control-target="mesh.columns"]')
    .getByRole("slider");

  await expect(presetButtons).toHaveCount(12);
  for (const preset of presetFixtures) {
    await expect(
      presetControl.getByRole("button", { name: preset.name, exact: true }),
    ).toBeVisible();
  }

  const tileRatios = await presetButtons.evaluateAll((buttons) =>
    buttons.map((button) => {
      const rect = button.getBoundingClientRect();
      return rect.width / rect.height;
    }),
  );
  for (const ratio of tileRatios) {
    expect(ratio).toBeCloseTo(4 / 3, 1);
  }

  const firstPreset = presetFixtures[0];
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("mesh.preset", async (control, currentPage) => {
      await control
        .getByRole("button", { name: firstPreset.name, exact: true })
        .click();
      await expect(output).toHaveAttribute("data-mesh-preset", firstPreset.id);
      await expect(pointOverlay).toHaveAttribute(
        "data-mesh-point-count",
        String(firstPreset.points),
      );
      await expect(columnSlider).toHaveAttribute(
        "aria-valuenow",
        String(firstPreset.columns),
      );
      await expect(
        currentPage.getByRole("button", {
          name: firstPreset.name,
          exact: true,
        }),
      ).toHaveAttribute("aria-pressed", "true");
    }),
    { requirementId: "mesh-presets", selector: meshOutputSelector },
  );

  const seenOutput = new Set<string>();
  seenOutput.add(
    await getToolcraftProductObservableSnapshot(page, {
      selector: '[data-mesh-gradient-canvas="true"]',
    }),
  );

  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(output).toHaveAttribute("data-mesh-preset", "custom");
  await expect(
    presetControl.getByRole("button", { name: firstPreset.name, exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await expect(output).toHaveAttribute("data-mesh-preset", firstPreset.id);
  await expect(pointOverlay).toHaveAttribute(
    "data-mesh-point-count",
    String(firstPreset.points),
  );

  for (const preset of presetFixtures.slice(1)) {
    const previousFrame = await canvas.getAttribute("data-mesh-frame-signature");
    const button = presetControl.getByRole("button", {
      name: preset.name,
      exact: true,
    });
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(output).toHaveAttribute("data-mesh-preset", preset.id);
    await expect(pointOverlay).toHaveAttribute(
      "data-mesh-point-count",
      String(preset.points),
    );
    await expect(columnSlider).toHaveAttribute(
      "aria-valuenow",
      String(preset.columns),
    );
    if (previousFrame) {
      await expect(canvas).not.toHaveAttribute(
        "data-mesh-frame-signature",
        previousFrame,
      );
    }
    seenOutput.add(
      await getToolcraftProductObservableSnapshot(page, {
        selector: '[data-mesh-gradient-canvas="true"]',
      }),
    );
  }

  expect(seenOutput.size).toBe(12);

  const colorEditPreset = presetFixtures[1];
  const colorEditButton = presetControl.getByRole("button", {
    name: colorEditPreset.name,
    exact: true,
  });
  await colorEditButton.click();
  await expect(output).toHaveAttribute("data-mesh-preset", colorEditPreset.id);
  await expect(pointOverlay).toHaveAttribute(
    "data-mesh-point-count",
    String(colorEditPreset.points),
  );
  await expect(pointOverlay.locator("[data-mesh-point-handle]")).toHaveCount(
    colorEditPreset.points,
  );

  const beforeColorEditFrame = await canvas.getAttribute(
    "data-mesh-frame-signature",
  );
  const colorInputs = page
    .locator('[data-toolcraft-control-target="mesh.colors"]')
    .getByRole("textbox", { name: "hex" });
  await colorInputs.first().fill("#FFFFFF");
  await colorInputs.first().press("Enter");

  await expect(output).toHaveAttribute("data-mesh-preset", "custom");
  await expect(pointOverlay).toHaveAttribute(
    "data-mesh-point-count",
    String(colorEditPreset.points),
  );
  await expect(pointOverlay.locator("[data-mesh-point-handle]")).toHaveCount(
    colorEditPreset.points,
  );
  if (beforeColorEditFrame) {
    await expect(canvas).not.toHaveAttribute(
      "data-mesh-frame-signature",
      beforeColorEditFrame,
    );
  }

  await colorEditButton.click();
  await expect(output).toHaveAttribute("data-mesh-preset", colorEditPreset.id);

  await dragCanvasHandle(page, "mesh-point-primary", { x: 24, y: -18 });
  await expect(output).toHaveAttribute("data-mesh-preset", "custom");
  await expect(presetControl.locator('button[aria-pressed="true"]')).toHaveCount(0);
});
