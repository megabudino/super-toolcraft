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
  text,
  type ContentLine,
  type TemplateRenderContext,
} from "./template-primitives";

type Prims = PosterPrimitive[];

export function ellipseDot(cx: number, cy: number, rx: number, ry: number): PosterPrimitive {
  const points: [number, number][] = [];
  for (let step = 0; step <= 14; step += 1) {
    const angle = (step / 14) * Math.PI * 2;
    points.push([cx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry]);
  }
  return polyline(points, { closed: true, fill: "ink" });
}

export function tagPill(prims: Prims, x: number, y: number, label: string, size: number): number {
  const width = monoWidth(label, size) + size * 1.6;
  const height = size * 1.9;
  prims.push(rect(x, y, width, height, { radius: height / 2, stroke: true }));
  prims.push(
    text(x + width / 2, y + height / 2 + size * 0.36, label, size, {
      align: "center",
      letterSpacing: size * 0.12,
      weight: 700,
    }),
  );
  return width;
}

export function toolsList(
  prims: Prims,
  x: number,
  y: number,
  tools: readonly string[],
  size: number,
): number {
  tools.forEach((tool, index) => {
    prims.push(
      text(x, y + index * size * 1.55, tool, size, { letterSpacing: size * 0.08 }),
    );
  });
  return y + tools.length * size * 1.55;
}

export function moleculeDots(prims: Prims, cx: number, cy: number, unit: number, rng: () => number): void {
  for (let index = 0; index < 4; index += 1) {
    const angle = (index / 4) * Math.PI * 2 + rng();
    prims.push(
      circle(cx + Math.cos(angle) * unit, cy + Math.sin(angle) * unit, unit * 0.32, {
        fill: "ink",
      }),
    );
  }
  prims.push(circle(cx, cy, unit * 0.2, { fill: "ink" }));
}

export function totemOvals(prims: Prims, cx: number, top: number, bottom: number, width: number, rng: () => number): void {
  let y = top;
  while (y < bottom) {
    const ry = (bottom - top) * (0.1 + rng() * 0.1);
    const rx = Math.min(width / 2, ry * (0.9 + rng()));
    prims.push(ellipseDot(cx, y + ry, rx, ry));
    y += ry * 2 + (bottom - top) * 0.04;
  }
}

export function contentRows(lines: readonly ContentLine[], from: number, count: number): string[] {
  return lines
    .slice(from, from + count)
    .filter((entry) => !entry.divider)
    .map((entry) => entry.cells.join(" "));
}

export const defaultTools = ["MIDJOURNEY", "STABLE DIFFUSION", "RUNWAYML", "SD 1.2"];

