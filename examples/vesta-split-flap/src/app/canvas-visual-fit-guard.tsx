import * as React from "react";

import { useCreativeAppsKit } from "@/creative-apps-kit/template-runtime/react";

const visualFitAttribute = "data-vestaboard-visual-fit";
const runtimeAppSelector = '[data-slot="creative-apps-kit-runtime-app"]';
const canvasWorldSelector = "[data-creative-apps-kit-canvas-world]";
const controlsPanelSelector =
  '[data-slot="creative-apps-kit-runtime-panel-host"][data-panel-type="controls"]';
const controlsPanelCollapseButtonSelector =
  'button[aria-label="Collapse controls"], button[aria-label="Expand controls"]';
const controlsPanelOpenOverlapThresholdPx = 2;
const controlsPanelCollapseVisualFitHoldMs = 2200;
const controlsPanelSafeMarginPx = 16;

function isControlsPanelCollapseToggle(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false;
  }

  const button = target.closest(controlsPanelCollapseButtonSelector);

  return Boolean(button?.closest(controlsPanelSelector));
}

function isControlsPanelCollapsed(): boolean {
  const controlsPanel = document.querySelector<HTMLElement>(controlsPanelSelector);

  return Boolean(controlsPanel?.querySelector('button[aria-label="Expand controls"]'));
}

function clearVisualFit(appElement: HTMLElement): void {
  appElement.removeAttribute(visualFitAttribute);
  appElement.style.removeProperty("--vestaboard-canvas-fit-offset-x");
  appElement.style.removeProperty("--vestaboard-canvas-fit-offset-y");
  appElement.style.removeProperty("--vestaboard-canvas-fit-scale");
}

export function CanvasVisualFitGuard(): null {
  const { state } = useCreativeAppsKit();
  const clearVisualFitTimerRef = React.useRef(0);
  const holdVisualFitUntilRef = React.useRef(0);

  const scheduleHeldVisualFitClear = React.useCallback(() => {
    window.clearTimeout(clearVisualFitTimerRef.current);
    clearVisualFitTimerRef.current = window.setTimeout(() => {
      const appElement = document.querySelector<HTMLElement>(runtimeAppSelector);

      if (appElement && isControlsPanelCollapsed()) {
        clearVisualFit(appElement);
      }
    }, controlsPanelCollapseVisualFitHoldMs);
  }, []);

  React.useEffect(
    () => () => {
      const appElement = document.querySelector<HTMLElement>(runtimeAppSelector);

      window.clearTimeout(clearVisualFitTimerRef.current);

      if (appElement) {
        clearVisualFit(appElement);
      }
    },
    [],
  );

  React.useEffect(() => {
    const handlePotentialCollapse = (event: PointerEvent | MouseEvent) => {
      if (isControlsPanelCollapseToggle(event.target)) {
        holdVisualFitUntilRef.current =
          window.performance.now() + controlsPanelCollapseVisualFitHoldMs;
        scheduleHeldVisualFitClear();
      }
    };

    window.addEventListener("pointerdown", handlePotentialCollapse, true);
    window.addEventListener("click", handlePotentialCollapse, true);

    return () => {
      window.removeEventListener("pointerdown", handlePotentialCollapse, true);
      window.removeEventListener("click", handlePotentialCollapse, true);
    };
  }, [scheduleHeldVisualFitClear]);

  React.useEffect(() => {
    const appElement = document.querySelector<HTMLElement>(runtimeAppSelector);
    const canvasWorld = document.querySelector<HTMLElement>(canvasWorldSelector);
    const controlsPanel = document.querySelector<HTMLElement>(controlsPanelSelector);

    if (!appElement || !canvasWorld || !controlsPanel || state.panels.controls.collapsed) {
      if (appElement && state.panels.controls.collapsed) {
        scheduleHeldVisualFitClear();
      } else if (appElement) {
        clearVisualFit(appElement);
      }

      return undefined;
    }

    let animationFrame = 0;
    const updateVisualFit = () => {
      const appRect = appElement.getBoundingClientRect();
      const panelRect = controlsPanel.getBoundingClientRect();
      const currentScale = state.canvas.zoom / 100;
      const currentOutputWidth = state.canvas.size.width * currentScale;
      const currentOutputCenterX = appRect.left + appRect.width / 2 + state.canvas.offset.x;
      const currentOutputRight = currentOutputCenterX + currentOutputWidth / 2;
      const panelIsOpen = panelRect.height > 96;
      const panelOverlapsOutput =
        panelIsOpen && currentOutputRight - panelRect.left > controlsPanelOpenOverlapThresholdPx;
      const safeLeft = appRect.left + controlsPanelSafeMarginPx;
      const safeRight = panelRect.left - controlsPanelSafeMarginPx;
      const safeWidth = Math.max(0, safeRight - safeLeft);

      if (!panelOverlapsOutput || safeWidth <= 0) {
        if (
          window.performance.now() < holdVisualFitUntilRef.current &&
          appElement.getAttribute(visualFitAttribute) === "panel-safe"
        ) {
          return;
        }

        clearVisualFit(appElement);
        return;
      }

      const safeScale = Math.min(currentScale, safeWidth / state.canvas.size.width);
      const safeOutputWidth = state.canvas.size.width * safeScale;
      const minCenterX = safeLeft + safeOutputWidth / 2;
      const maxCenterX = safeRight - safeOutputWidth / 2;
      const safeCenterX =
        minCenterX <= maxCenterX
          ? Math.min(maxCenterX, Math.max(minCenterX, currentOutputCenterX))
          : safeLeft + safeWidth / 2;
      const safeOffsetX = safeCenterX - (appRect.left + appRect.width / 2);

      appElement.setAttribute(visualFitAttribute, "panel-safe");
      appElement.style.setProperty("--vestaboard-canvas-fit-offset-x", `${safeOffsetX}px`);
      appElement.style.setProperty("--vestaboard-canvas-fit-offset-y", `${state.canvas.offset.y}px`);
      appElement.style.setProperty("--vestaboard-canvas-fit-scale", String(safeScale));
    };
    const scheduleVisualFit = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(updateVisualFit);
    };
    const observer = new ResizeObserver(scheduleVisualFit);

    updateVisualFit();
    observer.observe(appElement);
    observer.observe(controlsPanel);
    window.addEventListener("resize", scheduleVisualFit);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      observer.disconnect();
      window.removeEventListener("resize", scheduleVisualFit);
    };
  }, [
    state.canvas.offset.x,
    state.canvas.offset.y,
    state.canvas.size.width,
    state.canvas.zoom,
    state.panels.controls.collapsed,
    scheduleHeldVisualFitClear,
  ]);

  return null;
}
