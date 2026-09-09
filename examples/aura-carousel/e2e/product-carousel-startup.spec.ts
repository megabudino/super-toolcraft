import { expect, test } from "./toolcraft-product-test";

test("carousel startup: preserves the first drag through renderer readiness", async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 1600, height: 1100 });
  let releaseFont!: () => void;
  const fontGate = new Promise<void>((resolve) => { releaseFont = resolve; });
  await page.route("**/figtree-latin-wght-normal.woff2", async (route) => {
    await fontGate;
    await route.continue();
  });

  try {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const surface = page.locator("[data-dispersion-carousel]");
    const rail = page.getByRole("region", { name: "Customer stories" });
    await expect(surface).toHaveAttribute("data-rail-renderer", "loading");
    await expect(rail.locator("img").first()).toBeVisible();
    const readScroll = () => surface.evaluate((node) => Number((node as HTMLElement).dataset.scrollLeft));
    const start = await readScroll();
    const bounds = await surface.boundingBox();

    await page.mouse.move(900, 550);
    await page.mouse.down();
    await page.mouse.move(750, 550, { steps: 6 });
    await expect(rail).toHaveAttribute("data-carousel-dragging", "true");
    await expect.poll(readScroll).toBeCloseTo(start + 150, 0);

    releaseFont();
    await expect(surface).toHaveAttribute("data-rail-renderer", "webgl");
    await expect(rail).toHaveAttribute("data-carousel-dragging", "true");
    await expect(rail).toHaveCSS("outline-style", "none");
    const canvas = surface.locator("canvas");
    const beforeMove = await canvas.evaluate((node) => node.toDataURL());
    await page.mouse.move(650, 550, { steps: 6 });
    await expect.poll(readScroll).toBeCloseTo(start + 250, 0);
    await expect.poll(() => canvas.evaluate((node) => node.toDataURL())).not.toBe(beforeMove);
    expect(await surface.boundingBox()).toEqual(bounds);
    await page.mouse.up();
    await expect(rail).not.toHaveAttribute("data-carousel-dragging", "true");

    // The next gesture works without another click to initialize navigation.
    await page.mouse.move(650, 550);
    await page.mouse.down();
    await page.mouse.move(750, 550, { steps: 6 });
    await expect.poll(readScroll).toBeCloseTo(start + 150, 0);
    await page.mouse.up();
  } finally {
    releaseFont();
  }
});
