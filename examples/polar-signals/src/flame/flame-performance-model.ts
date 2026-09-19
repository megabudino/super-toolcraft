import type { ToolcraftEnvelopePerformanceConfig, ToolcraftPerformanceFixtureAdapter } from '@/toolcraft/runtime';
import { flamePipeline } from './flame-pipeline';
const numeric = (dimensionId: string): ToolcraftPerformanceFixtureAdapter => ({ dimensionId, apply: value => value, observe: value => Number(value) });
const resolutionValues: Record<string, number> = { '2k': 2048, '4k': 4096, '8k': 8192 };
export const flamePerformanceModel = {
  usesCustomRenderer: true, rendererStrategy: 'canvas-2d', rendererPipeline: flamePipeline, scenarios: [],
  rendererTechnique: {
    sourceRepresentation: 'reference-runtime', productRepresentation: 'pixel', previewRenderer: 'canvas-2d', exportRenderer: 'canvas-2d', rendererStrategy: 'canvas-2d',
    intentionalRasterizationReason: 'Preserve reference Canvas2D integer-rounded rectangles, white strokes and terminal-block gradients.',
    whyNotAlternativeStrategies: ['SVG changes antialiasing and rectangle overlap behavior.', 'GPU migration needs the deferred protected comparison; Canvas2D retains reference fidelity.'],
    fidelityRisks: ['Minimum-height terminal blocks and pixel rounding must match the reference.', 'Geometry remains cached across shading and size changes.'],
    performanceRisks: ['Column count, depth and backing dimensions increase work; preview rasterization is coalesced by the runtime pipeline.'],
    layers: [
      { id: 'flame', kind: 'product-foreground', content: ['dense-pattern'], renderer: 'canvas-2d', primitiveCount: 'high', exportMode: 'included', uiSelector: '[data-testid="flame-output"]', intentionalRasterizationReason: 'Reference raster drawing semantics.' },
      { id: 'guides', kind: 'editing-handles', content: ['handles'], renderer: 'svg', primitiveCount: 'low', exportMode: 'excluded', uiSelector: '[data-testid="flame-guides"]' },
    ],
  },
  workloadEnvelope: { dimensions: [
    { id: 'columns', unit: 'columns', source: { kind: 'schema-target', target: 'flame.columns', workloadBoundary: 'maximum' }, mapping: 'direct', defaultValue: 50, interactiveMax: 200, batchMax: 200 },
    { id: 'depth', unit: 'segments', source: { kind: 'schema-target', target: 'flame.depth', workloadBoundary: 'maximum' }, mapping: 'direct', defaultValue: 10, interactiveMax: 30, batchMax: 30 },
    { id: 'width', unit: 'scene pixels', source: { kind: 'runtime-state', path: 'canvas.size.width' }, mapping: 'direct', defaultValue: 1920, interactiveMax: 8192 },
    { id: 'height', unit: 'scene pixels', source: { kind: 'runtime-state', path: 'canvas.size.height' }, mapping: 'direct', defaultValue: 1080, interactiveMax: 8192 },
    { id: 'scale', unit: 'backing multiplier', source: { kind: 'runtime-state', path: 'values.canvas.renderScale' }, mapping: 'area', defaultValue: 2, interactiveMax: 2 },
    { id: 'zoom', unit: 'percent', source: { kind: 'runtime-state', path: 'canvas.zoom' }, mapping: 'area', defaultValue: 100, interactiveMax: 400 },
    { id: 'resolution', unit: 'long-edge pixels', source: { kind: 'schema-target', target: 'export.image.resolution' }, mapping: 'area', defaultValue: 4096, batchMax: 8192 },
  ] },
  fixtureAdapters: { dimensions: {
    columns: numeric('columns'), depth: numeric('depth'), width: numeric('width'), height: numeric('height'), scale: numeric('scale'), zoom: numeric('zoom'),
    resolution: { dimensionId: 'resolution', kind: 'exhaustive-discrete', domain: { kind: 'schema-options', target: 'export.image.resolution', optionValues: ['2k', '4k', '8k'] }, entries: Object.entries(resolutionValues).map(([appliedValue, value])=>({appliedValue,value})), apply: value => Object.keys(resolutionValues).find(key=>resolutionValues[key]===value)!, observe: value => resolutionValues[String(value)]! },
  } },
} as const satisfies ToolcraftEnvelopePerformanceConfig;
