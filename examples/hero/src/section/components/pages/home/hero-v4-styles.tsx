'use client';

import { referenceClasses } from '@/section/reference/reference-classes';
import Image from '@/section/reference-image';
import { lazy, Suspense, useEffect, useId, useMemo, useSyncExternalStore, type CSSProperties } from 'react';

import { withBasePath } from '@/section/shared/config/base-path';

import { HeroDispersionCard } from './hero-dispersion-card';
import { HeroHeadingCta } from './hero-heading-cta';
import { HeroHeadingSubtitle } from './hero-heading-subtitle';
import {
  getHeroGalleryMediaServerSnapshot,
  getHeroGalleryMediaSnapshot,
  markHeroGalleryMediaRefsUsed,
  subscribeHeroGalleryMedia,
} from './hero-gallery-media-store';
import {
  createHeroGalleryImageSignature,
  getHeroGallerySourceAspect,
  resolveHeroGallerySources,
  type HeroGalleryImageSource,
} from './hero-gallery-sources';
import {
  appliedHeroSceneSettings,
  type HeroGalleryRenderState,
  type HeroSceneSettings,
  type HeroShadowSettings,
} from './hero-scene-settings';
import { HERO_DESKTOP_MIN_WIDTH_PX } from './hero-responsive-settings';
import styles from './hero-v4-styles.module.css';

const announcement =
  'In side-by-side tests against seven top rivals, this won nearly 92% of the time.';
const shadowOffsetPixels = 48;
const tickerItems = Array.from({ length: 4 });
type HeroWebglViewportState = 'desktop' | 'mobile' | 'unknown';

const DesktopHeroSphereGallery = lazy(
  () => import('./hero-sphere-gallery').then((module) => ({ default: module.HeroSphereGallery })),
);

type HeroHeadingStyle = CSSProperties & {
  '--hero-heading-anchor-y': string;
  '--hero-heading-color': string;
  '--hero-heading-line-gap': string;
  '--hero-heading-offset-x': string;
  '--hero-heading-position-y': string;
  '--hero-heading-recraft-base': string;
  '--hero-heading-recraft-md': string;
  '--hero-heading-recraft-sm': string;
  '--hero-heading-recraft-xl': string;
  '--hero-heading-styles-base': string;
  '--hero-heading-styles-md': string;
  '--hero-heading-styles-sm': string;
  '--hero-heading-styles-xl': string;
};

type HeroBackgroundPatternStyle = CSSProperties & {
  '--hero-pattern-color': string;
  '--hero-pattern-opacity': string;
  '--hero-pattern-square-size': string;
};

type HeroBadgeStyle = CSSProperties & {
  '--hero-badge-scale': string;
};

function HeroShadowFilter({ filterId, shadow }: { filterId: string; shadow: HeroShadowSettings }) {
  return (
    <filter
      colorInterpolationFilters="sRGB"
      height="600%"
      id={filterId}
      width="300%"
      x="-100%"
      y="-250%"
    >
      <feMorphology
        in="SourceAlpha"
        operator={shadow.spread < 0 ? 'erode' : 'dilate'}
        radius={Math.abs(shadow.spread)}
        result="spread"
      />
      <feGaussianBlur in="spread" result="blur" stdDeviation={shadow.blur / 2} />
      <feOffset
        dx={shadow.offset.x * shadowOffsetPixels}
        dy={shadow.offset.y * shadowOffsetPixels}
        in="blur"
        result="offsetBlur"
      />
      <feFlood
        floodColor={shadow.colorOpacity.hex}
        floodOpacity={shadow.colorOpacity.opacity / 100}
        result="shadowColor"
      />
      <feComposite in="shadowColor" in2="offsetBlur" operator="in" result="shadow" />
      <feMerge>
        <feMergeNode in="shadow" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  );
}

function createHeroBackgroundPatternStyle(settings: HeroSceneSettings): HeroBackgroundPatternStyle {
  return {
    '--hero-pattern-color': settings.pattern.colorOpacity.hex,
    '--hero-pattern-opacity': String(settings.pattern.colorOpacity.opacity / 100),
    '--hero-pattern-square-size': `${settings.pattern.squareSize}px`,
  };
}

