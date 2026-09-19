import { expect, test } from './toolcraft-product-test';
import { expectToolcraftProductObservableToChange, getToolcraftProductObservableSnapshot } from './product-observable-helpers';
import { expectToolcraftReferenceParity } from './browser-acceptance-outcome-helpers';
import { expectToolcraftDiscreteSliderMarkers, expectToolcraftSegmentedControlCellsPreservePadding } from './performance-control-layout-helpers';
import { dragCanvasHandle, expectExportExcludesCanvasHandles } from './canvas-handle-helpers';
import { expectToolcraftImageExportArtifact } from './browser-media-export-evidence';
import { solidGraph, solidArtifact } from './flame-export-test-helpers';
import { inspectToolcraftImageDownload } from './image-artifact-inspection';
import { getToolcraftControlFieldByTarget } from './browser-control-target-helpers';
import { openFlame, fieldValue, outputSelector, fitScene, setSlider, selectValue, downloadImage } from './flame-test-helpers';

for (const [key,value] of Object.entries({columns:130,depth:23,noise:75,core:80,border:70})) {
 test(`browser: flame parameter flame.${key}`, async({page})=>{
  const session=await openFlame(page); const target=`flame.${key}`;
  const field=await getToolcraftControlFieldByTarget(page,target);
  const slider=field.getByRole('slider');await slider.scrollIntoViewIfNeeded();
  const track=await field.locator('[data-slot="slider"]').first().boundingBox();expect(track).not.toBeNull();
  // Assert raster changes while the pointer remains held, before committing the gesture.
  await expectToolcraftProductObservableToChange(session,session.controlAction(target,async()=>{
    const thumb=await slider.boundingBox();expect(thumb).not.toBeNull();
    await page.mouse.move(thumb!.x+thumb!.width/2,thumb!.y+thumb!.height/2);await page.mouse.down();
    await page.mouse.move(track!.x+track!.width*.85,track!.y+track!.height/2,{steps:8});
  }),{requirementId:target,selector:outputSelector});
  await page.mouse.up();
  await setSlider(page,target,value);
  await expectToolcraftReferenceParity(async()=>Number(await field.getByRole('button',{name:/^Edit .* value$/}).innerText().then(s=>s.replace('%',''))),value,{requirementId:target,target});
  if(key==='depth') await expectToolcraftDiscreteSliderMarkers(page,target,target);
 });
}
for (const key of ['dark','middle','light']) test(`browser: flame parameter flame.${key}`,async({page})=>{
 const session=await openFlame(page);const target=`flame.${key}`;
 await expectToolcraftProductObservableToChange(session,session.controlAction(target,async()=>fieldValue(page,target,'#EF3E32')),{requirementId:target,selector:outputSelector});
 await expectToolcraftReferenceParity(async()=> (await getToolcraftControlFieldByTarget(page,target)).getByRole('textbox').inputValue(),'#EF3E32',{requirementId:target,target});
});
test('browser: flame parameter flame.layout',async({page})=>{
 const session=await openFlame(page);const target='flame.layout';
 for(const [label,count] of [['Top Down',7],['Center',21]] as const){
  await expectToolcraftProductObservableToChange(session,session.controlAction(target,async(field)=>field.getByRole('button',{name:label,exact:true}).click()),{requirementId:target,selector:outputSelector});
  await expectToolcraftReferenceParity(()=>page.locator('[data-testid="flame-guides"] circle').count(),count,{requirementId:target,target});
 }
 await expectToolcraftSegmentedControlCellsPreservePadding(page,'Layout',{target,requirementId:target});
});
test('browser: flame guides preserve constrained vertical editing',async({page})=>{
 const session=await openFlame(page);await fitScene(page);
 // Keep the raster comparison free of the overlapping panel's composited edges.
 await page.getByRole('button',{name:'Collapse controls',exact:true}).click();
 await expect(page.getByRole('button',{name:'Expand controls',exact:true})).toBeVisible();
 const before=await getToolcraftProductObservableSnapshot(page,{selector:outputSelector});
 const handle=page.getByTestId('flame-mid-3');const cy=Number(await handle.getAttribute('cy'));
 await expectToolcraftProductObservableToChange(session,session.targetAction('controls.setValue',async()=>dragCanvasHandle(page,'flame-mid-3',{x:50,y:65},{requirementId:'flame.guides',target:'controls.setValue'})),{requirementId:'flame.guides',selector:outputSelector});
 await expect(handle).toHaveAttribute('cx','480');expect(Number(await handle.getAttribute('cy'))).toBeGreaterThan(cy);
 await page.getByRole('button',{name:'Undo',exact:true}).click();
 await expect(handle).toHaveAttribute('cy','270');
 await expect(page.locator(outputSelector)).toHaveAttribute('data-frame-ready','true');
 await expect.poll(()=>getToolcraftProductObservableSnapshot(page,{selector:outputSelector})).toBe(before);
 await expectToolcraftReferenceParity(async()=>Number(await handle.getAttribute('cy')),270,{requirementId:'flame.guides',target:'controls.setValue'});
 await page.getByRole('button',{name:'Expand controls',exact:true}).click();
 await selectValue(page,'export.image.resolution','2K');
 await expectExportExcludesCanvasHandles(page,()=>downloadImage(page),async download=>(await inspectToolcraftImageDownload({download,page,backgroundRgba:[238,235,255,255]})).inspection,{requirementId:'flame.guides',target:'controls.setValue'});
});
test('browser: flame regeneration preserves parameters',async({page})=>{
 const session=await openFlame(page);const target='flame.regenerate';
 const guides=await page.getByTestId('flame-guides').innerHTML();
 await expectToolcraftProductObservableToChange(session,session.controlAction(target,async()=>page.getByRole('button',{name:'Regenerate',exact:true}).click()),{requirementId:target,selector:outputSelector});
 await expectToolcraftReferenceParity(()=>page.getByTestId('flame-guides').innerHTML(),guides,{requirementId:target,target});
 await solidGraph(page);await selectValue(page,'export.image.resolution','2K');
 await expectToolcraftImageExportArtifact(session.targetAction(target,()=>downloadImage(page)),{...solidArtifact,page,requirementId:target,expectedWidth:2048,expectedHeight:1152,expectedMediaType:'image/png'});
});
