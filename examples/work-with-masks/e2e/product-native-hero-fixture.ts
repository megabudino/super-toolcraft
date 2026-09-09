import type { Page } from '@playwright/test';

/** Foreground tests retain a real, paused wave at a bounded reachable frame size. */
export async function installNativeHeroFixture(page: Page) {
  const snapshot = JSON.stringify({ version: 2, state: {
    canvas: { mode: 'finite', offset: { x: 0, y: 0 },
      size: { width: 2400, height: 1200, unit: 'px' }, zoom: 40 },
    timeline: { currentTimeSeconds: 0, isPlaying: false },
    values: { 'canvas.renderScale': 2, 'canvas.size.width': 2400, 'canvas.size.height': 1200,
      'wave.frame.width': 320, 'wave.frame.height': 180, 'structure.count': 40 },
  } });
  await page.addInitScript(value => {
    if (!localStorage.getItem('toolcraft:work-with-masks-hero:state:v2')) {
      localStorage.setItem('toolcraft:work-with-masks-hero:state:v2', value);
    }
  }, snapshot);
}
