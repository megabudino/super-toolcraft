import { expect,test,expectToolcraftOrientationAxisDrag,expectToolcraftOrientationAxisSnap,expectToolcraftOrientationModelDrag,expectToolcraftOrientationCanvasMissPan,expectToolcraftOrientationUndoReset,expectExportExcludesCanvasHandles } from './toolcraft-product-test';
import { readToolcraftBrowserObservation } from './browser-proof-session';
import { downloadImage,inspectImage,openIceberg,orientationObservation,panEmpty,setChoice } from './iceberg-test-helpers';

test('browser: iceberg orbit shares pose history and clean export',async({page})=>{
  await openIceberg(page);await setChoice(page,'export.image.resolution','2K');
  const {session,observation}=await orientationObservation(page),options={requirementId:'iceberg.orbit',target:'view.orbit'};
  const baseline=await readToolcraftBrowserObservation(observation);
  const changed=await expectToolcraftOrientationAxisDrag(observation,session,{...options,dragDelta:{x:27,y:-15}});
  await expectToolcraftOrientationUndoReset(observation,session.action(async p=>p.getByRole('button',{name:'Undo',exact:true}).click()),session.action(async p=>p.getByRole('button',{name:'Redo',exact:true}).click()),session.action(async p=>p.getByRole('button',{name:'Reset Mountain section',exact:true}).click()),baseline,changed,options);
  await expectToolcraftOrientationAxisSnap(observation,session,'+z',options);
  await expectToolcraftOrientationModelDrag(observation,session,{...options,dragDelta:{x:34,y:18}});
  await expectToolcraftOrientationCanvasMissPan(observation,session.action(panEmpty),options);
  const poseBeforeLock=await page.getByRole('application',{name:'3D orientation gizmo'}).getAttribute('data-toolcraft-orientation-pose');
  await page.getByRole('switch',{name:'Lock rotation',exact:true}).check();
  await expect(page.getByRole('application',{name:'3D orientation gizmo'})).toHaveAttribute('aria-disabled','true');
  await page.getByRole('switch',{name:'Lock rotation',exact:true}).uncheck();
  await expect(page.getByRole('application',{name:'3D orientation gizmo'})).toHaveAttribute('data-toolcraft-orientation-pose',poseBeforeLock!);
  await expectExportExcludesCanvasHandles(page,()=>downloadImage(page),async download=>{const {inspection}=await inspectImage(page,download);return {...inspection,contentHash:inspection.decodedPixelHash};},{...options,requirementId:"iceberg.orbit#export-clean"});
});
