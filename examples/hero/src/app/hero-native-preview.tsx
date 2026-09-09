import * as React from "react";
import type { ToolcraftImageAsset } from "@/toolcraft/runtime";
import { shouldIncludeToolcraftPreviewBackground } from "@/toolcraft/runtime";
import { useToolcraftDispatch, useToolcraftProductSceneFrame, useToolcraftSelector } from "@/toolcraft/runtime/react";
import HeroV4Styles from "@/section/components/pages/home/hero-v4-styles";
import RecraftHeader from "@/section/components/header";
import type { HeroGalleryRenderState } from "@/section/components/pages/home/hero-scene-settings";
import { normalizeHeroSceneSettings, appliedHeroSceneSettings } from "@/section/components/pages/home/hero-scene-settings";
import { createHeroGalleryImagesFromMediaAssets, createHeroSphereRowImagesFromMediaAssets, heroGalleryMediaTargets, heroGalleryTargets, heroSphereRowImageTargets } from "./hero-gallery-values";
import { useHeroGalleryRowActivation } from "./hero-gallery-row-activation";
import { HeroNativeMediaSync } from "./hero-native-media-sync";
import { createHeroPreviewSettingsFromValues } from "./hero-preview-protocol";
import { ReferenceSurface } from "@/section/reference/reference-surface";
import styles from "./hero-preview.module.css";

export function HeroNativePreview() {
  const dispatch = useToolcraftDispatch();
  const frame = useToolcraftProductSceneFrame();
  const values = useToolcraftSelector((state) => state.values, Object.is);
  const viewportTransform = useToolcraftSelector((state) => `${state.canvas.zoom}:${state.canvas.offset.x}:${state.canvas.offset.y}`, Object.is);
  const [animationSuspended, setAnimationSuspended] = React.useState(false);
  React.useEffect(() => {
    setAnimationSuspended(true);
    const timer = window.setTimeout(() => setAnimationSuspended(false), 140);
    return () => window.clearTimeout(timer);
  }, [viewportTransform]);
  const mediaAssets = useToolcraftSelector((state) => state.mediaAssets, Object.is);
  const backgroundEnabled = useToolcraftSelector((state) => shouldIncludeToolcraftPreviewBackground({ state }), Object.is);
  const galleryAssets = React.useMemo(() => mediaAssets.filter((asset): asset is ToolcraftImageAsset =>
    asset.assetKind === "image" && asset.lifecycle !== "unavailable" &&
    heroGalleryMediaTargets.some((target) => target === asset.sourceTarget)), [mediaAssets]);
  const images = React.useMemo(() => createHeroGalleryImagesFromMediaAssets(galleryAssets), [galleryAssets]);
  const rowImages = React.useMemo(() => createHeroSphereRowImagesFromMediaAssets(galleryAssets), [galleryAssets]);
  useHeroGalleryRowActivation({ rowImages, rowsValue: values[heroGalleryTargets.sphereRows] });
  const settings = React.useMemo(() => {
    const canonical = createHeroPreviewSettingsFromValues(values, images, rowImages);
    return normalizeHeroSceneSettings({ ...canonical, backgroundEnabled,
      gallery: { ...canonical.gallery, sphere: { ...canonical.gallery.sphere,
        rows: canonical.gallery.sphere.rows.map((row, index) => ({ ...row, images: rowImages[index] ?? [] })),
      } },
    }) ?? appliedHeroSceneSettings;
  }, [values, images, rowImages, backgroundEnabled]);
  const activeGalleryAssets = React.useMemo(() => {
    const activeTargets = settings.gallery.type === "sphere"
      ? heroSphereRowImageTargets.slice(0, settings.gallery.sphere.rows.length)
      : [heroGalleryTargets.images];
    return galleryAssets.filter((asset) =>
      activeTargets.some((target) => target === asset.sourceTarget));
  }, [galleryAssets, settings.gallery.type, settings.gallery.sphere.rows.length]);
  const [galleryState, setGalleryState] = React.useState<HeroGalleryRenderState | null>(null);
  const onPanChange = React.useCallback((pan: { x: number; y: number }, historyGroup: string) => {
    dispatch({ type: "controls.setValue", target: heroGalleryTargets.pan, value: pan, label: "Pan Hero gallery", history: "merge", historyGroup });
  }, [dispatch]);
  if (!frame.rect) return null;
  return (
    <div className={styles.preview} data-toolcraft-product-output="hero-native-preview"
      data-hero-viewport-moving={animationSuspended}
      data-hero-gallery-order={galleryState?.imageOrder.join(",") ?? ""}
      data-hero-gallery-renderer={galleryState?.renderer ?? "pending"}
      data-hero-gallery-type={settings.gallery.type}
      data-hero-gallery-rows={settings.gallery.sphere.rows.length}>
      <HeroNativeMediaSync assets={activeGalleryAssets} />
      <ReferenceSurface width={frame.rect.width} height={frame.rect.height}>
        <RecraftHeader />
        <HeroV4Styles settings={settings} onGalleryState={setGalleryState}
          onPanChange={onPanChange} viewportWidth={frame.rect.width} animationSuspended={animationSuspended} />
      </ReferenceSurface>
    </div>
  );
}
