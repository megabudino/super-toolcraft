import type { FineDetailsPromptTypingSettings } from './fine-details-settings';

export const FINE_DETAILS_TYPING_JITTER_MIN = -0.55;
export const FINE_DETAILS_TYPING_JITTER_MAX = 1.1;
export const FINE_DETAILS_TYPING_PAUSE_CHANCE = 0.03;
export const FINE_DETAILS_TYPING_PAUSE_MIN_SECONDS = 0.4;
export const FINE_DETAILS_TYPING_PAUSE_MAX_SECONDS = 1;
export const FINE_DETAILS_TYPING_WORD_RHYTHM = 0.12;
export const FINE_DETAILS_TYPING_MAX_ADVANCE_SECONDS = 1;
export const FINE_DETAILS_TYPING_MAX_TRANSITIONS_PER_ADVANCE = 512;

export type FineDetailsPromptTypingMode = 'deleting' | 'gap' | 'holding' | 'typing';

export interface FineDetailsPromptTypingState {
  charIndex: number;
  mode: FineDetailsPromptTypingMode;
  phraseIndex: number;
  text: string;
  waitSeconds: number;
}

export function createFineDetailsPromptTypingState(gapSeconds = 0): FineDetailsPromptTypingState {
  return {
    charIndex: 0,
    mode: gapSeconds > 0 ? 'gap' : 'typing',
    phraseIndex: gapSeconds > 0 ? -1 : 0,
    text: '',
    waitSeconds: Math.max(0, gapSeconds),
  };
}

export function getFineDetailsPromptPhraseKey(phrases: readonly string[]) {
  return JSON.stringify(phrases.filter((phrase) => phrase.length > 0));
}

function clampRandom(random: () => number) {
  const value = random();
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0.5;
}

function getTypingDelay(
  phrase: string,
  typedCharacterIndex: number,
  config: FineDetailsPromptTypingSettings,
  random: () => number,
) {
  const baseDelay = 1 / config.typeSpeed;
  if (config.humanize === 0) return baseDelay;

  const jitter =
    FINE_DETAILS_TYPING_JITTER_MIN +
    clampRandom(random) * (FINE_DETAILS_TYPING_JITTER_MAX - FINE_DETAILS_TYPING_JITTER_MIN);
  const typedCharacter = phrase[typedCharacterIndex];
  const nextCharacter = phrase[typedCharacterIndex + 1];
  const rhythm =
    typedCharacter === ' '
      ? 1 - FINE_DETAILS_TYPING_WORD_RHYTHM * config.humanize
      : nextCharacter === ' '
        ? 1 + FINE_DETAILS_TYPING_WORD_RHYTHM * config.humanize
        : 1;
  let delay = baseDelay * (1 + config.humanize * jitter) * rhythm;

  if (clampRandom(random) < FINE_DETAILS_TYPING_PAUSE_CHANCE * config.humanize) {
    delay +=
      FINE_DETAILS_TYPING_PAUSE_MIN_SECONDS +
      clampRandom(random) *
        (FINE_DETAILS_TYPING_PAUSE_MAX_SECONDS - FINE_DETAILS_TYPING_PAUSE_MIN_SECONDS);
  }

  return delay;
}

function getNextPlayablePhraseIndex(phrases: readonly string[], phraseIndex: number) {
  for (let offset = 1; offset <= phrases.length; offset += 1) {
    const candidateIndex = (phraseIndex + offset + phrases.length) % phrases.length;
    if (phrases[candidateIndex]?.length > 0) return candidateIndex;
  }
  return -1;
}

