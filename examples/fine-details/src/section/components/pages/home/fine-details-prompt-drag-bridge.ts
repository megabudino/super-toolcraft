'use client';

export interface FineDetailsPromptSceneRect {
  bottom: number;
  left: number;
  right: number;
  top: number;
}

export interface FineDetailsPromptBridgeGeometry {
  interactiveRects: FineDetailsPromptSceneRect[];
  rect: FineDetailsPromptSceneRect | null;
}

export interface FineDetailsPromptBridgeGesture {
  phase: 'cancel' | 'double-click' | 'down' | 'move' | 'up';
  pointerId: number;
  pointerType: string;
  x: number;
  y: number;
}

type GeometryListener = (geometry: FineDetailsPromptBridgeGeometry) => void;
type GestureListener = (gesture: FineDetailsPromptBridgeGesture) => void;

const geometryListeners = new Set<GeometryListener>();
const gestureListeners = new Set<GestureListener>();
let currentGeometry: FineDetailsPromptBridgeGeometry = { interactiveRects: [], rect: null };

export function setFineDetailsPromptBridgeGeometry(geometry: FineDetailsPromptBridgeGeometry) {
  currentGeometry = geometry;
  for (const listener of geometryListeners) listener(geometry);
}

export function getFineDetailsPromptBridgeGeometry() {
  return currentGeometry;
}

export function subscribeFineDetailsPromptBridgeGeometry(listener: GeometryListener) {
  geometryListeners.add(listener);
  return () => geometryListeners.delete(listener);
}

export function publishFineDetailsPromptBridgeGesture(gesture: FineDetailsPromptBridgeGesture) {
  for (const listener of gestureListeners) listener(gesture);
}

export function subscribeFineDetailsPromptBridgeGesture(listener: GestureListener) {
  gestureListeners.add(listener);
  return () => gestureListeners.delete(listener);
}
