import { expect, it } from 'vitest';
import { assessToolcraftRenderPlan, compileToolcraftPerformanceFixturePlan, createToolcraftState, toolcraftReducer } from '@/toolcraft/runtime';
import { appSchema } from './app-schema';
import { appPerformance, flamePerformancePaths } from './app-performance';
import { appAcceptance } from './app-acceptance-data';
import { validateProductAcceptanceCoverage } from './app-acceptance';
import { drawSignature } from '../flame/flame-test-support';
import { readFlameSettings } from '../flame/flame-defaults';
import { moveEnvelope } from '../flame/flame-geometry';

it('flame render plan has valid derived paths and fixtures', () => {
  expect(assessToolcraftRenderPlan(appSchema,appPerformance).errors).toEqual([]);
  for (const path of flamePerformancePaths) if(path.workloadDimensions.length) expect(compileToolcraftPerformanceFixturePlan(appPerformance,path).dimensionIds).toEqual(path.workloadDimensions);
});
it('flame acceptance inventory covers the full product', () => { expect(validateProductAcceptanceCoverage()).toEqual([]); });
for (const row of appAcceptance.filter(row=>!row.automatedTestName.startsWith('flame parameter'))) it(row.automatedTestName, () => {
  const state=createToolcraftState(appSchema);
  const settings=readFlameSettings(state.values);
  if(row.id==='flame.guides') {
    const changed=toolcraftReducer(state,{type:'controls.setValue',target:'flame.envelopes',value:moveEnvelope(settings,'mid',3,0.65)});
    expect(drawSignature(readFlameSettings(changed.values))).not.toBe(drawSignature(settings));
  } else if(row.id==='flame.regenerate') {
    const changed=toolcraftReducer(state,{type:'controls.setValue',target:'flame.seed',value:42});
    expect(drawSignature(readFlameSettings(changed.values))).not.toBe(drawSignature(settings));
  } else if(row.id==='canvas.size') expect(drawSignature(settings,1280,720)).not.toBe(drawSignature(settings));
  else if(row.id==='canvas.infinity') {
    expect(state.canvas.mode).toBe('infinite');
    const changed=toolcraftReducer(state,{type:'controls.setValue',target:'canvas.infinity',value:false});
    expect(changed.canvas.mode).toBe('finite');expect(changed.canvas.size).toEqual(state.canvas.size);
    expect(toolcraftReducer(changed,{type:'controls.reset'}).canvas.mode).toBe('infinite');
  } else if(row.id==='persistence.reload') {
    expect(appSchema.persistence.storage).toBe('localStorage');
    expect(appSchema.persistence.storage === 'localStorage' && appSchema.persistence.additionalValueTargets).toEqual(['flame.envelopes','flame.seed']);
  } else if(row.id==='canvas.scale') {
    const changed=toolcraftReducer(state,{type:'controls.setValue',target:'canvas.renderScale',value:1});
    expect(changed.values['canvas.renderScale']).toBe(1);expect(changed.canvas.size).toEqual(state.canvas.size);
  } else if(row.id==='background.output') {
    const changed=toolcraftReducer(state,{type:'controls.setValue',target:'export.includeBackground',value:false});
    expect(changed.values['export.includeBackground']).toBe(false);expect(changed.canvas.mode).toBe('finite');
  } else if(row.id==='appearance.background') {
    const changed=toolcraftReducer(state,{type:'controls.setValue',target:'appearance.background',value:'#123456'});
    expect(changed.values['appearance.background']).toBe('#123456');expect(drawSignature(readFlameSettings(changed.values))).toBe(drawSignature(settings));
  } else expect(state.values['export.image.resolution']).toBe('4k');
});
