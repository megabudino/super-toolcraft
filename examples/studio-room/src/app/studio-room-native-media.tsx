import { useEffect, useRef } from 'react';
import type { ToolcraftImageAsset } from '@/toolcraft/runtime';
import { useToolcraftMediaPresentationUrls } from '@/toolcraft/runtime/react';
import { clearStudioRoomMedia, ingestStudioRoomMedia, setStudioRoomActiveMediaRefs } from '@/section/components/pages/home/studio-room-media-store';
import { createStudioRoomPreviewImageDerivative } from './studio-room-preview-image-derivative';

export function StudioRoomNativeMedia({ assets }: { assets: readonly ToolcraftImageAsset[] }) {
  const urls = useToolcraftMediaPresentationUrls(assets);
  const sent = useRef(new Map<string, string>());
  useEffect(() => {
    const controller = new AbortController();
    const live = new Set(assets.map(asset => asset.resourceRef));
    setStudioRoomActiveMediaRefs([...live]);
    for (const ref of sent.current.keys()) if (!live.has(ref)) sent.current.delete(ref);
    async function sync() {
      for (let index = 0; index < assets.length; index += 4) {
        await Promise.all(assets.slice(index, index + 4).map(async asset => {
          const url = urls.get(asset.id);
          const rotation = asset.transform?.rotationDeg;
          const transform = {
            rotationDeg: (rotation === 90 || rotation === 180 || rotation === 270 ? rotation : 0) as 0 | 90 | 180 | 270,
            flipHorizontal: asset.transform?.flipHorizontal === true,
            flipVertical: asset.transform?.flipVertical === true,
          };
          const key = `${asset.resourceRef}:${JSON.stringify(transform)}`;
          if (!url || sent.current.get(asset.resourceRef) === key) return;
          try {
            const response = await fetch(url, { signal: controller.signal });
            if (!response.ok) throw new Error(`Unable to read ${asset.id}`);
            const derivative = await createStudioRoomPreviewImageDerivative({
              blob: await response.blob(), transform, signal: controller.signal,
            });
            if (controller.signal.aborted) return;
            ingestStudioRoomMedia([{ ...derivative, id: asset.id, ref: asset.resourceRef }]);
            sent.current.set(asset.resourceRef, key);
          } catch (error) {
            if (!controller.signal.aborted) console.error('Studio Room preview media:', error);
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
    clearStudioRoomMedia();
  }, []);
  return null;
}
