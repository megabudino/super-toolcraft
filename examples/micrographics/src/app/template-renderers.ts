import type { PosterPolyline, PosterPrimitive } from "./poster-types";
import type { MicrographTemplateId } from "./template-catalog";
import {
  cell,
  circle,
  clamp,
  line,
  monoWidth,
  polyline,
  rect,
  rowLines,
  smallType,
  text,
  type Builder,
  type TemplateRenderContext,
} from "./template-primitives";

export { parseTemplateContent } from "./template-primitives";
export type { ContentLine, TemplateRenderContext } from "./template-primitives";

import { drawPackGlyph, packGlyphPick } from "./template-glyphs";
import { compositeBuilders } from "./template-renderers-composite";
import { extraBuilders } from "./template-renderers-extra";
import { buildMegaComposition } from "./template-renderers-mega-factory";
import { buildPlateComposition } from "./template-renderers-plate-factory";
import { plateBuilders } from "./template-renderers-plates";
import { set4Builders } from "./template-renderers-set4";
import { set5Builders } from "./template-renderers-set5";
import { set6Builders } from "./template-renderers-set6";

function buildCaption({ height, lines, rng, typeScale, width }: TemplateRenderContext): PosterPrimitive[] {
  const header = cell(lines, 0) || "INTERNAL ISSUE";
  const fit = width / (header.length * 0.76 + 0.95);
  const size = clamp(Math.min(Math.min(width, height) * 0.14, fit) * typeScale, 9, 48);
  const small = size * 0.62;
  const primitives: PosterPrimitive[] = [];
  drawPackGlyph(
    primitives,
    packGlyphPick(["star-burst", "checker-x", "spark", "compass-star"], rng),
    0,
    size * 0.05,
    size * 0.7,
  );
  primitives.push(
    text(size * 0.95, size * 0.66, header, size, { letterSpacing: size * 0.12, weight: 700 }),
  );
  rowLines(lines, 1)
    .slice(0, 4)
    .forEach((entry, index) => {
      if (entry.divider) return;
      primitives.push(
        text(0, size * 1.4 + (index + 1) * small * 1.5, entry.cells.join(" "), small, {
          letterSpacing: small * 0.08,
        }),
      );
    });
  return primitives;
}

function buildSpecSheet(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const size = smallType(context) * 0.72;
  const primitives: PosterPrimitive[] = [];
  const rowHeight = size * 1.62;
  let y = size * 1.1;
  lines.slice(0, Math.floor(height / rowHeight)).forEach((entry, index) => {
    if (entry.divider) {
      primitives.push(line(0, y - size * 0.45, width, y - size * 0.45));
      y += rowHeight * 0.45;
      return;
    }
    const [key = "", value = ""] = entry.cells;
    const isHeader = index === 0 || entry.cells.length === 1;
    primitives.push(
      text(0, y, key, size, {
        letterSpacing: size * 0.08,
        weight: isHeader ? 700 : 500,
      }),
    );
    if (value) {
      primitives.push(text(width, y, value, size, { align: "right" }));
    }
    y += rowHeight;
  });
  return primitives;
}

function buildDataTable(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const rows = lines.filter((entry) => !entry.divider).slice(0, 8);
  const count = Math.max(1, rows.length);
  const rowHeight = height / count;
  const size = clamp(Math.min(rowHeight * 0.5, width * 0.07) * context.typeScale, 8, 34);
  const primitives: PosterPrimitive[] = [rect(0, 0, width, height, { stroke: true })];
  const columnX = width * 0.52;
  rows.forEach((entry, index) => {
    const top = index * rowHeight;
    if (index > 0) {
      primitives.push(line(0, top, width, top));
    }
    const [key = "", value = ""] = entry.cells;
    const baseline = top + rowHeight / 2 + size * 0.36;
    primitives.push(text(size * 0.6, baseline, key, size, { letterSpacing: size * 0.08 }));
    if (value) {
      primitives.push(line(columnX, top, columnX, top + rowHeight));
      primitives.push(text(columnX + size * 0.6, baseline, value, size, { weight: 700 }));
    }
  });
  return primitives;
}

