import { expect,test } from 'vitest';
import { appSchema } from './app-schema';
import { icebergDefaults, icebergParameters, readIcebergSettings } from './iceberg-controls';
import { createIcebergTopology, ICEBERG_SEGMENTS } from './iceberg-topology';
import { validateProductAcceptanceCoverage } from './app-acceptance';
import { icebergPerformancePaths, icebergRenderAssessment } from './app-performance';
import { createToolcraftState } from '@/toolcraft/runtime/state/create-template-state';

test('iceberg schema preserves procedural parameter contracts',()=>{
  expect(appSchema.canvas.size).toEqual({width:3330,height:4440,unit:'px'});
  for(const p of icebergParameters) { expect(p.value).toBeGreaterThanOrEqual(p.min);expect(p.value).toBeLessThanOrEqual(p.max); }
  const state=createToolcraftState(appSchema);
  expect(state.canvas).toMatchObject({mode:'finite',size:{width:3330,height:4440,unit:'px'},zoom:30});
  expect(readIcebergSettings(state.values)).toMatchObject({
    ...icebergDefaults,height:1.55,width:2.18,sharpness:1.39,asymmetry:0.15,shoulder:0.63,seed:97,ridges:0.66,
    frequency:3,erosion:0,detail:0.64,depth:1.36,plateGap:0.11,seamLevel:-0.03,seamValley:0.33,seamPhase:81,
    seamWarp:0.52,seamTerraces:0.6,seamJagged:1,seamScale:1,seamVariation:0.5,seamFrequency:11.1,cliff:0.17,
    frontColumns:32,rightColumns:16,backColumns:14,leftColumns:10,gridThickness:2.5,gridStrength:0.5,
    planeLineThickness:90,planeLineDensity:84,planeLineDirection:24,contrast:0,grain:0.65,light:44,
    lightDrama:0.66,engravingStrength:0.49,engravingScale:0.65,engravingThickness:51,
  });
  expect(state.values).toMatchObject({
    'appearance.background':'#FAFAFA','export.includeBackground':true,'iceberg.engravingEnabled':true,
    'export.video.format':'mp4','export.video.resolution':'current',
    'canvas.aspectRatio':{height:4,mode:'preset',value:'3:4',width:3},'canvas.size.width':3330,'canvas.size.height':4440,
    'view.orbit':{position:[5.398182941229226,2.21363371348611,4.971865516638815],up:[-0.21241246223585997,0.9573959336839413,-0.19563734830638396]},
  });
  expect(state.panels.timeline.extended).toBe(true);
  expect(state.timeline).toMatchObject({currentTimeSeconds:0,durationSeconds:2,isLooping:true,isPlaying:false});
});
test('iceberg topology shares every wall top vertex with the mountain perimeter',()=>{
  const g=createIcebergTopology(),p=g.getAttribute('position'),r=g.getAttribute('region');
  const top=new Set<string>();let wallTop=0;
  for(let i=0;i<p.count;i++) {
    if(r.getX(i)===0&&(Math.abs(p.getX(i))===1||Math.abs(p.getZ(i))===1)) top.add(`${p.getX(i)},${p.getZ(i)}`);
    if(r.getX(i)===1&&p.getY(i)===1&&g.getAttribute('slice').getX(i)===4) { expect(top.has(`${p.getX(i)},${p.getZ(i)}`)).toBe(true);wallTop++; }
  }
  expect(wallTop).toBe(4*(ICEBERG_SEGMENTS+1));
  expect(g.index!.count).toBe(ICEBERG_SEGMENTS**2*6+ICEBERG_SEGMENTS*24+6+4*6*6);
  g.dispose();
});
test('iceberg product coverage is complete',()=>expect(validateProductAcceptanceCoverage()).toEqual([]));
test('iceberg performance paths retain renderer resources',()=>{
  expect(icebergRenderAssessment.errors).toEqual([]);
  expect(icebergPerformancePaths.some(p=>p.interaction==='export')).toBe(true);
  for(const p of icebergPerformancePaths.filter(p=>p.interaction!=='initial-render')) expect(p.invalidates).not.toContain('resources');
});
