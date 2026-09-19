import { createHash } from 'node:crypto';
import { drawFlame } from './flame-draw';
import { generateGraph } from './flame-geometry';
import type { FlameSettings } from './flame-defaults';
export function drawSignature(settings: FlameSettings, width = 1920, height = 1080): string {
  const calls: unknown[] = [];
  const context = new Proxy({}, {
    set: (_target, key, value) => { calls.push([key, value]); return true; },
    get: (_target, key) => key === 'createLinearGradient'
      ? (...args: number[]) => { const stops: unknown[] = []; calls.push([key, args, stops]); return { addColorStop: (...stop: unknown[]) => stops.push(stop) }; }
      : (...args: unknown[]) => calls.push([key, ...args]),
  }) as CanvasRenderingContext2D;
  drawFlame(context, width, height, generateGraph(settings), settings);
  return createHash('sha256').update(JSON.stringify(calls)).digest('hex');
}
