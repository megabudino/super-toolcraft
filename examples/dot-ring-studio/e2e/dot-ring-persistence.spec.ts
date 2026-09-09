import type { Page } from "@playwright/test";

import { expectToolcraftPersistenceState } from "./browser-state-evidence-helpers";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expect, test } from "./toolcraft-product-test";

type DotRingPersistenceObservation = Readonly<{
  canvasWidth: number;
  infinityEnabled: boolean;
  radius: number;
  ringSectionCollapsed: boolean;
  timelineDuration: number;
  timelineVisible: boolean;
  zoomPercent: number;
}>;

const expectedAfterReload: DotRingPersistenceObservation = {
  canvasWidth: 900,
  infinityEnabled: true,
  radius: 420,
  ringSectionCollapsed: true,
  timelineDuration: 6,
  timelineVisible: true,
  zoomPercent: 110,
};

async function mutatePersistedWorkspace(page: Page): Promise<void> {
  const radius = page
    .locator('[data-toolcraft-control-target="ring.radius"]')
    .getByRole("slider", { name: "Radius" });
  await radius.press("End");

  const infinity = page
    .locator('[data-toolcraft-control-target="canvas.infinity"]')
    .getByRole("switch");
  if ((await infinity.getAttribute("aria-checked")) === "true") {
    await infinity.click();
  }
  await expect(infinity).toHaveAttribute("aria-checked", "false");

  const width = page
    .locator('[data-toolcraft-control-target="canvas.size.width"]')
    .locator("input");
  await width.fill(String(expectedAfterReload.canvasWidth));
  await width.press("Enter");

  await infinity.click();
  await expect(infinity).toHaveAttribute("aria-checked", "true");
  await page.getByRole("button", { name: "Zoom in" }).click();
  await page
    .getByRole("button", { name: "Collapse Ring Pattern section" })
    .first()
    .click();

  await page
    .locator('[data-toolcraft-control-target="panels.timeline.extended"]')
    .getByRole("switch")
    .click();
  await page.getByRole("button", { name: "Edit timeline duration" }).click();
  const duration = page.getByRole("textbox", { name: "timeline duration" });
  await duration.fill(String(expectedAfterReload.timelineDuration));
  await duration.press("Enter");

  await expect(
    page.locator('[data-slot="toolcraft-runtime-app"]'),
  ).toHaveAttribute("data-toolcraft-persistence-status", "success");
}

test(
  "browser: Dot Ring Studio restores values, infinite canvas, panels, and timeline after reload",
  async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    const session = await createToolcraftBrowserProofSession(page);
    const persistedWorkspace = session.observe<DotRingPersistenceObservation>(
      (root) => {
        const output = root.querySelector<HTMLElement>(
          "[data-dot-ring-renderer]",
        );
        const frameSignature = JSON.parse(
          output?.dataset.frameSignature ?? "{}",
        ) as { settings?: { radius?: unknown } };
        const zoomLabel = [
          ...(root.querySelectorAll(
            '[data-toolcraft-inspect-toolbar="true"] span',
          ) ?? []),
        ]
          .map((candidate) => candidate.textContent?.trim() ?? "")
          .find((text) => /^\d+%$/u.test(text));
        const timeline = root.querySelector<HTMLElement>(
          '[data-toolcraft-control-target="panels.timeline.extended"] [role="switch"]',
        );

        return {
          canvasWidth: Number(output?.dataset.canvasWidth ?? 0),
          infinityEnabled:
            root
              .querySelector(
                '[data-toolcraft-control-target="canvas.infinity"] [role="switch"]',
              )
              ?.getAttribute("aria-checked") === "true",
          radius: Number(frameSignature.settings?.radius ?? 0),
          ringSectionCollapsed:
            root.querySelector(
              '[aria-label="Expand Ring Pattern section"]',
            ) !== null,
          timelineDuration: Number(
            root
              .querySelector('[aria-label="Playback position"]')
              ?.getAttribute("aria-valuemax") ?? 0,
          ),
          timelineVisible: timeline?.getAttribute("aria-checked") === "true",
          zoomPercent: Number(zoomLabel?.replace("%", "") ?? 0),
        };
      },
    );

    await expectToolcraftPersistenceState(
      persistedWorkspace,
      session.controlAction("ring.radius", (_, currentPage) =>
        mutatePersistedWorkspace(currentPage),
      ),
      session.reload(),
      expectedAfterReload,
      {
        requirementId: "runtime.persistence.reload",
        stabilityIntervalMs: 80,
      },
    );
  },
);
