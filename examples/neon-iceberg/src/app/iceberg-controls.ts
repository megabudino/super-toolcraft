import type { ToolcraftControlSchema } from '@/toolcraft/runtime';

export const icebergParameters = [
  { section: 'mountain', key: 'height', label: 'Peak height', value: 2.65, min: 0.5, max: 4, step: 0.01, help: 'Height of the main peak above the base boundary.' },
  { section: 'mountain', key: 'width', label: 'Iceberg width', value: 2.35, min: 1.2, max: 3.6, step: 0.01, help: 'Width of the square cross section of the mountain and base.' },
  { section: 'mountain', key: 'sharpness', label: 'Sharpness', value: 1.55, min: 0.65, max: 3, step: 0.01, help: 'Shapes the slopes from broad shoulders to a narrow, sharp peak.' },
  { section: 'mountain', key: 'asymmetry', label: 'Asymmetry', value: 0.3, min: -0.7, max: 0.7, step: 0.01, help: 'Tilts the main ridge and shifts the peak in model space.' },
  { section: 'mountain', key: 'shoulder', label: 'Side peak', value: 0.46, min: 0, max: 0.9, step: 0.01, help: 'Height of the secondary peak to the left of the main ridge.' },
  { section: 'mountain', key: 'seed', label: 'Terrain seed', value: 17, min: 1, max: 100, step: 1, help: 'A repeatable variation of the rock folds and boundary.' },
  { section: 'rock', key: 'ridges', label: 'Fold depth', value: 0.42, min: 0.05, max: 0.85, step: 0.01, help: 'Depth of the vertical crevices running from the peak to the base.' },
  { section: 'rock', key: 'frequency', label: 'Fold frequency', value: 9, min: 3, max: 24, step: 0.1, help: 'Controls the main ridges. Higher values create narrower folds.' },
  { section: 'rock', key: 'erosion', label: 'Erosion', value: 0.2, min: 0, max: 0.6, step: 0.01, help: 'Breaks up smooth slopes and adds small outcrops.' },
  { section: 'rock', key: 'detail', label: 'Surface detail', value: 0.48, min: 0, max: 1, step: 0.01, help: 'Fine roughness and cracks on the rock surface.' },
  { section: 'base', key: 'depth', label: 'Block depth', value: 1.2, min: 0.65, max: 2.5, step: 0.01, help: 'Distance from the boundary zero level to the flat bottom.' },
  { section: 'base', key: 'plateGap', label: 'Plate gap', value: 0, min: 0, max: 0.6, step: 0.01, help: 'Separates four equally thick plates below the recesses. The upper piece keeps the mountain, and grid lines outline every separated block edge. Deeper recesses leave thinner plates; 0 closes all four cuts.' },
  { section: 'base', key: 'seamLevel', label: 'Boundary level', value: 0, min: -0.35, max: 0.6, step: 0.01, help: 'Raises or lowers the boundary between the rock and the block.' },
  { section: 'base', key: 'seamValley', label: 'Valley depth', value: 0.95, min: 0, max: 1.8, step: 0.01, help: 'Depth of the large recesses that contain terraces and smaller chips.' },
  { section: 'base', key: 'seamPhase', label: 'Valley position', value: 45, min: -180, max: 180, step: 1, unit: '°', help: 'Moves the main recess around the base, independently of the viewing angle.' },
  { section: 'base', key: 'seamWarp', label: 'Contour complexity', value: 0.72, min: 0, max: 1, step: 0.01, help: 'Distorts the recesses, steepening one side and adding nested side cuts.' },
  { section: 'base', key: 'seamTerraces', label: 'Terraces', value: 0.62, min: 0, max: 1, step: 0.01, help: 'Creates ledges and abrupt drops along the edges of large recesses.' },
  { section: 'base', key: 'seamJagged', label: 'Jagged edge', value: 0, min: 0, max: 1, step: 0.01, help: 'Adds small chips and cuts along the existing rock and ice boundary. The overall profile and heights stay the same; 0 turns the pattern off.' },
  { section: 'base', key: 'seamScale', label: 'Chip scale', value: 1, min: 1, max: 3, step: 0.01, unit: '×', help: 'Scales the width and depth of the jagged edge pattern up to three times. Requires Jagged edge above 0; the mountain shape and main valley positions stay the same.' },
  { section: 'base', key: 'seamVariation', label: 'Edge roughness', value: 0.48, min: 0, max: 0.85, step: 0.01, help: 'Depth of small notches and chips layered over the large valleys. For a level boundary, also set Valley depth to 0.' },
  { section: 'base', key: 'seamFrequency', label: 'Notch frequency', value: 7.5, min: 2, max: 18, step: 0.1, help: 'Controls the spacing of local notches and chips. The large valley shape is adjusted separately.' },
  { section: 'base', key: 'cliff', label: 'Edge cliff', value: 0.36, min: 0, max: 0.8, step: 0.01, help: 'Raises the rock rim above the block while keeping the seam connected.' },
  { section: 'patterns', key: 'frontColumns', label: 'Front columns', value: 14, min: 1, max: 32, step: 1, discrete: true, help: 'Number of whole columns on the front face, shown on the left in the initial view. Fewer columns create larger square cells. The grid aligns with both vertical edges.' },
  { section: 'patterns', key: 'rightColumns', label: 'Right columns', value: 10, min: 1, max: 32, step: 1, discrete: true, help: 'Number of whole columns on the right face in the initial view. Cell size on this face is independent of the others.' },
  { section: 'patterns', key: 'backColumns', label: 'Back columns', value: 14, min: 1, max: 32, step: 1, discrete: true, help: 'Number of whole columns on the back face. Rotate the block to see the result.' },
  { section: 'patterns', key: 'leftColumns', label: 'Left columns', value: 10, min: 1, max: 32, step: 1, discrete: true, help: 'Number of whole columns on the left side face, hidden in the initial view. Rotate the block to see the result.' },
  { section: 'patterns', key: 'gridThickness', label: 'Line thickness', value: 5, min: 1, max: 20, step: 0.1, unit: '%', help: 'Line thickness on all side faces, relative to cell size. The top of the grid follows the uneven rock boundary.' },
  { section: 'patterns', key: 'gridStrength', label: 'Line strength', value: 0.9, min: 0, max: 1, step: 0.01, help: 'Intensity of the dark grid on all side faces. At 0, the lines disappear.' },
  { section: 'patterns', key: 'planeLineThickness', label: 'Pattern line width', value: 38, min: 5, max: 90, step: 1, unit: '%', help: 'Width of the dark printed lines on the four horizontal plate surfaces, measured as a percentage of their spacing.' },
  { section: 'patterns', key: 'planeLineDensity', label: 'Pattern density', value: 42, min: 4, max: 96, step: 1, help: 'Number of flowing print lines across the block. Higher values bring the lines closer together without making them thicker.' },
  { section: 'patterns', key: 'planeLineDirection', label: 'Pattern direction', value: 15, min: -180, max: 180, step: 1, unit: '°', help: 'Average world-space flow direction of the curved lines on every horizontal plate.' },
  { section: 'surface', key: 'contrast', label: 'Contrast', value: 0.72, min: 0, max: 1, step: 0.01, help: 'Deepens dark rock shadows and brightens exposed ridges.' },
  { section: 'surface', key: 'grain', label: 'Grain', value: 0.23, min: 0, max: 0.65, step: 0.01, help: 'Static photographic grain, matching the reference image.' },
  { section: 'surface', key: 'light', label: 'Light direction', value: 55, min: -180, max: 180, step: 1, help: 'Horizontal angle of the light source around the object.', unit: '°' },
  { section: 'surface', key: 'lightDrama', label: 'Dramatic lighting', value: 0.75, min: 0, max: 1, step: 0.01, help: 'Low side lighting with deep shadows and bright lit faces. Also affects engraving. At 0, restores the original soft lighting.' },
  { section: 'engraving', key: 'engravingStrength', label: 'Engraving strength', value: 1, min: 0.05, max: 1, step: 0.01, help: 'Blends the original rock material with engraved hatching. The cube grid stays unchanged.' },
  { section: 'engraving', key: 'engravingScale', label: 'Stroke scale', value: 1, min: 0.5, max: 3, step: 0.01, help: 'Higher values increase the spacing between strokes. Horizontal direction and relative scale remain consistent when rotating, zooming and exporting.' },
  { section: 'engraving', key: 'engravingThickness', label: 'Stroke thickness', value: 50, min: 15, max: 100, step: 1, unit: '%', help: 'Controls line coverage: strokes are wider in shadows and thinner on lit ridges. Follows the lighting on each surface.' },
] as const;
export type IcebergParameter = (typeof icebergParameters)[number]['key'];
export type IcebergSettings = Record<IcebergParameter, number> & { rockColor: string; iceColor: string; engravingEnabled: boolean };
export const orientationDefault = { position: [4, 2.6, 6] as [number, number, number], up: [0, 1, 0] as [number, number, number] };
export const icebergTarget = (key: string) => `iceberg.${key}`;
export const icebergDefaults = Object.fromEntries(icebergParameters.map(p => [p.key, p.value])) as Record<IcebergParameter, number>;
export function readIcebergSettings(values: Readonly<Record<string, unknown>>): IcebergSettings {
  const settings = Object.fromEntries(icebergParameters.map(p => [p.key, Number(values[icebergTarget(p.key)] ?? p.value)])) as Record<IcebergParameter, number>;
  return { ...settings, rockColor: String(values['iceberg.rockColor'] ?? '#D9DDE0'), iceColor: String(values['iceberg.iceColor'] ?? '#F0F1F2'), engravingEnabled: values['iceberg.engravingEnabled'] === true };
}
export function parameterControls(section: string): Record<string, ToolcraftControlSchema> {
  return Object.fromEntries(icebergParameters.filter(p => p.section === section).map(p => [p.key, {
    type: 'slider', target: icebergTarget(p.key), label: p.label, description: p.help,
    defaultValue: p.value, min: p.min, max: p.max, step: p.step,
    ...('discrete' in p ? { sliderValueKind: 'discrete' as const, variant: 'discrete' as const } : { sliderValueKind: 'continuous' as const }),
    applicability: p.section === 'engraving' ? { mode: 'conditional', all: [{ target: 'iceberg.engravingEnabled', equals: true }] } : { mode: 'always' }, keyframeable: false,
    performanceRole: 'responsiveness', performanceReason: 'Updates bounded mesh deformation or material uniforms without allocating topology.',
    ...('unit' in p ? { unit: p.unit } : {}),
  } satisfies ToolcraftControlSchema]));
}
