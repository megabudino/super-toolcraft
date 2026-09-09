'use client';

import { useSyncExternalStore } from 'react';

export interface FineDetailsTrailPointer {
  active: boolean;
  x: number;
  y: number;
}

const listeners = new Set<() => void>();
const restPointer: FineDetailsTrailPointer = { active: false, x: 0, y: 0 };
let pointer: FineDetailsTrailPointer = restPointer;

function publish() {
  for (const listener of listeners) listener();
}

export function setFineDetailsTrailPointer(next: FineDetailsTrailPointer) {
  if (!Number.isFinite(next.x) || !Number.isFinite(next.y)) return;
  const normalized = next.active ? { active: true, x: next.x, y: next.y } : restPointer;
  if (
    normalized.active === pointer.active &&
    normalized.x === pointer.x &&
    normalized.y === pointer.y
  ) {
    return;
  }
  pointer = normalized;
  publish();
}

export function resetFineDetailsTrailPointer() {
  setFineDetailsTrailPointer(restPointer);
}

export function subscribeFineDetailsTrailPointer(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getFineDetailsTrailPointerSnapshot() {
  return pointer;
}

export function getFineDetailsTrailPointerServerSnapshot() {
  return restPointer;
}

export function useFineDetailsTrailPointer() {
  return useSyncExternalStore(
    subscribeFineDetailsTrailPointer,
    getFineDetailsTrailPointerSnapshot,
    getFineDetailsTrailPointerServerSnapshot,
  );
}