function buildBarcode(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, rng, width } = context;
  const code = cell(lines, 0) || "LAB-B3-NL61-2024";
  const size = clamp(width / Math.max(10, code.length) / 0.88, 8, height * 0.24);
  const barTop = 0;
  const barHeight = height - size * 1.7;
  const primitives: PosterPrimitive[] = [];
  let x = 0;
  while (x < width) {
    const wide = rng() > 0.62;
    const barWidth = (wide ? 2.6 : 1) * Math.max(1.4, width * 0.008);
    if (rng() > 0.32) {
      primitives.push(rect(x, barTop, barWidth, barHeight, { fill: "ink" }));
    }
    x += barWidth + Math.max(1.4, width * 0.008);
  }
  primitives.push(
    text(width / 2, height - size * 0.24, code, size, {
      align: "center",
      letterSpacing: size * 0.22,
    }),
  );
  return primitives;
}

function buildBigNumber({ height, lines, width }: TemplateRenderContext): PosterPrimitive[] {
  const value = cell(lines, 0) || "56";
  const size = Math.min(height * 0.98, width / Math.max(1, value.length * 0.68));
  return [
    text(width / 2, height / 2 + size * 0.36, value, size, {
      align: "center",
      family: "sans",
      weight: 700,
    }),
  ];
}

function buildCoords(context: TemplateRenderContext): PosterPrimitive[] {
  const { lines, width } = context;
  const size = smallType(context) * 0.75;
  const primitives: PosterPrimitive[] = [];
  const city = cell(lines, 0) || "ZURICH";
  primitives.push(text(0, size, city, size * 1.15, { letterSpacing: size * 0.16, weight: 700 }));
  rowLines(lines, 1)
    .slice(0, 4)
    .forEach((entry, index) => {
      if (entry.divider) {
        primitives.push(line(0, size * (2 + index * 1.5) - size * 0.5, width * 0.6, size * (2 + index * 1.5) - size * 0.5));
        return;
      }
      primitives.push(
        text(0, size * (2.15 + index * 1.5), entry.cells.join(" "), size, {
          letterSpacing: size * 0.06,
        }),
      );
    });
  return primitives;
}

function buildRunState(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const rows = lines.filter((entry) => !entry.divider);
  const header = rows[0]?.cells[0] ?? "STATE";
  const items = rows.slice(1, 7);
  const size = clamp((height / (items.length + 1.6)) * 0.52 * context.typeScale, 8, 30);
  const rowHeight = (height - size * 1.8) / Math.max(1, items.length);
  const primitives: PosterPrimitive[] = [
    text(0, size, header, size, { letterSpacing: size * 0.14, weight: 700 }),
  ];
  items.forEach((entry, index) => {
    const [index_ = "", label = "", state = ""] = entry.cells;
    const y = size * 1.9 + index * rowHeight + size * 0.5;
    primitives.push(text(0, y, index_, size));
    primitives.push(text(size * 2.2, y, label, size, { letterSpacing: size * 0.06 }));
    const active = state !== "off" && state !== "--" && state !== "0";
    primitives.push(
      circle(width - size * 0.5, y - size * 0.34, size * 0.34, {
        fill: active ? "ink" : "none",
        stroke: !active,
      }),
    );
  });
  return primitives;
}

function buildBrackets(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const size = smallType(context) * 0.8;
  const arm = Math.min(width, height) * 0.18;
  const primitives: PosterPrimitive[] = [
    polyline([[0, arm], [0, 0], [arm, 0]], { width: 1.6 }),
    polyline([[width - arm, 0], [width, 0], [width, arm]], { width: 1.6 }),
    polyline([[width, height - arm], [width, height], [width - arm, height]], { width: 1.6 }),
    polyline([[arm, height], [0, height], [0, height - arm]], { width: 1.6 }),
  ];
  const header = cell(lines, 0) || "SYSTEM MODULE";
  const sub = cell(lines, 1);
  primitives.push(
    text(width / 2, height / 2 - (sub ? size * 0.35 : -size * 0.35), header, size, {
      align: "center",
      letterSpacing: size * 0.2,
      weight: 700,
    }),
  );
  if (sub) {
    primitives.push(
      text(width / 2, height / 2 + size * 1.05, sub, size * 0.68, {
        align: "center",
        letterSpacing: size * 0.1,
      }),
    );
  }
  return primitives;
}