function buildLabPlate(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const prims: Prims = [];
  const unit = Math.min(width, height);
  const lab = (cell(lines, 0) || "3.11LABS").replace(/^©+/u, "");
  const city = (cell(lines, 0, 1) || "NYC").split("").join(" ");
  const plateHeight = height * 0.2;
  const plateWidth = width * 0.62;
  const size = clamp(plateHeight * 0.36, 9, 40);
  prims.push(rect(0, 0, plateWidth, plateHeight, { stroke: true, width: 1.6 } as never));
  const iconCell = plateHeight;
  prims.push(rect(0, 0, iconCell, plateHeight, { fill: "ink" }));
  prims.push(circle(iconCell / 2, plateHeight * 0.38, plateHeight * 0.085, { fill: "paper" }));
  prims.push(line(iconCell / 2, plateHeight * 0.38, iconCell / 2, plateHeight * 0.72, 1.1));
  prims.push(line(iconCell * 0.3, plateHeight * 0.55, iconCell * 0.7, plateHeight * 0.55, 1.1));
  const cityCell = monoWidth(city, size) + size;
  prims.push(rect(plateWidth - cityCell, 0, cityCell, plateHeight, { stroke: true }));
  prims.push(
    text((iconCell + plateWidth - cityCell) / 2, plateHeight / 2 + size * 0.36, `©${lab}`, size, {
      align: "center",
      family: "sans",
      weight: 700,
    }),
  );
  prims.push(
    text(plateWidth - cityCell / 2, plateHeight / 2 + size * 0.36, city, size, {
      align: "center",
      weight: 700,
    }),
  );
  const specSize = clamp(unit * 0.045, 8, size * 0.8);
  const specTop = plateHeight + specSize * 1.8;
  const specRows = [
    [cell(lines, 1) || "ALGORITHMICALLY GENERATED", ""],
    [cell(lines, 2) || "WE ARE", cell(lines, 2, 1) || "ARCHITECTS OF THE UNSEEN"],
    [cell(lines, 3) || "DIMENSIONS:", cell(lines, 3, 1) || '1.4" X 9.7" X 13.8"'],
  ];
  specRows.forEach(([left = "", right = ""], index) => {
    const y = specTop + index * specSize * 1.7;
    prims.push(
      text(index === 1 ? specSize * 2.4 : 0, y, left, specSize, {
        letterSpacing: specSize * 0.12,
        weight: 700,
      }),
    );
    if (right) {
      prims.push(text(width, y, right, specSize, { align: "right", letterSpacing: specSize * 0.08 }));
    }
  });
  const boxTop = specTop + specSize * 3.4;
  const boxWidth = width * 0.52;
  const boxHeight = height - boxTop - specSize * 0.5;
  const tick = unit * 0.05;
  prims.push(line(0, boxTop, 0, boxTop + tick, 1.4));
  prims.push(line(0, boxTop, tick, boxTop, 1.4));
  prims.push(line(boxWidth, boxTop, boxWidth - tick, boxTop, 1.4));
  prims.push(line(boxWidth, boxTop, boxWidth, boxTop + tick, 1.4));
  const dashTop = boxTop + boxHeight * 0.55;
  const dash = specSize;
  for (let x = 0; x < boxWidth * 0.8; x += dash * 1.8) {
    prims.push(line(x, dashTop, Math.min(x + dash, boxWidth * 0.8), dashTop, 1.4));
    prims.push(line(x, boxTop + boxHeight, Math.min(x + dash, boxWidth * 0.8), boxTop + boxHeight, 1.4));
  }
  prims.push(line(0, dashTop, 0, boxTop + boxHeight, 1.4));
  prims.push(line(boxWidth * 0.8, dashTop, boxWidth * 0.8, boxTop + boxHeight, 1.4));
  prims.push(
    text(specSize * 0.8, dashTop + (boxHeight * 0.45) / 2 + specSize * 0.4, cell(lines, 4) || "For Vektor, Inc", specSize, {
      family: "sans",
    }),
  );
  const tools = contentRows(lines, 5, 4);
  toolsList(prims, boxWidth + specSize * 1.6, boxTop + specSize * 1.6, tools.length > 0 ? tools : defaultTools, specSize);
  return prims;
}

function buildArcLockup(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, rng, width } = context;
  const prims: Prims = [];
  const unit = Math.min(width, height);
  const labSize = clamp(unit * 0.085, 10, 46);
  const baseline = height * 0.34;
  const cx = width * 0.68;
  const arcCy = baseline - labSize * 1.1;
  for (const factor of [0.4, 0.68, 1]) {
    const radius = unit * 0.22 * factor;
    prims.push(polyline(arcPoints(cx, arcCy, radius, Math.PI, Math.PI * 2, 20), { width: 1.3 }));
    const dotAngle = Math.PI + rng() * 0.5 + (rng() > 0.5 ? Math.PI * 0.8 : 0);
    prims.push(circle(cx + Math.cos(dotAngle) * radius, arcCy + Math.sin(dotAngle) * radius, unit * 0.012, { fill: "ink" }));
  }
  const tagSize = labSize * 0.42;
  tagPill(prims, 0, baseline - labSize * 2.4, cell(lines, 0) || "TXT2IMG", tagSize);
  const lab = cell(lines, 1) || "©3.11LABS";
  const brand = cell(lines, 1, 1) || "VEKTOR";
  prims.push(text(0, baseline, lab, labSize, { family: "sans" }));
  prims.push(
    text(monoWidth(lab, labSize) + labSize * 0.5, baseline, brand, labSize, {
      family: "sans",
      weight: 700,
    }),
  );
  const listSize = clamp(labSize * 0.42, 8, 24);
  const tools = contentRows(lines, 2, 4);
  toolsList(prims, width * 0.3, baseline + listSize * 1.9, tools.length > 0 ? tools : defaultTools, listSize);
  prims.push(ellipseDot(unit * 0.03, height * 0.68, unit * 0.014, unit * 0.04));
  prims.push(ellipseDot(width - unit * 0.03, height * 0.68, unit * 0.014, unit * 0.04));
  const tagline = cell(lines, 6) || "We are architects of";
  const tagline2 = cell(lines, 6, 1) || "the unseen.";
  const taglineSize = listSize * 1.05;
  prims.push(text(0, height - taglineSize * 1.5, tagline, taglineSize, { family: "sans" }));
  prims.push(text(0, height - taglineSize * 0.3, tagline2, taglineSize, { family: "sans" }));
  const years = (cell(lines, 7) || "20").padStart(2, "0");
  const years2 = cell(lines, 7, 1) || "25";
  const yearSize = taglineSize * 1.1;
  prims.push(text(width * 0.78, height - yearSize * 1.4, `${years}  ${years2}`, yearSize));
  prims.push(text(width * 0.72, height - yearSize * 0.2, `${years}  ${years2}`, yearSize));
  return prims;
}

