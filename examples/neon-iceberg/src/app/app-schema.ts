import { defineToolcraft, imageExportModule, spatialViewModule, timelineModule, videoExportModule, type ToolcraftControlSchema } from '@/toolcraft/runtime';
import appDefaults from './app-defaults.json' with { type: 'json' };
import { appIdentity } from './app-identity';
import { orientationDefault, parameterControls } from './iceberg-controls';
import { icebergSettingsExportActionValue, icebergSettingsExportTarget } from './iceberg-settings-export';

const color = (target: string, label: string, defaultValue: string): ToolcraftControlSchema => ({
  type: 'color', target, label, defaultValue, applicability: { mode: 'always' }, keyframeable: false,
  semanticGroup: 'material-tones', performanceRole: 'responsiveness', performanceReason: 'Updates one surface color uniform.',
});
export const appSchema = defineToolcraft({
  defaults: appDefaults,
  base: {
    identity: appIdentity,
    canvas: { enabled: true, draggable: true, upload: false, size: { width: 1200, height: 1600, unit: 'px' }, sizing: { mode: 'editable-output' }, renderScale: true },
    panels: { controls: { title: 'Iceberg', sections: [
      { id: 'background', title: 'Background', controls: {
        include: { type: 'switch', target: 'export.includeBackground', defaultValue: true, label: 'Background', applicability: { mode: 'always' }, performanceRole: 'responsiveness', performanceReason: 'Runtime toggles the background layer.' },
        color: color('appearance.background', 'Background color', '#FFFFFF'),
      } },
      { id: 'settings', title: 'Settings Export', controls: {
        exportSettings: { type: 'actions', target: icebergSettingsExportTarget, label: false, defaultValue: null, actions: [{ value: icebergSettingsExportActionValue, label: 'Export Settings', icon: 'download-simple', variant: 'outline' }], applicability: { mode: 'always' }, keyframeable: false, performanceRole: 'responsiveness', performanceReason: 'Serializes one immutable runtime state snapshot to a JSON download.' },
      } },
      { id: 'mountain', title: 'Mountain', controls: { ...parameterControls('mountain'), orientation: { type: 'orientationGizmo', target: 'view.orbit', defaultValue: orientationDefault, label: false, keyframeable: false, applicability: { mode: 'always' }, performanceRole: 'responsiveness', performanceReason: 'Camera pose changes only rendering uniforms.' } } },
      { id: 'rock', title: 'Rock relief', controls: parameterControls('rock') },
      { id: 'base', title: 'Base', controls: parameterControls('base') },
      { id: 'patterns', title: 'Base patterns', controls: parameterControls('patterns') },
      { id: 'surface', title: 'Material', controls: {
        rock: color('iceberg.rockColor', 'Rock', '#D9DDE0'), ice: color('iceberg.iceColor', 'Ice', '#F0F1F2'), ...parameterControls('surface'),
        engravingEnabled: { type: 'switch', target: 'iceberg.engravingEnabled', label: 'Engraving', description: 'Horizontal tonal hatching only on the rock, like a printed illustration.', defaultValue: false, applicability: { mode: 'always' }, keyframeable: false, performanceRole: 'responsiveness', performanceReason: 'Toggles one bounded fragment material effect on the retained scene.' },
        ...parameterControls('engraving'),
      } },
    ] } },
    toolbar: { history: true, radar: true, zoom: true, theme: true },
  },
  modules: [spatialViewModule(), timelineModule({ mode: 'playback', defaultDurationSeconds: 1.2 }), imageExportModule(), videoExportModule()],
});
