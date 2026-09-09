"use client";

import * as React from "react";
import { PanelSurface, ScrollFade } from "@/toolcraft/ui";

export type ControlsPanelSectionNavigationItem = {
  id: string;
  title: string;
};

type ControlsPanelSectionNavigationProps = {
  items: readonly ControlsPanelSectionNavigationItem[];
  rootElement: HTMLDivElement | null;
};

type NavigationLayout = {
  activeId: string | null;
  available: boolean;
  centerY: number;
  maxHeight: number;
};

const hiddenNavigationLayout: NavigationLayout = {
  activeId: null,
  available: false,
  centerY: 0,
  maxHeight: 0,
};

const controlsPanelContentSelector = '[data-slot="toolcraft-panel-content"]';
const controlsPanelSelector = '[data-panel-id="properties"]';
const controlsPanelSectionAnchorSelector =
  "[data-toolcraft-controls-section-anchor]";
const controlsPanelLeftPaddingPx = 12;
const controlsPanelHoverIntentDelayMs = 300;
const controlsPanelLeaveGraceMs = 50;
const controlsPanelScrollTolerancePx = 1;
const navigationSurfacePaddingPx = 16;
const navigationSurfaceTransitionDurationMs = 120;

function navigationLayoutsEqual(
  previous: NavigationLayout,
  next: NavigationLayout,
): boolean {
  return (
    previous.activeId === next.activeId &&
    previous.available === next.available &&
    previous.centerY === next.centerY &&
    previous.maxHeight === next.maxHeight
  );
}

function getSectionElementById(
  sectionElements: readonly HTMLElement[],
  id: string,
): HTMLElement | undefined {
  return sectionElements.find(
    (sectionElement) =>
      sectionElement.dataset.toolcraftControlsSectionAnchor === id,
  );
}

function getActiveSectionId({
  items,
  sectionElements,
  viewport,
}: {
  items: readonly ControlsPanelSectionNavigationItem[];
  sectionElements: readonly HTMLElement[];
  viewport: HTMLElement;
}): string | null {
  const reachableItems = items.filter((item) =>
    getSectionElementById(sectionElements, item.id),
  );

  if (reachableItems.length === 0) {
    return null;
  }

  const atScrollEnd =
    viewport.scrollTop + viewport.clientHeight >=
    viewport.scrollHeight - controlsPanelScrollTolerancePx;

  if (atScrollEnd) {
    return reachableItems.at(-1)?.id ?? null;
  }

  const readingLine =
    viewport.getBoundingClientRect().top + controlsPanelScrollTolerancePx;
  let activeId = reachableItems[0]?.id ?? null;

  for (const item of reachableItems) {
    const sectionElement = getSectionElementById(sectionElements, item.id);

    if (
      sectionElement &&
      sectionElement.getBoundingClientRect().top <= readingLine
    ) {
      activeId = item.id;
    }
  }

  return activeId;
}

function getNavigationLayout({
  items,
  rootElement,
  sectionElements,
  viewport,
}: {
  items: readonly ControlsPanelSectionNavigationItem[];
  rootElement: HTMLElement;
  sectionElements: readonly HTMLElement[];
  viewport: HTMLElement | null;
}): NavigationLayout {
  if (!viewport || !rootElement.contains(viewport)) {
    return hiddenNavigationLayout;
  }

  const viewportRect = viewport.getBoundingClientRect();
  const rootRect = rootElement.getBoundingClientRect();
  const hasOverflow =
    viewport.scrollHeight >
    viewport.clientHeight + controlsPanelScrollTolerancePx;
  const available = items.length > 0 && hasOverflow;

  return {
    activeId: available
      ? getActiveSectionId({ items, sectionElements, viewport })
      : null,
    available,
    centerY: viewportRect.top - rootRect.top + viewportRect.height / 2,
    maxHeight: viewportRect.height,
  };
}

function pointIsInsideRect({
  clientX,
  clientY,
  rect,
}: {
  clientX: number;
  clientY: number;
  rect: DOMRect;
}): boolean {
  return (
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom
  );
}

