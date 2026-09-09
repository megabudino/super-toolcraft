import { expect, test } from "./toolcraft-product-test";

import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";

const outputSelector = '[data-toolcraft-product-output="micrographics"]';

const coverPresets = [
  {
    label: "Runner",
    src: "/covers/runner-close-crop.jpg",
  },
  {
    label: "Profile",
    src: "/covers/side-profile.jpg",
  },
  {
    label: "Fitness",
    src: "/covers/fitness-explore.jpg",
  },
  {
    label: "Pilates",
    src: "/covers/pilates-group.jpg",
  },
  {
    label: "Mesh",
    src: "/covers/mesh.jpg",
  },
  {
    label: "Chaos",
    src: "/covers/chaos-blue.jpg",
  },
  {
    label: "Paper",
    src: "/covers/cream-paper.jpg",
  },
  {
    label: "Wireframe",
    src: "/covers/wireframe-landscape.jpg",
  },
] as const;

test("browser: sports cover presets update poster", async ({ page }) => {
  await page.goto("/");
  const session = await createToolcraftBrowserProofSession(page);
  const field = await getToolcraftControlFieldByTarget(page, "source.preset");
  const posterCover = page.locator(
    `${outputSelector} [data-micrographics-cover-preset]`,
  );
  const presetButtons = field.locator("button[data-selected]");

  await expect(presetButtons).toHaveCount(coverPresets.length);
  expect(
    await presetButtons.evaluateAll((buttons) =>
      buttons.map((button) => button.getAttribute("aria-label")),
    ),
  ).toEqual(coverPresets.map((preset) => preset.label));

  for (const preset of [
    coverPresets[1],
    coverPresets[2],
    coverPresets[3],
    coverPresets[4],
    coverPresets[5],
    coverPresets[6],
    coverPresets[7],
    coverPresets[0],
  ]) {
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction("source.preset", async (controlField) => {
        await controlField
          .getByRole("button", { name: preset.label, exact: true })
          .click();
      }),
      { requirementId: "source-preset", selector: outputSelector },
    );
    await expect(posterCover).toHaveAttribute("href", preset.src);
    await expect(
      field.getByRole("button", { name: preset.label, exact: true }),
    ).toHaveAttribute("data-selected", "true");
  }
});
