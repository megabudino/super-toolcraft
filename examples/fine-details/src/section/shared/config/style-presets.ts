import { withBasePath } from './base-path';

export const stylePresetCategories = [
  {
    id: 'photo',
    label: 'Photo styles',
    presets: [
      {
        id: 'blue-mj',
        label: 'Chrome & Cobalt',
        sref: 'RE75296856',
        thumbnail: withBasePath('/images/recraft-fine-details/style-presets/blue-mj-v2.jpg'),
      },
      {
        id: 'minimal-studio-editorial',
        label: 'Minimal Studio Editorial',
        sref: 'RE82050630',
        thumbnail: withBasePath(
          '/images/recraft-fine-details/style-presets/minimal-studio-editorial-v2.jpg',
        ),
      },
      {
        id: 'vintage-volume-portrait',
        label: 'Vintage Volume Portrait',
        sref: 'RE76070032',
        thumbnail: withBasePath(
          '/images/recraft-fine-details/style-presets/vintage-volume-portrait-v1.jpg',
        ),
      },
      {
        id: 'vintage-circuit-single',
        label: 'Vintage Circuit',
        sref: 'RE70871979',
        thumbnail: withBasePath(
          '/images/recraft-fine-details/style-presets/vintage-circuit-single-v1.jpg',
        ),
      },
    ],
  },
  {
    id: 'illustration',
    label: 'Illustrations',
    presets: [
      {
        id: 'grainy-pastel-pop-v2',
        label: 'Grainy Pastel Pop',
        sref: 'RE96091927',
        thumbnail: withBasePath(
          '/images/recraft-fine-details/style-presets/grainy-pastel-pop-v2-v1.jpg',
        ),
      },
      {
        id: 'blur-crisp',
        label: 'Blur & Crisp',
        sref: 'RE05397376',
        thumbnail: withBasePath('/images/recraft-fine-details/style-presets/blur-crisp-v1.jpg'),
      },
      {
        id: 'felted-olive',
        label: 'Felted Olive',
        sref: 'RE08795322',
        thumbnail: withBasePath('/images/recraft-fine-details/style-presets/felted-olive-v1.jpg'),
      },
      {
        id: 'sugar-coral',
        label: 'Sugar Coral',
        sref: 'RE49275237',
        thumbnail: withBasePath('/images/recraft-fine-details/style-presets/sugar-coral-v1.jpg'),
      },
      {
        id: 'vector-bw-stylized',
        label: 'Vector B&W stylized',
        sref: 'RE25864961',
        thumbnail: withBasePath(
          '/images/recraft-fine-details/style-presets/vector-bw-stylized-v1.jpg',
        ),
      },
    ],
  },
  {
    id: 'icon',
    label: 'Icons',
    presets: [
      {
        id: 'line-icons',
        label: 'Pastel Line Icon',
        sref: 'RE75440599',
        thumbnail: withBasePath('/images/recraft-fine-details/style-presets/line-icons-v1.jpg'),
      },
      {
        id: 'carton-mixed-media',
        label: 'Sketchy Marker Icon',
        sref: 'RE83678945',
        thumbnail: withBasePath(
          '/images/recraft-fine-details/style-presets/carton-mixed-media-v1.jpg',
        ),
      },
      {
        id: 'flash-ink',
        label: 'Old School Tattoo',
        sref: 'RE41790234',
        thumbnail: withBasePath('/images/recraft-fine-details/style-presets/flash-ink-v1.jpg'),
      },
      {
        id: 'low-poly-relics',
        label: 'Low Poly Render Icon',
        sref: 'RE24911504',
        thumbnail: withBasePath(
          '/images/recraft-fine-details/style-presets/low-poly-relics-v1.jpg',
        ),
      },
    ],
  },
  {
    id: 'three-d',
    label: '3D',
    presets: [
      {
        id: 'green-3d-icons',
        label: 'Green Gloss 3D Icon',
        sref: 'RE27075761',
        thumbnail: withBasePath('/images/recraft-fine-details/style-presets/green-3d-icons-v1.jpg'),
      },
      {
        id: '3d-isometric-miniature',
        label: '3D Isometric Miniature',
        sref: 'RE12256380',
        thumbnail: withBasePath(
          '/images/recraft-fine-details/style-presets/3d-isometric-miniature-v1.jpg',
        ),
      },
      {
        id: 'puff',
        label: 'Fuzzy Doll 3D',
        sref: 'RE31949486',
        thumbnail: withBasePath('/images/recraft-fine-details/style-presets/puff-v2.jpg'),
      },
    ],
  },
  {
    id: 'other',
    label: 'Other',
    presets: [
      {
        id: 'embroidery-illustration',
        label: 'Embroidery Texture',
        sref: 'RE58639928',
        thumbnail: withBasePath(
          '/images/recraft-fine-details/style-presets/embroidery-illustration-v1.jpg',
        ),
      },
    ],
  },
] as const;

type ArrayElement<Value> = Value extends readonly (infer Element)[] ? Element : never;
type CategoryPreset<Category> = Category extends {
  readonly presets: readonly (infer Preset)[];
}
  ? Preset
  : never;

export type StylePresetCategory = ArrayElement<typeof stylePresetCategories>;
export type StylePreset = CategoryPreset<StylePresetCategory>;
export type StylePresetId = StylePreset['id'];

export const stylePresets = stylePresetCategories.flatMap<StylePreset>(
  (category) => category.presets,
);

export const defaultStylePreset = stylePresetCategories[0].presets[0];

const stylePresetIds = new Set<string>(stylePresets.map((preset) => preset.id));

export function isStylePresetId(value: unknown): value is StylePresetId {
  return typeof value === 'string' && stylePresetIds.has(value);
}

export function getStylePreset(id: string): StylePreset | undefined {
  return stylePresets.find((preset) => preset.id === id);
}
