import { expect, test } from "./toolcraft-product-test";

test("browser: mouse release ignores delayed native scroll", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1100 });
  await page.goto("/");
  const surface = page.locator("[data-dispersion-carousel]");
  const rail = page.locator("[data-carousel-base]");
  const canvas = page.locator("[data-dispersion-carousel-canvas]");
  await expect(surface).toHaveAttribute("data-rail-renderer", "webgl");
  const initial = Number(await surface.getAttribute("data-scroll-left"));
  await page.mouse.move(900, 550);
  await page.mouse.down();
  await page.mouse.move(727, 550, { steps: 8 });
  const released = ((initial + 173) % 2320).toFixed(3);
  await expect(surface).toHaveAttribute("data-scroll-left", released);
  await page.mouse.up();
  await page.waitForTimeout(700);
  await expect(surface).toHaveAttribute("data-scroll-left", released);
  const pixels = await canvas.screenshot();

  // Model a browser's delayed native offset adjustment after pointer release.
  // It must not be mistaken for a new gesture and trigger the 480ms idle snap.
  await rail.evaluate((node) => { node.scrollLeft += 1; });
  await page.waitForTimeout(750);
  await expect(surface).toHaveAttribute("data-scroll-left", released);
  expect(await canvas.screenshot()).toEqual(pixels);

  // A real trackpad/wheel gesture can take ownership again and still align.
  await page.mouse.wheel(120, 0);
  await expect.poll(async () => Number(await surface.getAttribute("data-scroll-left")))
    .not.toBe(Number(released));
  await page.waitForTimeout(750);
  expect(Number(await surface.getAttribute("data-scroll-left")) % 464).toBe(0);
});

test("browser: carousel navigation button presentation", async ({ page }) => {
  await page.setViewportSize({ width: 2400, height: 1300 });
  await page.goto("/");
  const navigation = page.locator("[data-carousel-navigation='true']");
  await expect(navigation.getByRole("button")).toHaveCount(2);

  for (const name of ["Previous slide", "Next slide"]) {
    const button = navigation.getByRole("button", { name });
    await expect(button).toHaveCSS("border-top-color", "rgba(0, 0, 0, 0.1)");
    await expect(button).toHaveCSS("border-top-width", "1px");
    await expect(button).toHaveCSS("box-shadow", "none");
    const size = await button.evaluate((node) => {
      const style = getComputedStyle(node);
      return { width: style.width, height: style.height };
    });
    await button.hover();
    await expect(button).toHaveCSS("cursor", "pointer");
    await expect(button.locator("span")).toHaveCSS("cursor", "pointer");
    await expect(button).toHaveCSS("box-shadow", "rgba(0, 0, 0, 0.08) 0px 2px 5px 0px");
    await expect(button).toHaveCSS("width", size.width);
    await expect(button).toHaveCSS("height", size.height);
    if (name === "Next slide") {
      await navigation.screenshot({ path: ".toolcraft/browser-artifacts/navigation-buttons-hover.png" });
    }
    await page.mouse.move(50, 50);
    await expect(button).toHaveCSS("box-shadow", "none");
  }
});

test("browser: starter opens as a neutral Toolcraft shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator('[data-slot="toolcraft-runtime-app"]')).toBeVisible();
  await expect(page.getByRole("application", { name: "Canvas viewport" })).toBeVisible();

  await expect(page.getByText("Toolcraft App Template Controls")).toHaveCount(0);
  await expect(page.getByText("Generation")).toHaveCount(0);
  await expect(page.getByText("Prompt")).toHaveCount(0);
  await expect(page.getByText("Dur:")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Play playback|Pause playback/ })).toHaveCount(0);
});

test("browser: starter canvas accepts media upload without product controls", async ({
  page,
}) => {
  await page.goto("/");

  const upload = await page.evaluateHandle(() => {
    const dataTransfer = new DataTransfer();
    const file = new File(
      [
        '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="96"><rect width="128" height="96" fill="#888"/></svg>',
      ],
      "starter-fixture.svg",
      { type: "image/svg+xml" },
    );

    dataTransfer.items.add(file);
    return dataTransfer;
  });

  await page
    .getByRole("application", { name: "Canvas viewport" })
    .dispatchEvent("drop", { dataTransfer: upload });

  await expect(page.getByRole("img", { name: "starter-fixture.svg" })).toBeVisible();
  await expect(page.getByText("Prompt")).toHaveCount(0);
});
