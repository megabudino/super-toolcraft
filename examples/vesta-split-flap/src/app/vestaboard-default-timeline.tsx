import * as React from "react";

import type { CreativeAppsKitCommand } from "@/creative-apps-kit/template-runtime";
import { useCreativeAppsKit } from "@/creative-apps-kit/template-runtime/react";

import {
  vestaboardDefaultCanvasSize,
  vestaboardDefaultSettingsValues,
  vestaboardDefaultTimelineState,
} from "./vestaboard-defaults";

const runtimeTimelineDurationFallbackSeconds = 8;
const numberEpsilon = 0.0001;
const timelineSetDurationCommandType = "timeline." + "setDuration";
const timelineSetPlayingCommandType = "timeline." + "setPlaying";

function valuesAreEqual(first: unknown, second: unknown): boolean {
  return JSON.stringify(first) === JSON.stringify(second);
}

function isDefaultValueState(values: Record<string, unknown>): boolean {
  return Object.entries(vestaboardDefaultSettingsValues).every(([target, value]) =>
    valuesAreEqual(values[target], value),
  );
}

export function VestaboardDefaultTimelineState(): null {
  const { dispatch, state } = useCreativeAppsKit();
  const didApplyRef = React.useRef(false);

  React.useLayoutEffect(() => {
    if (didApplyRef.current) {
      return;
    }

    didApplyRef.current = true;

    if (!state.timeline.isPlaying) {
      dispatch({
        isPlaying: true,
        type: timelineSetPlayingCommandType,
      } as CreativeAppsKitCommand);
    }

    const hasDefaultCanvas =
      state.canvas.size.width === vestaboardDefaultCanvasSize.width &&
      state.canvas.size.height === vestaboardDefaultCanvasSize.height &&
      state.canvas.size.unit === vestaboardDefaultCanvasSize.unit;
    const hasRuntimeInitialTimeline =
      Math.abs(state.timeline.durationSeconds - runtimeTimelineDurationFallbackSeconds) <=
        numberEpsilon &&
      Math.abs(state.timeline.currentTimeSeconds) <= numberEpsilon &&
      state.timeline.expanded === false &&
      state.timeline.isLooping === true &&
      state.timeline.isPlaying === true &&
      state.timeline.keyframeGroups.length === 0;

    if (!hasDefaultCanvas || !hasRuntimeInitialTimeline || !isDefaultValueState(state.values)) {
      return;
    }

    dispatch({
      durationSeconds: vestaboardDefaultTimelineState.durationSeconds,
      type: timelineSetDurationCommandType,
    } as CreativeAppsKitCommand);

    dispatch({
      isPlaying: vestaboardDefaultTimelineState.isPlaying,
      type: timelineSetPlayingCommandType,
    } as CreativeAppsKitCommand);
  });

  return null;
}
