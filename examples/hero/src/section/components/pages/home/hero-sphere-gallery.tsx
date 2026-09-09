'use client';

import { referenceClasses } from '@/section/reference/reference-classes';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { usePrefersReducedMotion } from '@/section/shared/hooks/use-prefers-reduced-motion';
import { withBasePath } from '@/section/shared/config/base-path';
import {
  applyHeroGalleryPanClick,
  applyHeroGalleryPanDrag,
  getHeroGalleryPanelPeriod,
  type HeroGalleryPan,
} from './hero-gallery-drag';
import {
  createHeroGalleryImageSignature,
  resolveHeroGalleryRowSources,
} from './hero-gallery-sources';
import { homeHeroMediaReadiness } from './home-hero-media-readiness';
import {
  HERO_COMPACT_POST_FRAGMENT_SHADER,
  HERO_DISPERSION_POST_FRAGMENT_SHADER,
} from './hero-dispersion-post-shader';
import {
  createHeroSphereGalleryRenderer,
  type HeroSphereGalleryRenderer,
  type HeroSphereGalleryRendererState,
} from './hero-sphere-gallery-webgl';
import { getHeroAutoScrollEasedProgress } from './hero-sphere-gallery-motion';
import {
  createHeroSphereGalleryRevealController,
  getHeroSphereGalleryRevealTransition,
} from './hero-sphere-gallery-reveal';
import {
  getResponsiveHeroSceneSettings,
  HERO_DESKTOP_MIN_WIDTH_PX,
} from './hero-responsive-settings';
import type { HeroGalleryRenderState, HeroSceneSettings } from './hero-scene-settings';

const pendingRendererState: HeroSphereGalleryRendererState = {
  autoScrollOffset: { x: 0, y: 0 },
  effect: 'post',
  phases: [],
  readyIds: [],
  renderer: 'pending',
  settledIds: [],
  turns: 0,
};

const fallbackRendererState: HeroSphereGalleryRendererState = {
  autoScrollOffset: { x: 0, y: 0 },
  effect: 'post',
  phases: [],
  readyIds: [],
  renderer: 'fallback',
  settledIds: [],
  turns: 0,
};

const HERO_GALLERY_CLICK_SLOP_PX = 6;
const HERO_GALLERY_RESOURCE_RELEASE_GRACE_MS = 2_000;
const HERO_GALLERY_RESOURCE_PREWARM_VIEWPORTS = 1.5;
const heroGalleryDesktopPoster = withBasePath(
  '/images/recraft-hero/fallback/hero-gallery-desktop.jpg',
);
const heroGalleryMobilePoster = withBasePath(
  '/images/recraft-hero/fallback/hero-gallery-mobile.jpg',
);

function createRowSignature(settings: HeroSceneSettings) {
  return settings.gallery.sphere.rows.map((row) => `${row.offset}:${row.speed}`).join('|');
}

interface HeroGalleryPanGesture {
  element: HTMLCanvasElement;
  lastClient: Readonly<{ x: number; y: number }>;
  movedBeyondClickSlop: boolean;
  panelPeriod: number;
  pointerId: number;
  scale: number;
  sphereWidth: number;
  startClient: Readonly<{ x: number; y: number }>;
  startPan: HeroGalleryPan;
  viewportBounds: Readonly<{ height: number; left: number; top: number; width: number }>;
}

function isUnmodifiedPrimaryPointer(
  event: Pick<
    ReactPointerEvent<HTMLCanvasElement>,
    'altKey' | 'button' | 'ctrlKey' | 'metaKey' | 'shiftKey'
  >,
) {
  return event.button === 0 && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;
}

function updateHeroGalleryGestureClient(
  gesture: HeroGalleryPanGesture,
  client: Readonly<{ x: number; y: number }>,
) {
  gesture.lastClient = client;
  const distanceX = client.x - gesture.startClient.x;
  const distanceY = client.y - gesture.startClient.y;
  if (
    distanceX * distanceX + distanceY * distanceY >
    HERO_GALLERY_CLICK_SLOP_PX * HERO_GALLERY_CLICK_SLOP_PX
  ) {
    gesture.movedBeyondClickSlop = true;
  }
}

