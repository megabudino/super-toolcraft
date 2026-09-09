import * as React from "react";

import type { GrassSceneRenderer } from "./grass-scene";
import type { GrassSettings } from "./grass-settings-types";
import { useGrassPointerDirection } from "./use-grass-pointer-direction";
import { useGrassSurfaceTilt } from "./use-grass-surface-tilt";
import { useGrassWindAudio } from "./use-grass-wind-audio";

export function useGrassSimulationInteractions(
  options: Readonly<{
    hostRef: React.RefObject<HTMLDivElement | null>;
    onInteraction: () => void;
    scene: GrassSceneRenderer | null;
    settings: GrassSettings;
  }>,
): void {
  const { hostRef, onInteraction, scene, settings } = options;
  const simulationEnabled = settings.wind.mode === "simulation";
  const updateSurfaceTilt = useGrassSurfaceTilt({
    downDegrees: settings.wind.surfaceTiltDown,
    enabled: simulationEnabled,
    hostRef,
    leftDegrees: settings.wind.surfaceTiltLeft,
    onInteraction,
    rightDegrees: settings.wind.surfaceTiltRight,
    scene,
    smoothingSeconds: settings.wind.surfaceTiltSmoothing,
    upDegrees: settings.wind.surfaceTiltUp,
  });
  useGrassPointerDirection({
    enabled: settings.wind.mode === "wind" || simulationEnabled,
    hostRef,
    onDirection: updateSurfaceTilt,
    onInteraction,
    scene,
  });
  useGrassWindAudio({
    enabled: simulationEnabled,
    fadeInMs: settings.wind.rampUp * 1_000,
    fadeOutMs: settings.wind.release * 1_000,
    hostRef,
    volume: settings.wind.audioVolume,
  });
}
