import type { FineDetailsDefaultTrailAsset } from './fine-details-default-assets';
import type { FineDetailsTrailImage } from './fine-details-settings';

export type FineDetailsTrailImageGeometry = Readonly<Omit<FineDetailsTrailImage, 'transform'>> & {
  readonly transform: Readonly<FineDetailsTrailImage['transform']>;
};

interface FineDetailsTrailImageFallback {
  readonly height: number;
  readonly width: number;
}

export interface FineDetailsTrailRenderedImageDimensions {
  readonly cardWidth: number;
  readonly imageHeight: number;
  readonly imageWidth: number;
}

export function getFineDetailsTrailRenderedImageDimensions(
  image: FineDetailsTrailImageGeometry,
  cardSize: number,
  fallback: FineDetailsTrailImageFallback,
): FineDetailsTrailRenderedImageDimensions {
  const width = image.width > 0 ? image.width : fallback.width;
  const height = image.height > 0 ? image.height : fallback.height;
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  const aspect =
    image.transform.rotationDeg % 180 === 0 ? safeWidth / safeHeight : safeHeight / safeWidth;
  const cardWidth = cardSize * aspect;
  const quarterTurn = image.transform.rotationDeg % 180 !== 0;

  return {
    cardWidth,
    imageHeight: quarterTurn ? cardWidth : cardSize,
    imageWidth: quarterTurn ? cardSize : cardWidth,
  };
}

export function getFineDetailsBuiltInTrailMedia(
  image: FineDetailsTrailImageGeometry,
  cardSize: number,
  asset: FineDetailsDefaultTrailAsset,
) {
  const { imageHeight, imageWidth } = getFineDetailsTrailRenderedImageDimensions(
    image,
    cardSize,
    asset,
  );

  return {
    height: Math.max(1, Math.round(imageHeight * 2)),
    sizes: `${imageWidth}px`,
    src: asset.url,
    unoptimized: false as const,
    width: Math.max(1, Math.round(imageWidth * 2)),
  };
}
