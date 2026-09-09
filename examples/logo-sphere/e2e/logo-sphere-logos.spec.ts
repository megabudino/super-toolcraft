import { expectToolcraftMediaLifecycle } from "./browser-state-evidence-helpers";
import { createLogoSphereProofSession } from "./logo-sphere-test-helpers";
import { expect, test } from "./toolcraft-product-test";

test.setTimeout(120_000);

type LogoMediaObservation = {
  itemIds: readonly string[];
  outputSignature: string;
};

type DefaultSetObservation = {
  attached: boolean;
  itemIds: readonly string[];
  outputSignature: string;
  readyCount: number;
};

function observeDefaultSet(root: HTMLElement): DefaultSetObservation {
  const attached =
    root.querySelector(
      '[data-toolcraft-control-target="logos.defaults"] button[aria-label^="Remove"]',
    ) !== null;
  const readyCount = Number(
    root.querySelector<HTMLCanvasElement>(
      'canvas[data-toolcraft-product-output="logo-sphere"]',
    )?.dataset.readyImageCount ?? 0,
  );

  return {
    attached,
    itemIds: attached ? ["supplied-svg-logo-set.svg"] : [],
    outputSignature: `${attached}:${readyCount}`,
    readyCount,
  };
}

function observeLogoMedia(root: HTMLElement): LogoMediaObservation {
  const itemIds = Array.from(
    root.querySelectorAll<HTMLImageElement>(
      '[data-toolcraft-control-target="logos.sources"] img[alt]',
    ),
    (item) => item.alt,
  ).filter(Boolean);
  const canvas = root.querySelector<HTMLCanvasElement>(
    'canvas[data-toolcraft-product-output="logo-sphere"]',
  );
  return {
    itemIds,
    outputSignature: `${canvas?.dataset.readyImageCount ?? "missing"}:${
      itemIds[0] ?? "empty"
    }`,
  };
}

test("browser: included SVG set removes and resets vector fallback", async ({ page }) => {
  const session = await createLogoSphereProofSession(page);

  await expectToolcraftMediaLifecycle(
    session.observe(observeDefaultSet),
    session.controlAction("logos.defaults", async (control) => {
      await control.getByRole("button", { name: /^Remove / }).click();
    }),
    {
      attached: false,
      itemIds: [],
      outputSignature: "false:0",
      readyCount: 0,
    },
    {
      requirementId: "logos.default-set",
      stabilityIntervalMs: 0,
    },
  );

  await page.getByRole("button", { name: "Reset Logos section" }).click();
  await expect(
    page.locator('canvas[data-toolcraft-product-output="logo-sphere"]'),
  ).toHaveAttribute("data-ready-image-count", "30", { timeout: 20_000 });
});

test(
  "browser: default logo media updates preview order and transforms",
  async ({ page }) => {
    const session = await createLogoSphereProofSession(page);
    const encodedPng = await page.evaluate(() => {
      const canvas = document.createElement("canvas");
      canvas.width = 96;
      canvas.height = 96;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Media proof requires Canvas 2D.");
      context.fillStyle = "#ff3366";
      context.fillRect(0, 0, 96, 96);
      context.fillStyle = "#ffffff";
      context.fillRect(24, 24, 48, 48);
      return canvas.toDataURL("image/png").split(",")[1]!;
    });
    await page
      .locator('[data-toolcraft-control-target="logos.sources"] input[type="file"]')
      .setInputFiles({
        buffer: Buffer.from(encodedPng, "base64"),
        mimeType: "image/png",
        name: "extra-logo.png",
      });
    await expect(
      page.getByRole("img", { name: "extra-logo.png" }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(
      page.locator('canvas[data-toolcraft-product-output="logo-sphere"]'),
    ).toHaveAttribute("data-ready-image-count", "1", { timeout: 20_000 });

    await expectToolcraftMediaLifecycle(
      session.observe(observeLogoMedia),
      session.controlAction("logos.sources", async (_control, currentPage) => {
        await currentPage
          .getByRole("button", { name: "Remove extra-logo.png" })
          .click();
      }),
      {
        itemIds: [],
        outputSignature: "30:empty",
      },
      {
        requirementId: "logos.media",
        stabilityIntervalMs: 0,
      },
    );
  },
);
