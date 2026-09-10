'use client';

import { referenceClasses } from '@/section/reference/reference-classes';
import { getSectionPoint, getSectionRect } from '@/section/reference/reference-geometry';

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import {
  AnimatePresence,
  domAnimation,
  LazyMotion,
  m,
  useMotionValue,
  useSpring,
} from 'motion/react';
import Image from '@/section/reference/reference-image';

import { usePrefersReducedMotion } from '@/section/shared/hooks/use-prefers-reduced-motion';

import { getFineDetailsDefaultTrailAsset } from './fine-details-default-assets';
import type { FineDetailsTrailSettings } from './fine-details-settings';
import {
  getFineDetailsTrailMediaEntry,
  getFineDetailsTrailMediaServerSnapshot,
  getFineDetailsTrailMediaSnapshot,
  markFineDetailsTrailMediaRefsUsed,
  subscribeFineDetailsTrailMedia,
} from './fine-details-trail-media-store';
import {
  getFineDetailsBuiltInTrailMedia,
  getFineDetailsTrailRenderedImageDimensions,
  type FineDetailsTrailImageGeometry,
} from './fine-details-trail-image-media';
import {
  getFineDetailsTrailPointerSnapshot,
  subscribeFineDetailsTrailPointer,
} from './fine-details-trail-pointer-store';

type TrailMedia = {
  readonly height: number;
  readonly sizes?: string;
  readonly src: string;
  readonly unoptimized: boolean;
  readonly width: number;
};

type TrailStatus = 'active' | 'idle' | 'off' | 'suppressed';

type TrailCard = {
  readonly id: number;
  readonly imageRef: string;
  readonly rampStrength: number;
  readonly rotation: number;
  readonly x: number;
  readonly y: number;
};

type Point = { x: number; y: number };

interface TrailCardViewProps {
  borderColor: string;
  borderWidth: number;
  boxShadow: string;
  card: TrailCard;
  cardRadius: number;
  cardSize: number;
  fadeIn: number;
  fadeOut: number;
  image: FineDetailsTrailImageGeometry;
  media: TrailMedia;
  rankScale: number;
}

const shadowOffsetPixels = 48;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - value, 3);
}

