import type { ToolcraftTransferMode } from '../app/acceptance/types';
const root = '/Users/kusnizza/Projects/polar-signals-flame-graph/src/';
const features = [
  ['layout', 'Center and Top Down', 'flame.layout', 'components/FlameGraphCanvas.tsx', 'Center grows both directions around the midline; Top Down grows down from zero and shows only the bottom guide.'],
  ['columns', 'Column width', 'flame.columns', 'utils/flameGraph.ts', '10..200 equal-width columns; changing count regenerates geometry.'],
  ['depth', 'Segment depth', 'flame.depth', 'utils/flameGraph.ts', 'Depth 3..30 with per-column random multipliers and cubic weights.'],
  ['noise', 'Boundary noise', 'flame.noise', 'utils/flameGraph.ts', '0..100 percent random displacement with source ordering constraints.'],
  ['dark', 'Core color', 'flame.dark', 'components/FlameGraphCanvas.tsx', 'HSL core shading changes without regenerating geometry.'],
  ['middle', 'Middle color', 'flame.middle', 'components/FlameGraphCanvas.tsx', 'Intermediate segment ranks interpolate toward the middle color along the shortest hue arc.'],
  ['light', 'Edge color', 'flame.light', 'components/FlameGraphCanvas.tsx', 'Outer segments finish at the light color, with a linear gradient in the final block.'],
  ['core', 'Solid gradient core', 'flame.core', 'components/FlameGraphCanvas.tsx', 'Core threshold is 0.75 times the 10..100 percent control; remaining interpolation uses power 1.2.'],
  ['border', 'White segment borders', 'flame.border', 'components/FlameGraphCanvas.tsx', 'A one-pixel white border uses the chosen 0..100 percent opacity; zero removes it.'],
  ['guides', 'Envelope direct manipulation', 'flame.guides', 'components/FlameGraphCanvas.tsx', 'Seven points per visible line drag only vertically; 0.02 margins enforce top/middle/bottom separation; guides appear on hover and never export.'],
  ['random', 'Regenerate', 'flame.regenerate', 'App.tsx', 'New random geometry preserves current settings and all guide points.'],
  ['size', 'Output dimensions', 'canvas.size', 'App.tsx', 'Initial 1920x1080 canvas scales the same normalized column geometry when dimensions change.'],
  ['background', 'Background color', 'appearance.background', 'components/FlameGraphCanvas.tsx', 'The preview background starts at #EEEBFF and can be recolored.'],
  ['export', 'PNG export without guides', 'export.image', 'components/FlameGraphCanvas.tsx', 'Export renders the current generated graph without guides; transparency and output resolution use Toolcraft native controls.'],
  ['persistence', 'Local saved settings', 'persistence.reload', 'App.tsx', 'Dimensions, colors, scales, mode and all control points restore after reload.'],
] as const;
export const flameTransfer: ToolcraftTransferMode = {
  mode: 'reference-runtime-clone', sourceOfTruth: 'reference-runtime', referenceName: 'Polar Signals Flame Graph',
  animationIntent: { mode: 'none' }, referenceInputs: [],
  referenceTimeline: { mode: 'none', behaviorCoverage: [] },
  behaviorCoverage: ['control-mapping', 'renderer-state', 'canvas-sizing', 'export-copy'],
  referenceStudy: {
    status: 'ran-original', referenceLocation: root,
    sourceEvidence: 'App.tsx, Sidebar.tsx, FlameGraphCanvas.tsx, HslColorPicker.tsx, flameGraph.ts inspected in full.',
    reproductionSteps: 'npm run dev -- --host 127.0.0.1 --port 5174 in the supplied project; open localhost through Codex embedded browser.',
    behaviorEvidence: 'Observed Center then Top Down, dragged bottom middle point from y=570 to 445, inspected controls and source invalidation/export handlers. Original has no animation, media import, layer management or reset command.',
  },
  referenceFeatureInventory: features.map(([id, featureName, acceptanceId, file, behavior]) => ({
    id, featureName, acceptanceId, sourceEvidence: root + file,
    behaviorEvidence: `Original running at 127.0.0.1:5174 and inspected handler in ${file}: ${behavior}`,
    referenceBehavior: behavior, toolcraftMapping: `Runtime schema/commands and shared source-equivalent renderer; acceptance ${acceptanceId}.`,
    status: ['size', 'background', 'export', 'persistence'].includes(id) ? 'toolcraft-native' : 'ported',
  })),
};
