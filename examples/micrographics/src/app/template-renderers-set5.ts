import type { PosterPrimitive } from "./poster-types";
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

function buildEqualizer(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, rng, width } = context;
  const size = clamp(smallType(context) * 0.62, 8, 24);
  const chartHeight = height - size * 1.9;
  const bars = 14;
  const slot = width / bars;
  const barWidth = slot * 0.55;
  const primitives: PosterPrimitive[] = [line(0, chartHeight, width, chartHeight)];
  for (let index = 0; index < bars; index += 1) {
    const level = chartHeight * (0.2 + rng() * 0.75);
    const x = index * slot + (slot - barWidth) / 2;
    primitives.push(rect(x, chartHeight - level, barWidth, level, { fill: "ink" }));
    primitives.push(line(x, chartHeight - level - size * 0.4, x + barWidth, chartHeight - level - size * 0.4, 1.4));
  }
  const label = cell(lines, 0) || "EQ-07";
  const value = cell(lines, 0, 1) || "12 DB";
  primitives.push(text(0, height, label, size, { letterSpacing: size * 0.14, weight: 700 }));
  primitives.push(text(width, height, value, size, { align: "right" }));
  return primitives;
}

function buildHistogram(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, rng, width } = context;
  const size = clamp(smallType(context) * 0.6, 8, 24);
  const title = cell(lines, 0) || "DENSITY";
  const frameTop = size * 1.6;
  const frameHeight = height - frameTop;
  const primitives: PosterPrimitive[] = [
    rect(0, frameTop, width, frameHeight, { stroke: true }),
    text(0, size, title, size, { letterSpacing: size * 0.14, weight: 700 }),
  ];
  const bars = 8;
  const slot = width / bars;
  for (let index = 0; index < bars; index += 1) {
    const level = frameHeight * (0.15 + rng() * 0.72);
    primitives.push(
      rect(index * slot + slot * 0.2, frameTop + frameHeight - level, slot * 0.6, level, {
        fill: index % 3 === 1 ? "none" : "ink",
        stroke: index % 3 === 1,
      }),
    );
    primitives.push(line(index * slot, frameTop + frameHeight, index * slot, frameTop + frameHeight + size * 0.4));
  }
  return primitives;
}

function buildDonutGauge(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, rng, width } = context;
  const size = smallType(context) * 0.72;
  const radius = Math.min(width * 0.3, height * 0.4);
  const cx = radius * 1.2;
  const cy = height / 2;
  const inner = radius * 0.68;
  const pct = Number.parseInt(cell(lines, 0), 10) || Math.round(20 + rng() * 70);
  const sweep = (clamp(pct, 2, 100) / 100) * Math.PI * 2;
  const start = -Math.PI / 2;
  const primitives: PosterPrimitive[] = [
    circle(cx, cy, radius, { stroke: true }),
    circle(cx, cy, inner, { stroke: true }),
  ];
  const outerArc = arcPoints(cx, cy, radius, start, start + sweep);
  const innerArc = arcPoints(cx, cy, inner, start + sweep, start);
  primitives.push(polyline([...outerArc, ...innerArc], { closed: true, fill: "ink" }));
  const label = cell(lines, 0, 1) || "CHARGE";
  primitives.push(text(cx + radius * 1.35, cy - size * 0.2, `${clamp(pct, 0, 100)}%`, size * 1.3, { weight: 700 }));
  primitives.push(text(cx + radius * 1.35, cy + size * 1.15, label, size * 0.8, { letterSpacing: size * 0.1 }));
  return primitives;
}

function buildIsoCube(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const size = smallType(context) * 0.66;
  const radius = Math.min(width * 0.34, height * 0.4);
  const cx = width * 0.38;
  const cy = height * 0.52;
  const dx = radius * 0.86;
  const dy = radius * 0.5;
  const top: [number, number] = [cx, cy - radius];
  const left: [number, number] = [cx - dx, cy - radius + dy];
  const right: [number, number] = [cx + dx, cy - radius + dy];
  const bottomLeft: [number, number] = [cx - dx, cy + dy * 0.9];
  const bottomRight: [number, number] = [cx + dx, cy + dy * 0.9];
  const bottom: [number, number] = [cx, cy + dy * 1.9 - radius * 0.1];
  const center: [number, number] = [cx, cy - radius + dy * 2];
  const primitives: PosterPrimitive[] = [
    polyline([top, left, bottomLeft, bottom, bottomRight, right], { closed: true, width: 1.5 }),
    polyline([left, center, right]),
    line(center[0], center[1], bottom[0], bottom[1]),
  ];
  const [w = "120", h = "80", d = "64"] = lines[0]?.cells ?? [];
  primitives.push(
    text(Math.max(cx - dx - size * 0.4, monoWidth(w, size)), cy + dy * 1.6, w, size, { align: "right" }),
  );
  primitives.push(text(cx + dx + size * 0.4, cy + dy * 1.6, h, size));
  primitives.push(text(cx, cy - radius - size * 0.5, d, size, { align: "center" }));
  return primitives;
}

