import * as React from "react";

import type { GrassSceneRenderer } from "./grass-scene";

export function useGrassButterflyHover(
  options: Readonly<{
    enabled: boolean;
    hostRef: React.RefObject<HTMLDivElement | null>;
    onInteraction: () => void;
    scene: GrassSceneRenderer | null;
  }>,
): void {
  const onInteractionRef = React.useRef(options.onInteraction);
  onInteractionRef.current = options.onInteraction;

  React.useEffect(() => {
    const host = options.hostRef.current;
    const scene = options.scene;
    if (!host || !scene) return;
    let sampleFrame = 0;
    let transitionFrame = 0;
    let pendingPoint: Readonly<{ clientX: number; clientY: number }> | null =
      null;

    const renderTransition = (): void => {
      transitionFrame = 0;
      onInteractionRef.current();
      if (scene.isButterflyTransitioning()) {
        transitionFrame = requestAnimationFrame(renderTransition);
      }
    };

    const scheduleTransition = (): void => {
      if (transitionFrame === 0) {
        transitionFrame = requestAnimationFrame(renderTransition);
      }
    };

    const setHoverActive = (active: boolean): void => {
      const next = options.enabled && active;
      host.dataset.grassButterflyHoverActive = String(next);
      if (scene.setButterflyHoverActive(next)) {
        scheduleTransition();
      }
    };

    const sample = (): void => {
      sampleFrame = 0;
      const point = pendingPoint;
      pendingPoint = null;
      if (!point || !options.enabled) {
        setHoverActive(false);
        return;
      }
      const hit = scene.projectPointerToTerrain(
        point.clientX,
        point.clientY,
        host.getBoundingClientRect(),
      );
      setHoverActive(Boolean(hit));
    };

    const scheduleSample = (): void => {
      if (sampleFrame === 0) sampleFrame = requestAnimationFrame(sample);
    };

    const onPointerMove = (event: PointerEvent): void => {
      if (
        (event.pointerType !== "mouse" && event.pointerType !== "pen") ||
        event.buttons !== 0
      ) {
        pendingPoint = null;
        setHoverActive(false);
        return;
      }
      pendingPoint = { clientX: event.clientX, clientY: event.clientY };
      scheduleSample();
    };

    const onPointerDown = (): void => {
      pendingPoint = null;
      setHoverActive(false);
    };

    const onPointerLeave = (): void => {
      pendingPoint = null;
      setHoverActive(false);
    };

    host.dataset.grassButterflyHoverActive = "false";
    host.addEventListener("pointerdown", onPointerDown);
    host.addEventListener("pointerenter", onPointerMove);
    host.addEventListener("pointermove", onPointerMove);
    host.addEventListener("pointerleave", onPointerLeave);
    host.addEventListener("pointercancel", onPointerLeave);
    return () => {
      cancelAnimationFrame(sampleFrame);
      cancelAnimationFrame(transitionFrame);
      scene.setButterflyHoverActive(false);
      host.dataset.grassButterflyHoverActive = "false";
      host.removeEventListener("pointerdown", onPointerDown);
      host.removeEventListener("pointerenter", onPointerMove);
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerleave", onPointerLeave);
      host.removeEventListener("pointercancel", onPointerLeave);
    };
  }, [options.enabled, options.hostRef, options.scene]);
}

