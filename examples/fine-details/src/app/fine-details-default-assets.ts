import type { ToolcraftDefaultMediaAssetSchema } from '@/toolcraft/runtime';

import defaultTrailImageDataUrls from './fine-details-default-assets.data.json' with { type: 'json' };
import { fineDetailsTrailTargets } from './fine-details-trail-values';

const defaultTrailImageCount = 50;

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
      sourceTarget: fineDetailsTrailTargets.images,
    };
  },
);
