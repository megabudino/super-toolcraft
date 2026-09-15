import * as React from "react";

type LogoIntroListener = () => void;

const listeners = new Set<LogoIntroListener>();

export function requestLogoIntroRun(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeLogoIntroRun(listener: LogoIntroListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export type LogoLoopClock = {
  getElapsedMs: (nowMs: number) => number;
};

export function useLogoLoopClock(): LogoLoopClock {
  const startedAtRef = React.useRef(0);

  const restart = React.useCallback((nowMs = window.performance.now()) => {
    startedAtRef.current = nowMs;
  }, []);

  React.useEffect(() => {
    restart();
    return subscribeLogoIntroRun(() => {
      restart();
    });
  }, [restart]);

  return React.useMemo(() => ({
    getElapsedMs: (nowMs: number) => {
      if (startedAtRef.current === 0) {
        startedAtRef.current = nowMs;
      }
      return Math.max(0, nowMs - startedAtRef.current);
    },
  }), []);
}