function buildCircuit(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, rng, width } = context;
  const size = clamp(smallType(context) * 0.62, 8, 24);
  const board = height - size * 1.8;
  const primitives: PosterPrimitive[] = [];
  const pad = (x: number, y: number): void => {
    primitives.push(rect(x - size * 0.35, y - size * 0.35, size * 0.7, size * 0.7, { stroke: true }));
    primitives.push(circle(x, y, size * 0.12, { fill: "ink" }));
  };
  for (let route = 0; route < 4; route += 1) {
    const y = board * (0.16 + route * 0.24);
    const bendX = width * (0.25 + rng() * 0.45);
    const endY = clamp(y + (rng() > 0.5 ? 1 : -1) * board * 0.14, board * 0.08, board * 0.92);
    primitives.push(polyline([[size * 0.5, y], [bendX, y], [bendX, endY], [width - size * 0.6, endY]], { width: 1.4 }));
    primitives.push(circle(bendX, y, size * 0.16, { fill: "ink" }));
    pad(size * 0.5, y);
    pad(width - size * 0.6, endY);
  }
  const code = cell(lines, 0) || "PCB-A12";
  primitives.push(text(0, height, code, size, { letterSpacing: size * 0.16 }));
  return primitives;
}

function buildPunchCard(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, rng, width } = context;
  const size = clamp(smallType(context) * 0.62, 8, 24);
  const top = size * 1.5;
  const columns = 12;
  const rows = 5;
  const cellWidth = width / columns;
  const cellHeight = (height - top) / rows;
  const primitives: PosterPrimitive[] = [
    text(0, size, cell(lines, 0) || "PC-31", size, { letterSpacing: size * 0.16, weight: 700 }),
  ];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x = column * cellWidth + cellWidth * 0.24;
      const y = top + row * cellHeight + cellHeight * 0.28;
      const slotWidth = cellWidth * 0.52;
      const slotHeight = cellHeight * 0.44;
      primitives.push(rect(x, y, slotWidth, slotHeight, { fill: rng() > 0.68 ? "ink" : "none", stroke: true }));
    }
  }
  return primitives;
}

function buildTestPattern(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const size = clamp(smallType(context) * 0.62, 8, 24);
  const blockHeight = height - size * 1.8;
  const bars = 9;
  const slot = width / bars;
  const primitives: PosterPrimitive[] = [rect(0, 0, width, blockHeight, { stroke: true })];
  for (let index = 0; index < bars; index += 1) {
    const x = index * slot;
    const mode = index % 3;
    if (mode === 0) {
      primitives.push(rect(x, 0, slot, blockHeight, { fill: "ink" }));
    } else if (mode === 1) {
      const stripes = 4;
      for (let stripe = 0; stripe < stripes; stripe += 1) {
        primitives.push(
          rect(x, (blockHeight / stripes) * stripe, slot, blockHeight / stripes / 2, { fill: "ink" }),
        );
      }
    } else {
      primitives.push(line(x, 0, x, blockHeight));
    }
  }
  primitives.push(text(0, height, cell(lines, 0) || "CAL 07", size, { letterSpacing: size * 0.2 }));
  return primitives;
}

function buildTally(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const count = clamp(Number.parseInt(cell(lines, 0), 10) || 17, 1, 29);
  const size = clamp(smallType(context), 9, 34);
  const strokeHeight = height * 0.52;
  const top = (height - strokeHeight) / 2;
  const gap = strokeHeight * 0.24;
  const groupGap = gap * 2.4;
  const primitives: PosterPrimitive[] = [];
  let x = 0;
  let placed = 0;
  while (placed < count && x < width * 0.72) {
    const groupCount = Math.min(5, count - placed);
    for (let mark = 0; mark < Math.min(4, groupCount); mark += 1) {
      primitives.push(line(x + mark * gap, top, x + mark * gap, top + strokeHeight, 1.4));
    }
    if (groupCount === 5) {
      primitives.push(line(x - gap * 0.5, top + strokeHeight * 0.82, x + gap * 3.5, top + strokeHeight * 0.16, 1.4));
    }
    placed += groupCount;
    x += gap * 3 + groupGap;
  }
  primitives.push(
    text(width, height / 2 + size * 0.7, String(count), size * 2, { align: "right", family: "sans", weight: 700 }),
  );
  return primitives;
}

