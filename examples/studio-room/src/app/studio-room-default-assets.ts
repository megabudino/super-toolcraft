import type { ToolcraftDefaultMediaAssetSchema } from '@/toolcraft/runtime';

import defaultImages from './studio-room-default-assets.data.json' with { type: 'json' };
import { studioRoomTargets } from './studio-room-values';

export const studioRoomDefaultAssets: readonly ToolcraftDefaultMediaAssetSchema[] =
  defaultImages.map(({ dataUrl, fileName }) => ({
    assetKind: 'image',
    dataUrl,
    fileName,
    id: `default-${fileName.replace(/\.webp$/, '')}`,
    mimeType: 'image/webp',
    sourceTarget: studioRoomTargets.tilesImages,
  }));
