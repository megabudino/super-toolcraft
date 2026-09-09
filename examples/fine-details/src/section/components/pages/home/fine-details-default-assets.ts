import { withBasePath } from '@/section/shared/config/base-path';

export interface FineDetailsDefaultTrailAsset {
  height: number;
  id: string;
  ref: string;
  url: string;
  width: number;
}

const fineDetailsDefaultTrailDimensions = [
  { height: 800, width: 623 },
  { height: 800, width: 623 },
  { height: 800, width: 623 },
  { height: 800, width: 623 },
  { height: 800, width: 623 },
  { height: 800, width: 623 },
  { height: 800, width: 623 },
  { height: 800, width: 623 },
  { height: 800, width: 623 },
  { height: 800, width: 623 },
  { height: 800, width: 623 },
  { height: 800, width: 623 },
  { height: 800, width: 623 },
  { height: 800, width: 623 },
  { height: 800, width: 623 },
  { height: 800, width: 623 },
  { height: 800, width: 623 },
  { height: 800, width: 623 },
  { height: 800, width: 623 },
  { height: 800, width: 623 },
  { height: 800, width: 623 },
  { height: 800, width: 623 },
  { height: 800, width: 623 },
  { height: 800, width: 623 },
  { height: 800, width: 623 },
  { height: 800, width: 623 },
  { height: 800, width: 623 },
  { height: 800, width: 623 },
  { height: 800, width: 623 },
  { height: 800, width: 623 },
  { height: 800, width: 623 },
  { height: 800, width: 623 },
  { height: 458, width: 800 },
  { height: 800, width: 520 },
  { height: 800, width: 800 },
  { height: 458, width: 800 },
  { height: 800, width: 623 },
  { height: 800, width: 458 },
  { height: 800, width: 590 },
  { height: 590, width: 800 },
  { height: 800, width: 623 },
  { height: 800, width: 623 },
  { height: 800, width: 623 },
  { height: 800, width: 623 },
  { height: 800, width: 623 },
  { height: 800, width: 623 },
  { height: 800, width: 623 },
  { height: 800, width: 623 },
  { height: 800, width: 623 },
  { height: 800, width: 623 },
] as const;

function sequence(index: number) {
  return String(index + 1).padStart(2, '0');
}

export const fineDetailsDefaultTrailAssets: readonly FineDetailsDefaultTrailAsset[] =
  fineDetailsDefaultTrailDimensions.map(({ height, width }, index) => {
    const suffix = sequence(index);
    return {
      height,
      id: `fine-details-default-${suffix}`,
      ref: `fine-details-default-${suffix}`,
      url: withBasePath(`/images/home/fine-details-trail-v1/fine-details-trail-${suffix}.webp`),
      width,
    };
  });

const fineDetailsDefaultTrailAssetById = new Map(
  fineDetailsDefaultTrailAssets.map((asset) => [asset.id, asset]),
);

export function getFineDetailsDefaultTrailAsset(id: string) {
  return fineDetailsDefaultTrailAssetById.get(id);
}