function buildStripLockup(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, rng, width } = context;
  const prims: Prims = [];
  const unit = Math.min(width, height);
  const labSize = clamp(unit * 0.1, 10, 44);
  prims.push(text(0, labSize, cell(lines, 0) || "©3.11LABS", labSize, { family: "sans" }));
  let dotX = width * 0.55;
  while (dotX < width) {
    const wide = rng() > 0.6;
    prims.push(ellipseDot(dotX, labSize * 0.6, unit * (wide ? 0.02 : 0.012), unit * 0.02));
    dotX += unit * 0.055;
  }
  const barX = unit * 0.04;
  prims.push(rect(barX, height * 0.28, unit * 0.06, unit * 0.02, { fill: "ink", radius: unit * 0.01 }));
  prims.push(rect(barX, height * 0.38, unit * 0.06, unit * 0.05, { fill: "ink", radius: unit * 0.012 }));
  prims.push(rect(barX, height * 0.54, unit * 0.06, unit * 0.1, { fill: "ink", radius: unit * 0.014 }));
  const brandSize = labSize * 1.15;
  prims.push(
    text(width * 0.24, height * 0.36, cell(lines, 1) || "VEKTOR", brandSize, {
      family: "sans",
      weight: 700,
    }),
  );
  const schematicX = width * 0.26;
  const schematicY = height * 0.52;
  for (let node = 0; node < 4; node += 1) {
    const nx = schematicX + (node % 2) * unit * 0.1 + rng() * unit * 0.03;
    const ny = schematicY + Math.floor(node / 2) * unit * 0.09;
    prims.push(circle(nx, ny, unit * 0.018, { stroke: true }));
    prims.push(line(nx + unit * 0.018, ny, nx + unit * 0.06, ny, 1.2));
  }
  const listSize = clamp(labSize * 0.5, 8, 24);
  const tools = contentRows(lines, 2, 3);
  toolsList(prims, width * 0.52, height * 0.42, tools.length > 0 ? tools : defaultTools.slice(0, 3), listSize);
  const taglineSize = listSize * 1.05;
  prims.push(
    text(width * 0.24, height - taglineSize * 1.6, cell(lines, 5) || "We are architects", taglineSize, { family: "sans" }),
  );
  prims.push(
    text(width * 0.24, height - taglineSize * 0.4, cell(lines, 5, 1) || "of the unseen.", taglineSize, { family: "sans" }),
  );
  const bracket = (value: string, x: number, align: "left" | "right"): void => {
    prims.push(
      text(x, height - taglineSize * 0.4, `[ ${value} ]`, listSize, {
        align,
        letterSpacing: listSize * 0.1,
      }),
    );
  };
  bracket(cell(lines, 6) || "TXT2IMG", 0, "left");
  bracket(cell(lines, 6, 1) || "Y 2025", width, "right");
  return prims;
}

