export interface HeroGallerySnapshot {
  blob: Blob;
  height: number;
  width: number;
}

type HeroGallerySnapshotProvider = () => Promise<HeroGallerySnapshot | null>;

let activeProvider: HeroGallerySnapshotProvider | null = null;

export function registerHeroGallerySnapshotProvider(
  provider: HeroGallerySnapshotProvider,
) {
  activeProvider = provider;

  return () => {
    if (activeProvider === provider) activeProvider = null;
  };
}

export function captureHeroGallerySnapshot() {
  return activeProvider?.() ?? Promise.resolve(null);
}
