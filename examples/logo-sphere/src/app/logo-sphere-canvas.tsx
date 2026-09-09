import * as React from "react";
import {
  createSpherePoints,
  rotateLogoSphereOrientation,
  type LogoSphereOrientation,
} from "./logo-sphere-model";
import {
  clearLogoSphereImageRegistry,
  getReadyLogoSphereImages,
  subscribeLogoSphereImageRegistry,
  syncLogoSphereImageRegistry,
} from "./logo-sphere-image-registry";
import {
  logoSphereCompositePass,
  logoSphereLayoutPass,
} from "./logo-sphere-pipeline";
import { createLogoSphereSurfaceRenderer, disposeLogoSphereFrameSurface } from "./logo-sphere-surface-renderer";
import {
  createLogoSphereProjectionInput,
  getLogoSphereCanvasBacking,
  getLogoSphereCardStyle,
  getLogoSphereSourceAssets,
  getLogoSphereSettings,
} from "./logo-sphere-state";
import {
  useToolcraft,
  useToolcraftMediaPresentationUrls,
  useToolcraftModelOrbitInteraction,
  useToolcraftPipeline,
  useToolcraftPipelinePass,
  useToolcraftProductSceneFrame,
} from "@/toolcraft/runtime/react";

import styles from "./logo-sphere-canvas.module.css";

type PointerSession = {
  lastMoveTime: number;
  lastOrbitCommitTime: number;
  lastX: number;
  lastY: number;
  ownsOrbit: boolean;
  pointerId: number;
  velocityX: number;
  velocityY: number;
};

const REFERENCE_FRAME_MS = 1000 / 60;
const VELOCITY_SMOOTHING_MS = 40;
const RELEASE_HOLD_GRACE_MS = 40;
const RELEASE_HOLD_FADE_MS = 80;
const RELEASE_SPEED_CAP = 48;
const ORBIT_COMMIT_INTERVAL_MS = 250;
function getReleaseVelocity(
  session: PointerSession,
  releaseTime: number,
): Readonly<{ x: number; y: number }> {
  const heldFor = Math.max(0, releaseTime - session.lastMoveTime);
  const holdFade =
    heldFor <= RELEASE_HOLD_GRACE_MS
      ? 1
      : Math.max(
          0,
          1 - (heldFor - RELEASE_HOLD_GRACE_MS) / RELEASE_HOLD_FADE_MS,
        );
  const speed = Math.hypot(session.velocityX, session.velocityY) * holdFade;
  const cap = speed > RELEASE_SPEED_CAP ? RELEASE_SPEED_CAP / speed : 1;

  return {
    x: session.velocityX * holdFade * cap,
    y: session.velocityY * holdFade * cap,
  };
}

