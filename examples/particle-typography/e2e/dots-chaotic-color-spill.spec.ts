import { DOTS_DEFAULT_CYCLE_SECONDS } from "../src/app/dots/dots-timing";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import {
  ensureTimelineVisible,
  outputSelector,
  pausePlayback,
  setSlider,
  type ProductPage,
} from "./dots-acceptance-support";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";

const palette = [
  [255, 79, 34],
  [255, 138, 30],
  [241, 242, 13],
  [92, 119, 26],
  [11, 90, 134],
  [141, 181, 200],
  [136, 124, 232],
  [243, 160, 195],
  [178, 143, 115],
  [215, 217, 211],
] as const;

type CanvasColorStudy = Readonly<{
  chaoticCells: number;
  height: number;
  maxX: number;
  maxY: number;
  minX: number;
  minY: number;
  paletteColors: number;
  width: number;
}>;

async function studyCanvas(page: ProductPage): Promise<CanvasColorStudy> {
  return page
    .locator('canvas[aria-label="Particle text formation"]')
    .evaluate((canvas, expectedPalette) => {
      const source = canvas as HTMLCanvasElement;
      const context = source.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("Particle canvas has no 2D context.");
      const pixels = context.getImageData(0, 0, source.width, source.height).data;
      const paletteKeys = new Set(
        expectedPalette.map(([r, g, b]) => `${r}:${g}:${b}`),
      );
      const foundColors = new Set<string>();
      const cells = Array.from({ length: 30 }, () => new Set<string>());
      let maxX = 0;
      let maxY = 0;
      let minX = source.width;
      let minY = source.height;

      for (let y = 0; y < source.height; y += 1) {
        for (let x = 0; x < source.width; x += 1) {
          const offset = (y * source.width + x) * 4;
          const key = `${pixels[offset]}:${pixels[offset + 1]}:${pixels[offset + 2]}`;
          if (!paletteKeys.has(key) || pixels[offset + 3] !== 255) continue;
          foundColors.add(key);
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
          const column = Math.min(4, Math.floor((x / source.width) * 5));
          const row = Math.min(5, Math.floor((y / source.height) * 6));
          cells[row * 5 + column]!.add(key);
        }
      }

      return {
        chaoticCells: cells.filter((colors) => colors.size >= 6).length,
        height: maxY - minY + 1,
        maxX,
        maxY,
        minX,
        minY,
        paletteColors: foundColors.size,
        width: maxX - minX + 1,
      };
    }, palette);
}

async function setSettledTimelineFrame(page: ProductPage): Promise<void> {
  await ensureTimelineVisible(page);
  const slider = page.getByRole("slider", { name: "Playback position" });
  await slider.press("Home");
  const quarterSecondSteps = Math.round(
    (DOTS_DEFAULT_CYCLE_SECONDS * 0.7) / 0.25,
  );
  for (let step = 0; step < quarterSecondSteps; step += 1) {
    await slider.press("ArrowRight");
  }
  await expect(page.locator(outputSelector)).toHaveAttribute(
    "data-dot-motion-phase",
    "rest",
  );
}

test("browser: settled dots use chaotic palette and adjustable edge spill", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const session = await createToolcraftBrowserProofSession(page);
  await pausePlayback(page);
  await setSettledTimelineFrame(page);

  const output = page.locator(outputSelector);
  const edgeSpill = page.locator(
    '[data-toolcraft-control-target="particles.edgeSpill"]',
  );
  await expect(output).toHaveAttribute("data-dot-edge-spill", "0.230");

  await setSlider(edgeSpill, 0);
  await expect(output).toHaveAttribute("data-dot-edge-spill", "0.000");
  const strict = await studyCanvas(page);

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("particles.edgeSpill", (control) =>
      setSlider(control, 100),
    ),
    {
      requirementId: "particles.edgeSpill",
      selector: outputSelector,
      stabilityIntervalMs: 80,
      timeoutMs: 20_000,
    },
  );
  await expect(output).toHaveAttribute("data-dot-edge-spill", "1.000");
  const loose = await studyCanvas(page);

  expect(loose.paletteColors).toBeGreaterThanOrEqual(8);
  expect(loose.chaoticCells).toBeGreaterThanOrEqual(5);
  expect(
    loose.minX < strict.minX - 8 ||
      loose.maxX > strict.maxX + 8 ||
      loose.minY < strict.minY - 8 ||
      loose.maxY > strict.maxY + 8,
  ).toBe(true);
  expect(loose.width * loose.height).toBeGreaterThan(strict.width * strict.height);

  await page.getByRole("button", { name: "Reset controls" }).click();
  await expect(output).toHaveAttribute("data-dot-edge-spill", "0.230");
});
