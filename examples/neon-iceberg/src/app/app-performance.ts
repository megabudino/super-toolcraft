import { assessToolcraftRenderPlan, defineToolcraftPerformance, deriveToolcraftPerformancePaths, type ToolcraftPerformanceConfig, type ToolcraftPerformanceScenario } from '@/toolcraft/runtime';
import { appSchema } from './app-schema';
import { icebergPipeline } from './iceberg-pipeline';
const model: ToolcraftPerformanceConfig = {
  usesCustomRenderer: true, rendererStrategy: 'webgl', rendererPipeline: icebergPipeline,
  rendererTechnique: {
    sourceRepresentation: 'procedural-data', productRepresentation: 'pixel', previewRenderer: 'webgl', exportRenderer: 'webgl', rendererStrategy: 'webgl',
    gpu: { preview: { backend: 'webgl', provider: 'three' }, export: { backend: 'webgl', provider: 'three' } },
    intentionalRasterizationReason: 'Lit triangulated rock and film grain are rendered as pixels at selected output resolution.',
    whyNotAlternativeStrategies: ['SVG cannot represent dense spatial occlusion and per-fragment rock lighting.', 'Canvas 2D would duplicate projection, clipping and per-pixel lighting on the CPU.'],
    fidelityRisks: ['A still reference leaves the rear topology undefined; the unseen sides are procedural.', 'Finite tessellation approximates very fine ridges.'],
    performanceRisks: ['8K GPU readback uses a large transient buffer.', 'Large viewport zoom requires proportional backing pixels.', 'Timeline playback rerasterizes the retained scene at the selected backing scale; animation frames coalesce while viewport or model-orbit interaction is active.', 'Projected bounds expand for deep/wide/tall geometry, four plate gaps (at most 2.4 world units) and rotated views; backing follows the bounded scene extent at the selected scale. The four closed boxes add a fixed 48 triangles to the retained mesh.'],
    layers: [{ id: 'iceberg', kind: 'product-foreground', content: ['geometry', 'shader', 'noise'], renderer: 'webgl', primitiveCount: 'high', exportMode: 'included', uiSelector: '[data-iceberg-canvas]' }],
  },
  workloadEnvelope: { dimensions: [
    { id: 'preview-scale', unit: 'backing scale', source: { kind: 'schema-target', target: 'canvas.renderScale', workloadBoundary: 'maximum' }, mapping: 'quadratic', defaultValue: 2, interactiveMax: 2 },
    { id: 'export-edge', unit: 'pixels', source: { kind: 'schema-target', target: 'export.image.resolution' }, mapping: 'quadratic', defaultValue: 4096, batchMax: 8192 },
  ] },
  fixtureAdapters: { dimensions: {
    'preview-scale': { dimensionId: 'preview-scale', apply: value => value, observe: value => Number(value) },
    'export-edge': { dimensionId: 'export-edge', kind: 'exhaustive-discrete', domain: { kind: 'schema-options', target: 'export.image.resolution', optionValues: ['2k', '4k', '8k'] }, entries: [{ value: 2048, appliedValue: '2k' }, { value: 4096, appliedValue: '4k' }, { value: 8192, appliedValue: '8k' }], apply: value => ({ 2048: '2k', 4096: '4k', 8192: '8k' })[value]!, observe: value => ({ '2k': 2048, '4k': 4096, '8k': 8192 })[String(value) as '2k'] },
  } },
  scenarios: [],
};
export const icebergRenderAssessment = assessToolcraftRenderPlan(appSchema, model);
export const icebergPerformancePaths = deriveToolcraftPerformancePaths(appSchema, model);
export const appPerformance = defineToolcraftPerformance({ ...model, scenarios: icebergPerformancePaths.map((path): ToolcraftPerformanceScenario => {
  const base = {
    id: path.id, pathId: path.id, coversTargets: path.targets,
    automated: true, automatedTestName: 'iceberg performance paths retain renderer resources', browser: true, browserTestName: `browser perf: toolcraft path ${path.id}`,
    fixture: 'Canonical combined renderer fixture', expectedObservable: 'The complete iceberg retains its topology, selected backing quality and correct output.', uiSelector: '[data-iceberg-canvas]',
  };
  return path.interaction === 'export'
    ? { ...base, interaction: 'export', actionValue: 'export.png', controlLabel: 'Export PNG', completionEvidence: 'download' }
    : { ...base, interaction: path.interaction };
}) });
