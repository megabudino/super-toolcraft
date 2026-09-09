import type { StaticImageData } from '@/section/reference/reference-image';

import carousel01 from '@/section/asset-metadata/images/recraft-fine-details/carousel/carousel-01.jpeg';
import carousel02 from '@/section/asset-metadata/images/recraft-fine-details/carousel/carousel-02.jpeg';
import carousel03 from '@/section/asset-metadata/images/recraft-fine-details/carousel/carousel-03.jpeg';
import carousel04 from '@/section/asset-metadata/images/recraft-fine-details/carousel/carousel-04.jpeg';

import { withBasePath } from '@/section/shared/config/base-path';

export interface FineDetailsCarouselAsset {
  downloadUrl: string;
  fileName: string;
  height: number;
  id: string;
  image: StaticImageData | string;
  isPrivate?: boolean;
  width: number;
}

export const fineDetailsCarouselAssets = [
  {
    id: 'fine-details-carousel-01',
    image: carousel01,
    height: carousel01.height,
    width: carousel01.width,
    downloadUrl: withBasePath('/images/recraft-fine-details/carousel/carousel-01.jpeg'),
    fileName: 'carousel-01.jpeg',
  },
  {
    id: 'fine-details-carousel-02',
    image: carousel02,
    height: carousel02.height,
    width: carousel02.width,
    downloadUrl: withBasePath('/images/recraft-fine-details/carousel/carousel-02.jpeg'),
    fileName: 'carousel-02.jpeg',
  },
  {
    id: 'fine-details-carousel-03',
    image: carousel03,
    height: carousel03.height,
    width: carousel03.width,
    downloadUrl: withBasePath('/images/recraft-fine-details/carousel/carousel-03.jpeg'),
    fileName: 'carousel-03.jpeg',
  },
  {
    id: 'fine-details-carousel-04',
    image: carousel04,
    height: carousel04.height,
    width: carousel04.width,
    downloadUrl: withBasePath('/images/recraft-fine-details/carousel/carousel-04.jpeg'),
    fileName: 'carousel-04.jpeg',
  },
] as const satisfies readonly FineDetailsCarouselAsset[];
