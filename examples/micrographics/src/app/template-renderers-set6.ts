import type { PosterPrimitive } from "./poster-types";
import {
  arcPoints,
  cell,
  circle,
  clamp,
  line,
  polyline,
  rect,
  smallType,
  text,
  type TemplateRenderContext,
} from "./template-primitives";

function buildPipeline(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const size = clamp(smallType(context) * 0.66, 8, 24);
  const labels = (lines[0]?.cells ?? []).filter((value) => value.length > 0);
  const list = labels.length >= 2 ? labels.slice(0, 4) : ["IN", "PROC", "OUT"];
  const cy = height * 0.4;
  const radius = Math.min(height * 0.26, (width / list.length) * 0.2);
  const primitives: PosterPrimitive[] = [];
  list.forEach((label, index) => {
    const cx = width * ((index + 0.5) / list.length);
    const last = index === list.length - 1;
    primitives.push(circle(cx, cy, radius, { fill: last ? "ink" : "none", stroke: !last }));
    primitives.push(text(cx, height - size * 0.2, label, size, { align: "center", letterSpacing: size * 0.1 }));
    if (index > 0) {
      const previous = width * ((index - 0.5) / list.length) + radius;
      const arrowX = cx - radius;
      primitives.push(line(previous + size * 0.3, cy, arrowX - size * 0.3, cy, 1.4));
      primitives.push(
        polyline([
          [arrowX - size * 0.9, cy - size * 0.35],
          [arrowX - size * 0.3, cy],
          [arrowX - size * 0.9, cy + size * 0.35],
        ]),
      );
    }
  });
  return primitives;
}

function buildScope(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, rng, width } = context;
  const size = clamp(smallType(context) * 0.6, 8, 24);
  const frameTop = size * 1.6;
  const frameHeight = height - frameTop;
  const primitives: PosterPrimitive[] = [rect(0, frameTop, width, frameHeight, { stroke: true })];
  for (let column = 1; column < 6; column += 1) {
    const x = (column / 6) * width;
    for (let dash = 0; dash < 10; dash += 1) {
      primitives.push(line(x, frameTop + (frameHeight / 10) * dash, x, frameTop + (frameHeight / 10) * dash + frameHeight * 0.03));
    }
  }
  const middle = frameTop + frameHeight / 2;
  const points: [number, number][] = [];
  const phase = rng() * Math.PI * 2;
  for (let step = 0; step <= 48; step += 1) {
    const x = (step / 48) * width;
    points.push([x, middle + Math.sin(phase + (step / 48) * Math.PI * 4) * frameHeight * 0.32]);
  }
  primitives.push(polyline(points, { width: 1.5 }));
  const trigger = frameTop + frameHeight * 0.26;
  for (let dash = 0; dash < 9; dash += 1) {
    primitives.push(line((width / 9) * dash + width * 0.015, trigger, (width / 9) * dash + width * 0.06, trigger));
  }
  primitives.push(text(0, size, cell(lines, 0) || "CH1", size, { letterSpacing: size * 0.14, weight: 700 }));
  primitives.push(text(width, size, cell(lines, 0, 1) || "50 HZ", size, { align: "right" }));
  return primitives;
}

function buildHexGrid(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, rng, width } = context;
  const size = clamp(smallType(context) * 0.62, 8, 24);
  const radius = Math.min(width, height) * 0.14;
  const primitives: PosterPrimitive[] = [];
  const hex = (cx: number, cy: number, filled: boolean): void => {
    const points: [number, number][] = [];
    for (let corner = 0; corner < 6; corner += 1) {
      const angle = (corner / 6) * Math.PI * 2 + Math.PI / 6;
      points.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]);
    }
    primitives.push(polyline(points, { closed: true, fill: filled ? "ink" : "none" }));
  };
  const columns = 3;
  const rows = 2;
  const filledColumn = Math.floor(rng() * columns);
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const cx = width * 0.18 + column * radius * 1.75 + (row % 2) * radius * 0.87;
      const cy = height * 0.3 + row * radius * 1.52;
      hex(cx, cy, row === 1 && column === filledColumn);
    }
  }
  primitives.push(text(width, height - size * 0.3, cell(lines, 0) || "HX-08", size, { align: "right", letterSpacing: size * 0.12 }));
  return primitives;
}

