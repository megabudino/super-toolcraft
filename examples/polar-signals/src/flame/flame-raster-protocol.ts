import type { FlameSettings } from './flame-defaults';

export type FlameRasterRequest = {
  id: number; settings: FlameSettings; width: number; height: number;
  backingWidth: number; backingHeight: number;
};
export type FlameRasterResponse = { id: number; bitmap?: ImageBitmap; error?: string };
