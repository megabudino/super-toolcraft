'use client';

import { referenceClasses } from '@/section/reference/reference-classes';
import { getSectionPoint } from '@/section/reference/reference-geometry';

import { ArrowLineDownIcon } from '@phosphor-icons/react/ArrowLineDown';
import Image from '@/section/reference/reference-image';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';

import {
  fineDetailsCarouselAssets,
  type FineDetailsCarouselAsset,
} from './fine-details-carousel-assets';
import { getFineDetailsCarouselLoop } from './fine-details-carousel-geometry';
import { normalizeFineDetailsCarouselPhase } from './fine-details-carousel-phase';
import styles from './fine-details-image-carousel.module.css';
import placeholderStyles from './fine-details-image-placeholder.module.css';
import type { FineDetailsCarouselSettings, FineDetailsColorOpacity } from './fine-details-settings';
import { useFineDetailsTypographyBand } from './fine-details-typography-band';

const shadowOffsetPixels = 48;

type CarouselCssVariables = CSSProperties & {
  '--fd-carousel-duration': string;
  '--fd-carousel-gap': string;
  '--fd-carousel-phase': string;
  '--fd-carousel-shift': string;
};

interface CarouselDragState {
  animation: Animation;
  duration: number;
  pointerId: number;
  startTime: number;
  startX: number;
}

function normalizeCarouselAnimationTime(time: number, duration: number) {
  if (!Number.isFinite(time) || !Number.isFinite(duration) || duration <= 0) return 0;
  return ((time % duration) + duration) % duration;
}

function getCarouselAnimation(track: HTMLElement) {
  return track.getAnimations().find((animation) => animation.effect) ?? null;
}

function getCarouselAnimationTime(animation: Animation, duration: number) {
  const timing = animation.effect?.getComputedTiming();
  if (typeof timing?.progress === 'number') return timing.progress * duration;

  const currentTime = typeof animation.currentTime === 'number' ? animation.currentTime : 0;
  const delay = typeof timing?.delay === 'number' ? timing.delay : 0;
  return normalizeCarouselAnimationTime(currentTime - delay, duration);
}

function setCarouselAnimationTime(animation: Animation, time: number, duration: number) {
  const delay = animation.effect?.getComputedTiming().delay;
  animation.currentTime =
    (typeof delay === 'number' ? delay : 0) + normalizeCarouselAnimationTime(time, duration);
}

function createColor({ hex, opacity }: FineDetailsColorOpacity) {
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  return `rgb(${red} ${green} ${blue} / ${opacity}%)`;
}

function createCardStyle(
  settings: FineDetailsCarouselSettings,
  width: number,
  height: number,
): CSSProperties {
  const { border, radius, shadow } = settings;

  return {
    border: border.enabled ? `${border.width}px solid ${createColor(border.colorOpacity)}` : 'none',
    borderRadius: `${radius}px`,
    boxShadow: shadow.enabled
      ? `${shadow.offset.x * shadowOffsetPixels}px ${shadow.offset.y * shadowOffsetPixels}px ${shadow.blur}px ${shadow.spread}px ${createColor(shadow.colorOpacity)}`
      : 'none',
    boxSizing: 'border-box',
    height: `${height}px`,
    width: `${width}px`,
  };
}

