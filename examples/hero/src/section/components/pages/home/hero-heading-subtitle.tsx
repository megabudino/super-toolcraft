import { referenceClasses } from '@/section/reference/reference-classes';
import type { CSSProperties } from 'react';

import type { HeroHeadingSubtitleSettings } from './hero-scene-settings';

export const heroHeadingSubtitleText = 'Style it once, every image matches';

export function createHeroHeadingSubtitleStyle(
  settings: HeroHeadingSubtitleSettings,
  shadowFilterId: string,
): CSSProperties {
  return {
    filter: settings.shadow.enabled ? `url(#${shadowFilterId})` : undefined,
    fontSize: `${settings.fontSize}px`,
    letterSpacing: `${settings.fontSize * -0.02}px`,
    marginTop: `${settings.gap}px`,
  };
}

export function HeroHeadingSubtitle({
  settings,
  shadowFilterId,
}: {
  settings: HeroHeadingSubtitleSettings;
  shadowFilterId: string;
}) {
  return (
    <p
      className={referenceClasses("max-w-[min(20rem,calc(100vw-2rem))] text-center font-sans leading-[1.25] font-semibold text-balance whitespace-normal text-white max-[79.9375rem]:!text-[min(1.75rem,5vw)] max-md:max-w-none max-md:!text-[min(1.625rem,calc(5vw-2px))] max-md:whitespace-nowrap min-[48rem]:max-[63.9375rem]:max-w-none min-[48rem]:max-[63.9375rem]:whitespace-nowrap min-[64rem]:max-[79.9375rem]:max-w-none min-[64rem]:max-[79.9375rem]:whitespace-nowrap min-[80rem]:max-w-none min-[80rem]:whitespace-nowrap")}
      data-hero-heading-subtitle
      data-hero-heading-subtitle-shadow={settings.shadow.enabled ? 'true' : 'false'}
      style={createHeroHeadingSubtitleStyle(settings, shadowFilterId)}
    >
      {heroHeadingSubtitleText}
    </p>
  );
}
