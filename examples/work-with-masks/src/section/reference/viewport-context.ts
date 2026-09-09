import { createContext, useContext, type RefObject } from 'react';

export type HeroViewport = {
  width: number;
  height: number;
  scrollRef: RefObject<HTMLDivElement | null>;
  animationSuspended: boolean;
};

export const HeroViewportContext = createContext<HeroViewport | null>(null);

export function useHeroViewport(): HeroViewport {
  const viewport = useContext(HeroViewportContext);
  if (!viewport) throw new Error('Hero components require the native section viewport.');
  return viewport;
}