function buildClockFace(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const size = smallType(context) * 0.66;
  const radius = Math.min(width, height) * 0.38;
  const cx = width / 2;
  const cy = height * 0.44;
  const primitives: PosterPrimitive[] = [circle(cx, cy, radius, { stroke: true })];
  for (let tick = 0; tick < 12; tick += 1) {
    const angle = (tick / 12) * Math.PI * 2;
    const inner = radius * (tick % 3 === 0 ? 0.82 : 0.9);
    primitives.push(
      line(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner, cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius),
    );
  }
  const value = cell(lines, 0) || "16:42";
  const [hoursRaw = "16", minutesRaw = "42"] = value.split(":");
  const hours = Number.parseInt(hoursRaw, 10) % 12;
  const minutes = Number.parseInt(minutesRaw, 10) % 60;
  const minuteAngle = (minutes / 60) * Math.PI * 2 - Math.PI / 2;
  const hourAngle = ((hours + minutes / 60) / 12) * Math.PI * 2 - Math.PI / 2;
  primitives.push(line(cx, cy, cx + Math.cos(hourAngle) * radius * 0.5, cy + Math.sin(hourAngle) * radius * 0.5, 1.5));
  primitives.push(line(cx, cy, cx + Math.cos(minuteAngle) * radius * 0.74, cy + Math.sin(minuteAngle) * radius * 0.74, 1.3));
  primitives.push(circle(cx, cy, size * 0.18, { fill: "ink" }));
  primitives.push(text(cx, height, value, size * 0.78, { align: "center", letterSpacing: size * 0.12 }));
  return primitives;
}

function buildCalendar(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const size = smallType(context) * 0.6;
  const headerHeight = height * 0.18;
  const columns = 7;
  const rows = 5;
  const cellWidth = width / columns;
  const cellHeight = (height - headerHeight) / rows;
  const primitives: PosterPrimitive[] = [
    rect(0, 0, width, height, { stroke: true }),
    rect(0, 0, width, headerHeight, { fill: "ink" }),
  ];
  for (let row = 1; row < rows; row += 1) {
    primitives.push(line(0, headerHeight + row * cellHeight, width, headerHeight + row * cellHeight));
  }
  for (let column = 1; column < columns; column += 1) {
    primitives.push(line(column * cellWidth, headerHeight, column * cellWidth, height));
  }
  const day = clamp(Number.parseInt(cell(lines, 0), 10) || 17, 1, 31);
  const index = day + 2;
  const column = index % columns;
  const row = Math.floor(index / columns) % rows;
  primitives.push(rect(column * cellWidth, headerHeight + row * cellHeight, cellWidth, cellHeight, { fill: "ink" }));
  primitives.push(
    text(column * cellWidth + cellWidth / 2, headerHeight + row * cellHeight + cellHeight / 2 + size * 0.36, String(day), size, {
      align: "center",
      fill: "paper",
      weight: 700,
    }),
  );
  return primitives;
}

function buildCallout(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, rng, width } = context;
  const size = clamp(smallType(context) * 0.62, 8, 24);
  const rows = lines.filter((entry) => !entry.divider).slice(0, 3);
  const fallback = [["A", "ALIGN"], ["B", "TORQUE"], ["C", "SEAL"]];
  const list = rows.length > 0 ? rows.map((entry) => entry.cells) : fallback;
  const primitives: PosterPrimitive[] = [];
  list.forEach((cells, index) => {
    const dotX = width * (0.1 + rng() * 0.3);
    const dotY = height * (0.16 + index * 0.3 + rng() * 0.1);
    const labelY = height * (0.18 + index * 0.3);
    const elbowX = width * 0.58;
    primitives.push(circle(dotX, dotY, size * 0.24, { fill: "ink" }));
    primitives.push(polyline([[dotX, dotY], [elbowX, labelY], [width * 0.72, labelY]]));
    const [marker = "", label = ""] = cells;
    primitives.push(text(width * 0.75, labelY + size * 0.34, marker, size, { weight: 700 }));
    primitives.push(text(width * 0.75 + size * 1.4, labelY + size * 0.34, label, size, { letterSpacing: size * 0.06 }));
  });
  return primitives;
}

