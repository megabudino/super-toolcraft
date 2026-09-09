import type { Page } from "@playwright/test";

const HERO_STORAGE_KEY = "toolcraft:work-with-masks-hero:state:v2";

export async function installHeroBrowserFixture(
  page: Page,
  options: Readonly<{
    includeBackground?: boolean;
    sunIntensity?: number;
    values?: Readonly<Record<string, unknown>>;
    wave?: number;
  }> = {},
): Promise<void> {
  const lightweightHeroState = JSON.stringify({
    state: {
      canvas: {
        mode: "finite",
        offset: { x: 0, y: 0 },
        size: { height: 180, unit: "px", width: 320 },
        zoom: 100,
      },
      timeline: {
        currentTimeSeconds: 0,
        isPlaying: false,
      },
      values: {
        "canvas.renderScale": 0.25,
        "canvas.size.height": 180,
        "canvas.size.width": 320,
        "export.includeBackground": options.includeBackground ?? false,
        "light.intensity": options.sunIntensity ?? 0,
        "structure.count": 40,
        "structure.wave": options.wave ?? 0,
        "wave.frame.height": 180,
        "wave.frame.position": { x: 0, y: 0 },
        "wave.frame.width": 320,
        ...options.values,
      },
    },
    version: 2,
  });
  await page.addInitScript(
    ({ key, state }) => {
      if (localStorage.getItem(key) === null) {
        localStorage.setItem(key, state);
      }
    },
    { key: HERO_STORAGE_KEY, state: lightweightHeroState },
  );
}
