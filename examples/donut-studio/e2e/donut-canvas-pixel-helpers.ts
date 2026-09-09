import {
  DONUT_CANVAS_SELECTOR,
  openDonut,
} from "./donut-test-helpers";
import { expect } from "./toolcraft-product-test";

type DonutPage = Parameters<typeof openDonut>[0];

export type DonutPixelProof = Readonly<{
  minChangedRatio: number;
  minMeanRgbDelta: number;
}>;

export async function captureDonutCanvasPixels(
  page: DonutPage,
): Promise<number[]> {
  return page.locator(DONUT_CANVAS_SELECTOR).evaluate((canvas) => {
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("Donut pixel proof requires the WebGL canvas.");
    }
    const sample = document.createElement("canvas");
    sample.width = 160;
    sample.height = 90;
    const context = sample.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Could not create donut pixel proof context.");
    context.drawImage(canvas, 0, 0, sample.width, sample.height);
    return Array.from(
      context.getImageData(0, 0, sample.width, sample.height).data,
    );
  });
}

export function expectDonutCanvasPixelChange(
  before: number[],
  after: number[],
  proof: DonutPixelProof,
  requirementId: string,
): void {
  expect(after).toHaveLength(before.length);
  let changed = 0;
  let rgbDelta = 0;
  const pixelCount = before.length / 4;
  for (let index = 0; index < before.length; index += 4) {
    const delta =
      Math.abs((after[index] ?? 0) - (before[index] ?? 0)) +
      Math.abs((after[index + 1] ?? 0) - (before[index + 1] ?? 0)) +
      Math.abs((after[index + 2] ?? 0) - (before[index + 2] ?? 0));
    if (delta > 3) changed += 1;
    rgbDelta += delta;
  }

  expect(
    changed / pixelCount,
    `${requirementId} must change real canvas pixels, not only its output signature.`,
  ).toBeGreaterThanOrEqual(proof.minChangedRatio);
  expect(
    rgbDelta / pixelCount,
    `${requirementId} must produce a perceptible real-pixel delta.`,
  ).toBeGreaterThanOrEqual(proof.minMeanRgbDelta);
}

export function donutPixelProofFor(
  target: string,
): DonutPixelProof | undefined {
  if (target === "material.donut.color") {
    return { minChangedRatio: 0.005, minMeanRgbDelta: 1 };
  }
  if (target === "icing.color") {
    return { minChangedRatio: 0.012, minMeanRgbDelta: 1 };
  }
  if (
    target.startsWith("material.donut.") ||
    target.startsWith("material.icing.")
  ) {
    return { minChangedRatio: 0.0004, minMeanRgbDelta: 0.004 };
  }
  if (
    target === "icing.flow" ||
    target === "icing.thickness" ||
    target === "icing.dripAmount"
  ) {
    return { minChangedRatio: 0.003, minMeanRgbDelta: 0.08 };
  }
  if (target === "sprinkles.surfaceOffset") {
    return { minChangedRatio: 0.0004, minMeanRgbDelta: 0.004 };
  }
  if (target === "studio.hdriVisible") {
    return { minChangedRatio: 0.05, minMeanRgbDelta: 1 };
  }
  if (target === "studio.shadowsEnabled") {
    return { minChangedRatio: 0.003, minMeanRgbDelta: 0.05 };
  }
  return undefined;
}
