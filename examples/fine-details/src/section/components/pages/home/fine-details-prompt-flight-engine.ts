import { getSectionRect } from '@/section/reference/reference-geometry';
'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { useReducedMotion } from 'motion/react';

import type {
  FineDetailsPromptFlightFrame,
  FineDetailsPromptFlightHandle,
  FineDetailsPromptFlightState,
} from './fine-details-draggable-prompt';
import { resolveFineDetailsOwnedFlightTarget } from './fine-details-draggable-prompt-geometry';
import {
  createFlightSchedule,
  resolveBreadcrumbDropPlan,
  resolveFlightTarget,
} from './fine-details-prompt-flight';
import {
  applyFineDetailsPromptFlightCancellation,
  applyFineDetailsPromptFlightLandedLayoutReconciliation,
} from './fine-details-prompt-flight-controller';
import {
  createFineDetailsPromptFlightTuningKey,
  resolveFineDetailsPromptFlightCommandPlan,
  resolveFineDetailsPromptFlightMotionPolicy,
  resolveFineDetailsPromptFlightTuningUpdate,
  shouldCreateFineDetailsPromptGhostRun,
  type FineDetailsPromptFlightCommandEvent,
} from './fine-details-prompt-flight-runtime';
import { shouldKeepFineDetailsPromptStationary } from './fine-details-responsive';
import type { FineDetailsPromptFlightSettings, FineDetailsSettings } from './fine-details-settings';

export interface FineDetailsPromptGhostRun {
  backgroundColor: string;
  border: string;
  borderRadius: string;
  boxShadow: string;
  delta: { x: number; y: number };
  dropPlan: number[];
  height: number;
  id: number;
  left: number;
  settings: FineDetailsPromptFlightSettings;
  subscribeFlight: (listener: (frame: FineDetailsPromptFlightFrame) => void) => () => void;
  top: number;
  width: number;
}

interface FineDetailsFlightGeometrySnapshot {
  promptHeight: number;
  promptWidth: number;
  safeBoundsBottom: number | null;
  safeBoundsLeft: number | null;
  sectionHeight: number;
  sectionWidth: number;
}

function readFlightGeometry(section: HTMLElement, prompt: HTMLElement) {
  const sectionRect = getSectionRect(section);
  const promptRect = getSectionRect(prompt);
  const safeBounds = readFlightSafeBounds(section);
  return {
    promptRect,
    safeBounds,
    sectionRect,
    snapshot: {
      promptHeight: promptRect.height,
      promptWidth: promptRect.width,
      safeBoundsBottom: safeBounds?.bottom ?? null,
      safeBoundsLeft: safeBounds?.left ?? null,
      sectionHeight: sectionRect.height,
      sectionWidth: sectionRect.width,
    } satisfies FineDetailsFlightGeometrySnapshot,
  };
}

function readFlightSafeBounds(section: HTMLElement) {
  const upperLeft = section.querySelector<HTMLElement>('[data-fine-details-upper-left-typography]');
  const lowerRight = section.querySelector<HTMLElement>(
    '[data-fine-details-lower-right-typography]',
  );
  if (!upperLeft || !lowerRight) return undefined;

  const upperLeftRect = getSectionRect(upperLeft);
  const lowerRightRect = getSectionRect(lowerRight);
  return {
    bottom: lowerRightRect.bottom,
    left: upperLeftRect.left,
    right: lowerRightRect.right,
    top: upperLeftRect.top,
  };
}

function isSameFlightGeometry(
  first: FineDetailsFlightGeometrySnapshot,
  second: FineDetailsFlightGeometrySnapshot,
) {
  return (
    first.promptHeight === second.promptHeight &&
    first.promptWidth === second.promptWidth &&
    first.safeBoundsBottom === second.safeBoundsBottom &&
    first.safeBoundsLeft === second.safeBoundsLeft &&
    first.sectionHeight === second.sectionHeight &&
    first.sectionWidth === second.sectionWidth
  );
}

function prepareFlightTarget(
  handle: FineDetailsPromptFlightHandle,
  section: HTMLElement,
  flight: FineDetailsPromptFlightSettings,
  captureDragAnchor: boolean,
) {
  const prompt = handle.getElement();
  if (!prompt) return null;

  const dragOffset = handle.getDragOffset();
  if (captureDragAnchor) handle.setLandingDragAnchor(dragOffset);
  const landingDragAnchor = handle.getLandingDragAnchor();
  const currentFlightOffset = handle.getFlightOffset();
  const geometry = readFlightGeometry(section, prompt);
  const basePromptRect = {
    height: geometry.promptRect.height,
    left: geometry.promptRect.left - dragOffset.x - currentFlightOffset.x,
    top: geometry.promptRect.top - dragOffset.y - currentFlightOffset.y,
    width: geometry.promptRect.width,
  };
  const landingOffset = resolveFlightTarget(
    flight,
    geometry.sectionRect,
    basePromptRect,
    geometry.safeBounds,
  );
  const target = resolveFineDetailsOwnedFlightTarget(landingOffset, landingDragAnchor);

  return {
    ...geometry,
    currentFlightOffset,
    delta: {
      x: target.x - currentFlightOffset.x,
      y: target.y - currentFlightOffset.y,
    },
    prompt,
    target,
  };
}

