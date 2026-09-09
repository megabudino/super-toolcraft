import { expect, test } from "./toolcraft-product-test";

test("browser: template library scroll chains into controls panel", async ({
  page,
}) => {
  await page.goto("/");

  const outerPanel = page.locator('[data-slot="toolcraft-panel-content"]');
  const libraryViewport = page.getByTestId("template-library-scroll");

  await expect(libraryViewport).toBeVisible();
  await libraryViewport.scrollIntoViewIfNeeded();
  await libraryViewport.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });

  const before = await page.evaluate(() => {
    const outer = document.querySelector<HTMLElement>(
      '[data-slot="toolcraft-panel-content"]',
    );
    const inner = document.querySelector<HTMLElement>(
      '[data-testid="template-library-scroll"]',
    );

    if (!outer || !inner) {
      throw new Error("Could not locate the nested Toolcraft scroll viewports.");
    }

    return {
      innerMax: inner.scrollHeight - inner.clientHeight,
      innerScrollTop: inner.scrollTop,
      maxVisibleRows: inner.dataset.maxVisibleRows,
      outerMax: outer.scrollHeight - outer.clientHeight,
      outerScrollTop: outer.scrollTop,
    };
  });

  expect(before.maxVisibleRows).toBe("10");
  expect(before.innerMax).toBeGreaterThan(0);
  expect(before.innerScrollTop).toBe(before.innerMax);
  expect(before.outerScrollTop).toBeLessThan(before.outerMax);

  await libraryViewport.hover();
  await page.mouse.wheel(0, 800);

  await expect
    .poll(() => outerPanel.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(before.outerScrollTop);
  await expect
    .poll(() =>
      libraryViewport.evaluate(
        (element) => element.scrollHeight - element.clientHeight - element.scrollTop,
      ),
    )
    .toBe(0);
  await expect
    .poll(() =>
      libraryViewport.evaluate(
        (element) => window.getComputedStyle(element).overscrollBehaviorY,
      ),
    )
    .toBe("auto");
});