function buildHatch(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const code = cell(lines, 0) || "TS-A9-0137";
  const size = clamp(smallType(context) * 0.66, 8, 26);
  const blockHeight = height - size * 1.8;
  const spacing = Math.max(5, Math.min(width, height) * 0.085);
  const primitives: PosterPrimitive[] = [];
  for (let offset = -blockHeight; offset < width; offset += spacing) {
    const t1 = Math.max(0, -offset);
    const t2 = Math.min(blockHeight, width - offset);
    if (t2 > t1) {
      primitives.push(line(offset + t1, t1, offset + t2, t2, 1.6));
    }
  }
  primitives.push(rect(0, 0, width, blockHeight, { stroke: true }));
  primitives.push(text(0, height - size * 0.2, code, size, { letterSpacing: size * 0.2 }));
  return primitives;
}

function buildRuler(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const [start = "0", end = "60", unit = "MM"] = lines[0]?.divider ? [] : (lines[0]?.cells ?? []);
  const size = clamp(height * 0.3 * context.typeScale, 8, 30);
  const top = size * 1.2;
  const primitives: PosterPrimitive[] = [line(0, top, width, top, 1.5)];
  const ticks = 30;
  for (let index = 0; index <= ticks; index += 1) {
    const x = (index / ticks) * width;
    const tall = index % 5 === 0;
    primitives.push(line(x, top, x, top + (tall ? size * 1.15 : size * 0.6)));
  }
  primitives.push(text(0, height, start, size));
  primitives.push(text(width / 2, height, end, size, { align: "center" }));
  primitives.push(text(width, size * 0.8, unit, size * 0.8, { align: "right" }));
  return primitives;
}

function buildTarget(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const radius = Math.min(height * 0.42, width * 0.24);
  const cx = radius * 1.1;
  const cy = height / 2;
  const size = smallType(context) * 0.78;
  const primitives: PosterPrimitive[] = [
    circle(cx, cy, radius, { stroke: true }),
    circle(cx, cy, radius * 0.12, { fill: "ink" }),
    line(cx - radius * 1.35, cy, cx - radius * 0.55, cy),
    line(cx + radius * 0.55, cy, cx + radius * 1.35, cy),
    line(cx, cy - radius * 1.35, cx, cy - radius * 0.55),
    line(cx, cy + radius * 0.55, cx, cy + radius * 1.35),
  ];
  const code = cell(lines, 0) || "V8-75";
  const value = cell(lines, 0, 1) || cell(lines, 1) || "34%";
  const textX = cx + radius * 1.6;
  primitives.push(text(textX, cy - size * 0.35, code, size, { weight: 700 }));
  primitives.push(text(textX, cy + size * 1.0, value, size));
  return primitives;
}

function buildQrCode(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, rng, width } = context;
  const code = cell(lines, 0) || "LOT-G7-1310";
  const size = clamp(smallType(context) * 0.6, 7, 22);
  const modules = 21;
  const side = Math.min(width, height - size * 1.7);
  const cellSize = side / modules;
  const primitives: PosterPrimitive[] = [];
  const finder = (originX: number, originY: number): void => {
    primitives.push(rect(originX, originY, cellSize * 7, cellSize * 7, { stroke: true }));
    primitives.push(rect(originX + cellSize * 2, originY + cellSize * 2, cellSize * 3, cellSize * 3, { fill: "ink" }));
  };
  finder(0, 0);
  finder(side - cellSize * 7, 0);
  finder(0, side - cellSize * 7);
  for (let row = 0; row < modules; row += 1) {
    for (let column = 0; column < modules; column += 1) {
      const inFinder =
        (row < 8 && column < 8) ||
        (row < 8 && column >= modules - 8) ||
        (row >= modules - 8 && column < 8);
      if (!inFinder && rng() > 0.55) {
        primitives.push(rect(column * cellSize, row * cellSize, cellSize, cellSize, { fill: "ink" }));
      }
    }
  }
  primitives.push(text(0, height - size * 0.2, code, size, { letterSpacing: size * 0.14 }));
  return primitives;
}

