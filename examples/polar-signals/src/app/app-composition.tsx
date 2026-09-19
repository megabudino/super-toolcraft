import { composeToolcraftApp } from '@/toolcraft/runtime/react';
import { getToolcraftFiniteArtboardRect } from '@/toolcraft/runtime';
import { FlameCanvas } from '../flame/FlameCanvas';
import { flamePipeline } from '../flame/flame-pipeline';
import { flameExport } from '../flame/flame-export';
import { appSchema } from './app-schema';

export const appComposition = composeToolcraftApp(appSchema, {
  scene: {
    canvasContent: <FlameCanvas />,
    renderDefaultCanvasMedia: false,
    sceneBoundsProvider: ({ state }) => [getToolcraftFiniteArtboardRect(state.canvas.size)],
    rasterFrameRenderer: flameExport,
  },
  renderer: { pipelineRegistration: flamePipeline },
  actions: { onPanelAction: ({ action, dispatch }) => {
    if (action.value === 'regenerate') dispatch({ type: 'controls.setValue', target: 'flame.seed', value: crypto.getRandomValues(new Uint32Array(1))[0], label: 'Regenerate flame graph' });
  } },
});