export function HeroSphereGallery({
  animationSuspended = false,
  mediaRevision,
  onState,
  onPanChange,
  settings,
}: {
  animationSuspended?: boolean;
  mediaRevision: number;
  onState?: (state: HeroGalleryRenderState) => void;
  onPanChange?: (pan: HeroGalleryPan, historyGroup: string) => void;
  settings: HeroSceneSettings;
}) {
  const rowSources = useMemo(
    () => resolveHeroGalleryRowSources(settings.gallery),
    [mediaRevision, settings.gallery],
  );
  const flatSources = rowSources.flat();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<HeroSphereGalleryRenderer | null>(null);
  const animationSuspendedRef = useRef(animationSuspended);
  animationSuspendedRef.current = animationSuspended;
  useEffect(() => {
    rendererRef.current?.setActive(!animationSuspended && !document.hidden);
  }, [animationSuspended]);
  const gestureRef = useRef<HeroGalleryPanGesture | null>(null);
  const animationFrameRef = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [sceneWidth, setSceneWidth] = useState<number | null>(null);
  const useCompactTextures = sceneWidth !== null && sceneWidth < HERO_DESKTOP_MIN_WIDTH_PX;
  const rendererRowSources = useMemo(
    () =>
      useCompactTextures
        ? rowSources.map((row) =>
            row.map((source) =>
              source.compactTextureUrl
                ? {
                    ...source,
                    key: `${source.key}:compact`,
                    textureUrl: source.compactTextureUrl,
                  }
                : source,
            ),
          )
        : rowSources,
    [rowSources, useCompactTextures],
  );
  const [interactivePan, setPanState] = useState<HeroGalleryPan>(() => ({
    x: settings.gallery.sphere.pan.x,
    y: settings.gallery.sphere.pan.y,
  }));
  const publishedPanRef = useRef<HeroGalleryPan | null>(null);
  const historyGroupRef = useRef("hero-native-pan:initial");
  const onPanChangeRef = useRef(onPanChange);
  onPanChangeRef.current = onPanChange;
  const setInteractivePan = useCallback((pan: HeroGalleryPan) => {
    publishedPanRef.current = pan;
    setPanState(pan);
    onPanChangeRef.current?.(pan, historyGroupRef.current);
  }, []);
  const responsiveSettings = useMemo(
    () => getResponsiveHeroSceneSettings(settings, sceneWidth ?? HERO_DESKTOP_MIN_WIDTH_PX),
    [sceneWidth, settings],
  );
  const interactiveSettings = useMemo<HeroSceneSettings>(
    () => ({
      ...responsiveSettings,
      gallery: {
        ...responsiveSettings.gallery,
        sphere: {
          ...responsiveSettings.gallery.sphere,
          pan: interactivePan,
        },
      },
    }),
    [interactivePan, responsiveSettings],
  );
  const interactiveSettingsRef = useRef(interactiveSettings);
  interactiveSettingsRef.current = interactiveSettings;
  const prefersReducedMotion = usePrefersReducedMotion();
  const [rendererState, setRendererState] =
    useState<HeroSphereGalleryRendererState>(pendingRendererState);
  const retainedFrameUrlRef = useRef<string | null>(null);
  const [retainedFrameUrl, setRetainedFrameUrl] = useState<string | null>(null);
  const replaceRetainedFrame = useCallback((blob: Blob | null) => {
    const nextUrl = blob ? URL.createObjectURL(blob) : null;
    if (retainedFrameUrlRef.current) URL.revokeObjectURL(retainedFrameUrlRef.current);
    retainedFrameUrlRef.current = nextUrl;
    setRetainedFrameUrl(nextUrl);
  }, []);
  const imageOrder = rowSources.flatMap((row) => row.map((source) => source.id));
  const imageOrderRef = useRef(imageOrder);
  imageOrderRef.current = imageOrder;
  const imageSignature = createHeroGalleryImageSignature(settings.gallery);
  const rowSignature = createRowSignature(settings);
  const readySet = new Set(rendererState.readyIds);
  const ready = imageOrder.every((id) => readySet.has(id));
  const settledSet = new Set(rendererState.settledIds);
  const settled = imageOrder.every((id) => settledSet.has(id));
  const [revealed, setRevealed] = useState(false);
  const [revealController] = useState(() =>
    createHeroSphereGalleryRevealController({
      clearTimer: (timer: number) => window.clearTimeout(timer),
      onReveal: () => setRevealed(true),
      setTimer: (callback, delay) => window.setTimeout(callback, delay),
    }),
  );
  const applyGesture = useCallback((gesture: HeroGalleryPanGesture) => {
    setInteractivePan(
      applyHeroGalleryPanDrag({
        deltaPx: {
          x: (gesture.lastClient.x - gesture.startClient.x) / gesture.scale,
          y: (gesture.lastClient.y - gesture.startClient.y) / gesture.scale,
        },
        panelPeriod: gesture.panelPeriod,
        sphereWidth: gesture.sphereWidth,
        start: gesture.startPan,
      }),
    );
  }, [setInteractivePan]);
  const applyClickGesture = useCallback(
    (gesture: HeroGalleryPanGesture) => {
      const click = {
        clickPx: {
          x: (gesture.lastClient.x - gesture.viewportBounds.left) / gesture.scale,
          y: (gesture.lastClient.y - gesture.viewportBounds.top) / gesture.scale,
        },
        panelPeriod: gesture.panelPeriod,
        sphereWidth: gesture.sphereWidth,
        start: gesture.startPan,
        viewportSize: {
          height: gesture.viewportBounds.height / gesture.scale,
          width: gesture.viewportBounds.width / gesture.scale,
        },
      };
      if (prefersReducedMotion) {
        setInteractivePan(applyHeroGalleryPanClick(click));
        return;
      }

      const durationMs = Math.max(50, settings.gallery.sphere.autoScroll.duration * 1000);
      const startedAt = window.performance.now();
      const animate = (timestamp: number) => {
        const progress = Math.min(1, Math.max(0, (timestamp - startedAt) / durationMs));
        setInteractivePan(
          applyHeroGalleryPanClick({
            ...click,
            progress: getHeroAutoScrollEasedProgress(progress),
          }),
        );
        if (progress < 1) {
          animationFrameRef.current = window.requestAnimationFrame(animate);
        } else {
          animationFrameRef.current = 0;
        }
      };
      animationFrameRef.current = window.requestAnimationFrame(animate);
    },
    [prefersReducedMotion, setInteractivePan, settings.gallery.sphere.autoScroll.duration],
  );
  const flushGesture = useCallback(
    (gesture: HeroGalleryPanGesture) => {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
      applyGesture(gesture);
    },
    [applyGesture],
  );
  const releaseGesture = useCallback((gesture: HeroGalleryPanGesture) => {
    if (gestureRef.current === gesture) gestureRef.current = null;
    if (gesture.element.hasPointerCapture?.(gesture.pointerId)) {
      gesture.element.releasePointerCapture?.(gesture.pointerId);
    }
    setDragging(false);
  }, []);
  const finishGesture = useCallback(
    (gesture: HeroGalleryPanGesture) => {
      flushGesture(gesture);
      releaseGesture(gesture);
    },
    [flushGesture, releaseGesture],
  );
  useEffect(() => {
    if (publishedPanRef.current?.x === settings.gallery.sphere.pan.x &&
        publishedPanRef.current?.y === settings.gallery.sphere.pan.y) return;
    publishedPanRef.current = null;
    window.cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = 0;
    const gesture = gestureRef.current;
    if (gesture) {
      releaseGesture(gesture);
    }
    setPanState({
      x: settings.gallery.sphere.pan.x,
      y: settings.gallery.sphere.pan.y,
    });
  }, [releaseGesture, settings.gallery.sphere.pan.x, settings.gallery.sphere.pan.y]);
  useEffect(
    () => () => {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
      const gesture = gestureRef.current;
      gestureRef.current = null;
      if (gesture?.element.hasPointerCapture?.(gesture.pointerId)) {
        gesture.element.releasePointerCapture?.(gesture.pointerId);
      }
    },
    [],
  );
  useEffect(() => {
    revealController.activate();
    return () => revealController.dispose();
  }, [revealController]);
  useEffect(() => {
    revealController.update({ renderer: rendererState.renderer, settled });
  }, [rendererState.renderer, revealController, settled]);
  useEffect(() => {
    if (rendererState.renderer !== 'pending' && settled) {
      homeHeroMediaReadiness.markSettled();
    }
  }, [rendererState.renderer, settled]);
  useEffect(() => {
    if (!retainedFrameUrl || rendererState.renderer !== 'webgl' || !settled) return;
    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => replaceRetainedFrame(null));
    });
    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, [rendererState.renderer, replaceRetainedFrame, retainedFrameUrl, settled]);
  const showFallback = rendererState.renderer === 'fallback';
  const shouldPollRendererState = onState !== undefined;

  useEffect(() => {
    // The source value changes during Fast Refresh and must rebuild the retained GL program.
    void HERO_DISPERSION_POST_FRAGMENT_SHADER;
    void HERO_COMPACT_POST_FRAGMENT_SHADER;
    const canvas = canvasRef.current;
    const root = rootRef.current;
    const scene = root?.closest<HTMLElement>('[data-hero-scene]');
    if (!canvas || !root || !scene) return;

    setRendererState(pendingRendererState);
    let renderer: HeroSphereGalleryRenderer;
    try {
      renderer = createHeroSphereGalleryRenderer(canvas);
    } catch {
      setRendererState(fallbackRendererState);
      return;
    }
    rendererRef.current = renderer;
    let isCompactScene = scene.clientWidth < HERO_DESKTOP_MIN_WIDTH_PX;
    let isIntersecting = true;
    let isNearViewport = true;
    let hasPreparedForApproach = false;
    let lastScrollY = window.scrollY;
    let resourceReleaseGeneration = 0;
    let resourceReleaseTimer: number | null = null;
    const resourcePrewarmMargin = `${Math.round(
      window.innerHeight * HERO_GALLERY_RESOURCE_PREWARM_VIEWPORTS,
    )}px 0px`;
    const clearResourceReleaseTimer = () => {
      resourceReleaseGeneration += 1;
      if (resourceReleaseTimer === null) return;
      window.clearTimeout(resourceReleaseTimer);
      resourceReleaseTimer = null;
    };
    const scheduleCompactResourceRelease = () => {
      clearResourceReleaseTimer();
      if (!isCompactScene || isIntersecting) return;
      const generation = resourceReleaseGeneration;
      resourceReleaseTimer = window.setTimeout(async () => {
        resourceReleaseTimer = null;
        if (!isCompactScene || isIntersecting) return;
        const frameBlob = await renderer.captureFrame();
        if (generation !== resourceReleaseGeneration || !isCompactScene || isIntersecting) {
          return;
        }
        if (frameBlob) replaceRetainedFrame(frameBlob);
        renderer.releaseResources();
        hasPreparedForApproach = false;
      }, HERO_GALLERY_RESOURCE_RELEASE_GRACE_MS);
    };
    const syncSize = () => {
      const nextSceneWidth = scene.clientWidth;
      isCompactScene = nextSceneWidth < HERO_DESKTOP_MIN_WIDTH_PX;
      setSceneWidth((currentSceneWidth) =>
        currentSceneWidth === nextSceneWidth ? currentSceneWidth : nextSceneWidth,
      );
      renderer.setSettings(
        getResponsiveHeroSceneSettings(interactiveSettingsRef.current, nextSceneWidth),
      );
      renderer.setSize(nextSceneWidth, scene.clientHeight, window.devicePixelRatio);
      if (!isCompactScene || isNearViewport) {
        clearResourceReleaseTimer();
        renderer.prepareResources();
      } else {
        scheduleCompactResourceRelease();
      }
    };
    const resizeObserver = new ResizeObserver(syncSize);
    resizeObserver.observe(scene);
    syncSize();
    renderer.setStateListener(() => setRendererState(renderer.getState()));
    setRendererState(renderer.getState());

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isIntersecting = entry?.isIntersecting ?? false;
        if (isIntersecting) {
          clearResourceReleaseTimer();
          renderer.prepareResources();
        } else {
          scheduleCompactResourceRelease();
        }
        renderer.setActive(!animationSuspendedRef.current && isIntersecting && !document.hidden);
      },
      { root: null },
    );
    intersectionObserver.observe(root);
    const proximityObserver = new IntersectionObserver(
      ([entry]) => {
        isNearViewport = entry?.isIntersecting ?? false;
        if (isNearViewport) {
          clearResourceReleaseTimer();
          hasPreparedForApproach = isCompactScene && !isIntersecting;
          renderer.prepareResources();
        } else {
          scheduleCompactResourceRelease();
        }
      },
      { root: null, rootMargin: resourcePrewarmMargin },
    );
    proximityObserver.observe(root);
    const handleVisibility = () => {
      if (!document.hidden && isIntersecting) renderer.prepareResources();
      renderer.setActive(!animationSuspendedRef.current && isIntersecting && !document.hidden);
    };
    const handleScroll = () => {
      const nextScrollY = window.scrollY;
      const isApproachingHero = nextScrollY < lastScrollY;
      lastScrollY = nextScrollY;
      if (!isCompactScene || !isNearViewport || isIntersecting) return;
      if (!isApproachingHero) {
        hasPreparedForApproach = false;
        scheduleCompactResourceRelease();
        return;
      }
      clearResourceReleaseTimer();
      if (hasPreparedForApproach) return;
      hasPreparedForApproach = true;
      renderer.prepareResources();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('scroll', handleScroll, { passive: true });

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncReducedMotion = () =>
      renderer.setReducedMotion(reducedMotionQuery.matches);
    reducedMotionQuery.addEventListener('change', syncReducedMotion);
    syncReducedMotion();

    const stateTimer = shouldPollRendererState
      ? window.setInterval(() => setRendererState(renderer.getState()), 250)
      : null;

    return () => {
      clearResourceReleaseTimer();
      if (stateTimer !== null) window.clearInterval(stateTimer);
      reducedMotionQuery.removeEventListener('change', syncReducedMotion);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('scroll', handleScroll);
      intersectionObserver.disconnect();
      proximityObserver.disconnect();
      resizeObserver.disconnect();
      renderer.setStateListener(null);
      renderer.dispose();
      replaceRetainedFrame(null);
      if (rendererRef.current === renderer) rendererRef.current = null;
    };
  }, [
    HERO_COMPACT_POST_FRAGMENT_SHADER,
    HERO_DISPERSION_POST_FRAGMENT_SHADER,
    replaceRetainedFrame,
    shouldPollRendererState,
  ]);

  useEffect(() => {
    rendererRef.current?.setSettings(interactiveSettings);
  }, [interactiveSettings]);

  useEffect(() => {
    if (sceneWidth === null) return;
    rendererRef.current?.setSources(rendererRowSources);
  }, [rendererRowSources, sceneWidth]);

  useEffect(() => {
    if (rendererState.renderer === 'pending') return;
    onState?.({
      galleryType: 'sphere',
      imageOrder,
      imageSignature,
      readyImageIds: rendererState.readyIds.slice(),
      renderer: rendererState.renderer,
      pan: {
        turns: rendererState.turns,
        x: interactivePan.x,
        y: interactivePan.y,
      },
      rowSignature,
      rows: settings.gallery.sphere.rows.length,
    });
  }, [
    imageOrder.join(','),
    imageSignature,
    onState,
    rendererState,
    rowSignature,
    interactivePan.x,
    interactivePan.y,
    settings.gallery.sphere,
  ]);

  return (
    <div
      aria-label="An infinite multi-row image panel moving through a fixed lens"
      className={referenceClasses("pointer-events-none absolute inset-0 overflow-hidden")}
      data-hero-gallery="sphere"
      data-hero-gallery-auto-scroll={`${rendererState.autoScrollOffset.x.toFixed(4)}:${rendererState.autoScrollOffset.y.toFixed(4)}`}
      data-hero-gallery-order={imageOrder.join(',')}
      data-hero-gallery-card-height={interactiveSettings.gallery.cardHeight}
      data-hero-gallery-card-radius={interactiveSettings.gallery.cardRadius}
      data-hero-gallery-edge-width={interactiveSettings.dispersion.edgeWidth}
      data-hero-gallery-effect={rendererState.effect}
      data-hero-gallery-passes="scene→field→post"
      data-hero-gallery-phase={(rendererState.phases[0] ?? 0).toFixed(4)}
      data-hero-gallery-ready={ready ? 'true' : 'false'}
      data-hero-gallery-renderer={rendererState.renderer}
      data-hero-gallery-pan={`${interactivePan.x.toFixed(4)}:${interactivePan.y.toFixed(4)}:${rendererState.turns}`}
      data-hero-gallery-row-signature={rowSignature}
      data-hero-gallery-rows={settings.gallery.sphere.rows.length}
      data-hero-gallery-signature={imageSignature}
      data-hero-gallery-type="sphere"
      ref={rootRef}
      role="img"
    >
      {flatSources.map((source) =>
        source.url.startsWith('/') ? (
          <link
            as="image"
            href={source.textureUrl ?? source.url}
            key={`hero-gallery-preload:${source.key}`}
            rel="preload"
            media={`(min-width: ${HERO_DESKTOP_MIN_WIDTH_PX}px)`}
          />
        ) : null,
      )}
      <canvas
        aria-hidden="true"
        className={referenceClasses("pointer-events-none absolute inset-0 h-full w-full touch-pan-y min-[80rem]:pointer-events-auto min-[80rem]:touch-none")}
        data-dispersion-ready={ready ? 'true' : 'false'}
        data-hero-gallery-canvas
        data-hero-gallery-drag-state={dragging ? 'dragging' : 'idle'}
        data-hero-gallery-revealed={revealed ? 'true' : 'false'}
        onLostPointerCapture={(event) => {
          const gesture = gestureRef.current;
          if (gesture?.pointerId === event.pointerId) finishGesture(gesture);
        }}
        onPointerCancel={(event) => {
          const gesture = gestureRef.current;
          if (gesture?.pointerId !== event.pointerId) return;
          event.preventDefault();
          event.stopPropagation();
          finishGesture(gesture);
        }}
        onPointerDown={(event) => {
          const activeGesture = gestureRef.current;
          if (activeGesture) {
            if (activeGesture.pointerId !== event.pointerId) finishGesture(activeGesture);
            return;
          }
          if (!isUnmodifiedPrimaryPointer(event)) return;

          event.preventDefault();
          event.stopPropagation();
          window.cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = 0;
          historyGroupRef.current = `hero-native-pan:${crypto.randomUUID()}`;
          const element = event.currentTarget;
          const bounds = element.getBoundingClientRect();
          const scale = bounds.width / Math.max(1, element.offsetWidth);
          const gesture: HeroGalleryPanGesture = {
            element,
            lastClient: { x: event.clientX, y: event.clientY },
            movedBeyondClickSlop: false,
            panelPeriod: getHeroGalleryPanelPeriod({
              cardHeight: interactiveSettings.gallery.cardHeight,
              rowCount: interactiveSettings.gallery.sphere.rows.length,
              rowGap: interactiveSettings.gallery.sphere.rowGap,
            }),
            pointerId: event.pointerId,
            scale: Math.max(0.0001, scale),
            sphereWidth: interactiveSettings.gallery.sphere.width,
            startClient: { x: event.clientX, y: event.clientY },
            startPan: interactivePan,
            viewportBounds: {
              height: bounds.height,
              left: bounds.left,
              top: bounds.top,
              width: bounds.width,
            },
          };
          gestureRef.current = gesture;
          setDragging(true);
          element.setPointerCapture?.(event.pointerId);
        }}
        onPointerMove={(event) => {
          const gesture = gestureRef.current;
          if (gesture?.pointerId !== event.pointerId) return;

          event.preventDefault();
          event.stopPropagation();
          updateHeroGalleryGestureClient(gesture, { x: event.clientX, y: event.clientY });
          if (animationFrameRef.current !== 0) return;
          animationFrameRef.current = window.requestAnimationFrame(() => {
            animationFrameRef.current = 0;
            if (gestureRef.current === gesture) applyGesture(gesture);
          });
        }}
        onPointerUp={(event) => {
          const gesture = gestureRef.current;
          if (gesture?.pointerId !== event.pointerId) return;
          event.preventDefault();
          event.stopPropagation();
          updateHeroGalleryGestureClient(gesture, { x: event.clientX, y: event.clientY });
          if (gesture.movedBeyondClickSlop) {
            finishGesture(gesture);
          } else {
            window.cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = 0;
            applyClickGesture(gesture);
            releaseGesture(gesture);
          }
        }}
        ref={canvasRef}
        style={{
          opacity: revealed ? 1 : 0,
          transition: getHeroSphereGalleryRevealTransition(prefersReducedMotion),
        }}
      />
      {retainedFrameUrl ? (
        // Runtime canvas snapshots are object URLs and cannot use the Next image optimizer.
        <img
          alt=""
          aria-hidden="true"
          className={referenceClasses("pointer-events-none absolute inset-0 size-full")}
          data-hero-gallery-retained-frame
          src={retainedFrameUrl}
        />
      ) : null}
      {showFallback ? (
        <picture
          aria-hidden="true"
          className={referenceClasses("absolute inset-0 block overflow-hidden")}
          data-hero-gallery-fallback
        >
          <source
            media={`(min-width: ${HERO_DESKTOP_MIN_WIDTH_PX}px)`}
            srcSet={heroGalleryDesktopPoster}
          />
          <img
            alt=""
            className={referenceClasses("absolute inset-0 size-full object-cover")}
            src={heroGalleryMobilePoster}
          />
        </picture>
      ) : null}
    </div>
  );
}
