import type { PosterPrimitive } from "./poster-types";
import { drawPackGlyph, packGlyphPick } from "./template-glyphs";
import {
  arcPoints,
  cell,
  circle,
  clamp,
  line,
  monoWidth,
  polyline,
  rect,
  smallType,
  text,
  type TemplateRenderContext,
} from "./template-primitives";

function buildStarburst(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const radius = Math.min(height * 0.42, width * 0.28);
  const cx = radius * 1.1;
  const cy = height / 2;
  const size = smallType(context) * 0.78;
  const primitives: PosterPrimitive[] = [];
  for (let ray = 0; ray < 8; ray += 1) {
    const angle = (ray / 8) * Math.PI * 2;
    const inner = ray % 2 === 0 ? radius * 0.18 : radius * 0.4;
    primitives.push(
      polyline(
        [
          [cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner],
          [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius],
        ],
        { width: 1.5 },
      ),
    );
  }
  primitives.push(circle(cx, cy, radius * 0.16, { fill: "ink" }));
  const code = cell(lines, 0) || "S4-08";
  primitives.push(text(cx + radius * 1.4, cy + size * 0.35, code, size, { weight: 700 }));
  return primitives;
}

function buildManifest(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const rows = lines.filter((entry) => !entry.divider).slice(0, 6);
  const list = rows.length > 0 ? rows : [{ cells: ["GENERATE CINEMA"], divider: false }];
  const longest = Math.max(...list.map((entry) => entry.cells.join(" ").length), 8);
  const size = clamp(
    Math.min((height / (list.length + 0.6)) * 0.5, width / (longest * 0.76 + 2.5)) * context.typeScale,
    8,
    30,
  );
  const rowHeight = height / Math.max(1, list.length);
  return list.flatMap((entry, index) => {
    const y = index * rowHeight + rowHeight / 2;
    return [
      polyline(
        [
          [0, y - size * 0.4],
          [size * 0.8, y],
          [0, y + size * 0.4],
        ],
        { closed: true, fill: "ink" },
      ),
      line(size * 1.1, y, size * 2.1, y, 1.4),
      text(size * 2.5, y + size * 0.36, entry.cells.join(" "), size, {
        letterSpacing: size * 0.12,
        weight: 700,
      }),
    ];
  });
}

function buildPillBadge(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const word = cell(lines, 0) || "GENERATING";
  const size = clamp(
    Math.min(height * 0.42, width / Math.max(4, word.length) / 0.88) * context.typeScale,
    9,
    64,
  );
  const primitives: PosterPrimitive[] = [
    rect(0, 0, width, height, { radius: height / 2, stroke: true }),
    text(width / 2, height / 2 + size * 0.36, word, size, {
      align: "center",
      letterSpacing: size * 0.22,
      weight: 700,
    }),
  ];
  const badge = size * 0.85;
  const wordWidth = word.length * size * 0.84;
  if ((width - wordWidth) / 2 > badge * 2.1) {
    drawPackGlyph(primitives, "spark", width / 2 - wordWidth / 2 - badge * 1.6, height / 2 - badge / 2, badge);
  }
  return primitives;
}

function buildCrossGrid(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, rng, width } = context;
  const columns = 3;
  const rows = Math.max(2, Math.round((height / width) * 4));
  const cellWidth = width / columns;
  const cellHeight = height / rows;
  const arm = Math.min(cellWidth, cellHeight) * 0.22;
  const primitives: PosterPrimitive[] = [];
  const special = Math.floor(rng() * columns * rows);
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const cx = column * cellWidth + cellWidth / 2;
      const cy = row * cellHeight + cellHeight / 2;
      if (row * columns + column === special) {
        primitives.push(line(cx - arm, cy - arm, cx + arm, cy + arm, 1.6));
        primitives.push(line(cx - arm, cy + arm, cx + arm, cy - arm, 1.6));
      } else {
        primitives.push(line(cx - arm, cy, cx + arm, cy, 1.6));
        primitives.push(line(cx, cy - arm, cx, cy + arm, 1.6));
      }
    }
  }
  return primitives;
}

