import * as React from "react";

import {
  useToolcraft,
  useToolcraftModelOrbitInteraction,
  useToolcraftPipeline,
} from "@/toolcraft/runtime/react";

import { grassPipelinePasses } from "../app-renderer-pipeline";
import type { GrassRenderResult } from "../app-renderer-pipeline-types";
import { getGrassButterflyLayoutPassInputs } from "./grass-butterfly-pass-inputs";
import { grassScanLayerKinds, type GrassScanLayerKind } from "./grass-scan-contract";
import { getGrassScanLayoutKey } from "./grass-scan-layout";
import { GrassSceneRenderer } from "./grass-scene";
import {
  publishGrassLayerVisibility,
  publishGrassRenderDiagnostics,
  publishGrassSceneFrameDiagnostics,
} from "./grass-render-diagnostics";
import {
  getGrassCoveragePassInputs,
  getGrassGroundGeometryPassInputs,
  getGrassLayoutPassInputs,
  getLawnCoveragePassInputs,
} from "./grass-layout-pass-inputs";
import { useGrassSimulationInteractions } from "./use-grass-simulation-interactions";
import { useGrassAutonomousProgress } from "./use-grass-autonomous-clock";
import { useGrassButterflyHover } from "./use-grass-butterfly-hover";
import {
  getGrassLayoutKey,
  getGrassGroundGeometryKey,
  getGrassPreviewBackground,
  getGrassRenderKey,
  getLawnLayoutKey,
  readGrassSettings,
} from "./grass-values";
import styles from "./grass-output.module.css";

const scanPipelinePasses = {
  rocks: grassPipelinePasses.rockLayoutBuild,
  tufted: grassPipelinePasses.tuftedLayoutBuild,
  white: grassPipelinePasses.whiteLayoutBuild,
  wild: grassPipelinePasses.wildLayoutBuild,
  yellow: grassPipelinePasses.yellowLayoutBuild,
} as const;
const emptyScanLayoutKeys = Object.fromEntries(
  grassScanLayerKinds.map((kind) => [kind, ""]),
) as Record<GrassScanLayerKind, string>;

const BUTTERFLY_POST_INITIAL_FRAME_DELAY_MS = 5_000;
function yieldGrassRenderStage(delayMs = 16): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, delayMs));
}

