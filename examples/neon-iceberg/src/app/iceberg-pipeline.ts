import { registerToolcraftRendererPipeline, type ToolcraftRendererPipelinePassContract } from '@/toolcraft/runtime';
import { icebergParameters, icebergTarget } from './iceberg-controls';
import type { IcebergEngine } from './iceberg-render-types';

export const icebergRenderTargets = [...icebergParameters.map(p => icebergTarget(p.key)), 'iceberg.rockColor', 'iceberg.iceColor', 'iceberg.engravingEnabled', 'view.orbit'];
export const icebergPipeline = registerToolcraftRendererPipeline<{
  resources: ToolcraftRendererPipelinePassContract<IcebergEngine, IcebergEngine, readonly ['iceberg']>;
  preview: ToolcraftRendererPipelinePassContract<void>;
  export: ToolcraftRendererPipelinePassContract<void>;
}>()({
  runtimeId: 'iceberg-three-v1',
  passes: [
    { id: 'resources', kind: 'preprocess', runsOn: 'main', output: 'source', quality: 'full', inputs: ['surface'], invalidatedBy: ['renderer-mount'], cacheKey: ['surface'], lifecycle: { cache: 'retained-resource', resourceScope: 'renderer' }, cost: { dimensions: [], frequency: 'once', relationship: 'constant' } },
    { id: 'preview', kind: 'rasterize', runsOn: 'gpu', output: 'preview', quality: 'retina', inputs: [...icebergRenderTargets, 'timeline.time', 'canvas.renderScale', 'canvas.zoom'], invalidatedBy: [...icebergRenderTargets, 'timeline.time', 'canvas.renderScale', 'canvas.zoom'], lifecycle: { cache: 'none', resourceScope: 'call' }, cost: { dimensions: ['preview-scale'], frequency: 'frame', relationship: 'quadratic' }, gpu: { stage: 'render', resources: 'uniforms-only', state: 'stateless', surfaces: ['preview'] } },
    { id: 'export', kind: 'export', runsOn: 'gpu', output: 'export', quality: 'export', inputs: [...icebergRenderTargets, 'timeline.time', 'export.image.resolution', 'export.image.format'], invalidatedBy: ['export', 'timeline.time'], lifecycle: { cache: 'none', resourceScope: 'call' }, cost: { dimensions: ['export-edge'], frequency: 'batch', relationship: 'quadratic' }, gpu: { stage: 'render', resources: 'uniforms-only', state: 'stateless', surfaces: ['export'] } },
  ],
  interactionInvalidation: [
    { interaction: 'initial-render', targets: [], invalidates: ['resources', 'preview'] },
    { interaction: 'control-drag', targets: [...icebergRenderTargets.filter(target => target !== 'iceberg.engravingEnabled'), 'canvas.renderScale'], invalidates: ['preview'], mustNotInvalidate: ['resources'] },
    { interaction: 'control-change', targets: ['iceberg.engravingEnabled'], invalidates: ['preview'], mustNotInvalidate: ['resources'] },
    { interaction: 'control-change', targets: ['export.includeBackground', 'appearance.background', 'export.image.format', 'export.image.resolution', 'canvas.size.width', 'canvas.size.height', 'canvas.aspectRatio', 'canvas.infinity', 'canvas.rotationLocked'], invalidates: [], mustNotInvalidate: ['resources', 'preview'] },
    { interaction: 'viewport-drag', targets: ['canvas.offset'], invalidates: [], mustNotInvalidate: ['resources', 'preview'] },
    { interaction: 'viewport-zoom', targets: ['canvas.zoom'], invalidates: ['preview'], mustNotInvalidate: ['resources'] },
    { interaction: 'timeline-playback', targets: ['timeline.time'], invalidates: ['preview'], mustNotInvalidate: ['resources'] },
    { interaction: 'timeline-scrub', targets: ['timeline.time'], invalidates: ['preview'], mustNotInvalidate: ['resources'] },
    { interaction: 'export', targets: ['actions.output'], invalidates: ['export'], retainedAccesses: ['resources'], mustNotInvalidate: ['preview'] },
  ],
});
