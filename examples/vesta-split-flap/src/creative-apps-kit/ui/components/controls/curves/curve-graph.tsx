import { useId } from "react";

import type { CurveChannel, CurvePoint } from "../control-types";
import {
  EffectsTemplateChannelTabs,
  effectsTemplateChannelMeta,
} from "../channel-tabs";
import {
  curveGraphMax,
  curveGraphSize,
  curveGridStops,
  curveInset,
  getCurvePath,
  mapPointToSvg,
  normalizeCurvePoints,
} from "./curve-geometry";

export const curveChannels = [
  "RGB",
  "R",
  "G",
  "B",
] as const satisfies readonly CurveChannel[];
export const channelMeta = effectsTemplateChannelMeta;
const curveGraphRadius = 6;
const curvePointHandleViewportSize = 20;
const curvePointHandleViewportRadius = curvePointHandleViewportSize / 2;

export function ChannelTabs({
  name,
  onValueChange,
  value,
}: {
  name: string;
  onValueChange: (value: CurveChannel) => void;
  value: CurveChannel;
}): React.JSX.Element {
  return (
    <EffectsTemplateChannelTabs
      ariaLabel={name}
      channels={curveChannels}
      name={name}
      onValueChange={onValueChange}
      value={value}
    />
  );
}

export function CurveGraph({
  activeChannel,
  activePoints,
  draggingPointIndex,
  graphRef,
  onBackgroundPointerDown,
  onPointDoubleClick,
  onPointKeyDown,
  onPointPointerDown,
  onPointPointerUp,
  points,
  selectedPointIndex,
}: CurveGraphProps): React.JSX.Element {
  const clipPathId = `curve-graph-${useId().replaceAll(":", "")}`;
  const showReferenceLine = shouldShowReferenceLine(points);

  return (
    <svg
      aria-label="Color curves editor"
      className="app-no-drag group/curve-graph block aspect-square w-full overflow-visible select-none"
      ref={graphRef}
      role="img"
      style={{ overflow: "visible", touchAction: "none" }}
      viewBox={`${curveInset} ${curveInset} ${curveGraphSize} ${curveGraphSize}`}
    >
      <defs>
        <clipPath id={clipPathId}>
          <rect
            height={curveGraphSize}
            rx={curveGraphRadius}
            width={curveGraphSize}
            x={curveInset}
            y={curveInset}
          />
        </clipPath>
      </defs>
      <rect
        fill="transparent"
        height={curveGraphSize}
        onPointerDown={onBackgroundPointerDown}
        width={curveGraphSize}
        x={curveInset}
        y={curveInset}
      />
      <CurveGrid
        clipPathId={clipPathId}
        showReferenceLine={showReferenceLine}
      />
      <CurvePaths
        activeChannel={activeChannel}
        clipPathId={clipPathId}
        points={points}
      />
      <CurvePointHandles
        activeChannel={activeChannel}
        activePoints={activePoints}
        draggingPointIndex={draggingPointIndex}
        onPointDoubleClick={onPointDoubleClick}
        onPointKeyDown={onPointKeyDown}
        onPointPointerDown={onPointPointerDown}
        onPointPointerUp={onPointPointerUp}
        selectedPointIndex={selectedPointIndex}
      />
    </svg>
  );
}

