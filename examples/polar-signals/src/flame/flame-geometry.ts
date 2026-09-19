import { generateFlameData } from './flame-generator';
import type { EnvelopeLine, FlameSettings } from './flame-defaults';

export function geometryKey(settings: FlameSettings): string {
  return JSON.stringify([settings.seed, settings.columns, settings.depth, settings.noise, settings.layout,
    settings.envelopes.top, settings.envelopes.mid, settings.envelopes.bottom]);
}
export function createFlameRandom(key: string): () => number {
  let state = 2166136261;
  for (let i = 0; i < key.length; i++) state = Math.imul(state ^ key.charCodeAt(i), 16777619);
  return () => {
    state |= 0;
    state = state + 0x6D2B79F5 | 0;
    let t = Math.imul(state ^ state >>> 15, 1 | state);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
export function generateGraph(settings: FlameSettings) {
  const { columns, depth, envelopes, noise, layout } = settings;
  return generateFlameData(depth, columns, [...envelopes.top], [...envelopes.mid], [...envelopes.bottom], noise, layout, createFlameRandom(geometryKey(settings)));
}

export function moveEnvelope(settings: FlameSettings, line: EnvelopeLine, index: number, y: number): FlameSettings['envelopes'] {
  const { envelopes, layout } = settings;
  let value = Math.max(0.02, Math.min(0.98, y));
  if (line === 'top') value = Math.min(value, envelopes.mid[index] - 0.02);
  if (line === 'mid') value = Math.max(envelopes.top[index] + 0.02, Math.min(envelopes.bottom[index] - 0.02, value));
  if (line === 'bottom') value = Math.max(value, layout === 'center' ? envelopes.mid[index] + 0.02 : 0.02);
  return { ...envelopes, [line]: envelopes[line].map((point, i) => i === index ? value : point) };
}
