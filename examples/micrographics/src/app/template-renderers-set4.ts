import type { PosterPrimitive } from "./poster-types";
import { drawPackGlyph } from "./template-glyphs";
import {
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

function buildCompass(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const radius = Math.min(width, height) * 0.36;
  const cx = width * 0.42;
  const cy = height / 2;
  const size = smallType(context) * 0.7;
  const primitives: PosterPrimitive[] = [circle(cx, cy, radius, { stroke: true })];
  for (let tick = 0; tick < 8; tick += 1) {
    const angle = (tick / 8) * Math.PI * 2;
    const inner = tick % 2 === 0 ? radius * 0.82 : radius * 0.9;
    primitives.push(
      line(
        cx + Math.cos(angle) * inner,
        cy + Math.sin(angle) * inner,
        cx + Math.cos(angle) * radius,
        cy + Math.sin(angle) * radius,
      ),
    );
  }
  primitives.push(
    polyline(
      [
        [cx, cy - radius * 0.66],
        [cx + radius * 0.16, cy],
        [cx, cy + radius * 0.2],
        [cx - radius * 0.16, cy],
      ],
      { closed: true, fill: "ink" },
    ),
  );
  primitives.push(circle(cx, cy, radius * 0.06, { fill: "paper" }));
  primitives.push(
    text(cx, cy - radius * 1.18, "N", size, { align: "center", weight: 700 }),
  );
  const bearing = cell(lines, 0) || "N 42°";
  primitives.push(
    text(Math.min(cx + radius * 1.3, width - monoWidth(bearing, size)), cy + size * 0.35, bearing, size, {
      weight: 700,
    }),
  );
  return primitives;
}

function buildFoldMarks(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const cut = cell(lines, 0) || "CUT";
  const fold = cell(lines, 0, 1) || "FOLD";
  const size = clamp(height * 0.26 * context.typeScale, 8, 24);
  const foldY = height * 0.3;
  const cutY = height * 0.78;
  const dash = size * 1.1;
  const primitives: PosterPrimitive[] = [];
  const labelSpace = Math.max(monoWidth(fold, size), monoWidth(cut, size)) + size;
  for (let x = 0; x < width - labelSpace; x += dash * 1.8) {
    primitives.push(
      line(x, foldY, Math.min(x + dash, width - labelSpace), foldY, 1.4),
    );
  }
  primitives.push(line(0, cutY, width - labelSpace, cutY, 1.6));
  primitives.push(
    polyline(
      [
        [0, cutY - size * 0.5],
        [size * 0.9, cutY],
        [0, cutY + size * 0.5],
      ],
      { closed: true, fill: "ink" },
    ),
  );
  primitives.push(text(width, foldY + size * 0.36, fold, size, { align: "right", letterSpacing: size * 0.14 }));
  primitives.push(text(width, cutY + size * 0.36, cut, size, { align: "right", letterSpacing: size * 0.14 }));
  return primitives;
}

function buildFilmStrip(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, rng, width } = context;
  const hole = height * 0.08;
  const primitives: PosterPrimitive[] = [rect(0, 0, width, height, { stroke: true })];
  for (let x = hole; x < width - hole * 1.6; x += hole * 2.2) {
    primitives.push(
      rect(x, hole * 0.7, hole * 1.1, hole, { fill: "ink", radius: hole * 0.3 }),
    );
    primitives.push(
      rect(x, height - hole * 1.7, hole * 1.1, hole, { fill: "ink", radius: hole * 0.3 }),
    );
  }
  const frames = 3;
  const frameTop = hole * 2.4;
  const frameBottom = height - hole * 2.4;
  const size = clamp((frameBottom - frameTop) * 0.24, 7, 20);
  const start = Number.parseInt(cell(lines, 0), 10) || 22 + Math.floor(rng() * 40);
  for (let frame = 0; frame <= frames; frame += 1) {
    const x = (frame / frames) * (width * 0.94) + width * 0.03;
    if (frame < frames) {
      primitives.push(
        text(x + size * 0.5, frameBottom - size * 0.4, String(start + frame), size),
      );
    }
    primitives.push(line(x, frameTop, x, frameBottom, 1.2));
  }
  primitives.push(line(width * 0.03, frameTop, width * 0.97, frameTop, 1.2));
  primitives.push(line(width * 0.03, frameBottom, width * 0.97, frameBottom, 1.2));
  return primitives;
}