function buildStampFrame(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const size = smallType(context) * 0.72;
  const primitives: PosterPrimitive[] = [rect(0, 0, width, height, { stroke: true })];
  const dot = Math.min(width, height) * 0.035;
  const stepsX = Math.max(4, Math.round(width / (dot * 4)));
  const stepsY = Math.max(4, Math.round(height / (dot * 4)));
  for (let index = 0; index <= stepsX; index += 1) {
    const x = (index / stepsX) * width;
    primitives.push(circle(x, 0, dot, { stroke: true }));
    primitives.push(circle(x, height, dot, { stroke: true }));
  }
  for (let index = 1; index < stepsY; index += 1) {
    const y = (index / stepsY) * height;
    primitives.push(circle(0, y, dot, { stroke: true }));
    primitives.push(circle(width, y, dot, { stroke: true }));
  }
  primitives.push(rect(width * 0.16, height * 0.18, width * 0.68, height * 0.64, { stroke: true }));
  const value = cell(lines, 0) || "45";
  const label = cell(lines, 0, 1) || "POST";
  primitives.push(
    text(width / 2, height / 2 + size * 0.4, value, size * 1.9, { align: "center", family: "sans", weight: 700 }),
  );
  primitives.push(text(width / 2, height * 0.74, label, size * 0.72, { align: "center", letterSpacing: size * 0.2 }));
  return primitives;
}

function buildTicket(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const size = smallType(context) * 0.8;
  const notch = height * 0.14;
  const tear = width * 0.68;
  const primitives: PosterPrimitive[] = [
    rect(0, 0, width, height, { radius: height * 0.1, stroke: true }),
    polyline(arcPoints(tear, 0, notch, 0, Math.PI), { closed: true, fill: "paper" }),
    polyline(arcPoints(tear, height, notch, Math.PI, Math.PI * 2), { closed: true, fill: "paper" }),
  ];
  const dashes = 8;
  for (let index = 0; index < dashes; index += 1) {
    const y = notch * 1.4 + ((height - notch * 2.8) / dashes) * (index + 0.2);
    primitives.push(line(tear, y, tear, y + (height - notch * 2.8) / dashes / 2));
  }
  const label = cell(lines, 0) || "ADMIT";
  const code = cell(lines, 0, 1) || "204175";
  primitives.push(text(size, height / 2 + size * 0.4, label, size * 1.2, { letterSpacing: size * 0.24, weight: 700 }));
  primitives.push(text((tear + width) / 2, height / 2 + size * 0.3, code, size * 0.72, { align: "center", letterSpacing: size * 0.1 }));
  return primitives;
}

function buildProtractor(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const size = smallType(context) * 0.7;
  const radius = Math.min(width * 0.4, height * 0.78);
  const cx = width * 0.44;
  const cy = height * 0.88;
  const primitives: PosterPrimitive[] = [
    line(cx - radius, cy, cx + radius, cy, 1.5),
    polyline(arcPoints(cx, cy, radius, Math.PI, Math.PI * 2), { width: 1.5 }),
  ];
  for (let degree = 0; degree <= 180; degree += 10) {
    const angle = Math.PI + (degree / 180) * Math.PI;
    const long = degree % 30 === 0;
    const inner = radius * (long ? 0.86 : 0.92);
    primitives.push(
      line(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner, cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius),
    );
  }
  const value = Number.parseInt(cell(lines, 0), 10) || 64;
  const angle = Math.PI + (clamp(value, 0, 180) / 180) * Math.PI;
  primitives.push(line(cx, cy, cx + Math.cos(angle) * radius * 0.78, cy + Math.sin(angle) * radius * 0.78, 1.6));
  primitives.push(polyline(arcPoints(cx, cy, radius * 0.24, Math.PI, angle)));
  primitives.push(circle(cx, cy, size * 0.16, { fill: "ink" }));
  primitives.push(text(cx + radius * 0.5, cy - radius * 0.52, `${clamp(value, 0, 180)}°`, size, { weight: 700 }));
  return primitives;
}

