import type { PosterPrimitive } from "./poster-types";
import {
  cell,
  circle,
  clamp,
  line,
  monoWidth,
  rect,
  text,
  type TemplateRenderContext,
} from "./template-primitives";
import { drawPackGlyph, packGlyphAspect, packGlyphPick } from "./template-glyphs";
import { contentRows, defaultTools } from "./template-renderers-plates";

type Prims = PosterPrimitive[];

type MegaContext = {
  brand: string;
  code: string;
  height: number;
  lab: string;
  labSize: number;
  listSize: number;
  margin: number;
  metric: number;
  micro: number;
  mix: () => number;
  tag: string;
  tagline: string;
  tagline2: string;
  tools: readonly string[];
  unit: number;
  width: number;
};

function megaRandom(seed: number): () => number {
  let value = (seed * 69621) % 2147483647 || 13;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

const CRYPTIC_CHARS = "ABCDEFHKMORSTX0123456789";

function cryptic(mix: () => number, length: number): string {
  let out = "";
  for (let index = 0; index < length; index += 1) {
    out += CRYPTIC_CHARS[Math.floor(mix() * CRYPTIC_CHARS.length)] ?? "0";
  }
  return out;
}

function crosshair(prims: Prims, cx: number, cy: number, radius: number): void {
  prims.push(circle(cx, cy, radius, { stroke: true }));
  prims.push(line(cx - radius * 1.5, cy, cx - radius * 0.45, cy, 0.9));
  prims.push(line(cx + radius * 0.45, cy, cx + radius * 1.5, cy, 0.9));
  prims.push(line(cx, cy - radius * 1.5, cx, cy - radius * 0.45, 0.9));
  prims.push(line(cx, cy + radius * 0.45, cx, cy + radius * 1.5, 0.9));
}

function plusMark(prims: Prims, cx: number, cy: number, radius: number): void {
  prims.push(line(cx - radius, cy, cx + radius, cy, 0.9));
  prims.push(line(cx, cy - radius, cx, cy + radius, 0.9));
}

function fitSans(value: string, maxWidth: number, cap: number): number {
  return Math.min(cap, maxWidth / Math.max(1, value.length * 0.62));
}

function colonPairs(value: string): string {
  const pairs: string[] = [];
  for (let index = 0; index < value.length; index += 2) {
    pairs.push(value.slice(index, index + 2));
  }
  return pairs.join(":");
}

function fitListX(x: number, width: number, entries: readonly string[], size: number): number {
  const longest = entries.reduce((max, entry) => Math.max(max, monoWidth(entry, size) * 1.13), 0);
  return Math.min(x, Math.max(width * 0.4, width - longest));
}

function toolColumn(prims: Prims, x: number, y: number, items: readonly string[], size: number): void {
  items.forEach((item, index) => {
    prims.push(text(x, y + index * size * 1.7, item, size, { letterSpacing: size * 0.08 }));
  });
}

function dataColumn(
  prims: Prims,
  x: number,
  y: number,
  rows: readonly string[],
  size: number,
  align?: "right",
): void {
  rows.forEach((row, index) => {
    prims.push(
      text(x, y + index * size * 1.6, row, size, {
        ...(align ? { align } : {}),
        letterSpacing: size * 0.08,
      }),
    );
  });
}

function megaHeader(prims: Prims, variant: number, mega: MegaContext): void {
  const { brand, code, lab, margin, micro, mix, tag, width } = mega;
  const y0 = margin + micro;
  const ruleY = y0 - micro * 0.34;
  if (variant === 0) {
    prims.push(text(margin, y0, lab, micro, { letterSpacing: micro * 0.12, weight: 700 }));
    const labEnd = margin + monoWidth(lab, micro) * 1.14;
    prims.push(line(labEnd + micro, ruleY, width * 0.36, ruleY, 0.9));
    prims.push(text(width - margin, y0, code, micro, { align: "right", letterSpacing: micro * 0.12, weight: 700 }));
    const codeStart = width - margin - monoWidth(code, micro) * 1.14;
    prims.push(line(width * 0.64, ruleY, codeStart - micro, ruleY, 0.9));
    crosshair(prims, width / 2, ruleY, micro * 0.62);
  } else if (variant === 1) {
    plusMark(prims, margin, ruleY, micro * 0.6);
    plusMark(prims, width - margin, ruleY, micro * 0.6);
    prims.push(
      text(width / 2, y0, tag, micro * 1.1, { align: "center", letterSpacing: micro * 0.5, weight: 700 }),
    );
  } else if (variant === 2) {
    prims.push(text(margin, y0 + micro * 0.2, brand, micro * 1.3, { family: "sans", weight: 700 }));
    const rows = [
      `${cryptic(mix, 6)}. ${cryptic(mix, 2)} ${cryptic(mix, 2)}`,
      `${cryptic(mix, 5)} ${cryptic(mix, 1)}  ${cryptic(mix, 2)}`,
      `${cryptic(mix, 4)}     ${cryptic(mix, 1)}`,
      `${cryptic(mix, 6)}    ${cryptic(mix, 2)}`,
    ];
    dataColumn(prims, width - margin, y0 - micro * 0.2, rows, micro * 0.82, "right");
  } else if (variant === 3) {
    prims.push(text(width / 2, y0, lab, micro * 1.05, { align: "center", letterSpacing: micro * 0.3, weight: 700 }));
    const half = monoWidth(lab, micro * 1.05) * 1.32 / 2;
    prims.push(line(margin, ruleY, width / 2 - half - micro * 1.2, ruleY, 0.9));
    prims.push(line(width / 2 + half + micro * 1.2, ruleY, width - margin, ruleY, 0.9));
  } else if (variant === 4) {
    const pillH = micro * 2;
    const pillW = monoWidth(tag, micro) + micro * 1.8;
    prims.push(rect(margin, margin, pillW, pillH, { radius: pillH / 2, stroke: true }));
    prims.push(
      text(margin + pillW / 2, margin + pillH / 2 + micro * 0.36, tag, micro, {
        align: "center",
        letterSpacing: micro * 0.14,
        weight: 700,
      }),
    );
    prims.push(
      text(width - margin, margin + pillH / 2 + micro * 0.36, code, micro, {
        align: "right",
        letterSpacing: micro * 0.12,
      }),
    );
  } else {
    prims.push(text(margin, y0, lab, micro, { letterSpacing: micro * 0.12, weight: 700 }));
    const dotsStart = margin + monoWidth(lab, micro) * 1.14 + micro * 1.4;
    for (let x = dotsStart; x < width - margin - micro * 1.6; x += micro * 1.15) {
      prims.push(circle(x, ruleY, 0.9, { fill: "ink" }));
    }
    prims.push(triangleMark(width - margin, ruleY, micro * 0.62));
  }
}

function triangleMark(cx: number, cy: number, r: number): PosterPrimitive {
  return {
    closed: true,
    fill: "ink",
    kind: "polyline",
    points: [
      [cx - r, cy - r * 0.8],
      [cx + r * 0.9, cy],
      [cx - r, cy + r * 0.8],
    ],
  } as PosterPrimitive;
}

function megaRail(prims: Prims, variant: number, mega: MegaContext): void {
  const { brand, height, listSize, margin, micro, mix, width } = mega;
  const top = height * 0.32;
  const bottom = height * 0.72;
  if (variant === 0) {
    const rows = [
      `${cryptic(mix, 2)} ${cryptic(mix, 4)}`,
      `${cryptic(mix, 2)} ${cryptic(mix, 3)}`,
      `${cryptic(mix, 1)}  ${cryptic(mix, 4)}`,
      `${cryptic(mix, 2)} ${cryptic(mix, 2)}`,
      `${cryptic(mix, 1)}  ${cryptic(mix, 3)}`,
    ];
    dataColumn(prims, margin, height * 0.36, rows, micro * 0.82);
  } else if (variant === 1) {
    const x = width - margin * 0.45;
    const steps = 12;
    for (let step = 0; step <= steps; step += 1) {
      const y = top + ((bottom - top) / steps) * step;
      if (step === Math.floor(steps / 2)) {
        crosshair(prims, x, y, micro * 0.55);
      } else {
        prims.push(circle(x, y, 1.2, { fill: "ink" }));
      }
    }
  } else if (variant === 2) {
    const pool = ["spark", "warn-tri", "recycle", "star-burst", "bolt-tri", "pin"];
    for (let slot = 0; slot < 3; slot += 1) {
      const id = packGlyphPick(pool, mix);
      pool.splice(pool.indexOf(id), 1);
      drawPackGlyph(prims, id, margin, height * (0.33 + slot * 0.13), listSize * 1.6);
    }
  } else if (variant === 3) {
    const letters = brand.slice(0, 8).split("");
    letters.forEach((letter, index) => {
      prims.push(
        text(width - margin * 0.45, height * 0.34 + index * micro * 1.9, letter, micro * 0.95, {
          align: "right",
          weight: 700,
        }),
      );
    });
  } else {
    plusMark(prims, margin, height * 0.3, micro * 0.6);
    plusMark(prims, width - margin, height * 0.74, micro * 0.6);
  }
}

function megaCenter(prims: Prims, variant: number, mega: MegaContext): void {
  const { code, brand, height, lab, labSize, listSize, margin, metric, micro, mix, tag, tagline, tagline2, tools, unit, width } = mega;
  const cy = height * 0.51;
  const innerWidth = width - margin * 2;
  if (variant === 0) {
    const big = fitSans(brand, innerWidth * 0.86, unit * 0.24);
    prims.push(
      text(width / 2, cy - big * 0.62, tagline, micro * 1.05, {
        align: "center",
        letterSpacing: micro * 0.34,
        weight: 700,
      }),
    );
    prims.push(text(width / 2, cy + big * 0.34, brand, big, { align: "center", family: "sans", weight: 700 }));
    const pairs: string[] = [];
    for (let index = 0; index < tag.length; index += 2) {
      pairs.push(tag.slice(index, index + 2));
    }
    prims.push(
      text(width / 2, cy + big * 0.78, pairs.join(":"), listSize * 1.25, {
        align: "center",
        letterSpacing: listSize * 0.3,
        weight: 700,
      }),
    );
  } else if (variant === 1) {
    const title = `${tag}-0${metric % 10}`;
    const titleSize = Math.min(labSize * 1.05, fitSans(title, innerWidth * 0.6, labSize * 1.05));
    const rowY = cy - listSize * 1.6;
    prims.push(text(width / 2, cy - listSize * 3.6, title, titleSize, { align: "center", family: "sans", weight: 700 }));
    const ringR = listSize * 0.8;
    const ringsX = width / 2 - listSize * 5.4;
    for (let ring = 0; ring < 3; ring += 1) {
      prims.push(circle(ringsX + ring * ringR * 1.1, rowY - listSize * 0.32, ringR, { stroke: true }));
    }
    prims.push(text(width / 2 - listSize * 1.6, rowY - listSize * 0.55, `${metric}% ENG`, listSize * 0.95, { weight: 700 }));
    prims.push(text(width / 2 - listSize * 1.6, rowY + listSize * 0.55, "RETURN.", listSize * 0.95, { weight: 700 }));
    prims.push(text(width / 2 + listSize * 3.6, rowY, `C0${metric % 10}/S4/00${metric}`, listSize * 0.8));
    prims.push(
      text(width / 2, rowY + listSize * 1.9, `${code} / ${cryptic(mix, 3)}-${cryptic(mix, 4)}`, listSize * 0.95, {
        align: "center",
        letterSpacing: listSize * 0.08,
      }),
    );
    const pillY = rowY + listSize * 2.9;
    const pillText = "FIELD TESTED";
    const pillH = listSize * 1.75;
    const pillW = monoWidth(pillText, listSize * 0.9) + listSize * 1.9;
    prims.push(text(width / 2 - pillW / 2 - listSize * 1.6, pillY + pillH * 0.68, "IV", listSize * 1.15, { family: "sans", weight: 700 }));
    prims.push(rect(width / 2 - pillW / 2, pillY, pillW, pillH, { radius: pillH / 2, stroke: true }));
    prims.push(
      text(width / 2, pillY + pillH / 2 + listSize * 0.33, pillText, listSize * 0.9, {
        align: "center",
        letterSpacing: listSize * 0.1,
        weight: 700,
      }),
    );
    prims.push(
      text(width / 2, pillY + pillH + listSize * 1.5, `A/0${metric % 10} — ${tagline.toUpperCase()}`, micro * 0.92, {
        align: "center",
        letterSpacing: micro * 0.08,
      }),
    );
    prims.push(
      text(width / 2, pillY + pillH + listSize * 2.6, tagline2.toUpperCase(), micro * 0.92, {
        align: "center",
        letterSpacing: micro * 0.08,
      }),
    );
  } else if (variant === 2) {
    const patchLeft = margin;
    const patchRight = width * 0.55;
    const patchTop = cy - unit * 0.16;
    const patchBottom = cy + unit * 0.16;
    const clusters: [number, number][] = [];
    for (let cluster = 0; cluster < 3; cluster += 1) {
      clusters.push([
        patchLeft + mix() * (patchRight - patchLeft),
        patchTop + mix() * (patchBottom - patchTop),
      ]);
    }
    const step = Math.max(7, unit * 0.024);
    for (let y = patchTop; y <= patchBottom; y += step) {
      for (let x = patchLeft; x <= patchRight; x += step) {
        let nearest = Infinity;
        for (const [cxC, cyC] of clusters) {
          nearest = Math.min(nearest, Math.hypot(x - cxC, y - cyC));
        }
        const falloff = 1 - Math.min(1, nearest / (unit * 0.2));
        if (falloff <= 0.05 || mix() > falloff + 0.22) {
          continue;
        }
        prims.push(circle(x + (mix() - 0.5) * 3, y + (mix() - 0.5) * 3, 0.9 + falloff * 1.8, { fill: "ink" }));
      }
    }
    plusMark(prims, patchRight + micro * 2, patchTop + micro, micro * 0.6);
    plusMark(prims, patchLeft + micro, patchBottom + micro * 1.6, micro * 0.6);
    const listX = fitListX(width * 0.62, width - margin, tools.slice(0, 3), listSize);
    prims.push(line(listX, cy - listSize * 3.4, width - margin, cy - listSize * 3.4, 0.9));
    toolColumn(prims, listX, cy - listSize * 2.2, tools.slice(0, 3), listSize);
  } else if (variant === 3) {
    const waveLeft = margin;
    const waveRight = width - margin * 1.9;
    const rows = 4;
    const phase = mix() * Math.PI * 2;
    for (let row = 0; row < rows; row += 1) {
      const baseY = cy - listSize * 3.3 + row * listSize * 2.2;
      const amp = listSize * (0.9 + row * 0.25);
      for (let dot = 0; dot <= 21; dot += 1) {
        const x = waveLeft + ((waveRight - waveLeft) / 21) * dot;
        const y = baseY + Math.sin(phase + row * 0.9 + (dot / 21) * Math.PI * 2.4) * amp;
        prims.push(circle(x, y, 1.15, { fill: "ink" }));
      }
    }
    const rows2 = [`${cryptic(mix, 5)} ${cryptic(mix, 2)}`, `${cryptic(mix, 3)}  ${cryptic(mix, 2)}`];
    dataColumn(prims, width - margin, Math.max(cy - listSize * 7, margin + micro * 7.6), rows2, micro * 0.82, "right");
  } else if (variant === 4) {
    const digits = String(metric).padStart(2, "0");
    const big = Math.min(unit * 0.3, (innerWidth * 0.5) / (digits.length * 0.62));
    const baseline = cy + big * 0.3;
    prims.push(text(width - margin, baseline, digits, big, { align: "right", family: "sans", weight: 700 }));
    prims.push(line(margin, baseline + big * 0.16, width - margin, baseline + big * 0.16, 0.9));
    prims.push(
      text(width - margin, baseline + big * 0.16 + micro * 1.7, `${tag} INDEX`, micro, {
        align: "right",
        letterSpacing: micro * 0.3,
        weight: 700,
      }),
    );
    drawPackGlyph(prims, "reg-target", width * 0.42, baseline - listSize * 1.9, listSize * 1.9);
  } else if (variant === 5) {
    const big = fitSans(brand, innerWidth * 0.8, unit * 0.17);
    prims.push(line(margin, cy - big * 1.35, width - margin, cy - big * 1.35, 0.9));
    prims.push(
      text(width / 2, cy - big * 0.62, tagline.toUpperCase(), micro, {
        align: "center",
        letterSpacing: micro * 0.26,
      }),
    );
    prims.push(text(width / 2, cy + big * 0.3, brand, big, { align: "center", family: "sans", weight: 700 }));
    prims.push(
      text(width / 2, cy + big * 0.92, tagline2.toUpperCase(), micro, {
        align: "center",
        letterSpacing: micro * 0.26,
      }),
    );
    prims.push(line(margin, cy + big * 1.3, width - margin, cy + big * 1.3, 0.9));
  } else if (variant === 6) {
    const radius = unit * 0.15;
    prims.push(circle(width / 2, cy, radius, { stroke: true }));
    prims.push(circle(width / 2, cy, radius * 0.55, { stroke: true }));
    prims.push(circle(width / 2, cy, 1.6, { fill: "ink" }));
    prims.push(line(margin, cy, width / 2 - radius * 0.28, cy, 0.8));
    prims.push(line(width / 2 + radius * 0.28, cy, width - margin, cy, 0.8));
    prims.push(line(width / 2, cy - radius * 1.55, width / 2, cy - radius * 0.28, 0.8));
    prims.push(line(width / 2, cy + radius * 0.28, width / 2, cy + radius * 1.55, 0.8));
    prims.push(text(width / 2 + radius * 1.25, cy - radius * 1.05, `${metric}%`, micro, { weight: 700 }));
    prims.push(text(width / 2 - radius * 1.25, cy - radius * 1.05, code, micro, { align: "right" }));
    prims.push(text(width / 2 + radius * 1.25, cy + radius * 1.3, tag, micro, { letterSpacing: micro * 0.14 }));
    prims.push(text(width / 2 - radius * 1.25, cy + radius * 1.3, cryptic(mix, 5), micro, { align: "right" }));
  } else if (variant === 7) {
    const stripWidth = innerWidth * 0.56;
    const aspect = packGlyphAspect("code-strip");
    const stripHeight = stripWidth / Math.max(1, aspect);
    prims.push(line(margin, cy - stripHeight * 0.85, width - margin, cy - stripHeight * 0.85, 0.9));
    drawPackGlyph(prims, "code-strip", width / 2 - stripWidth / 2, cy - stripHeight * 0.45, stripHeight);
    const codeLine = `${code} · ${cryptic(mix, 6)}`;
    const codeSize = Math.min(listSize, innerWidth / (codeLine.length * 0.82));
    prims.push(
      text(width / 2, cy + stripHeight * 0.75 + codeSize, codeLine, codeSize, {
        align: "center",
        letterSpacing: codeSize * 0.18,
        weight: 700,
      }),
    );
    prims.push(line(margin, cy + stripHeight * 0.85 + listSize * 1.6, width - margin, cy + stripHeight * 0.85 + listSize * 1.6, 0.9));
  } else if (variant === 8) {
    const hero = colonPairs(tag);
    const heroSize = Math.min(unit * 0.155, innerWidth / (hero.length * 0.78));
    prims.push(
      text(width / 2, cy - heroSize * 0.9, lab, micro, {
        align: "center",
        letterSpacing: micro * 0.3,
        weight: 700,
      }),
    );
    prims.push(
      text(width / 2, cy + heroSize * 0.28, hero, heroSize, {
        align: "center",
        family: "sans",
        letterSpacing: heroSize * 0.12,
        weight: 700,
      }),
    );
    prims.push(line(margin, cy + heroSize * 0.75, width - margin, cy + heroSize * 0.75, 1.3));
    prims.push(line(margin, cy + heroSize * 0.75 + micro * 0.7, width - margin, cy + heroSize * 0.75 + micro * 0.7, 0.8));
    prims.push(
      text(width - margin, cy + heroSize * 0.75 + micro * 2.2, code, micro, {
        align: "right",
        letterSpacing: micro * 0.2,
      }),
    );
  } else if (variant === 9) {
    const size = Math.min(labSize * 0.72, innerWidth / ((lab.length + code.length) * 1.5 * 0.62));
    prims.push(text(margin, cy, lab, size, { family: "sans", weight: 700 }));
    prims.push(text(width - margin, cy, code, size, { align: "right", family: "sans", weight: 700 }));
    const gapLeft = margin + lab.length * size * 0.6 + size;
    const gapRight = width - margin - code.length * size * 0.6 - size;
    const ruleY2 = cy - size * 0.33;
    prims.push(line(gapLeft, ruleY2, gapRight, ruleY2, 0.9));
    prims.push(circle((gapLeft + gapRight) / 2, ruleY2, 2, { fill: "ink" }));
    prims.push(
      text(margin, cy + micro * 1.9, tagline.toUpperCase(), micro * 0.9, { letterSpacing: micro * 0.16 }),
    );
    prims.push(
      text(width - margin, cy + micro * 1.9, tagline2.toUpperCase(), micro * 0.9, {
        align: "right",
        letterSpacing: micro * 0.16,
      }),
    );
  } else if (variant === 10) {
    const radius = unit * 0.185;
    const ringX = width * 0.66;
    prims.push(circle(ringX, cy, radius, { stroke: true }));
    const orbitAngle = mix() * Math.PI * 2;
    prims.push(circle(ringX + Math.cos(orbitAngle) * radius, cy + Math.sin(orbitAngle) * radius, unit * 0.012, { fill: "ink" }));
    crosshair(prims, ringX, cy, micro * 0.7);
    prims.push(
      text(ringX + radius * 0.8, cy - radius * 1.05, `${metric}%`, micro, { weight: 700 }),
    );
    const sideX = margin + listSize * 2.2;
    const sideY = Math.min(cy + radius * 0.85, height - margin - micro * 6.6);
    prims.push(line(sideX, sideY - micro * 1.9, sideX + innerWidth * 0.22, sideY - micro * 1.9, 0.9));
    prims.push(
      text(sideX, sideY, tagline.toUpperCase(), micro * 0.9, {
        letterSpacing: micro * 0.1,
      }),
    );
  } else if (variant === 11) {
    const bandAngle = 0.42;
    const rows = 9;
    for (let row = 0; row < rows; row += 1) {
      const offset = (row - rows / 2) * listSize * 1.35;
      const density = 1 - Math.abs(row - rows / 2) / (rows / 2 + 0.6);
      for (let t = 0; t <= 30; t += 1) {
        if (mix() > 0.3 + density * 0.65) {
          continue;
        }
        const x = margin + (innerWidth / 30) * t;
        const y = cy + offset + (x - width / 2) * bandAngle * 0.28 + (mix() - 0.5) * listSize * 0.8;
        prims.push(circle(x, y, 0.9 + density * 0.9, { fill: "ink" }));
      }
    }
    prims.push(
      text(width - margin, cy + unit * 0.15, brand, micro * 1.2, {
        align: "right",
        letterSpacing: micro * 0.3,
        weight: 700,
      }),
    );
  } else if (variant === 13) {
    const gridTop = cy - unit * 0.14;
    const gridBottom = cy + unit * 0.14;
    const columns = 4;
    const rows = 3;
    for (let column = 0; column <= columns; column += 1) {
      const x = margin + (innerWidth / columns) * column;
      prims.push(line(x, gridTop, x, gridBottom, 0.8));
    }
    for (let row = 0; row <= rows; row += 1) {
      const y = gridTop + ((gridBottom - gridTop) / rows) * row;
      prims.push(line(margin, y, width - margin, y, 0.8));
      if (row < rows) {
        prims.push(
          text(width - margin + micro * 0.6, y + ((gridBottom - gridTop) / rows) / 2 + micro * 0.3, cryptic(mix, 2), micro * 0.75, {}),
        );
      }
    }
    const cellC = Math.floor(mix() * columns);
    const cellR = Math.floor(mix() * rows);
    const cellW = innerWidth / columns;
    const cellH = (gridBottom - gridTop) / rows;
    const cellX = margin + cellC * cellW;
    const cellY = gridTop + cellR * cellH;
    prims.push(rect(cellX + cellW * 0.32, cellY + cellH * 0.3, cellW * 0.36, cellH * 0.4, { fill: "ink" }));
    plusMark(prims, margin + cellW, gridTop, micro * 0.55);
    plusMark(prims, margin + cellW * 3, gridBottom, micro * 0.55);
    prims.push(
      text(cellX + cellW / 2, cellY - micro * 0.6, code, micro * 0.85, {
        align: "center",
        letterSpacing: micro * 0.14,
        weight: 700,
      }),
    );
  } else if (variant === 14) {
    const sealSize = Math.min(unit * 0.24, listSize * 6);
    const sealX = margin + innerWidth * 0.06;
    drawPackGlyph(prims, "globe-seal", sealX, cy - sealSize * 0.5, sealSize);
    const blockX = sealX + sealSize + labSize;
    const blockRight = width - margin;
    const big = fitSans(brand, blockRight - blockX, unit * 0.13);
    prims.push(line(blockX, cy - big * 0.95, blockRight, cy - big * 0.95, 1.3));
    prims.push(text(blockX, cy + big * 0.25, brand, big, { family: "sans", weight: 700 }));
    prims.push(line(blockX, cy + big * 0.62, blockRight, cy + big * 0.62, 0.8));
    prims.push(
      text(blockX, cy + big * 0.62 + micro * 1.8, `${tag} · ${code}`, micro, {
        letterSpacing: micro * 0.2,
      }),
    );
  } else {
    const tableLeft = margin + innerWidth * 0.12;
    const tableRight = tableLeft + innerWidth * 0.46;
    const tableTop = cy - listSize * 3.6;
    const rowH = listSize * 1.8;
    prims.push(line(tableLeft, tableTop - rowH * 0.6, tableRight, tableTop - rowH * 0.6, 1.3));
    for (let row = 0; row < 4; row += 1) {
      const y = tableTop + row * rowH;
      const label = (tools[row % tools.length] ?? cryptic(mix, 8)).toUpperCase();
      const cellSize = Math.min(listSize * 0.82, (tableRight - tableLeft - listSize * 4.4) / (label.length * 0.7));
      prims.push(text(tableLeft, y, label, cellSize, { letterSpacing: cellSize * 0.06 }));
      prims.push(
        text(tableRight, y, `${cryptic(mix, 2)}·${String((row + 1) * (metric % 9 + 1)).padStart(2, "0")}`, cellSize, {
          align: "right",
        }),
      );
      prims.push(line(tableLeft, y + rowH * 0.35, tableRight, y + rowH * 0.35, 0.8));
    }
    const digits = String(metric).padStart(2, "0");
    const bigSize = Math.min(unit * 0.2, innerWidth * 0.34 / (digits.length * 0.62));
    prims.push(text(width - margin, cy + bigSize * 0.3, digits, bigSize, { align: "right", family: "sans", weight: 700 }));
    prims.push(
      text(width - margin, cy + bigSize * 0.3 + micro * 1.8, `${tag} / ${code}`, micro * 0.9, {
        align: "right",
        letterSpacing: micro * 0.12,
      }),
    );
  }
}

function megaFooter(prims: Prims, variant: number, mega: MegaContext): void {
  const { brand, code, height, listSize, margin, metric, micro, mix, tag, tagline, tagline2, tools, width } = mega;
  const bottom = height - margin;
  if (variant === 0) {
    const columnWidth = (width - margin * 2) / 3 - micro * 1.5;
    const columns: Array<[string, string, "center" | "left" | "right", number]> = [
      [tag, tagline.toUpperCase(), "left", margin],
      [`20${String(metric).padStart(2, "0")}`, (tools[0] ?? "COMING SOON").toUpperCase(), "center", width / 2],
      [code, tagline2.toUpperCase(), "right", width - margin],
    ];
    for (const [top, under, align, x] of columns) {
      const longest = Math.max(top.length, under.length, 4);
      const size = Math.min(micro * 1.08, columnWidth / (longest * 0.78));
      prims.push(text(x, bottom - size * 1.7, top, size, { align: align === "left" ? undefined : align, letterSpacing: size * 0.14, weight: 700 }));
      prims.push(text(x, bottom, under, size, { align: align === "left" ? undefined : align, letterSpacing: size * 0.14, weight: 700 }));
    }
  } else if (variant === 1) {
    crosshair(prims, width / 2, bottom - micro * 0.6, micro * 0.72);
    plusMark(prims, margin, bottom - micro * 0.6, micro * 0.6);
    plusMark(prims, width - margin, bottom - micro * 0.6, micro * 0.6);
  } else if (variant === 2) {
    prims.push(line(margin, bottom - micro * 2.5, width - margin, bottom - micro * 2.5, 0.9));
    prims.push(
      text(margin, bottom - micro * 0.4, `${tagline.toUpperCase()} ${tagline2.toUpperCase()}`, micro * 0.95, {
        letterSpacing: micro * 0.12,
      }),
    );
    prims.push(text(width - margin, bottom - micro * 0.3, brand, micro * 1.5, { align: "right", family: "sans", weight: 700 }));
  } else if (variant === 3) {
    const rows = [
      `${cryptic(mix, 2)} ${cryptic(mix, 4)}  ${cryptic(mix, 2)}`,
      `${cryptic(mix, 3)} ${cryptic(mix, 2)}   ${cryptic(mix, 1)}`,
      `${cryptic(mix, 2)} ${cryptic(mix, 3)}  ${cryptic(mix, 2)}`,
      `${cryptic(mix, 4)} ${cryptic(mix, 1)}   ${cryptic(mix, 2)}`,
    ];
    dataColumn(prims, margin, bottom - micro * 5.4, rows, micro * 0.82);
    const pool = ["recycle", "warn-tri", "spark", "umbrella", "alert-circle"];
    drawPackGlyph(prims, packGlyphPick(pool, mix), width - margin - listSize * 1.7, bottom - listSize * 1.7, listSize * 1.7);
  } else if (variant === 4) {
    const pillH = listSize * 1.8;
    const pillW = monoWidth(code, listSize * 0.95) + listSize * 2;
    const pillY = bottom - pillH - micro * 2.2;
    prims.push(rect(width / 2 - pillW / 2, pillY, pillW, pillH, { radius: pillH / 2, stroke: true }));
    prims.push(
      text(width / 2, pillY + pillH / 2 + listSize * 0.34, code, listSize * 0.95, {
        align: "center",
        letterSpacing: listSize * 0.14,
        weight: 700,
      }),
    );
    prims.push(
      text(width / 2, bottom - micro * 0.3, `${tagline.toUpperCase()} / ${tagline2.toUpperCase()}`, micro * 0.92, {
        align: "center",
        letterSpacing: micro * 0.1,
      }),
    );
  } else {
    prims.push(line(margin, bottom - micro * 2.7, width - margin, bottom - micro * 2.7, 1.5));
    prims.push(line(margin, bottom - micro * 2.2, width - margin, bottom - micro * 2.2, 0.8));
    prims.push(text(margin, bottom - micro * 0.4, code, micro, { letterSpacing: micro * 0.22, weight: 700 }));
    crosshair(prims, width / 2, bottom - micro * 0.75, micro * 0.6);
    prims.push(
      text(width - margin, bottom - micro * 0.4, `${metric} / ${tag}`, micro, {
        align: "right",
        letterSpacing: micro * 0.14,
      }),
    );
  }
}

export function buildMegaComposition(
  megaIndex: number,
  context: TemplateRenderContext,
): PosterPrimitive[] {
  const { height, lines, rng, width } = context;
  const prims: Prims = [];
  const unit = Math.min(width, height);
  const mix = megaRandom(megaIndex + 29);
  const labSize = clamp(unit * (0.065 + mix() * 0.03), 10, 42);
  const listSize = clamp(labSize * 0.44, 8, 21);
  const labCell = cell(lines, 0) || "©3.11LABS";
  const mega: MegaContext = {
    brand: cell(lines, 0, 1) || "VEKTOR",
    code: cell(lines, 7) || "QA-204",
    height,
    lab: labCell,
    labSize,
    listSize,
    margin: unit * 0.055,
    metric: clamp(Number.parseInt(cell(lines, 6), 10) || 64, 1, 99),
    micro: clamp(listSize * 0.82, 7, 13),
    mix,
    tag: cell(lines, 1) || "TXT2IMG",
    tagline: cell(lines, 2) || "We are architects of",
    tagline2: cell(lines, 2, 1) || "the unseen.",
    tools: (() => {
      const rows = contentRows(lines, 3, 3);
      return rows.length > 0 ? rows : defaultTools;
    })(),
    unit,
    width,
  };
  const index = Math.max(0, megaIndex - 1);
  megaHeader(prims, index % 6, mega);
  megaRail(prims, (index * 2 + Math.floor(index / 5)) % 5, mega);
  megaCenter(prims, index >= 42 ? 13 + (index - 42) % 2 : index % 13, mega);
  megaFooter(prims, (index + Math.floor(index / 6) + 3) % 6, mega);
  void rng;
  return prims;
}
