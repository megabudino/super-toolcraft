import { expect, type Page } from '@playwright/test';
import { icebergPerformancePaths } from '../src/app/app-performance';
import { icebergParameters, icebergTarget } from '../src/app/iceberg-controls';
import type { ToolcraftPerformancePathAdapter } from './performance-path-adapter-contract';
import { getToolcraftProductObservableSnapshot } from './product-observable-helpers';
import { dragNumber, field, icebergSelector, inspectImage, openIceberg, panEmpty, setChoice, setNumber } from './iceberg-test-helpers';

export const appPerformanceCanvasBacking = { canvasSelector: icebergSelector };

async function changeTarget(page: Page, target: string) {
  if (icebergParameters.some(p => icebergTarget(p.key) === target) || target === 'canvas.renderScale') {
    await dragNumber(page, target);
    return;
  }
  if (target === 'view.orbit') {
    const gizmo = page.getByTestId('toolcraft-orientation-gizmo');
    const box = (await gizmo.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + 12);
    await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 + 16, box.y + 23, { steps: 6 }); await page.mouse.up();
    return;
  }
  const control = field(page, target);
  if (await control.getByRole('switch').count()) {
    await control.getByRole('switch').click();
  } else if (await control.getByRole('combobox').count()) {
    const button = control.getByRole('combobox');
    await button.click();
    const options = page.getByRole('option');
    const option = options.filter({ has: page.locator('[data-state="unchecked"]') });
    if (await option.count()) await option.first().click();
    else await options.nth((await options.count()) > 1 ? 1 : 0).click();
  } else {
    const input = control.getByRole('textbox');
    const old = await input.inputValue();
    await input.fill(target.includes('Color') || target === 'appearance.background' ? (old === '#88C8DD' ? '#D9DDE0' : '#88C8DD') : String(Number(old) + 100));
    await input.press('Enter');
  }
}

export const appPerformancePathAdapters = icebergPerformancePaths.map((path): ToolcraftPerformancePathAdapter => {
  const base = {
    pathId: path.id,
    prepare: openIceberg,
    fixtureApplications: (page: Page) => Object.fromEntries(path.workloadDimensions.map(id => [id, id === 'preview-scale' ? {
      applyValue: (value: unknown) => setNumber(page, 'canvas.renderScale', Number(value)),
      observeValue: () => field(page, 'canvas.renderScale').getByRole('slider').getAttribute('aria-valuenow'),
    } : {
      applyValue: (value: unknown) => setChoice(page, 'export.image.resolution', String(value).toUpperCase()),
      observeValue: async () => (await field(page, 'export.image.resolution').getByRole('combobox').innerText()).trim().toLowerCase(),
    }])),
  };
  if (path.interaction === 'export') return {
    ...base,
    output: { kind: 'download', label: 'Export PNG', verify: async (download, page) => {
      const { inspection } = await inspectImage(page, download);
      expect(inspection.byteLength).toBeGreaterThan(100);
      expect(inspection.nonBackgroundBounds).not.toBeNull();
    } },
  };
  return {
    ...base,
    action: async ({ page }) => {
      if (path.interaction === 'viewport-drag') await panEmpty(page);
      else if (path.interaction === 'viewport-zoom') await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
      else for (const target of path.targets) await changeTarget(page, target);
    },
    observeOutcome: ({ page }) => getToolcraftProductObservableSnapshot(page, { selector: '[data-toolcraft-editable-canvas]' }),
    verifyOutcome: async ({ page }) => { await expect(page.locator(icebergSelector)).toBeVisible(); },
  };
});