function buildChevronFlow(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const size = clamp(smallType(context) * 0.66, 8, 26);
  const label = cell(lines, 0) || "FLOW";
  const chevrons = 6;
  const filled = 3;
  const bandHeight = height - size * 1.8;
  const step = width / (chevrons + 1);
  const primitives: PosterPrimitive[] = [];
  for (let index = 0; index < chevrons; index += 1) {
    const x = index * step;
    const points: [number, number][] = [
      [x, 0],
      [x + step * 0.62, 0],
      [x + step, bandHeight / 2],
      [x + step * 0.62, bandHeight],
      [x, bandHeight],
      [x + step * 0.38, bandHeight / 2],
    ];
    primitives.push(polyline(points, { closed: true, fill: index < filled ? "ink" : "none" }));
  }
  primitives.push(text(0, height, label, size, { letterSpacing: size * 0.2, weight: 700 }));
  return primitives;
}

function buildGridCell(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const size = clamp(smallType(context) * 0.62, 8, 24);
  const columns = 8;
  const rows = 6;
  const frameHeight = height - size * 1.8;
  const cellWidth = width / columns;
  const cellHeight = frameHeight / rows;
  const primitives: PosterPrimitive[] = [rect(0, 0, width, frameHeight, { stroke: true })];
  for (let column = 1; column < columns; column += 1) {
    primitives.push(line(column * cellWidth, 0, column * cellWidth, frameHeight, 0.6));
  }
  for (let row = 1; row < rows; row += 1) {
    primitives.push(line(0, row * cellHeight, width, row * cellHeight, 0.6));
  }
  const reference = cell(lines, 0) || "C3";
  const column = clamp((reference.charCodeAt(0) || 67) - 65, 0, columns - 1);
  const row = clamp(Number.parseInt(reference.slice(1), 10) || 3, 1, rows) - 1;
  primitives.push(rect(column * cellWidth, row * cellHeight, cellWidth, cellHeight, { fill: "ink" }));
  primitives.push(line(column * cellWidth + cellWidth / 2, 0, column * cellWidth + cellWidth / 2, cellHeight * 0.3, 1.6));
  primitives.push(line(0, row * cellHeight + cellHeight / 2, cellWidth * 0.3, row * cellHeight + cellHeight / 2, 1.6));
  primitives.push(text(width, height, reference, size, { align: "right", weight: 700 }));
  return primitives;
}

function buildFader(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const size = clamp(smallType(context) * 0.66, 8, 26);
  const trackY = height * 0.4;
  const label = cell(lines, 0) || "GAIN";
  const value = clamp(Number.parseInt(cell(lines, 0, 1), 10) || 64, 0, 100);
  const primitives: PosterPrimitive[] = [line(0, trackY, width, trackY, 1.5)];
  for (let tick = 0; tick <= 10; tick += 1) {
    const x = (tick / 10) * width;
    primitives.push(line(x, trackY - size * (tick % 5 === 0 ? 0.5 : 0.3), x, trackY));
  }
  const handleX = (value / 100) * width;
  primitives.push(rect(handleX - size * 0.4, trackY - size * 0.75, size * 0.8, size * 1.5, { fill: "ink" }));
  primitives.push(text(0, height, label, size, { letterSpacing: size * 0.16, weight: 700 }));
  primitives.push(text(width, height, String(value), size, { align: "right" }));
  return primitives;
}