function createHeroHeadingStyle(settings: HeroSceneSettings): HeroHeadingStyle {
  const { heading } = settings;
  const positionY = (heading.position.y + 1) * 50;

  return {
    '--hero-heading-anchor-y': `${-positionY}%`,
    '--hero-heading-color': heading.color,
    '--hero-heading-line-gap': `${heading.lineGap}px`,
    '--hero-heading-offset-x': `${heading.position.x * 36}cqw`,
    '--hero-heading-position-y': `${positionY}%`,
    '--hero-heading-recraft-base': `${heading.recraftSize * 0.6}px`,
    '--hero-heading-recraft-md': `${heading.recraftSize * 0.9}px`,
    '--hero-heading-recraft-sm': `${heading.recraftSize * 0.75}px`,
    '--hero-heading-recraft-xl': `${heading.recraftSize}px`,
    '--hero-heading-styles-base': `${heading.stylesSize * 0.6}px`,
    '--hero-heading-styles-md': `${heading.stylesSize * 0.9}px`,
    '--hero-heading-styles-sm': `${heading.stylesSize * 0.75}px`,
    '--hero-heading-styles-xl': `${heading.stylesSize}px`,
  };
}

function cyclicSources(sources: readonly HeroGalleryImageSource[], count: number) {
  if (sources.length === 0) return [];
  return Array.from({ length: count }, (_, index) => sources[index % sources.length]);
}

function createRowSources(sources: readonly HeroGalleryImageSource[]) {
  const leftInner = sources.filter((_, index) => index % 2 === 0);
  const rightInner = sources.filter((_, index) => index % 2 === 1);
  return {
    left: cyclicSources(leftInner.length > 0 ? leftInner : sources, 8).reverse(),
    right: cyclicSources(rightInner.length > 0 ? rightInner : sources, 8).reverse(),
  };
}

function CardStack({
  settings,
  side,
  sources,
}: {
  settings: HeroSceneSettings;
  side: 'left' | 'right';
  sources: readonly HeroGalleryImageSource[];
}) {
  const rows = settings.gallery.rows;
  const motionKey = [
    settings.gallery.cardGap,
    settings.gallery.cardHeight,
    settings.gallery.cardRadius,
    rows.roll,
    rows.safetyWidth,
    settings.gallery.position.x,
    settings.gallery.position.y,
    settings.perspective,
    sources.map((source) => source.key).join('|'),
  ].join(':');
  const centerAnchor = `calc(50% + ${rows.safetyWidth / 2}px)`;

  return (
    <div
      aria-hidden="true"
      className={referenceClasses(`pointer-events-none absolute top-1/2 hidden -translate-y-1/2 items-center md:flex ${side === 'left' ? 'flex-row' : 'flex-row-reverse'}`)}
      data-hero-card-row={side}
      data-hero-card-safety-width={rows.safetyWidth}
      style={side === 'left' ? { right: centerAnchor } : { left: centerAnchor }}
    >
      {sources.map((source, index) => (
        <div
          className={referenceClasses("relative shrink-0")}
          data-hero-card={side}
          data-hero-card-edge={side}
          data-hero-card-index={index}
          data-hero-card-radius={settings.gallery.cardRadius}
          key={`${side}-${source.key}-${index}`}
          style={{
            ...(index === 0
              ? {}
              : side === 'left'
                ? { marginLeft: `${settings.gallery.cardGap}px` }
                : { marginRight: `${settings.gallery.cardGap}px` }),
            aspectRatio: String(getHeroGallerySourceAspect(source)),
            height: settings.gallery.cardHeight,
            zIndex: index + 1,
          }}
        >
          <HeroDispersionCard
            cornerRadius={settings.gallery.cardRadius}
            dispersion={settings.dispersion}
            motionKey={`${motionKey}:${index}`}
            perspective={settings.perspective}
            priority={index >= 2}
            roll={rows.roll}
            side={side}
            source={source}
          />
        </div>
      ))}
    </div>
  );
}

