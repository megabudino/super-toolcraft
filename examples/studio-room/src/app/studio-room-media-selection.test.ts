import { describe, expect, it } from 'vitest';
import type { ToolcraftImageAsset } from '@/toolcraft/runtime';
import { sameStudioRoomImages, selectStudioRoomImages } from './studio-room-media-selection';

const first: ToolcraftImageAsset = {
  assetKind: 'image', id: 'first', fileName: 'first.webp', layerId: 'first',
  sourceTarget: 'tiles.images', lifecycle: 'ready', mimeType: 'image/webp',
  resourceRef: 'image:first', position: { x: 0, y: 0 },
  size: { width: 800, height: 1000, unit: 'px' },
};
const second: ToolcraftImageAsset = { ...first, id: 'second', resourceRef: 'image:second' };

describe('Studio Room media selection', () => {
  it('keeps source processing alive across equivalent state snapshots and canvas placement updates', () => {
    expect(sameStudioRoomImages([first], [structuredClone(first)])).toBe(true);
    expect(sameStudioRoomImages([first], [{ ...first, position: { x: 20, y: 30 } }])).toBe(true);
    expect(sameStudioRoomImages([first], [{ ...first, transform: {
      rotationDeg: 0, flipHorizontal: false, flipVertical: false,
    } }])).toBe(true);
  });

  it('invalidates processing for every source transform and replacement', () => {
    const changes: ToolcraftImageAsset[] = [
      { ...first, resourceRef: 'image:replacement' },
      { ...first, mimeType: 'image/png' },
      { ...first, size: { width: 1000, height: 800, unit: 'px' } },
      { ...first, transform: { rotationDeg: 90 } },
      { ...first, transform: { flipHorizontal: true } },
      { ...first, transform: { flipVertical: true } },
    ];
    for (const changed of changes) expect(sameStudioRoomImages([first], [changed])).toBe(false);
  });

  it('preserves image order and observes collection deletion', () => {
    expect(sameStudioRoomImages([first, second], [second, first])).toBe(false);
    expect(sameStudioRoomImages([first, second], [first])).toBe(false);
    expect(sameStudioRoomImages([first], [])).toBe(false);
  });

  it('only selects available room images in runtime order', () => {
    const unavailable: ToolcraftImageAsset = { ...first, id: 'missing', lifecycle: 'unavailable',
      error: { code: 'missing', message: 'Missing source' } };
    expect(selectStudioRoomImages({ mediaAssets: [
      second, { ...first, sourceTarget: 'other.images' }, unavailable, first,
    ] })).toEqual([second, first]);
  });
});