export function LogoSphereCanvas(): React.JSX.Element | null {
  const { dispatch, state } = useToolcraft();
  const sceneFrame = useToolcraftProductSceneFrame();
  const pipeline = useToolcraftPipeline();
  const presentationUrls = useToolcraftMediaPresentationUrls(state.mediaAssets);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const pointerSessionRef = React.useRef<PointerSession | null>(null);
  const inertiaFrameRef = React.useRef(0);
  const interactionPreviewFrameRef = React.useRef(0);
  const interactionFrameRendererRef = React.useRef<
    ((orientation: LogoSphereOrientation) => void) | null
  >(null);
  const surfaceRendererRef = React.useRef<ReturnType<typeof createLogoSphereSurfaceRenderer>>(null);
  const [fallback, setFallback] = React.useState(false);
  const [surfaceVersion, invalidateSurface] = React.useReducer((version: number) => version + 1, 0);
  const wheelTimerRef = React.useRef(0);
  const lastDispatchedPoseRef = React.useRef<unknown>(null);
  const [registryVersion, bumpRegistryVersion] = React.useReducer(
    (version: number) => version + 1,
    0,
  );
  const [viewportInteracting, setViewportInteracting] = React.useState(false);
  const [sphereInteracting, setSphereInteracting] = React.useState(false);
  const settings = getLogoSphereSettings(state);
  const stateRef = React.useRef(state);
  stateRef.current = state;
  const renderSignature = JSON.stringify({
    settings, style: getLogoSphereCardStyle(state), rect: sceneFrame.rect,
    kind: sceneFrame.kind, renderScale: state.values["canvas.renderScale"],
    background: state.values["appearance.background"], includeBackground: state.values["export.includeBackground"],
    time: state.timeline.currentTimeSeconds, duration: state.timeline.durationSeconds,
  });
  const orientationRef = React.useRef(settings.orientation);
  if (
    !sphereInteracting &&
    pointerSessionRef.current === null &&
    inertiaFrameRef.current === 0
  ) {
    orientationRef.current = settings.orientation;
  }

  React.useEffect(
    () => subscribeLogoSphereImageRegistry(bumpRegistryVersion),
    [],
  );
  React.useEffect(() => {
    syncLogoSphereImageRegistry(
      getLogoSphereSourceAssets(state.mediaAssets),
      presentationUrls,
    );
  }, [presentationUrls, state.mediaAssets]);
  React.useEffect(() => clearLogoSphereImageRegistry, []);
  const mountCanvas = React.useCallback((canvas: HTMLCanvasElement | null) => {
    surfaceRendererRef.current?.dispose();
    surfaceRendererRef.current = null;
    canvasRef.current = canvas;
    if (!canvas) return;
    surfaceRendererRef.current = createLogoSphereSurfaceRenderer(canvas, {
      fallback, invalidate: invalidateSurface, unavailable: () => setFallback(true),
    });
    canvas.dataset.renderer = surfaceRendererRef.current?.kind ?? "unavailable";
  }, [fallback]);
  React.useEffect(() => () => {
    surfaceRendererRef.current?.dispose();
    disposeLogoSphereFrameSurface();
  }, []);

  const layout = useToolcraftPipelinePass(
    logoSphereLayoutPass,
    {
      "sphere.distribution": settings.distribution,
      "sphere.visibleCount": settings.visibleCount,
    },
    () =>
      createSpherePoints({
        count: Math.max(6, Math.min(500, Math.round(settings.visibleCount))),
        distribution: settings.distribution,
      }),
  );

  const hitTest = React.useCallback((clientX: number, clientY: number) => {
    const bounds = canvasRef.current?.getBoundingClientRect();
    if (!bounds) {
      return false;
    }
    const normalizedX =
      (clientX - (bounds.left + bounds.width / 2)) / bounds.width;
    const normalizedY =
      (clientY - (bounds.top + bounds.height / 2)) / bounds.height;
    const aspect = bounds.width / Math.max(1, bounds.height);

    return Math.hypot(normalizedX * aspect, normalizedY) <= 0.46;
  }, []);

  const orbitHandlers = useToolcraftModelOrbitInteraction<HTMLCanvasElement>({
    hitTest,
    historyLabel: "Sphere orbit",
    target: "view.orbit",
  });

  const cancelInertia = React.useCallback(() => {
    window.cancelAnimationFrame(inertiaFrameRef.current);
    window.cancelAnimationFrame(interactionPreviewFrameRef.current);
    inertiaFrameRef.current = 0;
    interactionPreviewFrameRef.current = 0;
    lastDispatchedPoseRef.current = null;
    setSphereInteracting(false);
  }, []);

  const startInertia = React.useCallback(
    (velocityX: number, velocityY: number) => {
      cancelInertia();
      if (settings.inertia <= 0 || Math.hypot(velocityX, velocityY) < 0.4) {
        return;
      }

      setSphereInteracting(true);
      const retention = 0.82 + settings.inertia * 0.17;
      let currentVelocityX = velocityX;
      let currentVelocityY = velocityY;
      let lastCommitTime = 0;
      let previousTickTime = 0;
      const historyGroup = `logo-sphere-inertia-${Date.now()}`;

      const commitPose = (pose: LogoSphereOrientation): void => {
        lastDispatchedPoseRef.current = pose;
        dispatch({
          history: "merge",
          historyGroup,
          label: "Sphere inertia",
          target: "view.orbit",
          type: "controls.setValue",
          value: pose,
        });
      };

      const tick = (tickTime: number) => {
        const elapsed =
          previousTickTime === 0
            ? REFERENCE_FRAME_MS
            : Math.min(100, Math.max(1, tickTime - previousTickTime));
        previousTickTime = tickTime;
        const frames = elapsed / REFERENCE_FRAME_MS;
        const decay = Math.pow(retention, frames);
        currentVelocityX *= decay;
        currentVelocityY *= decay;
        if (Math.hypot(currentVelocityX, currentVelocityY) < 0.035) {
          commitPose(orientationRef.current);
          inertiaFrameRef.current = 0;
          setSphereInteracting(false);
          return;
        }

        const nextPose = rotateLogoSphereOrientation(
          orientationRef.current,
          currentVelocityX * frames,
          currentVelocityY * frames,
        );
        orientationRef.current = nextPose;
        interactionFrameRendererRef.current?.(nextPose);
        if (
          lastCommitTime === 0 ||
          tickTime - lastCommitTime >= ORBIT_COMMIT_INTERVAL_MS
        ) {
          lastCommitTime = tickTime;
          commitPose(nextPose);
        }
        inertiaFrameRef.current = window.requestAnimationFrame(tick);
      };

      inertiaFrameRef.current = window.requestAnimationFrame(tick);
    },
    [cancelInertia, dispatch, settings.inertia],
  );

  React.useEffect(() => {
    if (
      inertiaFrameRef.current !== 0 &&
      lastDispatchedPoseRef.current !== null &&
      state.values["view.orbit"] !== lastDispatchedPoseRef.current
    ) {
      cancelInertia();
    }
  }, [cancelInertia, state.values]);

  React.useEffect(() => cancelInertia, [cancelInertia]);
  React.useEffect(() => {
    if (!viewportInteracting) {
      return;
    }
    const finish = () => setViewportInteracting(false);
    window.addEventListener("pointerup", finish, { once: true });
    window.addEventListener("pointercancel", finish, { once: true });
    return () => {
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
    };
  }, [viewportInteracting]);
  React.useEffect(() => () => window.clearTimeout(wheelTimerRef.current), []);

  const onPointerDown = React.useCallback<
    React.PointerEventHandler<HTMLCanvasElement>
  >(
    (event) => {
      cancelInertia();
      const ownsOrbit = hitTest(event.clientX, event.clientY);
      pointerSessionRef.current = {
        lastMoveTime: performance.now(),
        lastOrbitCommitTime: performance.now(),
        lastX: event.clientX,
        lastY: event.clientY,
        ownsOrbit,
        pointerId: event.pointerId,
        velocityX: 0,
        velocityY: 0,
      };
      if (!ownsOrbit) {
        setViewportInteracting(true);
      } else {
        setSphereInteracting(true);
      }
      orbitHandlers.onPointerDown(event);
    },
    [cancelInertia, hitTest, orbitHandlers],
  );

  const onPointerMove = React.useCallback<
    React.PointerEventHandler<HTMLCanvasElement>
  >(
    (event) => {
      const session = pointerSessionRef.current;
      if (session?.pointerId === event.pointerId) {
        const moveTime = performance.now();
        const deltaX = event.clientX - session.lastX;
        const deltaY = event.clientY - session.lastY;
        const elapsed = Math.min(
          100,
          Math.max(1, moveTime - session.lastMoveTime),
        );
        const frames = elapsed / REFERENCE_FRAME_MS;
        const instantVelocityX = deltaX / frames;
        const instantVelocityY = deltaY / frames;
        const smoothing = 1 - Math.exp(-elapsed / VELOCITY_SMOOTHING_MS);
        session.velocityX += (instantVelocityX - session.velocityX) * smoothing;
        session.velocityY += (instantVelocityY - session.velocityY) * smoothing;
        session.lastMoveTime = moveTime;
        session.lastX = event.clientX;
        session.lastY = event.clientY;
        if (session.ownsOrbit) {
          orientationRef.current = rotateLogoSphereOrientation(
            orientationRef.current,
            deltaX,
            deltaY,
          );
          if (interactionPreviewFrameRef.current === 0) {
            interactionPreviewFrameRef.current = window.requestAnimationFrame(
              () => {
                interactionPreviewFrameRef.current = 0;
                interactionFrameRendererRef.current?.(orientationRef.current);
              },
            );
          }
          if (
            moveTime - session.lastOrbitCommitTime <
            ORBIT_COMMIT_INTERVAL_MS
          ) {
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          session.lastOrbitCommitTime = moveTime;
        }
      }
      orbitHandlers.onPointerMove(event);
    },
    [orbitHandlers],
  );

  const finishPointer = React.useCallback(
    (
      event: React.PointerEvent<HTMLCanvasElement>,
      finish: React.PointerEventHandler<HTMLCanvasElement>,
    ) => {
      const session = pointerSessionRef.current;
      pointerSessionRef.current = null;
      window.cancelAnimationFrame(interactionPreviewFrameRef.current);
      interactionPreviewFrameRef.current = 0;
      if (session?.ownsOrbit) {
        orbitHandlers.onPointerMove(event);
      }
      finish(event);
      if (session?.ownsOrbit) {
        const release = getReleaseVelocity(session, performance.now());
        window.requestAnimationFrame(() => startInertia(release.x, release.y));
      }
    },
    [startInertia],
  );

  const onWheel = React.useCallback<
    React.WheelEventHandler<HTMLCanvasElement>
  >(() => {
    setViewportInteracting(true);
    window.clearTimeout(wheelTimerRef.current);
    wheelTimerRef.current = window.setTimeout(
      () => setViewportInteracting(false),
      140,
    );
  }, []);

  const layoutPoints = layout.status === "success" ? layout.result : undefined;
  React.useLayoutEffect(() => {
    const currentState = stateRef.current;
    const renderer = surfaceRendererRef.current;
    const rect = sceneFrame.rect;
    if (!rect || !renderer || viewportInteracting) return;
    const currentSettings = getLogoSphereSettings(currentState);
    const backing = getLogoSphereCanvasBacking(rect, window.devicePixelRatio,
      currentState.values["canvas.renderScale"]);
    const images = getReadyLogoSphereImages(getLogoSphereSourceAssets(currentState.mediaAssets));
    const projection = createLogoSphereProjectionInput(currentState, rect, { points: layoutPoints });
    const cardStyle = getLogoSphereCardStyle(currentState);
    const authored = currentState.values["appearance.background"];
    const color = typeof authored === "string" ? authored :
      authored && typeof authored === "object" && "hex" in authored ? String(authored.hex) : null;
    const backgroundColor = sceneFrame.kind === "finite" &&
      currentState.values["export.includeBackground"] !== false ? color : null;
    const renderFrame = (orientation: LogoSphereOrientation, tracked = true) => {
      const draw = () => {
        try {
          renderer.resize(backing.width, backing.height);
          renderer.render({ images, projection: { ...projection, orientation }, cardStyle, backgroundColor });
        } catch (error) {
          console.warn("Logo sphere switched to the full-quality capability fallback.", error);
          setFallback(true);
        }
      };
      if (pipeline && tracked) void pipeline.runPass(logoSphereCompositePass, undefined, draw);
      else draw();
    };
    const drawInteraction = (orientation: LogoSphereOrientation) => renderFrame(orientation, false);
    interactionFrameRendererRef.current = drawInteraction;
    renderFrame(sphereInteracting ? orientationRef.current : currentSettings.orientation);
    return () => {
      if (interactionFrameRendererRef.current === drawInteraction) interactionFrameRendererRef.current = null;
    };
  }, [renderSignature, state.mediaAssets, layoutPoints, pipeline, registryVersion,
    surfaceVersion, fallback, viewportInteracting, sphereInteracting, sceneFrame.kind,
    sceneFrame.rect?.x, sceneFrame.rect?.y, sceneFrame.rect?.width, sceneFrame.rect?.height]);

  if (sceneFrame.rect === null) {
    return null;
  }

  const readyImageCount = getReadyLogoSphereImages(
    getLogoSphereSourceAssets(state.mediaAssets),
  ).length;
  const authoredBackground = state.values["appearance.background"];
  const surfaceBackgroundColor =
    sceneFrame.kind === "finite" &&
    state.values["export.includeBackground"] !== false &&
    typeof authoredBackground === "string" &&
    authoredBackground.trim().length > 0
      ? authoredBackground
      : undefined;

  return (
    <div
      className={styles.surface}
      style={
        surfaceBackgroundColor
          ? { backgroundColor: surfaceBackgroundColor }
          : undefined
      }
    >
      <canvas
        aria-label="Interactive logo sphere"
        className={styles.canvas}
        data-canvas-model-layer="logo-sphere"
        data-logo-count={Math.round(settings.visibleCount)}
        data-orbit-position={JSON.stringify(settings.orientation.position)}
        data-orbit-up={JSON.stringify(settings.orientation.up)}
        data-presentation-cache-key="logo-sphere-image-registry"
        data-presentation-document-id="logo-sphere-scene"
        data-ready-image-count={readyImageCount}
        data-render-quality="full"
        data-timeline-progress={
          state.timeline.durationSeconds > 0
            ? String(
                (((state.timeline.currentTimeSeconds /
                  state.timeline.durationSeconds) %
                  1) +
                  1) %
                  1,
              )
            : "0"
        }
        data-toolcraft-model-orbit-surface="true"
        data-toolcraft-product-output="logo-sphere"
        onLostPointerCapture={(event) =>
          finishPointer(event, orbitHandlers.onLostPointerCapture)
        }
        onPointerCancel={(event) =>
          finishPointer(event, orbitHandlers.onPointerCancel)
        }
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(event) => finishPointer(event, orbitHandlers.onPointerUp)}
        onWheel={onWheel}
        key={fallback ? "canvas-2d" : "webgl2"}
        ref={mountCanvas}
      />

    </div>
  );
}
