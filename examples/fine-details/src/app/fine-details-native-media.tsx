import { useEffect, useRef } from 'react';
import type { ToolcraftImageAsset } from '@/toolcraft/runtime';
import { useToolcraftMediaPresentationUrls } from '@/toolcraft/runtime/react';
import { ingestFineDetailsTrailMedia, clearFineDetailsTrailMedia } from '@/section/components/pages/home/fine-details-trail-media-store';
import { createFineDetailsPreviewImageDerivative } from './fine-details-preview-image-derivative';

export function FineDetailsNativeMedia({ assets }: { assets: readonly ToolcraftImageAsset[] }) {
  const urls = useToolcraftMediaPresentationUrls(assets);
  const sent = useRef(new Map<string, string>());
  useEffect(() => {
    const controller = new AbortController();
    const live = new Set(assets.map(asset => asset.resourceRef));
    for (const ref of sent.current.keys()) if (!live.has(ref)) sent.current.delete(ref);
    async function sync() {
      for (let index = 0; index < assets.length; index += 4) {
        await Promise.all(assets.slice(index, index + 4).map(async asset => {
          const url = urls.get(asset.id);
          const key = `${asset.resourceRef}:${asset.transform?.rotationDeg ?? 0}`;
          if (!url || sent.current.get(asset.resourceRef) === key) return;
          try {
            const response = await fetch(url, { signal: controller.signal });
            if (!response.ok) throw new Error(`Unable to read ${asset.id}`);
            const derivative = await createFineDetailsPreviewImageDerivative({
              blob: await response.blob(), rotationDeg: asset.transform?.rotationDeg,
              signal: controller.signal,
            });
            if (controller.signal.aborted) return;
            ingestFineDetailsTrailMedia([{ ...derivative, id: asset.id, ref: asset.resourceRef }]);
            sent.current.set(asset.resourceRef, key);
          } catch (error) {
            if (!controller.signal.aborted) console.error('Fine Details preview media:', error);
          }
        }));
        if (controller.signal.aborted) return;
      }
    }
    void sync();
    return () => controller.abort();
  }, [assets, urls]);
  useEffect(() => () => {
    sent.current.clear();
    clearFineDetailsTrailMedia();
  }, []);
  return null;
}
