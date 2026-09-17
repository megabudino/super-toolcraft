import { expect,test } from './toolcraft-product-test';
import { createToolcraftBrowserProofSession } from './browser-proof-session';
import { expectToolcraftProductObservableToChange } from './product-observable-helpers';
import { expectToolcraftDiscreteSliderMarkers } from './performance-control-layout-helpers';
import { expectToolcraftCanvasRenderScaleEvidence } from './browser-render-scale-evidence';
import { field,icebergSelector,openIceberg,setNumber } from './iceberg-test-helpers';

test('browser: iceberg selected backing survives interaction',async({page})=>{
  await openIceberg(page);const session=await createToolcraftBrowserProofSession(page);
  await expectToolcraftProductObservableToChange(session,session.controlAction('canvas.renderScale',async()=>setNumber(page,'canvas.renderScale',1)),{requirementId:'iceberg.backing',selector:icebergSelector});
  await setNumber(page,'canvas.renderScale',2);
  await expectToolcraftDiscreteSliderMarkers(page,'canvas.renderScale','iceberg.backing');
  // A material edit keeps the product frame fixed while exercising live
  // rendering. Shape-driven frame growth has its own depth/zoom pixel proof.
  const materialSection=page.getByRole('button',{name:'Toggle Material section'});
  if(await materialSection.getAttribute('aria-expanded')==='false') await materialSection.click();
  const slider=field(page,'iceberg.grain').getByRole('slider');await slider.scrollIntoViewIfNeeded();const box=(await slider.boundingBox())!;
  await expectToolcraftCanvasRenderScaleEvidence(page,{canvasSelector:icebergSelector,requirementId:'iceberg.backing',target:'canvas.renderScale',selectedScale:2,stateTransitions:[
    {state:'interaction',run:async()=>{await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+36,box.y+box.height/2,{steps:4});}},
    {state:'playback',run:async()=>{await page.mouse.up();const scrubber=page.getByRole('slider',{name:'Playback position'});await scrubber.press('Home');await page.getByRole('button',{name:'Play playback'}).click();await expect(page.getByRole('button',{name:'Pause playback'})).toBeVisible();}},
    {state:'steady',run:async()=>{await page.getByRole('button',{name:'Pause playback'}).click();await expect(slider).not.toHaveAttribute('aria-valuenow','0.23');}},
  ]});
});
