import {
  DISPERSION_CAROUSEL_CARD_PITCH,
  DISPERSION_CAROUSEL_CYCLE_WIDTH,
} from "./dispersion-carousel-values";

export function normalizeCarouselScroll(value: number): number {
  return ((value % DISPERSION_CAROUSEL_CYCLE_WIDTH) +
    DISPERSION_CAROUSEL_CYCLE_WIDTH) % DISPERSION_CAROUSEL_CYCLE_WIDTH;
}

export function snapCarouselScroll(value: number): number {
  return normalizeCarouselScroll(
    Math.round(value / DISPERSION_CAROUSEL_CARD_PITCH) * DISPERSION_CAROUSEL_CARD_PITCH,
  );
}

export function easeOutCubic(value: number): number {
  return 1 - (1 - value) ** 3;
}

/** Keep the target unwrapped so arrow motion stays forward across a seam. */
export function getCarouselArrowTarget(value: number, direction: -1 | 1): number {
  const card = value / DISPERSION_CAROUSEL_CARD_PITCH;
  return (direction > 0 ? Math.floor(card) + 1 : Math.ceil(card) - 1) *
    DISPERSION_CAROUSEL_CARD_PITCH;
}

export function readWheelDelta(event: WheelEvent, pageSize: number): number {
  const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? pageSize : 1;
  const dx = event.deltaX * scale;
  const dy = event.deltaY * scale;
  return Math.abs(dx) >= Math.abs(dy) ? dx : event.shiftKey ? dy : 0;
}

export function getWrappedScrollDelta(current: number, previous: number): number {
  const delta = current - previous;
  if (delta > DISPERSION_CAROUSEL_CYCLE_WIDTH / 2) {
    return delta - DISPERSION_CAROUSEL_CYCLE_WIDTH;
  }
  if (delta < -DISPERSION_CAROUSEL_CYCLE_WIDTH / 2) {
    return delta + DISPERSION_CAROUSEL_CYCLE_WIDTH;
  }
  return delta;
}

/** Own only mouse browsing; native touch scrolling stays on the overflow rail. */
export function bindCarouselMouseDrag(
  node: HTMLElement,
  callbacks: { onStart(): void; onDelta(delta: number): void; onEnd(): void },
): { dispose(): void; isDragging(): boolean } {
  let drag: { pointerId: number; x: number; scale: number } | null = null;

  const finish = (notify: boolean): void => {
    if (!drag) return;
    const { pointerId } = drag;
    drag = null;
    delete node.dataset.carouselDragging;
    if (node.hasPointerCapture(pointerId)) node.releasePointerCapture(pointerId);
    if (notify) callbacks.onEnd();
  };

  const handleDown = (event: PointerEvent): void => {
    if (drag || event.defaultPrevented || event.pointerType !== "mouse" ||
      event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey) return;
    event.preventDefault();
    event.stopPropagation();
    node.setPointerCapture(event.pointerId);
    const visualWidth = node.getBoundingClientRect().width;
    drag = {
      pointerId: event.pointerId,
      x: event.clientX,
      scale: visualWidth > 0 && node.clientWidth > 0 ? visualWidth / node.clientWidth : 1,
    };
    node.dataset.carouselDragging = "true";
    node.focus({ preventScroll: true });
    callbacks.onStart();
  };

  const handleMove = (event: PointerEvent): void => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    if ((event.buttons & 1) === 0) {
      finish(true);
      return;
    }
    const delta = (drag.x - event.clientX) / drag.scale;
    drag.x = event.clientX;
    if (delta !== 0) callbacks.onDelta(delta);
  };

  const handleEnd = (event: PointerEvent): void => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    event.stopPropagation();
    finish(true);
  };
  const handleBlur = (): void => finish(true);

  node.addEventListener("pointerdown", handleDown);
  node.addEventListener("pointermove", handleMove);
  node.addEventListener("pointerup", handleEnd);
  node.addEventListener("pointercancel", handleEnd);
  node.addEventListener("lostpointercapture", handleEnd);
  window.addEventListener("blur", handleBlur);

  return {
    isDragging: () => drag !== null,
    dispose() {
      node.removeEventListener("pointerdown", handleDown);
      node.removeEventListener("pointermove", handleMove);
      node.removeEventListener("pointerup", handleEnd);
      node.removeEventListener("pointercancel", handleEnd);
      node.removeEventListener("lostpointercapture", handleEnd);
      window.removeEventListener("blur", handleBlur);
      finish(false);
    },
  };
}
