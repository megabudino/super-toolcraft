export interface FineDetailsCarouselLoopInput {
  containerWidth: number;
  gap: number;
  rowWidth: number;
  speed: number;
}

export interface FineDetailsCarouselLoop {
  animated: boolean;
  durationSeconds: number;
  shift: number;
}

export function getFineDetailsCarouselLoop({
  containerWidth,
  gap,
  rowWidth,
  speed,
}: FineDetailsCarouselLoopInput): FineDetailsCarouselLoop {
  if (rowWidth <= containerWidth) {
    return { animated: false, durationSeconds: 0, shift: 0 };
  }

  const shift = rowWidth + gap;
  return {
    animated: true,
    durationSeconds: shift / Math.max(speed, 1),
    shift,
  };
}
