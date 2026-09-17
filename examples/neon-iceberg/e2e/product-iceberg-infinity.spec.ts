import { expect,test } from './toolcraft-product-test';
import { observeInfinityCanvas,expectToolcraftInfinityCanvasModeEvidence,expectToolcraftInfinityCanvasImageExportEvidence } from './browser-infinity-canvas-evidence';
import { downloadImage,inspectImage,openIceberg,panEmpty,setChoice } from './iceberg-test-helpers';
import type { Page } from '@playwright/test';

async function toggleWithContinuity(page:Page,action:()=>Promise<void>) {
  const host=await page.locator('[data-toolcraft-product-scene]').elementHandle();
  const output=await page.locator('[data-iceberg-canvas]').elementHandle();
  await action();
  return {productHostPreserved:await host!.evaluate(e=>e===document.querySelector('[data-toolcraft-product-scene]')),productOutputPreserved:await output!.evaluate(e=>e===document.querySelector('[data-iceberg-canvas]'))};
}
test('browser: iceberg infinity preserves scene and crop',async({page})=>{
  await openIceberg(page);await setChoice(page,'export.image.resolution','2K');
  const finite=(await inspectImage(page,await downloadImage(page))).inspection;
  const before=await observeInfinityCanvas(page);
  const beforeToEnabled=await toggleWithContinuity(page,()=>page.getByRole('switch',{name:'Infinity canvas',exact:true}).check());
  const enabled=await observeInfinityCanvas(page);
  await panEmpty(page);const afterPan=await observeInfinityCanvas(page);
  await expect(page.locator('[data-slot="toolcraft-runtime-app"]')).toHaveAttribute('data-toolcraft-persistence-status','success');
  await page.reload();const afterReload=await observeInfinityCanvas(page);
  const afterReloadToRestored=await toggleWithContinuity(page,()=>page.getByRole('switch',{name:'Infinity canvas',exact:true}).uncheck());
  const restored=await observeInfinityCanvas(page);
  const restoredToUndone=await toggleWithContinuity(page,()=>page.getByRole('button',{name:'Undo',exact:true}).click());const undone=await observeInfinityCanvas(page);
  const restoredExport=(await inspectImage(page,await downloadImage(page))).inspection;
  const undoneToRedone=await toggleWithContinuity(page,()=>page.getByRole('button',{name:'Redo',exact:true}).click());const redone=await observeInfinityCanvas(page);
  await expectToolcraftInfinityCanvasModeEvidence({before,enabled,afterPan,afterReload,restored,undone,redone},{beforeToEnabled,afterReloadToRestored,restoredToUndone,undoneToRedone},{expectedFiniteSize:{width:1200,height:1600},expectedSceneRect:{x:-500,y:-700,width:1000,height:1400},requirementId:'iceberg.infinity',target:'canvas.infinity'});
  await expectToolcraftInfinityCanvasImageExportEvidence({finite,infinite:restoredExport},{expectedFiniteSize:{width:1536,height:2048},expectedInfiniteSize:{width:1463,height:2048},requirementId:'iceberg.infinity-export',target:'actions.output'});
});
