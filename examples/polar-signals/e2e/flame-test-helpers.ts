import { expect, type Page } from '@playwright/test';
import { createToolcraftBrowserProofSession } from './browser-proof-session';
import { getToolcraftControlFieldByTarget } from './browser-control-target-helpers';
export const outputSelector = '[data-testid="flame-output"]';
export async function openFlame(page: Page) {
  await page.goto('/');
  const session = await createToolcraftBrowserProofSession(page);
  await expect(page.locator(outputSelector)).toHaveAttribute('data-frame-ready', 'true');
  return session;
}
export async function fieldValue(page: Page, target: string, value: string) {
  const field = await getToolcraftControlFieldByTarget(page, target);
  const input = field.getByRole('textbox');
  await input.fill(value); await input.press('Enter');
}
export async function selectValue(page: Page, target: string, label: string) {
  const field = await getToolcraftControlFieldByTarget(page, target);
  await field.getByRole('combobox').click();
  await page.getByRole('option', { name: label, exact: true }).click();
}
export async function setSlider(page: Page, target: string, value: number) {
  const field = await getToolcraftControlFieldByTarget(page,target);
  await field.getByRole('button', {name:/^Edit .* value$/}).click();
  const input = field.getByRole('textbox');
  await expect(input).toBeFocused();
  await expect(input).not.toHaveText('');
  await input.fill(String(value)); await input.press('Enter');
  await expect(field.getByRole('button', {name:/^Edit .* value$/})).toContainText(String(value));
}
export async function downloadImage(page: Page) {
  const download = page.waitForEvent('download');
  await page.getByRole('button', {name:/^Export (PNG|JPG)$/}).click();
  return download;
}
export async function fitScene(page: Page) {
  await page.getByRole('switch', {name:'Infinity canvas',exact:true}).uncheck();
  await fieldValue(page, 'canvas.size.width', '960');
  await page.getByRole('button',{name:'Center canvas',exact:true}).click();
  await expect(page.locator(outputSelector)).toHaveAttribute('data-frame-ready', 'true');
}
