import type { ToolcraftComponentAcceptance } from './acceptance/types';
import { appSchema } from './app-schema';
import { flameSectionInventory, flameReadiness } from '../flame/flame-inventory';
import { flameTransfer } from '../flame/flame-reference';
import { flameControls } from '../flame/flame-controls';
export const appControlSectionInventory = flameSectionInventory;
export const appProductReadiness = flameReadiness;
export const appTransferMode = flameTransfer;
const browser = (testName: string, file = 'e2e/product-flame.spec.ts', budget: 'standard' | 'extended-io' = 'standard') => ({ file: file as `e2e/${string}.spec.ts`, testName, budget });
const runtimeRow = (id: string, target: string, evidence: ToolcraftComponentAcceptance['evidence'], testName: string): ToolcraftComponentAcceptance => ({
  id, target, kind: 'runtime', componentType: id, automated: true, automatedTestName: `flame contract ${id}`,
  browser: browser(testName), evidence, fixture: 'Reference defaults and real Toolcraft controls',
  userAction: `Exercise ${id} using its visible controls.`, expectedObservable: `The real product output and runtime workspace implement ${id}.`,
});
export const appAcceptance: readonly ToolcraftComponentAcceptance[] = [
  ...['format', 'resolution'].map(key => ({ ...runtimeRow(`export.image.${key}`, `export.image.${key}`, 'exported-bytes', 'browser: flame image export delivers all formats and sizes'), kind: 'control' as const, componentType: 'select', optionCoverage: key === 'format' ? ['png', 'jpg'] : ['2k', '4k', '8k'], browser: browser('browser: flame image export delivers all formats and sizes', 'e2e/product-flame-export.spec.ts', 'extended-io') })),
  ...Object.values(flameControls).map(control => ({
    id: control.target, target: control.target, interactionId: `${control.target}-property`, kind: 'control' as const, componentType: control.type,
    automated: true, automatedTestName: `flame parameter ${control.target}`,
    browser: browser(`browser: flame parameter ${control.target}`), evidence: 'product-output' as const,
    fixture: 'Reference defaults; test both layouts and source limits in unit coverage', userAction: `Edit ${control.label} through the real control.`,
    expectedObservable: 'The generated graph pixels change live according to the source parameter mapping.',
    referenceCoverage: 'control-mapping' as const,
    ...(control.type === 'segmented' ? { optionCoverage: ['top-down', 'center'] } : {}),
  })),
  { ...runtimeRow('flame.guides', 'controls.setValue', 'product-output', 'browser: flame guides preserve constrained vertical editing'),
    kind: 'canvas-handle', componentType: 'svg-handles', interactionId: 'envelope-drag', referenceCoverage: 'renderer-state',
    canvasHandle: { writesTarget: 'controls.setValue', testId: 'flame-mid-3', outputObservable: 'Dragged envelope and the adjacent segment boundary move together; neighboring constraints hold.' },
    browser: browser('browser: flame guides preserve constrained vertical editing', 'e2e/product-flame.spec.ts') },
  { ...runtimeRow('flame.regenerate', 'flame.regenerate', 'exported-bytes', 'browser: flame regeneration preserves parameters'), kind: 'control', componentType: 'panelActions', interactionId: 'regenerate', referenceCoverage: 'control-mapping', actionCoverage: ['regenerate', 'export.png'], exportArtifactCoverage: 'all-required-image-export-behavior' },
  { ...runtimeRow('canvas.size', 'canvas.size.width', 'product-output', 'browser: flame canvas sizing changes output'), referenceCoverage: 'canvas-sizing', browser: browser('browser: flame canvas sizing changes output', 'e2e/product-flame-canvas.spec.ts') },
  { ...runtimeRow('appearance.background', 'appearance.background', 'product-output', 'browser: flame background color changes output'), kind: 'control', componentType: 'color', referenceCoverage: 'control-mapping', browser: browser('browser: flame background color changes output', 'e2e/product-flame-appearance.spec.ts') },
  { ...runtimeRow('background.output', 'export.includeBackground', 'product-output', 'browser: flame background output follows runtime semantics'), kind: 'control', componentType: 'switch',
    backgroundOutputCoverage: 'all-required-background-output', browser: browser('browser: flame background output follows runtime semantics', 'e2e/product-flame-background.spec.ts') },
  { ...runtimeRow('export.image', 'flame.regenerate', 'exported-bytes', 'browser: flame image export delivers all formats and sizes'), componentType: 'panelActions', actionCoverage: ['export.png'], infinityCanvasCoverage: 'scene-bounds-image-export',
    referenceCoverage: 'export-copy', exportArtifactCoverage: 'all-required-image-export-behavior',
    browser: browser('browser: flame image export delivers all formats and sizes', 'e2e/product-flame-export.spec.ts', 'extended-io') },
  { ...runtimeRow('canvas.scale', 'canvas.renderScale', 'product-output', 'browser: flame backing preserves selected render scale'),
    renderScaleCoverage: { kind: 'selected-backing-pixels', states: ['interaction', 'steady'] }, browser: browser('browser: flame backing preserves selected render scale', 'e2e/product-flame-canvas.spec.ts') },
  { ...runtimeRow('canvas.infinity', 'canvas.infinity', 'viewport-side-effect', 'browser: flame infinity preserves scene and viewport'),
    infinityCanvasCoverage: 'mode-continuity-and-restoration', browser: browser('browser: flame infinity preserves scene and viewport', 'e2e/product-flame-workspace.spec.ts') },
  { ...runtimeRow('persistence.reload', 'canvas.size.width', 'persistence-state', 'browser: flame restores graph and workspace after reload'),
    referenceCoverage: 'renderer-state', persistenceCoverage: 'reload', persistenceSlices: appSchema.persistence.storage === 'localStorage' ? appSchema.persistence.include : [],
    browser: browser('browser: flame restores graph and workspace after reload', 'e2e/product-flame-persistence.spec.ts', 'extended-io') },
];
