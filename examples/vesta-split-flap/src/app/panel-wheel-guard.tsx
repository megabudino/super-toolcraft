import * as React from "react";

type PanelWheelGuard = {
  bottom: number;
  expiresAt: number;
  left: number;
  right: number;
  top: number;
};

const panelWheelGuardDurationMs = 850;
const panelHostSelector = '[data-slot="creative-apps-kit-runtime-panel-host"]';
const runtimeAppSelector = '[data-slot="creative-apps-kit-runtime-app"]';
const runtimeCanvasSelector = '[data-slot="creative-apps-kit-runtime-canvas"]';

function getContainingPanelHost(target: EventTarget | null): HTMLElement | null {
  return target instanceof Element ? target.closest<HTMLElement>(panelHostSelector) : null;
}

function isTargetInsideElement(target: EventTarget | null, element: HTMLElement): boolean {
  return target instanceof Node && element.contains(target);
}

function isPointInGuard(
  guard: PanelWheelGuard,
  clientX: number,
  clientY: number,
  now: number,
): boolean {
  return (
    now <= guard.expiresAt &&
    clientX >= guard.left &&
    clientX <= guard.right &&
    clientY >= guard.top &&
    clientY <= guard.bottom
  );
}

export function ResidualPanelWheelGuard(): null {
  React.useEffect(() => {
    let guards: PanelWheelGuard[] = [];

    const pruneGuards = (now = window.performance.now()): void => {
      guards = guards.filter((guard) => guard.expiresAt > now);
    };

    const storePanelGuard = (panelHost: HTMLElement): void => {
      const rect = panelHost.getBoundingClientRect();

      if (rect.width <= 0 || rect.height <= 0) {
        return;
      }

      const now = window.performance.now();

      pruneGuards(now);
      guards = [
        ...guards,
        {
          bottom: rect.bottom,
          expiresAt: now + panelWheelGuardDurationMs,
          left: rect.left,
          right: rect.right,
          top: rect.top,
        },
      ];
    };

    const refreshGuardAtPoint = (clientX: number, clientY: number, now: number): void => {
      guards = guards.map((guard) =>
        isPointInGuard(guard, clientX, clientY, now)
          ? { ...guard, expiresAt: now + panelWheelGuardDurationMs }
          : guard,
      );
    };

    const handlePanelInteraction = (event: PointerEvent | MouseEvent): void => {
      const panelHost = getContainingPanelHost(event.target);

      if (panelHost) {
        storePanelGuard(panelHost);
      }
    };

    const handleWheel = (event: WheelEvent): void => {
      const panelHost = getContainingPanelHost(event.target);

      if (panelHost) {
        storePanelGuard(panelHost);
        return;
      }

      const runtimeApp = document.querySelector<HTMLElement>(runtimeAppSelector);
      const runtimeCanvas = runtimeApp?.querySelector<HTMLElement>(runtimeCanvasSelector);

      if (!runtimeCanvas || !isTargetInsideElement(event.target, runtimeCanvas)) {
        return;
      }

      const now = window.performance.now();

      pruneGuards(now);

      if (!guards.some((guard) => isPointInGuard(guard, event.clientX, event.clientY, now))) {
        return;
      }

      refreshGuardAtPoint(event.clientX, event.clientY, now);
      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();
    };

    window.addEventListener("pointerdown", handlePanelInteraction, true);
    window.addEventListener("click", handlePanelInteraction, true);
    window.addEventListener("wheel", handleWheel, { capture: true, passive: false });

    return () => {
      window.removeEventListener("pointerdown", handlePanelInteraction, true);
      window.removeEventListener("click", handlePanelInteraction, true);
      window.removeEventListener("wheel", handleWheel, true);
    };
  }, []);

  return null;
}