function prepareReturnTarget(handle: FineDetailsPromptFlightHandle, section: HTMLElement) {
  const prompt = handle.getElement();
  if (!prompt) return null;

  const geometry = readFlightGeometry(section, prompt);
  const currentFlightOffset = handle.getFlightOffset();
  const target = { x: 0, y: 0 };
  return {
    ...geometry,
    currentFlightOffset,
    delta: {
      x: target.x - currentFlightOffset.x,
      y: target.y - currentFlightOffset.y,
    },
    prompt,
    target,
  };
}

function createPromptGhostRun(
  prepared: NonNullable<ReturnType<typeof prepareFlightTarget>>,
  flight: FineDetailsPromptFlightSettings,
  id: number,
  motionPolicy: ReturnType<typeof resolveFineDetailsPromptFlightMotionPolicy>,
  subscribeFlight: FineDetailsPromptGhostRun['subscribeFlight'],
): FineDetailsPromptGhostRun | null {
  const pathLength = Math.hypot(prepared.delta.x, prepared.delta.y);
  if (
    !shouldCreateFineDetailsPromptGhostRun({
      ghostsEnabled: flight.ghosts,
      motionPolicy,
      pathLength,
    })
  ) {
    return null;
  }
  const dropPlan = resolveBreadcrumbDropPlan(flight, pathLength);
  if (dropPlan.length === 0) return null;

  const shell = prepared.prompt.firstElementChild ?? prepared.prompt;
  const shellStyle = getComputedStyle(shell);
  return {
    backgroundColor: shellStyle.backgroundColor,
    border: shellStyle.border,
    borderRadius: shellStyle.borderRadius,
    boxShadow: shellStyle.boxShadow,
    delta: prepared.delta,
    dropPlan,
    height: prepared.promptRect.height,
    id,
    left: prepared.promptRect.left - prepared.sectionRect.left,
    settings: flight,
    subscribeFlight,
    top: prepared.promptRect.top - prepared.sectionRect.top,
    width: prepared.promptRect.width,
  };
}

function resetStationaryPrompt(handle: FineDetailsPromptFlightHandle) {
  handle.setLandingDragAnchor({ x: 0, y: 0 });
  handle.snapTo({ x: 0, y: 0 });
}

