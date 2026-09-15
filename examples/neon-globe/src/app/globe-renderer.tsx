import * as React from "react";
import {
  shouldIncludeToolcraftPreviewBackground,
  type ToolcraftProductExportRenderer,
} from "@/toolcraft/runtime";
import {
  useToolcraftEvaluatedValues,
  useToolcraftModelOrbitInteraction,
  useToolcraftPipelinePass,
  useToolcraftProductSceneFrame,
  useToolcraftSelector,
} from "@/toolcraft/runtime/react";

import {
  createGlobeGeometry,
  getGlobeSceneRect,
  readGlobeSettings,
} from "./globe-model";
import { drawGlobeFrame } from "./globe-frame";
import { getLoopingLogos } from "./globe-logo-animation";
import { useLogoLoopClock } from "./globe-logo-intro-controller";
import { globeRendererPipelineRegistration } from "./globe-renderer-pipeline";
import { GLOBE_SCREEN_RADIUS_RATIO } from "./globe-renderer-settings";
import styles from "./globe-renderer.module.css";

function resolveCanvasPixelRatio(renderScale: number): number {
  const selectedScale = Number.isFinite(renderScale) && renderScale > 0 ? renderScale : 2;
  return Math.max(1, Math.min(6, (window.devicePixelRatio || 1) * selectedScale));
}

export function GlobeCanvas(): React.JSX.Element {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const drawFrameRef = React.useRef<((nowMs: number) => void) | null>(null);
  const sceneFrame = useToolcraftProductSceneFrame();
  const hasScene = sceneFrame.rect !== null;
  const state = useToolcraftSelector((candidate) => candidate);
  const values = useToolcraftEvaluatedValues();
  const settings = React.useMemo(() => readGlobeSettings(values), [values]);
  const geometry = React.useMemo(
    () => createGlobeGeometry(settings),
    [settings.latitudeCount, settings.meridianCount],
  );
  const logoLoopClock = useLogoLoopClock();
  const renderScale = Number(values["canvas.renderScale"] ?? 2);
  const geometryPass = globeRendererPipelineRegistration.getPass("globe-geometry");
  const rasterPass = globeRendererPipelineRegistration.getPass("globe-raster");
  useToolcraftPipelinePass(
    geometryPass,
    {
      latitudeCount: settings.latitudeCount,
      meridianCount: settings.meridianCount,
      orientationPosition: settings.orientation.position,
    },
    () => ({
      latitudeCount: settings.latitudeCount,
      meridianCount: settings.meridianCount,
      orientationPosition: settings.orientation.position,
    }),
  );
  useToolcraftPipelinePass(rasterPass, undefined, () => "drawn" as const);
  const orbitHandlers = useToolcraftModelOrbitInteraction<HTMLDivElement>({
    hitTest: () => true,
    historyLabel: "Globe orientation",
    target: "globe.orientation",
  });

  // Publish committed inputs without cancelling the frame that will draw them.
  React.useLayoutEffect(() => {
    const canvas = canvasRef.current;
    drawFrameRef.current = null;
    if (!canvas || sceneFrame.rect === null) {
      return;
    }

    const width = Math.max(1, Math.round(sceneFrame.rect.width));
    const height = Math.max(1, Math.round(sceneFrame.rect.height));
    const pixelRatio = resolveCanvasPixelRatio(renderScale);
    const backingWidth = Math.max(1, Math.round(width * pixelRatio));
    const backingHeight = Math.max(1, Math.round(height * pixelRatio));
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    drawFrameRef.current = (nowMs: number) => {
      // Dimension assignments clear every pixel, even when the value is unchanged.
      // A real resize and its replacement frame must happen in the same callback.
      if (canvas.width !== backingWidth) canvas.width = backingWidth;
      if (canvas.height !== backingHeight) canvas.height = backingHeight;
      const elapsedMs = logoLoopClock.getElapsedMs(nowMs);
      const previewSettings = {
        ...settings,
        logos: getLoopingLogos(
          settings.logos,
          elapsedMs,
          settings.logoHoldSeconds,
          settings.logoSpeed,
        ),
      };

      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      drawGlobeFrame(context, width, height, previewSettings, {
        clear: true,
        crtPhaseMs: nowMs,
        geometry,
        includeBackground: shouldIncludeToolcraftPreviewBackground({ state }),
      });
    };
  }, [
    geometry,
    sceneFrame.rect,
    renderScale,
    state,
    settings,
    logoLoopClock,
  ]);

  React.useEffect(() => {
    if (!hasScene) return;
    let animationFrame = 0;
    const render = (nowMs: number) => {
      drawFrameRef.current?.(nowMs);
      animationFrame = window.requestAnimationFrame(render);
    };
    render(window.performance.now());
    return () => window.cancelAnimationFrame(animationFrame);
  }, [hasScene]);

  if (sceneFrame.rect === null) {
    return <div className={styles.globeSurface} data-toolcraft-product-output />;
  }

  const orbitDiameter = Math.min(sceneFrame.rect.width, sceneFrame.rect.height) *
    GLOBE_SCREEN_RADIUS_RATIO *
    2;

  return (
    <div className={styles.globeSurface}>
      <canvas
        aria-label="Landing globe preview"
        className={styles.previewCanvas}
        data-toolcraft-product-output
        data-toolcraft-renderer-layer="globe-canvas"
        ref={canvasRef}
      />
      <div
        aria-label="Landing globe orbit surface"
        className={styles.orbitSurface}
        data-canvas-model-layer
        data-toolcraft-model-orbit-surface="true"
        style={{ height: orbitDiameter, width: orbitDiameter }}
        {...orbitHandlers}
      />
    </div>
  );
}

export const globeExportRenderer: ToolcraftProductExportRenderer = {
  baseFileName: "landing-globe",
  renderFrame: async ({ context, frame, rendererPipeline, state }) => {
    await rendererPipeline?.runPass(
      globeRendererPipelineRegistration.getPass("globe-export"),
      undefined,
      () => "exported" as const,
    );
    const settings = readGlobeSettings(state.values);
    context.save();
    try {
      context.translate(frame.x, frame.y);
      drawGlobeFrame(context, frame.width, frame.height, settings);
    } finally {
      context.restore();
    }
  },
};

export const globeSceneBoundsProvider = () => [getGlobeSceneRect()];
