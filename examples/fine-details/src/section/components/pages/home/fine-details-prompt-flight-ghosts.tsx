'use client';

import { referenceClasses } from '@/section/reference/reference-classes';
import { useEffect, useRef } from 'react';

import type { FineDetailsPromptGhostRun } from './fine-details-prompt-flight-engine';
import {
  resolveBreadcrumbCruiseFrame,
  resolveBreadcrumbVanishFrame,
} from './fine-details-prompt-flight';

function resolvePathOffset(delta: { x: number; y: number }, distance: number) {
  const pathLength = Math.hypot(delta.x, delta.y);
  if (pathLength === 0) return { x: 0, y: 0 };
  return {
    x: (delta.x / pathLength) * distance,
    y: (delta.y / pathLength) * distance,
  };
}

export function FineDetailsPromptFlightGhosts({
  onComplete,
  run,
}: {
  onComplete: (id: number) => void;
  run: FineDetailsPromptGhostRun | null;
}) {
  const ghostRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if (!run) return;

    let vanishAnimationFrame: number | null = null;
    let vanishStartedAt: number | null = null;
    let dropped = Array.from({ length: run.dropPlan.length }, () => false);

    function applyOpacities(opacities: readonly number[]) {
      for (const [index, opacity] of opacities.entries()) {
        const element = ghostRefs.current[index];
        if (element) element.style.opacity = `${opacity}`;
      }
    }

    const vanish = (timestamp: number) => {
      vanishStartedAt ??= timestamp;
      const elapsed = timestamp - vanishStartedAt;
      const vanishFrame = resolveBreadcrumbVanishFrame(run.dropPlan, run.settings, elapsed);
      applyOpacities(vanishFrame.opacities);

      if (vanishFrame.isComplete) {
        vanishAnimationFrame = null;
        onComplete(run.id);
        return;
      }
      vanishAnimationFrame = window.requestAnimationFrame(vanish);
    };

    const unsubscribe = run.subscribeFlight((frame) => {
      if (frame.phase === 'settling') {
        if (vanishAnimationFrame === null) {
          vanishAnimationFrame = window.requestAnimationFrame(vanish);
        }
        return;
      }

      const cruiseFrame = resolveBreadcrumbCruiseFrame(
        run.dropPlan,
        run.settings,
        frame.distance,
        dropped,
      );
      dropped = cruiseFrame.dropped;
      applyOpacities(cruiseFrame.opacities);
    });

    return () => {
      unsubscribe();
      if (vanishAnimationFrame !== null) window.cancelAnimationFrame(vanishAnimationFrame);
    };
  }, [onComplete, run]);

  if (!run) return null;

  return (
    <div aria-hidden="true" className={referenceClasses("pointer-events-none absolute inset-0 z-[9]")}>
      {run.dropPlan.map((distance, index) => {
        const offset = resolvePathOffset(run.delta, distance);
        return (
          <div
            ref={(element) => {
              ghostRefs.current[index] = element;
            }}
            aria-hidden="true"
            className={referenceClasses("pointer-events-none absolute")}
            data-fine-details-prompt-ghost
            key={`${run.id}:${index}`}
            style={{
              backgroundColor: run.backgroundColor,
              border: run.border,
              borderRadius: run.borderRadius,
              boxShadow: run.boxShadow,
              height: `${run.height}px`,
              left: `${run.left}px`,
              opacity: 0,
              top: `${run.top}px`,
              transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
              width: `${run.width}px`,
              willChange: 'opacity',
              zIndex: index,
            }}
          />
        );
      })}
    </div>
  );
}
