import * as React from "react";

import {
  useToolcraftDispatch,
  useToolcraftSelector,
} from "@/toolcraft/runtime/react";

import {
  applyHeroGalleryPanDrag,
  readHeroGalleryPanDragInputs,
} from "./hero-gallery-pan";
import {
  HERO_GALLERY_DEFAULTS,
  heroGalleryTargets,
  type HeroGalleryPan,
} from "./hero-gallery-values";
import styles from "./hero-preview.module.css";

type PanGesture = {
  element: HTMLDivElement;
  historyGroup: string;
  lastClient: Readonly<{ x: number; y: number }>;
  panelPeriod: number;
  pointerId: number;
  scale: number;
  sphereWidth: number;
  startClient: Readonly<{ x: number; y: number }>;
  startPan: HeroGalleryPan;
};

let panGestureSequence = 0;

function readPan(value: unknown): HeroGalleryPan {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return HERO_GALLERY_DEFAULTS.sphere.pan;
  }

  const pan = value as Record<string, unknown>;
  return {
    x:
      typeof pan.x === "number" && Number.isFinite(pan.x)
        ? Math.min(1, Math.max(-1, pan.x))
        : HERO_GALLERY_DEFAULTS.sphere.pan.x,
    y:
      typeof pan.y === "number" && Number.isFinite(pan.y)
        ? Math.min(1, Math.max(-1, pan.y))
        : HERO_GALLERY_DEFAULTS.sphere.pan.y,
  };
}

function isUnmodifiedPrimaryPointer(
  event: Pick<
    React.PointerEvent<HTMLDivElement>,
    "altKey" | "button" | "ctrlKey" | "metaKey" | "shiftKey"
  >,
): boolean {
  return (
    event.button === 0 &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey
  );
}

export function HeroGalleryPanHandle(): React.JSX.Element | null {
  const dispatch = useToolcraftDispatch();
  const values = useToolcraftSelector((state) => state.values, Object.is);
  const gestureRef = React.useRef<PanGesture | null>(null);
  const animationFrameRef = React.useRef(0);
  const [dragging, setDragging] = React.useState(false);
  const inputs = readHeroGalleryPanDragInputs(values);
  const pan = readPan(values[heroGalleryTargets.pan]);

  const applyGesture = React.useCallback(
    (gesture: PanGesture): void => {
      const value = applyHeroGalleryPanDrag({
        deltaPx: {
          x:
            (gesture.lastClient.x - gesture.startClient.x) /
            gesture.scale,
          y:
            (gesture.lastClient.y - gesture.startClient.y) /
            gesture.scale,
        },
        panelPeriod: gesture.panelPeriod,
        sphereWidth: gesture.sphereWidth,
        start: gesture.startPan,
      });

      dispatch({
        history: "merge",
        historyGroup: gesture.historyGroup,
        label: "Pan",
        target: heroGalleryTargets.pan,
        type: "controls.setValue",
        value,
      });
    },
    [dispatch],
  );

  const flushGesture = React.useCallback(
    (gesture: PanGesture): void => {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
      applyGesture(gesture);
    },
    [applyGesture],
  );

  const finishGesture = React.useCallback(
    (gesture: PanGesture): void => {
      flushGesture(gesture);
      if (gestureRef.current === gesture) gestureRef.current = null;
      if (gesture.element.hasPointerCapture?.(gesture.pointerId)) {
        gesture.element.releasePointerCapture?.(gesture.pointerId);
      }
      setDragging(false);
    },
    [flushGesture],
  );

  React.useEffect(
    () => () => {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
      gestureRef.current = null;
    },
    [],
  );

  if (inputs.type !== "sphere") return null;

  return (
    <div
      aria-label="Drag to pan the gallery panel"
      className={styles.panHandle}
      data-hero-gallery-pan-handle-state={dragging ? "dragging" : "idle"}
      data-testid="hero-gallery-pan-handle"
      data-toolcraft-canvas-handle="hero-gallery-pan"
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
          if (activeGesture.pointerId !== event.pointerId) {
            finishGesture(activeGesture);
          }
          return;
        }
        if (!isUnmodifiedPrimaryPointer(event)) return;

        event.preventDefault();
        event.stopPropagation();
        const element = event.currentTarget;
        const bounds = element.getBoundingClientRect();
        const scale = bounds.width / Math.max(1, element.offsetWidth);
        const gesture: PanGesture = {
          element,
          historyGroup: `hero-gallery-pan:${++panGestureSequence}`,
          lastClient: { x: event.clientX, y: event.clientY },
          panelPeriod: inputs.panelPeriod,
          pointerId: event.pointerId,
          scale: Math.max(0.0001, scale),
          sphereWidth: inputs.sphereWidth,
          startClient: { x: event.clientX, y: event.clientY },
          startPan: pan,
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
        gesture.lastClient = { x: event.clientX, y: event.clientY };
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
        gesture.lastClient = { x: event.clientX, y: event.clientY };
        finishGesture(gesture);
      }}
      role="application"
    />
  );
}