function buildLampLockup(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, rng, width } = context;
  const prims: Prims = [];
  const unit = Math.min(width, height);
  const lampX = width * 0.42;
  const lampY = height * 0.16;
  prims.push(
    polyline(
      [
        [lampX - unit * 0.1, lampY],
        [lampX - unit * 0.03, lampY - unit * 0.09],
        [lampX + unit * 0.03, lampY - unit * 0.09],
        [lampX + unit * 0.1, lampY],
      ],
      { closed: true, fill: "ink" },
    ),
  );
  prims.push(line(lampX - unit * 0.02, lampY - unit * 0.09, lampX - unit * 0.02, lampY - unit * 0.13, 1.6));
  prims.push(line(lampX + unit * 0.02, lampY - unit * 0.09, lampX + unit * 0.02, lampY - unit * 0.13, 1.6));
  for (let dot = 0; dot < 5; dot += 1) {
    prims.push(
      circle(lampX - unit * 0.07 + dot * unit * 0.035, lampY + unit * 0.03, unit * (dot < 3 ? 0.012 : 0.009), {
        fill: "ink",
      }),
    );
  }
  const labSize = clamp(unit * 0.088, 10, 44);
  const bracketSize = labSize * 0.4;
  prims.push(
    text(0, lampY - bracketSize * 0.4, `[${cell(lines, 0) || "Y©2025"}]`, bracketSize, {
      letterSpacing: bracketSize * 0.12,
    }),
  );
  const lab = cell(lines, 1) || "©3.11LABS";
  prims.push(text(0, lampY + labSize * 1.2, lab, labSize, { family: "sans" }));
  prims.push(
    text(monoWidth(lab, labSize) + labSize * 0.5, lampY + labSize * 1.2, cell(lines, 1, 1) || "VEKTOR", labSize, {
      family: "sans",
      weight: 700,
    }),
  );
  totemOvals(prims, unit * 0.07, height * 0.52, height * 0.86, unit * 0.12, rng);
  prims.push(
    text(0, height - bracketSize * 0.4, `[${cell(lines, 6) || "TXT2IMG"}]`, bracketSize, {
      letterSpacing: bracketSize * 0.12,
    }),
  );
  const listSize = clamp(labSize * 0.42, 8, 24);
  const tools = contentRows(lines, 2, 4);
  toolsList(prims, width * 0.4, height * 0.6, tools.length > 0 ? tools : defaultTools, listSize);
  moleculeDots(prims, width * 0.92, height * 0.82, unit * 0.03, rng);
  return prims;
}

function buildStudioLockup(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, rng, width } = context;
  const prims: Prims = [];
  const unit = Math.min(width, height);
  const labSize = clamp(unit * 0.1, 10, 46);
  const subSize = labSize * 0.6;
  prims.push(text(0, labSize, cell(lines, 0) || "©3.11LABS", labSize, { family: "sans" }));
  prims.push(
    text(0, labSize + subSize * 1.3, cell(lines, 1) || "Algorithmically Generated", subSize, { family: "sans" }),
  );
  prims.push(text(0, labSize + subSize * 2.6, cell(lines, 2) || "NYC 2025", subSize, { family: "sans" }));
  const listSize = clamp(labSize * 0.42, 8, 24);
  const listX = width * 0.36;
  prims.push(text(listX, labSize + subSize * 2.6, cell(lines, 3) || "/TOOLS", listSize, { weight: 700 }));
  const tools = contentRows(lines, 4, 4);
  toolsList(prims, listX + listSize, labSize + subSize * 2.6 + listSize * 1.6, tools.length > 0 ? tools : defaultTools, listSize);
  totemOvals(prims, width * 0.9, unit * 0.06, height * 0.42, unit * 0.1, rng);
  const brandSize = labSize * 1.15;
  prims.push(
    text(0, height - brandSize * 0.25, cell(lines, 8) || "For Vektor, Inc", brandSize, { family: "sans" }),
  );
  const glyphY = height - brandSize * 0.55;
  for (let ray = 0; ray < 8; ray += 1) {
    const angle = (ray / 8) * Math.PI * 2;
    prims.push(
      line(
        width * 0.82 + Math.cos(angle) * unit * 0.012,
        glyphY + Math.sin(angle) * unit * 0.012,
        width * 0.82 + Math.cos(angle) * unit * 0.036,
        glyphY + Math.sin(angle) * unit * 0.036,
        2,
      ),
    );
  }
  prims.push(circle(width * 0.9, glyphY, unit * 0.032, { stroke: true }));
  prims.push(circle(width * 0.95, glyphY, unit * 0.032, { stroke: true }));
  return prims;
}

