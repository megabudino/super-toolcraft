"use client";

import * as React from "react";
import { createControlHistoryGroupId } from "@/toolcraft/ui";

import { useToolcraft } from "../use-toolcraft";
import {
  getToolcraftOrientationPoseFromPointerDelta,
  readToolcraftOrientationPose,
} from "./orientation-math";

export type ToolcraftModelOrbitHitTest = (
  clientX: number,
  clientY: number,
) => boolean;

export type ToolcraftModelOrbitInteractionOptions = {
  enabled?: boolean;
  hitTest: ToolcraftModelOrbitHitTest;
  historyLabel?: string;
  target: string;
};

export type ToolcraftModelOrbitInteractionHandlers<
  Element extends HTMLElement,
> = {
  onLostPointerCapture: React.PointerEventHandler<Element>;
  onPointerCancel: React.PointerEventHandler<Element>;
  onPointerDown: React.PointerEventHandler<Element>;
  onPointerMove: React.PointerEventHandler<Element>;
  onPointerUp: React.PointerEventHandler<Element>;
};

type OrbitGesture<Element extends HTMLElement> = {
  element: Element;
  historyGroup: string;
  lastX: number;
  lastY: number;
  pendingDeltaX: number;
  pendingDeltaY: number;
  pointerId: number;
  viewportHeight: number;
};

export function useToolcraftModelOrbitInteraction<
  Element extends HTMLElement = HTMLElement,
>({
  enabled = true,
  historyLabel = "Model orbit",
  hitTest,
  target,
}: ToolcraftModelOrbitInteractionOptions): ToolcraftModelOrbitInteractionHandlers<Element> {
  const { dispatch, state } = useToolcraft();
  const stateRef = React.useRef(state);
  const gestureRef = React.useRef<OrbitGesture<Element> | null>(null);
  const animationFrameRef = React.useRef(0);
  stateRef.current = state;

  const applyPendingDelta = React.useCallback((): void => {
    const gesture = gestureRef.current;
    animationFrameRef.current = 0;

    if (
      !gesture ||
      (gesture.pendingDeltaX === 0 && gesture.pendingDeltaY === 0)
    ) {
      return;
    }

    const deltaX = gesture.pendingDeltaX;
    const deltaY = gesture.pendingDeltaY;
    gesture.pendingDeltaX = 0;
    gesture.pendingDeltaY = 0;
    const currentState = stateRef.current;
    const pose = readToolcraftOrientationPose(
      currentState.values[target],
      readToolcraftOrientationPose(currentState.defaults[target]),
    );

    dispatch({
      history: "merge",
      historyGroup: gesture.historyGroup,
      label: historyLabel,
      target,
      type: "controls.setValue",
      value: getToolcraftOrientationPoseFromPointerDelta(
        pose,
        deltaX,
        deltaY,
        gesture.viewportHeight,
      ),
    });
  }, [dispatch, historyLabel, target]);

  const finishGesture = React.useCallback(
    (event: React.PointerEvent<Element>): void => {
      const gesture = gestureRef.current;

      if (!gesture || gesture.pointerId !== event.pointerId) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
      applyPendingDelta();
      gestureRef.current = null;
      if (gesture.element.hasPointerCapture?.(gesture.pointerId)) {
        gesture.element.releasePointerCapture?.(gesture.pointerId);
      }
    },
    [applyPendingDelta],
  );

  React.useEffect(
    () => () => {
      window.cancelAnimationFrame(animationFrameRef.current);
      const gesture = gestureRef.current;
      gestureRef.current = null;
      if (gesture?.element.hasPointerCapture?.(gesture.pointerId)) {
        gesture.element.releasePointerCapture?.(gesture.pointerId);
      }
    },
    [enabled, target],
  );

  const onPointerDown = React.useCallback<React.PointerEventHandler<Element>>(
    (event) => {
      if (
        !enabled ||
        event.button !== 0 ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        !hitTest(event.clientX, event.clientY)
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      const bounds = event.currentTarget.getBoundingClientRect();
      gestureRef.current = {
        element: event.currentTarget,
        historyGroup: createControlHistoryGroupId("model-orbit"),
        lastX: event.clientX,
        lastY: event.clientY,
        pendingDeltaX: 0,
        pendingDeltaY: 0,
        pointerId: event.pointerId,
        viewportHeight: Math.max(1, bounds.height),
      };
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    [enabled, hitTest],
  );

  const onPointerMove = React.useCallback<React.PointerEventHandler<Element>>(
    (event) => {
      const gesture = gestureRef.current;

      if (!gesture || gesture.pointerId !== event.pointerId) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      gesture.pendingDeltaX += event.clientX - gesture.lastX;
      gesture.pendingDeltaY += event.clientY - gesture.lastY;
      gesture.lastX = event.clientX;
      gesture.lastY = event.clientY;

      if (animationFrameRef.current === 0) {
        animationFrameRef.current =
          window.requestAnimationFrame(applyPendingDelta);
      }
    },
    [applyPendingDelta],
  );

  return {
    onLostPointerCapture: finishGesture,
    onPointerCancel: finishGesture,
    onPointerDown,
    onPointerMove,
    onPointerUp: finishGesture,
  };
}