export function GrassOutput(): React.JSX.Element {
  const { state } = useToolcraft();
  const pipeline = useToolcraftPipeline();
  const hostRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const settings = React.useMemo(() => readGrassSettings(state), [state]);
  const progress = useGrassAutonomousProgress();
  const includeBackground = getGrassPreviewBackground(state);
  const renderScaleValue = Number(state.values["canvas.renderScale"] ?? 1);
  const renderScale = Number.isFinite(renderScaleValue)
    ? Math.max(1, Math.min(2, renderScaleValue))
    : 1;
  const layoutKey = getGrassLayoutKey(settings);
  const groundGeometryKey = getGrassGroundGeometryKey(settings);
  const lawnLayoutKey = getLawnLayoutKey(settings);
  const butterflyLayoutKey = JSON.stringify(
    getGrassButterflyLayoutPassInputs(settings),
  );
  const scanLayoutSignature = grassScanLayerKinds
    .map((kind) => getGrassScanLayoutKey(kind, settings))
    .join(":");
  const renderKey = getGrassRenderKey(settings);
  const settingsRef = React.useRef(settings);
  const progressRef = React.useRef(progress);
  const includeBackgroundRef = React.useRef(includeBackground);
  const renderScaleRef = React.useRef(renderScale);
  const layoutKeyRef = React.useRef("");
  const groundGeometryKeyRef = React.useRef("");
  const lawnLayoutKeyRef = React.useRef("");
  const butterflyLayoutKeyRef = React.useRef("");
  const butterflyLayoutSignatureRef = React.useRef("");
  const butterflyResourcePromiseRef =
    React.useRef<Promise<string> | null>(null);
  const butterflyResourceFrameRef = React.useRef(0);
  const butterflyResourceTimerRef = React.useRef(0);
  const butterflyResourceSceneRef =
    React.useRef<GrassSceneRenderer | null>(null);
  const butterflyResourceSignatureRef = React.useRef("loading");
  const scanResourceReadyRef = React.useRef(false);
  const scanLayoutKeyRefs = React.useRef<Record<GrassScanLayerKind, string>>({
    ...emptyScanLayoutKeys,
  });
  const scanCountsRef = React.useRef<Record<GrassScanLayerKind, number>>({
    rocks: 0,
    tufted: 0,
    white: 0,
    wild: 0,
    yellow: 0,
  });
  const renderInFlightRef = React.useRef(false);
  const renderInFlightKeyRef = React.useRef("");
  const renderQueuedRef = React.useRef(false);
  const lastRenderedViewportRef = React.useRef({ height: 0, width: 0 });
  const renderCurrentFrameRef = React.useRef<
    ((force?: boolean) => Promise<void>) | null
  >(null);
  const nextPlaybackFrameAtRef = React.useRef(0);
  const lastNonTimelineKeyRef = React.useRef("");
  const [scene, setScene] = React.useState<GrassSceneRenderer | null>(null);
  const rendererId = React.useId();
  if (canvasRef.current === null && typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    canvas.ariaLabel = "Animated procedural grass field preview";
    canvas.className = styles.canvas;
    canvas.dataset.slot = "grass-webgl-canvas";
    canvas.dataset.grassLayerGround = "true";
    canvas.dataset.grassLayerButterflies = "true";
    canvas.dataset.grassLayerLawn = "true";
    canvas.dataset.grassLayerTall = "true";
    for (const kind of grassScanLayerKinds) {
      canvas.setAttribute(`data-grass-scan-layer-${kind}`, "true");
    }
    canvas.setAttribute("data-grass-scan-layer-boulder", "true");
    canvasRef.current = canvas;
  }
  settingsRef.current = settings;
  progressRef.current = progress;
  includeBackgroundRef.current = includeBackground;
  renderScaleRef.current = renderScale;

  const attachCanvas = React.useCallback(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas || canvas.parentElement === host) return;
    host.replaceChildren(canvas);
    host.style.backgroundImage = "none";
  }, []);

  React.useLayoutEffect(() => {
    attachCanvas();
  }, [attachCanvas]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let active = true;
    let localScene: GrassSceneRenderer | null = null;
    const resolveScene = async () => {
      await yieldGrassRenderStage();
      const resource = pipeline
        ? await pipeline.runPass(
            grassPipelinePasses.sceneResource,
            { rendererId },
            (context) =>
              context.getOrCreateResource(
                [rendererId],
                () => new GrassSceneRenderer(canvas),
                (retained) => retained.dispose(),
              ),
          )
        : new GrassSceneRenderer(canvas);
      if (!pipeline) localScene = resource as GrassSceneRenderer;
      if (active) {
        setScene(resource as GrassSceneRenderer);
      } else if (!pipeline) {
        resource.dispose();
      }
    };
    void resolveScene().catch((error: unknown) => {
      console.error("Grass WebGL scene could not be created.", error);
    });
    return () => {
      active = false;
      cancelAnimationFrame(butterflyResourceFrameRef.current);
      butterflyResourceFrameRef.current = 0;
      window.clearTimeout(butterflyResourceTimerRef.current);
      butterflyResourceTimerRef.current = 0;
      localScene?.dispose();
    };
  }, [pipeline, rendererId]);

  const renderCurrentFrame = React.useCallback(
    async (force = false) => {
      const host = hostRef.current;
      const canvas = canvasRef.current;
      if (!host || !canvas || !scene) return;
      const requestedFrameKey = `${groundGeometryKey}:${layoutKey}:${lawnLayoutKey}:${butterflyLayoutKey}:${scanLayoutSignature}:${renderKey}:${progressRef.current.toFixed(5)}:${includeBackgroundRef.current ? 1 : 0}:${renderScaleRef.current}`;
      if (renderInFlightRef.current) {
        if (
          force &&
          (canvas.dataset.grassFrameSignature ||
            requestedFrameKey !== renderInFlightKeyRef.current)
        ) {
          renderQueuedRef.current = true;
        }
        return;
      }
      const renderStartedAt = performance.now();
      if (
        !force &&
        renderStartedAt < nextPlaybackFrameAtRef.current
      ) {
        return;
      }
      renderInFlightRef.current = true;
      renderInFlightKeyRef.current = requestedFrameKey;
      try {
        const currentSettings = settingsRef.current;
        const rect = host.getBoundingClientRect();
        const width = Math.max(1, rect.width);
        const height = Math.max(1, rect.height);
        const prepareScans = () => scene.prepareScans();
        const scanResourcePromise = pipeline
          ? pipeline.runPass(
              grassPipelinePasses.scanResource,
              { "runtime.initialRender": true },
              prepareScans,
            )
          : prepareScans();
        const prepareEnvironment = () =>
          scene.prepareEnvironment(currentSettings);
        const environmentPromise = pipeline
          ? pipeline.runPass(
              grassPipelinePasses.environmentResource,
              {
                "environment.hdriFile":
                  currentSettings.environment.source.cacheKey,
                "environment.preset": currentSettings.environment.preset,
              },
              prepareEnvironment,
            )
          : prepareEnvironment();
        let tallBladeCount = scene.getTallBladeCount();
        let lawnBladeCount = scene.getLawnBladeCount();
        if (groundGeometryKeyRef.current !== groundGeometryKey) {
          await yieldGrassRenderStage();
          const executeGroundGeometry = () => scene.updateGround(currentSettings);
          if (pipeline) {
            await pipeline.runPass(
              grassPipelinePasses.groundGeometryBuild,
              getGrassGroundGeometryPassInputs(currentSettings),
              executeGroundGeometry,
            );
          } else {
            executeGroundGeometry();
          }
          groundGeometryKeyRef.current = groundGeometryKey;
        }
        if (layoutKeyRef.current !== layoutKey) {
          await yieldGrassRenderStage();
          const executeLayout = (): GrassRenderResult => {
            tallBladeCount = scene.updateTallLayout(currentSettings);
            return { bladeCount: tallBladeCount, signature: layoutKey };
          };
          if (pipeline) {
            await pipeline.runPass(
              grassPipelinePasses.layoutBuild,
              getGrassLayoutPassInputs(currentSettings),
              executeLayout,
            );
          } else {
            executeLayout();
          }
          layoutKeyRef.current = layoutKey;
        }
        if (lawnLayoutKeyRef.current !== lawnLayoutKey) {
          await yieldGrassRenderStage();
          const executeLawnLayout = (): GrassRenderResult => {
            lawnBladeCount = scene.updateLawnLayout(currentSettings);
            return { bladeCount: lawnBladeCount, signature: lawnLayoutKey };
          };
          if (pipeline) {
            await pipeline.runPass(
              grassPipelinePasses.lawnLayoutBuild,
              {
                ...getLawnCoveragePassInputs(currentSettings),
                "field.depth": currentSettings.field.depth,
                "field.edgeIrregularity":
                  currentSettings.field.edgeIrregularity,
                "field.shapeRoundness":
                  currentSettings.field.shapeRoundness,
                "field.seed": currentSettings.field.seed,
                "field.width": currentSettings.field.width,
                "lawn.curveResolution": currentSettings.lawn.curveResolution,
                "lawn.densityMax": currentSettings.lawn.densityMax,
                "lawn.distanceMin": currentSettings.lawn.distanceMin,
                "lawn.heightRange": `${currentSettings.lawn.heightMin}:${currentSettings.lawn.heightMax}`,
                "lawn.seed": currentSettings.lawn.seed,
                "lawn.use3d": currentSettings.lawn.use3d,
                "preview.lawnBladeCount":
                  currentSettings.preview.lawnBladeCount,
                "surface.bendEnabled": currentSettings.surface.bend.enabled,
                "surface.bendWidth": currentSettings.surface.bend.width,
                "terrain.detail": currentSettings.terrain.detail,
                "terrain.heightLevels":
                  currentSettings.terrain.heightLevels.join(":"),
                "terrain.maxHeight": currentSettings.terrain.maxHeight,
                "terrain.noiseOffset":
                  currentSettings.terrain.noiseOffset.join(":"),
                "terrain.noiseScale": currentSettings.terrain.noiseScale,
                "terrain.roughness": currentSettings.terrain.roughness,
                "terrain.seed": currentSettings.terrain.seed,
              },
              executeLawnLayout,
            );
          } else {
            executeLawnLayout();
          }
          lawnLayoutKeyRef.current = lawnLayoutKey;
        }
        let butterflyLayoutSignature =
          butterflyLayoutSignatureRef.current;
        if (butterflyLayoutKeyRef.current !== butterflyLayoutKey) {
          await yieldGrassRenderStage();
          const executeButterflyLayout = (): GrassRenderResult => {
            butterflyLayoutSignature =
              scene.updateButterflyLayout(currentSettings);
            return {
              bladeCount: currentSettings.butterflies.count,
              signature: butterflyLayoutSignature,
            };
          };
          if (pipeline) {
            const result = await pipeline.runPass(
              grassPipelinePasses.butterflyLayoutBuild,
              getGrassButterflyLayoutPassInputs(currentSettings),
              executeButterflyLayout,
            );
            butterflyLayoutSignature = result.signature;
          } else {
            executeButterflyLayout();
          }
          butterflyLayoutKeyRef.current = butterflyLayoutKey;
          butterflyLayoutSignatureRef.current = butterflyLayoutSignature;
        }
        if (butterflyResourceSceneRef.current !== scene) {
          cancelAnimationFrame(butterflyResourceFrameRef.current);
          butterflyResourceFrameRef.current = 0;
          window.clearTimeout(butterflyResourceTimerRef.current);
          butterflyResourceTimerRef.current = 0;
          butterflyResourceSceneRef.current = scene;
          butterflyResourcePromiseRef.current = null;
          butterflyResourceSignatureRef.current = "loading";
        }
        const shouldPrepareButterflies =
          currentSettings.butterflies.enabled &&
          butterflyResourcePromiseRef.current === null &&
          butterflyResourceFrameRef.current === 0 &&
          butterflyResourceTimerRef.current === 0;
        const butterflyResourceSignature =
          currentSettings.butterflies.enabled
            ? butterflyResourceSignatureRef.current
            : "disabled";
        if (!scanResourceReadyRef.current) {
          await yieldGrassRenderStage();
        }
        const scanResourceSignature = await scanResourcePromise;
        scanResourceReadyRef.current = true;
        const scanCounts = scanCountsRef.current;
        const currentScanLayoutKeys = Object.fromEntries(
          grassScanLayerKinds.map((kind) => [
            kind,
            getGrassScanLayoutKey(kind, currentSettings),
          ]),
        ) as Record<GrassScanLayerKind, string>;
        for (const kind of grassScanLayerKinds) {
          const scanLayoutKey = currentScanLayoutKeys[kind];
          if (scanLayoutKeyRefs.current[kind] !== scanLayoutKey) {
            await yieldGrassRenderStage();
            const executeScanLayout = (): GrassRenderResult => {
              const count = scene.updateScanLayout(kind, currentSettings);
              scanCounts[kind] = count;
              return { bladeCount: count, signature: scanLayoutKey };
            };
            if (pipeline) {
              const scanSettings = currentSettings.scans[kind];
              const result = await pipeline.runPass(
                scanPipelinePasses[kind],
                {
                  "field.depth": currentSettings.field.depth,
                  "field.edgeIrregularity":
                    currentSettings.field.edgeIrregularity,
                  "field.shapeRoundness":
                    currentSettings.field.shapeRoundness,
                  "field.width": currentSettings.field.width,
                  "surface.bendEnabled": currentSettings.surface.bend.enabled,
                  "surface.bendWidth": currentSettings.surface.bend.width,
                  ...(kind === "rocks"
                    ? {
                        "scan.boulder.enabled":
                          currentSettings.scans.boulder.enabled,
                        "scan.boulder.seed": currentSettings.scans.boulder.seed,
                        "scan.boulder.size": currentSettings.scans.boulder.size,
                        "scan.boulder.surfaceOffset":
                          currentSettings.scans.boulder.surfaceOffset,
                      }
                    : {}),
                  [`scan.${kind}.clumping`]: scanSettings.clumping,
                  [`scan.${kind}.count`]: scanSettings.count,
                  [`scan.${kind}.enabled`]: scanSettings.enabled,
                  [`scan.${kind}.seed`]: scanSettings.seed,
                  [`scan.${kind}.sizeRange`]: `${scanSettings.sizeMin}:${scanSettings.sizeMax}`,
                  [`scan.${kind}.surfaceOffset`]: scanSettings.surfaceOffset,
                  "terrain.detail": currentSettings.terrain.detail,
                  "terrain.heightLevels":
                    currentSettings.terrain.heightLevels.join(":"),
                  "terrain.maxHeight": currentSettings.terrain.maxHeight,
                  "terrain.noiseOffset":
                    currentSettings.terrain.noiseOffset.join(":"),
                  "terrain.noiseScale": currentSettings.terrain.noiseScale,
                  "terrain.roughness": currentSettings.terrain.roughness,
                  "terrain.seed": currentSettings.terrain.seed,
                },
                executeScanLayout,
              );
              scanCounts[kind] = result.bladeCount;
            } else {
              executeScanLayout();
            }
            scanLayoutKeyRefs.current[kind] = scanLayoutKey;
          } else {
            scanCounts[kind] = currentSettings.scans[kind].enabled
              ? currentSettings.scans[kind].count
              : 0;
          }
        }
        publishGrassLayerVisibility({
          canvas,
          host,
          settings: currentSettings,
        });
        const bladeCount = tallBladeCount + lawnBladeCount;
        const environmentSignature = await environmentPromise;
        let windDirectionVector: readonly [number, number] = [1, 0];
        const windProgress =
          currentSettings.wind.mode === "static" ? 0 : progressRef.current;
        let windActivation = 0;
        let windDirectionAngle = currentSettings.wind.directionAngle;
        let windPointerActive = false;
        let signature = `${renderKey}:${windProgress.toFixed(5)}:${includeBackgroundRef.current ? 1 : 0}`;
        const executeRender = (): GrassRenderResult => {
          scene.render(
            currentSettings,
            progressRef.current,
            width,
            height,
            renderScaleRef.current,
            includeBackgroundRef.current,
            {
              purpose: "interactive-preview",
              shadowStaticKey: renderKey,
            },
          );
          const publishedFrame = publishGrassSceneFrameDiagnostics({
            butterflyLayoutSignature,
            butterflyResourceSignature,
            canvas,
            host,
            includeBackground: includeBackgroundRef.current,
            progress: windProgress,
            renderKey,
            scene,
            settings: currentSettings,
          });
          windActivation = publishedFrame.windActivation;
          windDirectionAngle = publishedFrame.windDirectionAngle;
          windPointerActive = publishedFrame.windPointerActive;
          windDirectionVector = publishedFrame.windDirectionVector;
          signature = publishedFrame.signature;
          return { bladeCount, signature };
        };
        if (pipeline) {
          await pipeline.runPass(
            grassPipelinePasses.sceneRender,
            undefined,
            executeRender,
          );
        } else {
          executeRender();
        }
        lastRenderedViewportRef.current = { height, width };
        publishGrassRenderDiagnostics({
          bladeCount,
          boulderCount: scene.getBoulderCount(),
          canvas,
          environmentSignature,
          groundGeometryKey,
          groundMinimumHeight: scene.getGroundMinimumHeight(),
          host,
          includeBackground: includeBackgroundRef.current,
          layoutKey,
          layoutSignature: scene.getLayoutSignature(),
          lawnBladeCount,
          lawnLayoutKey,
          progress: progressRef.current,
          renderKey,
          renderScale: renderScaleRef.current,
          scanCounts,
          scanResourceSignature,
          settings: currentSettings,
          signature,
          tallBladeCount,
          windActivation,
          windDirectionAngle,
          windDirectionVector,
          windPointerActive,
          windProgress,
        });
        if (shouldPrepareButterflies) {
          butterflyResourceFrameRef.current = requestAnimationFrame(() => {
            butterflyResourceFrameRef.current = requestAnimationFrame(() => {
              butterflyResourceFrameRef.current = 0;
              butterflyResourceTimerRef.current = window.setTimeout(() => {
                butterflyResourceTimerRef.current = 0;
                if (butterflyResourceSceneRef.current !== scene) return;
                const prepareButterflies = () => scene.prepareButterflies();
                const preparePromise = pipeline
                  ? pipeline.runPass(
                      grassPipelinePasses.butterflyResource,
                      { "butterflies.enabled": true },
                      prepareButterflies,
                    )
                  : prepareButterflies();
                butterflyResourcePromiseRef.current = preparePromise;
                void preparePromise
                  .then((resourceSignature) => {
                    if (butterflyResourceSceneRef.current !== scene) return;
                    butterflyResourceSignatureRef.current = resourceSignature;
                    requestAnimationFrame(() => {
                      if (butterflyResourceSceneRef.current !== scene) return;
                      void renderCurrentFrameRef
                        .current?.(true)
                        .catch((error: unknown) => {
                          console.error(
                            "Butterfly resource preview refresh failed.",
                            error,
                          );
                        });
                    });
                  })
                  .catch((error: unknown) => {
                    if (butterflyResourceSceneRef.current !== scene) return;
                    butterflyResourcePromiseRef.current = null;
                    console.error("Butterfly PBR resource failed to load.", error);
                  });
              }, BUTTERFLY_POST_INITIAL_FRAME_DELAY_MS);
            });
          });
        }
        const renderDuration = performance.now() - renderStartedAt;
        nextPlaybackFrameAtRef.current =
          performance.now() + Math.max(1000 / 24, renderDuration * 3);
      } finally {
        renderInFlightRef.current = false;
        renderInFlightKeyRef.current = "";
        if (renderQueuedRef.current) {
          renderQueuedRef.current = false;
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              void renderCurrentFrameRef
                .current?.(true)
                .catch((error: unknown) => {
                  console.error("Queued grass WebGL preview failed.", error);
                });
            });
          });
        }
      }
    },
    [
      groundGeometryKey,
      butterflyLayoutKey,
      layoutKey,
      lawnLayoutKey,
      pipeline,
      renderKey,
      scanLayoutSignature,
      scene,
    ],
  );
  renderCurrentFrameRef.current = renderCurrentFrame;

  React.useLayoutEffect(() => {
    const nonTimelineKey = `${groundGeometryKey}:${layoutKey}:${lawnLayoutKey}:${butterflyLayoutKey}:${scanLayoutSignature}:${renderKey}:${includeBackground ? 1 : 0}:${renderScale}`;
    const force = nonTimelineKey !== lastNonTimelineKeyRef.current;
    lastNonTimelineKeyRef.current = nonTimelineKey;
    void renderCurrentFrame(force).catch((error: unknown) => {
      console.error("Grass WebGL preview failed.", error);
    });
  }, [
    includeBackground,
    butterflyLayoutKey,
    groundGeometryKey,
    layoutKey,
    lawnLayoutKey,
    progress,
    renderCurrentFrame,
    renderScale,
    scanLayoutSignature,
  ]);

  React.useEffect(() => {
    const host = hostRef.current;
    if (!host || typeof ResizeObserver === "undefined") return;
    let frame = 0;
    const initialRect = host.getBoundingClientRect();
    let observedWidth = initialRect.width;
    let observedHeight = initialRect.height;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry?.contentRect.width ?? observedWidth;
      const height = entry?.contentRect.height ?? observedHeight;
      if (
        Math.abs(width - observedWidth) < 0.5 &&
        Math.abs(height - observedHeight) < 0.5
      ) {
        return;
      }
      observedWidth = width;
      observedHeight = height;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          frame = 0;
          const renderedViewport = lastRenderedViewportRef.current;
          if (
            Math.abs(observedWidth - renderedViewport.width) < 0.5 &&
            Math.abs(observedHeight - renderedViewport.height) < 0.5
          ) return;
          void renderCurrentFrame(true);
        });
      });
    });
    observer.observe(host);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [renderCurrentFrame]);

  const renderPointerInteraction = React.useCallback(() => {
    void renderCurrentFrameRef.current?.(true).catch((error: unknown) => {
      console.error("Grass pointer wind preview failed.", error);
    });
  }, []);
  useGrassSimulationInteractions({
    hostRef,
    onInteraction: renderPointerInteraction,
    scene,
    settings,
  });
  useGrassButterflyHover({
    enabled: settings.butterflies.enabled,
    hostRef,
    onInteraction: renderPointerInteraction,
    scene,
  });

  const hitTest = React.useCallback(
    (clientX: number, clientY: number) => {
      const host = hostRef.current;
      return Boolean(
        host && scene?.hitTest(clientX, clientY, host.getBoundingClientRect()),
      );
    },
    [scene],
  );
  const orbitHandlers = useToolcraftModelOrbitInteraction<HTMLDivElement>({
    historyLabel: "Field view",
    hitTest,
    target: "view.orientation",
  });
  const touchInteractionEnabled =
    settings.wind.mode === "wind" || settings.wind.mode === "simulation";

  return (
    <div
      aria-label="Procedural grass field preview"
      className={styles.output}
      data-canvas-mode="infinite-borderless"
      data-grass-touch-interactive={String(touchInteractionEnabled)}
      data-slot="grass-live-preview"
      {...orbitHandlers}
      ref={hostRef}
      role="application"
    />
  );
}
