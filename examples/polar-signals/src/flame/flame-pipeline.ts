import { registerToolcraftRendererPipeline, type ToolcraftRendererPipelinePassContract } from '@/toolcraft/runtime';
import { geometryTargets, paintTargets } from './flame-defaults';
import type { FlameRasterClient } from './flame-raster-client';
const rasterInputs = [...geometryTargets, ...paintTargets, 'canvas.size.width', 'canvas.size.height', 'canvas.renderScale', 'canvas.zoom'];
export const flamePipeline = registerToolcraftRendererPipeline<{
  raster: ToolcraftRendererPipelinePassContract<string | null, FlameRasterClient, readonly ['flame']>;
  handles: ToolcraftRendererPipelinePassContract<string>;
  export: ToolcraftRendererPipelinePassContract<void>;
}>()({
  runtimeId: 'flame-graph-v1',
  passes: [
    { id: 'raster', kind: 'rasterize', inputs: rasterInputs, invalidatedBy: rasterInputs, cacheKey: ['request'], runsOn: 'worker', output: 'preview', quality: 'retina', cost: { dimensions: ['columns', 'depth', 'width', 'height', 'scale', 'zoom'], relationship: 'product', frequency: 'interaction' }, lifecycle: { cache: 'retained-resource', resourceScope: 'renderer' } },
    { id: 'handles', kind: 'handles', inputs: ['flame.envelopes', 'flame.layout'], invalidatedBy: ['flame.envelopes', 'flame.layout'], cacheKey: ['envelopes', 'layout'], runsOn: 'main', output: 'overlay', quality: 'full', cost: { dimensions: [], relationship: 'constant', frequency: 'interaction' }, lifecycle: { cache: 'memoized', resourceScope: 'renderer' } },
    { id: 'export', kind: 'export', inputs: [...geometryTargets, ...paintTargets, 'export.image.resolution'], invalidatedBy: ['export.image'], runsOn: 'export-only', output: 'export', quality: 'export', cost: { dimensions: ['columns', 'depth', 'resolution'], relationship: 'product', frequency: 'batch' }, lifecycle: { cache: 'none', resourceScope: 'call' } },
  ],
  interactionInvalidation: [
    { interaction: 'initial-render', targets: ['canvas'], invalidates: ['raster', 'handles'] },
    { interaction: 'control-drag', targets: ['flame.columns', 'flame.depth', 'flame.noise', 'flame.border', 'flame.core', 'canvas.renderScale'], invalidates: ['raster'], mustNotInvalidate: ['handles'] },
    { interaction: 'control-change', targets: [...paintTargets, 'flame.columns', 'flame.depth', 'flame.noise', 'flame.regenerate', 'canvas.size.width', 'canvas.size.height', 'canvas.renderScale'], invalidates: ['raster'], mustNotInvalidate: ['handles'] },
    { interaction: 'control-change', targets: ['flame.layout'], invalidates: ['raster', 'handles'], mustNotInvalidate: [] },
    { interaction: 'control-drag', targets: ['flame.envelopes'], invalidates: ['raster', 'handles'], mustNotInvalidate: [] },
    { interaction: 'control-change', targets: ['appearance.background', 'export.includeBackground', 'canvas.infinity', 'canvas.workspaceBackground', 'export.image.format', 'export.image.resolution'], invalidates: [], mustNotInvalidate: ['raster', 'handles'] },
    { interaction: 'viewport-drag', targets: ['canvas'], invalidates: [], mustNotInvalidate: ['raster', 'handles'] },
    { interaction: 'viewport-zoom', targets: ['canvas'], invalidates: ['raster'], mustNotInvalidate: ['handles'] },
    { interaction: 'export', targets: ['export.image'], invalidates: ['export'], mustNotInvalidate: ['raster', 'handles'] },
  ],
});
export const rasterPass = flamePipeline.getPass('raster');
export const handlesPass = flamePipeline.getPass('handles');
export const exportPass = flamePipeline.getPass('export');