function ellipsePoints(
  cx: number,
  cy: number,
  radiusX: number,
  radiusY: number,
  segments = 30,
): [number, number][] {
  const points: [number, number][] = [];
  for (let index = 0; index <= segments; index += 1) {
    const angle = (index / segments) * Math.PI * 2;
    points.push([cx + Math.cos(angle) * radiusX, cy + Math.sin(angle) * radiusY]);
  }
  return points;
}

function buildGlobe(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const radius = Math.min(height * 0.44, width * 0.24);
  const cx = radius * 1.1;
  const cy = height / 2;
  const size = smallType(context) * 0.72;
  const primitives: PosterPrimitive[] = [circle(cx, cy, radius, { stroke: true })];
  for (const factor of [0.33, 0.66]) {
    primitives.push(polyline(ellipsePoints(cx, cy, radius * factor, radius)));
    primitives.push(polyline(ellipsePoints(cx, cy, radius, radius * factor)));
  }
  primitives.push(line(cx - radius, cy, cx + radius, cy));
  primitives.push(line(cx, cy - radius, cx, cy + radius));
  const textX = cx + radius * 1.45;
  const rows = lines.filter((entry) => !entry.divider).slice(0, 3);
  const fallback = [["52.5200° N"], ["13.4050° E"], ["BER | DEU"]];
  (rows.length > 0 ? rows.map((entry) => entry.cells) : fallback).forEach((cells, index) => {
    primitives.push(
      text(textX, cy - size * 0.9 + index * size * 1.5, cells.join(" "), size, {
        letterSpacing: size * 0.06,
      }),
    );
  });
  return primitives;
}

function buildWaveform(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, rng, width } = context;
  const size = clamp(smallType(context) * 0.62, 8, 24);
  const waveHeight = height - size * 1.9;
  const middle = waveHeight / 2;
  const primitives: PosterPrimitive[] = [];
  const step = Math.max(3, width * 0.014);
  for (let x = 0; x < width; x += step) {
    const amplitude = middle * (0.15 + rng() * 0.85);
    primitives.push(line(x, middle - amplitude, x, middle + amplitude, 1.4));
  }
  const label = cell(lines, 0) || "ORIGIN";
  const value = cell(lines, 0, 1) || "92%";
  primitives.push(text(0, height, label, size, { letterSpacing: size * 0.16, weight: 700 }));
  primitives.push(text(width, height, value, size, { align: "right" }));
  return primitives;
}

function buildDimension(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const label = cell(lines, 0) || "467 MM";
  const size = clamp(height * 0.4 * context.typeScale, 9, 34);
  const y = height / 2;
  const arrow = size * 0.55;
  const labelWidth = monoWidth(label, size) + size;
  const gapStart = (width - labelWidth) / 2;
  const primitives: PosterPrimitive[] = [
    line(0, y - arrow, 0, y + arrow, 1.4),
    line(width, y - arrow, width, y + arrow, 1.4),
    line(0, y, gapStart, y, 1.4),
    line(width - gapStart, y, width, y, 1.4),
    polyline([[arrow, y - arrow * 0.7], [0, y], [arrow, y + arrow * 0.7]]),
    polyline([[width - arrow, y - arrow * 0.7], [width, y], [width - arrow, y + arrow * 0.7]]),
    text(width / 2, y + size * 0.36, label, size, { align: "center" }),
  ];
  return primitives;
}

