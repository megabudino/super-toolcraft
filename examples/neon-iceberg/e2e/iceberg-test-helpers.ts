import { expect, type Download, type Page } from '@playwright/test';
import { inspectToolcraftImageDownload } from './image-artifact-inspection';
import { createToolcraftBrowserProofSession } from './browser-proof-session';
import type { ToolcraftOrientationBrowserObservation } from './browser-orientation-gizmo-evidence-helpers';

export const icebergSelector='[data-iceberg-canvas]';
export const field=(page:Page,target:string)=>page.locator(`[data-toolcraft-control-target="${target}"]`);
export async function openIceberg(page:Page) {
  await page.goto('/');
  await page.locator(icebergSelector).waitFor({ state: 'visible' });
  // Saved defaults may autoplay; freeze the scene before testing a control.
  const pause = page.getByRole('button', { name: 'Pause playback', exact: true });
  if (await pause.isVisible()) await pause.click();
  await page.waitForFunction(() =>
    (document.querySelector<HTMLCanvasElement>('[data-iceberg-canvas]')?.width ?? 0) > 500,
  );
  for(let i=0;i<4;i++) await page.getByRole('button',{name:'Zoom out',exact:true}).click();
  await page.getByRole('button',{name:'Center canvas',exact:true}).click();
}
export async function setNumber(page:Page,target:string,value:number) {
  const control=field(page,target);
  const edit=control.getByRole('button',{name:/^Edit .* value$/});
  const hasEditor=await edit.count();
  if(hasEditor) await edit.click();
  // Slider numeric editors are portaled outside the field. Never fill the
  // internal range input: its smooth pointer step differs from integer values.
  const input=hasEditor?page.getByRole('textbox',{name:/ value$/}).filter({visible:true}).first():control.locator('input').filter({visible:true}).first();
  await input.fill(String(value)); await input.press('Enter');
}
export async function setChoice(page:Page,target:string,label:string) {
  await field(page,target).getByRole('combobox').click();
  await page.getByRole('option',{name:label,exact:true}).click();
}
export async function setIcebergTimelineLoop(page:Page,enabled:boolean) {
  const toggle=page.getByRole('button',{name:enabled?'Enable loop':'Disable loop'});
  if(await toggle.isVisible()) await toggle.click();
}
export async function setIcebergTimelineFrame(page:Page,frame:'start'|'end') {
  const scrubber=page.getByRole('slider',{name:'Playback position'});
  if(frame==='end') await setIcebergTimelineLoop(page,false);
  await scrubber.press(frame==='start'?'Home':'End');
}
export async function downloadImage(page:Page):Promise<Download> {
  const pending=page.waitForEvent('download');
  await page.getByRole('button',{name:/^Export (PNG|JPG)$/}).click();
  return pending;
}
export const inspectImage=(page:Page,download:Download,backgroundRgba:readonly[number,number,number,number]=[255,255,255,255])=>inspectToolcraftImageDownload({page,download,backgroundRgba});
export async function dragNumber(page:Page,target:string,during?:()=>Promise<void>) {
  const slider=field(page,target).getByRole('slider');
  await slider.scrollIntoViewIfNeeded();
  const rect=await slider.boundingBox(); if(!rect) throw new Error(`Missing slider ${target}`);
  const before=await slider.getAttribute('aria-valuenow');
  await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);await page.mouse.down();
  try {
    const min=Number(await slider.getAttribute('min') ?? await slider.getAttribute('aria-valuemin'));
    const max=Number(await slider.getAttribute('max') ?? await slider.getAttribute('aria-valuemax'));
    const direction=Number(before)>(min+max)/2?-1:1;
    await page.mouse.move(rect.x+rect.width/2+direction*55,rect.y+rect.height/2,{steps:7});
    await expect(slider).not.toHaveAttribute('aria-valuenow',before!);
    await during?.();
  }finally{await page.mouse.up();}
}
export async function orientationObservation(page:Page) {
  const session=await createToolcraftBrowserProofSession(page);
  const observation=session.observe<ToolcraftOrientationBrowserObservation>(root=>{
    const canvas=root.querySelector<HTMLCanvasElement>('[data-iceberg-canvas]')!;
    const scratch=document.createElement('canvas');scratch.width=64;scratch.height=64;
    const ctx=scratch.getContext('2d')!;ctx.drawImage(canvas,0,0,64,64);
    const pixels=ctx.getImageData(0,0,64,64).data;
    let hash=2166136261;for(const value of pixels) hash=Math.imul(hash^value,16777619);
    const signature=(hash>>>0).toString(16);
    const gizmo=root.querySelector<HTMLElement>('[data-toolcraft-orientation-pose]')!;
    const world=root.querySelector<HTMLElement>('[data-toolcraft-canvas-world]')!;
    return { outputSignature:signature,pixelSignature:signature,pose:JSON.parse(gizmo.dataset.toolcraftOrientationPose!),poseTarget:gizmo.dataset.toolcraftOrientationTarget!,presentationDocumentId:'procedural-iceberg-grid-192',presentationCacheKey:'iceberg-three-v1',viewportOffsetX:Number(world.dataset.toolcraftCanvasOffsetX),viewportOffsetY:Number(world.dataset.toolcraftCanvasOffsetY) };
  });
  return {session,observation};
}
export async function panEmpty(page:Page) {
  const box=await page.getByRole('application',{name:'Canvas viewport'}).boundingBox();if(!box)throw new Error('Missing viewport');
  await page.mouse.move(box.x+90,box.y+90);await page.keyboard.down('Space');await page.mouse.down();
  await page.mouse.move(box.x+130,box.y+115,{steps:5});await page.mouse.up();await page.keyboard.up('Space');
}
