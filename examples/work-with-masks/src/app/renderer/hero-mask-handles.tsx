import * as React from "react";

import { useToolcraftDispatch, useToolcraftSelector } from "@/toolcraft/runtime/react";

import { readHeroMaskRecords, readHeroMasks, type HeroMaskRecord } from "../domain/masks";
import styles from "./hero-canvas.module.css";
import {
  applyMaskHandleDrag,
  artboardToCss,
  cssToArtboard,
  getMaskPinPositions,
  toArtboardMask,
  type MaskHandleKind,
  type MaskPoint,
} from "./mask-geometry";

type Gesture = Readonly<{
  historyGroup: string;
  index: number;
  kind: MaskHandleKind;
  pointerId: number;
  record: HeroMaskRecord;
  records: readonly HeroMaskRecord[];
  startPoint: MaskPoint;
}>;

const handleKinds = ["move", "size", "stretch", "rotate"] as const;

function valuesEqual<T>(previous: T, next: T): boolean {
  return JSON.stringify(previous) === JSON.stringify(next);
}

function pointerToArtboard(
  canvas: HTMLElement,
  event: Pick<React.PointerEvent, "clientX" | "clientY">,
): MaskPoint {
  const rect = canvas.getBoundingClientRect();
  return cssToArtboard(
    { x: event.clientX - rect.left, y: event.clientY - rect.top },
    Math.max(1, rect.height),
  );
}

function gestureLabel(kind: MaskHandleKind, index: number): string {
  const verb =
    kind === "move"
      ? "Move"
      : kind === "size"
        ? "Resize"
        : kind === "stretch"
          ? "Stretch"
          : "Rotate";
  return `${verb} circle ${index + 1}`;
}

function useCanvasSize(canvas: HTMLElement) {
  const [size, setSize] = React.useState({ height: 0, width: 0 });

  React.useLayoutEffect(() => {
    const update = () => {
      const next = { height: canvas.clientHeight, width: canvas.clientWidth };
      setSize((current) =>
        current.height === next.height && current.width === next.width ? current : next,
      );
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(canvas);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [canvas]);

  return size;
}

export function HeroMaskHandles({
  frameElement: canvas,
}: Readonly<{ frameElement: HTMLElement }>): React.JSX.Element | null {
  const dispatch = useToolcraftDispatch();
  const selection = useToolcraftSelector(
    (state) => ({
      masks: readHeroMasks(state.values, { preview: true }),
      records: readHeroMaskRecords(state.values),
      zoom: state.canvas.zoom,
    }),
    valuesEqual,
  );
  const size = useCanvasSize(canvas);
  const gesture = React.useRef<Gesture | null>(null);
  const gestureSequence = React.useRef(0);

  if (selection.masks.mode !== "preview" || size.height <= 0 || size.width <= 0) {
    return null;
  }

  const aspect = size.width / size.height;
  const visualHeight = Math.max(1, canvas.getBoundingClientRect().height);
  const handleScale = 100 / Math.max(1, selection.zoom);

  const beginGesture = (
    event: React.PointerEvent<HTMLDivElement>,
    index: number,
    kind: MaskHandleKind,
  ) => {
    const record = selection.records[index];
    if (!record) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    gestureSequence.current += 1;
    gesture.current = {
      historyGroup: `hero-mask-${index}-${kind}-${gestureSequence.current}`,
      index,
      kind,
      pointerId: event.pointerId,
      record,
      records: selection.records,
      startPoint: pointerToArtboard(canvas, event),
    };
  };

  const updateGesture = (event: React.PointerEvent<HTMLDivElement>) => {
    const active = gesture.current;
    if (!active || active.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    const nextRecord = applyMaskHandleDrag({
      aspect,
      currentPoint: pointerToArtboard(canvas, event),
      kind: active.kind,
      record: active.record,
      startPoint: active.startPoint,
    });
    const nextItems = active.records.map((record, index) =>
      index === active.index ? nextRecord : record,
    );
    dispatch({
      history: "merge",
      historyGroup: active.historyGroup,
      label: gestureLabel(active.kind, active.index),
      target: "masks.items",
      type: "controls.setValue",
      value: nextItems,
    });
  };

  const endGesture = (event: React.PointerEvent<HTMLDivElement>) => {
    if (gesture.current?.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    gesture.current = null;
  };

  return (
    <div aria-hidden="true" className={styles.handles} data-hero-mask-handles="">
      {selection.masks.items.map((mask, index) => {
        const artboardMask = toArtboardMask(mask, aspect, visualHeight * (window.devicePixelRatio || 1));
        const pins = getMaskPinPositions(artboardMask, 28 / visualHeight);
        return handleKinds.map((kind) => {
          const point = artboardToCss(pins[kind], size.height);
          return (
            <div
              className={`${styles.handle} ${styles[`${kind}Handle`]}`}
              data-enabled={mask.enabled ? "true" : "false"}
              data-handle-kind={kind}
              data-testid={`hero-mask-${index}-${kind}`}
              data-toolcraft-canvas-handle=""
              key={`${index}-${kind}`}
              onLostPointerCapture={endGesture}
              onPointerCancel={endGesture}
              onPointerDown={(event) => beginGesture(event, index, kind)}
              onPointerMove={updateGesture}
              onPointerUp={endGesture}
              style={
                {
                  "--hero-mask-handle-scale": handleScale,
                  left: point.x,
                  top: point.y,
                } as React.CSSProperties
              }
            />
          );
        });
      })}
    </div>
  );
}
