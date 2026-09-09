import type { Page } from "@playwright/test";

import { appSchema } from "../src/app/app-schema";
import { expectToolcraftPersistenceState } from "./browser-state-evidence-helpers";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expect, test } from "./toolcraft-product-test";
import { installNativeHeroFixture } from "./product-native-hero-fixture";

const heroPreviewFrameSelector = '[data-percents-native-section]';
const topInsetTarget = "hero.layout.topInset";
const persistenceKey =
  appSchema.persistence.storage === "localStorage" ? appSchema.persistence.key : null;

async function createHeroPersistenceSession(page: Page) {
  await installNativeHeroFixture(page);
  await page.goto("/");
  const session = await createToolcraftBrowserProofSession(page);
  await expect(
    page.locator(heroPreviewFrameSelector).locator("[data-toolcraft-hero-heading]"),
  ).toBeVisible();
  return session;
}

test("browser hero preview: top inset persists after reload", async ({ page }) => {
  if (!persistenceKey) throw new Error("Hero preview persistence must use localStorage.");

  const session = await createHeroPersistenceSession(page);
  const persistedTopInset = session.observe((root) => {
    const control = root.querySelector<HTMLElement>(
      '[data-toolcraft-control-target="hero.layout.topInset"]',
    );
    const displayedValue =
      control
        ?.querySelector<HTMLButtonElement>('[aria-label="Edit Top inset value"]')
        ?.textContent?.trim() ?? null;
    const rawSnapshot = localStorage.getItem("toolcraft:work-with-masks-hero:state:v2");
    let persistedValue: number | null = null;

    if (rawSnapshot) {
      try {
        const snapshot: unknown = JSON.parse(rawSnapshot);
        if (typeof snapshot === "object" && snapshot !== null && !Array.isArray(snapshot)) {
          const state = Reflect.get(snapshot, "state");
          if (typeof state === "object" && state !== null && !Array.isArray(state)) {
            const values = Reflect.get(state, "values");
            if (typeof values === "object" && values !== null && !Array.isArray(values)) {
              const value = Reflect.get(values, "hero.layout.topInset");
              persistedValue = typeof value === "number" ? value : null;
            }
          }
        }
      } catch {
        persistedValue = null;
      }
    }

    return { displayedValue, persistedValue };
  });

  await expectToolcraftPersistenceState(
    persistedTopInset,
    session.targetAction(topInsetTarget, async (currentPage) => {
      const control = currentPage.locator(`[data-toolcraft-control-target="${topInsetTarget}"]`);
      await control.getByRole("button", { name: "Edit Top inset value" }).click();
      const editor = control.getByRole("textbox", { name: "Top inset value" });
      await editor.fill("200");
      await editor.press("Enter");
      await expect(control.getByRole("button", { name: "Edit Top inset value" })).toContainText(
        "200px",
      );
      await expect(currentPage.locator('[data-slot="toolcraft-runtime-app"]')).toHaveAttribute(
        "data-toolcraft-persistence-status",
        "success",
      );
    }),
    session.reload(),
    { displayedValue: "200px", persistedValue: 200 },
    {
      assertRestoredOutput: async () => {
        await expect(
          page.locator(heroPreviewFrameSelector).locator("[data-toolcraft-hero-section] > div").first(),
        ).toHaveCSS("padding-top", "200px");
      },
      requirementId: "persistence.reload",
      stabilityIntervalMs: 0,
    },
  );
});
