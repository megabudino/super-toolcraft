import { useEffect, useMemo, useState } from 'react';
import type { ToolcraftImageAsset } from '@/toolcraft/runtime';
import { useToolcraftSelector } from '@/toolcraft/runtime/react';
import FineDetailsSection from '@/section/components/pages/home/fine-details-section';
import { defaultFineDetailsSettings, normalizeFineDetailsSettings } from '@/section/components/pages/home/fine-details-settings';
import type { FineDetailsPromptFlightCommandEvent } from '@/section/components/pages/home/fine-details-prompt-flight-runtime';
import { ReferenceSurface } from '@/section/reference/reference-surface';
import { createFineDetailsPreviewSettingsFromValues } from './fine-details-preview-protocol';
import { createFineDetailsTrailImagesFromMediaAssets, fineDetailsTrailTargets } from './fine-details-trail-values';
import { registerFineDetailsPromptFlightCommandSender } from './fine-details-preview-website-actions';
import { FineDetailsNativeMedia } from './fine-details-native-media';

export function FineDetailsNativePreview() {
  const size = useToolcraftSelector(state => state.canvas.size, Object.is);
  const values = useToolcraftSelector(state => state.values, Object.is);
  const allAssets = useToolcraftSelector(state => state.mediaAssets, Object.is);
  const assets = useMemo(() => allAssets.filter((asset): asset is ToolcraftImageAsset =>
    asset.assetKind === 'image' && asset.sourceTarget === fineDetailsTrailTargets.images &&
    asset.lifecycle !== 'unavailable'), [allAssets]);
  const settings = useMemo(() => normalizeFineDetailsSettings(createFineDetailsPreviewSettingsFromValues(
    values, size.height, createFineDetailsTrailImagesFromMediaAssets(assets),
  )) ?? defaultFineDetailsSettings, [values, size.height, assets]);
  const [command, setCommand] = useState<FineDetailsPromptFlightCommandEvent>();
  useEffect(() => registerFineDetailsPromptFlightCommandSender(async ({ command, nonce }) => {
    setCommand({ command, nonce });
  }), []);
  return (
    <ReferenceSurface width={size.width} height={size.height}>
      <FineDetailsNativeMedia assets={assets} />
      <FineDetailsSection settings={settings} promptFlightCommand={command} />
    </ReferenceSurface>
  );
}
