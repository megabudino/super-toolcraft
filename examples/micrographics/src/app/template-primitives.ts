import type {
  PosterCircle,
  PosterLine,
  PosterPolyline,
  PosterPrimitive,
  PosterRect,
  PosterText,
} from "./poster-types";
import type { MicrographTemplateId } from "./template-catalog";

export type ContentLine = {
  cells: readonly string[];
  divider: boolean;
};

export function parseTemplateContent(content: string): ContentLine[] {
  return content
    .split(/\r?\n/)
    .map((raw): ContentLine => {
      const trimmed = raw.trim();
      if (/^-{3,}$/.test(trimmed)) {
        return { cells: [], divider: true };
      }
      return {
        cells: trimmed.split("|").map((cell) => cell.trim()),
        divider: false,
      };
    })
    .filter((line) => line.divider || line.cells.some((cell) => cell.length > 0));
}

export type TemplateRenderContext = {
  height: number;
  lines: readonly ContentLine[];
  rng: () => number;
  stroke: number;
  typeScale: number;
  width: number;
};

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function line(x1: number, y1: number, x2: number, y2: number, width = 1): PosterLine {
  return { kind: "line", width, x1, x2, y1, y2 };
}

export function rect(
  x: number,
  y: number,
  width: number,
  height: number,
  options: Partial<Omit<PosterRect, "height" | "kind" | "width" | "x" | "y">> = {},
): PosterRect {
  return { height, kind: "rect", width, x, y, ...options };
}

export function circle(
  x: number,
  y: number,
  radius: number,
  options: Partial<Omit<PosterCircle, "kind" | "radius" | "x" | "y">> = {},
): PosterCircle {
  return { kind: "circle", radius, x, y, ...options };
}

export function polyline(
  points: readonly [number, number][],
  options: Partial<Omit<PosterPolyline, "kind" | "points">> = {},
): PosterPolyline {
  return { kind: "polyline", points, ...options };
}

export function text(
  x: number,
  y: number,
  value: string,
  size: number,
  options: Partial<Omit<PosterText, "kind" | "size" | "text" | "x" | "y">> = {},
): PosterText {
  return { kind: "text", size, text: value, x, y, ...options };
}

export function cell(lines: readonly ContentLine[], row: number, column = 0): string {
  const entry = lines[row];
  if (!entry || entry.divider) {
    return "";
  }
  return entry.cells[column] ?? "";
}

export function rowLines(lines: readonly ContentLine[], startRow: number): readonly ContentLine[] {
  return lines.slice(startRow);
}

export function monoWidth(value: string, size: number): number {
  return value.length * size * 0.62;
}

export type Builder = (context: TemplateRenderContext) => PosterPrimitive[];

export function smallType(context: TemplateRenderContext): number {
  const unit = Math.min(context.width, context.height);
  return clamp(unit * 0.085 * context.typeScale, 8, 44);
}


export function arcPoints(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  segments = 24,
): [number, number][] {
  const points: [number, number][] = [];
  for (let step = 0; step <= segments; step += 1) {
    const angle = startAngle + ((endAngle - startAngle) * step) / segments;
    points.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]);
  }
  return points;
}

