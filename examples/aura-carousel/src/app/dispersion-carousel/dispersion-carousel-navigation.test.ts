import { afterEach, describe, expect, it, vi } from "vitest";

import {
  bindCarouselMouseDrag,
  getCarouselArrowTarget,
  getWrappedScrollDelta,
  normalizeCarouselScroll,
  snapCarouselScroll,
} from "./dispersion-carousel-navigation";
import { DISPERSION_CAROUSEL_CYCLE_WIDTH as cycle } from "./dispersion-carousel-values";

function createDragFixture(scale = 1) {
  const hostWindow = new EventTarget();
  vi.stubGlobal("window", hostWindow);
  const captures = new Set<number>();
  const node = Object.assign(new EventTarget(), {
    clientWidth: 1920,
    dataset: {} as Record<string, string>,
    focus: vi.fn(),
    getBoundingClientRect: () => ({ width: 1920 * scale }),
    setPointerCapture: vi.fn((id: number) => captures.add(id)),
    hasPointerCapture: (id: number) => captures.has(id),
    releasePointerCapture: vi.fn((id: number) => captures.delete(id)),
  });
  const callbacks = { onStart: vi.fn(), onDelta: vi.fn(), onEnd: vi.fn() };
  const drag = bindCarouselMouseDrag(node as unknown as HTMLElement, callbacks);
  const pointer = (type: string, values: Partial<PointerEvent> = {}) => {
    const event = Object.assign(new Event(type, { cancelable: true }), {
      pointerId: 7, pointerType: "mouse", button: 0, buttons: 1, clientX: 400,
      ctrlKey: false, metaKey: false, altKey: false, ...values,
    });
    node.dispatchEvent(event);
    return event;
  };
  return { node, callbacks, drag, pointer, hostWindow };
}

afterEach(() => vi.unstubAllGlobals());

describe("carousel mouse navigation", () => {
  it("tracks both directions in scene coordinates and releases capture once", () => {
    const { node, callbacks, drag, pointer } = createDragFixture(0.5);
    expect(pointer("pointerdown").defaultPrevented).toBe(true);
    expect(drag.isDragging()).toBe(true);
    expect(node.dataset.carouselDragging).toBe("true");
    expect(node.focus).toHaveBeenCalledWith({ preventScroll: true });
    pointer("pointermove", { clientX: 300 });
    pointer("pointermove", { clientX: 350 });
    pointer("pointermove", { pointerId: 8, clientX: 100 });
    expect(callbacks.onDelta.mock.calls).toEqual([[200], [-100]]);
    expect(callbacks.onEnd).not.toHaveBeenCalled();
    pointer("pointerup", { buttons: 0 });
    pointer("lostpointercapture");
    pointer("pointermove", { clientX: 100 });
    expect(callbacks.onEnd).toHaveBeenCalledTimes(1);
    expect(callbacks.onDelta).toHaveBeenCalledTimes(2);
    expect(node.releasePointerCapture).toHaveBeenCalledWith(7);
    expect(node.dataset.carouselDragging).toBeUndefined();
    expect(drag.isDragging()).toBe(false);
    drag.dispose();
  });

  it("leaves native touch, pen, modified and non-primary presses alone", () => {
    const { callbacks, drag, pointer } = createDragFixture();
    for (const values of [{ pointerType: "touch" }, { pointerType: "pen" },
      { button: 1 }, { button: 2 }, { ctrlKey: true }, { metaKey: true }, { altKey: true }]) {
      expect(pointer("pointerdown", values).defaultPrevented).toBe(false);
    }
    expect(callbacks.onStart).not.toHaveBeenCalled();
    expect(drag.isDragging()).toBe(false);
    drag.dispose();
  });

  it.each(["pointercancel", "lostpointercapture", "blur", "missing-button"])(
    "finishes safely on %s without a stuck gesture",
    (reason) => {
      const { callbacks, drag, pointer, hostWindow } = createDragFixture();
      pointer("pointerdown");
      if (reason === "blur") hostWindow.dispatchEvent(new Event("blur"));
      else if (reason === "missing-button") pointer("pointermove", { buttons: 0 });
      else pointer(reason);
      expect(drag.isDragging()).toBe(false);
      expect(callbacks.onEnd).toHaveBeenCalledTimes(1);
      pointer("pointerdown");
      expect(drag.isDragging()).toBe(true);
      drag.dispose();
      expect(callbacks.onEnd).toHaveBeenCalledTimes(1);
      pointer("pointerdown");
      expect(drag.isDragging()).toBe(false);
    },
  );

  it("keeps snapping and velocity continuous across either cyclic seam", () => {
    expect(normalizeCarouselScroll(cycle + 70)).toBe(70);
    expect(normalizeCarouselScroll(-70)).toBe(cycle - 70);
    expect(snapCarouselScroll(cycle - 70)).toBe(0);
    expect(getWrappedScrollDelta(10, cycle - 10)).toBe(20);
    expect(getWrappedScrollDelta(cycle - 10, 10)).toBe(-20);
  });

  it("targets the adjacent card directly after a free-position drag", () => {
    expect(getCarouselArrowTarget(170, 1)).toBe(464);
    expect(getCarouselArrowTarget(290, -1)).toBe(0);
    expect(getCarouselArrowTarget(464, 1)).toBe(928);
    expect(getCarouselArrowTarget(464, -1)).toBe(0);
    expect(getCarouselArrowTarget(cycle - 100, 1)).toBe(cycle);
    expect(getCarouselArrowTarget(0, -1)).toBe(-464);
  });
});
