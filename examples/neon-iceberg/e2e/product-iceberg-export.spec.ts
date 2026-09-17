import { expect,test } from './toolcraft-product-test';
import { createToolcraftBrowserProofSession } from './browser-proof-session';
import { expectToolcraftImageExportArtifact } from './browser-media-export-evidence';
import { downloadImage,field,inspectImage,openIceberg,setChoice } from './iceberg-test-helpers';

const background=[255,255,255,255] as const;
test('browser: iceberg image export has selected pixels and format',async({page})=>{
  await openIceberg(page);const session=await createToolcraftBrowserProofSession(page);
  for(const label of ['Rock','Ice']) { const input=page.getByRole('textbox',{name:`${label} hex`});await input.fill('#000000');await input.press('Enter'); }
  for(const [format,resolution,edge] of [['PNG','2K',2048],['JPG','4K',4096],['PNG','8K',8192]] as const) {
    await setChoice(page,'export.image.format',format);await setChoice(page,'export.image.resolution',resolution);
    await expect(page.getByRole('button',{name:`Export ${format}`,exact:true})).toBeVisible();
    await expectToolcraftImageExportArtifact(session.targetAction('actions.output',()=>downloadImage(page)),{
      page,requirementId:'export.image.artifact',backgroundRgba:background,expectedMediaType:format==='PNG'?'image/png':'image/jpeg',expectedWidth:Math.round(edge*0.75),expectedHeight:edge,
      expectedBounds:{x:0.234375,y:0.265625,width:0.53125,height:0.515625},
      expectedPixels:[{xRatio:0.05,yRatio:0.05,rgba:background},{xRatio:0.5,yRatio:0.65,rgba:[0,0,0,255]}],
      additionalArtifactRequirements:[{requirementId:'export.image.artifact',target:'actions.output'},{requirementId:'export.image.format',target:'export.image.format'},{requirementId:'export.image.resolution',target:'export.image.resolution'}],
    });
  }
  await page.getByRole('button',{name:'Reset Image Export section',exact:true}).click();await expect(page.getByRole('button',{name:'Export PNG',exact:true})).toBeVisible();
});

