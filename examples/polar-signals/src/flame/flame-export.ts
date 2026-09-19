import type { ToolcraftProductExportRenderer } from '@/toolcraft/runtime';
import { readFlameSettings } from './flame-defaults';
import { generateGraph } from './flame-geometry';
import { drawFlame } from './flame-draw';
import { exportPass } from './flame-pipeline';
export const flameExport: ToolcraftProductExportRenderer = {
  baseFileName: 'flame-graph',
  async renderFrame({ context, frame, state, rendererPipeline, signal }) {
    const render = () => {
      signal.throwIfAborted();
      const settings = readFlameSettings(state.values);
      const columns = generateGraph(settings);
      context.save();
      context.translate(frame.x, frame.y);
      drawFlame(context, frame.width, frame.height, columns, settings);
      context.restore();
      signal.throwIfAborted();
    };
    if (rendererPipeline) await rendererPipeline.runPass(exportPass, undefined, render);
    else render();
  },
};