function HeroCardScene({
  onState,
  settings,
  sources,
}: {
  onState?: (state: HeroGalleryRenderState) => void;
  settings: HeroSceneSettings;
  sources: readonly HeroGalleryImageSource[];
}) {
  const rowSources = useMemo(() => createRowSources(sources), [sources]);
  const imageOrder = [...rowSources.left, ...rowSources.right].map((source) => source.id);
  const readyImageIds = sources.filter((source) => source.ready).map((source) => source.id);
  const signature = createHeroGalleryImageSignature(settings.gallery);
  const rowSignature = `${settings.gallery.cardHeight}:${settings.gallery.rows.safetyWidth}:${settings.gallery.rows.roll}`;

  useEffect(() => {
    onState?.({
      galleryType: 'rows',
      imageOrder,
      imageSignature: signature,
      readyImageIds,
      renderer: 'webgl',
      pan: { turns: 0, x: 0, y: 0 },
      rowSignature,
      rows: 2,
    });
  }, [imageOrder.join(','), onState, readyImageIds.join(','), rowSignature, signature]);

  return (
    <div
      aria-label="Two mirrored rows of progressively rolled campaign image cards"
      className={referenceClasses("absolute inset-0")}
      data-hero-gallery="rows"
      data-hero-gallery-order={imageOrder.join(',')}
      data-hero-gallery-ready={readyImageIds.length === sources.length ? 'true' : 'false'}
      data-hero-gallery-renderer="webgl"
      data-hero-gallery-pan="0:0:0"
      data-hero-gallery-row-signature={rowSignature}
      data-hero-gallery-rows="2"
      data-hero-gallery-signature={signature}
      data-hero-gallery-type="rows"
      role="img"
      style={{
        transform: `translate3d(${settings.gallery.position.x * 36}cqw, ${settings.gallery.position.y * 28}cqh, 0)`,
      }}
    >
      <CardStack settings={settings} side="left" sources={rowSources.left} />
      <CardStack settings={settings} side="right" sources={rowSources.right} />
    </div>
  );
}

function HeroGalleryScene({
  animationSuspended,
  heroWebglViewport,
  mediaRevision,
  onState,
  onPanChange,
  settings,
  sources,
}: {
  animationSuspended?: boolean;
  heroWebglViewport: HeroWebglViewportState;
  mediaRevision: number;
  onState?: (state: HeroGalleryRenderState) => void;
  onPanChange?: (pan: { x: number; y: number }, historyGroup: string) => void;
  settings: HeroSceneSettings;
  sources: readonly HeroGalleryImageSource[];
}) {
  return (
    <div
      className={referenceClasses("pointer-events-none absolute inset-0 z-10 hidden overflow-hidden select-none md:block")}
      data-hero-scene
      data-hero-video-panorama
      style={{
        perspective: `${settings.perspective}px`,
        perspectiveOrigin: `${settings.vanishingPoint.x}% ${settings.vanishingPoint.y}%`,
      }}
    >
      {settings.gallery.type === 'sphere' ? (
        heroWebglViewport === 'desktop' ? (
          <Suspense fallback={null}><DesktopHeroSphereGallery
            animationSuspended={animationSuspended}
            mediaRevision={mediaRevision}
            onState={onState}
            onPanChange={onPanChange}
            settings={settings}
          /></Suspense>
        ) : null
      ) : (
        <HeroCardScene onState={onState} settings={settings} sources={sources} />
      )}
    </div>
  );
}

