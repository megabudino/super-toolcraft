import type { FineDetailsCarouselAsset } from './fine-details-carousel-assets';
import { FineDetailsImageCarousel } from './fine-details-image-carousel';
import { FineDetailsImageTrail } from './fine-details-image-trail';
import { FineDetailsLoadingPlaceholders } from './fine-details-loading-placeholders';
import type { FineDetailsSettings } from './fine-details-settings';

export function FineDetailsImageRenderer({
  carouselAssets,
  carouselMeasurementKey,
  settings,
}: {
  carouselAssets?: readonly FineDetailsCarouselAsset[];
  carouselMeasurementKey: string;
  settings: FineDetailsSettings;
}) {
  if (settings.imagesMode === 'trail') {
    return <FineDetailsImageTrail settings={settings.trail} />;
  }

  if (settings.imagesMode === 'loading') {
    return (
      <FineDetailsLoadingPlaceholders
        loading={settings.loading}
        measurementKey={carouselMeasurementKey}
        settings={settings.carousel}
      />
    );
  }

  return (
    <FineDetailsImageCarousel
      assets={carouselAssets}
      measurementKey={carouselMeasurementKey}
      settings={settings.carousel}
    />
  );
}
