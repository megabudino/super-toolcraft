import type { Page } from "@playwright/test";

import { expectToolcraftPersistenceState } from "./browser-state-evidence-helpers";
import { createLogoSphereProofSession } from "./logo-sphere-test-helpers";
import { expect, test } from "./toolcraft-product-test";

test.setTimeout(120_000);

type LogoSpherePersistenceObservation = Readonly<{
  canvasWidth: number;
  cornerRadius: number;
  mediaReadyCount: number;
  sphereSectionCollapsed: boolean;
  timelineDuration: number;
  timelineVisible: boolean;
  uploadedLogoVisible: boolean;
  visibleLogoCount: number;
}>;

const expectedAfterReload: LogoSpherePersistenceObservation = {
  canvasWidth: 1800,
  cornerRadius: 32,
  mediaReadyCount: 1,
  sphereSectionCollapsed: true,
  timelineDuration: 6,
  timelineVisible: true,
  uploadedLogoVisible: true,
  visibleLogoCount: 500,
};

async function createPngFixture(page: Page): Promise<Buffer> {
  const encoded = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Persistence fixture requires Canvas 2D.");
    context.fillStyle = "#7c3aed";
    context.fillRect(0, 0, 64, 64);
    context.fillStyle = "#ffffff";
    context.fillRect(16, 16, 32, 32);
    return canvas.toDataURL("image/png").split(",")[1]!;
  });

  return Buffer.from(encoded, "base64");
}

async function mutateWorkspace(page: Page): Promise<void> {
  await page
    .locator('[data-toolcraft-control-target="logos.sources"] input[type="file"]')
    .setInputFiles({
      buffer: await createPngFixture(page),
      mimeType: "image/png",
      name: "persisted-logo.png",
    });
  await expect(page.getByRole("img", { name: "persisted-logo.png" })).toBeVisible({
    timeout: 20_000,
  });

  await page
    .locator('[data-toolcraft-control-target="sphere.visibleCount"]')
    .getByRole("slider")
    .press("End");
  await page
    .locator('[data-toolcraft-control-target="card.cornerRadius"]')
    .getByRole("slider")
    .press("End");

  const canvasWidth = page
    .locator('[data-toolcraft-control-target="canvas.size.width"]')
    .locator("input");
  await canvasWidth.fill(String(expectedAfterReload.canvasWidth));
  await canvasWidth.press("Enter");

  const timelineSwitch = page
    .locator('[data-toolcraft-control-target="panels.timeline.extended"]')
    .getByRole("switch");
  if ((await timelineSwitch.getAttribute("aria-checked")) !== "true") {
    await timelineSwitch.click();
  }
  await page.getByRole("button", { name: "Edit timeline duration" }).click();
  const duration = page.getByRole("textbox", { name: "timeline duration" });
  await duration.fill(String(expectedAfterReload.timelineDuration));
  await duration.press("Enter");

  await page
    .getByRole("button", { name: "Collapse Sphere section" })
    .first()
    .click();
  await expect(
    page.locator('[data-slot="toolcraft-runtime-app"]'),
  ).toHaveAttribute("data-toolcraft-persistence-status", "success");
}

test(
  "browser: workspace reload restores logo sphere values media timeline canvas and panels",
  async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    const session = await createLogoSphereProofSession(page);
    const observation = session.observe<LogoSpherePersistenceObservation>((root) => {
      const canvas = root.querySelector<HTMLCanvasElement>(
        'canvas[data-toolcraft-product-output="logo-sphere"]',
      );
      const timelineSwitch = root.querySelector<HTMLElement>(
        '[data-toolcraft-control-target="panels.timeline.extended"] [role="switch"]',
      );

      return {
        canvasWidth: Number(
          root
            .querySelector('[data-toolcraft-control-target="canvas.size.width"] input')
            ?.getAttribute("value") ?? 0,
        ),
        cornerRadius: Number(
          root.querySelector<HTMLInputElement>(
            '[data-toolcraft-control-target="card.cornerRadius"] input[type="range"]',
          )?.value ?? 0,
        ),
        mediaReadyCount: Number(canvas?.dataset.readyImageCount ?? 0),
        sphereSectionCollapsed:
          root.querySelector('[aria-label="Expand Sphere section"]') !== null,
        timelineDuration: Number(
          root
            .querySelector('[aria-label="Playback position"]')
            ?.getAttribute("aria-valuemax") ?? 0,
        ),
        timelineVisible: timelineSwitch?.getAttribute("aria-checked") === "true",
        uploadedLogoVisible:
          root.querySelector('img[alt="persisted-logo.png"]') !== null,
        visibleLogoCount: Number(canvas?.dataset.logoCount ?? 0),
      };
    });

    await expectToolcraftPersistenceState(
      observation,
      session.controlAction("sphere.visibleCount", (_, currentPage) =>
        mutateWorkspace(currentPage),
      ),
      session.reload(),
      expectedAfterReload,
      {
        requirementId: "persistence.reload",
        stabilityIntervalMs: 100,
        timeoutMs: 30_000,
      },
    );
  },
);