function buildSwitchBank(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const size = clamp(smallType(context) * 0.6, 8, 22);
  const states = (cell(lines, 0, 1) || "1 0 1 1").split(/\s+/).slice(0, 4);
  const header = cell(lines, 0) || "SW";
  const slotHeight = height * 0.52;
  const top = size * 1.5;
  const primitives: PosterPrimitive[] = [
    text(0, size, header, size, { letterSpacing: size * 0.16, weight: 700 }),
  ];
  states.forEach((state, index) => {
    const slotWidth = width / states.length;
    const x = index * slotWidth + slotWidth * 0.28;
    const slot = slotWidth * 0.44;
    const on = state !== "0";
    primitives.push(rect(x, top, slot, slotHeight, { radius: slot * 0.5, stroke: true }));
    primitives.push(
      rect(x + slot * 0.14, top + (on ? slot * 0.14 : slotHeight - slot * 0.86), slot * 0.72, slot * 0.72, {
        fill: "ink",
      }),
    );
    primitives.push(
      text(x + slot / 2, height, on ? "1" : "0", size * 0.86, { align: "center" }),
    );
  });
  return primitives;
}

function buildTerminal(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const size = clamp(smallType(context) * 0.68, 8, 26);
  const barHeight = size * 1.3;
  const primitives: PosterPrimitive[] = [
    rect(0, 0, width, height, { stroke: true }),
    line(0, barHeight, width, barHeight),
    circle(size * 0.7, barHeight / 2, size * 0.18, { fill: "ink" }),
    circle(size * 1.5, barHeight / 2, size * 0.18, { stroke: true }),
  ];
  const rows = lines.filter((entry) => !entry.divider).slice(0, 4);
  const fallback = [["> run render"], ["> sync --all"], ["> done"]];
  const list = rows.length > 0 ? rows.map((entry) => entry.cells.join(" ")) : fallback.map((cells) => cells[0] ?? "");
  list.forEach((value, index) => {
    primitives.push(text(size * 0.7, barHeight + size * 1.5 * (index + 1), value, size, { letterSpacing: size * 0.04 }));
  });
  const lastY = barHeight + size * 1.5 * list.length;
  const lastWidth = (list.at(-1)?.length ?? 4) * size * 0.62;
  primitives.push(rect(size * 0.7 + lastWidth + size * 0.4, lastY - size * 0.85, size * 0.55, size, { fill: "ink" }));
  return primitives;
}

function buildSunPath(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const size = clamp(smallType(context) * 0.62, 8, 24);
  const horizon = height * 0.74;
  const radius = Math.min(width * 0.42, horizon * 0.92);
  const cx = width / 2;
  const primitives: PosterPrimitive[] = [
    line(0, horizon, width, horizon, 1.4),
    polyline(arcPoints(cx, horizon, radius, Math.PI, Math.PI * 2)),
  ];
  for (const position of [0.22, 0.5, 0.78]) {
    const angle = Math.PI + position * Math.PI;
    const x = cx + Math.cos(angle) * radius;
    const y = horizon + Math.sin(angle) * radius;
    const major = position === 0.5;
    primitives.push(circle(x, y, size * (major ? 0.5 : 0.24), { fill: major ? "ink" : "none", stroke: !major }));
    if (major) {
      for (let ray = 0; ray < 8; ray += 1) {
        const rayAngle = (ray / 8) * Math.PI * 2;
        primitives.push(
          line(
            x + Math.cos(rayAngle) * size * 0.7,
            y + Math.sin(rayAngle) * size * 0.7,
            x + Math.cos(rayAngle) * size * 1.0,
            y + Math.sin(rayAngle) * size * 1.0,
          ),
        );
      }
    }
  }
  const [rise = "06:00", set = "21:00"] = lines[0]?.cells ?? [];
  primitives.push(text(cx - radius, horizon + size * 1.3, rise, size));
  primitives.push(text(cx + radius, horizon + size * 1.3, set, size, { align: "right" }));
  return primitives;
}