function buildChecklist(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const rows = lines.filter((entry) => !entry.divider);
  const header = rows[0]?.cells[0] ?? "CHECK";
  const items = rows.slice(1, 7);
  const size = clamp((height / (items.length + 1.6)) * 0.52 * context.typeScale, 8, 30);
  const rowHeight = (height - size * 1.8) / Math.max(1, items.length);
  const primitives: PosterPrimitive[] = [
    text(0, size, header, size, { letterSpacing: size * 0.14, weight: 700 }),
  ];
  items.forEach((entry, index) => {
    const [index_ = "", label = "", state = ""] = entry.cells;
    const y = size * 1.9 + index * rowHeight + size * 0.5;
    primitives.push(text(0, y, index_, size));
    primitives.push(text(size * 2.2, y, label, size, { letterSpacing: size * 0.06 }));
    primitives.push(text(width - size * 2.4, y, state || "--", size, { align: "right" }));
    const checked = state.toUpperCase() === "OK";
    const box = size * 0.72;
    primitives.push(rect(width - box, y - box + size * 0.14, box, box, { stroke: true }));
    if (checked) {
      primitives.push(
        rect(width - box + box * 0.25, y - box + size * 0.14 + box * 0.25, box * 0.5, box * 0.5, {
          fill: "ink",
        }),
      );
    }
  });
  return primitives;
}

function buildSequence(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const rows = lines.filter((entry) => !entry.divider);
  const header = rows[0]?.cells[0] ?? "SEQUENCE";
  const items = rows.slice(1, 8);
  const fallback = ["001", "002", "003", "004", "005"];
  const list = items.length > 0 ? items.map((entry) => entry.cells.join(" ")) : fallback;
  const size = clamp(
    Math.min(width / Math.max(6, header.length) / 0.88, (height / (list.length + 2.4)) * 0.6) *
      context.typeScale,
    9,
    60,
  );
  const primitives: PosterPrimitive[] = [
    text(0, size, header, size, { letterSpacing: size * 0.24, weight: 700 }),
    line(0, size * 1.7, width * 0.8, size * 1.7, 1.4),
  ];
  const rowHeight = (height - size * 2.6) / Math.max(1, list.length);
  list.forEach((value, index) => {
    primitives.push(
      text(0, size * 2.6 + index * rowHeight + size * 0.6, value, size, {
        letterSpacing: size * 0.28,
      }),
    );
  });
  return primitives;
}

function buildRegMark(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const radius = Math.min(height * 0.42, width * 0.24);
  const cx = radius * 1.15;
  const cy = height / 2;
  const size = smallType(context) * 0.8;
  const quadrant = (startAngle: number): PosterPolyline => {
    const points: [number, number][] = [[cx, cy]];
    for (let step = 0; step <= 12; step += 1) {
      const angle = startAngle + (step / 12) * (Math.PI / 2);
      points.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]);
    }
    return polyline(points, { closed: true, fill: "ink" });
  };
  const primitives: PosterPrimitive[] = [
    circle(cx, cy, radius, { stroke: true }),
    quadrant(-Math.PI / 2),
    quadrant(Math.PI / 2),
    line(cx - radius * 1.3, cy, cx + radius * 1.3, cy),
    line(cx, cy - radius * 1.3, cx, cy + radius * 1.3),
  ];
  const code = cell(lines, 0) || "P9-66";
  primitives.push(text(cx + radius * 1.55, cy + size * 0.35, code, size, { weight: 700 }));
  return primitives;
}

function buildGraph(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, rng, width } = context;
  const size = clamp(smallType(context) * 0.6, 8, 24);
  const title = cell(lines, 0) || "INTERNAL ISSUE";
  const frameTop = size * 1.6;
  const frameHeight = height - frameTop;
  const primitives: PosterPrimitive[] = [
    rect(0, frameTop, width, frameHeight, { stroke: true }),
    text(0, size, title, size, { letterSpacing: size * 0.14, weight: 700 }),
  ];
  const points: [number, number][] = [];
  const steps = 12;
  for (let index = 0; index <= steps; index += 1) {
    const x = (index / steps) * (width - size) + size * 0.5;
    const y = frameTop + frameHeight * (0.18 + rng() * 0.64);
    points.push([x, y]);
  }
  primitives.push(polyline(points, { width: 1.5 }));
  const last = points.at(-1);
  if (last) {
    primitives.push(circle(last[0], last[1], size * 0.28, { fill: "ink" }));
  }
  return primitives;
}

function buildTimecode({ height, lines, width }: TemplateRenderContext): PosterPrimitive[] {
  const value = cell(lines, 0) || "00:57:45";
  const size = Math.min(height * 0.82, width / Math.max(1, value.length * 0.7));
  return [
    text(width / 2, height / 2 + size * 0.34, value, size, {
      align: "center",
      letterSpacing: size * 0.06,
      weight: 700,
    }),
  ];
}

