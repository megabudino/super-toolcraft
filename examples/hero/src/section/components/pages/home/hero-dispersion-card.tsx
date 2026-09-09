'use client';

import { referenceClasses } from '@/section/reference/reference-classes';
import Image from '@/section/reference-image';
import { useEffect, useRef, useState } from 'react';

import {
  createHeroCardDispersionRenderer,
  type HeroCardDispersionRenderer,
  type HeroCardEdgeSide,
  type HeroCardRollLayout,
} from './hero-card-dispersion-webgl';
import type { HeroGalleryImageSource } from './hero-gallery-sources';
import type { HeroDispersionSettings } from './hero-scene-settings';

const HORIZONTAL_BLEED = 256;
const VERTICAL_BLEED = 80;
const VELOCITY_GAIN = 1.6;
const VELOCITY_LIMIT = 140;
const VELOCITY_REST_THRESHOLD = 0.05;
const VELOCITY_SMOOTHING = 0.2;

interface HeroDispersionCardProps {
  cornerRadius: number;
  dispersion: HeroDispersionSettings;
  motionKey: string;
  perspective: number;
  priority: boolean;
  roll: number;
  side: HeroCardEdgeSide;
  source: HeroGalleryImageSource;
}

function createTransformedCardImage(
  image: HTMLImageElement,
  source: HeroGalleryImageSource,
): HTMLImageElement | HTMLCanvasElement {
  const transform = source.transform;
  if (transform.rotationDeg === 0 && !transform.flipHorizontal && !transform.flipVertical) {
    return image;
  }

  const rotated = transform.rotationDeg === 90 || transform.rotationDeg === 270;
  const canvas = document.createElement('canvas');
  canvas.width = rotated ? image.naturalHeight : image.naturalWidth;
  canvas.height = rotated ? image.naturalWidth : image.naturalHeight;
  const context = canvas.getContext('2d');
  if (!context) return image;
  context.translate(canvas.width / 2, canvas.height / 2);
  context.scale(transform.flipHorizontal ? -1 : 1, transform.flipVertical ? -1 : 1);
  context.rotate((transform.rotationDeg * Math.PI) / 180);
  const drawWidth = rotated ? canvas.height : canvas.width;
  const drawHeight = rotated ? canvas.width : canvas.height;
  context.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  return canvas;
}

function measureSharedRollPath(
  card: HTMLDivElement,
  side: HeroCardEdgeSide,
  viewportBounds: DOMRect,
) {
  const row = card.closest<HTMLElement>('[data-hero-card-row]');
  const wrapper = card.closest<HTMLElement>('[data-hero-card-index]');
  if (!row || !wrapper) return { pathLength: card.clientWidth, pathOffset: 0 };

  const wrappers = Array.from(row.children).filter(
    (child): child is HTMLElement =>
      child instanceof HTMLElement && child.hasAttribute('data-hero-card-index'),
  );
  const innerWrapper = wrappers.at(-1);
  if (!innerWrapper) return { pathLength: card.clientWidth, pathOffset: 0 };

  const innerBounds = innerWrapper.getBoundingClientRect();
  const origin = side === 'left' ? innerBounds.right : innerBounds.left;
  const wrapperBounds = wrapper.getBoundingClientRect();
  const pathOffset = side === 'left' ? origin - wrapperBounds.right : wrapperBounds.left - origin;
  const pathLength = side === 'left' ? origin - viewportBounds.left : viewportBounds.right - origin;

  return {
    pathLength: Math.max(1, pathLength),
    pathOffset: Math.max(0, pathOffset),
  };
}

function syncRendererLayout(
  renderer: HeroCardDispersionRenderer,
  card: HTMLDivElement,
  canvas: HTMLCanvasElement,
  layout: Pick<HeroCardRollLayout, 'cornerRadius' | 'perspective' | 'roll'>,
  side: HeroCardEdgeSide,
) {
  const viewport = card.closest<HTMLElement>('[data-hero-scene]');
  if (!viewport) return;

  renderer.setSize(
    card.clientWidth,
    card.clientHeight,
    HORIZONTAL_BLEED,
    VERTICAL_BLEED,
    window.devicePixelRatio,
  );
  const viewportBounds = viewport.getBoundingClientRect();
  const canvasBounds = canvas.getBoundingClientRect();
  const sharedPath = measureSharedRollPath(card, side, viewportBounds);
  card.dataset.heroCardRollPathLength = sharedPath.pathLength.toFixed(2);
  card.dataset.heroCardRollPathOffset = sharedPath.pathOffset.toFixed(2);
  renderer.setLayout({
    ...layout,
    canvasViewportX: canvasBounds.left - viewportBounds.left,
    ...sharedPath,
    viewportWidth: viewportBounds.width,
  });
}

