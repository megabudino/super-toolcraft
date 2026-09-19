import { expect, type Page } from '@playwright/test';
import { getToolcraftControlFieldByTarget } from './browser-control-target-helpers';
import type { ToolcraftCompiledFixtureApplications } from './performance-compiled-fixture-runtime';
import { fieldValue, selectValue, setSlider } from './flame-test-helpers';

async function sliderValue(page: Page, target: string) {
  const field = await getToolcraftControlFieldByTarget(page, target);
  return Number((await field.getByRole('button', { name: /^Edit .* value$/ }).innerText()).replace('%', ''));
}
export async function readFlameZoom(page: Page) {
  const toolbar = page.locator('[data-toolcraft-inspect-toolbar="true"]');
  return Number((await toolbar.innerText()).match(/(\d+)%/)?.[1]);
}
async function setZoom(page: Page, value: number) {
  const current = await readFlameZoom(page);
  if ((value - current) % 10 !== 0) throw new Error(`Zoom ${value} is not reachable through the runtime toolbar.`);
  const button = page.getByRole('button', { name: value > current ? 'Zoom in' : 'Zoom out', exact: true });
  for (let i = 0; i < Math.abs(value - current) / 10; i++) await button.click();
  await expect.poll(() => readFlameZoom(page)).toBe(value);
}
export function flameFixtureApplications(page: Page, dimensions: readonly string[]): ToolcraftCompiledFixtureApplications {
  const applications: ToolcraftCompiledFixtureApplications = {};
  for (const id of dimensions) {
    if (id === 'zoom') applications[id] = { applyValue: value => setZoom(page, Number(value)), observeValue: () => readFlameZoom(page) };
    else if (id === 'resolution') applications[id] = {
      applyValue: value => selectValue(page, 'export.image.resolution', String(value).toUpperCase()),
      observeValue: async () => (await (await getToolcraftControlFieldByTarget(page, 'export.image.resolution')).getByRole('combobox').innerText()).toLowerCase(),
    };
    else if (id === 'width' || id === 'height') {
      const target = `canvas.size.${id}`;
      applications[id] = {
        applyValue: async value => {
          await page.getByRole('switch', { name: 'Infinity canvas', exact: true }).uncheck();
          await fieldValue(page, target, String(value));
        },
        observeValue: async () => Number(await (await getToolcraftControlFieldByTarget(page, target)).getByRole('textbox').inputValue()),
      };
    } else {
      const target = id === 'scale' ? 'canvas.renderScale' : `flame.${id}`;
      applications[id] = { applyValue: value => setSlider(page, target, Number(value)), observeValue: () => sliderValue(page, target) };
    }
  }
  return applications;
}
