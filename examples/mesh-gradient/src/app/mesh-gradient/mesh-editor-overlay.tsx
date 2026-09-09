import * as React from "react";

import {
  getMeshBasePointCount,
  isMeshEdgePoint,
  isInsertedMeshPoint,
  type MeshHandleDirection,
  type MeshPoint,
  type MeshPointHandles,
  type MeshPointLayout,
} from "./mesh-model";
import { createMeshCellConnectorEdges } from "./mesh-cell-triangulation";
import type { MeshMarquee } from "./use-mesh-point-drag";
import styles from "./mesh-gradient.module.css";

const editorPadding = 1_000;

const handleKeyByDirection = {
  down: "handleDown",
  left: "handleLeft",
  right: "handleRight",
  up: "handleUp",
} as const satisfies Record<MeshHandleDirection, keyof MeshPointHandles>;

const tangentTestIdByDirection = {
  down: "mesh-tangent-vertical-positive",
  left: "mesh-tangent-horizontal-negative",
  right: "mesh-tangent-horizontal-positive",
  up: "mesh-tangent-vertical-negative",
} as const satisfies Record<MeshHandleDirection, string>;

function toCanvasPoint(
  point: MeshPoint,
  width: number,
  height: number,
): MeshPoint {
  return { x: point.x * width, y: point.y * height };
}

function createCurveSegment({
  end,
  endHandle,
  height,
  start,
  startHandle,
  width,
}: {
  end: MeshPoint;
  endHandle: MeshPoint;
  height: number;
  start: MeshPoint;
  startHandle: MeshPoint;
  width: number;
}): string {
  return [
    `M ${start.x * width} ${start.y * height}`,
    `C ${(start.x + startHandle.x) * width} ${(start.y + startHandle.y) * height}`,
    `${(end.x + endHandle.x) * width} ${(end.y + endHandle.y) * height}`,
    `${end.x * width} ${end.y * height}`,
  ].join(" ");
}

export type MeshGridInsertionRequest = Readonly<{
  axis: "horizontal" | "vertical";
  column: number;
  row: number;
  t: number;
}>;

type MeshGridSegment = MeshGridInsertionRequest &
  Readonly<{
    d: string;
    end: MeshPoint;
    endHandle: MeshPoint;
    start: MeshPoint;
    startHandle: MeshPoint;
  }>;

function createGridSegments(
  layout: MeshPointLayout,
  columns: number,
  width: number,
  height: number,
): MeshGridSegment[] {
  const segments: MeshGridSegment[] = [];
  const basePointCount = getMeshBasePointCount(layout);
  layout.points.slice(0, basePointCount).forEach((point, index) => {
    const rightIndex = index + 1;
    const downIndex = index + columns;
    const pointHandles = layout.handles[index];
    if (!pointHandles) return;
    const row = Math.floor(index / columns);
    const column = index % columns;

    if (index % columns < columns - 1 && rightIndex < basePointCount) {
      const end = layout.points[rightIndex]!;
      const endHandle = layout.handles[rightIndex]!.handleLeft;
      const startHandle = pointHandles.handleRight;
      segments.push({
        axis: "horizontal",
        column,
        d: createCurveSegment({
          end,
          endHandle,
          height,
          start: point,
          startHandle,
          width,
        }),
        end,
        endHandle,
        row,
        start: point,
        startHandle,
        t: 0,
      });
    }
    if (downIndex < basePointCount) {
      const end = layout.points[downIndex]!;
      const endHandle = layout.handles[downIndex]!.handleUp;
      const startHandle = pointHandles.handleDown;
      segments.push({
        axis: "vertical",
        column,
        d: createCurveSegment({
          end,
          endHandle,
          height,
          start: point,
          startHandle,
          width,
        }),
        end,
        endHandle,
        row,
        start: point,
        startHandle,
        t: 0,
      });
    }
  });
  return segments;
}

function evaluateCurveSegment(
  segment: MeshGridSegment,
  t: number,
  width: number,
  height: number,
): MeshPoint {
  const inverse = 1 - t;
  const inverseSquared = inverse * inverse;
  const squared = t * t;
  return {
    x:
      (inverseSquared * inverse * segment.start.x +
        3 * inverseSquared * t * (segment.start.x + segment.startHandle.x) +
        3 * inverse * squared * (segment.end.x + segment.endHandle.x) +
        squared * t * segment.end.x) *
      width,
    y:
      (inverseSquared * inverse * segment.start.y +
        3 * inverseSquared * t * (segment.start.y + segment.startHandle.y) +
        3 * inverse * squared * (segment.end.y + segment.endHandle.y) +
        squared * t * segment.end.y) *
      height,
  };
}

