import type { Page } from '@playwright/test';
import { expect,test } from './toolcraft-product-test';
import { observeInfinityCanvas,expectToolcraftInfinityCanvasModeEvidence } from './browser-infinity-canvas-evidence';
import { openFlame,fitScene,outputSelector } from './flame-test-helpers';
async function continuity(page:Page, action:()=>Promise<void>) {
 const host=await page.locator('[data-toolcraft-product-scene]').elementHandle();
 const output=await page.locator(outputSelector).elementHandle();
 await action();
 return {
  productHostPreserved:await host!.evaluate(node=>node.isConnected&&node===document.querySelector('[data-toolcraft-product-scene]')),
  productOutputPreserved:await output!.evaluate(node=>node.isConnected&&node===document.querySelector('[data-testid="flame-output"]')),
 };
}
test('browser: flame infinity preserves scene and viewport',async({page})=>{
 await openFlame(page);
 const toggle=page.getByRole('switch',{name:'Infinity canvas',exact:true});
 await expect(toggle).toBeChecked();
 await expect(page.getByRole('textbox',{name:'Canvas width',exact:true})).toHaveCount(0);
 await expect(page.getByRole('textbox',{name:'Canvas height',exact:true})).toHaveCount(0);
 await fitScene(page);
 const before=await observeInfinityCanvas(page);
 const beforeToEnabled=await continuity(page,()=>toggle.check());
 const enabled=await observeInfinityCanvas(page);
 await page.mouse.move(180,200);await page.keyboard.down('Space');await page.mouse.down();await page.mouse.move(224,228,{steps:6});await page.mouse.up();await page.keyboard.up('Space');
 const afterPan=await observeInfinityCanvas(page);
 await expect(page.locator('[data-slot="toolcraft-runtime-app"]')).toHaveAttribute('data-toolcraft-persistence-status','success');
 await page.reload();await expect(page.locator(outputSelector)).toHaveAttribute('data-frame-ready','true');
 const afterReload=await observeInfinityCanvas(page);
 const afterReloadToRestored=await continuity(page,()=>toggle.uncheck());const restored=await observeInfinityCanvas(page);
 const restoredToUndone=await continuity(page,()=>page.getByRole('button',{name:'Undo',exact:true}).click());const undone=await observeInfinityCanvas(page);
 const undoneToRedone=await continuity(page,()=>page.getByRole('button',{name:'Redo',exact:true}).click());const redone=await observeInfinityCanvas(page);
 await expectToolcraftInfinityCanvasModeEvidence({before,enabled,afterPan,afterReload,restored,undone,redone},{beforeToEnabled,afterReloadToRestored,restoredToUndone,undoneToRedone},{expectedFiniteSize:{width:960,height:540},expectedSceneRect:{x:-480,y:-270,width:960,height:540},requirementId:'canvas.infinity',target:'canvas.infinity'});
});
