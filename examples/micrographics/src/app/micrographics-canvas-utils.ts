import {
  useEffect,
  useRef,
  type DragEvent as ReactDragEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";

import type {
  ToolcraftImageAsset,
  ToolcraftState,
} from "@/toolcraft/runtime";

import { findContentCell, type ContentCellRef } from "./poster-model";
import type { MicrographElement, RenderedElement } from "./poster-types";
import {
  snapMovingRect,
  snapResizeEdges,
  type ActiveGuides,
  type GuideRect,
} from "./selection-guides";

export type DragGesture = {
  corner?: "ne" | "nw" | "se" | "sw";
  elementIndex: number;
  groupStartElements?: readonly MicrographElement[];
  historyGroup: string;
  mode: "group-resize" | "move" | "resize";
  pointerId: number;
  startBBox?: { height: number; width: number; x: number; y: number };
  startClientX: number;
  startClientY: number;
  startElement: MicrographElement;
};

export function groupBoundingBox(
  elements: readonly { height: number; width: number; x: number; y: number }[],
): { height: number; width: number; x: number; y: number } {
  let x1 = Infinity;
  let y1 = Infinity;
  let x2 = -Infinity;
  let y2 = -Infinity;
  for (const element of elements) {
    x1 = Math.min(x1, element.x);
    y1 = Math.min(y1, element.y);
    x2 = Math.max(x2, element.x + element.width);
    y2 = Math.max(y2, element.y + element.height);
  }
  if (!Number.isFinite(x1)) {
    return { height: 0, width: 0, x: 0, y: 0 };
  }
  return { height: y2 - y1, width: x2 - x1, x: x1, y: y1 };
}

export function createGroupResizeGesture(
  members: readonly MicrographElement[],
  corner: "ne" | "nw" | "se" | "sw",
  event: { clientX: number; clientY: number; pointerId: number },
): DragGesture {
  return {
    corner,
    elementIndex: -1,
    groupStartElements: members,
    historyGroup: `group-resize-${event.pointerId}`,
    mode: "group-resize",
    pointerId: event.pointerId,
    startBBox: groupBoundingBox(members),
    startClientX: event.clientX,
    startClientY: event.clientY,
    startElement: members[0] as MicrographElement,
  };
}

export function resolveGroupResize({
  canvasHeight,
  canvasWidth,
  deltaX,
  deltaY,
  gesture,
}: {
  canvasHeight: number;
  canvasWidth: number;
  deltaX: number;
  deltaY: number;
  gesture: DragGesture;
}): MicrographElement[] {
  const box = gesture.startBBox;
  const members = gesture.groupStartElements ?? [];
  if (!box || box.width <= 0 || box.height <= 0 || members.length === 0) {
    return [];
  }
  const clampValue = (value: number, min: number, max: number): number =>
    Math.max(min, Math.min(max, value));
  const corner = gesture.corner ?? "se";
  let next = { ...box };
  if (corner.includes("e")) {
    next.width = clampValue(box.width + deltaX, 60, canvasWidth - box.x);
  } else {
    const newX = clampValue(box.x + deltaX, 0, box.x + box.width - 60);
    next = { ...next, width: box.width + (box.x - newX), x: newX };
  }
  if (corner.includes("s")) {
    next.height = clampValue(box.height + deltaY, 40, canvasHeight - box.y);
  } else {
    const newY = clampValue(box.y + deltaY, 0, box.y + box.height - 40);
    next = { ...next, height: box.height + (box.y - newY), y: newY };
  }
  const scaleX = next.width / box.width;
  const scaleY = next.height / box.height;
  return members.map((member) => ({
    ...member,
    height: Math.max(12, Math.round(member.height * scaleY)),
    width: Math.max(16, Math.round(member.width * scaleX)),
    x: Math.round(next.x + (member.x - box.x) * scaleX),
    y: Math.round(next.y + (member.y - box.y) * scaleY),
  }));
}

export function useSelectionScale(options: {
  apply: (scaled: MicrographElement[]) => void;
  canvasHeight: number;
  canvasWidth: number;
  scaleValue: number;
  selection: { elements: readonly RenderedElement[]; ids: readonly string[] };
}): void {
  const { apply, canvasHeight, canvasWidth, scaleValue } = options;
  const previousRef = useRef(scaleValue);
  const latestRef = useRef(options.selection);
  latestRef.current = options.selection;
  useEffect(() => {
    const previous = previousRef.current;
    previousRef.current = scaleValue;
    const { elements, ids } = latestRef.current;
    if (previous === scaleValue || ids.length === 0) {
      return;
    }
    const scaled = scaleSelectedElements(
      elements,
      ids,
      scaleValue / Math.max(1, previous),
      canvasWidth,
      canvasHeight,
    );
    if (scaled.length > 0) {
      apply(scaled);
    }
  }, [apply, canvasHeight, canvasWidth, scaleValue]);
}

export function useGlobalDeselect(
  rootRef: RefObject<SVGSVGElement | null>,
  onClear: () => void,
): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClear();
      }
    };
    const onPointerDown = (event: PointerEvent): void => {
      const target = event.target as Element | null;
      if (!target || rootRef.current?.contains(target)) {
        return;
      }
      if (
        target.closest(
          "input,button,select,textarea,label,[data-toolcraft-controls-panel-shell]",
        )
      ) {
        return;
      }
      onClear();
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);
}

