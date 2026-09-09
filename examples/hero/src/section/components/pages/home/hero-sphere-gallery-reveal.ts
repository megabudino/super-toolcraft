export const heroSphereGalleryRevealTimeoutMs = 3000;

export interface HeroSphereGalleryRevealState {
  renderer: 'fallback' | 'pending' | 'webgl';
  settled: boolean;
}

export interface HeroSphereGalleryRevealController {
  activate(): void;
  dispose(): void;
  isRevealed(): boolean;
  update(state: HeroSphereGalleryRevealState): void;
}

export function createHeroSphereGalleryRevealController<Timer>({
  clearTimer,
  onReveal,
  setTimer,
}: {
  clearTimer: (timer: Timer) => void;
  onReveal: () => void;
  setTimer: (callback: () => void, delay: number) => Timer;
}): HeroSphereGalleryRevealController {
  let disposed = false;
  let revealed = false;
  let timer: Timer | undefined;

  const clearPendingTimer = () => {
    if (timer === undefined) return;
    clearTimer(timer);
    timer = undefined;
  };
  const reveal = () => {
    if (disposed || revealed) return;
    revealed = true;
    clearPendingTimer();
    onReveal();
  };

  return {
    activate() {
      disposed = false;
    },
    dispose() {
      disposed = true;
      clearPendingTimer();
    },
    isRevealed() {
      return revealed;
    },
    update({ renderer, settled }) {
      if (disposed || revealed) return;
      if (renderer !== 'webgl') {
        clearPendingTimer();
        return;
      }
      if (settled) {
        reveal();
        return;
      }
      if (timer !== undefined) return;
      timer = setTimer(() => {
        timer = undefined;
        reveal();
      }, heroSphereGalleryRevealTimeoutMs);
    },
  };
}

export function getHeroSphereGalleryRevealTransition(prefersReducedMotion: boolean) {
  return prefersReducedMotion ? 'none' : 'opacity 180ms ease-out';
}