function CarouselSequence({
  assets,
  effectiveHeight,
  isClone,
  loadedImageIds,
  onImageLoad,
  settings,
}: {
  assets: readonly FineDetailsCarouselAsset[];
  effectiveHeight: number;
  isClone: boolean;
  loadedImageIds: ReadonlySet<string>;
  onImageLoad: (imageId: string) => void;
  settings: FineDetailsCarouselSettings;
}) {
  return (
    <div
      aria-hidden={isClone || undefined}
      className={referenceClasses(styles.sequence)}
      data-fd-carousel-sequence={isClone ? 'clone' : 'primary'}
    >
      {assets.map((asset, index) => {
        const displayWidth = effectiveHeight * (asset.width / asset.height);
        const imageWidth = Math.max(1, Math.round(displayWidth));
        const imageHeight = Math.max(1, Math.round(effectiveHeight));
        const isGeneratedImageLoaded = !asset.isPrivate || loadedImageIds.has(asset.id);

        return (
          <div
            className={referenceClasses(`${styles.cardShell} ${asset.isPrivate ? placeholderStyles.surface : ''} ${
              asset.isPrivate && isGeneratedImageLoaded ? placeholderStyles.settled : ''
            }`)}
            data-fd-carousel-card-shell
            key={`${isClone ? 'clone' : 'primary'}-${asset.id}`}
            style={createCardStyle(settings, displayWidth, effectiveHeight)}
          >
            <Image
              alt=""
              className={`${styles.card} ${asset.isPrivate ? styles.generatedCard : ''} ${
                asset.isPrivate && isGeneratedImageLoaded ? styles.generatedCardLoaded : ''
              }`}
              data-fd-carousel-card={index + 1}
              data-fd-carousel-source={asset.id}
              draggable={false}
              height={imageHeight}
              onLoad={asset.isPrivate ? () => onImageLoad(asset.id) : undefined}
              src={asset.image}
              unoptimized={asset.isPrivate}
              width={imageWidth}
            />
            <a
              aria-label={`Download image ${index + 1}`}
              className={referenceClasses(styles.downloadButton)}
              download={asset.fileName}
              href={asset.downloadUrl}
              onPointerDown={(event) => event.stopPropagation()}
              tabIndex={isClone ? -1 : undefined}
            >
              <ArrowLineDownIcon aria-hidden size={20} weight="bold" />
            </a>
          </div>
        );
      })}
    </div>
  );
}

