import { expect, test } from "./toolcraft-product-test";

test("grass render baseline records cold long frames", async ({ page }) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => {
    performance.setResourceTimingBufferSize(5_000);
    const durations: number[] = [];
    Object.defineProperty(globalThis, "__grassLongFrameDurations", {
      configurable: true,
      value: durations,
    });
    if (typeof PerformanceObserver === "undefined") return;
    const supported = PerformanceObserver.supportedEntryTypes ?? [];
    const entryType = supported.includes("long-animation-frame")
      ? "long-animation-frame"
      : supported.includes("longtask")
        ? "longtask"
        : null;
    if (!entryType) return;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) durations.push(entry.duration);
    }).observe({ buffered: true, type: entryType });
  });
  const startedAt = Date.now();
  await page.goto("/");
  const canvas = page.locator('[data-slot="grass-webgl-canvas"]');
  await expect(canvas).toHaveAttribute("data-grass-frame-signature", /.+/, {
    timeout: 110_000,
  });
  const result = await page.evaluate(() => ({
    coldFrameMs: Date.now(),
    durations: (
      globalThis as typeof globalThis & {
        __grassLongFrameDurations?: number[];
      }
    ).__grassLongFrameDurations ?? [],
    resources: performance
      .getEntriesByType("resource")
      .map((entry) => ({
        duration: entry.duration,
        name: entry.name.split("/").at(-1) ?? entry.name,
        responseEnd: entry.responseEnd,
      }))
      .filter((entry) =>
        /\.(?:hdr|jpe?g|meshbin|mp3|png|webp)(?:\?|$)/i.test(entry.name),
      )
      .sort((left, right) => right.responseEnd - left.responseEnd)
      .slice(0, 12),
  }));
  const durations = [...result.durations].sort((left, right) => right - left);
  console.info(
    JSON.stringify({
      coldFrameMs: Date.now() - startedAt,
      longFrameMs: durations.slice(0, 8),
      resources: result.resources,
    }),
  );
  expect(durations.length).toBeGreaterThan(0);
  expect(
    result.resources.some((entry) => entry.name.startsWith("butterflies-")),
  ).toBe(false);
});
