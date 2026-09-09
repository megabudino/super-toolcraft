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

function ellipse(
  cx: number,
  cy: number,
  radiusX: number,
  radiusY: number,
  segments = 18,
  outline = false,
): PosterPrimitive {
  const points: [number, number][] = [];
  for (let step = 0; step <= segments; step += 1) {
    const angle = (step / segments) * Math.PI * 2;
    points.push([cx + Math.cos(angle) * radiusX, cy + Math.sin(angle) * radiusY]);
  }
  return polyline(points, outline ? { closed: true, width: 1.1 } : { closed: true, fill: "ink" });
}

function buildPlateHeader(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const lab = cell(lines, 0) || "3.11LABS";
  const city = cell(lines, 0, 1) || "NYC";
  const labText = `©${lab}`;
  const iconCell = height;
  const cityText = city.split("").join(" ");
  let size = clamp(
    Math.min(height * 0.44, width / (labText.length + cityText.length + 6) / 0.62) *
      context.typeScale,
    9,
    44,
  );
  let cityCell = monoWidth(cityText, size) + size * 1.4;
  size = Math.min(
    size,
    Math.max(8, (width - iconCell - cityCell - size) / labText.length / 0.68),
  );
  cityCell = monoWidth(cityText, size) + size * 1.4;
  const primitives: PosterPrimitive[] = [
    rect(0, 0, width, height, { stroke: true }),
    rect(0, 0, iconCell, height, { fill: "ink" }),
    rect(width - cityCell, 0, cityCell, height, { stroke: true }),
  ];
  const glyph = height * 0.22;
  const cx = iconCell / 2;
  const cy = height / 2;
  primitives.push(circle(cx, cy - glyph * 0.4, glyph * 0.42, { fill: "paper" }));
  primitives.push(line(cx, cy - glyph * 0.4, cx, cy + glyph, 1.5));
  primitives.push(line(cx - glyph * 0.7, cy + glyph * 0.3, cx + glyph * 0.7, cy + glyph * 0.3, 1.5));
  primitives.push(
    text((iconCell + (width - cityCell)) / 2, height / 2 + size * 0.36, labText, size, {
      align: "center",
      family: "sans",
      weight: 700,
    }),
  );
  primitives.push(
    text(width - cityCell / 2, height / 2 + size * 0.36, cityText, size, {
      align: "center",
      weight: 700,
    }),
  );
  return primitives;
}

function buildSpecBlock(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const rows = lines.filter((entry) => !entry.divider).slice(0, 5);
  const fallback = [
    ["ALGORITHMICALLY GENERATED"],
    ["WE ARE", "ARCHITECTS OF THE UNSEEN"],
    ["DIMENSIONS:", '1.4" X 9.7" X 13.8"'],
  ];
  const list = rows.length > 0 ? rows.map((entry) => entry.cells) : fallback;
  const longestRow = Math.max(
    ...list.map(
      (cells) => (cells[0]?.length ?? 0) + (cells[1]?.length ?? 0) + 8,
    ),
  );
  const size = clamp(
    Math.min((height / (list.length + 0.6)) * 0.52, width / longestRow / 0.62) *
      context.typeScale,
    8,
    30,
  );
  const rowHeight = height / Math.max(1, list.length);
  const primitives: PosterPrimitive[] = [];
  list.forEach((cells, index) => {
    const y = index * rowHeight + rowHeight / 2 + size * 0.36;
    const [first = "", second = ""] = cells;
    const indent = index % 2 === 1 ? size * 2.4 : 0;
    primitives.push(
      text(indent, y, first, size, { letterSpacing: size * 0.14, weight: 700 }),
    );
    if (second) {
      primitives.push(
        text(width, y, second, size, { align: "right", letterSpacing: size * 0.1 }),
      );
    }
  });
  return primitives;
}

