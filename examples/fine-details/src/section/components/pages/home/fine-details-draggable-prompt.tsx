import { referenceClasses } from '@/section/reference/reference-classes';
import { getSectionRect, getSectionPoint } from '@/section/reference/reference-geometry';
'use client';

import {
  type CSSProperties,
  forwardRef,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type TransitionEvent as ReactTransitionEvent,
  useEffect,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from 'react';

import {
  setFineDetailsPromptBridgeGeometry,
  subscribeFineDetailsPromptBridgeGesture,
  type FineDetailsPromptBridgeGesture,
} from './fine-details-prompt-drag-bridge';
import {
  clampFineDetailsPromptOffset,
  type FineDetailsPromptFlightTrajectory,
  type FineDetailsPromptOffset,
  getFineDetailsPromptOffsetBounds,
  getFineDetailsPromptResetDuration,
  getFineDetailsPromptSceneRect,
  resolveFineDetailsLandingResetFlight,
  resolveFineDetailsLandingResetTrajectory,
} from './fine-details-draggable-prompt-geometry';
import {
  resolveFlightDistance,
  resolveFlightProgress,
  type FineDetailsFlightSchedule,
} from './fine-details-prompt-flight';
import {
  createFineDetailsPromptFlightController,
  type FineDetailsPromptFlightController,
} from './fine-details-prompt-flight-controller';
import styles from './fine-details-draggable-prompt.module.css';

const promptResetEasing = 'cubic-bezier(0.22, 1, 0.36, 1)';
const interactivePromptSelector = [
  'a',
  'button',
  'input',
  'label',
  'option',
  'select',
  'summary',
  'textarea',
  '[aria-haspopup]',
  '[aria-pressed]',
  '[contenteditable]:not([contenteditable="false"])',
  '[data-fine-details-prompt-no-drag]',
  '[draggable="true"]',
  '[href]',
  '[onclick]',
  '[role="button"]',
  '[role="checkbox"]',
  '[role="combobox"]',
  '[role="link"]',
  '[role="listbox"]',
  '[role="menuitem"]',
  '[role="option"]',
  '[role="radio"]',
  '[role="slider"]',
  '[role="spinbutton"]',
  '[role="switch"]',
  '[role="tab"]',
  '[role="textbox"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

type FineDetailsPromptStyle = CSSProperties & {
  '--fine-details-prompt-drag-x': string;
  '--fine-details-prompt-drag-y': string;
};

export type FineDetailsPromptFlightState = 'flying' | 'idle' | 'landed' | 'returning';

export interface FineDetailsPromptFlightFrame {
  distance: number;
  offset: FineDetailsPromptOffset;
  pathLength: number;
  phase: 'flying' | 'settling' | 'waiting';
}

export interface FineDetailsPromptFlightHandle {
  cancelFlight: () => void;
  flushPromptReset: () => void;
  flyBack: (schedule: FineDetailsFlightSchedule, onComplete: () => void) => void;
  flyTo: (
    offset: FineDetailsPromptOffset,
    schedule: FineDetailsFlightSchedule,
    onComplete: () => void,
  ) => void;
  getDragOffset: () => FineDetailsPromptOffset;
  getElement: () => HTMLDivElement | null;
  getFlightOffset: () => FineDetailsPromptOffset;
  getLandingDragAnchor: () => FineDetailsPromptOffset;
  setLandingDragAnchor: (offset: FineDetailsPromptOffset) => void;
  snapTo: (offset: FineDetailsPromptOffset) => void;
  subscribeFlight: (listener: (frame: FineDetailsPromptFlightFrame) => void) => () => void;
}

interface FineDetailsDraggablePromptProps {
  baseTransform: string;
  children: ReactNode;
  className?: string;
  dragEnabled: boolean;
  flightState?: FineDetailsPromptFlightState;
  onRootElementChange?: (element: HTMLDivElement | null) => void;
  style?: CSSProperties;
}

function isInteractivePromptTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(interactivePromptSelector) !== null;
}

export const FineDetailsDraggablePrompt = forwardRef<
  FineDetailsPromptFlightHandle,
  FineDetailsDraggablePromptProps
>(function FineDetailsDraggablePrompt(
  {
    baseTransform,
    children,
    className,
    dragEnabled,
    flightState = 'idle',
    onRootElementChange,
    style,
  },
  forwardedRef,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const flightLayerRef = useRef<HTMLDivElement>(null);
  const resetCompensationLayerRef = useRef<HTMLDivElement>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const activePointerSourceRef = useRef<'bridge' | 'native' | null>(null);
  const currentOffsetRef = useRef<FineDetailsPromptOffset>({ x: 0, y: 0 });
  const dragEnabledRef = useRef(dragEnabled);
  const dragStartOffsetRef = useRef<FineDetailsPromptOffset>({ x: 0, y: 0 });
  const dragStartPointerRef = useRef<FineDetailsPromptOffset>({ x: 0, y: 0 });
  const hasTransientOffsetRef = useRef(false);
  const isResettingRef = useRef(false);
  const flightControllerRef =
    useRef<FineDetailsPromptFlightController<FineDetailsPromptFlightFrame> | null>(null);
  const flightOffsetRef = useRef<FineDetailsPromptOffset>({ x: 0, y: 0 });
  const activeFlightTrajectoryRef = useRef<FineDetailsPromptFlightTrajectory | null>(null);
  const flightStateRef = useRef(flightState);
  const landingDragAnchorRef = useRef<FineDetailsPromptOffset>({ x: 0, y: 0 });
  const pendingLandingResetAnchorRef = useRef<FineDetailsPromptOffset | null>(null);
  const setRootElement = useCallback(
    (element: HTMLDivElement | null) => {
      rootRef.current = element;
      onRootElementChange?.(element);
    },
    [onRootElementChange],
  );

  function getSection() {
    return rootRef.current?.closest<HTMLElement>('[data-fine-details-section]') ?? null;
  }

  function getVisualPromptElement() {
    return resetCompensationLayerRef.current;
  }

  function getFlightController() {
    flightControllerRef.current ??= createFineDetailsPromptFlightController({
      cancelAnimationFrame: (id) => window.cancelAnimationFrame(id),
      clearTimeout: (id) => window.clearTimeout(id),
      now: () => performance.now(),
      requestAnimationFrame: (callback) => window.requestAnimationFrame(callback),
      setTimeout: (callback, delay) => window.setTimeout(callback, delay),
    });
    return flightControllerRef.current;
  }

  function publishGeometry() {
    if (!dragEnabledRef.current || isResettingRef.current) {
      setFineDetailsPromptBridgeGeometry({ interactiveRects: [], rect: null });
      return;
    }

    const root = rootRef.current;
    const visualPrompt = getVisualPromptElement();
    const section = getSection();
    if (!root || !visualPrompt || !section) return;

    const sceneHeight = Number(section.dataset.fineDetailsHeight);
    if (!Number.isFinite(sceneHeight) || sceneHeight <= 0) return;

    const sectionRect = getSectionRect(section);
    const interactiveRects = Array.from(
      root.querySelectorAll<HTMLElement>(interactivePromptSelector),
    )
      .map((element) => getSectionRect(element))
      .filter((rect) => rect.width > 0 && rect.height > 0)
      .map((rect) => getFineDetailsPromptSceneRect(sectionRect, rect, sceneHeight));

    setFineDetailsPromptBridgeGeometry({
      interactiveRects,
      rect: getFineDetailsPromptSceneRect(
        sectionRect,
        getSectionRect(visualPrompt),
        sceneHeight,
      ),
    });
  }

  function applyOffset(offset: FineDetailsPromptOffset, shouldPublishGeometry = true) {
    const root = rootRef.current;
    currentOffsetRef.current = offset;
    hasTransientOffsetRef.current = offset.x !== 0 || offset.y !== 0;
    if (!root) return;

    root.style.setProperty('--fine-details-prompt-drag-x', `${offset.x}px`);
    root.style.setProperty('--fine-details-prompt-drag-y', `${offset.y}px`);
    root.dataset.fineDetailsPromptOffset = `${offset.x.toFixed(2)}:${offset.y.toFixed(2)}`;
    if (shouldPublishGeometry) publishGeometry();
  }

  function applyFlightOffset(offset: FineDetailsPromptOffset, shouldPublishGeometry = true) {
    flightOffsetRef.current = offset;
    const flightLayer = flightLayerRef.current;
    if (!flightLayer) return;

    flightLayer.style.setProperty('--fine-details-prompt-fly-x', `${offset.x}px`);
    flightLayer.style.setProperty('--fine-details-prompt-fly-y', `${offset.y}px`);
    if (shouldPublishGeometry) publishGeometry();
  }

  function publishFlightFrame(frame: FineDetailsPromptFlightFrame) {
    getFlightController().publish(frame);
  }

  function applyResetCompensation(offset: FineDetailsPromptOffset) {
    const resetCompensationLayer = resetCompensationLayerRef.current;
    if (!resetCompensationLayer) return;

    resetCompensationLayer.style.setProperty(
      '--fine-details-prompt-reset-compensation-x',
      `${offset.x}px`,
    );
    resetCompensationLayer.style.setProperty(
      '--fine-details-prompt-reset-compensation-y',
      `${offset.y}px`,
    );
  }

  function completeLandingResetCompensation() {
    const landingDragAnchor = pendingLandingResetAnchorRef.current;
    if (!landingDragAnchor) return;

    pendingLandingResetAnchorRef.current = null;
    const resetCompensationLayer = resetCompensationLayerRef.current;
    if (resetCompensationLayer) resetCompensationLayer.style.transition = 'none';
    const activeFlightTrajectory = activeFlightTrajectoryRef.current;
    if (activeFlightTrajectory) {
      const adjustedTrajectory = resolveFineDetailsLandingResetTrajectory(
        activeFlightTrajectory,
        landingDragAnchor,
      );
      activeFlightTrajectory.start = adjustedTrajectory.start;
      activeFlightTrajectory.target = adjustedTrajectory.target;
    }
    applyFlightOffset(
      resolveFineDetailsLandingResetFlight(flightOffsetRef.current, landingDragAnchor),
      false,
    );
    applyResetCompensation({ x: 0, y: 0 });
    landingDragAnchorRef.current = { x: 0, y: 0 };
  }

  function flushPromptReset() {
    if (!isResettingRef.current && !pendingLandingResetAnchorRef.current) return;

    const root = rootRef.current;
    if (root) root.style.transition = 'none';
    isResettingRef.current = false;
    completeLandingResetCompensation();
    publishGeometry();
  }

  function cancelFlight() {
    getFlightController().cancel();
    activeFlightTrajectoryRef.current = null;
  }

  function startFlight(
    target: FineDetailsPromptOffset,
    schedule: FineDetailsFlightSchedule,
    onComplete: () => void,
  ) {
    cancelFlight();
    const trajectory = {
      start: { ...flightOffsetRef.current },
      target: { ...target },
    } satisfies FineDetailsPromptFlightTrajectory;
    const pathLength = Math.hypot(
      trajectory.target.x - trajectory.start.x,
      trajectory.target.y - trajectory.start.y,
    );
    activeFlightTrajectoryRef.current = trajectory;
    publishFlightFrame({
      distance: 0,
      offset: trajectory.start,
      pathLength,
      phase: 'waiting',
    });

    getFlightController().start({
      duration: schedule.flightTime,
      onComplete: () => {
        activeFlightTrajectoryRef.current = null;
        applyFlightOffset(trajectory.target);
        publishFlightFrame({
          distance: pathLength,
          offset: trajectory.target,
          pathLength,
          phase: 'settling',
        });
        onComplete();
      },
      onProgress: (progress) => {
        const easedProgress = resolveFlightProgress(progress, schedule.ease);
        applyFlightOffset({
          x: trajectory.start.x + (trajectory.target.x - trajectory.start.x) * easedProgress,
          y: trajectory.start.y + (trajectory.target.y - trajectory.start.y) * easedProgress,
        });
        publishFlightFrame({
          distance: resolveFlightDistance(easedProgress, pathLength),
          offset: flightOffsetRef.current,
          pathLength,
          phase: 'flying',
        });
      },
      startDelay: schedule.startDelay,
    });
  }

  function clampOffset(offset: FineDetailsPromptOffset) {
    const visualPrompt = getVisualPromptElement();
    const section = getSection();
    if (!visualPrompt || !section) return offset;

    return clampFineDetailsPromptOffset(
      offset,
      getFineDetailsPromptOffsetBounds(
        getSectionRect(section),
        getSectionRect(visualPrompt),
        currentOffsetRef.current,
      ),
    );
  }

  function finishPointer(pointerId: number) {
    if (activePointerIdRef.current !== pointerId) return;
    activePointerIdRef.current = null;
    activePointerSourceRef.current = null;

    const root = rootRef.current;
    if (!root) return;
    root.dataset.fineDetailsPromptDragging = 'false';
    if (root.hasPointerCapture(pointerId)) root.releasePointerCapture(pointerId);
  }

  function cancelActivePointer() {
    const pointerId = activePointerIdRef.current;
    activePointerIdRef.current = null;
    activePointerSourceRef.current = null;

    const root = rootRef.current;
    if (!root) return;
    root.dataset.fineDetailsPromptDragging = 'false';
    if (pointerId !== null && root.hasPointerCapture(pointerId)) {
      root.releasePointerCapture(pointerId);
    }
  }

  function resetPrompt() {
    if (!dragEnabledRef.current || isResettingRef.current) return;

    const root = rootRef.current;
    if (!root) return;

    const duration = getFineDetailsPromptResetDuration(
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
    const hadTransientOffset = hasTransientOffsetRef.current;
    const shouldAnimate = duration > 0 && hadTransientOffset;
    const landingDragAnchor = landingDragAnchorRef.current;
    const shouldCompensateLanding =
      (flightStateRef.current === 'flying' || flightStateRef.current === 'landed') &&
      (landingDragAnchor.x !== 0 || landingDragAnchor.y !== 0);
    const resetCompensationLayer = resetCompensationLayerRef.current;
    setFineDetailsPromptBridgeGeometry({ interactiveRects: [], rect: null });
    isResettingRef.current = shouldAnimate;
    root.style.transition = shouldAnimate ? `transform ${duration}ms ${promptResetEasing}` : 'none';
    pendingLandingResetAnchorRef.current = shouldCompensateLanding ? landingDragAnchor : null;
    if (resetCompensationLayer) {
      resetCompensationLayer.style.transition =
        shouldAnimate && shouldCompensateLanding
          ? `transform ${duration}ms ${promptResetEasing}`
          : 'none';
    }
    applyOffset({ x: 0, y: 0 }, false);
    if (shouldCompensateLanding) applyResetCompensation(landingDragAnchor);
    if (duration === 0 || !hadTransientOffset) {
      isResettingRef.current = false;
      completeLandingResetCompensation();
      publishGeometry();
    }
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (
      !dragEnabled ||
      (event.pointerType === 'touch' && (getSection()?.offsetWidth ?? 1920) < 1280) ||
      activePointerIdRef.current !== null ||
      !event.isPrimary ||
      event.button !== 0 ||
      isInteractivePromptTarget(event.target)
    ) {
      return;
    }

    event.preventDefault();
    const wasResetting = isResettingRef.current;
    isResettingRef.current = false;
    activePointerIdRef.current = event.pointerId;
    activePointerSourceRef.current = 'native';
    dragStartPointerRef.current = getSectionPoint(event.currentTarget, event);
    dragStartOffsetRef.current = currentOffsetRef.current;
    event.currentTarget.style.transition = 'none';
    if (wasResetting) {
      completeLandingResetCompensation();
      publishGeometry();
    }
    event.currentTarget.dataset.fineDetailsPromptDragging = 'true';
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragEnabled) {
      cancelActivePointer();
      return;
    }

    if (
      activePointerIdRef.current !== event.pointerId ||
      activePointerSourceRef.current !== 'native'
    ) {
      return;
    }

    const pointer = getSectionPoint(event.currentTarget, event);
    const candidate = {
      x: dragStartOffsetRef.current.x + pointer.x - dragStartPointerRef.current.x,
      y: dragStartOffsetRef.current.y + pointer.y - dragStartPointerRef.current.y,
    };
    applyOffset(clampOffset(candidate));
  }

  function handleDoubleClick(event: ReactMouseEvent<HTMLDivElement>) {
    if (!dragEnabled || isInteractivePromptTarget(event.target)) return;

    event.preventDefault();
    resetPrompt();
  }

  function handleTransitionEnd(event: ReactTransitionEvent<HTMLDivElement>) {
    if (event.currentTarget !== event.target || event.propertyName !== 'transform') return;
    event.currentTarget.style.transition = 'none';
    isResettingRef.current = false;
    completeLandingResetCompensation();
    if (!dragEnabled) {
      setFineDetailsPromptBridgeGeometry({ interactiveRects: [], rect: null });
      return;
    }
    publishGeometry();
  }

  useLayoutEffect(() => {
    dragEnabledRef.current = dragEnabled;
  }, [dragEnabled]);

  useLayoutEffect(() => {
    flightStateRef.current = flightState;
  }, [flightState]);

  useImperativeHandle(forwardedRef, () => ({
    cancelFlight,
    flushPromptReset,
    flyBack: (schedule, onComplete) => startFlight({ x: 0, y: 0 }, schedule, onComplete),
    flyTo: startFlight,
    getDragOffset: () => currentOffsetRef.current,
    getElement: getVisualPromptElement,
    getFlightOffset: () => flightOffsetRef.current,
    getLandingDragAnchor: () => landingDragAnchorRef.current,
    setLandingDragAnchor: (offset) => {
      landingDragAnchorRef.current = offset;
    },
    snapTo: (offset) => {
      cancelFlight();
      applyFlightOffset(offset);
    },
    subscribeFlight: (listener) => {
      return getFlightController().subscribe(listener);
    },
  }));

  useLayoutEffect(() => {
    if (!dragEnabled) {
      cancelActivePointer();
      isResettingRef.current = false;
      const root = rootRef.current;
      if (root) root.style.transition = 'none';
      applyOffset({ x: 0, y: 0 }, false);
      setFineDetailsPromptBridgeGeometry({ interactiveRects: [], rect: null });
      return;
    }

    if (hasTransientOffsetRef.current) {
      applyOffset(clampOffset(currentOffsetRef.current));
    } else {
      publishGeometry();
    }
  }, [baseTransform, dragEnabled, style?.left, style?.top]);

  useEffect(() => {
    function handleResize() {
      if (!dragEnabledRef.current) {
        setFineDetailsPromptBridgeGeometry({ interactiveRects: [], rect: null });
        return;
      }

      if (hasTransientOffsetRef.current) {
        applyOffset(clampOffset(currentOffsetRef.current));
      } else {
        publishGeometry();
      }
    }

    window.addEventListener('resize', handleResize);
    const observer = new ResizeObserver(handleResize);
    const root = rootRef.current;
    const visualPrompt = getVisualPromptElement();
    const section = getSection();
    if (root) observer.observe(root);
    if (visualPrompt) observer.observe(visualPrompt);
    if (section) observer.observe(section);
    if (root) {
      for (const element of root.querySelectorAll<HTMLElement>(interactivePromptSelector)) {
        observer.observe(element);
      }
    }

    const unsubscribeGesture = subscribeFineDetailsPromptBridgeGesture(
      (gesture: FineDetailsPromptBridgeGesture) => {
        const currentRoot = rootRef.current;
        const currentSection = getSection();
        if (!dragEnabledRef.current || !currentRoot || !currentSection) return;

        if (gesture.phase === 'double-click') {
          if (activePointerIdRef.current === null) resetPrompt();
          return;
        }

        if (gesture.phase === 'down') {
          if (activePointerIdRef.current !== null) return;
          activePointerIdRef.current = gesture.pointerId;
          activePointerSourceRef.current = 'bridge';
          dragStartPointerRef.current = { x: gesture.x, y: gesture.y };
          dragStartOffsetRef.current = currentOffsetRef.current;
          currentRoot.style.transition = 'none';
          currentRoot.dataset.fineDetailsPromptDragging = 'true';
          return;
        }

        if (
          activePointerIdRef.current !== gesture.pointerId ||
          activePointerSourceRef.current !== 'bridge'
        ) {
          return;
        }

        if (gesture.phase === 'move') {
          const sectionRect = getSectionRect(currentSection);
          const sceneHeight = Number(currentSection.dataset.fineDetailsHeight);
          if (!Number.isFinite(sceneHeight) || sceneHeight <= 0) return;

          applyOffset(
            clampOffset({
              x:
                dragStartOffsetRef.current.x +
                ((gesture.x - dragStartPointerRef.current.x) / 1920) * sectionRect.width,
              y:
                dragStartOffsetRef.current.y +
                ((gesture.y - dragStartPointerRef.current.y) / sceneHeight) * sectionRect.height,
            }),
          );
          return;
        }

        if (gesture.phase === 'up' || gesture.phase === 'cancel') {
          finishPointer(gesture.pointerId);
        }
      },
    );

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
      unsubscribeGesture();
      cancelFlight();
      cancelActivePointer();
      setFineDetailsPromptBridgeGeometry({ interactiveRects: [], rect: null });
    };
  }, []);

  const promptStyle: FineDetailsPromptStyle = {
    ...style,
    '--fine-details-prompt-drag-x': '0px',
    '--fine-details-prompt-drag-y': '0px',
    transform: `${baseTransform} translate3d(var(--fine-details-prompt-drag-x), var(--fine-details-prompt-drag-y), 0)`,
  };

  return (
    <div
      ref={setRootElement}
      className={referenceClasses([styles.root, className].filter(Boolean).join(' '))}
      data-fine-details-prompt
      data-fine-details-prompt-drag-root
      data-fine-details-prompt-drag-enabled={dragEnabled ? 'true' : 'false'}
      data-fine-details-prompt-dragging="false"
      data-fine-details-prompt-flight={flightState}
      data-fine-details-prompt-offset="0.00:0.00"
      onDoubleClick={handleDoubleClick}
      onLostPointerCapture={(event) => finishPointer(event.pointerId)}
      onPointerCancel={(event) => finishPointer(event.pointerId)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={(event) => finishPointer(event.pointerId)}
      onTransitionEnd={handleTransitionEnd}
      style={promptStyle}
    >
      <div
        ref={flightLayerRef}
        className={referenceClasses(styles.flightLayer)}
        data-fine-details-prompt-flight-layer
      >
        <div
          ref={resetCompensationLayerRef}
          className={referenceClasses(styles.resetCompensationLayer)}
          data-fine-details-prompt-reset-compensation-layer
        >
          {children}
        </div>
      </div>
    </div>
  );
});
