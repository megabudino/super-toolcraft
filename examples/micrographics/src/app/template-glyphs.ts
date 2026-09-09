import type { PosterPolyline, PosterPrimitive } from "./poster-types";
import {
  packGlyphData,
  packGlyphIds,
  type PackGlyphDefinition,
} from "./template-glyph-data";

export { packGlyphIds };

export type PackGlyphPaint = "ink" | "outline" | "paper";

const GRID = 200;

function glyphDefinition(id: string): PackGlyphDefinition | undefined {
  return packGlyphData[id];
}

export function packGlyphAspect(id: string): number {
  return glyphDefinition(id)?.aspect ?? 1;
}

function toPoints(
  flat: readonly number[],
  x: number,
  y: number,
  factor: number,
): [number, number][] {
  const points: [number, number][] = [];
  for (let index = 0; index + 1 < flat.length; index += 2) {
    points.push([
      x + (flat[index] ?? 0) * factor,
      y + (flat[index + 1] ?? 0) * factor,
    ]);
  }
  return points;
}

export function drawPackGlyph(
  prims: PosterPrimitive[],
  id: string,
  x: number,
  y: number,
  height: number,
  paint: PackGlyphPaint = "ink",
): number {
  const glyph = glyphDefinition(id);
  if (!glyph || height <= 0) {
    return 0;
  }
  const aspect = glyph.aspect;
  const heightUnits = aspect >= 1 ? GRID / aspect : GRID;
  const factor = height / heightUnits;

  for (const [mode, subs] of glyph.shapes) {
    const first = subs[0];
    if (!first || first.length < 4) {
      continue;
    }
    if (mode === 2) {
      for (const flat of subs) {
        const points = toPoints(flat, x, y, factor);
        if (points.length >= 2) {
          prims.push({ kind: "polyline", points, width: 0.9 });
        }
      }
      continue;
    }
    const fill =
      paint === "outline"
        ? "none"
        : mode === 0
          ? paint === "paper"
            ? "paper"
            : "ink"
          : paint === "paper"
            ? "ink"
            : "paper";
    const outer = toPoints(first, x, y, factor);
    if (outer.length < 2) {
      continue;
    }
    const holes = subs
      .slice(1)
      .map((flat) => toPoints(flat, x, y, factor))
      .filter((points) => points.length >= 3);
    const primitive: PosterPolyline = {
      closed: true,
      kind: "polyline",
      points: outer,
      ...(fill === "none" ? { width: 1 } : { fill }),
      ...(holes.length > 0 ? { holes } : {}),
    };
    prims.push(primitive);
  }
  return height * aspect;
}

export function packGlyphPick(
  ids: readonly string[],
  rng: () => number,
): string {
  return ids[Math.floor(rng() * ids.length) % Math.max(1, ids.length)] ?? packGlyphIds[0] ?? "";
}
