"use client";

import * as React from "react";

import { ScrollFade } from "../primitives";
import { cn } from "../../lib/utils";

const panelDividerClassName =
  "border-t border-[color:color-mix(in_oklab,var(--border)_8%,transparent)]";
const panelContentScrollFadeHeight = 44;
const panelContentViewportClassName =
  "flex min-h-0 flex-col overflow-x-hidden overflow-y-auto overscroll-contain";

export const PanelSurface = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function PanelSurface({ children, className, ...props }, ref) {
  return (
    <div
      {...props}
      ref={ref}
      className={cn(
        "floating-popup-surface effects-template-panel-surface isolate border text-[color:var(--popover-foreground)] supports-backdrop-filter:backdrop-blur-2xl supports-backdrop-filter:backdrop-saturate-150",
        className,
      )}
    >
      {children}
    </div>
  );
});

export const PanelContentSurface = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    scrollFadeMode?: "always" | "overflow";
    stickyFooter?: React.ReactNode;
  }
>(function PanelContentSurface(
  { children, className, scrollFadeMode = "always", stickyFooter, ...props },
  ref,
) {
  const [viewportElement, setViewportElement] =
    React.useState<HTMLDivElement | null>(null);
  const [hasOverflow, setHasOverflow] = React.useState(
    scrollFadeMode === "always",
  );
  const attachViewport = React.useCallback(
    (node: HTMLDivElement | null) => {
      setViewportElement(node);

      if (typeof ref === "function") {
        ref(node);
        return;
      }

      if (ref) {
        ref.current = node;
      }
    },
    [ref],
  );
  const hasStickyFooter = React.Children.count(stickyFooter) > 0;

  React.useLayoutEffect(() => {
    if (scrollFadeMode !== "overflow") {
      setHasOverflow(true);
      return;
    }

    if (!viewportElement) {
      setHasOverflow(false);
      return;
    }

    const updateOverflow = () => {
      setHasOverflow(
        viewportElement.scrollHeight > viewportElement.clientHeight + 1,
      );
    };

    updateOverflow();
    window.addEventListener("resize", updateOverflow);

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(updateOverflow);

    resizeObserver?.observe(viewportElement);

    const contentNode = viewportElement.firstElementChild;
    if (contentNode) {
      resizeObserver?.observe(contentNode);
    }

    return () => {
      window.removeEventListener("resize", updateOverflow);
      resizeObserver?.disconnect();
    };
  }, [scrollFadeMode, viewportElement]);

  if (scrollFadeMode === "overflow" && !hasOverflow) {
    const viewport = (
      <div
        {...props}
        className={cn(
          panelContentViewportClassName,
          hasStickyFooter ? "flex-1" : panelDividerClassName,
          className,
        )}
        ref={attachViewport}
      >
        {children}
      </div>
    );

    return hasStickyFooter ? (
      <PanelContentWithStickyFooter stickyFooter={stickyFooter}>
        {viewport}
      </PanelContentWithStickyFooter>
    ) : (
      viewport
    );
  }

  const viewport = (
    <ScrollFade
      {...props}
      className={cn("flex min-h-0 flex-col", hasStickyFooter && "flex-1", className)}
      containerClassName={cn(
        "flex min-h-0 flex-col",
        hasStickyFooter ? "flex-1" : panelDividerClassName,
      )}
      height={panelContentScrollFadeHeight}
      preset="default"
      showOppositeSide
      side="bottom"
      visibilityMode="terminal"
      viewportRef={attachViewport}
    >
      {children}
    </ScrollFade>
  );

  return hasStickyFooter ? (
    <PanelContentWithStickyFooter stickyFooter={stickyFooter}>
      {viewport}
    </PanelContentWithStickyFooter>
  ) : (
    viewport
  );
});

function PanelContentWithStickyFooter({
  children,
  stickyFooter,
}: {
  children: React.ReactNode;
  stickyFooter: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className={cn("flex min-h-0 flex-col", panelDividerClassName)}>
      {children}
      <div
        className="shrink-0"
        data-slot="effects-components-panel-sticky-actions"
      >
        {stickyFooter}
      </div>
    </div>
  );
}
