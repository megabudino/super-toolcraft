import { test } from './toolcraft-product-test';
import { expectToolcraftImageExportArtifact } from './browser-media-export-evidence';
import { expectToolcraftReferenceParity } from './browser-acceptance-outcome-helpers';
import { inspectToolcraftImageDownload } from './image-artifact-inspection';
import { expectToolcraftInfinityCanvasImageExportEvidence } from './browser-infinity-canvas-evidence';
import { openFlame, selectValue, downloadImage } from './flame-test-helpers';
import { solidGraph, solidArtifact, backgroundRgba } from './flame-export-test-helpers';

test('browser: flame image export delivers all formats and sizes',async({page})=>{
 const session=await openFlame(page);await solidGraph(page);
 for(const [format,mediaType] of [['PNG','image/png'],['JPG','image/jpeg']] as const) {
  await selectValue(page,'export.image.format',format);
  for(const [resolution,width] of [['2K',2048],['4K',4096],['8K',8192]] as const){
   await selectValue(page,'export.image.resolution',resolution);
   await expectToolcraftImageExportArtifact(session.targetAction('flame.regenerate',()=>downloadImage(page)),{
    ...solidArtifact,page,requirementId:'export.image',expectedWidth:width,expectedHeight:width*9/16,expectedMediaType:mediaType,
    additionalArtifactRequirements:[{requirementId:'export.image.format',target:'export.image.format'},{requirementId:'export.image.resolution',target:'export.image.resolution'}],
   });
  }
 }
 await selectValue(page,'export.image.format','PNG');await selectValue(page,'export.image.resolution','2K');
 await page.getByRole('switch',{name:'Infinity canvas',exact:true}).uncheck();
 const finite=(await inspectToolcraftImageDownload({page,download:await downloadImage(page),backgroundRgba})).inspection;
 await page.getByRole('switch',{name:'Infinity canvas',exact:true}).check();
 const infinite=(await inspectToolcraftImageDownload({page,download:await downloadImage(page),backgroundRgba})).inspection;
 await expectToolcraftInfinityCanvasImageExportEvidence({finite,infinite},{expectedSize:{width:2048,height:1152},requirementId:'export.image',target:'flame.regenerate'});
 await expectToolcraftReferenceParity(async()=>[infinite.width/infinite.height,infinite.decodedPixelHash===finite.decodedPixelHash],[16/9,true],{requirementId:'export.image',target:'flame.regenerate'});
});
