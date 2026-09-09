import type { ToolcraftState } from "@/toolcraft/runtime";

import { grassDefaults } from "./grass-defaults";

export type GrassDefaultTarget = keyof typeof grassDefaults;

export function numberValue(
  state: ToolcraftState,
  target: GrassDefaultTarget,
): number {
  const value = Number(state.values[target] ?? grassDefaults[target]);
  return Number.isFinite(value) ? value : Number(grassDefaults[target]);
}

export function boundedNumberValue(
  state: ToolcraftState,
  target: GrassDefaultTarget,
  min: number,
  max: number,
): number {
  return Math.max(min, Math.min(max, numberValue(state, target)));
}

export function booleanValue(
  state: ToolcraftState,
  target: GrassDefaultTarget,
): boolean {
  const value = state.values[target];
  return typeof value === "boolean" ? value : Boolean(grassDefaults[target]);
}

export function stringValue<T extends string>(
  state: ToolcraftState,
  target: GrassDefaultTarget,
  allowed: readonly T[],
): T {
  const value = state.values[target];
  return typeof value === "string" && allowed.includes(value as T)
    ? (value as T)
    : (grassDefaults[target] as T);
}

export function colorValue(
  state: ToolcraftState,
  target: GrassDefaultTarget,
): string {
  const value = state.values[target];
  const candidate =
    typeof value === "object" && value !== null && "hex" in value
      ? value.hex
      : value;
  return typeof candidate === "string" && /^#[0-9a-f]{6}$/i.test(candidate)
    ? candidate
    : String(grassDefaults[target]);
}

export function rangeValue(
  state: ToolcraftState,
  target: GrassDefaultTarget,
  min: number,
  max: number,
): [number, number] {
  const value = state.values[target];
  if (
    Array.isArray(value) &&
    value.length >= 2 &&
    Number.isFinite(Number(value[0])) &&
    Number.isFinite(Number(value[1]))
  ) {
    const low = Math.max(min, Math.min(max, Number(value[0])));
    const high = Math.max(min, Math.min(max, Number(value[1])));
    return low <= high ? [low, high] : [high, low];
  }
  const fallback = grassDefaults[target] as readonly [number, number];
  return [fallback[0], fallback[1]];
}
