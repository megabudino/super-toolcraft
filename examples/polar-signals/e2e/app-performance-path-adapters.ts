import { expect, type Page } from '@playwright/test';
import { flamePerformancePaths } from '../src/app/app-performance';
import type { ToolcraftPerformanceCanvasBacking, ToolcraftPerformancePathAdapter, ToolcraftPerformancePathActionContext } from './performance-path-adapter-contract';
import { flameFixtureApplications } from './flame-performance-fixtures';
import { getToolcraftControlFieldByTarget } from './browser-control-target-helpers';
import { resolveToolcraftProductRasterProbe } from './browser-product-raster-snapshot';
import { dragCanvasHandle } from './canvas-handle-helpers';
import { fieldValue, outputSelector, selectValue } from './flame-test-helpers';

export const appPerformanceCanvasBacking = { canvasSelector: outputSelector } satisfies ToolcraftPerformanceCanvasBacking;

async function ready(page: Page) { await expect(page.locator(outputSelector)).toHaveAttribute('data-frame-ready', 'true'); }
async function prepare(page: Page) {
  await page.goto('/'); await ready(page);
  await selectValue(page, 'canvas.aspectRatio', 'Custom');
}
async function action({ page, path, phase }: ToolcraftPerformancePathActionContext) {
  if (path.interaction === 'initial-render') { await page.reload(); await ready(page); return; }
  if (path.interaction === 'viewport-drag') {
    await page.mouse.move(160, 160); await page.keyboard.down('Space'); await page.mouse.down();
    await page.mouse.move(210, 195, { steps: 8 }); await page.mouse.up(); await page.keyboard.up('Space'); return;
  }
  if (path.interaction === 'viewport-zoom') { await page.getByRole('button', { name: 'Zoom out', exact: true }).click(); await ready(page); return; }
  if (path.targets.includes('flame.envelopes')) {
    await dragCanvasHandle(page, 'flame-mid-3', { x: 0, y: phase === 'warm' ? -20 : 20 }); await ready(page); return;
  }
  if (path.targets.includes('flame.layout')) {
    const group = page.getByRole('group', { name: 'Layout', exact: true });
    const center = await group.getByRole('button', { name: 'Center', exact: true }).getAttribute('aria-pressed');
    await group.getByRole('button', { name: center === 'true' ? 'Top Down' : 'Center', exact: true }).click(); await ready(page); return;
  }
  if (path.interaction === 'control-drag') {
    const field = await getToolcraftControlFieldByTarget(page, 'flame.border');
    const slider = field.getByRole('slider'); await slider.scrollIntoViewIfNeeded();
    const thumb = await slider.boundingBox(); const track = await field.locator('[data-slot="slider"]').first().boundingBox();
    expect(thumb).not.toBeNull(); expect(track).not.toBeNull();
    await page.mouse.move(thumb!.x + thumb!.width / 2, thumb!.y + thumb!.height / 2); await page.mouse.down();
    await page.mouse.move(track!.x + track!.width * (phase === 'warm' ? .25 : .75), track!.y + track!.height / 2, { steps: 8 });
    await ready(page); await page.mouse.up(); return;
  }
  const target = path.invalidates.length ? 'flame.dark' : 'appearance.background';
  await fieldValue(page, target, phase === 'warm' ? '#163ECB' : '#B13620'); await ready(page);
}

export const appPerformancePathAdapters = flamePerformancePaths.map((path): ToolcraftPerformancePathAdapter => {
  const common = {
    pathId: path.id, prepare,
    ...(path.workloadDimensions.length ? { fixtureApplications: (page: Page) => flameFixtureApplications(page, path.workloadDimensions) } : {}),
    settlePhase: ({ page }: ToolcraftPerformancePathActionContext) => ready(page),
  };
  if (path.interaction === 'export') return {
    ...common, output: { kind: 'download', label: 'Export PNG', verify: async download => {
      const stream = await download.createReadStream(); let size = 0;
      for await (const chunk of stream) size += chunk.length;
      expect(size).toBeGreaterThan(100);
    } },
  };
  return {
    ...common, action,
    observeOutcome: async ({ page }) => (await resolveToolcraftProductRasterProbe(page, { selector: path.invalidates.length ? outputSelector : '[data-toolcraft-editable-canvas]', region: { x: 200, y: 200, width: 240, height: 160 } })).capture(),
    verifyOutcome: ({ page }) => ready(page),
  };
});
