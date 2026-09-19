import { expect, type Page } from '@playwright/test';
import { outputSelector } from './flame-test-helpers';

export async function expectFlameZoomContinuity(page: Page) {
  const output = page.locator(outputSelector);
  for (const name of ['Zoom in', 'Zoom in', 'Zoom out', 'Zoom out']) {
    await expect(output).toHaveAttribute('data-frame-ready', 'true');
    const observation = output.evaluate(async (canvas: HTMLCanvasElement) => {
      const context = canvas.getContext('2d')!;
      const samples: { alpha: number; source: string }[] = [];
      let resizes = 0;
      const sample = (source: string) => samples.push({
        source,
        alpha: context.getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1).data[3],
      });
      // Also inspect each committed resize: a fast worker must not hide a clear.
      const observer = new MutationObserver(() => { resizes++; sample('resize'); });
      observer.observe(canvas, { attributes: true, attributeFilter: ['width', 'height'] });
      try {
        for (let frame = 0; frame < 30; frame++) {
          await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
          sample('frame');
        }
        return { resizes, samples };
      } finally { observer.disconnect(); }
    });
    await page.getByRole('button', { name, exact: true }).click();
    const result = await observation;
    expect(result.resizes, `${name} must reach a new backing size`).toBeGreaterThan(0);
    expect(result.samples.filter(sample => sample.alpha === 0), `${name} must preserve the graph through every frame and backing resize`).toEqual([]);
    await expect(output).toHaveAttribute('data-frame-ready', 'true');
    await expect.poll(() => output.evaluate((canvas: HTMLCanvasElement) => {
      const bounds = canvas.getBoundingClientRect();
      return [canvas.width - Math.round(bounds.width * devicePixelRatio * 2), canvas.height - Math.round(bounds.height * devicePixelRatio * 2)];
    })).toEqual([0, 0]);
  }
}