type CurveGraphProps = {
  activeChannel: CurveChannel;
  activePoints: readonly CurvePoint[];
  draggingPointIndex: number | null;
  graphRef: React.RefObject<SVGSVGElement | null>;
  onBackgroundPointerDown: React.PointerEventHandler<SVGRectElement>;
  onPointDoubleClick: (
    index: number,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => void;
  onPointKeyDown: (
    index: number,
    event: React.KeyboardEvent<HTMLButtonElement>,
  ) => void;
  onPointPointerDown: (
    index: number,
    event: React.PointerEvent<HTMLButtonElement>,
  ) => void;
  onPointPointerUp: (
    index: number,
    event: React.PointerEvent<HTMLButtonElement>,
  ) => void;
  points: Record<CurveChannel, readonly CurvePoint[]>;
  selectedPointIndex: number | null;
};

function shouldShowReferenceLine(
  points: Record<CurveChannel, readonly CurvePoint[]>,
): boolean {
  return curveChannels.every((channel) => !isIdentityCurve(points[channel]));
}

function isIdentityCurve(points: readonly CurvePoint[]): boolean {
  const normalizedPoints = normalizeCurvePoints(points);

  return (
    normalizedPoints.length > 0 &&
    normalizedPoints.every((point) => Math.abs(point.x - point.y) < 0.0001)
  );
}

function CurveGrid({
  clipPathId,
  showReferenceLine,
}: {
  clipPathId: string;
  showReferenceLine: boolean;
}): React.JSX.Element {
  return (
    <g pointerEvents="none">
      <rect
        fill="color-mix(in oklab, var(--background) 20%, transparent)"
        height={curveGraphSize}
        rx={curveGraphRadius}
        width={curveGraphSize}
        x={curveInset}
        y={curveInset}
      />
      <g clipPath={`url(#${clipPathId})`}>
        {curveGridStops.map((stop) => {
          const position = curveInset + stop * curveGraphSize;

          return (
            <g key={stop}>
              <line
                stroke="color-mix(in oklab, var(--foreground) 5%, transparent)"
                strokeWidth="1"
                x1={position}
                x2={position}
                y1={curveInset}
                y2={curveGraphMax}
              />
              <line
                stroke="color-mix(in oklab, var(--foreground) 5%, transparent)"
                strokeWidth="1"
                x1={curveInset}
                x2={curveGraphMax}
                y1={position}
                y2={position}
              />
            </g>
          );
        })}
        {showReferenceLine ? (
          <path
            d={`M ${curveInset} ${curveGraphMax} L ${curveGraphMax} ${curveInset}`}
            data-curve-reference-line=""
            fill="none"
            stroke="color-mix(in oklab, var(--foreground) 16%, transparent)"
            strokeDasharray="4 5"
            strokeWidth="1"
          />
        ) : null}
      </g>
      <rect
        fill="none"
        height={curveGraphSize}
        rx={curveGraphRadius}
        stroke="color-mix(in oklab, var(--border) 15%, transparent)"
        strokeWidth="1"
        width={curveGraphSize}
        x={curveInset}
        y={curveInset}
      />
    </g>
  );
}

function CurvePaths({
  activeChannel,
  clipPathId,
  points,
}: {
  activeChannel: CurveChannel;
  clipPathId: string;
  points: Record<CurveChannel, readonly CurvePoint[]>;
}): React.JSX.Element {
  return (
    <g clipPath={`url(#${clipPathId})`} pointerEvents="none">
      {curveChannels.map((channel) => (
        <path
          d={getCurvePath(points[channel])}
          fill="none"
          key={channel}
          opacity={channel === activeChannel ? 1 : 0.15}
          stroke={channelMeta[channel].color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={channel === activeChannel ? 2 : 1.5}
        />
      ))}
    </g>
  );
}

function CurvePointHandles({
  activeChannel,
  activePoints,
  draggingPointIndex,
  onPointDoubleClick,
  onPointKeyDown,
  onPointPointerDown,
  onPointPointerUp,
  selectedPointIndex,
}: {
  activeChannel: CurveChannel;
  activePoints: readonly CurvePoint[];
  draggingPointIndex: number | null;
  onPointDoubleClick: (
    index: number,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => void;
  onPointKeyDown: (
    index: number,
    event: React.KeyboardEvent<HTMLButtonElement>,
  ) => void;
  onPointPointerDown: (
    index: number,
    event: React.PointerEvent<HTMLButtonElement>,
  ) => void;
  onPointPointerUp: (
    index: number,
    event: React.PointerEvent<HTMLButtonElement>,
  ) => void;
  selectedPointIndex: number | null;
}): React.JSX.Element {
  const handlesVisible =
    selectedPointIndex !== null || draggingPointIndex !== null;

  return (
    <g
      className={
        handlesVisible
          ? "opacity-100 transition-opacity duration-150 ease-out"
          : "opacity-0 transition-opacity duration-150 ease-out group-hover/curve-graph:opacity-100 group-focus-within/curve-graph:opacity-100"
      }
      data-curve-point-handles=""
    >
      {activePoints.map((point, index) => (
        <CurvePointHandle
          activeChannel={activeChannel}
          index={index}
          dragging={draggingPointIndex === index}
          key={`${activeChannel}-${point.x}-${point.y}-${index}`}
          onPointDoubleClick={onPointDoubleClick}
          onPointKeyDown={onPointKeyDown}
          onPointPointerDown={onPointPointerDown}
          onPointPointerUp={onPointPointerUp}
          point={point}
          selected={selectedPointIndex === index}
        />
      ))}
    </g>
  );
}

function CurvePointHandle({
  activeChannel,
  dragging,
  index,
  onPointDoubleClick,
  onPointKeyDown,
  onPointPointerDown,
  onPointPointerUp,
  point,
  selected,
}: {
  activeChannel: CurveChannel;
  dragging: boolean;
  index: number;
  onPointDoubleClick: (
    index: number,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => void;
  onPointKeyDown: (
    index: number,
    event: React.KeyboardEvent<HTMLButtonElement>,
  ) => void;
  onPointPointerDown: (
    index: number,
    event: React.PointerEvent<HTMLButtonElement>,
  ) => void;
  onPointPointerUp: (
    index: number,
    event: React.PointerEvent<HTMLButtonElement>,
  ) => void;
  point: CurvePoint;
  selected: boolean;
}): React.JSX.Element {
  const [pointX, pointY] = mapPointToSvg(point);
  const color = channelMeta[activeChannel].color;

  return (
    <foreignObject
      className="overflow-visible"
      height={curvePointHandleViewportSize}
      width={curvePointHandleViewportSize}
      x={pointX - curvePointHandleViewportRadius}
      y={pointY - curvePointHandleViewportRadius}
    >
      <div className="flex size-full items-center justify-center">
        <button
          aria-label={`Curve point ${index + 1}`}
          aria-pressed={selected ? true : undefined}
          data-dragging={dragging}
          data-selected={selected}
          className="m-0 flex size-2.5 cursor-grab items-center justify-center rounded-full border-2 bg-[color:var(--background)] p-0 shadow-[0_1px_4px_color-mix(in_oklab,var(--background)_70%,transparent)] outline-none transition-[background-color,width,height] duration-150 ease-out hover:size-3 hover:bg-[color:var(--background)] active:size-3 active:cursor-grabbing active:bg-[color:var(--background)] data-[dragging=true]:size-3 data-[selected=true]:size-3 data-[selected=true]:bg-[color:var(--foreground)]"
          onDoubleClick={(event) => onPointDoubleClick(index, event)}
          onKeyDown={(event) => onPointKeyDown(index, event)}
          onPointerDown={(event) => onPointPointerDown(index, event)}
          onPointerUp={(event) => onPointPointerUp(index, event)}
          style={{ borderColor: selected ? "var(--foreground)" : color }}
          type="button"
        />
      </div>
    </foreignObject>
  );
}
