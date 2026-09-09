export interface HomeHeroMediaReadiness {
  markSettled(): void;
  subscribe(listener: () => void): () => void;
}

export function createHomeHeroMediaReadiness(): HomeHeroMediaReadiness {
  let isSettled = false;
  const listeners = new Set<() => void>();

  return {
    markSettled() {
      if (isSettled) return;

      isSettled = true;
      for (const listener of listeners) listener();
      listeners.clear();
    },
    subscribe(listener) {
      if (isSettled) {
        listener();
        return () => {};
      }

      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export const homeHeroMediaReadiness = createHomeHeroMediaReadiness();
