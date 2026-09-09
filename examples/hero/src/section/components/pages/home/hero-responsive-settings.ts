import type { HeroSceneSettings } from './hero-scene-settings';

export const HERO_DESKTOP_MIN_WIDTH_PX = 1280;
const HERO_LARGE_TABLET_MIN_WIDTH_PX = 1024;
const HERO_MEDIUM_TABLET_MIN_WIDTH_PX = 768;

const mobileCarouselSettings = {
  cardHeight: 220,
  cardRadius: 20,
  edgeWidth: 0,
} as const;

const largeTabletCarouselSettings = {
  ...mobileCarouselSettings,
  cardHeight: 495,
  cardRadius: 45,
} as const;

const mediumTabletCarouselSettings = {
  ...mobileCarouselSettings,
  cardHeight: 440,
  cardRadius: 40,
} as const;

const enlargedMobileCarouselSettings = {
  ...mobileCarouselSettings,
  cardHeight: 396,
  cardRadius: 36,
} as const;

function getCarouselSettings(sceneWidth: number) {
  if (sceneWidth >= HERO_LARGE_TABLET_MIN_WIDTH_PX) return largeTabletCarouselSettings;
  if (sceneWidth >= HERO_MEDIUM_TABLET_MIN_WIDTH_PX) return mediumTabletCarouselSettings;
  return enlargedMobileCarouselSettings;
}

export function getResponsiveHeroSceneSettings(
  settings: HeroSceneSettings,
  sceneWidth: number,
): HeroSceneSettings {
  if (sceneWidth >= HERO_DESKTOP_MIN_WIDTH_PX) return settings;

  const carouselSettings = getCarouselSettings(sceneWidth);

  return {
    ...settings,
    dispersion: {
      ...settings.dispersion,
      edgeWidth: carouselSettings.edgeWidth,
    },
    gallery: {
      ...settings.gallery,
      cardHeight: carouselSettings.cardHeight,
      cardRadius: carouselSettings.cardRadius,
    },
  };
}