function buildViewfinder(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const arm = Math.min(width, height) * 0.14;
  const size = smallType(context) * 0.62;
  const primitives: PosterPrimitive[] = [
    polyline([[0, arm], [0, 0], [arm, 0]], { width: 1.4 }),
    polyline([[width - arm, 0], [width, 0], [width, arm]], { width: 1.4 }),
    polyline([[width, height - arm], [width, height], [width - arm, height]], { width: 1.4 }),
    polyline([[arm, height], [0, height], [0, height - arm]], { width: 1.4 }),
    line(width / 3, 0, width / 3, height, 0.5),
    line((width * 2) / 3, 0, (width * 2) / 3, height, 0.5),
    line(0, height / 3, width, height / 3, 0.5),
    line(0, (height * 2) / 3, width, (height * 2) / 3, 0.5),
    line(width / 2 - arm * 0.5, height / 2, width / 2 + arm * 0.5, height / 2),
    line(width / 2, height / 2 - arm * 0.5, width / 2, height / 2 + arm * 0.5),
  ];
  const label = cell(lines, 0) || "REC";
  const value = cell(lines, 0, 1) || "00:12";
  primitives.push(circle(width - arm * 1.5, arm * 0.85, size * 0.4, { fill: "ink" }));
  primitives.push(
    text(width - arm * 1.5 - size * 0.9, arm * 0.85 + size * 0.36, label, size, {
      align: "right",
      letterSpacing: size * 0.14,
      weight: 700,
    }),
  );
  primitives.push(text(arm * 0.7, height - arm * 0.6, value, size));
  return primitives;
}

function buildScaleLadder(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, rng, width } = context;
  const low = Number.parseInt(cell(lines, 0), 10) || 0;
  const high = Number.parseInt(cell(lines, 0, 1), 10) || 100;
  const unit = cell(lines, 0, 2) || "M";
  const size = clamp(width * 0.24 * context.typeScale, 7, 20);
  const axis = width * 0.32;
  const primitives: PosterPrimitive[] = [line(axis, 0, axis, height, 1.6)];
  const steps = 10;
  for (let step = 0; step <= steps; step += 1) {
    const y = (step / steps) * height;
    const major = step % 5 === 0;
    primitives.push(line(axis, y, axis + (major ? size * 1.3 : size * 0.7), y));
    if (major) {
      const value = Math.round(high - ((high - low) * step) / steps);
      primitives.push(
        text(axis + size * 1.7, clamp(y + size * 0.36, size * 0.8, height), String(value), size),
      );
    }
  }
  const markerY = height * (0.2 + rng() * 0.6);
  primitives.push(
    polyline(
      [
        [axis - size * 1.4, markerY - size * 0.5],
        [axis - size * 0.3, markerY],
        [axis - size * 1.4, markerY + size * 0.5],
      ],
      { closed: true, fill: "ink" },
    ),
  );
  primitives.push(
    text(axis - size * 0.7, size, unit, size * 0.9, { align: "right", weight: 700 }),
  );
  return primitives;
}

function buildShippingTag(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const notch = Math.min(width, height) * 0.2;
  const size = smallType(context) * 0.66;
  const primitives: PosterPrimitive[] = [
    polyline(
      [
        [notch, 0],
        [width, 0],
        [width, height],
        [notch, height],
        [0, height / 2],
      ],
      { closed: true, width: 1.6 },
    ),
    circle(notch * 0.9, height / 2, notch * 0.16, { stroke: true }),
    line(notch * 1.6, height * 0.52, width - size, height * 0.52, 0.8),
  ];
  const from = cell(lines, 0, 1) || "OSL";
  const to = cell(lines, 1, 1) || "TYO";
  primitives.push(
    text(notch * 1.6, height * 0.3, cell(lines, 0) || "FROM", size * 0.72, {
      letterSpacing: size * 0.12,
    }),
  );
  primitives.push(text(width - size, height * 0.42, from, size * 1.25, { align: "right", weight: 700 }));
  primitives.push(
    text(notch * 1.6, height * 0.72, cell(lines, 1) || "TO", size * 0.72, {
      letterSpacing: size * 0.12,
    }),
  );
  primitives.push(text(width - size, height * 0.88, to, size * 1.25, { align: "right", weight: 700 }));
  const icon = size * 1.15;
  let iconX = notch * 1.6;
  for (const id of ["fragile-box", "updown-box", "umbrella"]) {
    iconX += drawPackGlyph(primitives, id, iconX, height * 0.78, icon) + icon * 0.35;
  }
  return primitives;
}

