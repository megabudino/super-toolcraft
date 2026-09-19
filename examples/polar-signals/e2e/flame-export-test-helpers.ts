import type { Page } from '@playwright/test';
import { fieldValue, setSlider } from './flame-test-helpers';
export const backgroundRgba = [238,235,255,255] as const;
export async function solidGraph(page: Page) {
  for (const target of ['flame.dark','flame.middle','flame.light']) await fieldValue(page,target,'#000000');
  await setSlider(page,'flame.noise',0);await setSlider(page,'flame.border',0);
}
export const solidArtifact = {
  backgroundRgba, expectedBounds: {x:0,y:.1,width:1,height:.8},
  expectedPixels: [{xRatio:.5,yRatio:.6,rgba:[0,0,0,255] as const},{xRatio:.5,yRatio:.02,rgba:backgroundRgba}],
};
