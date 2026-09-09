'use client';

import { useEffect, useMemo, useState } from 'react';

import type { AiPromptGhost } from '@/section/components/ai-prompt-input';

import {
  advancePromptTyping,
  createFineDetailsPromptTypingState,
  getFineDetailsPromptPhraseKey,
} from './fine-details-prompt-typing';
import type {
  FineDetailsImagesMode,
  FineDetailsPromptTypingSettings,
} from './fine-details-settings';

interface FineDetailsPromptInteraction {
  focused: boolean;
  value: string;
}

function readPromptInteraction(promptRoot: HTMLDivElement): FineDetailsPromptInteraction {
  const input = promptRoot.querySelector<HTMLTextAreaElement>('[data-fine-details-prompt-input]');
  return {
    focused: Boolean(input && document.activeElement === input),
    value: input?.value ?? '',
  };
}

export function useFineDetailsPromptTyping({
  imagesMode,
  promptRoot,
  settings,
}: {
  imagesMode: FineDetailsImagesMode;
  promptRoot: HTMLDivElement | null;
  settings: FineDetailsPromptTypingSettings;
}): AiPromptGhost | null {
  const [interaction, setInteraction] = useState<FineDetailsPromptInteraction>({
    focused: false,
    value: '',
  });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [animatedGhost, setAnimatedGhost] = useState<AiPromptGhost | null>(null);
  const phraseKey = getFineDetailsPromptPhraseKey(settings.phrases);
  const playablePhrases = useMemo<readonly string[]>(
    () => JSON.parse(phraseKey) as string[],
    [phraseKey],
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener('change', updatePreference);
    return () => mediaQuery.removeEventListener('change', updatePreference);
  }, []);

  useEffect(() => {
    if (!promptRoot) return;

    let isActive = true;
    const syncInteraction = () => {
      if (isActive) setInteraction(readPromptInteraction(promptRoot));
    };
    const handleFocusIn = () => syncInteraction();
    const handleFocusOut = () => queueMicrotask(syncInteraction);
    const observer = new MutationObserver(syncInteraction);

    syncInteraction();
    promptRoot.addEventListener('focusin', handleFocusIn);
    promptRoot.addEventListener('focusout', handleFocusOut);
    observer.observe(promptRoot, {
      attributeFilter: ['data-fine-details-prompt-empty'],
      attributes: true,
      subtree: true,
    });

    return () => {
      isActive = false;
      promptRoot.removeEventListener('focusin', handleFocusIn);
      promptRoot.removeEventListener('focusout', handleFocusOut);
      observer.disconnect();
    };
  }, [promptRoot]);

  const canShowGhost =
    settings.enabled &&
    imagesMode === 'trail' &&
    !interaction.focused &&
    interaction.value.length === 0 &&
    playablePhrases.length > 0;
  const shouldAnimate = canShowGhost && !prefersReducedMotion;

  useEffect(() => {
    setAnimatedGhost(null);
    if (
      !shouldAnimate ||
      !promptRoot ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    let animationFrame = 0;
    let previousTimestamp: number | null = null;
    let state = createFineDetailsPromptTypingState(settings.gap);

    const publishState = () => {
      const ghost = { caret: state.mode !== 'gap', text: state.text };
      setAnimatedGhost((currentGhost) =>
        currentGhost?.caret === ghost.caret && currentGhost.text === ghost.text
          ? currentGhost
          : ghost,
      );
    };

    const advance = (timestamp: number) => {
      const currentInteraction = readPromptInteraction(promptRoot);
      if (currentInteraction.focused || currentInteraction.value.length > 0) {
        setInteraction(currentInteraction);
        return;
      }

      if (previousTimestamp !== null) {
        state = advancePromptTyping(
          state,
          Math.max(0, (timestamp - previousTimestamp) / 1000),
          settings,
          playablePhrases,
          Math.random,
        );
        publishState();
      }
      previousTimestamp = timestamp;
      animationFrame = window.requestAnimationFrame(advance);
    };

    publishState();
    animationFrame = window.requestAnimationFrame(advance);

    return () => window.cancelAnimationFrame(animationFrame);
  }, [
    phraseKey,
    playablePhrases,
    promptRoot,
    settings.deleteSpeed,
    settings.deleteStyle,
    settings.gap,
    settings.hold,
    settings.humanize,
    settings.typeSpeed,
    shouldAnimate,
  ]);

  if (!canShowGhost) return null;
  if (prefersReducedMotion) return { caret: false, text: playablePhrases[0] };
  return animatedGhost;
}
