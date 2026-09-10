import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectToolcraftCompoundControlPartOutcome } from "./browser-state-evidence-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";

test("browser: room.vanishing updates the real Studio Room preview", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "commit" });
  const session = await createToolcraftBrowserProofSession(page);
  const control = page.locator('[data-toolcraft-control-target="room.vanishing"]');
  await expect(control).toHaveCount(1);
  const position = session.observe(root => {
    const wall = root.querySelector<HTMLElement>('[data-studio-room] [class*="_backWall_"]')!;
    const css = getComputedStyle(wall);
    // Layout pixels are quantized by the browser; inspect the actual percentage
    // used by left/top, and separately require the rendered raster to move.
    return {
      x: Number(Number.parseFloat(css.getPropertyValue("--back-wall-left")).toFixed(6)),
      y: Number(Number.parseFloat(css.getPropertyValue("--back-wall-top")).toFixed(6)),
    };
  });
  for (const [part, value, expected] of [
    ["vector.x", "0.5, 0", { x: 26.15, y: 18.525 }],
    ["vector.y", "0.5, 0.5", { x: 26.15, y: 24.525 }],
  ] as const) {
    await expectToolcraftProductObservableToChange(session,
      session.targetAction("room.vanishing", async () => {
        await expectToolcraftCompoundControlPartOutcome(position,
          session.targetAction("room.vanishing", async () => {
            await control.getByRole("button", { name: "Edit Vanishing point value" }).click();
            const input = control.getByRole("textbox");
            await input.fill(value);
            await input.press("Enter");
          }), expected, { requirementId: "room.vanishing", part });
      }), { requirementId: "room.vanishing", selector: "[data-studio-room]", stabilityIntervalMs: 50, stabilitySamples: 2 });
  }
});

test("browser: room.wallBorder.colorOpacity updates the real Studio Room preview", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "commit" });
  const session = await createToolcraftBrowserProofSession(page);
  const target = "room.wallBorder.colorOpacity";
  const control = page.locator(`[data-toolcraft-control-target="${target}"]`);
  await expect(control).toHaveCount(1);
  const border = session.observe(root => {
    const wall = root.querySelector('[data-studio-room] [class*="_backWall_"]')!;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const context = canvas.getContext("2d")!;
    context.fillStyle = getComputedStyle(wall).borderLeftColor;
    context.fillRect(0, 0, 1, 1);
    return Array.from(context.getImageData(0, 0, 1, 1).data);
  });
  for (const [part, label, value, expected] of [
    ["colorOpacity.hex", "Border color hex", "#FF0000", [255, 0, 0, 87]],
    ["colorOpacity.opacity", "Border color opacity", "80", [255, 0, 0, 204]],
  ] as const) {
    await expectToolcraftProductObservableToChange(session,
      session.targetAction(target, async () => {
        await expectToolcraftCompoundControlPartOutcome(border,
          session.targetAction(target, async () => {
            const input = control.getByRole("textbox", { name: label, exact: true });
            await input.fill(value);
            await input.press("Enter");
          }), [...expected], { requirementId: target, part });
      }), { requirementId: target, selector: "[data-studio-room]", stabilityIntervalMs: 50, stabilitySamples: 2 });
  }
});
