import { expect, test } from "./toolcraft-product-test";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { DOTS_DEFAULT_SETTINGS_BROWSER_TEST_NAME } from "../src/app/dots/dots-acceptance";

const outputSelector = '[data-dots-renderer="true"]';
const expectedColors = [
  "#FF4F22",
  "#FF8A1E",
  "#F1F20D",
  "#5C771A",
  "#0B5A86",
  "#8DB5C8",
  "#887CE8",
  "#F3A0C3",
  "#B28F73",
  "#D7D9D3",
  "#FF4F22",
];

test(DOTS_DEFAULT_SETTINGS_BROWSER_TEST_NAME, async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  const output = page.locator(outputSelector);
  const canvas = page.locator('canvas[aria-label="Particle text formation"]');
  const viewport = page.locator('[data-toolcraft-infinite-background-color]');
  await expect(output).toBeVisible();
  await expect(canvas).toBeVisible();
  await expect(page.locator('[data-toolcraft-canvas-mode]')).toHaveAttribute(
    "data-toolcraft-canvas-mode",
    "infinite",
  );
  await expect(viewport).toHaveCSS("background-color", "rgb(207, 188, 176)");

  const pause = page.getByRole("button", { name: "Pause playback" });
  if ((await pause.count()) > 0) await pause.click();

  await expect(output).toHaveAttribute("data-background-color", "#CFBCB0");
  await expect(output).toHaveAttribute("data-dot-text", "Hi!");
  await expect(output).toHaveAttribute("data-dot-count", "1800");
  await expect(output).toHaveAttribute("data-dot-distribution", "outline");
  await expect(output).toHaveAttribute("data-dot-edge-spill", "0.230");
  await expect(output).toHaveAttribute("data-dot-size", "4:11");
  await expect(output).toHaveAttribute("data-dot-active-duration", "4");
  await expect(output).toHaveAttribute("data-dot-calm-duration", "1");
  await expect(output).toHaveAttribute("data-dot-glow", "0");
  await expect(output).toHaveAttribute("data-timeline-duration", "10");
  await expect
    .poll(async () => {
      const encoded = await output.getAttribute("data-dot-gradient");
      if (!encoded) return [];
      const gradient = JSON.parse(encoded) as {
        stops: Array<{ color: string }>;
      };
      return gradient.stops.map(({ color }) => color);
    })
    .toEqual(expectedColors);
  await expect
    .poll(() =>
      canvas.evaluate((node) =>
        Array.from(
          (node as HTMLCanvasElement)
            .getContext("2d")!
            .getImageData(0, 0, 1, 1).data,
        ),
      ),
    )
    .toEqual([0, 0, 0, 0]);

  const backgroundControl = page.locator(
    '[data-toolcraft-control-target="appearance.background"]',
  );
  const backgroundHex = backgroundControl.getByRole("textbox", {
    name: "Background color hex",
  });
  await backgroundHex.fill("#101820");
  await backgroundHex.press("Enter");
  await expect(viewport).toHaveCSS("background-color", "rgb(16, 24, 32)");
  await page
    .locator('[data-toolcraft-control-target="text.content"] input')
    .fill("RESET ME");
  await page
    .locator('[data-toolcraft-control-target="particles.count"]')
    .getByRole("slider")
    .fill("1000");
  await page
    .locator('[data-toolcraft-control-target="particles.distribution"]')
    .getByRole("button", { name: "Fill", exact: true })
    .click();
  await page
    .locator('[data-toolcraft-control-target="particles.edgeSpill"]')
    .getByRole("slider")
    .fill("75");
  await page
    .locator('[data-toolcraft-control-target="appearance.glow"]')
    .getByRole("slider")
    .fill("0.5");
  await expect(output).toHaveAttribute("data-dot-count", "1000");
  await expect(output).toHaveAttribute("data-dot-distribution", "fill");
  await expect(output).toHaveAttribute("data-dot-edge-spill", "0.750");
  await expect(output).toHaveAttribute("data-dot-glow", "0.5");

  const session = await createToolcraftBrowserProofSession(page);
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("text.content", (_control, currentPage) =>
      currentPage.getByRole("button", { name: "Reset controls" }).click(),
    ),
    {
      requirementId: "product.default-settings",
      selector: outputSelector,
      stabilityIntervalMs: 80,
    },
  );
  await expect(output).toHaveAttribute("data-background-color", "#CFBCB0");
  await expect(viewport).toHaveCSS("background-color", "rgb(207, 188, 176)");
  await expect(output).toHaveAttribute("data-dot-text", "Hi!");
  await expect(output).toHaveAttribute("data-dot-count", "1800");
  await expect(output).toHaveAttribute("data-dot-distribution", "outline");
  await expect(output).toHaveAttribute("data-dot-edge-spill", "0.230");
  await expect(output).toHaveAttribute("data-dot-glow", "0");
  await expect
    .poll(async () => {
      const encoded = await output.getAttribute("data-dot-gradient");
      if (!encoded) return [];
      const gradient = JSON.parse(encoded) as {
        stops: Array<{ color: string }>;
      };
      return gradient.stops.map(({ color }) => color);
    })
    .toEqual(expectedColors);
});
