import type { ResolvedCreativeAppsKitAppSchema } from "../schema/types";
import type {
  CreativeAppsKitMediaAsset,
  CreativeAppsKitTimelineState,
} from "./types";

export function doesTimelineRequireMedia(
  schema: ResolvedCreativeAppsKitAppSchema,
): boolean {
  return Boolean(
    schema.panels.timeline?.enabled &&
      schema.canvas.enabled &&
      schema.canvas.upload &&
      schema.canvas.sizing.mode === "intrinsic-media",
  );
}

export function isTimelineReadyForPlayback(
  schema: ResolvedCreativeAppsKitAppSchema,
  mediaAssets: readonly CreativeAppsKitMediaAsset[],
): boolean {
  return !doesTimelineRequireMedia(schema) || mediaAssets.length > 0;
}

export function getMediaReadyTimelineState(
  schema: ResolvedCreativeAppsKitAppSchema,
  timeline: CreativeAppsKitTimelineState,
  mediaAssets: readonly CreativeAppsKitMediaAsset[],
): CreativeAppsKitTimelineState {
  if (isTimelineReadyForPlayback(schema, mediaAssets)) {
    return timeline;
  }

  if (!timeline.isPlaying && timeline.currentTimeSeconds === 0) {
    return timeline;
  }

  return {
    ...timeline,
    currentTimeSeconds: 0,
    isPlaying: false,
  };
}
