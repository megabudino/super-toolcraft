import { GlobePlayer } from "./globe-player";

export type NeonGlobeValues = Readonly<Record<string, unknown>>;

export interface NeonGlobeOptions {
  values?: NeonGlobeValues;
  /** Backing resolution multiplier, from 1 to 2. Defaults to 2. */
  renderScale?: number;
  /** Auto honors reduced motion; still always renders the final positions. */
  motion?: "auto" | "still";
}

export interface NeonGlobe {
  readonly canvas: HTMLCanvasElement;
  update(values: NeonGlobeValues): void;
  pause(): void;
  resume(): void;
  restart(): void;
  destroy(): void;
}

const instances = new WeakMap<HTMLElement, NeonGlobe>();

/** Mount inside an explicitly sized, position: relative container. */
export function createNeonGlobe(container: HTMLElement, options: NeonGlobeOptions = {}): NeonGlobe {
  if (!container?.ownerDocument?.defaultView) {
    throw new TypeError("createNeonGlobe requires a browser HTMLElement.");
  }
  if (instances.has(container)) {
    throw new Error("This container already has a globe. Destroy it before mounting again.");
  }
  if (options.motion !== undefined && options.motion !== "auto" && options.motion !== "still") {
    throw new TypeError("motion must be auto or still.");
  }
  const globe = new GlobePlayer(container, options, () => instances.delete(container));
  instances.set(container, globe);
  return globe;
}
