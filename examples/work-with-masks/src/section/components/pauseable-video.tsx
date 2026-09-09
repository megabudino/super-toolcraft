'use client';

import { useEffect, useRef, type ComponentPropsWithoutRef } from 'react';

type PauseableVideoProps = ComponentPropsWithoutRef<'video'> & {
  isPlaybackDisabled?: boolean;
  shouldFinishOnExit?: boolean;
  visibilityThreshold?: number;
};

/** Plays while visible, optionally finishing the current pass before stopping on exit. */
function PauseableVideo({
  isPlaybackDisabled = false,
  loop = false,
  muted = true,
  shouldFinishOnExit = false,
  visibilityThreshold = 0.1,
  ...props
}: PauseableVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.muted = muted;

    if (isPlaybackDisabled) {
      video.pause();
      if (video.currentTime !== 0) video.currentTime = 0;
      return;
    }

    let isVisible = false;
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleEnded = () => {
      if (!shouldFinishOnExit || isVisible) {
        return;
      }

      // Keep the opening frame ready after an out-of-view pass finishes.
      video.currentTime = 0;
    };

    const updatePlayback = () => {
      const shouldReduceMotion = reducedMotionQuery.matches;

      // Disabling native looping lets playback reach the final frame without a timed pause.
      video.loop = loop && !shouldReduceMotion && (!shouldFinishOnExit || isVisible);

      if (shouldReduceMotion) {
        video.pause();
        if (video.currentTime !== 0) video.currentTime = 0;
        return;
      }

      if (!isVisible) {
        if (!shouldFinishOnExit) video.pause();
        return;
      }

      void video.play().catch(() => undefined);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = Boolean(
          entry?.isIntersecting && entry.intersectionRatio >= visibilityThreshold,
        );
        updatePlayback();
      },
      { threshold: visibilityThreshold },
    );

    video.addEventListener('ended', handleEnded);
    reducedMotionQuery.addEventListener('change', updatePlayback);
    observer.observe(video);

    return () => {
      observer.disconnect();
      video.removeEventListener('ended', handleEnded);
      reducedMotionQuery.removeEventListener('change', updatePlayback);
      video.pause();
    };
  }, [isPlaybackDisabled, loop, muted, shouldFinishOnExit, visibilityThreshold]);

  return <video {...props} autoPlay={false} loop={loop} muted={muted} playsInline ref={videoRef} />;
}

export { PauseableVideo };
