import type { HeroMotionFrameEvidence } from "./hero-motion-effects-evidence";

export type HeroMotionEnvelopeKey = "crt" | "grain";

export type HeroMotionCheckpoint = Readonly<{
  delta: number;
  frame: HeroMotionFrameEvidence;
  index: number;
  maxObservedFrameDt: number;
}>;

export function getWrappedEffectTimeDelta(start: number, end: number): number {
  return end >= start ? end - start : 1000 - start + end;
}

export function findAdjacentLiveGrainFrames(
  frames: readonly HeroMotionFrameEvidence[],
): readonly [HeroMotionFrameEvidence, HeroMotionFrameEvidence] | null {
  for (let index = 0; index + 1 < frames.length; index += 1) {
    const current = frames[index]!;
    const next = frames[index + 1]!;
    if (
      current.grain > 0.0001 &&
      next.grain > 0.0001 &&
      Math.floor(current.effectTime * 60) !== Math.floor(next.effectTime * 60)
    ) {
      return [current, next];
    }
  }
  return null;
}

export function findLastLocalEnvelopePeakIndex(
  frames: readonly HeroMotionFrameEvidence[],
  firstFrameAfterLastMove: number,
  key: HeroMotionEnvelopeKey,
): number | null {
  for (
    let index = frames.length - 2;
    index >= firstFrameAfterLastMove;
    index -= 1
  ) {
    const previous =
      index > firstFrameAfterLastMove ? frames[index - 1] : undefined;
    const current = frames[index]!;
    const next = frames[index + 1]!;
    if (
      current[key] > 0 &&
      current.panRate > 0 &&
      (!previous || current[key] >= previous[key]) &&
      current[key] >= next[key] &&
      (!previous || current[key] > previous[key] || current[key] > next[key])
    ) {
      return index;
    }
  }
  return null;
}

export function findFirstEffectTimeCheckpoint(
  frames: readonly HeroMotionFrameEvidence[],
  anchorIndex: number,
  threshold: number,
): HeroMotionCheckpoint | null {
  const anchor = frames[anchorIndex];
  if (!anchor) return null;
  let maxObservedFrameDt = 0;
  for (let index = anchorIndex + 1; index < frames.length; index += 1) {
    const frame = frames[index]!;
    maxObservedFrameDt = Math.max(maxObservedFrameDt, frame.frameDt);
    const delta = getWrappedEffectTimeDelta(
      anchor.effectTime,
      frame.effectTime,
    );
    if (delta >= threshold) {
      return { delta, frame, index, maxObservedFrameDt };
    }
  }
  return null;
}