function TickerGroup() {
  return (
    <div className={referenceClasses("flex shrink-0 items-center")}>
      {tickerItems.map((_, index) => (
        <div
          className={referenceClasses("flex shrink-0 items-center gap-5 pr-5 min-[80rem]:gap-8 min-[80rem]:pr-8")}
          key={index}
        >
          <p className={referenceClasses("font-mono text-[0.625rem] leading-none font-semibold tracking-tight whitespace-nowrap uppercase max-md:text-[0.75rem] md:max-lg:text-[0.75rem] min-[64rem]:max-[79.9375rem]:text-[0.8125rem] min-[80rem]:text-base")}>
            {announcement}
          </p>
          <Image
            alt=""
            className={
              index % 2 === 0
                ? 'h-12 w-[4.8rem] min-[80rem]:h-15 min-[80rem]:w-24'
                : 'h-12 w-[4.8rem] rotate-180 min-[80rem]:h-15 min-[80rem]:w-24'
            }
            height={60}
            src={withBasePath('/images/recraft-hero/ticker-lines-left.svg')}
            width={96}
          />
        </div>
      ))}
    </div>
  );
}

function AnnouncementStrip() {
  return (
    <div className={referenceClasses("relative z-30 flex h-16 items-center overflow-hidden bg-primary text-[#1a1a1a] min-[80rem]:h-20")}>
      <span className={referenceClasses("sr-only")}>{announcement}</span>
      <div
        aria-hidden="true"
        className={referenceClasses("flex w-max shrink-0 animate-hero-ticker items-center will-change-transform motion-reduce:animate-none")}
        data-hero-ticker-track
      >
        <TickerGroup />
        <TickerGroup />
      </div>
    </div>
  );
}

