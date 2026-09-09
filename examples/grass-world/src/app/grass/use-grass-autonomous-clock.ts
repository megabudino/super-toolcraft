import * as React from "react";

const GRASS_AUTONOMOUS_LOOP_SECONDS = 6;
const GRASS_AUTONOMOUS_CLOCK_INTERVAL_MS = 1000 / 24;

export function useGrassAutonomousProgress(): number {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    let frame = 0;
    const startedAt = performance.now();
    let lastPublishedAt = startedAt - GRASS_AUTONOMOUS_CLOCK_INTERVAL_MS;

    const tick = (timestamp: number) => {
      if (
        timestamp - lastPublishedAt >=
        GRASS_AUTONOMOUS_CLOCK_INTERVAL_MS
      ) {
        const elapsedSeconds = (timestamp - startedAt) / 1000;
        setProgress(
          (elapsedSeconds % GRASS_AUTONOMOUS_LOOP_SECONDS) /
            GRASS_AUTONOMOUS_LOOP_SECONDS,
        );
        lastPublishedAt = timestamp;
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return progress;
}