function resetInvalidState(
  state: FineDetailsPromptTypingState,
  phrase: string,
  firstPhraseIndex: number,
) {
  const hasValidIndex =
    Number.isInteger(state.charIndex) && state.charIndex >= 0 && state.charIndex <= phrase.length;
  const hasMatchingText =
    hasValidIndex && state.text === phrase.slice(0, state.charIndex) && state.text.length > 0;
  const isEmptyGap = state.mode === 'gap' && state.charIndex === 0 && state.text === '';
  const isEmptyTyping = state.mode === 'typing' && state.charIndex === 0 && state.text === '';
  const isFullHold =
    state.mode === 'holding' && state.charIndex === phrase.length && state.text === phrase;
  const isValidDeletion = state.mode === 'deleting' && hasMatchingText;
  const isValidTyping = state.mode === 'typing' && (hasMatchingText || isEmptyTyping);

  return isEmptyGap || isFullHold || isValidDeletion || isValidTyping
    ? state
    : { ...createFineDetailsPromptTypingState(), phraseIndex: firstPhraseIndex };
}

export function advancePromptTyping(
  state: FineDetailsPromptTypingState,
  dtSeconds: number,
  config: FineDetailsPromptTypingSettings,
  phrases: readonly string[],
  random: () => number,
): FineDetailsPromptTypingState {
  if (!Number.isFinite(dtSeconds) || dtSeconds <= 0) return state;

  const firstPhraseIndex = getNextPlayablePhraseIndex(phrases, -1);
  if (firstPhraseIndex === -1) {
    return { ...createFineDetailsPromptTypingState(), phraseIndex: -1 };
  }

  let next =
    state.mode === 'gap' && state.phraseIndex === -1 && state.charIndex === 0 && state.text === ''
      ? state
      : Number.isInteger(state.phraseIndex) &&
          state.phraseIndex >= 0 &&
          state.phraseIndex < phrases.length &&
          phrases[state.phraseIndex]?.length > 0
        ? resetInvalidState(state, phrases[state.phraseIndex], firstPhraseIndex)
        : { ...createFineDetailsPromptTypingState(), phraseIndex: firstPhraseIndex };
  let remainingSeconds = Math.min(dtSeconds, FINE_DETAILS_TYPING_MAX_ADVANCE_SECONDS);

  for (
    let transition = 0;
    transition < FINE_DETAILS_TYPING_MAX_TRANSITIONS_PER_ADVANCE;
    transition += 1
  ) {
    if (next.waitSeconds > remainingSeconds) {
      return { ...next, waitSeconds: next.waitSeconds - remainingSeconds };
    }

    remainingSeconds -= next.waitSeconds;
    const phrase = phrases[next.phraseIndex] ?? phrases[firstPhraseIndex];

    if (next.mode === 'gap') {
      next = {
        charIndex: 0,
        mode: 'typing',
        phraseIndex: getNextPlayablePhraseIndex(phrases, next.phraseIndex),
        text: '',
        waitSeconds: 0,
      };
      continue;
    }

    if (next.mode === 'holding') {
      if (config.deleteStyle === 'instant') {
        next = {
          charIndex: 0,
          mode: 'gap',
          phraseIndex: next.phraseIndex,
          text: '',
          waitSeconds: config.gap,
        };
      } else {
        next = { ...next, mode: 'deleting', waitSeconds: 1 / config.deleteSpeed };
      }
      continue;
    }

    if (next.mode === 'deleting') {
      const charIndex = Math.max(0, next.charIndex - 1);
      next = {
        charIndex,
        mode: charIndex === 0 ? 'gap' : 'deleting',
        phraseIndex: next.phraseIndex,
        text: phrase.slice(0, charIndex),
        waitSeconds: charIndex === 0 ? config.gap : 1 / config.deleteSpeed,
      };
      continue;
    }

    const typedCharacterIndex = next.charIndex;
    const charIndex = Math.min(phrase.length, typedCharacterIndex + 1);
    next = {
      charIndex,
      mode: charIndex === phrase.length ? 'holding' : 'typing',
      phraseIndex: next.phraseIndex,
      text: phrase.slice(0, charIndex),
      waitSeconds:
        charIndex === phrase.length
          ? config.hold
          : getTypingDelay(phrase, typedCharacterIndex, config, random),
    };
  }

  return next;
}
