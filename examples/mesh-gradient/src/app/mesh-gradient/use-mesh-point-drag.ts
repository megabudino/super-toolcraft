import * as React from "react";
import type { ToolcraftCommand } from "@/toolcraft/runtime";

import {
  clearMeshPointSelection,
  createMeshPointCommand,
  moveSelectedMeshPoints,
  selectMeshPointsInBounds,
  selectMeshPoint,
  updateMeshPointHandle,
  updateMeshPointLayout,
} from "./mesh-point-interaction";
import {
  getMeshBasePointCount,
  isMeshEdgePoint,
  type MeshHandleDirection,
  readMeshPointLayout,
} from "./mesh-model";

export type MeshMarquee = Readonly<{
  currentX: number;
  currentY: number;
  startX: number;
  startY: number;
}>;

function installPointerDrag({
  apply,
  onDraggingChange,
  pointerId,
  setCleanup,
}: {
  apply: (clientX: number, clientY: number) => void;
  onDraggingChange: (dragging: boolean) => void;
  pointerId: number;
  setCleanup: (cleanup: (() => void) | null) => void;
}) {
  const move = (event: PointerEvent) => {
    if (event.pointerId !== pointerId) return;
    event.preventDefault();
    apply(event.clientX, event.clientY);
  };
  const finish = (event: PointerEvent) => {
    if (event.pointerId !== pointerId) return;
    cleanup();
  };
  const cleanup = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", finish);
    window.removeEventListener("pointercancel", finish);
    setCleanup(null);
    onDraggingChange(false);
  };

  onDraggingChange(true);
  window.addEventListener("pointermove", move, { passive: false });
  window.addEventListener("pointerup", finish);
  window.addEventListener("pointercancel", finish);
  setCleanup(cleanup);
}

export function useMeshPointDrag({
  columns,
  count,
  dispatch,
  getBounds,
  layoutValue,
  onDraggingChange,
  pinEdges,
}: {
  columns: number;
  count: number;
  dispatch: React.Dispatch<ToolcraftCommand>;
  getBounds: () => DOMRect | undefined;
  layoutValue: unknown;
  onDraggingChange: (dragging: boolean) => void;
  pinEdges: boolean;
}) {
  const cleanupRef = React.useRef<(() => void) | null>(null);
  React.useEffect(() => () => cleanupRef.current?.(), []);

  return React.useCallback(
    (event: React.PointerEvent<Element>, index: number) => {
      event.preventDefault();
      event.stopPropagation();
      cleanupRef.current?.();

      const initial = readMeshPointLayout(layoutValue, count, columns);
      const point = initial.points[index];
      const bounds = getBounds();
      if (!point || !bounds) return;

      const wasSelected = initial.selectedIndices.includes(index);
      const selectionMode = event.shiftKey
        ? "add"
        : event.metaKey || event.ctrlKey
          ? "toggle"
          : "replace";
      const selectedLayout =
        selectionMode === "replace" && wasSelected
          ? initial
          : selectMeshPoint({
              columns,
              count,
              index,
              layoutValue: initial,
              mode: selectionMode,
            });
      if (selectedLayout !== initial) {
        dispatch(
          createMeshPointCommand({
            layout: selectedLayout,
            record: false,
          }),
        );
      }
      if (selectionMode === "toggle" && wasSelected) return;
      const basePointCount = getMeshBasePointCount(initial);
      if (
        pinEdges &&
        index < basePointCount &&
        isMeshEdgePoint(index, basePointCount, columns)
      ) return;

      const pointerId = event.pointerId;
      const startClientX = event.clientX;
      const startClientY = event.clientY;
      const movingMultiple =
        initial.selectedIndices.length > 1 && initial.selectedIndices.includes(index);
      const historyGroup = `mesh-point-${index}-${pointerId}-${Date.now()}`;
      installPointerDrag({
        apply: (clientX, clientY) => {
          const deltaX = (clientX - startClientX) / bounds.width;
          const deltaY = (clientY - startClientY) / bounds.height;
          const layout = movingMultiple
            ? moveSelectedMeshPoints({
                columns,
                count,
                deltaX,
                deltaY,
                layoutValue: initial,
                pinEdges,
              })
            : updateMeshPointLayout({
                columns,
                count,
                index,
                layoutValue: selectedLayout,
                pinEdges,
                x: point.x + deltaX,
                y: point.y + deltaY,
              });
          dispatch(createMeshPointCommand({ historyGroup, layout, record: true }));
        },
        onDraggingChange,
        pointerId,
        setCleanup: (cleanup) => {
          cleanupRef.current = cleanup;
        },
      });
    },
    [columns, count, dispatch, getBounds, layoutValue, onDraggingChange, pinEdges],
  );
}

