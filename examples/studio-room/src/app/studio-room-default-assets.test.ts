import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { appSchema } from './app-schema';
import { studioRoomTargets } from './studio-room-values';

describe('Studio Room attached defaults', () => {
  it('attaches all 24 original WebPs to the Tile Images uploader', () => {
    const assets = appSchema.media.defaultAssets;
    expect(assets).toHaveLength(24);
    expect(new Set(assets.map(asset => asset.id)).size).toBe(24);
    assets.forEach((asset, index) => {
      expect(asset).toMatchObject({
        assetKind: 'image',
        fileName: `studio-room-${String(index + 1).padStart(2, '0')}.webp`,
        mimeType: 'image/webp',
        sourceTarget: studioRoomTargets.tilesImages,
      });
      expect('dataUrl' in asset && asset.dataUrl).toMatch(/^data:image\/webp;base64,/);
    });
  });

  it('paints every room grid behind the image tiles and keeps the back wall above', () => {
    const css = readFileSync(new URL('../section/components/pages/home/pre-footer-room.module.css', import.meta.url), 'utf8');
    const zIndex = (className: string) => Number(css.match(new RegExp(`\\.${className}\\s*\\{[^}]*z-index:\\s*(-?\\d+)`))?.[1]);
    for (const layer of ['fineGrid', 'grid', 'trail']) {
      expect(zIndex(layer)).toBeLessThan(zIndex('tiles'));
    }
    expect(zIndex('tiles')).toBeLessThan(zIndex('backWall'));
  });
});
