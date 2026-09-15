import { vi } from "vitest";

class Signals {
  private listeners = new Map<string, Set<EventListenerOrEventListenerObject>>();

  addEventListener = (type: string, listener: EventListenerOrEventListenerObject) => {
    const listeners = this.listeners.get(type) ?? new Set();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  };

  removeEventListener = (type: string, listener: EventListenerOrEventListenerObject) => {
    this.listeners.get(type)?.delete(listener);
  };

  emit(type: string) {
    for (const listener of [...(this.listeners.get(type) ?? [])]) {
      const event = new Event(type);
      if (typeof listener === "function") listener(event);
      else listener.handleEvent(event);
    }
  }

  get listenerCount() {
    return [...this.listeners.values()].reduce((count, listeners) => count + listeners.size, 0);
  }
}

class Query extends Signals {
  constructor(readonly media: string, public matches: boolean) { super(); }
  change(matches: boolean) {
    this.matches = matches;
    this.emit("change");
  }
}

export function createBrowserFixture({ dpr = 1, reduced = false } = {}) {
  const frames = new Map<number, FrameRequestCallback>();
  let frameId = 0;
  const canvases: ReturnType<typeof makeCanvas>[] = [];
  const queries: Query[] = [];
  const resizeObservers: TestResizeObserver[] = [];
  const intersectionObservers: TestIntersectionObserver[] = [];

  function makeCanvas() {
    const context = { setTransform: vi.fn() };
    return {
      width: 300, height: 150, style: {}, context,
      setAttribute: vi.fn(), getContext: vi.fn(() => context), remove: vi.fn(),
    };
  }

  class TestResizeObserver {
    observe = vi.fn();
    disconnect = vi.fn();
    constructor(readonly callback: () => void) { resizeObservers.push(this); }
  }

  class TestIntersectionObserver {
    observe = vi.fn();
    disconnect = vi.fn();
    constructor(readonly callback: (entries: unknown[]) => void) { intersectionObservers.push(this); }
  }

  const win = Object.assign(new Signals(), {
    devicePixelRatio: dpr,
    ResizeObserver: TestResizeObserver,
    IntersectionObserver: TestIntersectionObserver,
    requestAnimationFrame: vi.fn((callback: FrameRequestCallback) => {
      frames.set(++frameId, callback);
      return frameId;
    }),
    cancelAnimationFrame: vi.fn((id: number) => { frames.delete(id); }),
    matchMedia: vi.fn((media: string) => {
      const query = new Query(media, media.includes("prefers-reduced-motion") ? reduced : true);
      queries.push(query);
      return query;
    }),
  });
  const doc = Object.assign(new Signals(), {
    hidden: false,
    defaultView: win,
    createElement: vi.fn(() => {
      const canvas = makeCanvas();
      canvases.push(canvas);
      return canvas;
    }),
  });

  return {
    win, doc, frames, canvases, queries, resizeObservers, intersectionObservers,
    host(width = 640, height = 360) {
      return { ownerDocument: doc, clientWidth: width, clientHeight: height, append: vi.fn() } as unknown as HTMLElement;
    },
    show(host: HTMLElement, visible = true) {
      for (const observer of intersectionObservers) {
        if (observer.observe.mock.calls.some(([target]) => target === host)) {
          observer.callback([{ target: host, isIntersecting: visible, intersectionRatio: visible ? 1 : 0 }]);
        }
      }
    },
    frame(now: number) {
      const pending = [...frames.values()];
      frames.clear();
      for (const callback of pending) callback(now);
    },
    resize(host: HTMLElement, width: number, height: number) {
      Object.assign(host, { clientWidth: width, clientHeight: height });
      for (const observer of resizeObservers) observer.callback();
    },
    hide(hidden: boolean) {
      doc.hidden = hidden;
      doc.emit("visibilitychange");
    },
    reduce(matches: boolean) {
      for (const query of queries.filter((query) => query.media.includes("prefers-reduced-motion"))) {
        query.change(matches);
      }
    },
  };
}