export function plainElement(
  element: MicrographElement & { primitives?: unknown; strokeWidth?: unknown },
): MicrographElement {
  const { primitives: _primitives, strokeWidth: _strokeWidth, ...plain } = element;
  return plain as MicrographElement;
}

export function scaleSelectedElements(
  elements: readonly RenderedElement[],
  ids: readonly string[],
  ratio: number,
  canvasWidth: number,
  canvasHeight: number,
): MicrographElement[] {
  const wanted = new Set(ids);
  const clampValue = (value: number, min: number, max: number): number =>
    Math.max(min, Math.min(max, value));
  return elements
    .filter((element) => wanted.has(element.id))
    .map((element) => {
      const width = clampValue(Math.round(element.width * ratio), 24, canvasWidth * 2);
      const height = clampValue(Math.round(element.height * ratio), 20, canvasHeight * 2);
      return {
        ...plainElement(element),
        height,
        width,
        x: clampValue(Math.round(element.x - (width - element.width) / 2), 0, Math.max(0, canvasWidth - width)),
        y: clampValue(Math.round(element.y - (height - element.height) / 2), 0, Math.max(0, canvasHeight - height)),
      };
    });
}

export type TextEditState = {
  align: "center" | "left" | "right";
  cell: ContentCellRef | null;
  elementId: string;
  elementIndex: number;
  family: "mono" | "sans";
  fontSize: number;
  letterSpacing: number;
  original: string;
  textIndex: number;
  weight: number;
  width: number;
  x: number;
  y: number;
};

export function buildTextEditState(
  element: RenderedElement | undefined,
  elementIndex: number,
  textIndex: number,
): TextEditState | null {
  if (!element) {
    return null;
  }
  const texts = element.primitives.filter((primitive) => primitive.kind === "text");
  const primitive = texts[textIndex];
  if (!primitive || primitive.kind !== "text") {
    return null;
  }
  let occurrence = 0;
  for (let index = 0; index < textIndex; index += 1) {
    const other = texts[index];
    if (other && other.kind === "text" && other.text.trim() === primitive.text.trim()) {
      occurrence += 1;
    }
  }
  const charWidth = primitive.family === "sans" ? 0.68 : 0.62;
  const width = Math.max(
    primitive.size * 4,
    primitive.text.length * primitive.size * charWidth + primitive.size * 2,
  );
  const anchorX =
    primitive.align === "center"
      ? primitive.x - width / 2
      : primitive.align === "right"
        ? primitive.x - width
        : primitive.x;
  return {
    align: primitive.align ?? "left",
    cell: findContentCell(element.content, primitive.text, occurrence),
    elementId: element.id,
    elementIndex,
    family: primitive.family ?? "mono",
    fontSize: primitive.size,
    letterSpacing: primitive.letterSpacing ?? 0,
    original: primitive.text,
    textIndex,
    weight: primitive.weight ?? 500,
    width,
    x: element.x + anchorX,
    y: element.y + primitive.y - primitive.size,
  };
}