function buildDotMatrix(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, rng, width } = context;
  const size = clamp(smallType(context) * 0.6, 7, 20);
  const gridHeight = height - size * 1.6;
  const columns = 8;
  const rows = Math.max(3, Math.round((gridHeight / width) * columns));
  const stepX = width / columns;
  const stepY = gridHeight / rows;
  const radius = Math.min(stepX, stepY) * 0.18;
  const primitives: PosterPrimitive[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      primitives.push(
        circle(column * stepX + stepX / 2, row * stepY + stepY / 2, radius, {
          fill: rng() > 0.4 ? "ink" : "none",
          stroke: true,
        }),
      );
    }
  }
  const code = cell(lines, 0) || "DM-31";
  primitives.push(text(0, height, code, size, { letterSpacing: size * 0.18 }));
  return primitives;
}

function buildBinary(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, rng, width } = context;
  const rows = lines.filter((entry) => !entry.divider).slice(0, 4);
  const fallbackRow = (): string =>
    Array.from({ length: 28 }, () => (rng() > 0.5 ? "1" : "0")).join("");
  const list =
    rows.length > 0 ? rows.map((entry) => entry.cells.join("")) : [fallbackRow(), fallbackRow(), fallbackRow()];
  const longestRow = Math.max(...list.map((row) => row.length), 20);
  const size = clamp(
    Math.min((height / list.length) * 0.62, width / longestRow / 0.76) * context.typeScale,
    7,
    26,
  );
  return list.map((row, index) =>
    text(0, (index + 0.8) * (height / list.length), row, size, {
      letterSpacing: size * 0.12,
    }),
  );
}

function buildProgress(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const label = cell(lines, 0) || "LOADING";
  const valueText = cell(lines, 0, 1) || "64%";
  const ratio = clamp(Number.parseInt(valueText, 10) || 64, 0, 100) / 100;
  const size = clamp(height * 0.32 * context.typeScale, 8, 26);
  const barTop = size * 1.5;
  const barHeight = height - barTop;
  const primitives: PosterPrimitive[] = [
    text(0, size, label, size, { letterSpacing: size * 0.16, weight: 700 }),
    text(width, size, valueText, size, { align: "right" }),
    rect(0, barTop, width, barHeight, { stroke: true }),
    rect(0, barTop, width * ratio, barHeight, { fill: "ink" }),
  ];
  for (let tick = 1; tick < 10; tick += 1) {
    const x = (tick / 10) * width;
    primitives.push(line(x, barTop - size * 0.35, x, barTop));
  }
  return primitives;
}

function buildSignal(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const size = clamp(smallType(context) * 0.7, 8, 24);
  const label = cell(lines, 0) || "SIGNAL";
  const valueText = cell(lines, 0, 1) || "78%";
  const ratio = clamp(Number.parseInt(valueText, 10) || 78, 0, 100) / 100;
  const bars = 6;
  const barsWidth = width * 0.6;
  const step = barsWidth / bars;
  const chartHeight = height - size * 1.6;
  const primitives: PosterPrimitive[] = [];
  for (let bar = 0; bar < bars; bar += 1) {
    const barHeight = chartHeight * ((bar + 1) / bars);
    const active = (bar + 1) / bars <= ratio;
    primitives.push(
      rect(bar * step, chartHeight - barHeight, step * 0.62, barHeight, {
        fill: active ? "ink" : "none",
        stroke: !active,
      }),
    );
  }
  primitives.push(text(0, height, label, size, { letterSpacing: size * 0.14, weight: 700 }));
  primitives.push(text(width, height, valueText, size, { align: "right" }));
  return primitives;
}

function buildDial(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, stroke, width } = context;
  const valueText = cell(lines, 0) || "34%";
  const label = cell(lines, 0, 1) || cell(lines, 1) || "OUTPUT";
  const ratio = clamp(Number.parseInt(valueText, 10) || 34, 0, 100) / 100;
  const radius = Math.min(width, height) * 0.36;
  const cx = width / 2;
  const cy = height / 2 - radius * 0.08;
  const size = clamp(radius * 0.42 * context.typeScale, 9, 40);
  const start = -Math.PI / 2;
  const primitives: PosterPrimitive[] = [
    circle(cx, cy, radius, { stroke: true }),
    polyline(arcPoints(cx, cy, radius * 0.86, start, start + Math.PI * 2 * ratio), {
      width: Math.max(2, (radius * 0.24) / Math.max(0.5, stroke)),
    }),
    text(cx, cy + size * 0.36, valueText, size, { align: "center", weight: 700 }),
    text(cx, cy + radius + size * 0.9, label, size * 0.55, {
      align: "center",
      letterSpacing: size * 0.1,
    }),
  ];
  return primitives;
}

