import { describe, expect, it } from 'vitest';
import { flameControls } from './flame-controls';
import { readFlameSettings } from './flame-defaults';
import { generateGraph, moveEnvelope } from './flame-geometry';
import { generateFlameData } from './flame-generator';
import { hexToHSL, hslToHex, interpolateHSL } from './flame-color';
import { drawSignature } from './flame-test-support';
const defaults = readFlameSettings({});
const changes: Record<string, unknown> = { 'flame.layout': 'top-down', 'flame.columns': 87, 'flame.depth': 23, 'flame.noise': 75, 'flame.dark': '#FF3300', 'flame.middle': '#36BB22', 'flame.light': '#FF99CC', 'flame.core': 90, 'flame.border': 75 };
for (const control of Object.values(flameControls)) it(`flame parameter ${control.target}`, () => {
  const changed = readFlameSettings({[control.target]: changes[control.target]});
  expect(drawSignature(changed)).not.toBe(drawSignature(defaults));
  if (['flame.dark','flame.middle','flame.light','flame.core','flame.border'].includes(control.target)) expect(generateGraph(changed)).toEqual(generateGraph(defaults));
  if (control.target === 'flame.layout') expect(generateGraph(changed).every(column=>column.topSegments.length === 0 && column.midY === 0)).toBe(true);
  if (control.target === 'flame.columns') expect(generateGraph(changed)).toHaveLength(87);
});

describe('reference generator math', () => {
  it('preserves cosine envelopes, cubic weights, and source random call order', () => {
    const data = generateFlameData(10, 10, [0.1,0.2], [0.5,0.5], [0.8,0.9], 0, 'center', () => 0.5);
    expect(data).toHaveLength(10);
    expect(data[0].topSegments.map(s=>s.heightRatio)).toEqual([1/100,8/100,27/100,64/100]);
    expect(data[0].topY).toBe(0.1);
    expect(data[9].bottomY).toBe(0.9);
    expect(data[4].topY).toBeCloseTo(0.1 + 0.1 * (1-Math.cos(4/9*Math.PI))/2);
  });
  it('keeps source HSL hue wrap and exact default colors', () => {
    for (const hex of ['#2724FF','#576DFF','#C7E8FF','#EEEBFF']) { const hsl=hexToHSL(hex);expect(hslToHex(hsl.h,hsl.s,hsl.l).toUpperCase()).toBe(hex); }
    expect(interpolateHSL({h:350,s:100,l:50},{h:10,s:100,l:50},0.5).h).toBe(0);
  });
  it('preserves all point constraints and top-down lower-bound independence', () => {
    expect(moveEnvelope(defaults,'top',3,1).top[3]).toBe(0.48);
    expect(moveEnvelope(defaults,'mid',3,-1).mid[3]).toBeCloseTo(0.12);
    expect(moveEnvelope(defaults,'bottom',3,-1).bottom[3]).toBe(0.52);
    expect(moveEnvelope({...defaults,layout:'top-down'},'bottom',3,-1).bottom[3]).toBe(0.02);
    const moved=moveEnvelope(defaults,'mid',3,0.7);expect(moved.top).toEqual(defaults.envelopes.top);expect(moved.bottom).toEqual(defaults.envelopes.bottom);
  });
  it('regenerates with a new seed and reproduces identical saved state', () => {
    expect(generateGraph({...defaults,seed:50})).not.toEqual(generateGraph(defaults));
    expect(generateGraph(structuredClone(defaults))).toEqual(generateGraph(defaults));
    const { top, mid, bottom } = defaults.envelopes;
    expect(generateGraph({ ...defaults, envelopes: { bottom, mid, top } })).toEqual(generateGraph(defaults));
  });
});