function distance(first: Point, second: Point) {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

function createShadowColor(settings: FineDetailsTrailSettings['shadow']) {
  const red = Number.parseInt(settings.colorOpacity.hex.slice(1, 3), 16);
  const green = Number.parseInt(settings.colorOpacity.hex.slice(3, 5), 16);
  const blue = Number.parseInt(settings.colorOpacity.hex.slice(5, 7), 16);
  return `rgb(${red} ${green} ${blue} / ${settings.colorOpacity.opacity}%)`;
}

function createCardShadow(settings: FineDetailsTrailSettings['shadow']) {
  return settings.enabled
    ? `${settings.offset.x * shadowOffsetPixels}px ${settings.offset.y * shadowOffsetPixels}px ${settings.blur}px ${settings.spread}px ${createShadowColor(settings)}`
    : 'none';
}

function getTrailMedia(image: FineDetailsTrailImageGeometry, cardSize: number): TrailMedia | null {
  const defaultAsset = getFineDetailsDefaultTrailAsset(image.id);
  if (defaultAsset) return getFineDetailsBuiltInTrailMedia(image, cardSize, defaultAsset);

  const runtimeMedia = getFineDetailsTrailMediaEntry(image.ref);
  return runtimeMedia?.status === 'ready'
    ? {
        height: runtimeMedia.height,
        src: runtimeMedia.objectUrl,
        unoptimized: true,
        width: runtimeMedia.width,
      }
    : null;
}

const TrailCardView = memo(function TrailCardView({
  borderColor,
  borderWidth,
  boxShadow,
  card,
  cardRadius,
  cardSize,
  fadeIn,
  fadeOut,
  image,
  media,
  rankScale,
}: TrailCardViewProps) {
  const { cardWidth, imageHeight, imageWidth } = getFineDetailsTrailRenderedImageDimensions(
    image,
    cardSize,
    media,
  );
  const animate = useMemo(
    () => ({
      opacity: card.rampStrength,
      rotate: card.rotation,
      scale: rankScale * card.rampStrength,
      x: '-50%',
      y: '-50%',
    }),
    [card, rankScale],
  );
  const exit = useMemo(
    () => ({
      opacity: 0,
      scale: rankScale * 0.8,
      transition: { duration: fadeOut / 1000 },
    }),
    [fadeOut, rankScale],
  );
  const initial = useMemo(
    () => ({
      opacity: 0,
      rotate: card.rotation,
      scale: rankScale * card.rampStrength * 0.8,
      x: '-50%',
      y: '-50%',
    }),
    [card, rankScale],
  );
  const style = useMemo(
    () => ({
      borderColor,
      borderRadius: cardRadius,
      borderStyle: 'solid' as const,
      borderWidth,
      boxShadow,
      boxSizing: 'border-box' as const,
      height: cardSize,
      left: card.x,
      top: card.y,
      width: cardWidth,
    }),
    [borderColor, borderWidth, boxShadow, card, cardRadius, cardSize, cardWidth],
  );
  const transition = useMemo(
    () => ({
      opacity: { duration: fadeIn / 1000 },
      rotate: { duration: fadeIn / 1000 },
      scale: { duration: fadeIn / 1000 },
    }),
    [fadeIn],
  );
  const imageStyle = useMemo(
    () => ({
      height: imageHeight,
      transform: `translate(-50%, -50%) rotate(${image.transform.rotationDeg}deg) scale(${image.transform.flipHorizontal ? -1 : 1}, ${image.transform.flipVertical ? -1 : 1})`,
      width: imageWidth,
    }),
    [image, imageHeight, imageWidth],
  );

  return (
    <m.div
      animate={animate}
      className={referenceClasses("absolute overflow-hidden")}
      data-trail-card
      exit={exit}
      initial={initial}
      style={style}
      transition={transition}
    >
      <Image
        alt=""
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 max-w-none object-cover"
        draggable={false}
        height={media.height}
        sizes={media.sizes}
        src={media.src}
        style={imageStyle}
        unoptimized={media.unoptimized}
        width={media.width}
      />
    </m.div>
  );
});

export function FineDetailsImageTrail({ settings }: { settings: FineDetailsTrailSettings }) {
  const reducedMotion = usePrefersReducedMotion();
  const mediaRevision = useSyncExternalStore(
    subscribeFineDetailsTrailMedia,
    getFineDetailsTrailMediaSnapshot,
    getFineDetailsTrailMediaServerSnapshot,
  );
  const [cards, setCards] = useState<readonly TrailCard[]>([]);
  const [status, setStatus] = useState<TrailStatus>('off');
  const [touchSource, setTouchSource] = useState(false);
  const layerRef = useRef<HTMLDivElement>(null);
  const pointerActiveRef = useRef(false);
  const suppressedRef = useRef(false);
  const resumeAtRef = useRef(0);
  const lastSpawnPointRef = useRef<Point | null>(null);
  const imageIndexRef = useRef(0);
  const cardIdRef = useRef(0);
  const lifetimeTimersRef = useRef(new Map<number, number>());
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springOptions = useMemo(
    () => ({ bounce: 0, duration: Math.max(1, settings.smoothness) }),
    [settings.smoothness],
  );
  const smoothX = useSpring(rawX, springOptions);
  const smoothY = useSpring(rawY, springOptions);

  const readyImages = useMemo(
    () =>
      settings.images.filter(
        (image) =>
          getFineDetailsDefaultTrailAsset(image.id) !== undefined ||
          getFineDetailsTrailMediaEntry(image.ref)?.status === 'ready',
      ),
    [mediaRevision, settings.images],
  );
  const featureEnabled =
    settings.enabled && !reducedMotion && !touchSource && settings.images.length > 0;

  useEffect(() => {
    markFineDetailsTrailMediaRefsUsed(settings.images.map((image) => image.ref));
    return () => {
      markFineDetailsTrailMediaRefsUsed([]);
    };
  }, [settings.images]);

  const clearCards = useCallback(() => {
    for (const timeoutId of lifetimeTimersRef.current.values()) {
      window.clearTimeout(timeoutId);
    }
    lifetimeTimersRef.current.clear();
    setCards([]);
  }, []);

  const setPointerInactive = useCallback(() => {
    pointerActiveRef.current = false;
    lastSpawnPointRef.current = null;
    setStatus(featureEnabled ? 'idle' : 'off');
  }, [featureEnabled]);

  const updatePointer = useCallback(
    (point: Point) => {
      const wasActive = pointerActiveRef.current;
      pointerActiveRef.current = true;
      rawX.set(point.x);
      rawY.set(point.y);
      if (!wasActive) {
        smoothX.jump(point.x);
        smoothY.jump(point.y);
      }

      setStatus(
        suppressedRef.current || performance.now() < resumeAtRef.current ? 'suppressed' : 'active',
      );
    },
    [rawX, rawY, smoothX, smoothY],
  );

  useEffect(() => {
    const layer = layerRef.current;
    const section = layer?.closest<HTMLElement>('section');
    if (!section) return;
    const activeSection = section;

    function handlePointerMove(event: PointerEvent) {
      if (event.pointerType === 'touch') {
        setTouchSource(true);
        setPointerInactive();
        return;
      }
      if (event.buttons !== 0) return;

      setTouchSource(false);
      const rect = getSectionRect(activeSection);
      const point = getSectionPoint(activeSection, event);
      updatePointer({ x: point.x - rect.left, y: point.y - rect.top });
    }

    function handlePointerRest() {
      setPointerInactive();
    }

    activeSection.addEventListener('pointermove', handlePointerMove);
    activeSection.addEventListener('pointerleave', handlePointerRest);
    activeSection.addEventListener('pointercancel', handlePointerRest);
    return () => {
      activeSection.removeEventListener('pointermove', handlePointerMove);
      activeSection.removeEventListener('pointerleave', handlePointerRest);
      activeSection.removeEventListener('pointercancel', handlePointerRest);
    };
  }, [setPointerInactive, updatePointer]);

  useEffect(() => {
    let bridgeActive = false;
    const sync = () => {
      const pointer = getFineDetailsTrailPointerSnapshot();
      if (pointer.active) {
        bridgeActive = true;
        setTouchSource(false);
        updatePointer({ x: pointer.x, y: pointer.y });
      } else if (bridgeActive) {
        bridgeActive = false;
        setPointerInactive();
      }
    };
    sync();
    const unsubscribe = subscribeFineDetailsTrailPointer(sync);
    return () => {
      unsubscribe();
    };
  }, [setPointerInactive, updatePointer]);

  useEffect(() => {
    if (featureEnabled) {
      setStatus(pointerActiveRef.current ? 'active' : 'idle');
      return;
    }

    pointerActiveRef.current = false;
    suppressedRef.current = false;
    resumeAtRef.current = 0;
    lastSpawnPointRef.current = null;
    clearCards();
    setStatus('off');
  }, [clearCards, featureEnabled]);

  useEffect(() => {
    const section = layerRef.current?.closest<HTMLElement>('section');
    const prompt = section?.querySelector<HTMLElement>('[data-fine-details-prompt]');
    if (!prompt) return;
    const activePrompt = prompt;

    function handlePromptFocusIn() {
      if (!featureEnabled) return;
      suppressedRef.current = true;
      resumeAtRef.current = Number.POSITIVE_INFINITY;
      lastSpawnPointRef.current = null;
      setStatus('suppressed');
    }

    function handlePromptFocusOut(event: FocusEvent) {
      if (
        !featureEnabled ||
        (event.relatedTarget instanceof Node && activePrompt.contains(event.relatedTarget))
      ) {
        return;
      }

      suppressedRef.current = false;
      resumeAtRef.current = performance.now() + settings.resumeDelay;
      lastSpawnPointRef.current = null;
      setStatus(pointerActiveRef.current ? 'suppressed' : 'idle');
    }

    activePrompt.addEventListener('focusin', handlePromptFocusIn);
    activePrompt.addEventListener('focusout', handlePromptFocusOut);
    if (featureEnabled && activePrompt.contains(document.activeElement)) handlePromptFocusIn();

    return () => {
      activePrompt.removeEventListener('focusin', handlePromptFocusIn);
      activePrompt.removeEventListener('focusout', handlePromptFocusOut);
    };
  }, [featureEnabled, settings.resumeDelay]);

  useEffect(() => {
    setCards((current) => {
      if (current.length <= settings.length) return current;
      const removed = current.slice(0, current.length - settings.length);
      for (const card of removed) {
        const timeoutId = lifetimeTimersRef.current.get(card.id);
        if (timeoutId !== undefined) window.clearTimeout(timeoutId);
        lifetimeTimersRef.current.delete(card.id);
      }
      return current.slice(-settings.length);
    });
  }, [settings.length]);

  useEffect(() => {
    if (!featureEnabled || readyImages.length === 0) return;

    let animationFrame = 0;

    function spawn(point: Point, now: number) {
      const image = readyImages[imageIndexRef.current % readyImages.length];
      imageIndexRef.current += 1;
      const rampProgress =
        settings.resumeRamp <= 0
          ? 1
          : clamp((now - resumeAtRef.current) / settings.resumeRamp, 0, 1);
      const card: TrailCard = {
        id: ++cardIdRef.current,
        imageRef: image.ref,
        rampStrength: easeOutCubic(rampProgress),
        rotation: (Math.random() * 2 - 1) * settings.tilt,
        x: point.x,
        y: point.y,
      };

      setCards((current) => {
        const next = [...current, card];
        const removed = next.slice(0, Math.max(0, next.length - settings.length));
        for (const removedCard of removed) {
          const timeoutId = lifetimeTimersRef.current.get(removedCard.id);
          if (timeoutId !== undefined) window.clearTimeout(timeoutId);
          lifetimeTimersRef.current.delete(removedCard.id);
        }
        return next.slice(-settings.length);
      });

      const timeoutId = window.setTimeout(() => {
        lifetimeTimersRef.current.delete(card.id);
        setCards((current) => current.filter((candidate) => candidate.id !== card.id));
      }, settings.lifetime);
      lifetimeTimersRef.current.set(card.id, timeoutId);
    }

    function tick(now: number) {
      if (pointerActiveRef.current && !suppressedRef.current && now >= resumeAtRef.current) {
        const point = {
          x: settings.smoothness === 0 ? rawX.get() : smoothX.get(),
          y: settings.smoothness === 0 ? rawY.get() : smoothY.get(),
        };
        let lastPoint = lastSpawnPointRef.current;

        if (!lastPoint) {
          spawn(point, now);
          lastSpawnPointRef.current = point;
          setStatus('active');
        } else {
          let remainingDistance = distance(lastPoint, point);
          let spawnCount = 0;
          while (remainingDistance >= settings.spacing && spawnCount < 6) {
            const ratio = settings.spacing / remainingDistance;
            lastPoint = {
              x: lastPoint.x + (point.x - lastPoint.x) * ratio,
              y: lastPoint.y + (point.y - lastPoint.y) * ratio,
            };
            spawn(lastPoint, now);
            remainingDistance = distance(lastPoint, point);
            spawnCount += 1;
          }
          lastSpawnPointRef.current = lastPoint;
        }
      } else if (pointerActiveRef.current) {
        setStatus('suppressed');
      }

      animationFrame = requestAnimationFrame(tick);
    }

    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, [featureEnabled, rawX, rawY, readyImages, settings, smoothX, smoothY]);

  useEffect(() => clearCards, [clearCards]);

  const imageByRef = useMemo(
    () => new Map(settings.images.map((image) => [image.ref, image])),
    [settings.images],
  );
  const mediaByRef = useMemo(() => {
    const media = new Map<string, TrailMedia>();
    for (const image of settings.images) {
      const entry = getTrailMedia(image, settings.cardSize);
      if (entry) media.set(image.ref, entry);
    }
    return media;
  }, [mediaRevision, settings.cardSize, settings.images]);
  const boxShadow = useMemo(() => createCardShadow(settings.shadow), [settings.shadow]);

  return (
    <LazyMotion features={domAnimation}>
      <div
        aria-hidden="true"
        className={referenceClasses("pointer-events-none absolute inset-0 z-[5] overflow-hidden")}
        data-fine-details-trail={status}
        ref={layerRef}
      >
        <AnimatePresence>
          {cards.map((card, index) => {
            const image = imageByRef.get(card.imageRef);
            const media = mediaByRef.get(card.imageRef);
            if (!image || !media) return null;

            const rank = cards.length - index - 1;
            const rankScale = Math.max(0.1, 1 - (rank * settings.sizeFalloff) / 100);

            return (
              <TrailCardView
                borderColor={settings.border.color}
                borderWidth={settings.border.enabled ? settings.border.width : 0}
                boxShadow={boxShadow}
                card={card}
                cardRadius={settings.cardRadius}
                cardSize={settings.cardSize}
                fadeIn={settings.fadeIn}
                fadeOut={settings.fadeOut}
                image={image}
                key={card.id}
                media={media}
                rankScale={rankScale}
              />
            );
          })}
        </AnimatePresence>
      </div>
    </LazyMotion>
  );
}
