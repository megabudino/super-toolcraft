import * as React from "react";

import { shouldIncludeToolcraftPreviewBackground } from "@/toolcraft/runtime";
import {
  useToolcraft,
  useToolcraftPipeline,
  useToolcraftProductSceneFrame,
} from "@/toolcraft/runtime/react";

import { registerDispersionCarouselExportProvider } from "./dispersion-carousel-export";
import {
  bindCarouselMouseDrag,
  easeOutCubic,
  getCarouselArrowTarget,
  getWrappedScrollDelta,
  normalizeCarouselScroll,
  readWheelDelta,
  snapCarouselScroll,
} from "./dispersion-carousel-navigation";
import { dispersionCarouselPipelinePasses } from "./dispersion-carousel-pipeline";
import styles from "./dispersion-carousel-renderer.module.css";
import { loadDispersionCarouselStripTextures } from "./dispersion-carousel-textures";
import {
  DISPERSION_CAROUSEL_CARDS,
  DISPERSION_CAROUSEL_CARD_PITCH,
  DISPERSION_CAROUSEL_CYCLE_WIDTH,
  DISPERSION_CAROUSEL_DEFAULT_SCROLL,
  DISPERSION_CAROUSEL_GEOMETRY,
  DISPERSION_CAROUSEL_LOOP_TRACK_WIDTH,
  DISPERSION_CAROUSEL_TITLE,
  type DispersionCarouselSettings,
  readDispersionCarouselSettings,
} from "./dispersion-carousel-values";
import {
  createDispersionRailRenderer,
  type DispersionRailRenderer,
} from "./dispersion-carousel-webgl";

const CAROUSEL_SCROLL_TARGET = "carousel.scroll";
const VELOCITY_SMOOTHING = 0.2;
const VELOCITY_REST_THRESHOLD = 0.05;
const VELOCITY_GAIN = 1.6;
const VELOCITY_LIMIT = 140;
const SCROLL_SETTLE_MS = 480;
const ARROW_SCROLL_MS = 420;
const CAROUSEL_LOOP_COPIES = [0, 1, 2] as const;
const LOOPED_CAROUSEL_CARDS = CAROUSEL_LOOP_COPIES.flatMap((cycle) =>
  DISPERSION_CAROUSEL_CARDS.map((card) => ({ card, cycle })),
);

function getRenderScale(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(2, Math.max(1, number)) : 2;
}

function getPersistedScroll(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number)
    ? normalizeCarouselScroll(number)
    : DISPERSION_CAROUSEL_DEFAULT_SCROLL;
}

function publishCarouselScroll(options: {
  cleanTextTrack: HTMLElement | null;
  logical: number;
  physical: number;
  railScrollLeftRef: { current: number };
  scrollLeftRef: { current: number };
  surface: HTMLElement | null;
}): void {
  options.scrollLeftRef.current = options.logical;
  options.railScrollLeftRef.current = options.physical;
  if (options.surface) {
    options.surface.dataset.scrollLeft = options.logical.toFixed(3);
  }
  if (options.cleanTextTrack) {
    options.cleanTextTrack.style.transform = `translate3d(${-options.physical}px, 0, 0)`;
  }
}