export function HeroDispersionCard({
  cornerRadius,
  dispersion,
  motionKey,
  perspective,
  priority,
  roll,
  side,
  source,
}: HeroDispersionCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const rendererRef = useRef<HeroCardDispersionRenderer | null>(null);
  const settingsRef = useRef(dispersion);
  const layoutRef = useRef({ cornerRadius, perspective, roll });
  const motionRef = useRef({
    frame: null as number | null,
    lastPosition: 0,
    position: 0,
    velocity: 0,
  });
  const [imageRevision, setImageRevision] = useState(0);
  const [isInViewport, setIsInViewport] = useState(false);
  const [isReady, setIsReady] = useState(false);

  settingsRef.current = dispersion;
  layoutRef.current = { cornerRadius, perspective, roll };

  useEffect(() => {
    const card = cardRef.current;
    const viewport = card?.closest<HTMLElement>('[data-hero-scene]');
    if (!card || !viewport) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsInViewport(entry?.isIntersecting ?? false),
      { root: viewport },
    );
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const card = cardRef.current;
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!card || !canvas || !image) return;
    if (!isInViewport) {
      card.dataset.dispersionLifecycle = 'outside-viewport';
      setIsReady(false);
      return;
    }
    if (!image.complete || image.naturalWidth === 0) {
      card.dataset.dispersionLifecycle = 'waiting-for-image';
      return;
    }
    card.dataset.dispersionLifecycle = 'initializing';

    let renderer: HeroCardDispersionRenderer;
    try {
      renderer = createHeroCardDispersionRenderer(
        canvas,
        createTransformedCardImage(image, source),
        side,
      );
    } catch (error) {
      card.dataset.dispersionError =
        error instanceof Error ? error.message : 'Unknown WebGL renderer error';
      setIsReady(false);
      return;
    }

    delete card.dataset.dispersionError;
    card.dataset.dispersionLifecycle = 'active';
    rendererRef.current = renderer;
    renderer.setUniforms(settingsRef.current);
    motionRef.current.position = card.getBoundingClientRect().left;
    motionRef.current.lastPosition = motionRef.current.position;
    motionRef.current.velocity = 0;

    const resize = () => {
      syncRendererLayout(renderer, card, canvas, layoutRef.current, side);
      renderer.render(0);
      setIsReady(true);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(card);
    const viewport = card.closest<HTMLElement>('[data-hero-scene]');
    if (viewport) resizeObserver.observe(viewport);
    resize();

    const handleContextLost = () => setIsReady(false);
    const handleContextRestored = () => setImageRevision((revision) => revision + 1);
    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    return () => {
      resizeObserver.disconnect();
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      const animation = motionRef.current;
      if (animation.frame !== null) cancelAnimationFrame(animation.frame);
      animation.frame = null;
      renderer.dispose();
      if (rendererRef.current === renderer) rendererRef.current = null;
      card.dataset.dispersionLifecycle = 'disposed';
      setIsReady(false);
    };
  }, [imageRevision, isInViewport, side, source]);

  useEffect(() => {
    rendererRef.current?.setUniforms(dispersion);
  }, [dispersion]);

  useEffect(() => {
    const renderer = rendererRef.current;
    const card = cardRef.current;
    const canvas = canvasRef.current;
    if (!renderer || !card || !canvas) return;
    syncRendererLayout(renderer, card, canvas, layoutRef.current, side);
    renderer.render(motionRef.current.velocity);
  }, [motionKey]);

  useEffect(() => {
    const animation = motionRef.current;
    const card = cardRef.current;
    const canvas = canvasRef.current;
    if (!card || !canvas || animation.frame !== null || !rendererRef.current) return;
    syncRendererLayout(rendererRef.current, card, canvas, layoutRef.current, side);
    animation.position = card.getBoundingClientRect().left;

    const step = () => {
      animation.frame = null;
      const renderer = rendererRef.current;
      if (!renderer) return;
      syncRendererLayout(renderer, card, canvas, layoutRef.current, side);
      animation.position = card.getBoundingClientRect().left;
      const instantaneous = animation.position - animation.lastPosition;
      animation.lastPosition = animation.position;
      animation.velocity += (instantaneous - animation.velocity) * (VELOCITY_SMOOTHING * 2);
      const velocityPx = Math.max(
        -VELOCITY_LIMIT,
        Math.min(VELOCITY_LIMIT, animation.velocity * settingsRef.current.velocity * VELOCITY_GAIN),
      );
      renderer.render(velocityPx);
      if (Math.abs(animation.velocity) > VELOCITY_REST_THRESHOLD || instantaneous !== 0) {
        animation.frame = requestAnimationFrame(step);
      }
    };

    animation.frame = requestAnimationFrame(step);
  }, [motionKey]);

  return (
    <div
      className={referenceClasses("absolute inset-0")}
      data-dispersion-ready={isReady ? 'true' : 'false'}
      data-hero-card-roll={roll}
      ref={cardRef}
    >
      <div
        className={referenceClasses(`absolute inset-0 overflow-hidden bg-black/15 ${isReady ? 'opacity-0' : 'opacity-100'}`)}
        style={{ borderRadius: cornerRadius }}
      >
        {source.url.startsWith('/') ? (
          <Image
            alt=""
            className="object-cover"
            fill
            onLoad={() => setImageRevision((revision) => revision + 1)}
            priority={priority}
            ref={imageRef}
            sizes={`${Math.max(1, Math.round(source.width))}px`}
            src={source.url}
          />
        ) : (
          <img
            alt=""
            className={referenceClasses("absolute inset-0 h-full w-full object-cover")}
            onLoad={() => setImageRevision((revision) => revision + 1)}
            ref={imageRef}
            src={source.url}
          />
        )}
      </div>
      <canvas
        aria-hidden="true"
        className={referenceClasses("pointer-events-none absolute max-w-none")}
        data-hero-dispersion-canvas={side}
        ref={canvasRef}
        style={{
          height: `calc(100% + ${VERTICAL_BLEED * 2}px)`,
          left: side === 'left' ? -HORIZONTAL_BLEED : 0,
          top: -VERTICAL_BLEED,
          width: `calc(100% + ${HORIZONTAL_BLEED}px)`,
        }}
      />
    </div>
  );
}
