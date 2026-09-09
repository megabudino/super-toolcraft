import * as React from "react";
import type { ToolcraftImageAsset } from "@/toolcraft/runtime";
import { useToolcraftMediaPresentationUrls } from "@/toolcraft/runtime/react";
import { ingestHeroGalleryMedia, releaseHeroGalleryMedia } from "@/section/components/pages/home/hero-gallery-media-store";

/** Runtime retains source URLs; the original section applies canonical transforms in its shaders. */
export function HeroNativeMediaSync({ assets }: { assets: readonly ToolcraftImageAsset[] }) {
  const urls = useToolcraftMediaPresentationUrls(assets);
  const retained = React.useRef(new Set<string>());
  const pending = React.useRef(new Map<string, AbortController>());
  React.useEffect(() => {
    const active = new Set(assets.map((asset) => asset.resourceRef));
    for (const [ref, controller] of pending.current) {
      if (!active.has(ref)) { controller.abort(); pending.current.delete(ref); }
    }
    for (const ref of retained.current) {
      if (!active.has(ref)) { releaseHeroGalleryMedia([ref]); retained.current.delete(ref); }
    }
    for (const asset of assets) {
      const url = urls.get(asset.id);
      if (!url || retained.current.has(asset.resourceRef) || pending.current.has(asset.resourceRef)) continue;
      const controller = new AbortController();
      pending.current.set(asset.resourceRef, controller);
      void fetch(url, { signal: controller.signal }).then(async (response) => {
        if (!response.ok) throw new Error(`Could not read Hero image ${asset.id}.`);
        const blob = await response.blob();
        if (controller.signal.aborted) return;
        ingestHeroGalleryMedia([{ blob, id: asset.id, mimeType: asset.mimeType, ref: asset.resourceRef }]);
        retained.current.add(asset.resourceRef);
      }).catch((error: unknown) => {
        if (!controller.signal.aborted) console.error("Hero image presentation failed", error);
      }).finally(() => {
        if (pending.current.get(asset.resourceRef) === controller) pending.current.delete(asset.resourceRef);
      });
    }
  }, [assets, urls]);
  React.useEffect(() => () => {
    for (const controller of pending.current.values()) controller.abort();
    pending.current.clear();
    releaseHeroGalleryMedia([...retained.current]);
    retained.current.clear();
  }, []);
  return null;
}