function buildLevel(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, rng, width } = context;
  const size = clamp(smallType(context) * 0.66, 8, 24);
  const tubeHeight = height - size * 1.8;
  const primitives: PosterPrimitive[] = [
    rect(0, 0, width, tubeHeight, { radius: tubeHeight / 2, stroke: true }),
    line(width * 0.46, 0, width * 0.46, tubeHeight),
    line(width * 0.54, 0, width * 0.54, tubeHeight),
  ];
  const offset = (rng() - 0.5) * width * 0.1;
  primitives.push(circle(width * 0.5 + offset, tubeHeight / 2, tubeHeight * 0.32, { stroke: true }));
  primitives.push(circle(width * 0.5 + offset, tubeHeight / 2, tubeHeight * 0.1, { fill: "ink" }));
  const label = cell(lines, 0) || "LEVEL";
  const value = cell(lines, 0, 1) || "0.4°";
  primitives.push(text(0, height, label, size, { letterSpacing: size * 0.16, weight: 700 }));
  primitives.push(text(width, height, value, size, { align: "right" }));
  return primitives;
}

function buildThermometer(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, rng, width } = context;
  const size = smallType(context) * 0.9;
  const bulb = Math.min(width * 0.3, height * 0.09);
  const tubeWidth = bulb * 0.9;
  const tubeX = width * 0.5 - tubeWidth / 2;
  const tubeTop = size * 1.6;
  const tubeBottom = height - bulb * 2.2;
  const primitives: PosterPrimitive[] = [
    rect(tubeX, tubeTop, tubeWidth, tubeBottom - tubeTop, { radius: tubeWidth / 2, stroke: true }),
    circle(width / 2, tubeBottom + bulb * 0.9, bulb, { fill: "ink" }),
  ];
  const fill = 0.25 + rng() * 0.6;
  const fillTop = tubeTop + (tubeBottom - tubeTop) * (1 - fill);
  primitives.push(rect(tubeX + tubeWidth * 0.28, fillTop, tubeWidth * 0.44, tubeBottom - fillTop, { fill: "ink" }));
  for (let tick = 0; tick <= 6; tick += 1) {
    const y = tubeTop + ((tubeBottom - tubeTop) / 6) * tick;
    primitives.push(line(tubeX - tubeWidth * (tick % 3 === 0 ? 0.7 : 0.4), y, tubeX - tubeWidth * 0.15, y));
  }
  primitives.push(text(width / 2, size, cell(lines, 0) || "36°C", size, { align: "center", weight: 700 }));
  return primitives;
}

function buildBattery(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const size = clamp(smallType(context) * 0.72, 8, 26);
  const bodyWidth = width * 0.66;
  const bodyHeight = height * 0.62;
  const top = (height - bodyHeight) / 2;
  const primitives: PosterPrimitive[] = [
    rect(0, top, bodyWidth, bodyHeight, { radius: bodyHeight * 0.12, stroke: true }),
    rect(bodyWidth, top + bodyHeight * 0.28, bodyHeight * 0.16, bodyHeight * 0.44, { fill: "ink" }),
  ];
  const pct = clamp(Number.parseInt(cell(lines, 0), 10) || 60, 5, 100);
  const segments = 5;
  const filled = Math.max(1, Math.round((pct / 100) * segments));
  const pad = bodyHeight * 0.14;
  const segmentWidth = (bodyWidth - pad * (segments + 1)) / segments;
  for (let index = 0; index < segments; index += 1) {
    primitives.push(
      rect(pad + index * (segmentWidth + pad), top + pad, segmentWidth, bodyHeight - pad * 2, {
        fill: index < filled ? "ink" : "none",
        stroke: index >= filled,
      }),
    );
  }
  primitives.push(text(width, height / 2 + size * 0.36, `${pct}%`, size, { align: "right", weight: 700 }));
  return primitives;
}

function buildConstellation(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, rng, width } = context;
  const size = clamp(smallType(context) * 0.62, 8, 24);
  const stars: [number, number][] = [];
  for (let index = 0; index < 6; index += 1) {
    stars.push([
      width * (0.08 + (index / 6) * 0.8 + rng() * 0.08),
      height * (0.14 + rng() * 0.64),
    ]);
  }
  const primitives: PosterPrimitive[] = [polyline(stars, { width: 0.9 })];
  stars.forEach(([x, y], index) => {
    const major = index === 2;
    primitives.push(circle(x, y, size * (major ? 0.34 : 0.18), { fill: "ink" }));
    if (major) {
      primitives.push(line(x - size * 0.8, y, x - size * 0.5, y));
      primitives.push(line(x + size * 0.5, y, x + size * 0.8, y));
      primitives.push(line(x, y - size * 0.8, x, y - size * 0.5));
      primitives.push(line(x, y + size * 0.5, x, y + size * 0.8));
    }
  });
  const code = cell(lines, 0) || "LYR-04";
  const anchor = stars[2] ?? [width / 2, height / 2];
  primitives.push(text(anchor[0] + size, anchor[1] - size * 0.8, code, size, { letterSpacing: size * 0.1 }));
  return primitives;
}

