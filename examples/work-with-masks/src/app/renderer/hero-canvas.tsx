import * as React from "react";

import { getToolcraftTimelineLoopProgress } from "@/toolcraft/runtime";
import {
  useToolcraftPipeline,
  useToolcraftProductSceneFrame,
  useToolcraftSelector,
  useToolcraftViewportInteractionActive,
} from "@/toolcraft/runtime/react";

import { heroEnvironmentKey, heroStructureKey, readHeroParams } from "../domain/hero-params";
import { evaluateHeroFlow, readHeroFlow } from "../domain/flow";
import { readWavePlacement } from "../domain/wave-placement";
import styles from "./hero-canvas.module.css";
import { HeroMaskHandles } from "./hero-mask-handles";
import { HeroRenderer } from "./hero-renderer";
import {
  heroEnvironmentPass,
  heroGeometryPass,
  heroResourcesPass,
  heroShadePass,
  heroShadowPass,
} from "./hero-pipeline";
import { getWaveFrame } from "./wave-frame";
import { getHeroPreviewFrame, getHeroVisibleWindow } from "./hero-preview-frame";

const RENDERER_VERSION = "vault-3d-viewport-v6";

function valueEqual<T>(previous: T, next: T): boolean {
  return JSON.stringify(previous) === JSON.stringify(next);
}

function HeroCanvasBinding({ canvas, gpuCanvas, frameElement }: Readonly<{
  canvas: HTMLCanvasElement; gpuCanvas: HTMLCanvasElement; frameElement: HTMLDivElement;
}>) {
  const sceneFrame = useToolcraftProductSceneFrame();
  const zoom = useToolcraftSelector(state => state.canvas.zoom);
  const offset = useToolcraftSelector(state => state.canvas.offset, valueEqual);
  const placement = useToolcraftSelector(state => readWavePlacement(state.values), valueEqual);
  const rendererPipeline = useToolcraftPipeline();
  const baseParams = useToolcraftSelector(
    (state) => readHeroParams(state, { preview: true }),
    valueEqual,
  );
  const flow = useToolcraftSelector(readHeroFlow, valueEqual);
  const progress = useToolcraftSelector((state) =>
    getToolcraftTimelineLoopProgress(state.timeline),
  );
  const viewportInteractionActive = useToolcraftViewportInteractionActive();
  const settledProgress = React.useRef(progress);
  if (!viewportInteractionActive) settledProgress.current = progress;
  const effectiveProgress = viewportInteractionActive ? settledProgress.current : progress;
  const params = React.useMemo(
    () => evaluateHeroFlow(baseParams, flow, effectiveProgress),
    [baseParams, effectiveProgress, flow],
  );
  const renderScale = useToolcraftSelector((state) => {
    const value = state.values["canvas.renderScale"];
    return typeof value === "number" && Number.isFinite(value)
      ? value
      : state.schema.canvas.renderScale.defaultValue;
  });
  const latestRender = React.useRef({
    effectiveProgress,
    params,
    renderScale,
    sceneFrame,
    zoom,
    placement,
    offset,
    viewportInteractionActive,
  });
  latestRender.current = { effectiveProgress, params, renderScale, sceneFrame, zoom, placement, offset, viewportInteractionActive };
  const scheduleRender = React.useRef<() => void>(() => undefined);

  React.useEffect(() => {
    if (!rendererPipeline) return;
    const presentation = canvas.getContext("2d");
    if (!presentation) throw new Error("The wave preview requires Canvas 2D presentation.");
    let active = true;
    let pending = false;
    let rendering = false;
    let requestId: number | undefined;
    let preparedParams: typeof params | undefined;

    const renderLatest = async () => {
      if (!active || rendering) return;
      const snapshot = latestRender.current;
      if (snapshot.sceneFrame.kind !== "ready") return;
      // During a gesture the host transforms the last completed image with the
      // site. Rebuild backing once the gesture settles, not for every wheel tick.
      if (snapshot.viewportInteractionActive) {
        pending = false;
        return;
      }
      const bounds = frameElement.getBoundingClientRect();
      if (bounds.right < -96 || bounds.bottom < -96 || bounds.left > window.innerWidth + 96 || bounds.top > window.innerHeight + 96) {
        pending = false;
        canvas.style.visibility = "hidden";
        return;
      }
      rendering = true;
      pending = false;
      const devicePixelRatio = window.devicePixelRatio || 1;
      const frame = getHeroPreviewFrame({
        width: snapshot.placement.width,
        height: snapshot.placement.height,
        zoom: snapshot.zoom,
        devicePixelRatio,
        renderScale: snapshot.renderScale,
        visibleWindow: getHeroVisibleWindow({ left: bounds.left, top: bounds.top,
          zoom: snapshot.zoom, viewportWidth: window.innerWidth, viewportHeight: window.innerHeight }),
      });
      const { width, height } = frame;

      try {
        const renderer = await rendererPipeline.runPass(
          heroResourcesPass,
          {
            "preview-canvas": gpuCanvas,
            "renderer-version": RENDERER_VERSION,
          },
          (context) =>
            context.getOrCreateResource(
              [gpuCanvas, RENDERER_VERSION],
              () => new HeroRenderer(gpuCanvas, { preserveDrawingBuffer: true }),
              (renderer) => renderer.dispose(),
            ),
        );
        if (!active) return;
        renderer.setSize(width, height);
        const sceneChanged = preparedParams !== snapshot.params;
        if (sceneChanged) {
          await rendererPipeline.runPass(
            heroGeometryPass,
            { renderer, "structure-key": heroStructureKey(snapshot.params) },
            () => renderer.prepareGeometry(snapshot.params),
          );
          await rendererPipeline.runPass(
            heroEnvironmentPass,
            { renderer, "environment-key": heroEnvironmentKey(snapshot.params) },
            () => renderer.prepareEnvironment(snapshot.params),
          );
          await rendererPipeline.runPass(heroShadowPass, undefined, () => {
            renderer.prepareFrame(snapshot.params, frame);
          });
        }
        await rendererPipeline.runPass(heroShadePass, undefined, async () => {
          // A viewport-only resize updates pixel uniforms, not authored scene state.
          if (!sceneChanged) renderer.prepareFrame(snapshot.params, frame);
          renderer.renderPrepared(snapshot.params);
          await renderer.waitForFrame();
          const latest = latestRender.current;
          if (!active || latest.zoom !== snapshot.zoom || latest.offset.x !== snapshot.offset.x ||
            latest.offset.y !== snapshot.offset.y || latest.placement !== snapshot.placement ||
            latest.renderScale !== snapshot.renderScale || latest.sceneFrame !== snapshot.sceneFrame) return;
          // Keep displaying the previous completed image while the GPU is busy.
          // Never expose a resized surface before the matching crop is ready.
          if (canvas.width !== width) canvas.width = width;
          if (canvas.height !== height) canvas.height = height;
          presentation.clearRect(0, 0, width, height);
          presentation.drawImage(gpuCanvas, 0, 0);
          // Publish crop placement and its pixels in the same browser frame.
          Object.assign(canvas.style, { left: `${frame.css.left}px`, top: `${frame.css.top}px`,
            width: `${frame.css.width}px`, height: `${frame.css.height}px`, visibility: "visible" });
          canvas.dataset.heroTileX = String(frame.tileX);
          canvas.dataset.heroTileY = String(frame.tileY);
          canvas.dataset.heroFullWidth = String(frame.fullWidth);
          canvas.dataset.heroFullHeight = String(frame.fullHeight);
          canvas.dataset.heroFrameProgress = snapshot.effectiveProgress.toFixed(4);
          canvas.dataset.timelineProgress = snapshot.effectiveProgress.toFixed(4);
          canvas.dataset.heroRenderCount = String(Number(canvas.dataset.heroRenderCount ?? 0) + 1);
          canvas.dataset.heroBackingHeight = String(height);
          canvas.dataset.heroBackingWidth = String(width);
        });
        preparedParams = snapshot.params;
      } finally {
        rendering = false;
        // The GPU completion callback already yields to a browser frame.
        if (active && pending) void renderLatest();
      }
    };

    scheduleRender.current = () => {
      pending = true;
      if (!active || rendering || requestId !== undefined) return;
      requestId = window.requestAnimationFrame(() => {
        requestId = undefined;
        void renderLatest();
      });
    };
    scheduleRender.current();
    const resize = () => scheduleRender.current();
    const observer = new ResizeObserver(resize);
    observer.observe(frameElement);
    window.addEventListener("resize", resize);

    return () => {
      active = false;
      if (requestId !== undefined) window.cancelAnimationFrame(requestId);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      scheduleRender.current = () => undefined;
    };
  }, [canvas, gpuCanvas, frameElement, rendererPipeline]);

  React.useEffect(() => {
    scheduleRender.current();
  }, [effectiveProgress, params, placement.width, placement.height, placement.position.x, placement.position.y,
    renderScale, sceneFrame, zoom, offset.x, offset.y, viewportInteractionActive]);

  return (
    <span
      aria-hidden="true"
      className={styles.binding}
      data-hero-flow-marker="true"
      data-hero-viewport-active={viewportInteractionActive}
      data-timeline-progress={effectiveProgress.toFixed(4)}
    />
  );
}

