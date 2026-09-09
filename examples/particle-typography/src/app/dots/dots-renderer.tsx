import * as React from "react";
import {
  getToolcraftTimelineLoopProgress,
  shouldIncludeToolcraftPreviewBackground,
  type ToolcraftState,
} from "@/toolcraft/runtime";
import {
  useToolcraftDispatch,
  useToolcraftPipeline,
  useToolcraftSelector,
} from "@/toolcraft/runtime/react";

import { dotsPipelinePasses } from "./dots-pipeline";
import { renderDotsFrame } from "./dots-render-frame";
import {
  getDotsSceneBounds,
  getDotsWorldOrigin,
} from "./dots-scene-bounds";
import { clearDotPlanCache, getDotPlan } from "./dots-shape";
import { dotMotionPhaseAt } from "./dots-timing";
import { readDotsSettings } from "./dots-values";
import styles from "./dots-renderer.module.css";

const selectState = (state: ToolcraftState) => state;
const infiniteViewportBackgroundTarget = "appearance.background";

function areValueRecordsEqualExceptInfiniteBackground(
  previous: ToolcraftState["values"],
  next: ToolcraftState["values"],
): boolean {
  if (previous === next) return true;

  const targets = new Set([...Object.keys(previous), ...Object.keys(next)]);
  for (const target of targets) {
    if (target === infiniteViewportBackgroundTarget) continue;
    if (!Object.is(previous[target], next[target])) return false;
  }

  return true;
}

export function areDotsRenderStatesEqual(
  previous: ToolcraftState,
  next: ToolcraftState,
): boolean {
  const valuesEqual =
    previous.canvas.mode === "infinite" && next.canvas.mode === "infinite"
      ? areValueRecordsEqualExceptInfiniteBackground(
          previous.values,
          next.values,
        )
      : previous.values === next.values;

  return (
    valuesEqual &&
    previous.canvas.mode === next.canvas.mode &&
    previous.canvas.size.width === next.canvas.size.width &&
    previous.canvas.size.height === next.canvas.size.height &&
    previous.timeline.currentTimeSeconds === next.timeline.currentTimeSeconds &&
    previous.timeline.durationSeconds === next.timeline.durationSeconds &&
    previous.timeline.isPlaying === next.timeline.isPlaying
  );
}

