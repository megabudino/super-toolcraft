import * as React from "react";

import { groupBoundingBox, type TextEditState } from "./micrographics-canvas-utils";
import styles from "./micrographics-canvas.module.css";
import type { MicrographElement } from "./poster-types";
import {
  measureDistances,
  type ActiveGuides,
  type GuideRect,
  type ResizeCorner,
} from "./selection-guides";

export const SELECTION_BLUE = "#0D99FF";
export const GUIDE_RED = "#F24822";

export function TextEditorOverlay({
  color,
  onCancel,
  onCommit,
  onDone,
  textEdit,
}: {
  color: string;
  onCancel: () => void;
  onCommit: (value: string) => void;
  onDone: () => void;
  textEdit: TextEditState;
}): React.JSX.Element {
  return (
    <foreignObject
      data-toolcraft-canvas-handle="element-text-editor"
      height={textEdit.fontSize * 1.8}
      width={textEdit.width}
      x={textEdit.x}
      y={textEdit.y - textEdit.fontSize * 0.2}
    >
      <input
        autoFocus
        className={styles.textEditor}
        data-toolcraft-product-text="element-content"
        defaultValue={textEdit.original}
        key={`${textEdit.elementId}-${textEdit.textIndex}`}
        onBlur={onDone}
        onChange={(event) => onCommit(event.target.value)}
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key === "Enter") {
            event.preventDefault();
            onDone();
          }
          if (event.key === "Escape") {
            event.preventDefault();
            onCancel();
          }
        }}
        onPointerDown={(event) => event.stopPropagation()}
        spellCheck={false}
        style={{
          color,
          fontFamily:
            textEdit.family === "sans"
              ? "Inter Variable, Helvetica Neue, Arial, sans-serif"
              : "IBM Plex Mono, ui-monospace, monospace",
          fontSize: textEdit.fontSize,
          fontWeight: textEdit.weight,
          height: textEdit.fontSize * 1.6,
          letterSpacing: textEdit.letterSpacing,
          lineHeight: `${textEdit.fontSize * 1.6}px`,
          textAlign: textEdit.align,
        }}
      />
    </foreignObject>
  );
}

export function MultiSelectionOutlines({
  elements,
  ids,
  onCornerPointerDown,
  scale,
}: {
  elements: readonly MicrographElement[];
  ids: readonly string[];
  onCornerPointerDown: (
    corner: ResizeCorner,
    event: React.PointerEvent<SVGCircleElement>,
  ) => void;
  scale: number;
}): React.JSX.Element | null {
  if (ids.length < 2) {
    return null;
  }
  const members = elements.filter((element) => ids.includes(element.id));
  const box = groupBoundingBox(members);
  const handleRadius = 5 * scale;
  const chipFont = 11 * scale;
  const chipText = `${Math.round(box.width)} × ${Math.round(box.height)}`;
  const chipWidth = chipText.length * chipFont * 0.62 + chipFont * 1.2;
  const chipHeight = chipFont * 1.7;
  return (
    <>
      {members.map((element) => (
        <rect
          className={styles.placementBox}
          data-micrographics-multi-selection=""
          height={element.height}
          key={`multi-${element.id}`}
          width={element.width}
          x={element.x}
          y={element.y}
        />
      ))}
      <rect
        className={styles.selectionBox}
        height={box.height}
        stroke={SELECTION_BLUE}
        strokeWidth={1.5 * scale}
        width={box.width}
        x={box.x}
        y={box.y}
      />
      {(["nw", "ne", "sw", "se"] as const).map((corner) => (
        <circle
          className={`${styles.resizeHandle} ${
            corner === "ne" || corner === "sw"
              ? styles.resizeHandleNesw
              : styles.resizeHandleNwse
          }`}
          cx={corner.includes("e") ? box.x + box.width : box.x}
          cy={corner.includes("s") ? box.y + box.height : box.y}
          data-testid={
            corner === "se" ? "micrographics-group-handle" : undefined
          }
          data-toolcraft-canvas-handle="group-resize"
          fill="#FFFFFF"
          key={corner}
          onPointerDown={(event) => onCornerPointerDown(corner, event)}
          r={handleRadius}
          stroke={SELECTION_BLUE}
          strokeWidth={Math.max(1, scale)}
        />
      ))}
      <g className={styles.measureLabel}>
        <rect
          fill={SELECTION_BLUE}
          height={chipHeight}
          rx={2 * scale}
          width={chipWidth}
          x={box.x + box.width / 2 - chipWidth / 2}
          y={box.y + box.height + chipHeight * 0.35}
        />
        <text
          fill="#FFFFFF"
          fontFamily="Inter Variable, Helvetica Neue, Arial, sans-serif"
          fontSize={chipFont}
          fontWeight={500}
          textAnchor="middle"
          x={box.x + box.width / 2}
          y={box.y + box.height + chipHeight * 0.35 + chipHeight / 2 + chipFont * 0.36}
        >
          {chipText}
        </text>
      </g>
    </>
  );
}