function buildRadar(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, rng, width } = context;
  const radius = Math.min(width, height) * 0.46;
  const cx = width / 2;
  const cy = height / 2;
  const size = smallType(context) * 0.62;
  const primitives: PosterPrimitive[] = [
    circle(cx, cy, radius, { stroke: true }),
    circle(cx, cy, radius * 0.5, { stroke: true }),
    line(cx - radius, cy, cx + radius, cy),
    line(cx, cy - radius, cx, cy + radius),
  ];
  const sweepStart = rng() * Math.PI * 2;
  const sweepPoints: [number, number][] = [[cx, cy]];
  for (let step = 0; step <= 10; step += 1) {
    const angle = sweepStart + (step / 10) * (Math.PI / 5);
    sweepPoints.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]);
  }
  primitives.push(polyline(sweepPoints, { closed: true, fill: "ink" }));
  for (let blip = 0; blip < 3; blip += 1) {
    const angle = rng() * Math.PI * 2;
    const distance = radius * (0.3 + rng() * 0.6);
    primitives.push(
      circle(cx + Math.cos(angle) * distance, cy + Math.sin(angle) * distance, size * 0.3, {
        fill: "ink",
      }),
    );
  }
  const code = cell(lines, 0) || "07-76";
  primitives.push(
    text(Math.min(cx + radius * 0.85, width - monoWidth(code, size)), cy - radius * 0.85, code, size),
  );
  return primitives;
}

function buildAddress(context: TemplateRenderContext): PosterPrimitive[] {
  const { lines, rng, width } = context;
  const size = smallType(context) * 0.78;
  const rows = lines.filter((entry) => !entry.divider).slice(0, 6);
  const fallback = [["TO"], ["STUDIO VEKTOR HAUS"], ["727 BAHNHOFSTRASSE"], ["TOKYO"], ["JAPAN"]];
  const list = rows.length > 0 ? rows.map((entry) => entry.cells) : fallback;
  const primitives: PosterPrimitive[] = list.map((cells, index) =>
    text(0, size * (index === 0 ? 1 : 1 + index * 1.55), cells.join(" "), index === 0 ? size * 0.72 : size, {
      letterSpacing: size * 0.1,
      weight: index === 0 ? 500 : 700,
    }),
  );
  const stamp = size * 2.2;
  drawPackGlyph(
    primitives,
    packGlyphPick(["globe-wire", "globe-seal", "earth"], rng),
    width - stamp,
    0,
    stamp,
  );
  return primitives;
}

const builders: Partial<Record<string, Builder>> = {
  ...compositeBuilders,
  ...extraBuilders,
  ...plateBuilders,
  ...set4Builders,
  ...set5Builders,
  ...set6Builders,
  address: buildAddress,
  barcode: buildBarcode,
  "big-number": buildBigNumber,
  brackets: buildBrackets,
  caption: buildCaption,
  checklist: buildChecklist,
  coords: buildCoords,
  "data-table": buildDataTable,
  dimension: buildDimension,
  globe: buildGlobe,
  graph: buildGraph,
  hatch: buildHatch,
  "qr-code": buildQrCode,
  radar: buildRadar,
  "reg-mark": buildRegMark,
  ruler: buildRuler,
  "run-state": buildRunState,
  sequence: buildSequence,
  "spec-sheet": buildSpecSheet,
  target: buildTarget,
  timecode: buildTimecode,
  waveform: buildWaveform,
};

export function buildTemplatePrimitives(
  template: MicrographTemplateId,
  context: TemplateRenderContext,
): PosterPrimitive[] {
  const builder = builders[template];
  if (builder) {
    return builder(context);
  }
  if (template.startsWith("mega-")) {
    const megaIndex = Number.parseInt(template.replace("mega-", ""), 10) || 1;
    return buildMegaComposition(megaIndex, context);
  }
  const plateIndex = Number.parseInt(template.replace("plate-", ""), 10) || 1;
  return buildPlateComposition(plateIndex, context);
}
