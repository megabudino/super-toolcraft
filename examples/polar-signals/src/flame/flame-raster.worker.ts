/// <reference lib="webworker" />
import { drawFlame } from './flame-draw';
import { generateGraph, geometryKey } from './flame-geometry';
import type { FlameColumn } from './flame-generator';
import type { FlameRasterRequest, FlameRasterResponse } from './flame-raster-protocol';

declare const self: DedicatedWorkerGlobalScope;
const canvas = new OffscreenCanvas(1, 1);
let cachedGeometry = '';
let columns: FlameColumn[] = [];
self.onmessage = (event: MessageEvent<FlameRasterRequest>) => {
  const { id, settings, width, height, backingWidth, backingHeight } = event.data;
  try {
    const key = geometryKey(settings);
    if (key !== cachedGeometry) {
      columns = generateGraph(settings);
      cachedGeometry = key;
    }
    canvas.width = backingWidth;
    canvas.height = backingHeight;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D is unavailable');
    context.setTransform(backingWidth / width, 0, 0, backingHeight / height, 0, 0);
    drawFlame(context, width, height, columns, settings);
    const bitmap = canvas.transferToImageBitmap();
    self.postMessage({ id, bitmap } satisfies FlameRasterResponse, [bitmap]);
  } catch (error) {
    self.postMessage({ id, error: String(error) } satisfies FlameRasterResponse);
  }
};