function findClosestCurveParameter(
  event: React.MouseEvent<SVGPathElement>,
  segment: MeshGridSegment,
  width: number,
  height: number,
): number {
  const svg = event.currentTarget.ownerSVGElement;
  const matrix = svg?.getScreenCTM();
  if (!svg || !matrix) return 0.5;
  const pointer = svg.createSVGPoint();
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  const local = pointer.matrixTransform(matrix.inverse());
  const distanceSquared = (t: number) => {
    const point = evaluateCurveSegment(segment, t, width, height);
    return (point.x - local.x) ** 2 + (point.y - local.y) ** 2;
  };

  const sampleCount = 32;
  let bestT = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let sample = 0; sample <= sampleCount; sample += 1) {
    const t = sample / sampleCount;
    const distance = distanceSquared(t);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestT = t;
    }
  }

  let minimum = Math.max(0, bestT - 1 / sampleCount);
  let maximum = Math.min(1, bestT + 1 / sampleCount);
  for (let iteration = 0; iteration < 10; iteration += 1) {
    const left = minimum + (maximum - minimum) / 3;
    const right = maximum - (maximum - minimum) / 3;
    if (distanceSquared(left) <= distanceSquared(right)) maximum = right;
    else minimum = left;
  }
  return (minimum + maximum) / 2;
}