function stableSignature(value: unknown): string {
  const source = JSON.stringify(value);
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function DotsRenderer(): React.JSX.Element {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const viewportInteractionRef = React.useRef(false);
  const dispatch = useToolcraftDispatch();
  const pipeline = useToolcraftPipeline();
  const state = useToolcraftSelector(selectState, areDotsRenderStatesEqual);
  const settings = React.useMemo(() => readDotsSettings(state), [state]);
  const settingsKey = React.useMemo(() => JSON.stringify(settings), [settings]);
  const [fontRevision, setFontRevision] = React.useState(0);
  const shapeKey = React.useMemo(
    () =>
      JSON.stringify({
        canvas: settings.canvas,
        count: settings.particles.count,
        distribution: settings.particles.distribution,
        edgeSpill: settings.particles.edgeSpill,
        fontRevision,
        launch: settings.particles.launch,
        text: settings.text,
        typography: settings.typography,
      }),
    [fontRevision, settings],
  );
  const shapePlan = React.useMemo(() => getDotPlan(settings), [settings, shapeKey]);
  const progress = getToolcraftTimelineLoopProgress({
    currentTimeSeconds: state.timeline.currentTimeSeconds,
    durationSeconds: state.timeline.durationSeconds,
  });
  const includeBackground = shouldIncludeToolcraftPreviewBackground({ state });
  const renderScale = Math.min(
    2,
    Math.max(1, Number(state.values["canvas.renderScale"] ?? 1)),
  );
  const infiniteSceneRect = React.useMemo(() => {
    if (state.canvas.mode !== "infinite") return null;
    return (
      getDotsSceneBounds({
        state,
        timeRange: {
          endSeconds: state.timeline.durationSeconds,
          startSeconds: 0,
        },
      })[0] ?? null
    );
  }, [
    fontRevision,
    settingsKey,
    state.canvas.mode,
    state.timeline.durationSeconds,
  ]);
  const currentInfiniteSceneRect = React.useMemo(() => {
    if (
      state.canvas.mode !== "infinite" ||
      state.timeline.isPlaying
    ) {
      return null;
    }
    return getDotsSceneBounds({ state })[0] ?? null;
  }, [
    fontRevision,
    settingsKey,
    state.canvas.mode,
    state.timeline.currentTimeSeconds,
    state.timeline.isPlaying,
  ]);
  const sceneRect = infiniteSceneRect ?? {
    height: settings.canvas.height,
    width: settings.canvas.width,
    x: 0,
    y: 0,
  };
  const worldOrigin = getDotsWorldOrigin(state);
  const previousProductDurationRef = React.useRef(
    settings.motion.totalSeconds,
  );

  React.useEffect(() => {
    const previousDuration = previousProductDurationRef.current;
    previousProductDurationRef.current = settings.motion.totalSeconds;
    if (
      Math.abs(previousDuration - settings.motion.totalSeconds) < 0.000_001
    ) {
      return;
    }
    dispatch({
      durationSeconds: settings.motion.totalSeconds,
      type: "timeline.setDuration",
    });
  }, [dispatch, settings.motion.totalSeconds]);

  React.useEffect(() => {
    if (!("fonts" in document)) return;
    const descriptor = `${settings.typography.fontWeight} 32px "${settings.typography.family}"`;
    let active = true;
    void (async () => {
      try {
        await document.fonts.load(descriptor, settings.text);
        await document.fonts.ready;
      } catch {
        // Rebuild once with the browser fallback when the requested face fails.
      } finally {
        if (!active) return;
        clearDotPlanCache();
        setFontRevision((value) => value + 1);
      }
    })();
    return () => {
      active = false;
    };
  }, [settings.text, settings.typography.family, settings.typography.fontWeight]);

  React.useEffect(() => {
    const begin = (event: PointerEvent): void => {
      if (
        event.target instanceof Element &&
        event.target.closest('[data-slot="toolcraft-runtime-canvas"]')
      ) {
        viewportInteractionRef.current = true;
      }
    };
    const end = (): void => {
      viewportInteractionRef.current = false;
    };
    window.addEventListener("pointerdown", begin, true);
    window.addEventListener("pointerup", end, true);
    window.addEventListener("pointercancel", end, true);
    window.addEventListener("blur", end);
    return () => {
      window.removeEventListener("pointerdown", begin, true);
      window.removeEventListener("pointerup", end, true);
      window.removeEventListener("pointercancel", end, true);
      window.removeEventListener("blur", end);
    };
  }, []);

  React.useEffect(() => {
    void pipeline?.runPass(dotsPipelinePasses.shapeSample, undefined, () => shapePlan);
  }, [pipeline, shapePlan]);

  React.useLayoutEffect(() => {
    if (viewportInteractionRef.current && state.timeline.isPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = Math.max(1, Math.round(sceneRect.width * renderScale));
    const height = Math.max(1, Math.round(sceneRect.height * renderScale));
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return;
    void pipeline?.runPass(dotsPipelinePasses.previewFrame, undefined, () => {
      context.save();
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.setTransform(renderScale, 0, 0, renderScale, 0, 0);
      context.translate(
        worldOrigin.x - sceneRect.x,
        worldOrigin.y - sceneRect.y,
      );
      renderDotsFrame(
        context,
        settings.canvas.width,
        settings.canvas.height,
        settings,
        progress,
        { clear: false, includeBackground },
      );
      context.restore();
    });
  }, [
    fontRevision,
    includeBackground,
    pipeline,
    progress,
    renderScale,
    sceneRect.height,
    sceneRect.width,
    sceneRect.x,
    sceneRect.y,
    settings,
    settingsKey,
    state.timeline.isPlaying,
    worldOrigin.x,
    worldOrigin.y,
  ]);

  const frameSignature = stableSignature({
    includeBackground,
    progress: progress.toFixed(5),
    settings,
  });

  return (
    <div
      className={[
        styles.root,
        state.canvas.mode === "infinite" ? styles.rootInfinite : null,
      ]
        .filter(Boolean)
        .join(" ")}
      data-background-color={settings.appearance.background}
      data-background-visible={includeBackground ? "true" : "false"}
      data-canvas-height={settings.canvas.height}
      data-canvas-width={settings.canvas.width}
      data-dot-attraction={settings.physics.attraction}
      data-dot-count={settings.particles.count}
      data-dot-damping={settings.physics.damping}
      data-dot-distribution={settings.particles.distribution}
      data-dot-edge-spill={settings.particles.edgeSpill.toFixed(3)}
      data-dot-font-color={settings.typography.color}
      data-dot-font-family={settings.typography.family}
      data-dot-font-id={settings.typography.fontId}
      data-dot-font-size={settings.typography.fontSize}
      data-dot-font-weight={settings.typography.fontWeight}
      data-dot-glow={settings.appearance.glow}
      data-dot-gradient={JSON.stringify(settings.appearance.palette)}
      data-dot-launch={settings.particles.launch}
      data-dot-letter-spacing={settings.typography.letterSpacing}
      data-dot-line-height={settings.typography.lineHeight}
      data-dot-mass={settings.physics.mass}
      data-dot-active-duration={settings.motion.activeSeconds}
      data-dot-calm-duration={settings.motion.calmSeconds}
      data-dot-calm-effective-duration={settings.motion.calmTimelineSeconds.toFixed(3)}
      data-dot-motion-phase={dotMotionPhaseAt(progress, settings.motion)}
      data-dot-product-duration={settings.motion.totalSeconds}
      data-dot-opacity={settings.typography.opacity}
      data-dot-size={settings.particles.size.join(":")}
      data-dot-size-motion={settings.appearance.sizeMotion}
      data-dot-text={settings.text}
      data-dot-text-case={settings.typography.textCase}
      data-dot-trails={settings.appearance.trails}
      data-dot-turbulence={settings.physics.turbulence}
      data-dots-frame-signature={frameSignature}
      data-dots-renderer="true"
      data-export-image-format={String(state.values["export.image.format"])}
      data-export-image-resolution={String(state.values["export.image.resolution"])}
      data-export-video-format={String(state.values["export.video.format"])}
      data-export-video-resolution={String(state.values["export.video.resolution"])}
      data-render-scale={renderScale}
      data-current-scene-height={currentInfiniteSceneRect?.height}
      data-current-scene-width={currentInfiniteSceneRect?.width}
      data-current-scene-x={currentInfiniteSceneRect?.x}
      data-current-scene-y={currentInfiniteSceneRect?.y}
      data-scene-height={sceneRect.height}
      data-scene-width={sceneRect.width}
      data-scene-x={sceneRect.x}
      data-scene-y={sceneRect.y}
      data-timeline-duration={state.timeline.durationSeconds}
      data-timeline-playing={state.timeline.isPlaying ? "true" : "false"}
      data-timeline-progress={progress.toFixed(5)}
      data-toolcraft-product-output="dot-formation"
      style={
        state.canvas.mode === "infinite"
          ? {
              height: sceneRect.height,
              left: sceneRect.x,
              top: sceneRect.y,
              width: sceneRect.width,
            }
          : undefined
      }
    >
      <canvas
        aria-label="Particle text formation"
        className={styles.canvas}
        data-toolcraft-generated-output=""
        ref={canvasRef}
      />
    </div>
  );
}