function buildMapScale(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const ratio = cell(lines, 0) || "1:200";
  const distance = cell(lines, 0, 1) || "100 M";
  const size = clamp(height * 0.34 * context.typeScale, 8, 28);
  const barTop = height * 0.42;
  const barHeight = height * 0.3;
  const barStart = monoWidth(ratio, size) + size;
  const barEnd = width - monoWidth(distance, size * 0.8) - size;
  const segments = 4;
  const segmentWidth = Math.max(10, (barEnd - barStart) / segments);
  const primitives: PosterPrimitive[] = [
    text(0, barTop + barHeight, ratio, size, { weight: 700 }),
  ];
  for (let segment = 0; segment < segments; segment += 1) {
    primitives.push(
      rect(barStart + segment * segmentWidth, barTop, segmentWidth, barHeight, {
        fill: segment % 2 === 0 ? "ink" : "none",
        stroke: true,
      }),
    );
  }
  primitives.push(text(barStart, barTop - size * 0.4, "0", size * 0.8));
  primitives.push(
    text(width, barTop + barHeight, distance, size * 0.8, { align: "right" }),
  );
  return primitives;
}

function buildKeypad(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, width } = context;
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];
  const columns = 3;
  const rows = 4;
  const gap = Math.min(width, height) * 0.04;
  const keyWidth = (width - gap * (columns - 1)) / columns;
  const keyHeight = (height - gap * (rows - 1)) / rows;
  const size = Math.min(keyWidth, keyHeight) * 0.44;
  const primitives: PosterPrimitive[] = [];
  keys.forEach((key, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = column * (keyWidth + gap);
    const y = row * (keyHeight + gap);
    const inverted = key === "5";
    primitives.push(
      rect(x, y, keyWidth, keyHeight, {
        fill: inverted ? "ink" : "none",
        radius: Math.min(keyWidth, keyHeight) * 0.2,
        stroke: !inverted,
      }),
    );
    primitives.push(
      text(x + keyWidth / 2, y + keyHeight / 2 + size * 0.36, key, size, {
        align: "center",
        fill: inverted ? "paper" : "ink",
        weight: 700,
      }),
    );
  });
  return primitives;
}

function buildContour(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, rng, width } = context;
  const cx = width * 0.5;
  const cy = height * 0.52;
  const size = smallType(context) * 0.6;
  const segments = 18;
  const noise: number[] = [];
  for (let step = 0; step < segments; step += 1) {
    noise.push(0.75 + rng() * 0.5);
  }
  const primitives: PosterPrimitive[] = [];
  for (const factor of [0.32, 0.52, 0.74, 0.98]) {
    const points: [number, number][] = [];
    for (let step = 0; step <= segments; step += 1) {
      const angle = (step / segments) * Math.PI * 2;
      const wobble = noise[step % segments] ?? 1;
      points.push([
        cx + Math.cos(angle) * width * 0.46 * factor * wobble * 0.9,
        cy + Math.sin(angle) * height * 0.42 * factor * wobble,
      ]);
    }
    primitives.push(polyline(points, { closed: true, width: 1.2 }));
  }
  primitives.push(circle(cx, cy, size * 0.3, { fill: "ink" }));
  const label = cell(lines, 0) || "412 M";
  primitives.push(text(cx + size, cy - size * 0.6, label, size, { weight: 700 }));
  return primitives;
}

function buildDateStrip(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, rng, width } = context;
  const startDay = Number.parseInt(cell(lines, 0), 10) || 9 + Math.floor(rng() * 14);
  const cells = 7;
  const cellWidth = width / cells;
  const size = clamp(Math.min(height * 0.4, cellWidth * 0.4) * context.typeScale, 8, 30);
  const selected = Math.floor(rng() * cells);
  const primitives: PosterPrimitive[] = [rect(0, 0, width, height, { stroke: true })];
  for (let index = 0; index < cells; index += 1) {
    const x = index * cellWidth;
    if (index > 0) {
      primitives.push(line(x, 0, x, height));
    }
    if (index === selected) {
      primitives.push(rect(x, 0, cellWidth, height, { fill: "ink" }));
    }
    primitives.push(
      text(x + cellWidth / 2, height / 2 + size * 0.36, String(startDay + index), size, {
        align: "center",
        fill: index === selected ? "paper" : "ink",
        weight: index === selected ? 700 : 500,
      }),
    );
  }
  return primitives;
}

export const set4Builders = {
  compass: buildCompass,
  contour: buildContour,
  "date-strip": buildDateStrip,
  "film-strip": buildFilmStrip,
  "fold-marks": buildFoldMarks,
  keypad: buildKeypad,
  "map-scale": buildMapScale,
  "scale-ladder": buildScaleLadder,
  "shipping-tag": buildShippingTag,
  viewfinder: buildViewfinder,
} satisfies Record<string, (context: TemplateRenderContext) => PosterPrimitive[]>;
