import { getToolcraftTimelineLoopProgress, type ToolcraftTimelineState } from '@/toolcraft/runtime';
import { readIcebergSettings, type IcebergSettings } from './iceberg-controls';

export const ICEBERG_ANIMATION_DURATION_SECONDS = 1.2;

export type IcebergAnimationTimeline = Pick<
  ToolcraftTimelineState,
  'currentTimeSeconds' | 'durationSeconds' | 'isLooping'
>;

function clampUnit(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function getIcebergPlateSeparationProgress(
  timeline: IcebergAnimationTimeline,
): number {
  const currentTimeSeconds = Math.max(0, timeline.currentTimeSeconds);
  const linearProgress = timeline.isLooping
    ? getToolcraftTimelineLoopProgress({
        currentTimeSeconds,
        durationSeconds: timeline.durationSeconds,
      })
    : clampUnit(currentTimeSeconds / timeline.durationSeconds);
  const remaining = 1 - clampUnit(linearProgress);

  // A strong initial impulse followed by a long, soft deceleration.
  return 1 - remaining ** 4;
}

export function readAnimatedIcebergSettings(
  values: Readonly<Record<string, unknown>>,
  timeline: IcebergAnimationTimeline,
): IcebergSettings {
  const settings = readIcebergSettings(values);

  return {
    ...settings,
    plateGap: settings.plateGap * getIcebergPlateSeparationProgress(timeline),
  };
}
