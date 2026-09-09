import * as React from "react";

import type { GrassSceneRenderer } from "./grass-scene";
import {
  GrassSurfaceTiltController,
  type GrassSurfaceTiltSettings,
} from "./grass-surface-tilt";
import type { GrassPointerMotionSample } from "./use-grass-pointer-direction";

const SURFACE_TILT_PREVIEW_INTERVAL_MS = 1_000 / 24;

export function useGrassSurfaceTilt(
  options: Readonly<{
    downDegrees: number;
    enabled: boolean;
    hostRef: React.RefObject<HTMLDivElement | null>;
    leftDegrees: number;
    onInteraction: () => void;
    rightDegrees: number;
    scene: GrassSceneRenderer | null;
    smoothingSeconds: number;
    upDegrees: number;
  }>,
): (sample: GrassPointerMotionSample) => void {
  const enabledRef = React.useRef(options.enabled);
  const onInteractionRef = React.useRef(options.onInteraction);
  const settingsRef = React.useRef<GrassSurfaceTiltSettings>({
    downDegrees: options.downDegrees,
    leftDegrees: options.leftDegrees,
    rightDegrees: options.rightDegrees,
    smoothingSeconds: options.smoothingSeconds,
    upDegrees: options.upDegrees,
  });
  const syncPointerRef = React.useRef<(sample: GrassPointerMotionSample) => void>(
    () => undefined,
  );
  enabledRef.current = options.enabled;
  onInteractionRef.current = options.onInteraction;
  settingsRef.current = {
    downDegrees: options.downDegrees,
    leftDegrees: options.leftDegrees,
    rightDegrees: options.rightDegrees,
    smoothingSeconds: options.smoothingSeconds,
    upDegrees: options.upDegrees,
  };

  React.useEffect(() => {
    if (options.enabled) return;
    const host = options.hostRef.current;
    options.scene?.setSurfaceTilt(0, 0);
    if (host) {
      host.dataset.grassSurfaceTiltActive = "false";
      host.dataset.grassSurfaceTiltMagnitude = "0.000";
      host.dataset.grassSurfaceTiltRotation = "[0,0]";
    }
    onInteractionRef.current();
  }, [options.enabled, options.hostRef, options.scene]);

  React.useEffect(() => {
    const host = options.hostRef.current;
    const scene = options.scene;
    if (!host || !scene) return;
    const controller = new GrassSurfaceTiltController();
    let animationFrame = 0;
    let lastPreviewAtMs = Number.NEGATIVE_INFINITY;

    const schedule = (): void => {
      if (animationFrame === 0) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    const resolve = (nowMs: number) =>
      controller.resolve(settingsRef.current, nowMs);

    const publish = (snapshot: ReturnType<typeof resolve>): void => {
      scene.setSurfaceTilt(snapshot.rotationX, snapshot.rotationZ);
      host.dataset.grassSurfaceTiltActive = String(snapshot.active);
      host.dataset.grassSurfaceTiltMagnitude =
        snapshot.magnitudeDegrees.toFixed(3);
      host.dataset.grassSurfaceTiltRotation = JSON.stringify([
        Number(((snapshot.rotationX * 180) / Math.PI).toFixed(3)),
        Number(((snapshot.rotationZ * 180) / Math.PI).toFixed(3)),
      ]);
    };

    const animate = (nowMs: number): void => {
      animationFrame = 0;
      if (!enabledRef.current) controller.reset();
      const snapshot = resolve(nowMs);
      publish(snapshot);
      if (
        snapshot.settled ||
        nowMs - lastPreviewAtMs >= SURFACE_TILT_PREVIEW_INTERVAL_MS
      ) {
        lastPreviewAtMs = nowMs;
        onInteractionRef.current();
      }
      if (!snapshot.settled) schedule();
    };

    syncPointerRef.current = (sample): void => {
      if (!enabledRef.current) {
        controller.reset();
        schedule();
        return;
      }
      if (!sample.terrainHit) {
        controller.leave();
      } else if (sample.active) {
        const nowMs = performance.now();
        controller.setMotion(sample.screenDirection, nowMs);
        publish(resolve(nowMs));
      }
      schedule();
    };
    const initial = controller.reset();
    scene.setSurfaceTilt(initial.rotationX, initial.rotationZ);
    host.dataset.grassSurfaceTiltActive = "false";
    host.dataset.grassSurfaceTiltMagnitude = "0.000";
    host.dataset.grassSurfaceTiltRotation = "[0,0]";

    return () => {
      cancelAnimationFrame(animationFrame);
      syncPointerRef.current = () => undefined;
      controller.reset();
      scene.setSurfaceTilt(0, 0);
      host.dataset.grassSurfaceTiltActive = "false";
      host.dataset.grassSurfaceTiltMagnitude = "0.000";
      host.dataset.grassSurfaceTiltRotation = "[0,0]";
    };
  }, [options.hostRef, options.scene]);

  return React.useCallback((sample: GrassPointerMotionSample) => {
    syncPointerRef.current(sample);
  }, []);
}