export default function HeroV4Styles({
  animationSuspended = false,
  onGalleryState,
  onPanChange,
  viewportWidth = 1920,
  settings = appliedHeroSceneSettings,
}: {
  animationSuspended?: boolean;
  onGalleryState?: (state: HeroGalleryRenderState) => void;
  onPanChange?: (pan: { x: number; y: number }, historyGroup: string) => void;
  viewportWidth?: number;
  settings?: HeroSceneSettings;
}) {
  const headingShadowFilterId = `hero-heading-shadow-${useId().replaceAll(':', '')}`;
  const badgeShadowFilterId = `hero-badge-shadow-${useId().replaceAll(':', '')}`;
  const subtitleShadowFilterId = `hero-subtitle-shadow-${useId().replaceAll(':', '')}`;
  const headingShadowFilter = settings.heading.shadow.enabled
    ? `url(#${headingShadowFilterId})`
    : undefined;
  const mediaRevision = useSyncExternalStore(
    subscribeHeroGalleryMedia,
    getHeroGalleryMediaSnapshot,
    getHeroGalleryMediaServerSnapshot,
  );
  const heroWebglViewport = viewportWidth >= HERO_DESKTOP_MIN_WIDTH_PX ? 'desktop' : 'mobile';
  const sources = useMemo(
    () => resolveHeroGallerySources(settings.gallery),
    [mediaRevision, settings.gallery],
  );
  const galleryMediaRefs = useMemo(
    () =>
      Array.from(
        new Set([
          ...settings.gallery.images.map((image) => image.ref),
          ...settings.gallery.sphere.rows.flatMap((row) => row.images.map((image) => image.ref)),
        ]),
      ),
    [settings.gallery.images, settings.gallery.sphere.rows],
  );

  useEffect(() => {
    markHeroGalleryMediaRefsUsed(galleryMediaRefs);
  }, [galleryMediaRefs]);

  return (
    <section
      aria-labelledby="hero-title"
      className={referenceClasses("relative isolate grid h-[calc(100svh-4rem)] max-h-[1440px] min-h-[42rem] grid-rows-[minmax(0,1fr)_4rem] overflow-hidden min-[80rem]:min-h-0 min-[80rem]:grid-rows-[minmax(0,1fr)_5rem]")}
      data-hero-video-frame
      style={{ backgroundColor: settings.backgroundEnabled ? settings.background : 'transparent' }}
    >
      <HeroGalleryScene
        animationSuspended={animationSuspended}
        heroWebglViewport={heroWebglViewport}
        mediaRevision={mediaRevision}
        onState={onGalleryState}
        onPanChange={onPanChange}
        settings={settings}
        sources={sources}
      />
      {heroWebglViewport === 'mobile' ? (
        <div
          aria-hidden="true"
          className={referenceClasses("pointer-events-none absolute inset-0 z-10 overflow-hidden select-none min-[80rem]:hidden")}
          data-hero-mobile-poster
        >
          <Image
            alt=""
            className="object-cover object-center"
            draggable={false}
            fill
            priority
            sizes="100vw"
            src={withBasePath('/images/recraft-hero/hero-mobile.jpg')}
          />
        </div>
      ) : null}
      {settings.backgroundEnabled && settings.pattern.enabled ? (
        <div
          aria-hidden="true"
          className={referenceClasses(`${styles.pattern} pointer-events-none absolute inset-0 z-0`)}
          data-hero-background-pattern
          style={createHeroBackgroundPatternStyle(settings)}
        />
      ) : null}
      <div className={referenceClasses("pointer-events-none relative z-20 min-h-0 text-center")}>
        <div className={referenceClasses("absolute inset-x-5 inset-y-8 md:inset-x-8 md:inset-y-10")}>
          <div
            className={referenceClasses(`${styles.headingGroup} absolute left-1/2 flex flex-col items-center select-none`)}
            data-hero-heading-group
            style={createHeroHeadingStyle(settings)}
          >
            {settings.heading.badgeVisible ? (
              <div
                className={referenceClasses(styles.badgeFrame)}
                data-hero-heading-badge-frame
                data-hero-heading-badge-scale={settings.heading.badgeScale}
                data-hero-heading-badge-shadow={
                  settings.heading.badgeShadow.enabled ? 'true' : 'false'
                }
                style={
                  {
                    '--hero-badge-scale': String(settings.heading.badgeScale / 100),
                    filter: settings.heading.badgeShadow.enabled
                      ? `url(#${badgeShadowFilterId})`
                      : undefined,
                  } as HeroBadgeStyle
                }
              >
                <div
                  className={referenceClasses(`${styles.badgeArtwork} rounded-full border-[3px] border-current`)}
                  data-hero-heading-badge
                  style={{ color: settings.heading.badgeColor }}
                >
                  <span className={referenceClasses("absolute inset-0 flex translate-y-0.5 items-center justify-center pt-0.5 font-display-condensed text-2xl leading-none font-black tracking-wide text-current uppercase md:text-3xl")}>
                    V4
                  </span>
                </div>
              </div>
            ) : null}

            <svg aria-hidden="true" className={referenceClasses("pointer-events-none absolute size-0")}>
              <defs>
                <HeroShadowFilter
                  filterId={badgeShadowFilterId}
                  shadow={settings.heading.badgeShadow}
                />
                <HeroShadowFilter
                  filterId={headingShadowFilterId}
                  shadow={settings.heading.shadow}
                />
                <HeroShadowFilter
                  filterId={subtitleShadowFilterId}
                  shadow={settings.heading.subtitle.shadow}
                />
              </defs>
            </svg>

            <h1
              className={referenceClasses("font-display-expanded font-black uppercase")}
              data-hero-heading-shadow={settings.heading.shadow.enabled ? 'true' : 'false'}
              id="hero-title"
              style={{
                marginTop: settings.heading.badgeVisible ? settings.heading.badgeGap : 0,
              }}
            >
              <span
                className={referenceClasses(`${styles.headingLine} ${styles.recraftLine}`)}
                style={{ filter: headingShadowFilter }}
              >
                Recraft
              </span>
              <span
                className={referenceClasses(`${styles.headingLine} ${styles.stylesLine} font-display-wide-ultra-italic font-[1000] italic`)}
                style={{ filter: headingShadowFilter }}
              >
                Styles
              </span>
            </h1>
            <HeroHeadingSubtitle
              settings={settings.heading.subtitle}
              shadowFilterId={subtitleShadowFilterId}
            />
            <HeroHeadingCta settings={settings.heading.cta} />
          </div>
        </div>
      </div>

      <AnnouncementStrip />
    </section>
  );
}