function buildOrbit(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, rng, width } = context;
  const radius = Math.min(width, height) * 0.44;
  const cx = width / 2;
  const cy = height / 2;
  const size = smallType(context) * 0.62;
  const primitives: PosterPrimitive[] = [circle(cx, cy, radius * 0.1, { fill: "ink" })];
  for (const factor of [0.45, 0.72, 1]) {
    primitives.push(circle(cx, cy, radius * factor, { stroke: true }));
    const angle = rng() * Math.PI * 2;
    primitives.push(
      circle(
        cx + Math.cos(angle) * radius * factor,
        cy + Math.sin(angle) * radius * factor,
        size * 0.3,
        { fill: "ink" },
      ),
    );
  }
  const code = cell(lines, 0) || "P9-66";
  primitives.push(text(cx + radius * 0.8, cy - radius * 0.85, code, size));
  return primitives;
}

function buildLens(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const radius = Math.min(width * 0.92, height * 0.46);
  const cx = width / 2;
  const cy = height / 2;
  const size = clamp(smallType(context) * 0.6, 7, 20);
  const primitives: PosterPrimitive[] = [];
  for (let rib = 1; rib <= 7; rib += 1) {
    const factor = rib / 7;
    primitives.push(
      polyline(
        arcPoints(cx, cy, radius * factor, Math.PI / 2, (Math.PI * 3) / 2, 20),
        { width: 1.3 },
      ),
    );
  }
  primitives.push(line(cx, cy - radius, cx, cy + radius, 1.6));
  const code = cell(lines, 0) || "LN-07";
  primitives.push(text(cx + size * 0.8, cy + size * 0.35, code, size));
  return primitives;
}

function buildFooterLine(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const left = cell(lines, 0) || "TEN FORTY TWO";
  const middle = cell(lines, 0, 1) || "STUDIO";
  const rightText = `[ ${cell(lines, 0, 2) || "DUSSELDORF"} ]`;
  const totalChars = left.length + middle.length + rightText.length + 6;
  const size = clamp(
    Math.min(height * 0.44, width / totalChars / 0.7) * context.typeScale,
    8,
    34,
  );
  const y = height / 2 + size * 0.36;
  const glyphWidth = size * 1.5;
  const leftWidth = glyphWidth + monoWidth(left, size) * 1.16 + size * 0.8;
  const middleWidth = monoWidth(middle, size) * 1.16 + monoWidth(rightText, size) * 1.13 + size * 2.4;
  const ruleEnd = Math.max(leftWidth + size, width - middleWidth);
  const primitives: PosterPrimitive[] = [];
  drawPackGlyph(primitives, "compass-star", 0, height / 2 - size * 0.62, size * 1.24);
  return [
    ...primitives,
    text(glyphWidth, y, left, size, { letterSpacing: size * 0.1, weight: 700 }),
    line(leftWidth + size * 0.2, height / 2, ruleEnd, height / 2, 1.6),
    text(ruleEnd + size * 0.8, y, middle, size, {
      letterSpacing: size * 0.1,
      weight: 700,
    }),
    text(width, y, rightText, size, { align: "right", letterSpacing: size * 0.08 }),
  ];
}

function buildPagination(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const current = cell(lines, 0) || "02";
  const total = cell(lines, 0, 1) || "06";
  const label = cell(lines, 1) || "SECTION";
  const size = Math.min(height * 0.52, width / 6 / 0.62);
  const small = clamp(size * 0.3, 8, 22);
  const y = height * 0.55;
  return [
    text(0, y, current, size, { weight: 700 }),
    line(monoWidth(current, size) + size * 0.35, y, monoWidth(current, size) + size * 0.85, y - size * 0.9, 1.5),
    text(monoWidth(current, size) + size * 1.05, y, total, size * 0.62),
    text(0, y + small * 1.9, label, small, { letterSpacing: small * 0.2 }),
  ];
}