const corners: readonly ResizeCorner[] = ["nw", "ne", "sw", "se"];

function cornerPosition(
  element: MicrographElement,
  corner: ResizeCorner,
): { x: number; y: number } {
  return {
    x: corner.includes("e") ? element.x + element.width : element.x,
    y: corner.includes("s") ? element.y + element.height : element.y,
  };
}

function MeasurementLabel({
  scale,
  text,
  x,
  y,
}: {
  scale: number;
  text: string;
  x: number;
  y: number;
}): React.JSX.Element {
  const fontSize = 11 * scale;
  const width = text.length * fontSize * 0.64 + fontSize;
  const height = fontSize * 1.5;

  return (
    <g className={styles.measureLabel}>
      <rect
        fill={GUIDE_RED}
        height={height}
        rx={2 * scale}
        width={width}
        x={x - width / 2}
        y={y - height / 2}
      />
      <text
        fill="#FFFFFF"
        fontFamily="Inter Variable, Helvetica Neue, Arial, sans-serif"
        fontSize={fontSize}
        fontWeight={500}
        textAnchor="middle"
        x={x}
        y={y + fontSize * 0.36}
      >
        {text}
      </text>
    </g>
  );
}

export function SelectionOverlay({
  canvasHeight,
  canvasWidth,
  element,
  guides,
  neighbors,
  onColorSelect,
  onCornerPointerDown,
  palette,
  scale,
  showMeasurements,
}: {
  canvasHeight: number;
  canvasWidth: number;
  element: MicrographElement;
  guides: ActiveGuides | null;
  neighbors: readonly GuideRect[];
  onColorSelect: (color: string) => void;
  onCornerPointerDown: (
    corner: ResizeCorner,
    event: React.PointerEvent<SVGCircleElement>,
  ) => void;
  palette: readonly string[];
  scale: number;
  showMeasurements: boolean;
}): React.JSX.Element {
  const stroke = 1.5 * scale;
  const handleRadius = 5 * scale;
  const chipFont = 11 * scale;
  const chipText = `${Math.round(element.width)} × ${Math.round(element.height)}`;
  const chipWidth = chipText.length * chipFont * 0.62 + chipFont * 1.2;
  const chipHeight = chipFont * 1.7;
  const chipX = element.x + element.width / 2;
  const chipY = Math.min(
    canvasHeight - chipHeight / 2 - stroke,
    element.y + element.height + chipHeight * 0.85,
  );
  const measurements = showMeasurements
    ? measureDistances(element, neighbors, canvasWidth, canvasHeight)
    : [];

  return (
    <>
      {guides?.x.map((line) => (
        <line
          className={styles.snapGuide}
          key={`gx-${line}`}
          stroke={GUIDE_RED}
          strokeWidth={Math.max(1, scale)}
          x1={line}
          x2={line}
          y1={0}
          y2={canvasHeight}
        />
      ))}
      {guides?.y.map((line) => (
        <line
          className={styles.snapGuide}
          key={`gy-${line}`}
          stroke={GUIDE_RED}
          strokeWidth={Math.max(1, scale)}
          x1={0}
          x2={canvasWidth}
          y1={line}
          y2={line}
        />
      ))}
      {measurements.map((measurement) => {
        const middle = (measurement.from + measurement.to) / 2;
        const length = Math.round(measurement.to - measurement.from);
        const tick = 4 * scale;
        return measurement.axis === "x" ? (
          <g key={`mx-${measurement.at}-${measurement.from}`}>
            <line
              stroke={GUIDE_RED}
              strokeWidth={Math.max(1, scale)}
              x1={measurement.from}
              x2={measurement.to}
              y1={measurement.at}
              y2={measurement.at}
            />
            <line stroke={GUIDE_RED} strokeWidth={Math.max(1, scale)} x1={measurement.from} x2={measurement.from} y1={measurement.at - tick} y2={measurement.at + tick} />
            <line stroke={GUIDE_RED} strokeWidth={Math.max(1, scale)} x1={measurement.to} x2={measurement.to} y1={measurement.at - tick} y2={measurement.at + tick} />
            <MeasurementLabel
              scale={scale}
              text={String(length)}
              x={middle}
              y={measurement.at - chipHeight * 0.7}
            />
          </g>
        ) : (
          <g key={`my-${measurement.at}-${measurement.from}`}>
            <line
              stroke={GUIDE_RED}
              strokeWidth={Math.max(1, scale)}
              x1={measurement.at}
              x2={measurement.at}
              y1={measurement.from}
              y2={measurement.to}
            />
            <line stroke={GUIDE_RED} strokeWidth={Math.max(1, scale)} x1={measurement.at - tick} x2={measurement.at + tick} y1={measurement.from} y2={measurement.from} />
            <line stroke={GUIDE_RED} strokeWidth={Math.max(1, scale)} x1={measurement.at - tick} x2={measurement.at + tick} y1={measurement.to} y2={measurement.to} />
            <MeasurementLabel
              scale={scale}
              text={String(length)}
              x={measurement.at + chipHeight * 1.1}
              y={middle}
            />
          </g>
        );
      })}
      <rect
        className={styles.selectionBox}
        height={element.height}
        stroke={SELECTION_BLUE}
        strokeWidth={stroke}
        width={element.width}
        x={element.x}
        y={element.y}
      />
      {corners.map((corner) => {
        const position = cornerPosition(element, corner);
        return (
          <circle
            className={`${styles.resizeHandle} ${
              corner === "ne" || corner === "sw"
                ? styles.resizeHandleNesw
                : styles.resizeHandleNwse
            }`}
            cx={position.x}
            cy={position.y}
            data-testid={
              corner === "se" ? "micrographics-selection-handle" : undefined
            }
            data-toolcraft-canvas-handle="element-resize"
            fill="#FFFFFF"
            key={corner}
            onPointerDown={(event) => onCornerPointerDown(corner, event)}
            r={handleRadius}
            stroke={SELECTION_BLUE}
            strokeWidth={Math.max(1, scale)}
          />
        );
      })}
      {palette.map((color, index) => (
        <circle
          className={styles.resizeHandle}
          cx={chipX + chipWidth / 2 + handleRadius * (2.6 + index * 2.6)}
          cy={chipY}
          data-testid={`micrographics-palette-swatch-${index}`}
          data-toolcraft-canvas-handle="element-color"
          fill={color}
          key={`${color}-${index}`}
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onColorSelect(color);
          }}
          r={handleRadius}
          stroke={element.color === color ? GUIDE_RED : SELECTION_BLUE}
          strokeWidth={Math.max(1, scale)}
        />
      ))}
      <g className={styles.measureLabel}>
        <rect
          fill={SELECTION_BLUE}
          height={chipHeight}
          rx={2 * scale}
          width={chipWidth}
          x={chipX - chipWidth / 2}
          y={chipY - chipHeight / 2}
        />
        <text
          fill="#FFFFFF"
          fontFamily="Inter Variable, Helvetica Neue, Arial, sans-serif"
          fontSize={chipFont}
          fontWeight={500}
          textAnchor="middle"
          x={chipX}
          y={chipY + chipFont * 0.36}
        >
          {chipText}
        </text>
      </g>
    </>
  );
}
