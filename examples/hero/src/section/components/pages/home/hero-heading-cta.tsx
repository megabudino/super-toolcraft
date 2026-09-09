'use client';

import Link from '@/section/reference-link';
import type { CSSProperties, MouseEvent } from 'react';

import { Button } from '@/section/components/ui/button';

import type { HeroHeadingCtaSettings } from './hero-scene-settings';

const shadowOffsetPixels = 48;

function createShadowColor({ hex, opacity }: HeroHeadingCtaSettings['shadow']['colorOpacity']) {
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  return `rgb(${red} ${green} ${blue} / ${opacity}%)`;
}

export function createHeroHeadingCtaStyle(settings: HeroHeadingCtaSettings): CSSProperties {
  const { shadow } = settings;

  return {
    backgroundColor: settings.backgroundColor,
    boxShadow: shadow.enabled
      ? `${shadow.offset.x * shadowOffsetPixels}px ${shadow.offset.y * shadowOffsetPixels}px ${shadow.blur}px ${shadow.spread}px ${createShadowColor(shadow.colorOpacity)}`
      : 'none',
    color: settings.textColor,
    fontSize: `${settings.fontSize}px`,
    letterSpacing: `${settings.fontSize * -0.02}px`,
    lineHeight: 1,
    marginTop: `${settings.gap}px`,
    paddingBlock: `${settings.verticalPadding}px`,
    paddingInline: `${settings.horizontalPadding}px`,
  };
}

export function HeroHeadingCta({ settings }: { settings: HeroHeadingCtaSettings }) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    const fineDetails = document.getElementById('fine-details');
    if (!fineDetails) return;

    event.preventDefault();
    window.history.replaceState(null, '', '#fine-details');
    fineDetails.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });
  }

  return (
    <Button
      asChild
      className="pointer-events-auto h-auto! rounded-[10px]! border-0 font-sans font-medium outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black max-[79.9375rem]:!mt-[clamp(1.25rem,4vw,1.75rem)] max-[79.9375rem]:!px-[clamp(1.25rem,4vw,1.5rem)] max-[79.9375rem]:!py-[clamp(0.75rem,2vw,0.875rem)] max-[79.9375rem]:!text-[clamp(1rem,2.5vw,1.125rem)] max-md:rounded-[0.5893rem]! max-md:!px-[1.2768rem] max-md:!py-[0.9822rem] max-md:!text-[1.0803rem] md:max-lg:!px-[1.3542rem] md:max-lg:!py-[1.0417rem] md:max-lg:!text-[1.1458rem] lg:max-xl:rounded-[0.75rem]! lg:max-xl:!px-[1.625rem] lg:max-xl:!py-5 lg:max-xl:!text-[1.375rem]"
      data-hero-heading-cta
      data-hero-heading-cta-shadow={settings.shadow.enabled ? 'true' : 'false'}
      size={null}
      style={createHeroHeadingCtaStyle(settings)}
    >
      <Link href="#fine-details" onClick={handleClick}>
        {settings.text}
      </Link>
    </Button>
  );
}
