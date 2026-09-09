import * as React from "react";

import {
  getGrassScreenPointerDirection,
  GrassPointerDirectionController,
  GrassPointerInputController,
  type GrassPointerPoint,
} from "./grass-pointer-direction";
import type { GrassSceneRenderer } from "./grass-scene";

export type GrassPointerMotionSample = Readonly<{
  active: boolean;
  screenDirection: GrassPointerPoint;
  terrainHit: boolean;
}>;

export function useGrassPointerDirection(
  options: Readonly<{
    enabled: boolean;
    hostRef: React.RefObject<HTMLDivElement | null>;
    onDirection?: (sample: GrassPointerMotionSample) => void;
    onInteraction: () => void;
    scene: GrassSceneRenderer | null;
  }>,
): void {
  const enabledRef = React.useRef(options.enabled);
  const onDirectionRef = React.useRef(options.onDirection);
  const onInteractionRef = React.useRef(options.onInteraction);
  enabledRef.current = options.enabled;
  onDirectionRef.current = options.onDirection;
  onInteractionRef.current = options.onInteraction;

  React.useEffect(() => {
    if (options.enabled) return;
    options.scene?.setPointerWindState(false);
    const host = options.hostRef.current;
    if (host) {
      host.dataset.grassPointerDirectionActive = "false";
      host.dataset.grassPointerDirectionHit = "false";
      host.dataset.grassPointerWindActive = "false";
    }
  }, [options.enabled, options.hostRef, options.scene]);

  React.useEffect(() => {
    const host = options.hostRef.current;
    const scene = options.scene;
    if (!host || !scene) return;
    const controller = new GrassPointerDirectionController();
    const inputController = new GrassPointerInputController();
    let frame = 0;
    let observedDirection = false;
    let pendingPoint: Readonly<{ clientX: number; clientY: number }> | null =
      null;
    let previousScreenPoint: GrassPointerPoint | null = null;

    const clearPointer = (): void => {
      const snapshot = controller.leave();
      scene.setPointerWindState(false);
      host.dataset.grassPointerDirectionActive = "false";
      host.dataset.grassPointerDirectionHit = "false";
      host.dataset.grassPointerScreenDirectionActive = "false";
      host.dataset.grassPointerScreenDirectionVector = "[0,0]";
      host.dataset.grassPointerWindActive = "false";
      host.dataset.grassTouchActive = "false";
      previousScreenPoint = null;
      onDirectionRef.current?.({
        active: false,
        screenDirection: [0, 0],
        terrainHit: false,
      });
    };

    const publish = (): void => {
      frame = 0;
      if (!enabledRef.current || !pendingPoint) {
        clearPointer();
        onInteractionRef.current();
        return;
      }
      const pointer = pendingPoint;
      pendingPoint = null;
      const screenPoint = [pointer.clientX, pointer.clientY] as const;
      const screenDirection = getGrassScreenPointerDirection(
        previousScreenPoint,
        screenPoint,
      );
      previousScreenPoint = screenPoint;
      const hit = scene.projectPointerToTerrain(
        pointer.clientX,
        pointer.clientY,
        host.getBoundingClientRect(),
      );
      const snapshot = hit ? controller.sample(hit) : controller.leave();
      const terrainActive = Boolean(hit);
      scene.setPointerWindState(
        terrainActive,
        snapshot.active ? snapshot.angle : undefined,
      );
      host.dataset.grassPointerDirectionActive = String(snapshot.active);
      host.dataset.grassPointerDirectionAngle = snapshot.angle.toFixed(2);
      host.dataset.grassPointerDirectionHit = String(terrainActive);
      host.dataset.grassPointerDirectionVector = JSON.stringify(
        snapshot.direction,
      );
      const screenDirectionActive =
        terrainActive && (screenDirection[0] !== 0 || screenDirection[1] !== 0);
      host.dataset.grassPointerScreenDirectionActive = String(
        screenDirectionActive,
      );
      host.dataset.grassPointerScreenDirectionVector =
        JSON.stringify(screenDirection);
      host.dataset.grassPointerWindActive = String(terrainActive);
      onDirectionRef.current?.({
        active: screenDirectionActive,
        screenDirection,
        terrainHit: terrainActive,
      });
      if (snapshot.active) {
        observedDirection = true;
        host.dataset.grassPointerDirectionObserved = "true";
      }
      onInteractionRef.current();
      if (pendingPoint) schedule();
    };

    const schedule = (): void => {
      if (frame === 0) frame = requestAnimationFrame(publish);
    };
    const consumeTouchEvent = (event: PointerEvent): void => {
      event.preventDefault();
      event.stopPropagation();
    };
    const onPointerDown = (event: PointerEvent): void => {
      if (!enabledRef.current || event.pointerType !== "touch") return;
      const terrainHit = Boolean(
        scene.projectPointerToTerrain(
          event.clientX,
          event.clientY,
          host.getBoundingClientRect(),
        ),
      );
      if (!inputController.beginTouch(event.pointerId, terrainHit)) {
        if (inputController.hasActiveTouch()) consumeTouchEvent(event);
        return;
      }
      consumeTouchEvent(event);
      host.dataset.grassTouchActive = "true";
      if (!host.hasPointerCapture(event.pointerId)) {
        host.setPointerCapture(event.pointerId);
      }
      pendingPoint = { clientX: event.clientX, clientY: event.clientY };
      schedule();
    };
    const onPointerMove = (event: PointerEvent): void => {
      if (!enabledRef.current) return;
      if (event.pointerType === "touch") {
        if (!inputController.acceptsTouch(event.pointerId)) return;
        consumeTouchEvent(event);
      } else if (inputController.hasActiveTouch() || event.buttons !== 0) {
        return;
      }
      pendingPoint = { clientX: event.clientX, clientY: event.clientY };
      schedule();
    };
    const onPointerLeave = (event: PointerEvent): void => {
      if (inputController.hasActiveTouch()) return;
      pendingPoint = null;
      clearPointer();
      onInteractionRef.current();
    };
    const finishTouch = (event: PointerEvent, releaseCapture: boolean): void => {
      if (!inputController.endTouch(event.pointerId)) return;
      consumeTouchEvent(event);
      pendingPoint = null;
      if (releaseCapture && host.hasPointerCapture(event.pointerId)) {
        host.releasePointerCapture(event.pointerId);
      }
      clearPointer();
      onInteractionRef.current();
    };
    const onPointerUp = (event: PointerEvent): void => {
      if (event.pointerType === "touch") finishTouch(event, true);
    };
    const onPointerCancel = (event: PointerEvent): void => {
      if (event.pointerType === "touch") {
        finishTouch(event, true);
        return;
      }
      onPointerLeave(event);
    };
    const onLostPointerCapture = (event: PointerEvent): void => {
      finishTouch(event, false);
    };

    host.addEventListener("pointerdown", onPointerDown);
    host.addEventListener("pointerenter", onPointerMove);
    host.addEventListener("pointermove", onPointerMove);
    host.addEventListener("pointerleave", onPointerLeave);
    host.addEventListener("pointerup", onPointerUp);
    host.addEventListener("pointercancel", onPointerCancel);
    host.addEventListener("lostpointercapture", onLostPointerCapture);
    const initialSnapshot = controller.reset();
    host.dataset.grassPointerDirectionActive = "false";
    host.dataset.grassPointerDirectionAngle = initialSnapshot.angle.toFixed(2);
    host.dataset.grassPointerDirectionHit = "false";
    host.dataset.grassPointerDirectionObserved = "false";
    host.dataset.grassPointerDirectionVector = JSON.stringify(
      initialSnapshot.direction,
    );
    host.dataset.grassPointerWindActive = "false";
    host.dataset.grassPointerScreenDirectionActive = "false";
    host.dataset.grassPointerScreenDirectionVector = "[0,0]";
    host.dataset.grassTouchActive = "false";
    return () => {
      cancelAnimationFrame(frame);
      scene.setPointerWindState(false);
      const activeTouchPointerId = inputController.getActiveTouchPointerId();
      inputController.reset();
      if (
        activeTouchPointerId !== null &&
        host.hasPointerCapture(activeTouchPointerId)
      ) {
        host.releasePointerCapture(activeTouchPointerId);
      }
      host.dataset.grassTouchActive = "false";
      host.removeEventListener("pointerdown", onPointerDown);
      host.removeEventListener("pointerenter", onPointerMove);
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerleave", onPointerLeave);
      host.removeEventListener("pointerup", onPointerUp);
      host.removeEventListener("pointercancel", onPointerCancel);
      host.removeEventListener("lostpointercapture", onLostPointerCapture);
      if (!observedDirection) {
        host.dataset.grassPointerDirectionObserved = "false";
      }
    };
  }, [options.enabled, options.hostRef, options.scene]);
}