export function MeshEditorOverlay({
  canvasHeight,
  canvasWidth,
  colors,
  columns,
  guides,
  layout,
  marquee,
  onBackgroundPointerDown,
  onHandlePointerDown,
  onGridSegmentDoubleClick,
  onPointDoubleClick,
  onPointPointerDown,
  pinEdges,
  uiScale,
}: {
  canvasHeight: number;
  canvasWidth: number;
  colors: readonly string[];
  columns: number;
  guides: boolean;
  layout: MeshPointLayout;
  marquee: MeshMarquee | null;
  onBackgroundPointerDown: (event: React.PointerEvent<SVGSVGElement>) => void;
  onHandlePointerDown: (
    event: React.PointerEvent<SVGGElement>,
    index: number,
    direction: MeshHandleDirection,
  ) => void;
  onGridSegmentDoubleClick: (request: MeshGridInsertionRequest) => void;
  onPointDoubleClick: (event: React.MouseEvent<SVGGElement>, index: number) => void;
  onPointPointerDown: (event: React.PointerEvent<SVGGElement>, index: number) => void;
  pinEdges: boolean;
  uiScale: number;
}): React.JSX.Element {
  const width = Math.max(1, canvasWidth);
  const height = Math.max(1, canvasHeight);
  const singleSelectedIndex =
    layout.selectedIndices.length === 1 ? layout.selectedIndices[0]! : -1;
  const selectedPoint = layout.points[singleSelectedIndex];
  const selectedHandles = layout.handles[singleSelectedIndex];
  const basePointCount = getMeshBasePointCount(layout);
  const selectedIsInserted = isInsertedMeshPoint(layout, singleSelectedIndex);
  const selectedIsFixed = isMeshEdgePoint(
    singleSelectedIndex,
    basePointCount,
    columns,
  );
  const rows = Math.max(1, Math.ceil(basePointCount / columns));
  const primaryIndex = Math.min(
    basePointCount - 1,
    Math.floor(rows / 2) * columns + Math.floor((columns - 1) / 2),
  );
  const gridSegments = guides ? createGridSegments(layout, columns, width, height) : [];
  const gridPath = gridSegments.map((segment) => segment.d).join(" ");
  const connectorPath = guides
    ? createMeshCellConnectorEdges(layout, columns)
        .map((edge) => {
          const start = layout.points[edge.startIndex];
          const end = layout.points[edge.endIndex];
          return start && end
            ? `M ${start.x * width} ${start.y * height} L ${end.x * width} ${end.y * height}`
            : "";
        })
        .filter(Boolean)
        .join(" ")
    : "";
  const marqueeRect = marquee
    ? {
        height: Math.abs(marquee.currentY - marquee.startY) * height,
        width: Math.abs(marquee.currentX - marquee.startX) * width,
        x: Math.min(marquee.startX, marquee.currentX) * width,
        y: Math.min(marquee.startY, marquee.currentY) * height,
      }
    : null;

  return (
    <svg
      aria-hidden="true"
      className={styles.canvasEditorSvg}
      data-mesh-gradient-handles="true"
      data-mesh-point-count={colors.length}
      onPointerDown={onBackgroundPointerDown}
      preserveAspectRatio="xMidYMid meet"
      viewBox={`${-editorPadding} ${-editorPadding} ${width + editorPadding * 2} ${height + editorPadding * 2}`}
    >
      {gridPath || connectorPath ? (
        <>
          <path
            className={styles.canvasGridUnderlay}
            data-mesh-grid-guide="underlay"
            d={`${gridPath} ${connectorPath}`}
            strokeWidth={2 * uiScale}
          />
          <path
            className={styles.canvasGridOverlay}
            data-mesh-grid-guide="overlay"
            d={`${gridPath} ${connectorPath}`}
            strokeWidth={uiScale}
          />
          {gridSegments.map((segment) => (
            <path
              className={styles.canvasGridHitArea}
              data-mesh-grid-axis={segment.axis}
              data-mesh-grid-column={segment.column}
              data-mesh-grid-row={segment.row}
              data-mesh-grid-segment={`${segment.axis}-${segment.row}-${segment.column}`}
              d={segment.d}
              key={`${segment.axis}-${segment.row}-${segment.column}`}
              onDoubleClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onGridSegmentDoubleClick({
                  axis: segment.axis,
                  column: segment.column,
                  row: segment.row,
                  t: findClosestCurveParameter(event, segment, width, height),
                });
              }}
              onPointerDown={(event) => event.stopPropagation()}
              strokeWidth={18 * uiScale}
            />
          ))}
        </>
      ) : null}

      {marqueeRect ? (
        <rect
          className={styles.canvasMarquee}
          data-mesh-marquee="true"
          height={marqueeRect.height}
          strokeWidth={uiScale}
          width={marqueeRect.width}
          x={marqueeRect.x}
          y={marqueeRect.y}
        />
      ) : null}

      {selectedPoint && selectedHandles && !selectedIsInserted && !(pinEdges && selectedIsFixed)
        ? (Object.keys(handleKeyByDirection) as MeshHandleDirection[]).map((direction) => {
            const handle = selectedHandles[handleKeyByDirection[direction]];
            if (handle.x === 0 && handle.y === 0) return null;
            const point = toCanvasPoint(selectedPoint, width, height);
            const endpoint = {
              x: point.x + handle.x * width,
              y: point.y + handle.y * height,
            };
            return (
              <React.Fragment key={direction}>
                <line
                  className={styles.canvasTangentUnderlay}
                  strokeDasharray={`${4 * uiScale} ${2 * uiScale}`}
                  strokeWidth={2.5 * uiScale}
                  x1={point.x}
                  x2={endpoint.x}
                  y1={point.y}
                  y2={endpoint.y}
                />
                <line
                  className={styles.canvasTangentLine}
                  strokeDasharray={`${4 * uiScale} ${2 * uiScale}`}
                  strokeWidth={uiScale}
                  x1={point.x}
                  x2={endpoint.x}
                  y1={point.y}
                  y2={endpoint.y}
                />
                <g
                  className={styles.canvasTangentHandle}
                  data-mesh-handle-direction={direction}
                  data-mesh-handle-mode={selectedHandles.type}
                  data-testid={tangentTestIdByDirection[direction]}
                  data-toolcraft-canvas-handle="true"
                  onPointerDown={(event) => {
                    onHandlePointerDown(event, singleSelectedIndex, direction);
                  }}
                >
                  <circle cx={endpoint.x} cy={endpoint.y} fill="transparent" r={22 * uiScale} />
                  <circle
                    className={styles.canvasHandleShadow}
                    cx={endpoint.x}
                    cy={endpoint.y}
                    r={4.75 * uiScale}
                    strokeWidth={2.5 * uiScale}
                  />
                  <circle
                    className={styles.canvasTangentDot}
                    cx={endpoint.x}
                    cy={endpoint.y}
                    r={4 * uiScale}
                    strokeWidth={1.5 * uiScale}
                  />
                </g>
              </React.Fragment>
            );
          })
        : null}

      {layout.points.map((point, index) => {
        if (
          pinEdges &&
          index < basePointCount &&
          isMeshEdgePoint(index, basePointCount, columns)
        ) return null;
        const position = toCanvasPoint(point, width, height);
        const selected = layout.selectedIndices.includes(index);
        return (
          <g
            className={styles.canvasHandle}
            data-handle-mode={layout.handles[index]?.type}
            data-mesh-inserted-point={index >= basePointCount ? "true" : undefined}
            data-mesh-point-handle={index}
            data-selected={selected ? "true" : undefined}
            data-testid={index === primaryIndex ? "mesh-point-primary" : `mesh-point-${index + 1}`}
            data-toolcraft-canvas-handle="true"
            key={index}
            onDoubleClick={(event) => onPointDoubleClick(event, index)}
            onPointerDown={(event) => onPointPointerDown(event, index)}
          >
            <circle cx={position.x} cy={position.y} fill="transparent" r={22 * uiScale} />
            <circle
              className={styles.canvasHandleShadow}
              cx={position.x}
              cy={position.y}
              r={7 * uiScale}
              strokeWidth={3 * uiScale}
            />
            <circle
              className={styles.canvasPointDot}
              cx={position.x}
              cy={position.y}
              fill={colors[index] ?? "#ffffff"}
              r={6 * uiScale}
              stroke={selected ? "#000000" : "#ffffff"}
              strokeWidth={2 * uiScale}
            />
          </g>
        );
      })}
    </svg>
  );
}