function buildMoonPhases(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const size = clamp(smallType(context) * 0.62, 8, 24);
  const bandHeight = height - size * 1.8;
  const phases = 5;
  const radius = Math.min(bandHeight * 0.42, (width / phases) * 0.34);
  const cy = bandHeight / 2;
  const primitives: PosterPrimitive[] = [];
  for (let index = 0; index < phases; index += 1) {
    const cx = width * ((index + 0.5) / phases);
    primitives.push(circle(cx, cy, radius, { stroke: true }));
    if (index === 0) {
      primitives.push(circle(cx, cy, radius * 0.92, { fill: "ink" }));
    } else if (index < phases - 1) {
      const arc = arcPoints(cx, cy, radius * 0.92, -Math.PI / 2, Math.PI / 2);
      const back =
        index === 1
          ? arcPoints(cx, cy, radius * 0.92, Math.PI / 2, -Math.PI / 2).map(
              ([x, y]): [number, number] => [cx - (x - cx) * 0.1, y],
            )
          : arcPoints(cx, cy, radius * 0.92, Math.PI / 2, -Math.PI / 2).map(
              ([x, y]): [number, number] => [cx + (cx - x) * (index === 2 ? 0.98 : 0.4), y],
            );
      primitives.push(polyline([...arc, ...back], { closed: true, fill: "ink" }));
    }
  }
  primitives.push(text(width / 2, height, cell(lines, 0) || "PHASE 3", size, { align: "center", letterSpacing: size * 0.16 }));
  return primitives;
}

function buildReceipt(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const size = smallType(context) * 0.68;
  const zig = size * 0.55;
  const teeth = 9;
  const edge = (baseY: number, direction: 1 | -1): [number, number][] => {
    const points: [number, number][] = [];
    for (let tooth = 0; tooth <= teeth * 2; tooth += 1) {
      points.push([(tooth / (teeth * 2)) * width, baseY + (tooth % 2 === 0 ? 0 : zig * direction)]);
    }
    return points;
  };
  const primitives: PosterPrimitive[] = [
    polyline(edge(zig, -1)),
    polyline(edge(height - zig, 1)),
    line(0, zig, 0, height - zig),
    line(width, zig, width, height - zig),
  ];
  const rows = lines.filter((entry) => !entry.divider).slice(0, 4);
  const fallback = [["RENDER", "4.90"], ["SYNC", "1.20"], ["TOTAL", "6.10"]];
  const list = rows.length > 0 ? rows.map((entry) => entry.cells) : fallback;
  list.forEach((cells, index) => {
    const [key = "", value = ""] = cells;
    const y = zig + size * 1.7 * (index + 1);
    const total = index === list.length - 1;
    if (total) {
      for (let dash = 0; dash < 10; dash += 1) {
        primitives.push(line(size + (dash * (width - size * 2)) / 10, y - size * 1.1, size + (dash * (width - size * 2)) / 10 + (width - size * 2) / 22, y - size * 1.1));
      }
    }
    primitives.push(text(size, y, key, size, { letterSpacing: size * 0.08, weight: total ? 700 : 500 }));
    primitives.push(text(width - size, y, value, size, { align: "right", weight: total ? 700 : 500 }));
  });
  return primitives;
}

function buildRouteMap(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, rng, width } = context;
  const size = clamp(smallType(context) * 0.6, 8, 24);
  const frameHeight = height - size * 1.9;
  const primitives: PosterPrimitive[] = [rect(0, 0, width, frameHeight, { stroke: true })];
  const start: [number, number] = [width * 0.12, frameHeight * (0.6 + rng() * 0.2)];
  const end: [number, number] = [width * 0.86, frameHeight * (0.18 + rng() * 0.2)];
  const middle: [number, number] = [
    width * (0.4 + rng() * 0.2),
    frameHeight * (0.35 + rng() * 0.3),
  ];
  const route: [number, number][] = [];
  const steps = 22;
  for (let step = 0; step <= steps; step += 1) {
    const t = step / steps;
    const x = (1 - t) * (1 - t) * start[0] + 2 * (1 - t) * t * middle[0] + t * t * end[0];
    const y = (1 - t) * (1 - t) * start[1] + 2 * (1 - t) * t * middle[1] + t * t * end[1];
    route.push([x, y]);
  }
  for (let step = 0; step < steps; step += 2) {
    const a = route[step];
    const b = route[step + 1];
    if (a && b) {
      primitives.push(line(a[0], a[1], b[0], b[1], 1.4));
    }
  }
  primitives.push(circle(start[0], start[1], size * 0.34, { stroke: true }));
  primitives.push(circle(start[0], start[1], size * 0.12, { fill: "ink" }));
  primitives.push(rect(end[0] - size * 0.3, end[1] - size * 0.3, size * 0.6, size * 0.6, { fill: "ink" }));
  primitives.push(text(0, height, cell(lines, 0) || "OSL - TYO", size, { letterSpacing: size * 0.12 }));
  primitives.push(text(width, height, cell(lines, 0, 1) || "8 348 KM", size, { align: "right" }));
  return primitives;
}

