import { expect, test, expectToolcraftReferenceParity, expectToolcraftCanvasRenderScaleEvidence } from './toolcraft-product-test';
import { expectToolcraftProductObservableToChange } from './product-observable-helpers';
import { expectToolcraftDiscreteSliderMarkers } from './performance-control-layout-helpers';
import { openFlame, fieldValue, outputSelector, fitScene, setSlider } from './flame-test-helpers';
import { expectFlameZoomContinuity } from './flame-zoom-continuity';

test('browser: flame canvas sizing changes output',async({page})=>{
 const session=await openFlame(page);
 await page.getByRole('switch',{name:'Infinity canvas',exact:true}).uncheck();
 await expectToolcraftProductObservableToChange(session,session.controlAction('canvas.size.width',async()=>fieldValue(page,'canvas.size.width','960')),{requirementId:'canvas.size',selector:outputSelector});
 await expectToolcraftReferenceParity(async()=>page.locator(outputSelector).evaluate((c:HTMLCanvasElement)=>[c.width,c.height]),[1920,1080],{requirementId:'canvas.size',target:'canvas.size.width'});
});
test('browser: flame backing preserves selected render scale',async({page})=>{
 const session=await openFlame(page);await fitScene(page);
 await expectToolcraftProductObservableToChange(session,session.controlAction('canvas.renderScale',async()=>setSlider(page,'canvas.renderScale',1)),{requirementId:'canvas.scale',selector:outputSelector});
 await setSlider(page,'canvas.renderScale',2);
 await expectToolcraftDiscreteSliderMarkers(page,'canvas.renderScale','canvas.scale');
 await expectToolcraftCanvasRenderScaleEvidence(page,{canvasSelector:outputSelector,requirementId:'canvas.scale',target:'canvas.renderScale',selectedScale:2,stateTransitions:[
  {state:'interaction',run:async()=>setSlider(page,'flame.columns',110)},
  {state:'steady',run:async()=>{await expect(page.locator(outputSelector)).toHaveAttribute('data-frame-ready','true');}},
 ]});
 await expectFlameZoomContinuity(page);
});