function buildAxisLockup(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, rng, width } = context;
  const prims: Prims = [];
  const unit = Math.min(width, height);
  const metaSize = clamp(unit * 0.032, 7, 18);
  const meta = (cell(lines, 0) || "©2025 V2.3 SD1.2").split(" ");
  meta.slice(0, 3).forEach((value, index) => {
    prims.push(text(0, metaSize * (1 + index * 1.4), value, metaSize, { letterSpacing: metaSize * 0.08 }));
  });
  tagPill(prims, metaSize * 6, metaSize * 0.6, cell(lines, 1) || "TXT2IMG", metaSize);
  const brandSize = clamp(unit * 0.07, 10, 36);
  prims.push(
    text(0, metaSize * 5.6, cell(lines, 2) || "VEKTOR", brandSize, { family: "sans", weight: 500 }),
  );
  const cx = width * 0.55;
  const cy = height * 0.4;
  const radiusX = width * 0.4;
  const radiusY = height * 0.26;
  const dot = unit * 0.018;
  prims.push(line(cx - radiusX, cy, cx + radiusX, cy, 1.3));
  prims.push(line(cx, cy - radiusY, cx, cy + radiusY, 1.3));
  prims.push(ellipseDot(cx - radiusX, cy, dot * 0.7, dot * 1.4));
  prims.push(ellipseDot(cx + radiusX, cy, dot * 0.7, dot * 1.4));
  prims.push(ellipseDot(cx, cy - radiusY, dot, dot * 1.7));
  prims.push(ellipseDot(cx, cy + radiusY, dot, dot * 1.7));
  prims.push(circle(cx, cy, dot, { fill: "ink" }));
  const angle = Math.PI / 3.2 + rng() * 0.2;
  const diag = radiusY * 0.9;
  prims.push(
    line(cx - Math.cos(angle) * diag * 0.55, cy + Math.sin(angle) * diag * 0.55, cx + Math.cos(angle) * diag, cy - Math.sin(angle) * diag, 1.3),
  );
  prims.push(ellipseDot(cx + Math.cos(angle) * diag * 0.7, cy - Math.sin(angle) * diag * 0.7, dot, dot * 1.6));
  const taglineSize = clamp(unit * 0.04, 8, 22);
  const tagY = Math.min(height * 0.74, height - metaSize * 3 - taglineSize * 4.4);
  prims.push(text(width * 0.44, tagY, cell(lines, 3) || "We are architects of", taglineSize, { family: "sans" }));
  prims.push(text(width * 0.44, tagY + taglineSize * 1.2, cell(lines, 3, 1) || "the unseen.", taglineSize, { family: "sans" }));
  prims.push(
    text(width * 0.78, tagY + taglineSize * 0.3, cell(lines, 4) || "/ 2025", taglineSize * 1.6, { family: "sans" }),
  );
  prims.push(
    text(width * 0.44, tagY + taglineSize * 3.2, cell(lines, 5) || "©3.11LABS", taglineSize * 1.4, { family: "sans" }),
  );
  moleculeDots(prims, width * 0.92, tagY + taglineSize * 2.8, unit * 0.022, rng);
  const footer = [
    (cell(lines, 6) || "MIDJOURNEY | 6.1").split("|"),
    (cell(lines, 7) || "STABLE DIFFUSION | 1.5").split("|"),
    (cell(lines, 8) || "RUNWAYML | 2.1").split("|"),
  ];
  const columnWidth = width / footer.length;
  const longestName = Math.max(...footer.map(([name = ""]) => name.trim().length), 4);
  const footSize = clamp(Math.min(metaSize * 1.1, columnWidth / (longestName + 4) / 0.62), 7, 18);
  footer.forEach(([name = "", version = ""], index) => {
    const x = index * columnWidth;
    prims.push(text(x, height - footSize * 1.6, name.trim(), footSize, { letterSpacing: footSize * 0.06 }));
    prims.push(text(x, height - footSize * 0.2, version.trim(), footSize));
    if (index > 0) {
      prims.push(circle(x - columnWidth * 0.08, height - footSize * 2, footSize * 0.16, { fill: "ink" }));
    }
  });
  return prims;
}

export const plateBuilders = {
  "arc-lockup": buildArcLockup,
  "axis-lockup": buildAxisLockup,
  "lab-plate": buildLabPlate,
  "lamp-lockup": buildLampLockup,
  "strip-lockup": buildStripLockup,
  "studio-lockup": buildStudioLockup,
} satisfies Record<string, (context: TemplateRenderContext) => PosterPrimitive[]>;