export function DispersionCarouselRenderer(): React.JSX.Element {
  const { dispatch, state } = useToolcraft();
  const pipeline = useToolcraftPipeline();
  const productSceneFrame = useToolcraftProductSceneFrame();
  const settings = readDispersionCarouselSettings(state);
  const settingsSignature = JSON.stringify(settings);
  const [appliedSettings, setAppliedSettings] =
    React.useState<DispersionCarouselSettings>(settings);
  const [railRenderer, setRailRenderer] =
    React.useState<DispersionRailRenderer | null>(null);
  const railRendererRef = React.useRef(railRenderer);
  const surfaceRef = React.useRef<HTMLDivElement | null>(null);
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  const cleanTextTrackRef = React.useRef<HTMLDivElement | null>(null);
  const railMountRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const scrollLeftRef = React.useRef(
    getPersistedScroll(state.values[CAROUSEL_SCROLL_TARGET]),
  );
  const railScrollLeftRef = React.useRef(
    DISPERSION_CAROUSEL_CYCLE_WIDTH + scrollLeftRef.current,
  );
  const persistTimerRef = React.useRef<number | null>(null);
  const scrollOwnerRef = React.useRef<"native" | "mouse" | "programmatic">("native");
  const applyOwnedScrollRef = React.useRef<(logical: number) => void>(
    () => undefined,
  );
  const scheduleSettleRef = React.useRef<() => void>(() => undefined);
  const arrowTweenRef = React.useRef<{
    frame: number | null;
    from: number;
    start: number;
    to: number;
  } | null>(null);
  const initializedScrollRef = React.useRef(false);
  const appliedSettingsRef = React.useRef(appliedSettings);
  const animationRef = React.useRef<{
    frame: number | null;
    lastScroll: number;
    velocity: number;
  }>({ frame: null, lastScroll: scrollLeftRef.current, velocity: 0 });
  appliedSettingsRef.current = appliedSettings;

  React.useLayoutEffect(() => {
    railRendererRef.current = railRenderer;
  }, [railRenderer]);

  // Renderer readiness must not rebind navigation and cancel an active drag.
  const runAnimationLoop = React.useCallback((): void => {
    const animation = animationRef.current;
    if (animation.frame !== null) return;
    const step = (): void => {
      animation.frame = null;
      const renderer = railRendererRef.current;
      if (!renderer) return;
      const scroll = scrollLeftRef.current;
      const instantaneous = getWrappedScrollDelta(
        scroll,
        animation.lastScroll,
      );
      animation.lastScroll = scroll;
      animation.velocity +=
        (instantaneous - animation.velocity) * (VELOCITY_SMOOTHING * 2);
      const boost = appliedSettingsRef.current.velocity;
      const velocityPx = Math.max(
        -VELOCITY_LIMIT,
        Math.min(
          VELOCITY_LIMIT,
          animation.velocity * boost * VELOCITY_GAIN,
        ),
      );
      if (pipeline) {
        void pipeline.runPass(
          dispersionCarouselPipelinePasses.preview,
          undefined,
          () => renderer.render(scroll, velocityPx),
        );
      } else {
        renderer.render(scroll, velocityPx);
      }
      if (
        Math.abs(animation.velocity) > VELOCITY_REST_THRESHOLD ||
        instantaneous !== 0
      ) {
        animation.frame = window.requestAnimationFrame(step);
      }
    };
    animation.frame = window.requestAnimationFrame(step);
  }, [pipeline]);

  React.useEffect(() => {
    let active = true;
    const apply = () => {
      if (active) setAppliedSettings(settings);
    };
    const result = pipeline
      ? pipeline.runPass(
          dispersionCarouselPipelinePasses.preview,
          undefined,
          apply,
        )
      : apply();
    void Promise.resolve(result);
    return () => {
      active = false;
    };
  }, [pipeline, settingsSignature]);

  const publishScroll = React.useCallback(
    (logical: number, physical: number): void => {
      publishCarouselScroll({
        cleanTextTrack: cleanTextTrackRef.current,
        logical,
        physical,
        railScrollLeftRef,
        scrollLeftRef,
        surface: surfaceRef.current,
      });
    },
    [],
  );

  React.useLayoutEffect(() => {
    const node = scrollerRef.current;
    if (!node || initializedScrollRef.current) return;
    initializedScrollRef.current = true;
    const persisted = getPersistedScroll(
      state.values[CAROUSEL_SCROLL_TARGET],
    );
    const physicalScroll = DISPERSION_CAROUSEL_CYCLE_WIDTH + persisted;
    node.scrollLeft = physicalScroll;
    animationRef.current.lastScroll = persisted;
    publishScroll(persisted, physicalScroll);
  }, [publishScroll, state.values]);

  React.useLayoutEffect(() => {
    const track = cleanTextTrackRef.current;
    if (!track) return;
    track.style.transform = `translate3d(${-railScrollLeftRef.current}px, 0, 0)`;
  }, [appliedSettings.includeText]);

  React.useEffect(() => {
    const node = scrollerRef.current;
    if (!node) return;
    let persistedLogical = scrollLeftRef.current;
    let lastNativeScroll = node.scrollLeft;

    const persistScroll = (): void => {
      const next =
        Math.round(normalizeCarouselScroll(scrollLeftRef.current) * 1000) /
        1000;
      if (next === persistedLogical) return;
      persistedLogical = next;
      dispatch({
        history: "skip",
        label: "Store carousel position",
        target: CAROUSEL_SCROLL_TARGET,
        type: "controls.setValue",
        value: next,
      });
    };

    const applyOwnedScroll = (logical: number): void => {
      const nextLogical = normalizeCarouselScroll(logical);
      const physicalScroll = DISPERSION_CAROUSEL_CYCLE_WIDTH + nextLogical;
      publishScroll(nextLogical, physicalScroll);
      node.scrollLeft = physicalScroll;
      // Native scroll events arrive asynchronously and may round subpixels.
      // Remember the actual assigned offset so their echo never owns motion.
      lastNativeScroll = node.scrollLeft;
      runAnimationLoop();
    };
    applyOwnedScrollRef.current = applyOwnedScroll;

    const settleScroll = (): void => {
      applyOwnedScroll(snapCarouselScroll(scrollLeftRef.current));
      persistScroll();
    };

    const scheduleSettle = (): void => {
      if (mouseDrag.isDragging()) return;
      if (persistTimerRef.current !== null) {
        window.clearTimeout(persistTimerRef.current);
      }
      persistTimerRef.current = window.setTimeout(() => {
        persistTimerRef.current = null;
        settleScroll();
      }, SCROLL_SETTLE_MS);
    };
    scheduleSettleRef.current = scheduleSettle;

    const cancelArrowTween = (): void => {
      const tween = arrowTweenRef.current;
      if (tween?.frame !== null && tween) {
        window.cancelAnimationFrame(tween.frame);
      }
      arrowTweenRef.current = null;
    };

    const mouseDrag = bindCarouselMouseDrag(node, {
      onStart() {
        scrollOwnerRef.current = "mouse";
        cancelArrowTween();
        if (persistTimerRef.current !== null) {
          window.clearTimeout(persistTimerRef.current);
          persistTimerRef.current = null;
        }
      },
      onDelta: (delta) => applyOwnedScroll(scrollLeftRef.current + delta),
      onEnd() {
        scrollOwnerRef.current = "programmatic";
        persistScroll();
      },
    });

    const handleWheel = (event: WheelEvent): void => {
      const delta = readWheelDelta(event, node.clientWidth);
      event.stopPropagation();
      if (delta === 0) return;
      event.preventDefault();
      if (mouseDrag.isDragging()) return;
      scrollOwnerRef.current = "native";
      cancelArrowTween();
      const nextLogical = normalizeCarouselScroll(
        scrollLeftRef.current + delta,
      );
      publishScroll(
        nextLogical,
        DISPERSION_CAROUSEL_CYCLE_WIDTH + nextLogical,
      );
      runAnimationLoop();
      scheduleSettle();
    };

    const handleScroll = (): void => {
      const physicalScroll = node.scrollLeft;
      if (physicalScroll === lastNativeScroll) return;
      lastNativeScroll = physicalScroll;
      // A late native adjustment is not a new user gesture. Retain ownership
      // after mouse release so it cannot restart the wheel/touch idle snap.
      if (scrollOwnerRef.current !== "native") return;
      const logicalScroll = normalizeCarouselScroll(
        physicalScroll - DISPERSION_CAROUSEL_CYCLE_WIDTH,
      );
      publishScroll(logicalScroll, physicalScroll);
      runAnimationLoop();
      scheduleSettle();
    };

    node.addEventListener("wheel", handleWheel, {
      capture: true,
      passive: false,
    });
    node.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      mouseDrag.dispose();
      if (scrollOwnerRef.current === "mouse") scrollOwnerRef.current = "programmatic";
      node.removeEventListener("wheel", handleWheel, true);
      node.removeEventListener("scroll", handleScroll);
      if (persistTimerRef.current !== null) {
        window.clearTimeout(persistTimerRef.current);
      }
    };
  }, [dispatch, publishScroll, runAnimationLoop]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let renderer: DispersionRailRenderer | null = null;
    loadDispersionCarouselStripTextures()
      .then((textures) => {
        if (disposed) return;
        renderer = createDispersionRailRenderer(canvas, textures, {
          padY: DISPERSION_CAROUSEL_GEOMETRY.effectPadding,
          stripHeight: DISPERSION_CAROUSEL_GEOMETRY.cardHeight,
          stripWidth: DISPERSION_CAROUSEL_CYCLE_WIDTH,
        });
        canvas.dataset.dispersionCarouselCanvas = "true";
        canvas.dataset.toolcraftProductCanvas = "true";
        setRailRenderer(renderer);
      })
      .catch(() => {
        // The rail keeps its clean DOM fallback when WebGL or the strip fails.
      });
    return () => {
      disposed = true;
      renderer?.dispose();
      setRailRenderer((current) => (current === renderer ? null : current));
    };
  }, []);

  const renderScale = getRenderScale(state.values["canvas.renderScale"]);
  const canvasZoom = Math.max(1, state.canvas.zoom) / 100;

  React.useEffect(() => {
    const mount = railMountRef.current;
    if (!mount || !railRenderer) return;
    const devicePixelRatio =
      typeof window === "undefined"
        ? 1
        : Math.max(1, window.devicePixelRatio || 1);
    const applySize = (): void => {
      const logicalWidth = Math.max(1, mount.clientWidth);
      const logicalHeight = Math.max(1, mount.clientHeight);
      railRenderer.setSize(
        logicalWidth,
        logicalHeight,
        devicePixelRatio * renderScale * canvasZoom,
      );
    };
    applySize();
    const resizeObserver = new ResizeObserver(applySize);
    resizeObserver.observe(mount);
    return () => resizeObserver.disconnect();
  }, [canvasZoom, railRenderer, renderScale]);

  React.useEffect(() => {
    if (!railRenderer) return;
    railRenderer.setUniforms({
      amount: Math.max(0, appliedSettings.amount),
      aura: Math.max(0, Math.min(1, appliedSettings.aura)),
      blur: Math.max(0, appliedSettings.blur),
      curve: Math.max(0.2, appliedSettings.curve),
      edgeWidth: Math.max(0, Math.min(50, appliedSettings.edgeWidth)) / 100,
      fade: Math.max(0, Math.min(1, appliedSettings.edgeFade)),
      gateGlow: Math.max(0, Math.min(1, appliedSettings.gateGlow)),
      gateOffset: Math.max(0, Math.min(50, appliedSettings.gateOffset)) / 100,
      gateRefraction: Math.max(0, appliedSettings.gateRefraction),
      gateWidth: Math.max(1, appliedSettings.gateWidth),
      hue: appliedSettings.hue,
      includeText: appliedSettings.includeText,
      samples: appliedSettings.count,
      spectrum: Math.max(0, Math.min(1, appliedSettings.spectrum)),
      turbulence: Math.max(0, Math.min(1, appliedSettings.turbulence)),
      turbulenceScale: Math.max(8, appliedSettings.turbulenceScale),
      warp: Math.max(0, appliedSettings.warp),
      warpFace: Math.max(4, appliedSettings.warpFace),
      warpOffset: Math.max(0, Math.min(40, appliedSettings.warpOffset)) / 100,
      warpSharpness: Math.max(0.35, appliedSettings.warpSharpness),
      warpStyle: appliedSettings.warpStyle,
      warpWave: appliedSettings.warpWaveEnabled
        ? Math.max(0, appliedSettings.warpWave)
        : 0,
      warpWaveBlur: appliedSettings.warpWaveEnabled
        ? Math.max(0, appliedSettings.warpWaveBlur)
        : 0,
      warpWaveKind: appliedSettings.warpWaveKind,
      warpWaveLength: Math.max(8, appliedSettings.warpWaveLength),
    });
    runAnimationLoop();
  }, [railRenderer, appliedSettings, runAnimationLoop]);

  React.useEffect(() => {
    if (!railRenderer) return;
    const unregister = registerDispersionCarouselExportProvider({
      getScrollLeft: () => scrollLeftRef.current,
      snapshot: (pixelRatio: number) => {
        if (railRenderer.isContextLost()) {
          throw new Error("The dispersion rail WebGL context is lost.");
        }
        return railRenderer.snapshot(scrollLeftRef.current, pixelRatio);
      },
    });
    return unregister;
  }, [railRenderer]);

  React.useEffect(() => {
    const animation = animationRef.current;
    return () => {
      if (animation.frame !== null) {
        window.cancelAnimationFrame(animation.frame);
        animation.frame = null;
      }
      const tween = arrowTweenRef.current;
      if (tween?.frame !== null && tween) {
        window.cancelAnimationFrame(tween.frame);
      }
      arrowTweenRef.current = null;
    };
  }, []);

  const scrollByOffset = React.useCallback((offset: number): void => {
    scrollOwnerRef.current = "programmatic";
    const now = performance.now();
    const existing = arrowTweenRef.current;
    let unwrapped = scrollLeftRef.current;
    if (existing) {
      const progress = Math.min(
        1,
        Math.max(0, (now - existing.start) / ARROW_SCROLL_MS),
      );
      unwrapped =
        existing.from +
        (existing.to - existing.from) * easeOutCubic(progress);
      if (existing.frame !== null) {
        window.cancelAnimationFrame(existing.frame);
      }
    }
    if (persistTimerRef.current !== null) {
      window.clearTimeout(persistTimerRef.current);
      persistTimerRef.current = null;
    }
    const tween = {
      frame: null as number | null,
      from: unwrapped,
      start: now,
      to: getCarouselArrowTarget(existing ? existing.to : unwrapped, offset > 0 ? 1 : -1),
    };
    arrowTweenRef.current = tween;
    const step = (time: number): void => {
      if (arrowTweenRef.current !== tween) return;
      const progress = Math.min(
        1,
        Math.max(0, (time - tween.start) / ARROW_SCROLL_MS),
      );
      const logical = normalizeCarouselScroll(
        tween.from + (tween.to - tween.from) * easeOutCubic(progress),
      );
      publishScroll(
        logical,
        DISPERSION_CAROUSEL_CYCLE_WIDTH + logical,
      );
      runAnimationLoop();
      if (progress < 1) {
        tween.frame = window.requestAnimationFrame(step);
        return;
      }
      applyOwnedScrollRef.current(logical);
      arrowTweenRef.current = null;
      scheduleSettleRef.current();
    };
    tween.frame = window.requestAnimationFrame(step);
  }, [publishScroll, runAnimationLoop]);
  const scrollPrev = React.useCallback(
    () => scrollByOffset(-DISPERSION_CAROUSEL_CARD_PITCH),
    [scrollByOffset],
  );
  const scrollNext = React.useCallback(
    () => scrollByOffset(DISPERSION_CAROUSEL_CARD_PITCH),
    [scrollByOffset],
  );
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>): void => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        scrollNext();
      }
    },
    [scrollNext, scrollPrev],
  );

  const sceneRect = productSceneFrame.rect;
  const width = sceneRect?.width ?? DISPERSION_CAROUSEL_GEOMETRY.canvasWidth;
  const height = sceneRect?.height ?? DISPERSION_CAROUSEL_GEOMETRY.canvasHeight;
  const previewBackground = shouldIncludeToolcraftPreviewBackground({ state });

  return (
    <div
      aria-label="Figma customer-story carousel with screen-space edge dispersion"
      className={styles.surface}
      data-dispersion-carousel="true"
      ref={surfaceRef}
      data-carousel-loop="seamless"
      data-aura-gate={appliedSettings.gateGlow.toFixed(2)}
      data-aura-gate-offset={appliedSettings.gateOffset.toFixed(2)}
      data-dispersion-amount={appliedSettings.amount.toFixed(2)}
      data-dispersion-aura={appliedSettings.aura.toFixed(2)}
      data-edge-blur={appliedSettings.blur.toFixed(2)}
      data-edge-turbulence={appliedSettings.turbulence.toFixed(2)}
      data-edge-warp={appliedSettings.warp.toFixed(2)}
      data-edge-warp-offset={appliedSettings.warpOffset.toFixed(2)}
      data-edge-warp-style={appliedSettings.warpStyle}
      data-edge-warp-wave={
        appliedSettings.warpWaveEnabled
          ? appliedSettings.warpWave.toFixed(2)
          : "0.00"
      }
      data-edge-warp-wave-enabled={
        appliedSettings.warpWaveEnabled ? "on" : "off"
      }
      data-edge-warp-wave-kind={appliedSettings.warpWaveKind}
      data-edge-width={appliedSettings.edgeWidth.toFixed(2)}
      data-rail-renderer={railRenderer ? "webgl" : "loading"}
      data-scroll-left={scrollLeftRef.current.toFixed(3)}
      data-text-effect={appliedSettings.includeText ? "shader" : "clean"}
      data-toolcraft-product-output="true"
      style={{
        backgroundColor: previewBackground
          ? appliedSettings.background
          : "transparent",
        height,
        width,
      }}
    >
      <header className={styles.header} data-carousel-header="true">
        <h1 className={styles.title} data-toolcraft-product-text="true">
          {DISPERSION_CAROUSEL_TITLE}
        </h1>
        <div
          className={styles.navigation}
          data-carousel-navigation="true"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <button
            aria-label="Previous slide"
            className={styles.navigationButton}
            onClick={scrollPrev}
            type="button"
          >
            <span className={`${styles.chevron} ${styles.chevronPrevious}`} />
          </button>
          <button
            aria-label="Next slide"
            className={styles.navigationButton}
            onClick={scrollNext}
            type="button"
          >
            <span className={styles.chevron} />
          </button>
        </div>
      </header>

      <div
        aria-label="Customer stories"
        aria-roledescription="carousel"
        className={styles.railViewport}
        data-carousel-base="true"
        data-rail-visual={railRenderer ? "hidden" : "fallback"}
        onKeyDownCapture={handleKeyDown}
        onPointerDown={(event) => {
          if (event.pointerType !== "mouse") scrollOwnerRef.current = "native";
          event.stopPropagation();
        }}
        onWheelCapture={(event) => {
          if (scrollOwnerRef.current === "mouse") event.preventDefault();
          else scrollOwnerRef.current = "native";
          event.stopPropagation();
        }}
        ref={scrollerRef}
        role="region"
        tabIndex={0}
      >
        <div
          className={styles.railTrack}
          style={{ width: DISPERSION_CAROUSEL_LOOP_TRACK_WIDTH }}
        >
          {LOOPED_CAROUSEL_CARDS.map(({ card, cycle }) => (
            <article
              aria-hidden={cycle === 1 ? undefined : true}
              className={styles.card}
              data-carousel-card={cycle === 1 ? card.id : undefined}
              data-carousel-loop-copy={cycle}
              key={`${String(cycle)}-${card.id}`}
            >
              <img
                alt={cycle === 1 ? card.alt : ""}
                className={styles.cardImage}
                draggable={false}
                src={card.src}
              />
              <p
                className={styles.testimonial}
                data-card-testimonial={cycle === 1 ? "true" : undefined}
                data-toolcraft-product-text="true"
              >
                {card.testimonial}
              </p>
            </article>
          ))}
        </div>
      </div>

      <div
        aria-hidden="true"
        className={styles.dispersionRail}
        data-dispersion-rail="true"
        ref={railMountRef}
      >
        <canvas className={styles.dispersionRailCanvas} ref={canvasRef} />
      </div>

      {railRenderer && !appliedSettings.includeText ? (
        <div
          aria-hidden="true"
          className={styles.cleanTextViewport}
          data-clean-text-overlay="true"
        >
          <div
            className={styles.cleanTextTrack}
            ref={cleanTextTrackRef}
            style={{
              transform: `translate3d(${-railScrollLeftRef.current}px, 0, 0)`,
              width: DISPERSION_CAROUSEL_LOOP_TRACK_WIDTH,
            }}
          >
            {LOOPED_CAROUSEL_CARDS.map(({ card, cycle }) => (
              <div
                className={styles.cleanTextCard}
                key={`${String(cycle)}-${card.id}`}
              >
                <p className={styles.testimonial}>{card.testimonial}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
