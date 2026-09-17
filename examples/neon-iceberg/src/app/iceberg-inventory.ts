import type { ToolcraftControlSectionInventoryEntry, ToolcraftProductReadiness } from './acceptance/types';
import { icebergParameters, icebergTarget } from './iceberg-controls';
import { icebergSettingsExportTarget } from './iceberg-settings-export';

const sections = [
  ['mountain', 'Mountain', 'Mountain silhouette', 'Main peak proportions, deterministic variation and orientation of one connected iceberg.'],
  ['rock', 'Rock relief', 'Rock relief', 'Ridge structure, erosion and surface detail share the rock shaping reset scope.'],
  ['base', 'Base', 'Cubic foundation', 'Block depth, four equal lower plates with one separation setting, and the shared irregular junction form one coherent foundation reset task.'],
  ['patterns', 'Base patterns', 'Block decoration', 'Independent whole-column counts and shared line styling own the side grid, while line width, density and direction control the flowing print on the four horizontal plate tops; all edit the base decoration in one reset scope.'],
  ['surface', 'Material', 'Iceberg appearance', 'Rock and ice tones, illumination, grain and optional tonal rock engraving share the appearance reset scope.'],
] as const;
export const appControlSectionInventory: readonly ToolcraftControlSectionInventoryEntry[] = [
  { id: 'settings', title: 'Settings Export', entity: 'Application settings', entityId: 'settings', groupingReason: 'One export-only action downloads the current Toolcraft state snapshot.', targets: [icebergSettingsExportTarget], finiteSelectors: [] },
  ...sections.map(([id, title, entity, groupingReason]) => ({ id, title, entity, entityId: id, groupingReason,
    targets: [...icebergParameters.filter(p => p.section === id || id === 'surface' && p.section === 'engraving').map(p => icebergTarget(p.key)), ...(id === 'mountain' ? ['view.orbit'] : []), ...(id === 'surface' ? ['iceberg.rockColor', 'iceberg.iceColor', 'iceberg.engravingEnabled'] : [])],
    finiteSelectors: [
      ...icebergParameters.filter(p => p.section === id && 'discrete' in p).map(p => ({ target: icebergTarget(p.key), role: 'parameter' as const, reason: 'Sets the whole number of square tile columns on this face.' })),
      ...(id === 'surface' ? [
        { target: 'iceberg.engravingEnabled', role: 'branch' as const, affectedTargets: [], reason: 'Enables tonal rock engraving and reveals its three stroke settings.' },
      ] : []),
    ],
  })),
  { id: 'runtime.image-export', title: 'Image Export', entityId: 'image-export', entity: 'Image artifact', groupingReason: 'Runtime-owned format and resolution for the final image.', targets: ['export.image.format','export.image.resolution'], finiteSelectors: [{ target: 'export.image.format', role: 'parameter', reason: 'Selects the output image encoding.' },{ target: 'export.image.resolution', role: 'parameter', reason: 'Selects the output pixel dimensions.' }] },
  { id: 'runtime.video-export', title: 'Video Export', entityId: 'video-export', entity: 'Video artifact', groupingReason: 'Runtime-owned format and resolution for the complete timeline animation.', targets: ['export.video.format','export.video.resolution'], finiteSelectors: [{ target: 'export.video.format', role: 'parameter', reason: 'Selects the encoded video container.' },{ target: 'export.video.resolution', role: 'parameter', reason: 'Selects the encoded video dimensions.' }] },
  { id: 'background', title: 'Background', entity: 'Output background', entityId: 'background', groupingReason: 'Runtime foreground transparency and background color.', targets: ['export.includeBackground', 'appearance.background'], finiteSelectors: [{ target: 'export.includeBackground', role: 'parameter', reason: 'Includes the runtime-owned background in preview and output; the fixed background recipe proves transparency and Infinity availability.' }] },
];
export const appProductReadiness: ToolcraftProductReadiness = {
  mode: 'product', productName: 'Iceberg Studio',
  productSummary: 'Procedural three-dimensional mountain with a planar cubic base and an uneven shared junction.',
  requestedBehavior: 'Match the rock mountain / cube reference, rotate the object, animate the solid base into four equally thick separated lower plates with fast inertial motion and runtime speed/loop transport, apply a directional line pattern with adjustable width and density to their horizontal planes, export the complete animation as video, and export the current application settings as JSON.',
  exportIntent: { image: { mode: 'toolcraft-default' }, svg: { mode: 'not-requested' }, video: { mode: 'user-requested', evidence: { source: 'user-message', messageRef: '01a09f46-07d0-7cc0-84c5-b5f6e27d7cd2/01a0a43e-27eb-76a3-8b3c-3892642c657a', messageText: 'как мне экспортнуть видео?', quote: 'как мне экспортнуть видео?' } } },
  viewInteraction: { mode: 'orbit', orientationTargets: ['view.orbit'] },
  interactionOwnership: [
    { id: 'edit-engravingEnabled', target: 'iceberg.engravingEnabled', capability: 'property-edit', surface: 'panel', selectionScope: { mode: 'global' }, evidence: { source: 'user-request', detail: 'Только на скалу, сохранив клетку на кубе.' }, reason: 'The panel toggles an optional rock printing treatment.', alternative: { surface: 'canvas', reason: 'A canvas toggle would duplicate the material property.' } },
    { id: 'iceberg-orbit', target: 'view.orbit', capability: 'direct-spatial-edit', surface: 'canvas', evidence: { source: 'user-request', detail: 'Я хочу иметь возможность поворачивать объект.' }, reason: 'Dragging visible geometry directly rotates the shared view.', alternative: { surface: 'panel', reason: 'Numeric Euler controls would duplicate the same orbit operation.' } },
    ...icebergParameters.map(p => ({ id: `edit-${p.key}`, target: icebergTarget(p.key), capability: 'property-edit' as const, surface: 'panel' as const, selectionScope: { mode: 'global' as const }, evidence: { source: 'user-request' as const, detail: p.key === 'plateGap' ? '4 пластины и то, что останется выше с горой. Давай для начала они будут одинаковой толщины.' : p.key === 'lightDrama' ? 'I need more dramatic light' : p.key.startsWith('planeLine') ? 'давай поменяем паттерн на лайновый. Хочу управлять толщиной линий, плотностью и направлением' : 'Сделай так настройки топологии, чтобы я могла как можно точнее воссоздать такое изображение.' }, reason: 'Precise procedural parameters need readable values and independent reset scope.', alternative: { surface: 'canvas' as const, reason: 'Persistent property handles would obscure the rendered relief.' } })),
  ],
};
