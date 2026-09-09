import { useMemo } from 'react';
import { useToolcraftSelector } from '@/toolcraft/runtime/react';
import PreFooter from '@/section/components/pages/home/pre-footer';
import { defaultStudioRoomSettings, normalizeStudioRoomSettings } from '@/section/components/pages/home/studio-room-settings';
import { ReferenceSurface } from '@/section/reference/reference-surface';
import { createStudioRoomSettingsFromValues, createStudioRoomTileImagesFromMediaAssets } from './studio-room-values';
import { StudioRoomNativeMedia } from './studio-room-native-media';
import { sameStudioRoomImages, selectStudioRoomImages } from './studio-room-media-selection';
import { useStudioRoomWallFillDefault } from './use-studio-room-wall-fill-default';

export function StudioRoomNativePreview() {
  useStudioRoomWallFillDefault();
  const size = useToolcraftSelector(state => state.canvas.size, Object.is);
  const values = useToolcraftSelector(state => state.values, Object.is);
  const assets = useToolcraftSelector(selectStudioRoomImages, sameStudioRoomImages);
  const settings = useMemo(() => normalizeStudioRoomSettings(createStudioRoomSettingsFromValues(
    values, size.height, createStudioRoomTileImagesFromMediaAssets(assets),
  )) ?? defaultStudioRoomSettings, [values, size.height, assets]);
  return (
    <ReferenceSurface width={size.width} height={size.height}>
      <StudioRoomNativeMedia assets={assets} />
      <PreFooter settings={settings} />
    </ReferenceSurface>
  );
}