function buildDieline(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const label = cell(lines, 0) || "For Vektor, Inc";
  const size = clamp(smallType(context) * 0.8, 9, 30);
  const tick = Math.min(width, height) * 0.1;
  const primitives: PosterPrimitive[] = [
    line(0, 0, 0, tick, 1.6),
    line(0, 0, tick, 0, 1.6),
    line(width, 0, width - tick, 0, 1.6),
    line(width, 0, width, tick, 1.6),
    line(0, height * 0.55, 0, height * 0.55 - tick, 1.6),
    line(width, height * 0.55, width, height * 0.55 - tick, 1.6),
    line(width * 0.42, 0, width * 0.42, tick, 1.2),
    line(width * 0.42, height * 0.55, width * 0.42, height * 0.55 - tick, 1.2),
  ];
  const boxTop = height * 0.6;
  const boxHeight = height - boxTop;
  const dash = size * 0.9;
  for (let x = 0; x < width * 0.62; x += dash * 1.8) {
    primitives.push(line(x, boxTop, Math.min(x + dash, width * 0.62), boxTop, 1.6));
    primitives.push(
      line(x, height, Math.min(x + dash, width * 0.62), height, 1.6),
    );
  }
  primitives.push(line(0, boxTop, 0, height, 1.6));
  primitives.push(line(width * 0.62, boxTop, width * 0.62, height, 1.6));
  primitives.push(
    text(size * 0.8, boxTop + boxHeight / 2 + size * 0.36, label, size, {
      family: "sans",
    }),
  );
  return primitives;
}

function buildArcOrbits(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, rng, width } = context;
  const radius = Math.min(width, height * 1.1) * 0.44;
  const cx = width / 2;
  const cy = height * 0.94;
  const primitives: PosterPrimitive[] = [];
  for (const factor of [0.42, 0.7, 1]) {
    const start = Math.PI + rng() * 0.4;
    const end = Math.PI * 2 - rng() * 0.35;
    primitives.push(polyline(arcPoints(cx, cy, radius * factor, start, end, 22), { width: 1.6 }));
    const dotAngle = rng() > 0.5 ? start : end;
    primitives.push(
      circle(
        cx + Math.cos(dotAngle) * radius * factor,
        cy + Math.sin(dotAngle) * radius * factor,
        radius * 0.055,
        { fill: "ink" },
      ),
    );
  }
  const code = cell(lines, 0);
  if (code) {
    const size = smallType(context) * 0.6;
    primitives.push(text(0, height, code, size, { letterSpacing: size * 0.14 }));
  }
  return primitives;
}

function buildBrandLockup(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const tag = cell(lines, 0) || "TXT2IMG";
  const lab = cell(lines, 1) || "©3.11LABS";
  const brand = cell(lines, 2) || "VEKTOR";
  const tools = lines
    .slice(3)
    .filter((entry) => !entry.divider && entry.cells[0] !== "" )
    .map((entry) => entry.cells.join(" "))
    .slice(0, 5);
  const toolList = tools.length > 0 ? tools : ["MIDJOURNEY", "STABLE DIFFUSION", "RUNWAYML", "SD 1.2"];
  const brandSize = Math.min(height * 0.24, width / Math.max(4, brand.length) / 0.66);
  const labSize = brandSize * 0.62;
  const tagSize = labSize * 0.52;
  const longestTool = Math.max(...toolList.map((tool) => tool.length), 8);
  const blockTop = tagSize * 1.9 + labSize * 1.3 + brandSize * 1.05;
  const listSize = clamp(
    Math.min(
      brandSize * 0.3,
      (width * 0.62) / longestTool / 0.62,
      (height - blockTop) / (toolList.length + 0.5) / 1.6,
    ),
    8,
    30,
  );
  const primitives: PosterPrimitive[] = [];
  const tagWidth = monoWidth(tag, tagSize) + tagSize * 1.6;
  const tagHeight = tagSize * 1.9;
  primitives.push(rect(0, 0, tagWidth, tagHeight, { radius: tagHeight / 2, stroke: true }));
  primitives.push(
    text(tagWidth / 2, tagHeight / 2 + tagSize * 0.36, tag, tagSize, {
      align: "center",
      letterSpacing: tagSize * 0.14,
      weight: 700,
    }),
  );
  const labY = tagHeight + labSize * 1.3;
  primitives.push(text(0, labY, lab, labSize, { family: "sans", weight: 500 }));
  const brandY = labY + brandSize * 1.05;
  primitives.push(text(0, brandY, brand, brandSize, { family: "sans", weight: 700 }));
  const listX = width * 0.34;
  toolList.forEach((tool, index) => {
    primitives.push(
      text(listX, brandY + listSize * 1.6 + index * listSize * 1.6, tool, listSize, {
        letterSpacing: listSize * 0.08,
      }),
    );
  });
  const yearSize = listSize * 1.1;
  primitives.push(
    text(width, tagHeight * 0.7, "20  25", yearSize, { align: "right" }),
  );
  primitives.push(
    text(width - yearSize * 1.6, tagHeight * 0.7 + yearSize * 1.3, "20  25", yearSize, {
      align: "right",
    }),
  );
  return primitives;
}