function buildSchematic(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, rng, width } = context;
  const size = clamp(smallType(context) * 0.6, 7, 20);
  const nodes: [number, number][] = [];
  const columns = 4;
  const rows = 3;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      if (rng() > 0.35) {
        nodes.push([
          (column + 0.5) * (width / columns),
          (row + 0.5) * ((height - size * 1.6) / rows),
        ]);
      }
    }
  }
  const primitives: PosterPrimitive[] = [];
  for (let index = 1; index < nodes.length; index += 1) {
    const [previousX, previousY] = nodes[index - 1] ?? [0, 0];
    const [currentX, currentY] = nodes[index] ?? [0, 0];
    primitives.push(line(previousX, previousY, currentX, previousY));
    primitives.push(line(currentX, previousY, currentX, currentY));
  }
  for (const [x, y] of nodes) {
    primitives.push(circle(x, y, size * 0.32, { fill: rng() > 0.5 ? "ink" : "none", stroke: true }));
  }
  const code = cell(lines, 0) || "NODE J7";
  primitives.push(text(0, height, code, size, { letterSpacing: size * 0.16 }));
  return primitives;
}

function buildStack(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const size = clamp(smallType(context) * 0.66, 8, 22);
  const layers = 4;
  const stackWidth = width * 0.62;
  const stackHeight = height - size * 1.7;
  const offset = Math.min(stackWidth, stackHeight) * 0.12;
  const layerWidth = stackWidth - offset * (layers - 1);
  const layerHeight = stackHeight - offset * (layers - 1);
  const primitives: PosterPrimitive[] = [];
  for (let layer = layers - 1; layer >= 0; layer -= 1) {
    primitives.push(
      rect(layer * offset, layer * offset, layerWidth, layerHeight, {
        fill: layer === 0 ? "ink" : "paper",
        stroke: true,
      }),
    );
  }
  const label = cell(lines, 0) || "STACK 03";
  primitives.push(
    text(0, height, label, size, { letterSpacing: size * 0.16, weight: 700 }),
  );
  return primitives;
}

function buildEartag(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const tagWidth = Math.min(width * 0.92, height * 0.8);
  const tagHeight = height * 0.92;
  const x = (width - tagWidth) / 2;
  const y = (height - tagHeight) / 2;
  const size = clamp(tagWidth * 0.28 * context.typeScale, 10, 60);
  const number = cell(lines, 0) || "4471";
  const region = cell(lines, 0, 1) || "NL";
  const primitives: PosterPrimitive[] = [];
  drawPackGlyph(primitives, "resin-tri", x + tagWidth * 0.12, y + tagHeight * 0.08, tagWidth * 0.13);
  return [
    ...primitives,
    rect(x, y, tagWidth, tagHeight, { radius: tagWidth * 0.16, stroke: true }),
    circle(x + tagWidth / 2, y + tagHeight * 0.14, tagWidth * 0.06, { stroke: true }),
    line(x, y + tagHeight * 0.28, x + tagWidth, y + tagHeight * 0.28, 1.4),
    text(x + tagWidth / 2, y + tagHeight * 0.52, region, size * 0.5, {
      align: "center",
      letterSpacing: size * 0.1,
    }),
    text(x + tagWidth / 2, y + tagHeight * 0.82, number, size, {
      align: "center",
      weight: 700,
    }),
  ];
}




export const extraBuilders = {
  binary: buildBinary,
  "cross-grid": buildCrossGrid,
  dial: buildDial,
  "dot-matrix": buildDotMatrix,
  eartag: buildEartag,
  "footer-line": buildFooterLine,
  lens: buildLens,
  manifest: buildManifest,
  orbit: buildOrbit,
  pagination: buildPagination,
  "pill-badge": buildPillBadge,
  progress: buildProgress,
  schematic: buildSchematic,
  signal: buildSignal,
  stack: buildStack,
  starburst: buildStarburst,
} satisfies Record<string, (context: TemplateRenderContext) => PosterPrimitive[]>;