function buildElevation(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, rng, width } = context;
  const size = clamp(smallType(context) * 0.6, 8, 24);
  const base = height - size * 1.8;
  const profile: [number, number][] = [[0, base]];
  const peaks = 6;
  let peakX = width * 0.4;
  let peakY = base;
  for (let index = 0; index <= peaks; index += 1) {
    const x = (index / peaks) * width;
    const y = base - base * (index === 3 ? 0.82 : 0.18 + rng() * 0.42);
    if (y < peakY) {
      peakY = y;
      peakX = x;
    }
    profile.push([x, y]);
  }
  profile.push([width, base]);
  const primitives: PosterPrimitive[] = [
    line(0, base, width, base, 1.5),
    polyline(profile, { width: 1.5 }),
    circle(peakX, peakY, size * 0.26, { fill: "ink" }),
  ];
  const dashes = 6;
  for (let dash = 0; dash < dashes; dash += 1) {
    const y = peakY + ((base - peakY) / dashes) * dash;
    primitives.push(line(peakX, y + size * 0.2, peakX, y + ((base - peakY) / dashes) * 0.5));
  }
  primitives.push(text(peakX + size * 0.7, peakY + size * 0.2, cell(lines, 0) || "PEAK 2 469 M", size, { weight: 700 }));
  primitives.push(text(0, height, cell(lines, 0, 1) || "PROFILE 04", size * 0.86, { letterSpacing: size * 0.14 }));
  return primitives;
}

function buildTickRing(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const size = smallType(context) * 0.8;
  const radius = Math.min(width, height) * 0.4;
  const cx = width / 2;
  const cy = height / 2;
  const primitives: PosterPrimitive[] = [];
  const ticks = 12;
  for (let tick = 0; tick < ticks; tick += 1) {
    const angle = (tick / ticks) * Math.PI * 2 - Math.PI / 2;
    const long = tick % 3 === 0;
    const inner = radius * (long ? 0.62 : 0.78);
    primitives.push(
      line(
        cx + Math.cos(angle) * inner,
        cy + Math.sin(angle) * inner,
        cx + Math.cos(angle) * radius,
        cy + Math.sin(angle) * radius,
        long ? 2.4 : 1.2,
      ),
    );
  }
  primitives.push(text(cx, cy + size * 0.36, cell(lines, 0) || "68%", size, { align: "center", weight: 700 }));
  return primitives;
}

function buildFingerprint(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, rng, width } = context;
  const size = clamp(smallType(context) * 0.62, 8, 24);
  const cx = width / 2;
  const cy = height * 0.44;
  const maxRadius = Math.min(width, height * 0.8) * 0.42;
  const primitives: PosterPrimitive[] = [circle(cx, cy, maxRadius * 0.08, { fill: "ink" })];
  for (let ring = 1; ring <= 7; ring += 1) {
    const radius = (ring / 7) * maxRadius;
    const gapStart = rng() * Math.PI * 2;
    const gapSize = 0.5 + rng() * 0.9;
    primitives.push(polyline(arcPoints(cx, cy, radius, gapStart + gapSize, gapStart + Math.PI * 2 - gapSize * 0.4)));
  }
  primitives.push(text(cx, height, cell(lines, 0) || "ID 4471", size, { align: "center", letterSpacing: size * 0.16 }));
  return primitives;
}

