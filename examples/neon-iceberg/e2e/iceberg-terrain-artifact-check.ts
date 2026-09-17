import fs from 'node:fs/promises';
import { expect, type Page } from '@playwright/test';
import { downloadImage, setChoice, setNumber } from './iceberg-test-helpers';

export async function verifyTerrainArtifact(page: Page) {
  await setNumber(page,'iceberg.frequency',9.3);
  await page.getByRole('switch',{name:'Background',exact:true}).uncheck();
  await setChoice(page,'export.image.resolution','2K');
  const download=await downloadImage(page), path=await download.path();
  expect(path).toBeTruthy();
  const bytes=await fs.readFile(path!);
  const profile=await page.evaluate(async base64=>{
    const bytes=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));
    const bitmap=await createImageBitmap(new Blob([bytes],{type:'image/png'}));
    try {
      const canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;
      const context=canvas.getContext('2d')!;context.drawImage(bitmap,0,0);
      const pixels=context.getImageData(0,0,canvas.width,canvas.height).data;
      const top=Array<number>(canvas.width).fill(-1);
      for(let x=0;x<canvas.width;x++) for(let y=0;y<canvas.height;y++) {
        if(pixels[(y*canvas.width+x)*4+3]>127) {top[x]=y;break;}
      }
      return {top,width:canvas.width,height:canvas.height};
    } finally {bitmap.close();}
  },bytes.toString('base64'));
  expect([profile.width,profile.height]).toEqual([1536,2048]);
  expect(profile.top.filter(y=>y>=0).length).toBeGreaterThan(profile.width/3);
  let largestNeedle=0;
  // A one/two-pixel spire must not extend far beyond both neighboring columns.
  for(let x=2;x<profile.width-2;x++) {
    const [left,center,right]=[profile.top[x-2],profile.top[x],profile.top[x+2]];
    if(left>=0&&center>=0&&right>=0) largestNeedle=Math.max(largestNeedle,Math.min(left,right)-center);
  }
  expect(largestNeedle,'Decoded PNG must not contain a tall, isolated silhouette needle').toBeLessThan(profile.height*0.01);
  console.log('Export silhouette', {width:profile.width,height:profile.height,largestNeedle});
}