export function FineDetailsImageCarousel({
  assets = fineDetailsCarouselAssets,
  measurementKey,
  settings,
}: {
  assets?: readonly FineDetailsCarouselAsset[];
  measurementKey: string;
  settings: FineDetailsCarouselSettings;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<CarouselDragState | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loadedImageIds, setLoadedImageIds] = useState<ReadonlySet<string>>(() => new Set());
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const { layout, rootRef } = useFineDetailsTypographyBand({
    measurementKey,
    textGap: settings.textGap,
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener('change', updatePreference);
    return () => mediaQuery.removeEventListener('change', updatePreference);
  }, []);

  const renderHeight = layout.effectiveHeight;
  const visibleAssets = useMemo(() => assets.slice(0, settings.count), [assets, settings.count]);
  const rowWidth = useMemo(() => {
    const imageWidth = visibleAssets.reduce(
      (total, asset) => total + renderHeight * (asset.width / asset.height),
      0,
    );
    return imageWidth + Math.max(0, visibleAssets.length - 1) * settings.gap;
  }, [renderHeight, settings.gap, visibleAssets]);
  const loop = getFineDetailsCarouselLoop({
    containerWidth: layout.containerWidth,
    gap: settings.gap,
    rowWidth,
    speed: settings.speed,
  });
  const allVisibleImagesLoaded = visibleAssets.every(
    (asset) => !asset.isPrivate || loadedImageIds.has(asset.id),
  );
  const containsPrivateImages = visibleAssets.some((asset) => asset.isPrivate);
  const isAnimated =
    layout.isMeasured &&
    layout.isValid &&
    !prefersReducedMotion &&
    loop.animated &&
    allVisibleImagesLoaded;
  const shouldRenderCards = layout.isMeasured && layout.isValid;
  const carouselStyle: CSSProperties = layout.isMeasured
    ? { height: `${layout.bandHeight}px`, top: `${layout.bandTop}px` }
    : { bottom: 0, top: 0 };
  const trackStyle: CarouselCssVariables = {
    '--fd-carousel-duration': `${loop.durationSeconds}s`,
    '--fd-carousel-gap': `${settings.gap}px`,
    '--fd-carousel-phase': '0px',
    '--fd-carousel-shift': `${loop.shift}px`,
  };

  useEffect(() => {
    if (isAnimated || !dragStateRef.current) return;

    const pointerId = dragStateRef.current.pointerId;
    dragStateRef.current = null;
    const track = trackRef.current;
    if (track?.hasPointerCapture(pointerId)) track.releasePointerCapture(pointerId);
    setIsDragging(false);
  }, [isAnimated]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !isAnimated) return;

    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;

      const animation = getCarouselAnimation(track);
      if (!animation) return;

      const duration = loop.durationSeconds * 1000;
      const currentTime = getCarouselAnimationTime(animation, duration);
      const nextTime = currentTime + (event.deltaX / Math.max(settings.speed, 1)) * 1000;
      setCarouselAnimationTime(animation, nextTime, duration);
      event.preventDefault();
    };

    track.addEventListener('wheel', handleWheel, { passive: false });
    return () => track.removeEventListener('wheel', handleWheel);
  }, [isAnimated, loop.durationSeconds, settings.speed]);

  const markImageLoaded = useCallback((imageId: string) => {
    setLoadedImageIds((currentImageIds) => {
      if (currentImageIds.has(imageId)) return currentImageIds;
      const nextImageIds = new Set(currentImageIds);
      nextImageIds.add(imageId);
      return nextImageIds;
    });
  }, []);

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isAnimated || !event.isPrimary || event.button !== 0) return;

    const target = event.target;
    if (
      !(target instanceof Element) ||
      target.closest(`.${styles.downloadButton}`) ||
      !target.closest('[data-fd-carousel-card-shell]')
    ) {
      return;
    }

    const computedTransform = window.getComputedStyle(event.currentTarget).transform;
    const currentTransform =
      computedTransform === 'none' ? 0 : new DOMMatrixReadOnly(computedTransform).m41;
    const currentPhase = normalizeFineDetailsCarouselPhase(currentTransform, loop.shift);
    const animation = getCarouselAnimation(event.currentTarget);
    if (!animation) return;

    const duration = loop.durationSeconds * 1000;
    const currentTime = getCarouselAnimationTime(animation, duration);
    animation.pause();

    dragStateRef.current = {
      animation,
      duration,
      pointerId: event.pointerId,
      startTime:
        Number.isFinite(currentTime) && duration > 0
          ? currentTime
          : (-currentPhase / Math.max(settings.speed, 1)) * 1000,
      startX: getSectionPoint(event.currentTarget, event).x,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    event.preventDefault();
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    const nextTime =
      dragState.startTime -
      ((getSectionPoint(event.currentTarget, event).x - dragState.startX) / Math.max(settings.speed, 1)) * 1000;
    setCarouselAnimationTime(dragState.animation, nextTime, dragState.duration);
    event.preventDefault();
  }

  function finishPointerDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    dragStateRef.current = null;
    setIsDragging(false);
    dragState.animation.play();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    event.preventDefault();
  }

  return (
    <div
      className={referenceClasses(styles.root)}
      data-fd-carousel-animated={isAnimated ? 'true' : 'false'}
      data-fd-carousel-band-valid={layout.isValid ? 'true' : 'false'}
      data-fd-carousel-draggable={isAnimated ? 'true' : 'false'}
      data-fd-carousel-dragging={isDragging ? 'true' : 'false'}
      data-fd-carousel-images-ready={allVisibleImagesLoaded ? 'true' : 'false'}
      data-fine-details-carousel
      ref={rootRef}
      style={carouselStyle}
    >
      {shouldRenderCards ? (
        <div className={referenceClasses(`${styles.viewport} ${!loop.animated ? styles.centered : ''}`)}>
          <div
            className={referenceClasses(`${styles.track} ${isAnimated ? styles.animated : ''} ${
              isAnimated && containsPrivateImages ? styles.revealComplete : ''
            } ${isDragging ? styles.dragging : ''}`)}
            data-fd-carousel-track
            onLostPointerCapture={finishPointerDrag}
            onPointerCancel={finishPointerDrag}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishPointerDrag}
            ref={trackRef}
            style={trackStyle}
          >
            <CarouselSequence
              assets={visibleAssets}
              effectiveHeight={renderHeight}
              isClone={false}
              loadedImageIds={loadedImageIds}
              onImageLoad={markImageLoaded}
              settings={settings}
            />
            {isAnimated ? (
              <CarouselSequence
                assets={visibleAssets}
                effectiveHeight={renderHeight}
                isClone
                loadedImageIds={loadedImageIds}
                onImageLoad={markImageLoaded}
                settings={settings}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