export function resolveDragRect({
  canvasHeight,
  canvasWidth,
  deltaX,
  deltaY,
  gesture,
  neighbors,
  snapThreshold,
}: {
  canvasHeight: number;
  canvasWidth: number;
  deltaX: number;
  deltaY: number;
  gesture: DragGesture;
  neighbors: readonly GuideRect[];
  snapThreshold: number;
}): { guides: ActiveGuides; next: MicrographElement } {
  const clampValue = (value: number, min: number, max: number): number =>
    Math.max(min, Math.min(max, value));
  const start = gesture.startElement;

  if (gesture.mode === "move") {
    const raw = {
      height: start.height,
      width: start.width,
      x: clampValue(start.x + deltaX, 0, canvasWidth - start.width),
      y: clampValue(start.y + deltaY, 0, canvasHeight - start.height),
    };
    const snapped = snapMovingRect(raw, neighbors, canvasWidth, canvasHeight, snapThreshold);
    return {
      guides: snapped.guides,
      next: {
        ...start,
        x: Math.round(clampValue(snapped.x, 0, canvasWidth - start.width)),
        y: Math.round(clampValue(snapped.y, 0, canvasHeight - start.height)),
      },
    };
  }

  const corner = gesture.corner ?? "se";
  const raw = { height: start.height, width: start.width, x: start.x, y: start.y };
  if (corner.includes("e")) {
    raw.width = clampValue(start.width + deltaX, 50, canvasWidth - start.x);
  } else {
    const newX = clampValue(start.x + deltaX, 0, start.x + start.width - 50);
    raw.width = start.width + (start.x - newX);
    raw.x = newX;
  }
  if (corner.includes("s")) {
    raw.height = clampValue(start.height + deltaY, 40, canvasHeight - start.y);
  } else {
    const newY = clampValue(start.y + deltaY, 0, start.y + start.height - 40);
    raw.height = start.height + (start.y - newY);
    raw.y = newY;
  }
  const snapped = snapResizeEdges(raw, corner, neighbors, canvasWidth, canvasHeight, snapThreshold);
  return {
    guides: snapped.guides,
    next: {
      ...start,
      height: Math.round(Math.max(40, snapped.rect.height)),
      width: Math.round(Math.max(50, snapped.rect.width)),
      x: Math.round(Math.max(0, snapped.rect.x)),
      y: Math.round(Math.max(0, snapped.rect.y)),
    },
  };
}

export type PlacementGesture = {
  currentX: number;
  currentY: number;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startX: number;
  startY: number;
};

export function parsePaletteColors(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const candidate =
      typeof item === "object" && item !== null && "hex" in item
        ? (item as { hex?: unknown }).hex
        : item;
    return typeof candidate === "string" && /^#[0-9a-f]{3,8}$/i.test(candidate)
      ? [candidate]
      : [];
  });
}

export function stateSignature(state: ToolcraftState): string {
  return JSON.stringify({
    canvas: state.canvas.size,
    values: state.values,
  });
}

export function selectPosterState(state: ToolcraftState): ToolcraftState {
  return state;
}

export function posterStateEqual(
  previous: ToolcraftState,
  next: ToolcraftState,
): boolean {
  return (
    previous.values === next.values &&
    previous.schema === next.schema &&
    previous.canvas.size.width === next.canvas.size.width &&
    previous.canvas.size.height === next.canvas.size.height &&
    previous.canvas.size.unit === next.canvas.size.unit
  );
}

export function selectBackgroundImage(
  state: ToolcraftState,
): ToolcraftImageAsset | null {
  for (let index = state.mediaAssets.length - 1; index >= 0; index -= 1) {
    const asset = state.mediaAssets[index];

    if (asset?.assetKind === "image" && asset.sourceTarget === "source.image") {
      return asset;
    }
  }

  return null;
}

export function imageTransform(
  image: ToolcraftImageAsset,
  width: number,
  height: number,
): string | undefined {
  const transform = image.transform;
  if (!transform) {
    return undefined;
  }

  const rotation = transform.rotationDeg ?? 0;
  const scaleX = transform.flipHorizontal ? -1 : 1;
  const scaleY = transform.flipVertical ? -1 : 1;

  if (rotation === 0 && scaleX === 1 && scaleY === 1) {
    return undefined;
  }

  return `translate(${width / 2} ${height / 2}) rotate(${rotation}) scale(${scaleX} ${scaleY}) translate(${-width / 2} ${-height / 2})`;
}

export function clientPointToCanvas(
  event:
    | ReactDragEvent<SVGSVGElement>
    | ReactPointerEvent<SVGSVGElement>,
  canvasWidth: number,
  canvasHeight: number,
): { x: number; y: number } {
  const bounds = event.currentTarget.getBoundingClientRect();

  return {
    x: ((event.clientX - bounds.left) / Math.max(1, bounds.width)) * canvasWidth,
    y: ((event.clientY - bounds.top) / Math.max(1, bounds.height)) * canvasHeight,
  };
}
