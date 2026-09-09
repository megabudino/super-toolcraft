import * as React from "react";

import type {
  ToolcraftControlRendererMap,
  ToolcraftCustomControlRendererProps,
} from "@/toolcraft/runtime/react";
import {
  Button,
  Field,
  ScrollFade,
  ToggleGroup,
  ToggleGroupItem,
} from "@/toolcraft/ui";

import { MICROGRAPH_TEMPLATE_DRAG_TYPE } from "./template-placement";
import { templateTier } from "./template-catalog";
import { micrographTemplateItems } from "./template-thumbnails";
import styles from "./template-library-control.module.css";

export const TEMPLATE_LIBRARY_MAX_VISIBLE_ROWS = 10;

function TemplateLibraryControl({
  setValue,
  value,
}: ToolcraftCustomControlRendererProps): React.JSX.Element {
  const selectedValue = typeof value === "string" ? value : "";
  const [tier, setTier] = React.useState<"mega" | "simple">("mega");
  const [maxGridHeight, setMaxGridHeight] = React.useState<number>();
  const gridRef = React.useRef<HTMLDivElement>(null);
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const items = micrographTemplateItems.filter(
    (item) => templateTier(item.value) === tier,
  );

  React.useLayoutEffect(() => {
    const grid = gridRef.current;
    const firstTile = grid?.firstElementChild;

    if (!grid || !(firstTile instanceof HTMLElement)) {
      return;
    }

    const measure = () => {
      const rowGap = Number.parseFloat(window.getComputedStyle(grid).rowGap) || 0;
      const tileHeight = firstTile.getBoundingClientRect().height;
      const nextHeight =
        tileHeight * TEMPLATE_LIBRARY_MAX_VISIBLE_ROWS +
        rowGap * (TEMPLATE_LIBRARY_MAX_VISIBLE_ROWS - 1);

      setMaxGridHeight((currentHeight) =>
        currentHeight !== undefined &&
        Math.abs(currentHeight - nextHeight) < 0.5
          ? currentHeight
          : nextHeight,
      );
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(grid);
    observer.observe(firstTile);

    return () => observer.disconnect();
  }, [tier]);

  React.useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = 0;
    }
  }, [tier]);

  return (
    <Field className={styles.root}>
      <ToggleGroup
        aria-label="Template set"
        className={`${styles.tabs} w-full`}
        onValueChange={(next) => {
          const [selected] = next;
          if (selected === "simple" || selected === "mega") {
            if (viewportRef.current) {
              viewportRef.current.scrollTop = 0;
            }
            setTier(selected);
          }
        }}
        size="default"
        value={[tier]}
        variant="outline"
      >
        <ToggleGroupItem aria-label="Simple" className="min-w-0 flex-1" value="simple">
          Simple
        </ToggleGroupItem>
        <ToggleGroupItem aria-label="Mega" className="min-w-0 flex-1" value="mega">
          Mega
        </ToggleGroupItem>
      </ToggleGroup>
      <ScrollFade
        className={styles.scroller}
        containerClassName={styles.scrollContainer}
        data-max-visible-rows={TEMPLATE_LIBRARY_MAX_VISIBLE_ROWS}
        data-testid="template-library-scroll"
        height={36}
        interactionWatch={[tier]}
        preset="default"
        showOppositeSide
        side="bottom"
        style={{
          maxHeight:
            maxGridHeight === undefined ? undefined : `${maxGridHeight}px`,
          overscrollBehaviorY: "auto",
        }}
        viewportRef={viewportRef}
        visibilityMode="overflow"
        watch={[tier, items.length, maxGridHeight]}
      >
        <div
          className={styles.grid}
          data-template-library-grid=""
          ref={gridRef}
        >
          {items.map((item) => {
            const selected = selectedValue === item.value;

            return (
              <Button
                aria-label={item.alt}
                aria-pressed={selected}
                className={styles.tile}
                draggable
                key={item.value}
                onClick={() =>
                  setValue(selected ? "" : item.value, { history: "skip" })
                }
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "copy";
                  event.dataTransfer.setData(
                    MICROGRAPH_TEMPLATE_DRAG_TYPE,
                    item.value,
                  );
                  setValue(item.value, { history: "skip" });
                }}
                radius="lg"
                size="default"
                type="button"
                variant="outline"
              >
                <img
                  alt=""
                  className={styles.thumbnail}
                  draggable={false}
                  src={item.src}
                />
              </Button>
            );
          })}
        </div>
      </ScrollFade>
    </Field>
  );
}

export const micrographicsControlRenderers = {
  templateLibrary: TemplateLibraryControl,
} satisfies ToolcraftControlRendererMap;
