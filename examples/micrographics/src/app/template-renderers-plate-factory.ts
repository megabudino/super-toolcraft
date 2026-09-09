import type { PosterPrimitive } from "./poster-types";
import {
  arcPoints,
  cell,
  circle,
  clamp,
  line,
  monoWidth,
  rect,
  text,
  type TemplateRenderContext,
} from "./template-primitives";
import { drawPackGlyph } from "./template-glyphs";
import {
  contentRows,
  defaultTools,
  ellipseDot,
  moleculeDots,
  tagPill,
  toolsList,
  totemOvals,
} from "./template-renderers-plates";
import { polyline } from "./template-primitives";

function recipeRandom(seed: number): () => number {
  let value = (seed * 48271) % 2147483647 || 7;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

export function buildPlateComposition(
  plateIndex: number,
  context: TemplateRenderContext,
): PosterPrimitive[] {
  const { height, lines, rng, width } = context;
  const prims: PosterPrimitive[] = [];
  const unit = Math.min(width, height);
  const mix = recipeRandom(plateIndex + 11);
  const labSize = clamp(unit * (0.07 + mix() * 0.03), 10, 44);
  const listSize = clamp(labSize * 0.42, 8, 22);
  const lab = cell(lines, 0) || "©3.11LABS";
  const brand = cell(lines, 0, 1) || "VEKTOR";
  const tag = cell(lines, 1) || "TXT2IMG";
  const tagline = cell(lines, 2) || "We are architects of";
  const tagline2 = cell(lines, 2, 1) || "the unseen.";
  const tools = contentRows(lines, 3, 4);
  const toolList = tools.length > 0 ? tools : defaultTools;

  const headerGlyphs = ["globe-bold", "biohazard", "radioactive", "alert-circle", "hand-point"] as const;
  const header = plateIndex % 3;
  if (header === 0) {
    const plateHeight = labSize * 1.9;
    prims.push(rect(0, 0, width * 0.6, plateHeight, { stroke: true }));
    prims.push(rect(0, 0, plateHeight, plateHeight, { fill: "ink" }));
    const iconSize = plateHeight * 0.58;
    drawPackGlyph(
      prims,
      headerGlyphs[plateIndex % headerGlyphs.length] ?? "globe-bold",
      (plateHeight - iconSize) / 2,
      (plateHeight - iconSize) / 2,
      iconSize,
      "paper",
    );
    prims.push(
      text(plateHeight + labSize * 0.4, plateHeight * 0.68, lab, labSize * 0.72, {
        family: "sans",
        weight: 700,
      }),
    );
  } else if (header === 1) {
    const iconSize = labSize * 0.95;
    const iconWidth = drawPackGlyph(prims, "cmd-knot", 0, labSize * 0.05, iconSize);
    prims.push(text(iconWidth + labSize * 0.4, labSize, lab, labSize, { family: "sans" }));
    prims.push(
      text(iconWidth + labSize * 0.4 + monoWidth(lab, labSize) + labSize * 0.5, labSize, brand, labSize, {
        family: "sans",
        weight: 700,
      }),
    );
  } else {
    const pillWidth = tagPill(prims, 0, 0, tag, listSize);
    drawPackGlyph(prims, "spark", pillWidth + listSize * 0.7, listSize * 0.28, listSize * 1.4);
    prims.push(text(0, listSize * 3.6, lab, labSize, { family: "sans", weight: 500 }));
  }

  const rail = plateIndex % 4;
  if (rail === 3) {
    const stackGlyphs = ["warn-tri", "bolt-tri", "skull-tri"] as const;
    stackGlyphs.forEach((glyph, index) => {
      drawPackGlyph(prims, glyph, unit * 0.015, height * (0.36 + index * 0.16), unit * 0.075);
    });
  } else if (rail === 0) {
    totemOvals(prims, unit * 0.06, height * 0.34, height * 0.82, unit * 0.1, mix);
  } else if (rail === 1) {
    const barX = unit * 0.03;
    prims.push(rect(barX, height * 0.34, unit * 0.05, unit * 0.02, { fill: "ink", radius: unit * 0.01 }));
    prims.push(rect(barX, height * 0.42, unit * 0.05, unit * 0.05, { fill: "ink", radius: unit * 0.012 }));
    prims.push(rect(barX, height * 0.55, unit * 0.05, unit * 0.09, { fill: "ink", radius: unit * 0.014 }));
  } else if (rail === 2) {
    prims.push(ellipseDot(unit * 0.03, height * 0.6, unit * 0.013, unit * 0.038));
    prims.push(ellipseDot(width - unit * 0.03, height * 0.6, unit * 0.013, unit * 0.038));
  }

  const center = plateIndex % 5;
  const centerY = height * 0.42;
  if (center === 0 || center === 3) {
    toolsList(prims, width * 0.42, centerY, toolList, listSize);
  } else if (center === 1) {
    const cx = width * 0.62;
    for (const factor of [0.45, 0.72, 1]) {
      const radius = unit * 0.2 * factor;
      prims.push(polyline(arcPoints(cx, centerY + unit * 0.16, radius, Math.PI, Math.PI * 2, 18), { width: 1.5 }));
      const angle = Math.PI + mix() * Math.PI;
      prims.push(circle(cx + Math.cos(angle) * radius, centerY + unit * 0.16 + Math.sin(angle) * radius, unit * 0.012, { fill: "ink" }));
    }
    toolsList(prims, width * 0.08, centerY + unit * 0.06, toolList.slice(0, 3), listSize);
  } else if (center === 2) {
    const cx = width * 0.58;
    const cy = centerY + unit * 0.1;
    prims.push(line(cx - width * 0.3, cy, cx + width * 0.3, cy, 1.3));
    prims.push(line(cx, cy - height * 0.16, cx, cy + height * 0.16, 1.3));
    prims.push(ellipseDot(cx - width * 0.3, cy, unit * 0.012, unit * 0.024));
    prims.push(ellipseDot(cx + width * 0.3, cy, unit * 0.012, unit * 0.024));
    prims.push(circle(cx, cy, unit * 0.014, { fill: "ink" }));
    toolsList(prims, width * 0.08, centerY, toolList.slice(0, 2), listSize);
  } else {
    const burst = unit * 0.12;
    drawPackGlyph(prims, "star-burst", width * 0.72 - burst / 2, centerY - burst / 2, burst);
    toolsList(prims, width * 0.14, centerY, toolList, listSize);
  }

  const footer = plateIndex % 4;
  const taglineSize = listSize * 1.05;
  if (footer === 0) {
    prims.push(text(0, height - taglineSize * 1.4, tagline, taglineSize, { family: "sans" }));
    prims.push(text(0, height - taglineSize * 0.2, tagline2, taglineSize, { family: "sans" }));
    prims.push(text(width, height - taglineSize * 0.2, "20  25", taglineSize, { align: "right" }));
  } else if (footer === 1) {
    prims.push(text(0, height - taglineSize * 0.3, `[ ${tag} ]`, listSize, { letterSpacing: listSize * 0.1 }));
    prims.push(text(width, height - taglineSize * 0.3, "[ Y 2025 ]", listSize, { align: "right", letterSpacing: listSize * 0.1 }));
  } else if (footer === 2) {
    prims.push(text(0, height - taglineSize * 0.25, brand, labSize * 0.9, { family: "sans", weight: 700 }));
    const mark = unit * 0.055;
    drawPackGlyph(prims, plateIndex % 2 === 0 ? "checker-x" : "recycle", width - mark, height - taglineSize * 0.4 - mark, mark);
  } else {
    const columnWidth = width / 3;
    toolList.slice(0, 3).forEach((tool, index) => {
      prims.push(text(index * columnWidth, height - taglineSize * 1.4, tool, listSize * 0.85));
      prims.push(text(index * columnWidth, height - taglineSize * 0.2, `${1 + (plateIndex % 6)}.${index + 1}`, listSize * 0.85));
    });
  }

  if (mix() > 0.5) {
    moleculeDots(prims, width * 0.9, height * 0.3, unit * 0.02, mix);
  }
  void rng;
  return prims;
}