export function useFineDetailsPromptFlight({
  command,
  promptRef,
  sectionRef,
  settings,
}: {
  command?: FineDetailsPromptFlightCommandEvent;
  promptRef: RefObject<FineDetailsPromptFlightHandle | null>;
  sectionRef: RefObject<HTMLElement | null>;
  settings: FineDetailsSettings;
}) {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const latestSettingsRef = useRef(settings);
  const shouldReduceMotionRef = useRef(shouldReduceMotion);
  const geometrySnapshotRef = useRef<FineDetailsFlightGeometrySnapshot | null>(null);
  const transitionIdRef = useRef(0);
  const [flightState, setFlightState] = useState<FineDetailsPromptFlightState>('idle');
  const [ghostRun, setGhostRun] = useState<FineDetailsPromptGhostRun | null>(null);
  const flight = settings.prompt.flight;
  const flightStateRef = useRef<FineDetailsPromptFlightState>('idle');
  const previousFlightRef = useRef(flight);
  const flightTuningKey = createFineDetailsPromptFlightTuningKey(flight);
  const typographyAnchorLayoutKey = [
    settings.typography.upperLeft.left,
    settings.typography.lowerRight.bottom,
  ].join(':');
  const previousTypographyAnchorLayoutKeyRef = useRef(typographyAnchorLayoutKey);

  useLayoutEffect(() => {
    latestSettingsRef.current = settings;
  }, [settings]);

  useLayoutEffect(() => {
    shouldReduceMotionRef.current = shouldReduceMotion;
  }, [shouldReduceMotion]);

  useLayoutEffect(() => {
    flightStateRef.current = flightState;
  }, [flightState]);

  useLayoutEffect(() => {
    const previousLayoutKey = previousTypographyAnchorLayoutKeyRef.current;
    const currentSettings = latestSettingsRef.current;
    const handle = promptRef.current;
    const section = sectionRef.current;
    if (!handle || !section) return;

    applyFineDetailsPromptFlightLandedLayoutReconciliation({
      consumeLayoutKey: (layoutKey) => {
        previousTypographyAnchorLayoutKeyRef.current = layoutKey;
      },
      currentLayoutKey: typographyAnchorLayoutKey,
      flightState: flightStateRef.current,
      imagesMode: currentSettings.imagesMode,
      previousLayoutKey,
      reconcile: () => {
        const prepared = prepareFlightTarget(handle, section, currentSettings.prompt.flight, false);
        if (!prepared) return false;
        geometrySnapshotRef.current = prepared.snapshot;
        handle.snapTo(prepared.target);
        return true;
      },
    });
  }, [flightState, promptRef, sectionRef, settings.imagesMode, typographyAnchorLayoutKey]);

  useEffect(() => {
    const currentSettings = latestSettingsRef.current;
    const currentFlight = currentSettings.prompt.flight;
    const motionPolicy = resolveFineDetailsPromptFlightMotionPolicy({
      enabled: currentFlight.enabled,
      prefersReducedMotion: shouldReduceMotionRef.current,
    });
    const shouldSnap = motionPolicy === 'snap';
    const tuningUpdate = resolveFineDetailsPromptFlightTuningUpdate(
      previousFlightRef.current,
      currentFlight,
      flightStateRef.current,
    );
    previousFlightRef.current = currentFlight;
    const transitionId = ++transitionIdRef.current;
    const handle = promptRef.current;
    const section = sectionRef.current;
    const prompt = handle?.getElement();
    if (!handle || !section || !prompt) return;

    handle.flushPromptReset();
    applyFineDetailsPromptFlightCancellation(
      { cancel: handle.cancelFlight },
      {
        cancelCurrent:
          tuningUpdate.cancelCurrent ||
          flightStateRef.current === 'flying' ||
          flightStateRef.current === 'returning',
      },
    );
    setGhostRun(null);

    if (shouldKeepFineDetailsPromptStationary(getSectionRect(section).width)) {
      resetStationaryPrompt(handle);
      geometrySnapshotRef.current = readFlightGeometry(section, prompt).snapshot;
      setFlightState('idle');
      return;
    }

    if (!tuningUpdate.restartOutbound && currentSettings.imagesMode === 'loading') {
      setFlightState(
        handle.getFlightOffset().x === 0 && handle.getFlightOffset().y === 0 ? 'idle' : 'landed',
      );
      return;
    }

    if (!tuningUpdate.restartOutbound && currentSettings.imagesMode === 'trail') {
      const schedule = createFlightSchedule(currentFlight, 'return');
      const currentOffset = handle.getFlightOffset();
      handle.setLandingDragAnchor({ x: 0, y: 0 });
      if (shouldSnap) {
        handle.snapTo({ x: 0, y: 0 });
        setFlightState('idle');
        return;
      }

      if (currentOffset.x === 0 && currentOffset.y === 0) {
        setFlightState('idle');
        return;
      }

      const prepared = prepareReturnTarget(handle, section);
      if (!prepared) return;
      setFlightState('returning');
      setGhostRun(
        createPromptGhostRun(
          prepared,
          currentFlight,
          transitionId,
          motionPolicy,
          handle.subscribeFlight,
        ),
      );
      handle.flyBack(schedule, () => {
        if (transitionId === transitionIdRef.current) setFlightState('idle');
      });
      return () => handle.cancelFlight();
    }

    const prepared = prepareFlightTarget(handle, section, currentFlight, true);
    if (!prepared) return;
    geometrySnapshotRef.current = prepared.snapshot;

    if (shouldSnap) {
      handle.snapTo(prepared.target);
      setFlightState('landed');
      return;
    }

    const schedule = createFlightSchedule(currentFlight, 'outbound');
    setFlightState('flying');
    setGhostRun(
      createPromptGhostRun(
        prepared,
        currentFlight,
        transitionId,
        motionPolicy,
        handle.subscribeFlight,
      ),
    );
    handle.flyTo(prepared.target, schedule, () => {
      if (transitionId === transitionIdRef.current) setFlightState('landed');
    });

    return () => handle.cancelFlight();
  }, [flightTuningKey, promptRef, sectionRef, settings.imagesMode, shouldReduceMotion]);

  useEffect(() => {
    if (!command) return;

    const currentSettings = latestSettingsRef.current;
    const currentFlight = currentSettings.prompt.flight;
    const commandPlan = resolveFineDetailsPromptFlightCommandPlan(command.command);
    const motionPolicy = resolveFineDetailsPromptFlightMotionPolicy({
      enabled: currentFlight.enabled,
      prefersReducedMotion: shouldReduceMotionRef.current,
    });
    const handle = promptRef.current;
    const section = sectionRef.current;
    const prompt = handle?.getElement();
    if (!handle || !section || !prompt) return;

    const transitionId = ++transitionIdRef.current;
    handle.flushPromptReset();
    applyFineDetailsPromptFlightCancellation({ cancel: handle.cancelFlight }, commandPlan);
    setGhostRun(null);

    if (shouldKeepFineDetailsPromptStationary(getSectionRect(section).width)) {
      resetStationaryPrompt(handle);
      geometrySnapshotRef.current = readFlightGeometry(section, prompt).snapshot;
      setFlightState('idle');
      return;
    }

    if (commandPlan.kind === 'reset-to-base') {
      const prepared = prepareReturnTarget(handle, section);
      handle.setLandingDragAnchor({ x: 0, y: 0 });
      geometrySnapshotRef.current = readFlightGeometry(section, prompt).snapshot;
      if (
        !prepared ||
        motionPolicy === 'snap' ||
        Math.hypot(prepared.delta.x, prepared.delta.y) === 0
      ) {
        handle.snapTo({ x: 0, y: 0 });
        setFlightState('idle');
        return;
      }

      const schedule = createFlightSchedule(currentFlight, 'return');
      setFlightState('returning');
      setGhostRun(
        createPromptGhostRun(
          prepared,
          currentFlight,
          transitionId,
          motionPolicy,
          handle.subscribeFlight,
        ),
      );
      handle.flyBack(schedule, () => {
        if (transitionId === transitionIdRef.current) setFlightState('idle');
      });
      return () => handle.cancelFlight();
    }

    handle.setLandingDragAnchor(handle.getDragOffset());
    handle.snapTo({ x: 0, y: 0 });
    const prepared = prepareFlightTarget(handle, section, currentFlight, false);
    if (!prepared) return;
    geometrySnapshotRef.current = prepared.snapshot;

    if (motionPolicy === 'snap') {
      handle.snapTo(prepared.target);
      setFlightState('landed');
      return;
    }

    const schedule = createFlightSchedule(currentFlight, 'outbound');
    setFlightState('flying');
    setGhostRun(
      createPromptGhostRun(
        prepared,
        currentFlight,
        transitionId,
        motionPolicy,
        handle.subscribeFlight,
      ),
    );
    handle.flyTo(prepared.target, schedule, () => {
      if (transitionId === transitionIdRef.current) setFlightState('landed');
    });

    return () => handle.cancelFlight();
  }, [command, promptRef, sectionRef]);

  useEffect(() => {
    const handle = promptRef.current;
    const section = sectionRef.current;
    const prompt = handle?.getElement();
    if (!handle || !section || !prompt) return;

    geometrySnapshotRef.current = readFlightGeometry(section, prompt).snapshot;

    function reconcileFlightGeometry() {
      const currentPrompt = handle?.getElement();
      if (!handle || !section || !currentPrompt) return;
      const nextGeometry = readFlightGeometry(section, currentPrompt);
      const previousGeometry = geometrySnapshotRef.current;
      geometrySnapshotRef.current = nextGeometry.snapshot;
      if (previousGeometry && isSameFlightGeometry(previousGeometry, nextGeometry.snapshot)) return;

      const currentSettings = latestSettingsRef.current;
      if (shouldKeepFineDetailsPromptStationary(nextGeometry.sectionRect.width)) {
        ++transitionIdRef.current;
        handle.flushPromptReset();
        handle.cancelFlight();
        setGhostRun(null);
        resetStationaryPrompt(handle);
        setFlightState('idle');
        return;
      }
      if (currentSettings.imagesMode !== 'carousel') return;

      ++transitionIdRef.current;
      handle.flushPromptReset();
      handle.cancelFlight();
      setGhostRun(null);
      const prepared = prepareFlightTarget(handle, section, currentSettings.prompt.flight, false);
      if (!prepared) return;
      geometrySnapshotRef.current = prepared.snapshot;
      handle.snapTo(prepared.target);
      setFlightState('landed');
    }

    const observer = new ResizeObserver(reconcileFlightGeometry);
    const upperLeftTypography = section.querySelector<HTMLElement>(
      '[data-fine-details-upper-left-typography]',
    );
    const lowerRightTypography = section.querySelector<HTMLElement>(
      '[data-fine-details-lower-right-typography]',
    );
    observer.observe(section);
    observer.observe(prompt);
    if (upperLeftTypography) observer.observe(upperLeftTypography);
    if (lowerRightTypography) observer.observe(lowerRightTypography);
    window.addEventListener('resize', reconcileFlightGeometry);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', reconcileFlightGeometry);
    };
  }, [promptRef, sectionRef]);

  const clearGhostRun = useCallback((id: number) => {
    if (id === transitionIdRef.current) setGhostRun(null);
  }, []);

  return {
    clearGhostRun,
    flightState,
    ghostRun,
  };
}
