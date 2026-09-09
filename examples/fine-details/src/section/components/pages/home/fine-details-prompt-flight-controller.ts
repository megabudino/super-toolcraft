export interface FineDetailsPromptFlightScheduler {
  cancelAnimationFrame: (id: number) => void;
  clearTimeout: (id: number) => void;
  now: () => number;
  requestAnimationFrame: (callback: (timestamp: number) => void) => number;
  setTimeout: (callback: () => void, delay: number) => number;
}

export interface FineDetailsPromptFlightController<Frame = never> {
  cancel: () => void;
  publish: (frame: Frame) => void;
  start: (flight: FineDetailsPromptFlightControllerRun) => void;
  subscribe: (listener: (frame: Frame) => void) => () => void;
}

export interface FineDetailsPromptFlightControllerRun {
  duration: number;
  onComplete: () => void;
  onProgress: (progress: number) => void;
  startDelay: number;
}

export function createFineDetailsPromptFlightController<Frame = never>(
  scheduler: FineDetailsPromptFlightScheduler,
): FineDetailsPromptFlightController<Frame> {
  const listeners = new Set<(frame: Frame) => void>();
  let activeGeneration = 0;
  let animationFrame: number | null = null;
  let delayTimer: number | null = null;
  let latestFrame: Frame | undefined;
  let hasLatestFrame = false;

  function clearScheduledWork() {
    if (delayTimer !== null) {
      scheduler.clearTimeout(delayTimer);
      delayTimer = null;
    }
    if (animationFrame !== null) {
      scheduler.cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
  }

  function cancel() {
    activeGeneration += 1;
    clearScheduledWork();
  }

  return {
    cancel,
    publish(frame) {
      latestFrame = frame;
      hasLatestFrame = true;
      for (const listener of listeners) listener(frame);
    },
    start({ duration, onComplete, onProgress, startDelay }) {
      cancel();
      const generation = activeGeneration;

      function begin() {
        if (generation !== activeGeneration) return;
        const startedAt = scheduler.now();

        function advance(timestamp: number) {
          if (generation !== activeGeneration) return;
          animationFrame = null;
          const progress =
            duration <= 0 ? 1 : Math.min(1, Math.max(0, (timestamp - startedAt) / duration));
          onProgress(progress);
          if (generation !== activeGeneration) return;

          if (progress < 1) {
            animationFrame = scheduler.requestAnimationFrame(advance);
            return;
          }
          onComplete();
        }

        animationFrame = scheduler.requestAnimationFrame(advance);
      }

      if (startDelay > 0) {
        delayTimer = scheduler.setTimeout(() => {
          if (generation !== activeGeneration) return;
          delayTimer = null;
          begin();
        }, startDelay);
        return;
      }
      begin();
    },
    subscribe(listener) {
      listeners.add(listener);
      if (hasLatestFrame) listener(latestFrame as Frame);
      return () => listeners.delete(listener);
    },
  };
}

export function applyFineDetailsPromptFlightCancellation(
  controller: Pick<FineDetailsPromptFlightController, 'cancel'>,
  decision: { cancelCurrent: boolean },
) {
  if (!decision.cancelCurrent) return false;
  controller.cancel();
  return true;
}

export function applyFineDetailsPromptFlightLandedLayoutReconciliation({
  consumeLayoutKey,
  currentLayoutKey,
  flightState,
  imagesMode,
  previousLayoutKey,
  reconcile,
}: {
  consumeLayoutKey: (layoutKey: string) => void;
  currentLayoutKey: string;
  flightState: 'flying' | 'idle' | 'landed' | 'returning';
  imagesMode: 'carousel' | 'loading' | 'trail';
  previousLayoutKey: string;
  reconcile: () => boolean;
}) {
  if (
    currentLayoutKey === previousLayoutKey ||
    flightState !== 'landed' ||
    imagesMode !== 'carousel'
  ) {
    return false;
  }
  if (!reconcile()) return false;
  consumeLayoutKey(currentLayoutKey);
  return true;
}
