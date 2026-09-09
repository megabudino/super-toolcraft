import {
  getToolcraftTimelineLoopProgress,
  shouldIncludeToolcraftPreviewBackground,
  type ToolcraftState,
} from "@/toolcraft/runtime";

export function getGrassTimelineProgress(state: ToolcraftState): number {
  if (state.timeline.isLooping) {
    return getToolcraftTimelineLoopProgress({
      currentTimeSeconds: state.timeline.currentTimeSeconds,
      durationSeconds: state.timeline.durationSeconds,
    });
  }
  return Math.min(
    1,
    Math.max(
      0,
      state.timeline.currentTimeSeconds /
        Math.max(0.001, state.timeline.durationSeconds),
    ),
  );
}

export function getGrassPreviewBackground(state: ToolcraftState): boolean {
  return shouldIncludeToolcraftPreviewBackground({ state });
}
