export type PathPoint = Readonly<{ x: number; y: number }>;

function serializePathData(points: readonly PathPoint[]) {
  return `M${points.map(({ x, y }) => `${x.toFixed(2)} ${y.toFixed(2)}`).join('L')}Z`;
}

export function createLogoPathMorph(
  path: SVGPathElement,
  source: readonly PathPoint[],
  target: readonly PathPoint[],
  timing: KeyframeAnimationOptions,
) {
  const canAnimateCssPath = CSS.supports('d', 'path("M0 0L1 1Z")');
  // Safari supports SVG's d attribute, but not necessarily its CSS counterpart.
  // Keep a WAAPI clock so both renderers share easing, seeking and reverse playback.
  const animation = path.animate(
    canAnimateCssPath
      ? [
          { d: `path("${serializePathData(source)}")` },
          { d: `path("${serializePathData(target)}")` },
        ]
      : [{}, {}],
    timing,
  );
  let frameId: number | null = null;
  let lastProgress: number | null = null;

  const sync = () => {
    if (canAnimateCssPath) return;

    const progress = animation.effect?.getComputedTiming().progress ?? 0;
    if (progress === lastProgress) return;
    lastProgress = progress;

    const points = source.map((point, index) => ({
      x: point.x + (target[index].x - point.x) * progress,
      y: point.y + (target[index].y - point.y) * progress,
    }));
    path.setAttribute('d', serializePathData(points));
  };

  const stop = () => {
    if (frameId === null) return;
    window.cancelAnimationFrame(frameId);
    frameId = null;
  };

  const tick = () => {
    frameId = null;
    sync();
    if (animation.playState === 'running' || animation.pending) {
      frameId = window.requestAnimationFrame(tick);
    }
  };

  const start = () => {
    if (canAnimateCssPath) return;
    stop();
    tick();
  };

  const finish = () => {
    stop();
    sync();
  };

  if (!canAnimateCssPath) {
    animation.addEventListener('finish', finish);
  }

  const dispose = () => {
    stop();
    animation.removeEventListener('finish', finish);
    animation.cancel();
  };

  return { animation, sync, start, stop, dispose };
}