export function useMeshMarqueeSelection({
  columns,
  count,
  dispatch,
  getBounds,
  layoutValue,
  pinEdges,
}: {
  columns: number;
  count: number;
  dispatch: React.Dispatch<ToolcraftCommand>;
  getBounds: () => DOMRect | undefined;
  layoutValue: unknown;
  pinEdges: boolean;
}) {
  const [marquee, setMarquee] = React.useState<MeshMarquee | null>(null);
  const cleanupRef = React.useRef<(() => void) | null>(null);
  React.useEffect(() => () => cleanupRef.current?.(), []);

  const onBackgroundPointerDown = React.useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      if (event.target !== event.currentTarget) return;
      event.preventDefault();
      event.stopPropagation();
      cleanupRef.current?.();

      const bounds = getBounds();
      if (!bounds || bounds.width <= 0 || bounds.height <= 0) return;
      const initial = readMeshPointLayout(layoutValue, count, columns);
      const selectionBase = event.shiftKey
        ? initial
        : clearMeshPointSelection({
            columns,
            count,
            layoutValue: initial,
          });
      const toMeshPoint = (clientX: number, clientY: number) => ({
        x: (clientX - bounds.left) / bounds.width,
        y: (clientY - bounds.top) / bounds.height,
      });
      const start = toMeshPoint(event.clientX, event.clientY);
      if (!event.shiftKey) {
        dispatch(
          createMeshPointCommand({
            layout: selectionBase,
            record: false,
          }),
        );
      }
      setMarquee({
        currentX: start.x,
        currentY: start.y,
        startX: start.x,
        startY: start.y,
      });

      const pointerId = event.pointerId;
      const move = (moveEvent: PointerEvent) => {
        if (moveEvent.pointerId !== pointerId) return;
        moveEvent.preventDefault();
        const current = toMeshPoint(moveEvent.clientX, moveEvent.clientY);
        setMarquee({
          currentX: current.x,
          currentY: current.y,
          startX: start.x,
          startY: start.y,
        });
      };
      const cleanup = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", finish);
        window.removeEventListener("pointercancel", cancel);
        cleanupRef.current = null;
        setMarquee(null);
      };
      const finish = (finishEvent: PointerEvent) => {
        if (finishEvent.pointerId !== pointerId) return;
        const current = toMeshPoint(finishEvent.clientX, finishEvent.clientY);
        const movedFarEnough =
          Math.abs(finishEvent.clientX - event.clientX) >= 5 ||
          Math.abs(finishEvent.clientY - event.clientY) >= 5;
        if (movedFarEnough) {
          dispatch(
            createMeshPointCommand({
              layout: selectMeshPointsInBounds({
                bounds: {
                  maxX: Math.max(start.x, current.x),
                  maxY: Math.max(start.y, current.y),
                  minX: Math.min(start.x, current.x),
                  minY: Math.min(start.y, current.y),
                },
                columns,
                count,
                layoutValue: selectionBase,
                mode: finishEvent.shiftKey ? "add" : "replace",
                pinEdges,
              }),
              record: false,
            }),
          );
        }
        cleanup();
      };
      const cancel = (cancelEvent: PointerEvent) => {
        if (cancelEvent.pointerId !== pointerId) return;
        cleanup();
      };

      window.addEventListener("pointermove", move, { passive: false });
      window.addEventListener("pointerup", finish);
      window.addEventListener("pointercancel", cancel);
      cleanupRef.current = cleanup;
    },
    [columns, count, dispatch, getBounds, layoutValue, pinEdges],
  );

  return { marquee, onBackgroundPointerDown };
}

export function useMeshHandleDrag({
  columns,
  count,
  dispatch,
  getBounds,
  layoutValue,
  onDraggingChange,
}: {
  columns: number;
  count: number;
  dispatch: React.Dispatch<ToolcraftCommand>;
  getBounds: () => DOMRect | undefined;
  layoutValue: unknown;
  onDraggingChange: (dragging: boolean) => void;
}) {
  const cleanupRef = React.useRef<(() => void) | null>(null);
  React.useEffect(() => () => cleanupRef.current?.(), []);

  return React.useCallback(
    (
      event: React.PointerEvent<Element>,
      index: number,
      direction: MeshHandleDirection,
    ) => {
      event.preventDefault();
      event.stopPropagation();
      cleanupRef.current?.();

      const initial = readMeshPointLayout(layoutValue, count, columns);
      const point = initial.points[index];
      const pointHandles = initial.handles[index];
      const bounds = getBounds();
      if (!point || !pointHandles || !bounds) return;

      const handleKey =
        `handle${direction.charAt(0).toUpperCase()}${direction.slice(1)}` as
          | "handleDown"
          | "handleLeft"
          | "handleRight"
          | "handleUp";
      const handle = pointHandles[handleKey];
      const pointerId = event.pointerId;
      const startClientX = event.clientX;
      const startClientY = event.clientY;
      const historyGroup = `mesh-handle-${index}-${direction}-${pointerId}-${Date.now()}`;

      dispatch(
        createMeshPointCommand({
          layout: selectMeshPoint({ columns, count, index, layoutValue: initial }),
          record: false,
        }),
      );
      installPointerDrag({
        apply: (clientX, clientY) => {
          const layout = updateMeshPointHandle({
            columns,
            count,
            direction,
            index,
            layoutValue: initial,
            x: point.x + handle.x + (clientX - startClientX) / bounds.width,
            y: point.y + handle.y + (clientY - startClientY) / bounds.height,
          });
          dispatch(
            createMeshPointCommand({
              historyGroup,
              label: "Curve mesh",
              layout,
              record: true,
            }),
          );
        },
        onDraggingChange,
        pointerId,
        setCleanup: (cleanup) => {
          cleanupRef.current = cleanup;
        },
      });
    },
    [columns, count, dispatch, getBounds, layoutValue, onDraggingChange],
  );
}
