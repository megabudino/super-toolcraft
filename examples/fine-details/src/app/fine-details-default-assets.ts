import type { ToolcraftDefaultMediaAssetSchema } from '@/toolcraft/runtime';

import defaultTrailImageDataUrls from './fine-details-default-assets.data.json' with { type: 'json' };
import { fineDetailsTrailTargets } from './fine-details-trail-values';

const defaultTrailImageCount = 50;

// Dimensions of the existing embedded preview WebPs, not the full-resolution
// reference artwork used by the native trail. The focused metadata test reads
// every WebP header so these cannot silently drift from the unchanged bytes.
const defaultTrailPreviewSize = { height: 320, width: 249 };
const differentTrailPreviewSizes: Readonly<Record<number, { height: number; width: number }>> = {
  33: { height: 183, width: 320 },
  34: { height: 320, width: 208 },
  35: { height: 320, width: 320 },
  36: { height: 183, width: 320 },
  38: { height: 320, width: 183 },
  39: { height: 320, width: 236 },
  40: { height: 236, width: 320 },
};

if (defaultTrailImageDataUrls.length !== defaultTrailImageCount) {
  throw new Error(`Expected ${defaultTrailImageCount} Fine Details default images.`);
}

function sequence(index: number) {
  return String(index + 1).padStart(2, '0');
}

export const FINE_DETAILS_DEFAULT_TRAIL_ASSETS = Array.from(
  { length: defaultTrailImageCount },
  (_, index): ToolcraftDefaultMediaAssetSchema => {
    const suffix = sequence(index);
    const fileName = `fine-details-trail-${suffix}.webp`;
    const dataUrl = defaultTrailImageDataUrls[index];

    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/webp')) {
      throw new Error(`Missing Fine Details default image ${fileName}.`);
    }

    return {
      assetKind: 'image',
      dataUrl,
      fileName,
      id: `fine-details-default-${suffix}`,
      mimeType: 'image/webp',
      size: { ...(differentTrailPreviewSizes[index + 1] ?? defaultTrailPreviewSize), unit: 'px' },
      sourceTarget: fineDetailsTrailTargets.images,
    };
  },
);