function buildPostmark(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, rng, width } = context;
  const size = smallType(context) * 0.66;
  const radius = Math.min(height * 0.42, width * 0.26);
  const cx = radius * 1.15;
  const cy = height / 2;
  const primitives: PosterPrimitive[] = [
    circle(cx, cy, radius, { stroke: true }),
    circle(cx, cy, radius * 0.74, { stroke: true }),
  ];
  const [city = "OSLO", year = "2025"] = lines[0]?.cells ?? [];
  primitives.push(text(cx, cy - size * 0.25, city, size * 0.82, { align: "center", letterSpacing: size * 0.16, weight: 700 }));
  primitives.push(text(cx, cy + size, year, size * 0.72, { align: "center", letterSpacing: size * 0.1 }));
  for (let wave = 0; wave < 3; wave += 1) {
    const y = cy - radius * 0.5 + wave * radius * 0.5;
    const points: [number, number][] = [];
    for (let step = 0; step <= 16; step += 1) {
      const x = cx + radius * 1.3 + (step / 16) * (width - cx - radius * 1.5);
      points.push([x, y + Math.sin(step * 1.1 + rng() * 0.4) * size * 0.4]);
    }
    primitives.push(polyline(points));
  }
  return primitives;
}

function buildMatrix(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const size = smallType(context) * 0.86;
  const arm = width * 0.07;
  const primitives: PosterPrimitive[] = [
    polyline([[arm, 0], [0, 0], [0, height], [arm, height]], { width: 1.6 }),
    polyline([[width - arm, 0], [width, 0], [width, height], [width - arm, height]], { width: 1.6 }),
  ];
  const rows = lines.filter((entry) => !entry.divider).slice(0, 3);
  const fallback = [["1", "0", "4"], ["2", "7", "1"], ["5", "3", "9"]];
  const grid = rows.length > 0 ? rows.map((entry) => entry.cells) : fallback;
  grid.forEach((cells, rowIndex) => {
    cells.slice(0, 3).forEach((value, columnIndex) => {
      primitives.push(
        text(
          width * (0.26 + columnIndex * 0.24),
          height * ((rowIndex + 0.5) / grid.length) + size * 0.34,
          value,
          size,
          { align: "center" },
        ),
      );
    });
  });
  return primitives;
}

function buildGantt(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, rng, width } = context;
  const size = clamp(smallType(context) * 0.6, 8, 22);
  const rows = lines.filter((entry) => !entry.divider).slice(0, 4);
  const fallback = [["INTAKE"], ["PROCESS"], ["VERIFY"], ["SHIP"]];
  const list = rows.length > 0 ? rows : fallback.map((cells) => ({ cells, divider: false }));
  const rowHeight = height / list.length;
  const chartX = width * 0.34;
  const primitives: PosterPrimitive[] = [line(chartX, 0, chartX, height)];
  list.forEach((entry, index) => {
    const y = index * rowHeight;
    const start = chartX + (width - chartX) * (0.04 + rng() * 0.3);
    const duration = (width - start) * (0.25 + rng() * 0.55);
    primitives.push(text(0, y + rowHeight / 2 + size * 0.34, entry.cells[0] ?? "", size, { letterSpacing: size * 0.06 }));
    primitives.push(
      rect(start, y + rowHeight * 0.3, duration, rowHeight * 0.4, {
        fill: index % 2 === 0 ? "ink" : "none",
        stroke: index % 2 !== 0,
      }),
    );
  });
  const today = chartX + (width - chartX) * 0.56;
  for (let dash = 0; dash < 8; dash += 1) {
    primitives.push(line(today, (height / 8) * dash + height * 0.02, today, (height / 8) * dash + height * 0.08));
  }
  return primitives;
}

