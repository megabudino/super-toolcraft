"use client";

import * as React from "react";
import { createControlHistoryGroupId } from "@/toolcraft/ui";

import {
  isToolcraftControlVisible,
  isToolcraftSectionVisible,
} from "../control-conditions";
import { useToolcraftTheme } from "../theme-runtime";
import { useToolcraft } from "../use-toolcraft";
import {
  easeToolcraftOrientationSnap,
  getToolcraftOrientationPoseFromGizmoPointer,
  interpolateToolcraftOrientationPose,
  projectToolcraftOrientationAxes,
  readToolcraftOrientationPose,
  snapToolcraftOrientationPose,
  type ToolcraftOrientationAxis,
  type ToolcraftOrientationAxisProjection,
  type ToolcraftOrientationPose,
} from "./orientation-math";

export const toolcraftOrientationGizmoCssSize = 70;
export const toolcraftOrientationGizmoInset = 16;

const pixelRatio = 2;
const center = toolcraftOrientationGizmoCssSize / 2;
const axisReach = 24.5;
const dotRadius = 5.6;
const hoverRadius = dotRadius * 1.3;
const hitRadius = 7;
const fallbackHitRadius = 25;
const snapDurationMs = 600;
const dragThresholdPixels = 3;

const axisColors: Record<"x" | "y" | "z", string> = {
  x: "#ff215e",
  y: "#53ff55",
  z: "#3b69ff",
};

function getAxisColor(axis: ToolcraftOrientationAxis): string {
  return axisColors[axis[1] as "x" | "y" | "z"];
}

function sortRearToFront(
  projections: readonly ToolcraftOrientationAxisProjection[],
): ToolcraftOrientationAxisProjection[] {
  return [...projections].sort((left, right) => right.depth - left.depth);
}

function findHoveredAxis(
  projections: readonly ToolcraftOrientationAxisProjection[],
  x: number,
  y: number,
): ToolcraftOrientationAxis | null {
  const ranked = projections
    .map((projection) => ({
      axis: projection.axis,
      depth: projection.depth,
      distance: Math.hypot(x - projection.x, y - projection.y),
    }))
    .sort(
      (left, right) =>
        left.distance - right.distance || left.depth - right.depth,
    );

  return (
    ranked.find((item) => item.distance <= hitRadius)?.axis ??
    ranked.find((item) => item.distance <= fallbackHitRadius)?.axis ??
    null
  );
}

function getLocalPointer(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  const bounds = canvas.getBoundingClientRect();

  return {
    x:
      ((clientX - bounds.left) / Math.max(1, bounds.width)) *
      toolcraftOrientationGizmoCssSize,
    y:
      ((clientY - bounds.top) / Math.max(1, bounds.height)) *
      toolcraftOrientationGizmoCssSize,
  };
}

function drawGizmo(
  canvas: HTMLCanvasElement,
  pose: ToolcraftOrientationPose,
  hoveredAxis: ToolcraftOrientationAxis | null,
): void {
  const context = canvas.getContext("2d");
  if (!context) return;

  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(
    0,
    0,
    toolcraftOrientationGizmoCssSize,
    toolcraftOrientationGizmoCssSize,
  );
  context.lineCap = "round";

  for (const projection of sortRearToFront(
    projectToolcraftOrientationAxes(pose, center, axisReach),
  )) {
    const color = getAxisColor(projection.axis);
    context.globalAlpha = projection.isFrontFacing ? 0.95 : 0.3;

    if (projection.axis[0] === "+") {
      context.strokeStyle = color;
      context.lineWidth = 2.1;
      context.beginPath();
      context.moveTo(center, center);
      context.lineTo(projection.x, projection.y);
      context.stroke();
    }

    context.fillStyle = color;
    context.beginPath();
    context.arc(
      projection.x,
      projection.y,
      projection.axis === hoveredAxis ? hoverRadius : dotRadius,
      0,
      Math.PI * 2,
    );
    context.fill();

    if (projection.axis === hoveredAxis) {
      context.globalAlpha = 0.7;
      context.strokeStyle = "#ffffff";
      context.lineWidth = 1;
      context.stroke();
    }
  }

  context.globalAlpha = 1;
}

