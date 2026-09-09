'use client';

import { referenceClasses } from '@/section/reference/reference-classes';
import type { CSSProperties, PointerEvent, ReactNode, RefObject } from 'react';
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import {
  animate,
  AnimatePresence,
  domAnimation,
  LazyMotion,
  m,
  type MotionValue,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from 'motion/react';

import { useSectionViewport } from '@/section/reference/reference-surface';

import {
  advanceTrailEnvelopes,
  createTrailCrossSteps,
  getCircularRoomScreenRadius,
  getCircularRoomSvgRadii,
  getPreFooterPreloadRootMargin,
  getRoomTileCssTransform,
  interpolateRoomTileCorners,
  pickNextTileChange,
  selectNonAdjacentCells,
  type RoomCell,
  type RoomStageSize,
  type RoomSurface,
  type RoomTileCorners,
  type TrailEnvelopes,
  type TrailSide,
} from './pre-footer-room-motion';
import {
  resolveInnerGridLines,
  resolveInnerGridMaskDepths,
  resolveInnerGridMaskStops,
} from './studio-room-inner-grid';
import styles from './pre-footer-room.module.css';
import {
  getStudioRoomMediaServerSnapshot,
  getStudioRoomMediaSnapshot,
  resolveStudioRoomMediaRef,
  subscribeStudioRoomMedia,
} from './studio-room-media-store';
import type { StudioRoomSettings } from './studio-room-settings';

type PreFooterRoomProps = {
  children: ReactNode;
  settings: StudioRoomSettings;
};

type RoomRect = {
  height: number;
  width: number;
  x: number;
  y: number;
};

type RenderTileAssignment = RoomCell & {
  from?: RoomCell;
  id: string;
  image: string;
  revision: number;
  shuffleStyle: 'slide' | 'swap';
};

const VIEWBOX_SIZE = 1000;
const WALL_RADIUS = 28;
const WALL_OVERSHOOT_DEPTH = 1.12;
const ROOM_DEPTH_PRESETS = {
  current: { height: 430, width: 380, x: 310, y: 285 },
  halfDepth: { height: 715, width: 690, x: 155, y: 142.5 },
  thirtyPercentDeeper: { height: 629.5, width: 597, x: 201.5, y: 185.25 },
} as const;
const ROOM_SURFACES: RoomSurface[] = ['ceiling', 'floor', 'left', 'right'];
const BASELINE_CELLS: Record<RoomSurface, readonly RoomCell[]> = {
  ceiling: [
    { crossIndex: 2, depthIndex: 0, surface: 'ceiling' },
    { crossIndex: 5, depthIndex: 2, surface: 'ceiling' },
  ],
  floor: [
    { crossIndex: 1, depthIndex: 1, surface: 'floor' },
    { crossIndex: 6, depthIndex: 3, surface: 'floor' },
    { crossIndex: 4, depthIndex: 0, surface: 'floor' },
  ],
  left: [
    { crossIndex: 1, depthIndex: 0, surface: 'left' },
    { crossIndex: 2, depthIndex: 2, surface: 'left' },
  ],
  right: [
    { crossIndex: 1, depthIndex: 1, surface: 'right' },
    { crossIndex: 2, depthIndex: 3, surface: 'right' },
  ],
};

function useNearViewport(root: RefObject<HTMLElement | null>) {
  const [isNearViewport, setIsNearViewport] = useState(false);

  useEffect(() => {
    const node = root.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsNearViewport(entry?.isIntersecting ?? false),
      { rootMargin: getPreFooterPreloadRootMargin(window.innerHeight) },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [root]);

  return isNearViewport;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function mix(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}

function interpolateRect(start: RoomRect, end: RoomRect, progress: number): RoomRect {
  return {
    height: mix(start.height, end.height, progress),
    width: mix(start.width, end.width, progress),
    x: mix(start.x, end.x, progress),
    y: mix(start.y, end.y, progress),
  };
}

function getBackWall(settings: StudioRoomSettings): RoomRect {
  const depth = settings.room.depth;
  const base =
    depth <= 0.3
      ? interpolateRect(
          ROOM_DEPTH_PRESETS.current,
          ROOM_DEPTH_PRESETS.thirtyPercentDeeper,
          depth / 0.3,
        )
      : interpolateRect(
          ROOM_DEPTH_PRESETS.thirtyPercentDeeper,
          ROOM_DEPTH_PRESETS.halfDepth,
          (depth - 0.3) / 0.7,
        );

  return {
    ...base,
    x: base.x + settings.room.vanishing.x * VIEWBOX_SIZE * 0.12,
    y: base.y + settings.room.vanishing.y * VIEWBOX_SIZE * 0.12,
  };
}

function getFrame(backWall: RoomRect, depth: number, offsetX: number, offsetY: number) {
  return {
    bottom:
      VIEWBOX_SIZE - (VIEWBOX_SIZE - (backWall.y + backWall.height)) * depth + offsetY * depth,
    left: backWall.x * depth + offsetX * depth,
    right: VIEWBOX_SIZE - (VIEWBOX_SIZE - (backWall.x + backWall.width)) * depth + offsetX * depth,
    top: backWall.y * depth + offsetY * depth,
  };
}

function getSurfacePoint(
  backWall: RoomRect,
  surface: RoomSurface,
  depth: number,
  cross: number,
  offsetX: number,
  offsetY: number,
) {
  const frame = getFrame(backWall, depth, offsetX, offsetY);

  if (surface === 'ceiling' || surface === 'floor') {
    return {
      x: frame.left + (frame.right - frame.left) * cross,
      y: surface === 'ceiling' ? frame.top : frame.bottom,
    };
  }

  return {
    x: surface === 'left' ? frame.left : frame.right,
    y: frame.top + (frame.bottom - frame.top) * cross,
  };
}

function getCrossDivisions(surface: RoomSurface, settings: StudioRoomSettings) {
  return surface === 'ceiling' || surface === 'floor' ? settings.grid.columns : settings.grid.rows;
}

function getTileCorners(
  cell: RoomCell,
  backWall: RoomRect,
  settings: StudioRoomSettings,
  offsetX: number,
  offsetY: number,
): RoomTileCorners {
  const crossDivisions = getCrossDivisions(cell.surface, settings);
  const nearDepth = cell.depthIndex / settings.grid.depthDivisions;
  const farDepth = (cell.depthIndex + 1) / settings.grid.depthDivisions;
  const crossStart = cell.crossIndex / crossDivisions;
  const crossEnd = (cell.crossIndex + 1) / crossDivisions;
  const nearStart = getSurfacePoint(
    backWall,
    cell.surface,
    nearDepth,
    crossStart,
    offsetX,
    offsetY,
  );
  const nearEnd = getSurfacePoint(backWall, cell.surface, nearDepth, crossEnd, offsetX, offsetY);
  const farStart = getSurfacePoint(backWall, cell.surface, farDepth, crossStart, offsetX, offsetY);
  const farEnd = getSurfacePoint(backWall, cell.surface, farDepth, crossEnd, offsetX, offsetY);

  switch (cell.surface) {
    case 'ceiling':
      return [nearStart, nearEnd, farEnd, farStart];
    case 'floor':
      return [farStart, farEnd, nearEnd, nearStart];
    case 'left':
      return [nearStart, farStart, farEnd, nearEnd];
    case 'right':
      return [farStart, nearStart, nearEnd, farEnd];
  }
}

function getCellsForSurface(surface: RoomSurface, settings: StudioRoomSettings): RoomCell[] {
  const crossDivisions = getCrossDivisions(surface, settings);
  return Array.from({ length: settings.grid.depthDivisions * crossDivisions }, (_, index) => ({
    crossIndex: index % crossDivisions,
    depthIndex: Math.floor(index / crossDivisions),
    surface,
  })).filter(({ crossIndex }) => crossIndex > 0 && crossIndex < crossDivisions - 1);
}

function normalizeBaselineCell(cell: RoomCell, settings: StudioRoomSettings): RoomCell {
  const oldCrossDivisions = cell.surface === 'ceiling' || cell.surface === 'floor' ? 8 : 4;
  const crossDivisions = getCrossDivisions(cell.surface, settings);
  return {
    crossIndex: clamp(
      Math.round((cell.crossIndex / oldCrossDivisions) * crossDivisions),
      1,
      crossDivisions - 2,
    ),
    depthIndex: clamp(
      Math.round((cell.depthIndex / 4) * settings.grid.depthDivisions),
      0,
      settings.grid.depthDivisions - 1,
    ),
    surface: cell.surface,
  };
}

function cellsMatch(first: RoomCell, second: RoomCell) {
  return (
    first.surface === second.surface &&
    first.crossIndex === second.crossIndex &&
    first.depthIndex === second.depthIndex
  );
}

function createInitialLayout(settings: StudioRoomSettings, images: readonly string[]) {
  if (images.length === 0) return [];

  const selected: RoomCell[] = [];
  for (const surface of ROOM_SURFACES) {
    const candidates = getCellsForSurface(surface, settings);
    // Preserve the original first frame (the floor owns +1); one-tile shuffle can move that
    // single extra assignment between surfaces without ever creating a -1/+2 imbalance.
    const requestedCount = settings.tiles.perSurface + (surface === 'floor' ? 1 : 0);
    const preferred = BASELINE_CELLS[surface]
      .slice(0, requestedCount)
      .map((cell) => normalizeBaselineCell(cell, settings))
      .filter((cell) => candidates.some((candidate) => cellsMatch(cell, candidate)));
    selected.push(...selectNonAdjacentCells(preferred, candidates, requestedCount));
  }

  return selected.map<RenderTileAssignment>((cell, index) => ({
    ...cell,
    id: `room-tile-${cell.surface}-${index}`,
    image: images[index % images.length] ?? images[0],
    revision: 0,
    shuffleStyle: 'swap',
  }));
}

function getOvershotLineEndpoint(
  start: number,
  wallEnd: number,
  offset: number,
  depth = WALL_OVERSHOOT_DEPTH,
) {
  return start + (wallEnd + offset - start) * depth;
}

function Line({
  endX,
  endY,
  offsetX,
  offsetY,
  startX,
  startY,
}: {
  endX: number;
  endY: number;
  offsetX: MotionValue<number>;
  offsetY: MotionValue<number>;
  startX: number;
  startY: number;
}) {
  const animatedEndX = useTransform(offsetX, (value) =>
    getOvershotLineEndpoint(startX, endX, value),
  );
  const animatedEndY = useTransform(offsetY, (value) =>
    getOvershotLineEndpoint(startY, endY, value),
  );
  return <m.line x1={startX} y1={startY} x2={animatedEndX} y2={animatedEndY} />;
}

function Frame({
  backWall,
  depth,
  fog,
  offsetX,
  offsetY,
  stageSize,
}: {
  backWall: RoomRect;
  depth: number;
  fog: number;
  offsetX: MotionValue<number>;
  offsetY: MotionValue<number>;
  stageSize: RoomStageSize;
}) {
  const x = useTransform(offsetX, (value) => backWall.x * depth + value * depth);
  const y = useTransform(offsetY, (value) => backWall.y * depth + value * depth);
  const width = VIEWBOX_SIZE - (VIEWBOX_SIZE - backWall.width) * depth;
  const height = VIEWBOX_SIZE - (VIEWBOX_SIZE - backWall.height) * depth;
  const radii = getCircularRoomSvgRadii(
    mix(10, WALL_RADIUS, depth),
    stageSize.width,
    stageSize.height,
  );
  return (
    <m.rect
      opacity={1 - fog * depth * 0.7}
      x={x}
      y={y}
      width={width}
      height={height}
      rx={radii.rx}
      ry={radii.ry}
    />
  );
}

function Grid({
  backWall,
  fine,
  offsetX,
  offsetY,
  settings,
  stageSize,
}: {
  backWall: RoomRect;
  fine: boolean;
  offsetX: MotionValue<number>;
  offsetY: MotionValue<number>;
  settings: StudioRoomSettings;
  stageSize: RoomStageSize;
}) {
  const subdivision = fine ? settings.fineGrid.subdivision : 1;
  const depthTotal = settings.grid.depthDivisions * subdivision;
  const columnsTotal = settings.grid.columns * subdivision;
  const rowsTotal = settings.grid.rows * subdivision;
  const isFineStep = (index: number) => !fine || index % subdivision !== 0;
  const style = {
    opacity: (fine ? settings.fineGrid.opacity : settings.grid.opacity) / 100,
    stroke: fine ? settings.fineGrid.color : settings.grid.color,
    strokeWidth: fine ? settings.fineGrid.thickness : settings.grid.thickness,
  };

  return (
    <svg
      aria-hidden="true"
      className={referenceClasses(fine ? styles.fineGrid : styles.grid)}
      preserveAspectRatio="none"
      viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
    >
      <g className={referenceClasses(styles.gridLines)} style={style} vectorEffect="non-scaling-stroke">
        {Array.from({ length: depthTotal - 1 }, (_, index) => index + 1)
          .filter(isFineStep)
          .map((index) => {
            const depth = index / depthTotal;
            return (
              <Frame
                key={index}
                backWall={backWall}
                depth={depth}
                fog={settings.tiles.fog}
                offsetX={offsetX}
                offsetY={offsetY}
                stageSize={stageSize}
              />
            );
          })}

        {Array.from({ length: columnsTotal - 1 }, (_, index) => index + 1)
          .filter(isFineStep)
          .map((index) => {
            const step = index / columnsTotal;
            const wallX = backWall.x + backWall.width * step;
            return (
              <g key={index} opacity={1 - settings.tiles.fog * 0.35}>
                <Line
                  startX={VIEWBOX_SIZE * step}
                  startY={0}
                  endX={wallX}
                  endY={backWall.y}
                  offsetX={offsetX}
                  offsetY={offsetY}
                />
                <Line
                  startX={VIEWBOX_SIZE * step}
                  startY={VIEWBOX_SIZE}
                  endX={wallX}
                  endY={backWall.y + backWall.height}
                  offsetX={offsetX}
                  offsetY={offsetY}
                />
              </g>
            );
          })}

        {Array.from({ length: rowsTotal - 1 }, (_, index) => index + 1)
          .filter(isFineStep)
          .map((index) => {
            const step = index / rowsTotal;
            const wallY = backWall.y + backWall.height * step;
            return (
              <g key={index} opacity={1 - settings.tiles.fog * 0.35}>
                <Line
                  startX={0}
                  startY={VIEWBOX_SIZE * step}
                  endX={backWall.x}
                  endY={wallY}
                  offsetX={offsetX}
                  offsetY={offsetY}
                />
                <Line
                  startX={VIEWBOX_SIZE}
                  startY={VIEWBOX_SIZE * step}
                  endX={backWall.x + backWall.width}
                  endY={wallY}
                  offsetX={offsetX}
                  offsetY={offsetY}
                />
              </g>
            );
          })}
      </g>
    </svg>
  );
}

function InnerGrid({
  backWall,
  settings,
  stageSize,
}: {
  backWall: RoomRect;
  settings: StudioRoomSettings;
  stageSize: RoomStageSize;
}) {
  const { innerGrid } = settings.room;
  const lines = resolveInnerGridLines(settings.grid.columns, settings.grid.rows);
  const stops = resolveInnerGridMaskStops(innerGrid.falloff);
  const panelHeight = (stageSize.height * backWall.height) / VIEWBOX_SIZE || backWall.height;
  const panelWidth = (stageSize.width * backWall.width) / VIEWBOX_SIZE || backWall.width;
  const { depthX, depthY } = resolveInnerGridMaskDepths(panelWidth, panelHeight, innerGrid.depth);
  const instanceId = useId().replace(/:/g, '');
  const maskId = `studio-room-inner-grid-${instanceId}-mask`;
  const stopColor = (alpha: number) => `rgb(${alpha * 255} ${alpha * 255} ${alpha * 255})`;

  return (
    <svg
      aria-hidden="true"
      className={referenceClasses(styles.innerGrid)}
      data-inner-grid-lines={lines.horizontal.length + lines.vertical.length}
      data-studio-room-inner-grid="on"
      preserveAspectRatio="none"
      viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
    >
      <defs>
        <linearGradient
          id={`${maskId}-top`}
          gradientUnits="userSpaceOnUse"
          x1={0}
          x2={0}
          y1={0}
          y2={depthY}
        >
          {stops.map((stop) => (
            <stop key={stop.offset} offset={stop.offset} stopColor={stopColor(stop.alpha)} />
          ))}
        </linearGradient>
        <linearGradient
          id={`${maskId}-bottom`}
          gradientUnits="userSpaceOnUse"
          x1={0}
          x2={0}
          y1={VIEWBOX_SIZE}
          y2={VIEWBOX_SIZE - depthY}
        >
          {stops.map((stop) => (
            <stop key={stop.offset} offset={stop.offset} stopColor={stopColor(stop.alpha)} />
          ))}
        </linearGradient>
        <linearGradient
          id={`${maskId}-left`}
          gradientUnits="userSpaceOnUse"
          x1={0}
          x2={depthX}
          y1={0}
          y2={0}
        >
          {stops.map((stop) => (
            <stop key={stop.offset} offset={stop.offset} stopColor={stopColor(stop.alpha)} />
          ))}
        </linearGradient>
        <linearGradient
          id={`${maskId}-right`}
          gradientUnits="userSpaceOnUse"
          x1={VIEWBOX_SIZE}
          x2={VIEWBOX_SIZE - depthX}
          y1={0}
          y2={0}
        >
          {stops.map((stop) => (
            <stop key={stop.offset} offset={stop.offset} stopColor={stopColor(stop.alpha)} />
          ))}
        </linearGradient>
        <mask id={maskId} maskContentUnits="userSpaceOnUse" maskUnits="userSpaceOnUse">
          <rect fill="black" height={VIEWBOX_SIZE} width={VIEWBOX_SIZE} x={0} y={0} />
          <rect
            fill={`url(#${maskId}-top)`}
            height={depthY}
            style={{ mixBlendMode: 'lighten' }}
            width={VIEWBOX_SIZE}
            x={0}
            y={0}
          />
          <rect
            fill={`url(#${maskId}-bottom)`}
            height={depthY}
            style={{ mixBlendMode: 'lighten' }}
            width={VIEWBOX_SIZE}
            x={0}
            y={VIEWBOX_SIZE - depthY}
          />
          <rect
            fill={`url(#${maskId}-left)`}
            height={VIEWBOX_SIZE}
            style={{ mixBlendMode: 'lighten' }}
            width={depthX}
            x={0}
            y={0}
          />
          <rect
            fill={`url(#${maskId}-right)`}
            height={VIEWBOX_SIZE}
            style={{ mixBlendMode: 'lighten' }}
            width={depthX}
            x={VIEWBOX_SIZE - depthX}
            y={0}
          />
        </mask>
      </defs>
      <g
        mask={`url(#${maskId})`}
        opacity={innerGrid.opacity / 100}
        stroke={settings.grid.color}
        strokeWidth={settings.grid.thickness}
      >
        {lines.vertical.map((fraction) => (
          <line
            key={`vertical-${fraction}`}
            x1={fraction * VIEWBOX_SIZE}
            x2={fraction * VIEWBOX_SIZE}
            y1={0}
            y2={VIEWBOX_SIZE}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {lines.horizontal.map((fraction) => (
          <line
            key={`horizontal-${fraction}`}
            x1={0}
            x2={VIEWBOX_SIZE}
            y1={fraction * VIEWBOX_SIZE}
            y2={fraction * VIEWBOX_SIZE}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>
    </svg>
  );
}

function TrailLines({
  backWall,
  offsetX,
  offsetY,
  settings,
  side,
}: {
  backWall: RoomRect;
  offsetX: MotionValue<number>;
  offsetY: MotionValue<number>;
  settings: StudioRoomSettings;
  side: TrailSide;
}) {
  const crossDivisions =
    side === 'left' || side === 'right' ? settings.grid.rows : settings.grid.columns;
  const steps = createTrailCrossSteps(
    crossDivisions,
    settings.trail.amount,
    settings.fineGrid.subdivision,
  );

  return steps.map((step, index) => {
    if (side === 'left' || side === 'right') {
      const startX = side === 'left' ? 0 : VIEWBOX_SIZE;
      const endX = side === 'left' ? backWall.x : backWall.x + backWall.width;
      return (
        <Line
          key={index}
          startX={startX}
          startY={VIEWBOX_SIZE * step}
          endX={endX}
          endY={backWall.y + backWall.height * step}
          offsetX={offsetX}
          offsetY={offsetY}
        />
      );
    }

    const startY = side === 'top' ? 0 : VIEWBOX_SIZE;
    const endY = side === 'top' ? backWall.y : backWall.y + backWall.height;
    return (
      <Line
        key={index}
        startX={VIEWBOX_SIZE * step}
        startY={startY}
        endX={backWall.x + backWall.width * step}
        endY={endY}
        offsetX={offsetX}
        offsetY={offsetY}
      />
    );
  });
}

function RoomDepthTrail({
  backWall,
  isNearViewport,
  motionX,
  motionY,
  offsetX,
  offsetY,
  settings,
}: {
  backWall: RoomRect;
  isNearViewport: boolean;
  motionX: MotionValue<number>;
  motionY: MotionValue<number>;
  offsetX: MotionValue<number>;
  offsetY: MotionValue<number>;
  settings: StudioRoomSettings;
}) {
  const velocityX = useVelocity(motionX);
  const velocityY = useVelocity(motionY);
  const envelopes = useRef<TrailEnvelopes>({ bottom: 0, left: 0, right: 0, top: 0 });
  const groups = useRef<Record<TrailSide, SVGGElement | null>>({
    bottom: null,
    left: null,
    right: null,
    top: null,
  });
  const opacities = {
    bottom: useMotionValue(0),
    left: useMotionValue(0),
    right: useMotionValue(0),
    top: useMotionValue(0),
  };

  useAnimationFrame((_time, delta) => {
    if (!isNearViewport) return;

    envelopes.current = advanceTrailEnvelopes(
      envelopes.current,
      delta / 1000,
      { x: velocityX.get(), y: velocityY.get() },
      {
        enabled: true,
        fade: settings.trail.fade,
        velocityScale: 3.2,
      },
    );

    for (const side of ['bottom', 'left', 'right', 'top'] as const) {
      const opacity = envelopes.current[side] * (settings.trail.strength / 100);
      opacities[side].set(opacity);
      groups.current[side]?.setAttribute('data-opacity', opacity.toFixed(3));
    }
  });

  return (
    <svg
      aria-hidden="true"
      className={referenceClasses(styles.trail)}
      preserveAspectRatio="none"
      viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
    >
      {(['bottom', 'left', 'right', 'top'] as const).map((side) => (
        <m.g
          key={side}
          ref={(node) => {
            groups.current[side] = node;
          }}
          className={referenceClasses(styles.trailLines)}
          data-opacity="0.000"
          data-side={side}
          data-studio-room-trail=""
          style={{
            opacity: opacities[side],
            stroke: settings.grid.color,
            strokeWidth: Math.max(settings.grid.thickness, settings.fineGrid.thickness),
          }}
        >
          <TrailLines
            backWall={backWall}
            offsetX={offsetX}
            offsetY={offsetY}
            settings={settings}
            side={side}
          />
        </m.g>
      ))}
    </svg>
  );
}

function RoomTile({
  assignment,
  backWall,
  offsetX,
  offsetY,
  pointerX,
  pointerY,
  settings,
  stageSize,
}: {
  assignment: RenderTileAssignment;
  backWall: RoomRect;
  offsetX: MotionValue<number>;
  offsetY: MotionValue<number>;
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  settings: StudioRoomSettings;
  stageSize: RoomStageSize;
}) {
  const slideProgress = useMotionValue(1);
  const from = assignment.from ?? assignment;

  useEffect(() => {
    if (assignment.shuffleStyle !== 'slide') {
      slideProgress.set(1);
      return;
    }
    slideProgress.set(0);
    const animation = animate(slideProgress, 1, { duration: 0.6, ease: 'easeInOut' });
    return () => animation.stop();
  }, [assignment.revision, assignment.shuffleStyle, slideProgress]);

  const transform = useTransform(
    [offsetX, offsetY, slideProgress],
    ([latestX, latestY, progress]) => {
      const start = getTileCorners(from, backWall, settings, Number(latestX), Number(latestY));
      const end = getTileCorners(assignment, backWall, settings, Number(latestX), Number(latestY));
      return getRoomTileCssTransform(
        interpolateRoomTileCorners(start, end, Number(progress)),
        stageSize,
        VIEWBOX_SIZE,
      );
    },
  );
  const scale = useTransform(
    [pointerX, pointerY, offsetX, offsetY, slideProgress],
    ([latestPointerX, latestPointerY, latestX, latestY, progress]) => {
      if (settings.tiles.hoverLift === 0) return 1;
      const start = getTileCorners(from, backWall, settings, Number(latestX), Number(latestY));
      const end = getTileCorners(assignment, backWall, settings, Number(latestX), Number(latestY));
      const corners = interpolateRoomTileCorners(start, end, Number(progress));
      const center = corners.reduce(
        (sum, point) => ({ x: sum.x + point.x / 4, y: sum.y + point.y / 4 }),
        { x: 0, y: 0 },
      );
      const distance = Math.hypot(
        Number(latestPointerX) - center.x,
        Number(latestPointerY) - center.y,
      );
      const proximity = clamp(1 - distance / 240, 0, 1);
      return 1 + proximity * settings.tiles.hoverLift * 0.04;
    },
  );
  const fogOpacity =
    1 - settings.tiles.fog * ((assignment.depthIndex + 1) / settings.grid.depthDivisions) * 0.7;
  const boxShadow = useTransform(scale, (value) =>
    value > 1.001
      ? `0 ${Math.round(12 * settings.tiles.hoverLift)}px ${Math.round(32 * settings.tiles.hoverLift)}px rgb(20 24 9 / 24%)`
      : '0 0 0 rgb(20 24 9 / 0%)',
  );

  return (
    <m.div className={referenceClasses(styles.tileSlot)} style={{ transform }}>
      <AnimatePresence initial={false} mode="sync" presenceAffectsLayout={false}>
        <m.img
          key={`${assignment.image}-${assignment.revision}`}
          alt=""
          animate={{ filter: 'blur(0px)', opacity: fogOpacity }}
          className={referenceClasses(styles.tileImage)}
          decoding="async"
          draggable={false}
          exit={{ opacity: 0 }}
          initial={{
            filter: `blur(${Math.round(settings.tiles.develop * 18)}px)`,
            opacity: 0,
          }}
          loading="lazy"
          src={assignment.image}
          style={{ boxShadow, scale }}
          transition={{ duration: mix(0.12, 0.55, settings.tiles.develop), ease: 'easeOut' }}
        />
      </AnimatePresence>
    </m.div>
  );
}

function RoomTiles({
  backWall,
  isNearViewport,
  offsetX,
  offsetY,
  pointerX,
  pointerY,
  reducedMotion,
  settings,
  stageSize,
}: {
  backWall: RoomRect;
  isNearViewport: boolean;
  offsetX: MotionValue<number>;
  offsetY: MotionValue<number>;
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  reducedMotion: boolean;
  settings: StudioRoomSettings;
  stageSize: RoomStageSize;
}) {
  const mediaRevision = useSyncExternalStore(
    subscribeStudioRoomMedia,
    getStudioRoomMediaSnapshot,
    getStudioRoomMediaServerSnapshot,
  );
  const images = useMemo(() => {
    void mediaRevision;
    return [...settings.tiles.images]
      .sort((first, second) => first.order - second.order)
      .map((image) => resolveStudioRoomMediaRef(image.ref))
      .filter((source): source is string => source !== null);
  }, [mediaRevision, settings.tiles.images]);
  const layoutKey = `${settings.grid.columns}:${settings.grid.rows}:${settings.grid.depthDivisions}:${settings.tiles.perSurface}:${images.join('|')}`;
  const [layout, setLayout] = useState<RenderTileAssignment[]>(() =>
    createInitialLayout(settings, images),
  );

  useEffect(() => {
    setLayout(createInitialLayout(settings, images));
  }, [images, layoutKey, settings]);

  useEffect(() => {
    if (!isNearViewport) return;

    let activeImage: HTMLImageElement | null = null;
    let cancelled = false;
    let sourceIndex = 0;
    const loadNext = () => {
      if (cancelled || sourceIndex >= images.length) return;
      const source = images[sourceIndex];
      sourceIndex += 1;
      if (!source) return;

      const image = new window.Image();
      activeImage = image;
      image.decoding = 'async';
      const finish = () => {
        image.onload = null;
        image.onerror = null;
        image.src = '';
        if (activeImage === image) activeImage = null;
        loadNext();
      };
      image.onload = finish;
      image.onerror = finish;
      image.src = source;
    };

    loadNext();
    return () => {
      cancelled = true;
      if (!activeImage) return;
      activeImage.onload = null;
      activeImage.onerror = null;
      activeImage.src = '';
      activeImage = null;
    };
  }, [images, isNearViewport]);

  useEffect(() => {
    if (
      !isNearViewport ||
      !settings.motion.enabled ||
      reducedMotion ||
      layout.length === 0 ||
      images.length === 0
    ) {
      return;
    }

    const cells = ROOM_SURFACES.flatMap((surface) => getCellsForSurface(surface, settings));
    let timer = 0;
    const schedule = () => {
      const delay = settings.tiles.interval * 1000 * (0.6 + Math.random() * 0.8);
      timer = window.setTimeout(() => {
        setLayout((current) => {
          const change = pickNextTileChange(
            { assignments: current },
            cells,
            images,
            Math.random,
            settings.tiles.shuffleStyle,
          );
          if (!change) return current;

          const sourceIndex = current.findIndex(
            (assignment) =>
              cellsMatch(assignment, change.source) && assignment.image === change.source.image,
          );
          if (sourceIndex < 0) return current;

          return current.map((assignment, index) =>
            index === sourceIndex
              ? {
                  ...change.destination,
                  from: change.shuffleStyle === 'slide' ? assignment : undefined,
                  id: assignment.id,
                  image: change.image,
                  revision: assignment.revision + 1,
                  shuffleStyle: change.shuffleStyle,
                }
              : assignment,
          );
        });
        schedule();
      }, delay);
    };

    schedule();
    return () => window.clearTimeout(timer);
  }, [images, isNearViewport, layout.length, reducedMotion, settings]);

  return (
    <div aria-hidden="true" className={referenceClasses(styles.tiles)} data-studio-room-tiles={layout.length}>
      <AnimatePresence initial={false} presenceAffectsLayout={false}>
        {layout.map((assignment) => (
          <RoomTile
            key={assignment.id}
            assignment={assignment}
            backWall={backWall}
            offsetX={offsetX}
            offsetY={offsetY}
            pointerX={pointerX}
            pointerY={pointerY}
            settings={settings}
            stageSize={stageSize}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

export function PreFooterRoom({ children, settings }: PreFooterRoomProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const { viewportRef } = useSectionViewport();
  const isNearViewport = useNearViewport(stageRef);
  const [stageSize, setStageSize] = useState({ height: 0, width: 0 });
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const pointerViewX = useMotionValue(-10_000);
  const pointerViewY = useMotionValue(-10_000);
  const reducedMotionPreference = useReducedMotion();
  const reducedMotion = reducedMotionPreference === true || !settings.motion.enabled;
  const springConfig = useMemo(
    () => ({
      damping: 15 + settings.motion.smoothness * 18,
      mass: 0.5,
      stiffness: 85 + settings.motion.smoothness * 100,
    }),
    [settings.motion.smoothness],
  );
  const springX = useSpring(pointerX, springConfig);
  const springY = useSpring(pointerY, springConfig);
  const { scrollYProgress } = useScroll({ target: stageRef, container: viewportRef });
  const parallax = settings.motion.parallax / 100;
  const gridOffsetX = useTransform(springX, (value) => value * 130 * parallax);
  const gridOffsetY = useTransform(
    [springY, scrollYProgress],
    ([pointer, scroll]) =>
      Number(pointer) * 100 * parallax +
      (Number(scroll) - 0.5) * 80 * settings.motion.scrollNudge * (reducedMotion ? 0 : 1),
  );
  const backWallOffsetX = useTransform(
    gridOffsetX,
    (offset) => (offset / VIEWBOX_SIZE) * stageSize.width,
  );
  const backWallOffsetY = useTransform(
    gridOffsetY,
    (offset) => (offset / VIEWBOX_SIZE) * stageSize.height,
  );
  const backWall = useMemo(() => getBackWall(settings), [settings]);
  const backWallRadius = getCircularRoomScreenRadius(WALL_RADIUS, stageSize.height, VIEWBOX_SIZE);
  const backWallStyle = {
    '--back-wall-radius': `${backWallRadius}px`,
    '--back-wall-height': `${(backWall.height / VIEWBOX_SIZE) * 100}%`,
    '--back-wall-left': `${(backWall.x / VIEWBOX_SIZE) * 100}%`,
    '--back-wall-top': `${(backWall.y / VIEWBOX_SIZE) * 100}%`,
    '--back-wall-width': `${(backWall.width / VIEWBOX_SIZE) * 100}%`,
    '--room-border-color': settings.room.wallBorder.colorOpacity.hex,
    '--room-border-opacity': settings.room.wallBorder.colorOpacity.opacity / 100,
    '--room-border-width': `${settings.room.wallBorder.width}px`,
    '--room-wall-fill': settings.room.wallFill,
  } as CSSProperties;

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const observer = new ResizeObserver(([entry]) => {
      const { height, width } = entry.contentRect;
      setStageSize((current) =>
        current.height === height && current.width === width ? current : { height, width },
      );
    });

    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!reducedMotion) return;
    pointerX.set(0);
    pointerY.set(0);
    pointerViewX.set(-10_000);
    pointerViewY.set(-10_000);
  }, [pointerViewX, pointerViewY, pointerX, pointerY, reducedMotion]);

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'touch' || reducedMotion) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const normalizedX = (event.clientX - bounds.left) / bounds.width;
    const normalizedY = (event.clientY - bounds.top) / bounds.height;
    pointerX.set((normalizedX - 0.5) * 2);
    pointerY.set((normalizedY - 0.5) * 2);
    pointerViewX.set(normalizedX * VIEWBOX_SIZE);
    pointerViewY.set(normalizedY * VIEWBOX_SIZE);
  }

  function resetPointer() {
    pointerX.set(0);
    pointerY.set(0);
    pointerViewX.set(-10_000);
    pointerViewY.set(-10_000);
  }

  return (
    <LazyMotion features={domAnimation}>
      <div
        ref={stageRef}
        className={referenceClasses(styles.stage)}
        data-studio-room=""
        onPointerLeave={resetPointer}
        onPointerMove={handlePointerMove}
      >
        {isNearViewport && settings.fineGrid.enabled ? (
          <Grid
            backWall={backWall}
            fine
            offsetX={gridOffsetX}
            offsetY={gridOffsetY}
            settings={settings}
            stageSize={stageSize}
          />
        ) : null}
        {isNearViewport ? (
          <RoomTiles
            backWall={backWall}
            isNearViewport={isNearViewport}
            offsetX={gridOffsetX}
            offsetY={gridOffsetY}
            pointerX={pointerViewX}
            pointerY={pointerViewY}
            reducedMotion={reducedMotion}
            settings={settings}
            stageSize={stageSize}
          />
        ) : null}
        {isNearViewport ? (
          <Grid
            backWall={backWall}
            fine={false}
            offsetX={gridOffsetX}
            offsetY={gridOffsetY}
            settings={settings}
            stageSize={stageSize}
          />
        ) : null}
        {isNearViewport && !reducedMotion && settings.trail.enabled ? (
          <RoomDepthTrail
            backWall={backWall}
            isNearViewport={isNearViewport}
            motionX={springX}
            motionY={springY}
            offsetX={gridOffsetX}
            offsetY={gridOffsetY}
            settings={settings}
          />
        ) : null}

        <m.div
          className={referenceClasses(styles.backWall)}
          style={{ ...backWallStyle, x: backWallOffsetX, y: backWallOffsetY }}
        >
          {isNearViewport && settings.room.innerGrid.enabled ? (
            <InnerGrid backWall={backWall} settings={settings} stageSize={stageSize} />
          ) : null}
          {children}
        </m.div>
      </div>
    </LazyMotion>
  );
}