export function HeroCanvas(): React.JSX.Element {
  const [canvas, setCanvas] = React.useState<HTMLCanvasElement | null>(null);
  const [gpuCanvas, setGpuCanvas] = React.useState<HTMLCanvasElement | null>(null);
  const [frameElement, setFrameElement] = React.useState<HTMLDivElement | null>(null);
  const sceneFrame = useToolcraftProductSceneFrame();
  const placement = useToolcraftSelector((state) => readWavePlacement(state.values), valueEqual);
  const waveFrame = sceneFrame.kind === "ready" ? getWaveFrame(sceneFrame.rect, placement) : null;
  const stageStyle =
    waveFrame && sceneFrame.kind === "ready"
      ? {
          height: waveFrame.height,
          left: waveFrame.x - sceneFrame.rect.x,
          top: waveFrame.y - sceneFrame.rect.y,
          width: waveFrame.width,
        }
      : {
          height: placement.height,
          left: 0,
          top: 0,
          width: placement.width,
        };

  return (
    <div
      className={styles.stage}
      data-wave-frame-height={placement.height}
      data-wave-frame-width={placement.width}
      data-wave-frame-x={placement.position.x}
      data-wave-frame-y={placement.position.y}
      ref={setFrameElement}
      style={stageStyle}
    >
      <canvas aria-hidden="true" className={styles.gpuSurface} data-hero-gpu-surface="" ref={setGpuCanvas} />
      <canvas
        key="completed-wave-presentation"
        aria-label="Ribbed glass hero preview"
        className={styles.canvas}
        data-toolcraft-product-output="hero"
        ref={setCanvas}
        role="img"
      />
      {canvas && gpuCanvas && frameElement ? <HeroCanvasBinding canvas={canvas} gpuCanvas={gpuCanvas} frameElement={frameElement} /> : null}
      {frameElement ? <HeroMaskHandles frameElement={frameElement} /> : null}
    </div>
  );
}
