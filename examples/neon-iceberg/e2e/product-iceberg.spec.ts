import { verifyComplexSeam, verifyJaggedSeam } from './iceberg-seam-check';
import { verifyChipScale } from './iceberg-chip-check';
import { verifyDramaticLight } from './iceberg-light-check';
import { verifyTerrainContinuity, verifyTerrainNeedles, verifyTerrainPerimeter } from './iceberg-terrain-check';
import { verifyTerrainArtifact } from './iceberg-terrain-artifact-check';
import { verifySceneFraming } from './iceberg-framing-check';
import { verifyFourEqualBasePlates } from './iceberg-plates-check';
import { icebergParameters,icebergTarget } from '../src/app/iceberg-controls';
import { expect,test } from './toolcraft-product-test';
import { createToolcraftBrowserProofSession } from './browser-proof-session';
import { expectToolcraftProductObservableToChange,getToolcraftProductObservableSnapshot } from './product-observable-helpers';
import { dragNumber,icebergSelector,openIceberg,setNumber } from './iceberg-test-helpers';

for(const p of icebergParameters.filter(p=>p.section!=='patterns'&&p.section!=='engraving')) test(`browser: iceberg ${p.key} changes visible relief live`,async({page})=>{
  await openIceberg(page);const session=await createToolcraftBrowserProofSession(page);
  if(p.key==='seamScale') await setNumber(page,'iceberg.seamJagged',1);
  const target=icebergTarget(p.key);
  const before=await getToolcraftProductObservableSnapshot(page,{selector:icebergSelector});
  await expectToolcraftProductObservableToChange(session,session.controlAction(target,async()=>{
    await dragNumber(page,target,async()=>{
      await expect.poll(()=>getToolcraftProductObservableSnapshot(page,{selector:icebergSelector})).not.toBe(before);
    });
  }),{requirementId:target,selector:icebergSelector});
  if(p.key==='seamValley') await verifyComplexSeam(page);
  if(p.key==='seamJagged') await verifyJaggedSeam(page);
  if(p.key==='seamScale') await verifyChipScale(page);
  if(p.key==='lightDrama') await verifyDramaticLight(page);
  if(p.key==='frequency') { await verifyTerrainContinuity(page); await verifyTerrainNeedles(page); await verifyTerrainArtifact(page); }
  if(p.key==='shoulder') await verifyTerrainPerimeter(page);
  if(p.key==='depth') await verifySceneFraming(page,session);
  if(p.key==='plateGap') await verifyFourEqualBasePlates(page);
});
for(const [key,label] of [['rockColor','Rock'],['iceColor','Ice']] as const) test(`browser: iceberg ${key} changes surface pixels`,async({page})=>{
  await openIceberg(page);const session=await createToolcraftBrowserProofSession(page),target=icebergTarget(key);
  const expandMaterial = page.getByRole('button', { name: 'Expand Material section', exact: true });
  if (await expandMaterial.count()) await expandMaterial.click();
  await expectToolcraftProductObservableToChange(session,session.controlAction(target,async()=>{
    const input=page.getByRole('textbox',{name:`${label} hex`});await input.fill('#88C8DD');await input.press('Enter');
  }),{requirementId:target,selector:icebergSelector});
});
