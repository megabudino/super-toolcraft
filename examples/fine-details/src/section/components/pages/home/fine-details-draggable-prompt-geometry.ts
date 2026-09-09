import type { FineDetailsPromptSceneRect } from './fine-details-prompt-drag-bridge';

export const FINE_DETAILS_PROMPT_RESET_DURATION_MS = 220;

const promptBoundaryInset = 16;
const promptMinimumReachableEdge = 48;

const interactivePromptTags = new Set([
  'A',
  'BUTTON',
  'INPUT',
  'LABEL',
  'OPTION',
  'SELECT',
  'SUMMARY',
  'TEXTAREA',
]);
const interactivePromptRoles = new Set([
  'button',
  'checkbox',
  'combobox',
  'link',
  'listbox',
  'menuitem',
  'option',
  'radio',
  'slider',
  'spinbutton',
  'switch',
  'tab',
  'textbox',
]);

export interface FineDetailsPromptOffset {
  x: number;
  y: number;
}

export interface FineDetailsPromptOffsetBounds {
  maxX: number;
  maxY: number;
  minX: number;
  minY: number;
}

export interface FineDetailsPromptFlightTrajectory {
  start: FineDetailsPromptOffset;
  target: FineDetailsPromptOffset;
}

export function resolveFineDetailsPromptVisualOffset(
  dragOffset: FineDetailsPromptOffset,
  flightOffset: FineDetailsPromptOffset,
): FineDetailsPromptOffset {
  return {
    x: dragOffset.x + flightOffset.x,
    y: dragOffset.y + flightOffset.y,
  };
}

export function resolveFineDetailsOwnedFlightTarget(
  landingOffset: FineDetailsPromptOffset,
  landingDragAnchor: FineDetailsPromptOffset,
): FineDetailsPromptOffset {
  return {
    x: landingOffset.x - landingDragAnchor.x,
    y: landingOffset.y - landingDragAnchor.y,
  };
}

export function resolveFineDetailsLandingResetFlight(
  flightOffset: FineDetailsPromptOffset,
  landingDragAnchor: FineDetailsPromptOffset,
): FineDetailsPromptOffset {
  return {
    x: flightOffset.x + landingDragAnchor.x,
    y: flightOffset.y + landingDragAnchor.y,
  };
}

export function resolveFineDetailsLandingResetTrajectory(
  trajectory: FineDetailsPromptFlightTrajectory,
  landingDragAnchor: FineDetailsPromptOffset,
): FineDetailsPromptFlightTrajectory {
  return {
    start: resolveFineDetailsLandingResetFlight(trajectory.start, landingDragAnchor),
    target: resolveFineDetailsLandingResetFlight(trajectory.target, landingDragAnchor),
  };
}

export interface FineDetailsPromptDragTarget {
  dragDisabled?: boolean;
  isContentEditable?: boolean;
  role?: string | null;
  tagName: string;
}

interface FineDetailsSectionRect {
  bottom: number;
  left: number;
  right: number;
  top: number;
}

interface FineDetailsPromptRect {
  height: number;
  left: number;
  top: number;
  width: number;
}

interface AxisOffsetBounds {
  max: number;
  min: number;
}

export function canStartFineDetailsPromptDrag({
  dragDisabled = false,
  isContentEditable = false,
  role,
  tagName,
}: FineDetailsPromptDragTarget): boolean {
  return (
    !dragDisabled &&
    !isContentEditable &&
    !interactivePromptTags.has(tagName.toUpperCase()) &&
    !interactivePromptRoles.has(role?.toLowerCase() ?? '')
  );
}

function getAxisOffsetBounds({
  currentOffset,
  panelSize,
  panelStart,
  sectionEnd,
  sectionStart,
}: {
  currentOffset: number;
  panelSize: number;
  panelStart: number;
  sectionEnd: number;
  sectionStart: number;
}): AxisOffsetBounds {
  const baseStart = panelStart - currentOffset;
  const sectionSize = sectionEnd - sectionStart;

  if (sectionSize >= panelSize + promptBoundaryInset * 2) {
    return {
      max: sectionEnd - promptBoundaryInset - panelSize - baseStart,
      min: sectionStart + promptBoundaryInset - baseStart,
    };
  }

  const reachableEdge = Math.min(
    promptMinimumReachableEdge,
    panelSize / 2,
    Math.max((sectionSize - promptBoundaryInset * 2) / 2, 0),
  );
  const min = sectionStart + promptBoundaryInset - panelSize + reachableEdge - baseStart;
  const max = sectionEnd - promptBoundaryInset - reachableEdge - baseStart;

  if (min <= max) return { max, min };

  const centered = (sectionStart + sectionEnd - panelSize) / 2 - baseStart;
  return { max: centered, min: centered };
}

export function getFineDetailsPromptOffsetBounds(
  sectionRect: FineDetailsSectionRect,
  panelRect: FineDetailsPromptRect,
  currentOffset: FineDetailsPromptOffset,
): FineDetailsPromptOffsetBounds {
  const x = getAxisOffsetBounds({
    currentOffset: currentOffset.x,
    panelSize: panelRect.width,
    panelStart: panelRect.left,
    sectionEnd: sectionRect.right,
    sectionStart: sectionRect.left,
  });
  const y = getAxisOffsetBounds({
    currentOffset: currentOffset.y,
    panelSize: panelRect.height,
    panelStart: panelRect.top,
    sectionEnd: sectionRect.bottom,
    sectionStart: sectionRect.top,
  });

  return { maxX: x.max, maxY: y.max, minX: x.min, minY: y.min };
}

export function clampFineDetailsPromptOffset(
  offset: FineDetailsPromptOffset,
  bounds: FineDetailsPromptOffsetBounds,
): FineDetailsPromptOffset {
  return {
    x: Math.min(bounds.maxX, Math.max(bounds.minX, offset.x)),
    y: Math.min(bounds.maxY, Math.max(bounds.minY, offset.y)),
  };
}

export function getFineDetailsPromptResetDuration(prefersReducedMotion: boolean): number {
  return prefersReducedMotion ? 0 : FINE_DETAILS_PROMPT_RESET_DURATION_MS;
}

export function getFineDetailsPromptSceneRect(
  sectionRect: FineDetailsSectionRect,
  panelRect: FineDetailsPromptRect,
  sceneHeight: number,
): FineDetailsPromptSceneRect {
  const sectionWidth = sectionRect.right - sectionRect.left;
  const sectionHeight = sectionRect.bottom - sectionRect.top;
  const scaleX = sectionWidth > 0 ? 1920 / sectionWidth : 0;
  const scaleY = sectionHeight > 0 && sceneHeight > 0 ? sceneHeight / sectionHeight : 0;

  return {
    bottom: (panelRect.top + panelRect.height - sectionRect.top) * scaleY,
    left: (panelRect.left - sectionRect.left) * scaleX,
    right: (panelRect.left + panelRect.width - sectionRect.left) * scaleX,
    top: (panelRect.top - sectionRect.top) * scaleY,
  };
}
