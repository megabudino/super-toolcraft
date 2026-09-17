import { expect, type Page } from '@playwright/test';
import { icebergDefaults, icebergParameters } from '../src/app/iceberg-controls';
import { ICEBERG_SEGMENTS } from '../src/app/iceberg-topology-settings';
import { probeIcebergField, probeIcebergFields } from './iceberg-field-probe';

export async function verifyTerrainContinuity(page: Page) {
  const points: number[] = [], epsilon = 0.000001;
  // Cross the angular cut on the negative-X side of the offset summit.
  for (let i=1;i<90;i++) {
    const x=icebergDefaults.asymmetry*0.42-i/100;
    const z=-icebergDefaults.asymmetry*0.18;
    points.push(x,z-epsilon,x,z+epsilon);
  }
  const frequency = icebergParameters.find(p=>p.key==='frequency')!;
  const settings = Array.from({length:Math.round((frequency.max-frequency.min)/frequency.step)+1}, (_,i) => ({
    ...icebergDefaults, frequency:frequency.min+i*frequency.step,
  }));
  let largestJump=0;
  for (const samples of await probeIcebergFields(page,points,settings)) {
    expect(samples.every(Number.isFinite)).toBe(true);
    for (let i=0;i<samples.length;i+=4) largestJump=Math.max(largestJump,Math.abs(samples[i]-samples[i+2]));
  }
  expect(largestJump,'Adjacent points across the polar cut must have continuous heights').toBeLessThan(0.001);

  const axes: number[]=[];
  // Both axis directions, the seam origin and the exact offset summit.
  for (let i=-100;i<=100;i++) for (const e of [-epsilon,0,epsilon]) axes.push(e,i/100,i/100,e);
  axes.push(icebergDefaults.asymmetry*0.42,-icebergDefaults.asymmetry*0.18);
  const axisSamples=await probeIcebergField(page,axes);
  expect(axisSamples.every(Number.isFinite)).toBe(true);
  let largestAxisSpike=0;
  for (let i=0;i<201;i++) for (let direction=0;direction<2;direction++) {
    const offset=i*12+direction*2+1;
    largestAxisSpike=Math.max(largestAxisSpike,Math.abs(axisSamples[offset+4]-(axisSamples[offset]+axisSamples[offset+8])/2));
  }
  expect(largestAxisSpike,'No isolated axis or origin height').toBeLessThan(0.001);
  console.log('Terrain continuity', { frequencies:settings.length, largestJump, largestAxisSpike });
}

export async function verifyTerrainPerimeter(page: Page) {
  const points:number[]=[], n=ICEBERG_SEGMENTS;
  for(let i=0;i<=n;i++) {
    const t=i/n*2-1;
    points.push(t,1,1,t,t,-1,-1,t);
  }
  const seed=icebergParameters.find(p=>p.key==='seed')!;
  const settings=Array.from({length:seed.max-seed.min+1},(_,i)=>({...icebergDefaults,seed:seed.min+i}));
  settings.push({...icebergDefaults,height:4,shoulder:0.9,cliff:0.8,erosion:0.6,detail:1,asymmetry:-0.7,sharpness:0.65});
  settings.push({...settings.at(-1)!,asymmetry:0.7,sharpness:3,frequency:23.9});
  let largestGap=0;
  for(const values of await probeIcebergFields(page,points,settings)) {
    expect(values.every(Number.isFinite)).toBe(true);
    for(let i=0;i<values.length;i+=2) largestGap=Math.max(largestGap,Math.abs(values[i]-values[i+1]));
  }
  expect(largestGap,'Cap and walls must meet without unsupported rims at every perimeter vertex').toBeLessThan(0.00001);
  console.log('Terrain perimeter', { variants:settings.length, largestGap });
}

export async function verifyTerrainNeedles(page: Page) {
  const n=ICEBERG_SEGMENTS, points:number[]=[];
  for(let z=0;z<=n;z++) for(let x=0;x<=n;x++) points.push(x/n*2-1,z/n*2-1);
  const heights=await probeIcebergField(page,points);
  expect(heights.every(Number.isFinite)).toBe(true);
  let largestProminence=0;
  for(let z=0;z<=n;z++) for(let x=0;x<=n;x++) {
    const height=heights[(z*(n+1)+x)*2];
    let neighbor=-Infinity;
    for(let dz=-1;dz<=1;dz++) for(let dx=-1;dx<=1;dx++) {
      if((!dx&&!dz)||x+dx<0||x+dx>n||z+dz<0||z+dz>n) continue;
      neighbor=Math.max(neighbor,heights[((z+dz)*(n+1)+x+dx)*2]);
    }
    largestProminence=Math.max(largestProminence,height-neighbor);
  }
  expect(largestProminence,'No isolated vertex towers over all surrounding relief').toBeLessThan(0.12);
}
