import type { ToolcraftState } from "@/toolcraft/runtime";

import type { GrassWindMode } from "./grass-defaults";
import type { GrassSettings } from "./grass-settings-types";
import { grassSurfaceTiltMaximumDegrees } from "./grass-surface-tilt";
import {
  boundedNumberValue,
  stringValue,
  type GrassDefaultTarget,
} from "./grass-value-readers";

const surfaceTiltValue = (
  state: ToolcraftState,
  target: GrassDefaultTarget,
) => boundedNumberValue(state, target, 0, grassSurfaceTiltMaximumDegrees);

export function readGrassWindSettings(
  state: ToolcraftState,
): GrassSettings["wind"] {
  return {
    audioVolume: boundedNumberValue(state, "wind.audioVolume", 0, 100) / 100,
    directionAngle: boundedNumberValue(state, "wind.directionAngle", 0, 360),
    directionResponse: boundedNumberValue(
      state,
      "wind.directionResponse",
      0.1,
      2,
    ),
    flow: boundedNumberValue(state, "wind.flow", 0, 100) / 100,
    gustCycles: Math.round(
      boundedNumberValue(state, "wind.gustCycles", 1, 4),
    ),
    gustWidth: boundedNumberValue(state, "wind.gustWidth", 10, 90) / 100,
    mode: stringValue(state, "wind.mode", [
      "static",
      "sway",
      "wind",
      "simulation",
    ] satisfies readonly GrassWindMode[]),
    noiseDetail: boundedNumberValue(state, "wind.noiseDetail", 0, 100) / 100,
    noiseScale: boundedNumberValue(state, "wind.noiseScale", 0.25, 5),
    noiseStrength:
      boundedNumberValue(state, "wind.noiseStrength", 0, 100) / 100,
    rampUp: boundedNumberValue(state, "wind.rampUp", 0.1, 4),
    release: boundedNumberValue(state, "wind.release", 0.1, 5),
    seed: Math.round(boundedNumberValue(state, "wind.seed", 1, 128)),
    strength: boundedNumberValue(state, "wind.strength", 0, 100) / 100,
    surfaceTiltDown: surfaceTiltValue(state, "wind.surfaceTiltDown"),
    surfaceTiltLeft: surfaceTiltValue(state, "wind.surfaceTiltLeft"),
    surfaceTiltRight: surfaceTiltValue(state, "wind.surfaceTiltRight"),
    surfaceTiltSmoothing: boundedNumberValue(
      state,
      "wind.surfaceTiltSmoothing",
      0.1,
      2,
    ),
    surfaceTiltUp: surfaceTiltValue(state, "wind.surfaceTiltUp"),
    swayCycles: Math.round(
      boundedNumberValue(state, "wind.swayCycles", 1, 4),
    ),
    swayStrength: boundedNumberValue(state, "wind.swayStrength", 0, 40) / 100,
    swayVariation:
      boundedNumberValue(state, "wind.swayVariation", 0, 100) / 100,
  };
}
