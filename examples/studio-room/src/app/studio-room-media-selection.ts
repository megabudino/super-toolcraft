import type { ToolcraftImageAsset, ToolcraftState } from '@/toolcraft/runtime';
import { studioRoomTargets } from './studio-room-values';

export function selectStudioRoomImages(state: Pick<ToolcraftState, 'mediaAssets'>) {
  return state.mediaAssets.filter((asset): asset is ToolcraftImageAsset =>
    asset.assetKind === 'image' && asset.sourceTarget === studioRoomTargets.tilesImages &&
    asset.lifecycle !== 'unavailable');
}

// Runtime snapshots can replace unchanged asset objects. Retain the selection so
// unrelated updates cannot abort an in-flight preview image transformation.
export function sameStudioRoomImages(
  previous: readonly ToolcraftImageAsset[],
  next: readonly ToolcraftImageAsset[],
) {
  return previous.length === next.length && previous.every((asset, index) => {
    const other = next[index];
    return asset.id === other.id && asset.resourceRef === other.resourceRef &&
      asset.mimeType === other.mimeType &&
      asset.size?.width === other.size?.width && asset.size?.height === other.size?.height &&
      (asset.transform?.rotationDeg ?? 0) === (other.transform?.rotationDeg ?? 0) &&
      (asset.transform?.flipHorizontal === true) === (other.transform?.flipHorizontal === true) &&
      (asset.transform?.flipVertical === true) === (other.transform?.flipVertical === true);
  });
}