function buildMorseRow(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, rng, width } = context;
  const middle = height / 2;
  const radiusY = height * 0.36;
  const primitives: PosterPrimitive[] = [];
  let x = radiusY * 0.8;
  while (x < width - radiusY) {
    const kind = rng();
    if (kind > 0.62) {
      primitives.push(circle(x, middle, radiusY * 0.3, { fill: "ink" }));
      x += radiusY * 1.5;
    } else if (kind > 0.3) {
      primitives.push(
        rect(x - radiusY * 0.9, middle - radiusY * 0.26, radiusY * 1.8, radiusY * 0.52, {
          radius: radiusY * 0.26,
          stroke: true,
        }),
      );
      x += radiusY * 2.6;
    } else {
      primitives.push(
        rect(x - radiusY * 0.7, middle - radiusY * 0.26, radiusY * 1.4, radiusY * 0.52, {
          fill: "ink",
          radius: radiusY * 0.26,
        }),
      );
      x += radiusY * 2.4;
    }
  }
  primitives.push(line(radiusY * 0.3, middle + radiusY * 1.15, width - radiusY * 0.3, middle + radiusY * 1.15, 0.8));
  return primitives;
}

function buildBarColumn(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, width } = context;
  const barWidth = width * 0.72;
  const x = (width - barWidth) / 2;
  const radius = barWidth * 0.2;
  return [
    rect(x, 0, barWidth, height * 0.09, { radius, stroke: true }),
    rect(x, height * 0.2, barWidth, height * 0.24, { radius, stroke: true }),
    rect(x, height * 0.55, barWidth, height * 0.45, { fill: "ink", radius }),
  ];
}

function buildAxisStar(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, rng, width } = context;
  const cx = width * 0.5;
  const cy = height * 0.5;
  const radiusX = width * 0.48;
  const radiusY = height * 0.44;
  const dot = Math.min(width, height) * 0.028;
  const primitives: PosterPrimitive[] = [
    line(cx - radiusX, cy, cx + radiusX, cy, 1.4),
    line(cx, cy - radiusY, cx, cy + radiusY, 1.4),
    ellipse(cx - radiusX, cy, dot, dot * 2.2),
    ellipse(cx + radiusX, cy, dot, dot * 2.2),
    ellipse(cx, cy - radiusY, dot * 1.4, dot * 2.6),
    ellipse(cx, cy + radiusY, dot * 1.4, dot * 2.6),
    circle(cx, cy, dot * 1.5, { fill: "ink" }),
  ];
  const angle = Math.PI / 4 + rng() * 0.3;
  const diagonal = Math.min(radiusX, radiusY) * 0.85;
  primitives.push(
    line(
      cx - Math.cos(angle) * diagonal * 0.5,
      cy + Math.sin(angle) * diagonal * 0.5,
      cx + Math.cos(angle) * diagonal,
      cy - Math.sin(angle) * diagonal,
      1.4,
    ),
  );
  primitives.push(
    ellipse(
      cx + Math.cos(angle) * diagonal * 0.72,
      cy - Math.sin(angle) * diagonal * 0.72,
      dot * 1.6,
      dot * 2.4,
    ),
  );
  return primitives;
}