function buildReticle(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const size = clamp(smallType(context) * 0.6, 8, 22);
  const cx = width / 2;
  const cy = height / 2;
  const primitives: PosterPrimitive[] = [
    line(0, cy, width, cy),
    line(cx, 0, cx, height),
    circle(cx, cy, Math.min(width, height) * 0.05, { stroke: true }),
  ];
  const dotStep = Math.min(width, height) * 0.12;
  for (let index = 1; index <= 3; index += 1) {
    primitives.push(circle(cx + dotStep * index, cy, size * 0.14, { fill: "ink" }));
    primitives.push(circle(cx - dotStep * index, cy, size * 0.14, { fill: "ink" }));
    primitives.push(circle(cx, cy + dotStep * index, size * 0.14, { fill: "ink" }));
    primitives.push(circle(cx, cy - dotStep * index, size * 0.14, { fill: "ink" }));
  }
  const post = Math.min(width, height) * 0.08;
  primitives.push(line(0, cy - post, 0, cy + post, 1.5));
  primitives.push(line(width, cy - post, width, cy + post, 1.5));
  primitives.push(line(cx - post, 0, cx + post, 0, 1.5));
  primitives.push(line(cx - post, height, cx + post, height, 1.5));
  primitives.push(text(width, height - size * 0.4, cell(lines, 0) || "MIL 3.4", size, { align: "right" }));
  return primitives;
}

function buildNotation(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, rng, width } = context;
  const size = clamp(smallType(context) * 0.62, 8, 24);
  const staffTop = height * 0.3;
  const staffHeight = height * 0.44;
  const gap = staffHeight / 4;
  const primitives: PosterPrimitive[] = [];
  for (let staff = 0; staff < 5; staff += 1) {
    primitives.push(line(0, staffTop + staff * gap, width, staffTop + staff * gap));
  }
  primitives.push(line(0, staffTop, 0, staffTop + staffHeight, 1.4));
  primitives.push(line(width, staffTop, width, staffTop + staffHeight, 1.4));
  const notes = 6;
  for (let index = 0; index < notes; index += 1) {
    const x = width * (0.12 + (index / notes) * 0.76);
    const pitch = Math.floor(rng() * 9);
    const y = staffTop + staffHeight - (pitch / 8) * staffHeight;
    primitives.push(polyline(arcPoints(x, y, gap * 0.42, 0, Math.PI * 2, 12), { closed: true, fill: "ink" }));
    primitives.push(line(x + gap * 0.42, y, x + gap * 0.42, y - gap * 2.2, 1.2));
  }
  primitives.push(text(width, staffTop - size * 0.6, cell(lines, 0) || "OP. 12", size, { align: "right", weight: 700 }));
  return primitives;
}

function buildHelix(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const size = smallType(context) * 0.9;
  const top = size * 0.6;
  const bottom = height - size * 1.9;
  const cx = width / 2;
  const amplitude = width * 0.34;
  const turns = 2.5;
  const strandA: [number, number][] = [];
  const strandB: [number, number][] = [];
  const steps = 44;
  for (let step = 0; step <= steps; step += 1) {
    const y = top + ((bottom - top) * step) / steps;
    const angle = (step / steps) * Math.PI * 2 * turns;
    strandA.push([cx + Math.sin(angle) * amplitude, y]);
    strandB.push([cx + Math.sin(angle + Math.PI) * amplitude, y]);
  }
  const primitives: PosterPrimitive[] = [
    polyline(strandA, { width: 1.5 }),
    polyline(strandB, { width: 1.5 }),
  ];
  for (let rung = 0; rung <= 10; rung += 1) {
    const step = Math.round((rung / 10) * steps);
    const a = strandA[step];
    const b = strandB[step];
    if (a && b) {
      primitives.push(line(a[0], a[1], b[0], b[1]));
    }
  }
  primitives.push(text(cx, height, cell(lines, 0) || "GC 52%", size * 0.72, { align: "center", letterSpacing: size * 0.1 }));
  return primitives;
}

export const set5Builders = {
  battery: buildBattery,
  circuit: buildCircuit,
  constellation: buildConstellation,
  "donut-gauge": buildDonutGauge,
  equalizer: buildEqualizer,
  gantt: buildGantt,
  helix: buildHelix,
  histogram: buildHistogram,
  "iso-cube": buildIsoCube,
  level: buildLevel,
  matrix: buildMatrix,
  notation: buildNotation,
  postmark: buildPostmark,
  protractor: buildProtractor,
  "punch-card": buildPunchCard,
  reticle: buildReticle,
  "stamp-frame": buildStampFrame,
  tally: buildTally,
  "test-pattern": buildTestPattern,
  thermometer: buildThermometer,
  ticket: buildTicket,
} satisfies Record<string, (context: TemplateRenderContext) => PosterPrimitive[]>;
