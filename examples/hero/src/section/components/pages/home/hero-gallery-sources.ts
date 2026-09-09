import type {
  HeroGalleryImage,
  HeroGallerySettings,
  HeroGalleryImageTransform,
} from './hero-scene-settings';
import { getHeroGalleryMediaEntry } from './hero-gallery-media-store';

export interface HeroGalleryImageSource {
  bitmap?: ImageBitmap;
  compactTextureUrl?: string;
  height: number;
  id: string;
  key: string;
  ready: boolean;
  textureUrl?: string;
  transform: HeroGalleryImageTransform;
  url: string;
  width: number;
}

export function createHeroGalleryImageSignature(gallery: HeroGallerySettings): string {
  const hasConfiguredRowImages = gallery.sphere.rows.some((row) => row.images.length > 0);
  if (gallery.type === 'sphere' && hasConfiguredRowImages) {
    return gallery.sphere.rows
      .map(
        (row, rowIndex) =>
          `${rowIndex}:${row.images
            .map(
              (image) =>
                `${image.id}:${image.ref}:${image.transform.rotationDeg}:${image.transform.flipHorizontal ? 1 : 0}:${image.transform.flipVertical ? 1 : 0}`,
            )
            .join(',')}`,
      )
      .join('|');
  }
  if (gallery.images.length === 0) return 'authored-portraits';
  return createImageListSignature(gallery.images);
}

function createImageListSignature(images: readonly HeroGalleryImage[]): string {
  return images
    .map(
      (image) =>
        `${image.id}:${image.ref}:${image.transform.rotationDeg}:${image.transform.flipHorizontal ? 1 : 0}:${image.transform.flipVertical ? 1 : 0}`,
    )
    .join('|');
}

function resolveMediaSource(
  image: HeroGalleryImage,
  missingMedia: 'drop' | 'placeholder',
): HeroGalleryImageSource | null {
  const entry = getHeroGalleryMediaEntry(image.ref);
  if (!entry && missingMedia === 'drop') return null;
  return {
    ...(entry?.bitmap ? { bitmap: entry.bitmap } : {}),
    height: entry?.height || image.height || 1,
    id: image.id,
    key: `${image.ref}:${image.transform.rotationDeg}:${image.transform.flipHorizontal ? 1 : 0}:${image.transform.flipVertical ? 1 : 0}`,
    ready: entry?.status === 'ready',
    transform: image.transform,
    url: entry?.objectUrl ?? '',
    width: entry?.width || image.width || 1,
  };
}

export function resolveHeroGallerySources(gallery: HeroGallerySettings): HeroGalleryImageSource[] {
  return gallery.images.flatMap((image) => resolveMediaSource(image, 'placeholder') ?? []);
}

export function resolveHeroGalleryRowSources(
  gallery: HeroGallerySettings,
): HeroGalleryImageSource[][] {
  return gallery.sphere.rows.map((row) =>
    row.images.flatMap((image) => resolveMediaSource(image, 'drop') ?? []),
  );
}

export function splitHeroGallerySourcesByRow(
  sources: readonly HeroGalleryImageSource[],
  rowCount: number,
): HeroGalleryImageSource[][] {
  const count = Math.max(1, Math.min(6, Math.round(rowCount)));
  const rows = Array.from({ length: count }, () => [] as HeroGalleryImageSource[]);

  sources.forEach((source, index) => rows[index % count]?.push(source));
  return rows;
}

export function getHeroGallerySourceAspect(source: HeroGalleryImageSource): number {
  const base = source.width / Math.max(1, source.height);
  return source.transform.rotationDeg === 90 || source.transform.rotationDeg === 270
    ? 1 / Math.max(base, 0.0001)
    : base;
}