function buildToolColumns(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const rows = lines.filter((entry) => !entry.divider).slice(0, 4);
  const fallback = [
    ["MIDJOURNEY", "6.1"],
    ["STABLE DIFFUSION", "1.5"],
    ["RUNWAYML", "2.1"],
  ];
  const list = rows.length > 0 ? rows.map((entry) => entry.cells) : fallback;
  const columnWidth = width / Math.max(1, list.length);
  const longestName = Math.max(...list.map((cells) => cells[0]?.length ?? 0), 4);
  const nameSize = clamp(
    Math.min(height * 0.34, columnWidth / (longestName + 3) / 0.62) *
      context.typeScale,
    7,
    28,
  );
  const primitives: PosterPrimitive[] = [
    line(0, nameSize * 1.9, width, nameSize * 1.9, 0.8),
  ];
  list.forEach((cells, index) => {
    const [name = "", version = ""] = cells;
    const x = index * columnWidth;
    primitives.push(
      text(x, nameSize * 1.1, name, nameSize, { letterSpacing: nameSize * 0.08 }),
    );
    if (version) {
      primitives.push(text(x, height, version, nameSize * 1.7, { family: "sans", weight: 700 }));
    }
    if (index > 0) {
      primitives.push(circle(x - columnWidth * 0.06, nameSize * 0.72, nameSize * 0.14, { fill: "ink" }));
    }
  });
  return primitives;
}

function buildTotem(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, rng, width } = context;
  const cx = width / 2;
  const primitives: PosterPrimitive[] = [];
  let y = height * 0.08;
  let slot = 0;
  while (y < height * 0.94) {
    const radiusY = height * (0.07 + rng() * 0.08);
    const radiusX = Math.min(width * 0.46, radiusY * (0.8 + rng() * 1.1));
    primitives.push(ellipse(cx, y + radiusY, radiusX, radiusY, 24, slot % 2 === 1));
    y += radiusY * 2 + height * 0.025;
    slot += 1;
  }
  return primitives;
}

function buildSpokeWheel(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, lines, width } = context;
  const radiusX = width * 0.42;
  const radiusY = height * 0.34;
  const cx = width / 2;
  const cy = height / 2;
  const points: [number, number][] = [];
  for (let step = 0; step <= 24; step += 1) {
    const angle = (step / 24) * Math.PI * 2;
    points.push([cx + Math.cos(angle) * radiusX, cy + Math.sin(angle) * radiusY]);
  }
  const primitives: PosterPrimitive[] = [polyline(points, { width: 1.6 })];
  for (let spoke = 0; spoke < 3; spoke += 1) {
    const angle = (spoke / 3) * Math.PI;
    primitives.push(
      line(
        cx - Math.cos(angle) * radiusX,
        cy - Math.sin(angle) * radiusY,
        cx + Math.cos(angle) * radiusX,
        cy + Math.sin(angle) * radiusY,
        1.4,
      ),
    );
  }
  primitives.push(
    line(cx - radiusX * 1.12, cy + radiusY * 1.3, cx + radiusX * 1.12, cy - radiusY * 1.3, 1.4),
  );
  const code = cell(lines, 0);
  if (code) {
    const size = smallType(context) * 0.55;
    primitives.push(text(0, height, code, size, { letterSpacing: size * 0.12 }));
  }
  return primitives;
}

function buildMolecule(context: TemplateRenderContext): PosterPrimitive[] {
  const { height, rng, width } = context;
  const unit = Math.min(width, height);
  const cx = width / 2;
  const cy = height / 2;
  const primitives: PosterPrimitive[] = [];
  const count = 5;
  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * Math.PI * 2 + rng() * 0.5;
    const distance = unit * (0.12 + rng() * 0.22);
    const radius = unit * (0.05 + rng() * 0.06);
    primitives.push(
      circle(cx + Math.cos(angle) * distance, cy + Math.sin(angle) * distance, radius, {
        fill: index % 4 === 0 ? "none" : "ink",
        stroke: index % 4 === 0,
      }),
    );
  }
  primitives.push(circle(cx, cy, unit * 0.035, { fill: "ink" }));
  return primitives;
}

export const compositeBuilders = {
  "arc-orbits": buildArcOrbits,
  "axis-star": buildAxisStar,
  "bar-column": buildBarColumn,
  "brand-lockup": buildBrandLockup,
  dieline: buildDieline,
  molecule: buildMolecule,
  "morse-row": buildMorseRow,
  "plate-header": buildPlateHeader,
  "spec-block": buildSpecBlock,
  "spoke-wheel": buildSpokeWheel,
  "tool-columns": buildToolColumns,
  totem: buildTotem,
} satisfies Record<string, (context: TemplateRenderContext) => PosterPrimitive[]>;
