import { expect, test } from './toolcraft-product-test';
import { inspectToolcraftImageDownload } from './image-artifact-inspection';
import { expectToolcraftBackgroundOutputSemantics } from './browser-background-output-evidence';
import { expectToolcraftInfinityCanvasBackgroundEvidence, observeInfinityCanvasBackground } from './browser-infinity-canvas-evidence';
import { openFlame, selectValue, downloadImage } from './flame-test-helpers';

test('browser: flame background output follows runtime semantics',async({page})=>{
 const session=await openFlame(page);await selectValue(page,'export.image.resolution','2K');
 await page.getByRole('switch',{name:'Infinity canvas',exact:true}).uncheck();
 const observe=session.observe(root=>{
  const background=root.querySelector<HTMLElement>('[data-toolcraft-finite-background-layer]');
  return {backgroundVisible:background!==null,outputSignature:background?getComputedStyle(background).backgroundColor:'transparent'};
 });
 await expectToolcraftBackgroundOutputSemantics(observe,session.controlAction('export.includeBackground',async field=>field.getByRole('switch').uncheck()),{backgroundVisible:false,outputSignature:'transparent'},session.targetAction('flame.regenerate',()=>downloadImage(page)),async download=>{
  const result=await inspectToolcraftImageDownload({download,page,backgroundRgba:[0,0,0,0]});
  return {...result.inspection,backgroundAlpha:result.observation.normalizedPixels[3]};
 },{requirementId:'background.output'});
 await page.getByRole('switch',{name:'Background',exact:true}).check();
 await page.getByRole('switch',{name:'Infinity canvas',exact:true}).check();
 const infinite=await observeInfinityCanvasBackground(page);
 await page.getByRole('switch',{name:'Background',exact:true}).uncheck();
 const backgroundExcluded=await observeInfinityCanvasBackground(page);
 await page.getByRole('switch',{name:'Background',exact:true}).check();
 const backgroundRestored=await observeInfinityCanvasBackground(page);
 await expectToolcraftInfinityCanvasBackgroundEvidence({infinite,backgroundExcluded,backgroundRestored},{requirementId:'background.output',target:'export.includeBackground',expectedBackgroundColor:'#EEEBFF'});
 await expect(page.getByRole('switch',{name:'Infinity canvas',exact:true})).not.toBeChecked();
});
