import type { ToolcraftState } from "@/toolcraft/runtime";

import type { GrassSettings } from "./grass-settings-types";
import {
  booleanValue,
  boundedNumberValue,
  rangeValue,
} from "./grass-value-readers";

export function readGrassButterflySettings(
  state: ToolcraftState,
): GrassSettings["butterflies"] {
  const [heightMin, heightMax] = rangeValue(
    state,
    "butterflies.heightRange",
    0.1,
    2.4,
  );
  const [sizeMin, sizeMax] = rangeValue(
    state,
    "butterflies.sizeRange",
    0.05,
    0.45,
  );
  return {
    count: Math.round(
      boundedNumberValue(state, "butterflies.count", 0, 64),
    ),
    enabled: booleanValue(state, "butterflies.enabled"),
    flightCycles: Math.round(
      boundedNumberValue(state, "butterflies.flightCycles", 1, 6),
    ),
    heightMax,
    heightMin,
    landingTime: boundedNumberValue(
      state,
      "butterflies.landingTime",
      0.2,
      2.5,
    ),
    seed: Math.round(
      boundedNumberValue(state, "butterflies.seed", 0, 100),
    ),
    sizeMax,
    sizeMin,
    wingCycles: Math.round(
      boundedNumberValue(state, "butterflies.wingCycles", 6, 36),
    ),
  };
}

