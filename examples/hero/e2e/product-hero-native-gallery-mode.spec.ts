import { test as browserTest } from "@playwright/test";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { heroField, heroOutput, heroStyleProof, heroStyleTitle, prepareHeroStyle } from "./hero-native-style-fixture";
import { readHeroGalleryMode } from "./hero-gallery-mode-observation";
import { expect, test } from "./toolcraft-product-test";

test(heroStyleTitle("gallery.type"), async ({ page }) => {
  const session = await prepareHeroStyle(page, heroOutput);
  const root = page.locator('[data-slot="toolcraft-runtime-app"]');
  const initial = await root.evaluate(readHeroGalleryMode);
  expect(initial.mode).toBe("sphere");

  for (const [mode, label] of [["rows", "Rows"], ["sphere", "Sphere"]] as const) {
    await expectToolcraftProductObservableToChange(session, session.targetAction("gallery.type", async () => {
      await heroField(page, "gallery.type").getByRole("button", { name: label, exact: true }).click();
      await expect.poll(() => root.evaluate(readHeroGalleryMode)).toEqual({
        ...initial,
        mode, pressed: [label], ready: "true",
        // Order is independently checked below for Rows; Sphere must recover
        // its own original media and rows after leaving and returning.
        order: mode === "sphere" ? initial.order : expect.any(String),
        rows: mode === "sphere" ? initial.rows : "2",
        mirrored: mode === "sphere" ? [null, null] : ["row", "row-reverse"].map(direction => ({
          direction, cards: 8, canvases: 8, visibleReady: true,
        })),
        sphereCanvases: mode === "sphere" ? 1 : 0,
        sphereRevealed: mode === "sphere",
        rowsControls: Array(3).fill(mode === "rows" ? 1 : 0),
        sphereControls: Array(8).fill(mode === "sphere" ? 1 : 0),
      });
      if (mode === "rows") {
        const order = (await root.evaluate(readHeroGalleryMode)).order!.split(",");
        expect(order).toHaveLength(16);
        expect(order.every(id => id.startsWith("hero-default-gallery-"))).toBe(true);
      }
    }), heroStyleProof("gallery.type", heroOutput));
  }
});
// Use the installed full Chromium native GPU; keep render quality and budgets.
browserTest.use({ channel: "chromium" });
