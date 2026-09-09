import * as React from "react";

import styles from "./micrographics-canvas.module.css";
import { elementInk, elementPaper } from "./poster-model";
import type {
  PosterPrimitive,
  PosterScene,
  RenderedElement,
} from "./poster-types";

type PrimitivePathBucket = {
  d: string[];
  evenOdd: boolean;
  fill: string;
  stroke: string;
  strokeWidth: number;
};

export const GLOW_FILTER_ID = "micrographics-glow";

export function glowStdDeviation(
  glow: number,
  canvasWidth: number,
  canvasHeight: number,
): number {
  return glow * Math.min(canvasWidth, canvasHeight) * 0.008;
}

export function GlowFilter({
  canvasHeight,
  canvasWidth,
  scene,
}: {
  canvasHeight: number;
  canvasWidth: number;
  scene: PosterScene;
}): React.JSX.Element | null {
  if (scene.glow <= 0) {
    return null;
  }
  return (
    <filter
      data-micrographics-glow=""
      height="160%"
      id={GLOW_FILTER_ID}
      width="160%"
      x="-30%"
      y="-30%"
    >
      <feGaussianBlur
        in="SourceGraphic"
        result="blur"
        stdDeviation={glowStdDeviation(scene.glow, canvasWidth, canvasHeight)}
      />
      <feComponentTransfer in="blur" result="boost">
        <feFuncA slope={1 + scene.glow * 0.8} type="linear" />
      </feComponentTransfer>
      <feMerge>
        <feMergeNode in="boost" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  );
}

function rectPath(primitive: Extract<PosterPrimitive, { kind: "rect" }>): string {
  const { height, width, x, y } = primitive;
  const radius = Math.max(
    0,
    Math.min(primitive.radius ?? 0, width / 2, height / 2),
  );

  if (radius === 0) {
    return `M ${x} ${y} H ${x + width} V ${y + height} H ${x} Z`;
  }

  return [
    `M ${x + radius} ${y}`,
    `H ${x + width - radius}`,
    `Q ${x + width} ${y} ${x + width} ${y + radius}`,
    `V ${y + height - radius}`,
    `Q ${x + width} ${y + height} ${x + width - radius} ${y + height}`,
    `H ${x + radius}`,
    `Q ${x} ${y + height} ${x} ${y + height - radius}`,
    `V ${y + radius}`,
    `Q ${x} ${y} ${x + radius} ${y}`,
    "Z",
  ].join(" ");
}

function primitivePath(primitive: Exclude<PosterPrimitive, { kind: "text" }>): string {
  switch (primitive.kind) {
    case "line":
      return `M ${primitive.x1} ${primitive.y1} L ${primitive.x2} ${primitive.y2}`;
    case "rect":
      return rectPath(primitive);
    case "circle":
      return `M ${primitive.x + primitive.radius} ${primitive.y} A ${primitive.radius} ${primitive.radius} 0 1 0 ${primitive.x - primitive.radius} ${primitive.y} A ${primitive.radius} ${primitive.radius} 0 1 0 ${primitive.x + primitive.radius} ${primitive.y} Z`;
    case "polyline": {
      const ring = (points: readonly (readonly [number, number])[]): string => {
        const [first, ...rest] = points;
        if (!first) return "";
        return [
          `M ${first[0]} ${first[1]}`,
          ...rest.map(([x, y]) => `L ${x} ${y}`),
          primitive.closed ? "Z" : "",
        ]
          .filter(Boolean)
          .join(" ");
      };
      return [primitive.points, ...(primitive.holes ?? [])]
        .map(ring)
        .filter(Boolean)
        .join(" ");
    }
  }
}

export function ElementPrimitives({
  element,
  hiddenTextIndex,
  onTextDoubleClick,
  scene,
}: {
  element: RenderedElement;
  hiddenTextIndex?: number;
  onTextDoubleClick?: (
    textIndex: number,
    event: React.MouseEvent<SVGTextElement>,
  ) => void;
  scene: PosterScene;
}): React.JSX.Element {
  const ink = elementInk(scene, element);
  const paper = elementPaper(scene);
  const buckets = new Map<string, PrimitivePathBucket>();
  const textPrimitives: Array<{
    index: number;
    primitive: Extract<PosterPrimitive, { kind: "text" }>;
  }> = [];

  element.primitives.forEach((primitive, index) => {
    if (primitive.kind === "text") {
      textPrimitives.push({ index, primitive });
      return;
    }

    const fill =
      "fill" in primitive && primitive.fill && primitive.fill !== "none"
        ? primitive.fill === "paper"
          ? paper
          : ink
        : "none";
    const hasStroke =
      primitive.kind === "line" ||
      primitive.kind === "polyline" ||
      ((primitive.kind === "rect" || primitive.kind === "circle") &&
        primitive.stroke);
    const stroke = hasStroke ? ink : "none";
    const strokeWidth =
      element.strokeWidth *
      (primitive.kind === "line" || primitive.kind === "polyline"
        ? (primitive.width ?? 1)
        : 1);
    const evenOdd =
      primitive.kind === "polyline" && (primitive.holes?.length ?? 0) > 0;
    const key = `${fill}|${stroke}|${strokeWidth}|${evenOdd ? "e" : "n"}`;
    const path = primitivePath(primitive);
    if (!path || (fill === "none" && stroke === "none")) return;
    const bucket = buckets.get(key) ?? {
      d: [],
      evenOdd,
      fill,
      stroke,
      strokeWidth,
    };
    bucket.d.push(path);
    buckets.set(key, bucket);
  });

  return (
    <>
      {Array.from(buckets.values()).map((bucket, index) => (
        <path
          className={styles.primitive}
          d={bucket.d.join(" ")}
          data-primitive-count={bucket.d.length}
          fill={bucket.fill}
          fillRule={bucket.evenOdd ? "evenodd" : undefined}
          key={`${bucket.fill}-${bucket.stroke}-${bucket.strokeWidth}-${index}`}
          stroke={bucket.stroke}
          strokeLinecap="square"
          strokeLinejoin="round"
          strokeWidth={bucket.strokeWidth}
        />
      ))}
      {textPrimitives.map(({ index, primitive }, textIndex) => (
        <text
          className={onTextDoubleClick ? styles.editableText : styles.primitive}
          data-primitive-index={index}
          data-text-index={textIndex}
          dominantBaseline="alphabetic"
          onDoubleClick={
            onTextDoubleClick
              ? (event) => onTextDoubleClick(textIndex, event)
              : undefined
          }
          opacity={hiddenTextIndex === textIndex ? 0 : undefined}
          fill={primitive.fill === "paper" ? paper : ink}
          fontFamily={
            primitive.family === "sans"
              ? "Inter Variable, Helvetica Neue, Arial, sans-serif"
              : "IBM Plex Mono, ui-monospace, monospace"
          }
          fontSize={primitive.size}
          fontWeight={primitive.weight ?? 500}
          key={`text-${index}`}
          letterSpacing={primitive.letterSpacing}
          textAnchor={
            primitive.align === "center"
              ? "middle"
              : primitive.align === "right"
                ? "end"
                : "start"
          }
          x={primitive.x}
          y={primitive.y}
        >
          {primitive.text}
        </text>
      ))}
    </>
  );
}
