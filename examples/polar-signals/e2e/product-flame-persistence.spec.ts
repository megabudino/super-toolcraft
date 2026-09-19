import { expect, test } from './toolcraft-product-test';
import { expectToolcraftPersistenceState } from './browser-state-evidence-helpers';
import { expectToolcraftReferenceParity } from './browser-acceptance-outcome-helpers';
import { getToolcraftProductObservableSnapshot } from './product-observable-helpers';
import { dragCanvasHandle } from './canvas-handle-helpers';
import { fieldValue, openFlame, outputSelector } from './flame-test-helpers';

test('browser: flame restores graph and workspace after reload', async ({ page }) => {
  const session = await openFlame(page);
  await page.getByRole('switch', { name: 'Infinity canvas', exact: true }).uncheck();
  const workspace = session.observe(root => {
    const scene = root.querySelector<HTMLElement>('[data-toolcraft-editable-canvas]');
    const panel = root.querySelector<HTMLElement>('[data-panel-type="controls"]');
    const guide = root.querySelector('[data-testid="flame-mid-3"]');
    const toolbar = root.querySelector('[data-toolcraft-inspect-toolbar="true"]');
    return {
      width: scene?.style.width,
      guideY: Math.round(Number(guide?.getAttribute('cy')) * 1000) / 1000,
      collapsed: !!root.querySelector('[aria-label="Expand controls"]'),
      offsetX: Number(panel?.dataset.panelOffsetX), offsetY: Number(panel?.dataset.panelOffsetY),
      zoom: [...(toolbar?.querySelectorAll('span') ?? [])].map(node => node.textContent?.trim()).find(text => /^\d+%$/.test(text ?? '')),
    };
  });
  let signature = '';
  const probe = { selector: outputSelector };
  await expectToolcraftPersistenceState(workspace, session.controlAction('canvas.size.width', async () => {
    await fieldValue(page, 'canvas.size.width', '960');
    await fieldValue(page, 'flame.dark', '#123456');
    await page.getByRole('button', { name: 'Regenerate', exact: true }).click();
    await dragCanvasHandle(page, 'flame-mid-3', { x: 0, y: 65 });
    await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
    const handle = page.locator('[data-panel-type="controls"] [data-panel-drag-handle=""]').first();
    const box = await handle.boundingBox(); expect(box).not.toBeNull();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    await page.mouse.move(box!.x + box!.width / 2 - 48, box!.y + box!.height / 2 + 24, { steps: 4 });
    await page.mouse.up();
    await page.getByRole('button', { name: 'Collapse controls', exact: true }).click();
    await expect(page.locator(outputSelector)).toHaveAttribute('data-frame-ready', 'true');
    await expect(page.locator('[data-slot="toolcraft-runtime-app"]')).toHaveAttribute('data-toolcraft-persistence-status', 'success');
    signature = await getToolcraftProductObservableSnapshot(page, probe);
  }), session.reload(), { width: '960px', guideY: 335, collapsed: true, offsetX: -48, offsetY: 24, zoom: '110%' }, {
    requirementId: 'persistence.reload', stabilityIntervalMs: 0,
    assertRestoredOutput: async () => {
      await expect(page.locator(outputSelector)).toHaveAttribute('data-frame-ready', 'true');
      await expect.poll(() => getToolcraftProductObservableSnapshot(page, probe)).toBe(signature);
    },
  });
  await expectToolcraftReferenceParity(async () => Number(await page.getByTestId('flame-mid-3').getAttribute('cy')), 335, { requirementId: 'persistence.reload', target: 'canvas.size.width' });
});