function pointerIsInsideNavigationRegion({
  clientX,
  clientY,
  panelRect,
  surfaceRect,
}: {
  clientX: number;
  clientY: number;
  panelRect: DOMRect;
  surfaceRect: DOMRect;
}): boolean {
  const panelHotZoneRect = {
    bottom: panelRect.bottom,
    left: panelRect.left,
    right: Math.min(
      panelRect.right,
      panelRect.left + controlsPanelLeftPaddingPx,
    ),
    top: panelRect.top,
  } as DOMRect;
  const transferCorridorRect = {
    bottom: surfaceRect.bottom,
    left: Math.min(surfaceRect.right, panelRect.left),
    right: Math.max(surfaceRect.right, panelRect.left),
    top: surfaceRect.top,
  } as DOMRect;

  return (
    pointIsInsideRect({ clientX, clientY, rect: panelHotZoneRect }) ||
    pointIsInsideRect({ clientX, clientY, rect: surfaceRect }) ||
    pointIsInsideRect({ clientX, clientY, rect: transferCorridorRect })
  );
}

export function ControlsPanelSectionNavigation({
  items,
  rootElement,
}: ControlsPanelSectionNavigationProps): React.JSX.Element | null {
  const [layout, setLayout] = React.useState<NavigationLayout>(
    hiddenNavigationLayout,
  );
  const [navigationMounted, setNavigationMounted] = React.useState(false);
  const [navigationOpen, setNavigationOpen] = React.useState(false);
  const exitTimerRef = React.useRef<number | null>(null);
  const hideTimerRef = React.useRef<number | null>(null);
  const pointerInHotZoneRef = React.useRef(false);
  const revealTimerRef = React.useRef<number | null>(null);
  const navigationButtonRefs = React.useRef(
    new Map<string, HTMLButtonElement>(),
  );
  const navigationSurfaceRef = React.useRef<HTMLDivElement | null>(null);
  const viewportRef = React.useRef<HTMLElement | null>(null);
  const sectionElementsRef = React.useRef<readonly HTMLElement[]>([]);

  const clearHideTimer = React.useCallback((): void => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);
  const clearExitTimer = React.useCallback((): void => {
    if (exitTimerRef.current !== null) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  }, []);
  const clearRevealTimer = React.useCallback((): void => {
    if (revealTimerRef.current !== null) {
      window.clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }
  }, []);
  const showNavigation = React.useCallback((): void => {
    clearExitTimer();
    setNavigationMounted(true);
    setNavigationOpen(true);
  }, [clearExitTimer]);
  const startNavigationExit = React.useCallback((): void => {
    clearExitTimer();
    setNavigationOpen(false);
    exitTimerRef.current = window.setTimeout(() => {
      exitTimerRef.current = null;
      setNavigationMounted(false);
    }, navigationSurfaceTransitionDurationMs);
  }, [clearExitTimer]);
  const scheduleHide = React.useCallback((): void => {
    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
      hideTimerRef.current = null;
      startNavigationExit();
    }, controlsPanelLeaveGraceMs);
  }, [clearHideTimer, startNavigationExit]);

  React.useLayoutEffect(() => {
    if (!rootElement || items.length === 0) {
      viewportRef.current = null;
      sectionElementsRef.current = [];
      setLayout(hiddenNavigationLayout);
      return undefined;
    }

    let animationFrame = 0;
    let viewport: HTMLElement | null = null;
    let sectionElements: readonly HTMLElement[] = [];

    const updateLayout = (): void => {
      animationFrame = 0;
      const nextLayout = getNavigationLayout({
        items,
        rootElement,
        sectionElements,
        viewport,
      });

      if (!nextLayout.available) {
        clearExitTimer();
        setNavigationMounted(false);
        setNavigationOpen(false);
      }
      setLayout((current) =>
        navigationLayoutsEqual(current, nextLayout) ? current : nextLayout,
      );
    };
    const scheduleLayoutUpdate = (): void => {
      if (animationFrame !== 0) {
        return;
      }

      animationFrame = window.requestAnimationFrame(updateLayout);
    };
    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(scheduleLayoutUpdate);
    const refreshObservedElements = (): void => {
      const nextViewport =
        rootElement.querySelector<HTMLElement>(controlsPanelContentSelector);

      if (viewport !== nextViewport) {
        viewport?.removeEventListener("scroll", scheduleLayoutUpdate);
        nextViewport?.addEventListener("scroll", scheduleLayoutUpdate, {
          passive: true,
        });
        viewport = nextViewport;
        viewportRef.current = nextViewport;
      }

      sectionElements = Array.from(
        rootElement.querySelectorAll<HTMLElement>(
          controlsPanelSectionAnchorSelector,
        ),
      );
      sectionElementsRef.current = sectionElements;

      resizeObserver?.disconnect();
      resizeObserver?.observe(rootElement);
      if (viewport) {
        resizeObserver?.observe(viewport);
      }
      sectionElements.forEach((sectionElement) => {
        resizeObserver?.observe(sectionElement);
      });
      scheduleLayoutUpdate();
    };
    const mutationObserver =
      typeof MutationObserver === "undefined"
        ? null
        : new MutationObserver(refreshObservedElements);

    refreshObservedElements();
    mutationObserver?.observe(rootElement, { childList: true, subtree: true });
    window.addEventListener("resize", scheduleLayoutUpdate);

    return () => {
      if (animationFrame !== 0) {
        window.cancelAnimationFrame(animationFrame);
      }
      viewport?.removeEventListener("scroll", scheduleLayoutUpdate);
      window.removeEventListener("resize", scheduleLayoutUpdate);
      mutationObserver?.disconnect();
      resizeObserver?.disconnect();
      viewportRef.current = null;
      sectionElementsRef.current = [];
    };
  }, [clearExitTimer, items, rootElement]);

  React.useEffect(() => {
    if (!rootElement || items.length === 0) {
      clearHideTimer();
      clearExitTimer();
      clearRevealTimer();
      pointerInHotZoneRef.current = false;
      setNavigationMounted(false);
      setNavigationOpen(false);
      return undefined;
    }

    const panelElement =
      rootElement.querySelector<HTMLElement>(controlsPanelSelector);

    if (!panelElement) {
      clearExitTimer();
      setNavigationMounted(false);
      setNavigationOpen(false);
      return undefined;
    }

    const startRevealIntent = (): void => {
      clearRevealTimer();
      revealTimerRef.current = window.setTimeout(() => {
        revealTimerRef.current = null;
        if (pointerInHotZoneRef.current) {
          showNavigation();
        }
      }, controlsPanelHoverIntentDelayMs);
    };
    const handlePanelPointerPosition = (event: PointerEvent): void => {
      const panelRect = panelElement.getBoundingClientRect();
      const withinPanelHeight =
        event.clientY >= panelRect.top && event.clientY <= panelRect.bottom;
      const withinHotZone =
        withinPanelHeight &&
        event.clientX >= panelRect.left &&
        event.clientX <=
          Math.min(panelRect.right, panelRect.left + controlsPanelLeftPaddingPx);

      if (withinHotZone === pointerInHotZoneRef.current) {
        return;
      }

      pointerInHotZoneRef.current = withinHotZone;
      if (withinHotZone) {
        clearHideTimer();
        startRevealIntent();
        return;
      }

      clearRevealTimer();
      scheduleHide();
    };
    const handlePanelPointerLeave = (): void => {
      pointerInHotZoneRef.current = false;
      clearRevealTimer();
      scheduleHide();
    };

    panelElement.addEventListener("pointerenter", handlePanelPointerPosition);
    panelElement.addEventListener("pointermove", handlePanelPointerPosition);
    panelElement.addEventListener("pointerleave", handlePanelPointerLeave);

    return () => {
      panelElement.removeEventListener(
        "pointerenter",
        handlePanelPointerPosition,
      );
      panelElement.removeEventListener("pointermove", handlePanelPointerPosition);
      panelElement.removeEventListener("pointerleave", handlePanelPointerLeave);
      clearHideTimer();
      clearExitTimer();
      clearRevealTimer();
      pointerInHotZoneRef.current = false;
    };
  }, [
    clearHideTimer,
    clearExitTimer,
    clearRevealTimer,
    items.length,
    rootElement,
    scheduleHide,
    showNavigation,
  ]);

  React.useEffect(() => {
    if (!navigationMounted || !navigationOpen || !rootElement) {
      return undefined;
    }

    const panelElement =
      rootElement.querySelector<HTMLElement>(controlsPanelSelector);

    if (!panelElement) {
      return undefined;
    }

    const handleDocumentPointerMove = (event: PointerEvent): void => {
      const surfaceElement = navigationSurfaceRef.current;

      if (
        surfaceElement &&
        pointerIsInsideNavigationRegion({
          clientX: event.clientX,
          clientY: event.clientY,
          panelRect: panelElement.getBoundingClientRect(),
          surfaceRect: surfaceElement.getBoundingClientRect(),
        })
      ) {
        clearHideTimer();
        return;
      }

      scheduleHide();
    };

    document.addEventListener("pointermove", handleDocumentPointerMove, {
      passive: true,
    });

    return () => {
      document.removeEventListener("pointermove", handleDocumentPointerMove);
    };
  }, [
    clearHideTimer,
    navigationMounted,
    navigationOpen,
    rootElement,
    scheduleHide,
  ]);

  const handleNavigationPointerEnter = React.useCallback((): void => {
    clearHideTimer();
  }, [clearHideTimer]);
  const handleNavigationPointerLeave = React.useCallback((): void => {
    clearRevealTimer();
    pointerInHotZoneRef.current = false;
    scheduleHide();
  }, [clearRevealTimer, scheduleHide]);

  const navigateToSection = React.useCallback((id: string): void => {
    const viewport = viewportRef.current;
    const sectionElement = getSectionElementById(
      sectionElementsRef.current,
      id,
    );

    if (!viewport || !sectionElement) {
      return;
    }

    const top =
      viewport.scrollTop +
      sectionElement.getBoundingClientRect().top -
      viewport.getBoundingClientRect().top;

    setLayout((current) => ({ ...current, activeId: id }));
    viewport.scrollTo({
      behavior: "auto",
      top,
    });
  }, []);

  const handleNavigationKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, itemIndex: number): void => {
      if (
        !navigationOpen ||
        (event.key !== "ArrowDown" && event.key !== "ArrowUp")
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const direction = event.key === "ArrowDown" ? 1 : -1;
      const nextIndex = (itemIndex + direction + items.length) % items.length;
      const nextItem = items[nextIndex];

      if (!nextItem) {
        return;
      }

      navigateToSection(nextItem.id);
      navigationButtonRefs.current.get(nextItem.id)?.focus();
    },
    [items, navigateToSection, navigationOpen],
  );

  if (!layout.available || !navigationMounted) {
    return null;
  }

  return (
    <div
      className="absolute z-50"
      style={{
        right: "calc(100% + 8px)",
        top: layout.centerY,
        transform: "translateY(-50%)",
      }}
    >
      <PanelSurface
        aria-hidden={navigationOpen ? undefined : true}
        className={`${navigationOpen ? "pointer-events-auto" : "pointer-events-none"} max-w-[240px] overflow-hidden rounded-lg py-2 duration-[120ms] ease-out data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-right-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-right-[2px] motion-reduce:animate-none`}
        data-state={navigationOpen ? "open" : "closed"}
        data-toolcraft-controls-section-navigation-surface=""
        onPointerEnter={handleNavigationPointerEnter}
        onPointerLeave={handleNavigationPointerLeave}
        ref={navigationSurfaceRef}
        style={{
          maxHeight: layout.maxHeight,
        }}
      >
        <ScrollFade
          className="min-h-0"
          containerClassName="min-h-0"
          data-toolcraft-controls-section-navigation-scroll-viewport=""
          preset="compact"
          showOppositeSide
          side="bottom"
          style={{
            maxHeight: Math.max(
              0,
              layout.maxHeight - navigationSurfacePaddingPx,
            ),
          }}
          visibilityMode="overflow"
        >
          <nav aria-label="Panel sections">
            <div
              className="flex flex-col gap-2 px-3"
              data-toolcraft-controls-section-navigation-list=""
            >
              {items.map((item, itemIndex) => {
                const current = item.id === layout.activeId;

                return (
                  <button
                    aria-current={current ? "location" : undefined}
                    className="relative w-full whitespace-nowrap px-0 py-0.5 text-left text-[13px] leading-4 text-[color:color-mix(in_oklab,var(--foreground)_50%,transparent)] outline-none transition-colors hover:text-[color:color-mix(in_oklab,var(--foreground)_80%,transparent)] focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--popover)] data-[current=true]:text-[color:var(--foreground)] data-[current=true]:hover:text-[color:var(--foreground)]"
                    data-current={current ? "true" : undefined}
                    key={item.id}
                    onClick={() => navigateToSection(item.id)}
                    onKeyDown={(event) =>
                      handleNavigationKeyDown(event, itemIndex)
                    }
                    ref={(buttonElement) => {
                      if (buttonElement) {
                        navigationButtonRefs.current.set(
                          item.id,
                          buttonElement,
                        );
                      } else {
                        navigationButtonRefs.current.delete(item.id);
                      }
                    }}
                    type="button"
                  >
                    {item.title}
                  </button>
                );
              })}
            </div>
          </nav>
        </ScrollFade>
      </PanelSurface>
    </div>
  );
}