export function ToolcraftOrientationGizmoLayer(): React.JSX.Element | null {
  const { dispatch, state } = useToolcraft();
  const { resolvedTheme } = useToolcraftTheme();
  const selection = React.useMemo(() => {
    const entries = (state.schema.panels.controls?.sections ?? []).flatMap(
      (section) => {
        if (!isToolcraftSectionVisible(state, section)) return [];

        return Object.entries(section.controls).flatMap(([id, control]) =>
          control.type === "orientationGizmo" &&
          isToolcraftControlVisible(state, control)
            ? [{ control, id }]
            : [],
        );
      },
    );

    if (entries.length > 1) {
      throw new Error(
        `Multiple orientationGizmo controls are visible: ${entries
          .map(({ id }) => id)
          .join(", ")}.`,
      );
    }

    return entries[0] ?? null;
  }, [state]);

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = React.useRef(0);
  const pose = readToolcraftOrientationPose(
    selection ? state.values[selection.control.target] : undefined,
    selection
      ? readToolcraftOrientationPose(selection.control.defaultValue)
      : undefined,
  );
  const poseRef = React.useRef(pose);
  const activeAxisRef = React.useRef<ToolcraftOrientationAxis | null>(null);
  const activeAxisCameraLocalZSignRef = React.useRef<-1 | 1>(1);
  const draggedRef = React.useRef(false);
  const historyGroupRef = React.useRef("");
  const startPointerRef = React.useRef({ x: 0, y: 0 });
  const [hoveredAxis, setHoveredAxis] =
    React.useState<ToolcraftOrientationAxis | null>(null);
  poseRef.current = pose;

  React.useLayoutEffect(() => {
    if (canvasRef.current) {
      drawGizmo(canvasRef.current, pose, hoveredAxis);
    }
  }, [hoveredAxis, pose]);

  React.useEffect(
    () => () => window.cancelAnimationFrame(animationFrameRef.current),
    [],
  );

  if (!selection) {
    return null;
  }

  const commitPose = (nextPose: ToolcraftOrientationPose): void => {
    poseRef.current = nextPose;
    dispatch({
      history: "merge",
      historyGroup: historyGroupRef.current,
      label: "3D orientation",
      target: selection.control.target,
      type: "controls.setValue",
      value: nextPose,
    });
  };

  const animateSnap = (axis: ToolcraftOrientationAxis): void => {
    window.cancelAnimationFrame(animationFrameRef.current);
    const startPose = poseRef.current;
    const targetPose = snapToolcraftOrientationPose(startPose, axis);
    const startedAt = performance.now();

    const animate = (now: number): void => {
      const progress = Math.min(1, (now - startedAt) / snapDurationMs);
      commitPose(
        interpolateToolcraftOrientationPose(
          startPose,
          targetPose,
          easeToolcraftOrientationSnap(progress),
        ),
      );

      if (progress < 1) {
        animationFrameRef.current = window.requestAnimationFrame(animate);
      } else {
        animationFrameRef.current = 0;
      }
    };

    animationFrameRef.current = window.requestAnimationFrame(animate);
  };

  return (
    <>
      <div
        aria-hidden="true"
        data-slot="toolcraft-orientation-gizmo-backing"
        style={{
          backgroundColor: resolvedTheme === "dark" ? "#000000" : "#ececef",
          borderRadius: "50%",
          bottom: toolcraftOrientationGizmoInset,
          contain: "paint",
          height: toolcraftOrientationGizmoCssSize,
          left: toolcraftOrientationGizmoInset,
          pointerEvents: "none",
          position: "absolute",
          width: toolcraftOrientationGizmoCssSize,
          zIndex: 20,
        }}
      />
      <canvas
        aria-label="3D orientation gizmo"
        data-hovered-axis={hoveredAxis ?? ""}
        data-testid="toolcraft-orientation-gizmo"
        data-toolcraft-canvas-handle="orientation-gizmo"
        data-toolcraft-orientation-pose={JSON.stringify(pose)}
        data-toolcraft-orientation-target={selection.control.target}
        height={toolcraftOrientationGizmoCssSize * pixelRatio}
        onPointerCancel={(event) => {
          event.preventDefault();
          event.stopPropagation();
          activeAxisRef.current = null;
          draggedRef.current = false;
          setHoveredAxis(null);
        }}
        onPointerDown={(event) => {
          if (event.button !== 0) return;

          event.preventDefault();
          event.stopPropagation();
          const point = getLocalPointer(
            event.currentTarget,
            event.clientX,
            event.clientY,
          );
          const projections = projectToolcraftOrientationAxes(
            poseRef.current,
            center,
            axisReach,
          );
          const axis = findHoveredAxis(projections, point.x, point.y);
          if (!axis) return;

          const activeProjection = projections.find(
            (projection) => projection.axis === axis,
          );
          window.cancelAnimationFrame(animationFrameRef.current);
          historyGroupRef.current =
            createControlHistoryGroupId("orientation-gizmo");
          activeAxisRef.current = axis;
          activeAxisCameraLocalZSignRef.current =
            (activeProjection?.depth ?? -1) <= 0 ? 1 : -1;
          draggedRef.current = false;
          startPointerRef.current = point;
          setHoveredAxis(axis);
          event.currentTarget.setPointerCapture?.(event.pointerId);
        }}
        onPointerLeave={() => {
          if (!activeAxisRef.current) setHoveredAxis(null);
        }}
        onPointerMove={(event) => {
          event.stopPropagation();
          const point = getLocalPointer(
            event.currentTarget,
            event.clientX,
            event.clientY,
          );
          const activeAxis = activeAxisRef.current;

          if (!activeAxis) {
            setHoveredAxis(
              findHoveredAxis(
                projectToolcraftOrientationAxes(
                  poseRef.current,
                  center,
                  axisReach,
                ),
                point.x,
                point.y,
              ),
            );
            return;
          }

          event.preventDefault();
          if (
            !draggedRef.current &&
            Math.hypot(
              point.x - startPointerRef.current.x,
              point.y - startPointerRef.current.y,
            ) <= dragThresholdPixels
          ) {
            return;
          }

          draggedRef.current = true;
          commitPose(
            getToolcraftOrientationPoseFromGizmoPointer(
              poseRef.current,
              activeAxis,
              point.x,
              point.y,
              center,
              axisReach,
              activeAxisCameraLocalZSignRef.current,
            ),
          );
        }}
        onPointerUp={(event) => {
          const activeAxis = activeAxisRef.current;
          if (!activeAxis) return;

          event.preventDefault();
          event.stopPropagation();
          if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
            event.currentTarget.releasePointerCapture?.(event.pointerId);
          }
          activeAxisRef.current = null;
          setHoveredAxis(null);
          if (!draggedRef.current) animateSnap(activeAxis);
          draggedRef.current = false;
        }}
        ref={canvasRef}
        role="application"
        style={{
          backgroundColor: "transparent",
          borderRadius: "50%",
          bottom: toolcraftOrientationGizmoInset,
          height: toolcraftOrientationGizmoCssSize,
          left: toolcraftOrientationGizmoInset,
          outline: "none",
          outlineWidth: 0,
          position: "absolute",
          touchAction: "none",
          width: toolcraftOrientationGizmoCssSize,
          zIndex: 21,
        }}
        width={toolcraftOrientationGizmoCssSize * pixelRatio}
      />
    </>
  );
}