function buildScatter(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, rng, width } = context;
  const size = clamp(smallType(context) * 0.6, 8, 24);
  const title = cell(lines, 0) || "SAMPLE A";
  const frameTop = size * 1.6;
  const frameHeight = height - frameTop;
  const primitives: PosterPrimitive[] = [
    rect(0, frameTop, width, frameHeight, { stroke: true }),
    text(0, size, title, size, { letterSpacing: size * 0.14, weight: 700 }),
  ];
  for (let tick = 1; tick < 5; tick += 1) {
    primitives.push(line((tick / 5) * width, frameTop + frameHeight, (tick / 5) * width, frameTop + frameHeight - size * 0.4));
    primitives.push(line(0, frameTop + (tick / 5) * frameHeight, size * 0.4, frameTop + (tick / 5) * frameHeight));
  }
  for (let point = 0; point < 14; point += 1) {
    const t = point / 14;
    const x = width * (0.06 + t * 0.86 + (rng() - 0.5) * 0.06);
    const y = frameTop + frameHeight * (0.84 - t * 0.6 + (rng() - 0.5) * 0.24);
    primitives.push(circle(x, y, size * 0.2, { fill: rng() > 0.4 ? "ink" : "none", stroke: true }));
  }
  primitives.push(line(width * 0.06, frameTop + frameHeight * 0.82, width * 0.92, frameTop + frameHeight * 0.24, 0.9));
  return primitives;
}

function buildPercentBlocks(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const size = clamp(smallType(context) * 0.72, 8, 26);
  const pct = clamp(Number.parseInt(cell(lines, 0), 10) || 70, 0, 100);
  const blocks = 10;
  const filled = Math.round((pct / 100) * blocks);
  const rowWidth = width * 0.72;
  const slot = rowWidth / blocks;
  const blockHeight = Math.min(height * 0.6, slot * 1.2);
  const top = (height - blockHeight) / 2;
  const primitives: PosterPrimitive[] = [];
  for (let index = 0; index < blocks; index += 1) {
    primitives.push(
      rect(index * slot + slot * 0.1, top, slot * 0.8, blockHeight, {
        fill: index < filled ? "ink" : "none",
        stroke: index >= filled,
      }),
    );
  }
  primitives.push(text(width, height / 2 + size * 0.36, `${pct}%`, size, { align: "right", weight: 700 }));
  return primitives;
}

function buildApproval(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, rng, width } = context;
  const size = clamp(smallType(context) * 0.62, 8, 24);
  const baseline = height * 0.72;
  const primitives: PosterPrimitive[] = [
    text(0, size, cell(lines, 0) || "APPROVED", size * 0.8, { letterSpacing: size * 0.24, weight: 700 }),
    line(0, baseline, width, baseline, 1.4),
    text(0, height, cell(lines, 0, 1) || "QA-31", size * 0.72, { letterSpacing: size * 0.12 }),
    text(width, height, "X", size * 0.72, { align: "right" }),
  ];
  const scribble: [number, number][] = [];
  const steps = 26;
  for (let step = 0; step <= steps; step += 1) {
    const t = step / steps;
    const x = width * (0.08 + t * 0.6);
    const y =
      baseline -
      height * 0.08 -
      Math.sin(t * Math.PI * 3 + rng() * 0.6) * height * (0.14 + rng() * 0.1) -
      t * height * 0.04;
    scribble.push([x, y]);
  }
  primitives.push(polyline(scribble, { width: 1.3 }));
  return primitives;
}

export const set6Builders = {
  approval: buildApproval,
  calendar: buildCalendar,
  callout: buildCallout,
  "chevron-flow": buildChevronFlow,
  "clock-face": buildClockFace,
  elevation: buildElevation,
  fader: buildFader,
  fingerprint: buildFingerprint,
  "grid-cell": buildGridCell,
  "hex-grid": buildHexGrid,
  "moon-phases": buildMoonPhases,
  "percent-blocks": buildPercentBlocks,
  pipeline: buildPipeline,
  receipt: buildReceipt,
  "route-map": buildRouteMap,
  scatter: buildScatter,
  scope: buildScope,
  "sun-path": buildSunPath,
  "switch-bank": buildSwitchBank,
  terminal: buildTerminal,
  "tick-ring": buildTickRing,
} satisfies Record<string, (context: TemplateRenderContext) => PosterPrimitive[]>;
