import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { appPerformance } from "./app-performance";
import { appSchema } from "./app-schema";
import {
  editorialPatternDefaultValues,
  editorialPatternFirstLaunchDefaults,
} from "./editorial-pattern-defaults";
import {
  editorialTemplateOptions,
  editorialTemplates,
  getEditorialTemplate,
  resolveEditorialCopy,
} from "./editorial-templates";
import { createHarmoniousPalette } from "./palette-harmonies";
import {
  equationOptions,
  getEquationDisplayLines,
  sampleEquationPoints,
  type EquationParameters,
} from "./pattern-equations";
import { buildPatternSegments } from "./pattern-segmentation";

const appDir = fileURLToPath(new URL(".", import.meta.url));

function getControlByTarget(target: string) {
  return appSchema.panels.controls?.sections
    .flatMap((section) => Object.values(section.controls))
    .find((control) => control.target === target);
}

function pointCloudSignature(points: readonly (readonly [number, number])[]): string {
  const stride = Math.max(1, Math.floor(points.length / 31));
  return points
    .filter((_, index) => index % stride === 0)
    .slice(0, 31)
    .map(([x, y]) => `${x.toFixed(4)},${y.toFixed(4)}`)
    .join("|");
}

function countWrappedLines(value: string, maxCharacters: number): number {
  let count = 0;
  for (const explicitLine of value.replace(/\r/g, "").split("\n")) {
    const words = explicitLine.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      count += 1;
      continue;
    }
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (candidate.length <= maxCharacters || !line) {
        line = candidate;
      } else {
        count += 1;
        line = word;
      }
    }
    count += 1;
  }
  return count;
}

function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map(
    (start) => Number.parseInt(hex.slice(start, start + 2), 16) / 255,
  );
  const linear = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return (linear[0] ?? 0) * 0.2126 + (linear[1] ?? 0) * 0.7152 + (linear[2] ?? 0) * 0.0722;
}

function contrastRatio(a: string, b: string): number {
  const lighter = Math.max(relativeLuminance(a), relativeLuminance(b));
  const darker = Math.min(relativeLuminance(a), relativeLuminance(b));
  return (lighter + 0.05) / (darker + 0.05);
}

describe("Editorial Pattern Studio", () => {
  it("defines thirty structurally distinct editorial templates with unique copy", () => {
    expect(editorialTemplates).toHaveLength(30);
    expect(editorialTemplateOptions).toHaveLength(30);
    expect(new Set(editorialTemplates.map(({ id }) => id)).size).toBe(30);
    expect(new Set(editorialTemplates.map(({ label }) => label)).size).toBe(30);
    expect(
      editorialTemplates
        .map(({ annotations, text }) => annotations.length + text.length)
        .sort((a, b) => a - b),
    ).toEqual([
      6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14,
      15, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
    ]);
    expect(
      editorialTemplates
        .slice(10)
        .map(({ annotations, text }) => annotations.length + text.length),
    ).toEqual(Array.from({ length: 20 }, (_, index) => index + 6));
    const annotationCopy = editorialTemplates.flatMap(({ annotations }) =>
      annotations.map(({ content }) => content),
    );
    expect(new Set(annotationCopy).size).toBe(annotationCopy.length);

    for (const copyPart of ["marker", "eyebrow", "headline", "body", "footer"] as const) {
      expect(new Set(editorialTemplates.map(({ copy }) => copy[copyPart])).size).toBe(30);
    }
    expect(
      new Set(editorialTemplates.map(({ copy }) => JSON.stringify(copy))).size,
    ).toBe(30);

    expect(new Set(editorialTemplates.map(({ grid }) => grid.columns))).toEqual(
      new Set([6, 8, 10, 12, 16]),
    );

    for (const template of editorialTemplates) {
      expect([6, 8, 10, 12, 16]).toContain(template.grid.columns);
      expect(template.grid.rows).toBeGreaterThanOrEqual(16);
      expect(template.grid.rows).toBeLessThanOrEqual(28);
      expect(template.pattern.centerY).toBeGreaterThan(0.78);
      expect(template.pattern.centerY).toBeLessThanOrEqual(1.02);
      expect(template.pattern.centerX).toBeGreaterThanOrEqual(0.18);
      expect(template.pattern.centerX).toBeLessThanOrEqual(0.82);
      expect(template.pattern.radius).toBeGreaterThanOrEqual(0.3);
      expect(template.pattern.radius).toBeLessThanOrEqual(0.48);
      expect(new Set(template.text.map(({ source }) => source))).toEqual(
        new Set(["marker", "eyebrow", "headline", "body", "footer", "equation"]),
      );
      expect(template.text.some(({ fontSize }) => fontSize >= 0.065)).toBe(true);
      expect(
        template.text
          .filter(({ source }) => source === "headline" || source === "marker")
          .every(({ fontWeight }) => fontWeight >= 500 && fontWeight <= 650),
      ).toBe(true);

      for (const block of template.text) {
        expect(block.x).toBeGreaterThanOrEqual(-0.08);
        expect(block.x).toBeLessThanOrEqual(1.08);
        expect(block.y).toBeGreaterThanOrEqual(0.025);
        expect(block.y).toBeLessThanOrEqual(0.98);
        expect(block.maxWidth).toBeGreaterThan(0.08);
        expect(block.maxWidth).toBeLessThanOrEqual(0.95);
      }
    }
  });

  it("keeps every formula clear of structural rules at supported authored canvases", () => {
    const parameters: EquationParameters = {
      coupling: 48,
      phase: 18,
      resonance: 5,
      symmetry: 7,
      warp: 32,
    };
    const maxEquationLineCount = Math.max(
      ...equationOptions.map(({ value }) =>
        countWrappedLines(
          getEquationDisplayLines(value, parameters).join("\n"),
          48,
        ),
      ),
    );
    expect(maxEquationLineCount).toBe(4);

    const minimumClearance = 8;
    const authoredCanvases = [
      { height: 600, label: "original portrait", width: 480 },
      { height: 1080, label: "current 4:3 default", width: 1440 },
    ];

    for (const canvas of authoredCanvases) {
      const conflicts: string[] = [];

      for (const template of editorialTemplates) {
        const equation = template.text.find(({ source }) => source === "equation");
        expect(equation).toBeDefined();
        if (!equation) continue;

        const fontSize = canvas.width * equation.fontSize;
        const lineHeight = fontSize * equation.lineHeight;
        const baseline = canvas.height * equation.y;
        const equationAlign = "align" in equation ? equation.align : undefined;
        const formulaTop = baseline - fontSize * 1.2;
        const formulaBottom =
          baseline + (maxEquationLineCount - 1) * lineHeight + fontSize * 0.4;
        const formulaLeft =
          equationAlign === "right"
            ? canvas.width * (equation.x - equation.maxWidth)
            : equationAlign === "center"
              ? canvas.width * (equation.x - equation.maxWidth / 2)
              : canvas.width * equation.x;
        const formulaRight = formulaLeft + canvas.width * equation.maxWidth;

        for (const rule of template.rules) {
          const ruleLeft = canvas.width * Math.min(rule.x1, rule.x2);
          const ruleRight = canvas.width * Math.max(rule.x1, rule.x2);
          const ruleTop = canvas.height * Math.min(rule.y1, rule.y2);
          const ruleBottom = canvas.height * Math.max(rule.y1, rule.y2);
          let clearance = Number.POSITIVE_INFINITY;

          if (
            rule.y1 === rule.y2 &&
            ruleRight >= formulaLeft &&
            ruleLeft <= formulaRight
          ) {
            clearance =
              ruleTop < formulaTop
                ? formulaTop - ruleTop
                : ruleTop > formulaBottom
                  ? ruleTop - formulaBottom
                  : 0;
          } else if (
            rule.x1 === rule.x2 &&
            ruleBottom >= formulaTop &&
            ruleTop <= formulaBottom
          ) {
            clearance =
              ruleLeft < formulaLeft
                ? formulaLeft - ruleLeft
                : ruleLeft > formulaRight
                  ? ruleLeft - formulaRight
                  : 0;
          }

          if (clearance < minimumClearance) {
            conflicts.push(`${template.id}: ${clearance.toFixed(2)}px`);
          }
        }
      }

      expect(conflicts, canvas.label).toEqual([]);
    }
  });

  it("falls back safely and resolves template versus custom copy", () => {
    const first = editorialTemplates[0];
    expect(first).toBeDefined();
    expect(getEditorialTemplate("missing-template")).toEqual(first);

    const customCopy = {
      body: "Custom body",
      eyebrow: "Custom eyebrow",
      footer: "Custom footer",
      headline: "Custom headline",
    };
    expect(resolveEditorialCopy(first!, false, customCopy)).toEqual(first?.copy);
    expect(resolveEditorialCopy(first!, true, customCopy)).toEqual({
      ...customCopy,
      marker: first?.copy.marker,
    });
  });

  it("maps product controls to the custom poster renderer", () => {
    expect(appSchema.canvas).toMatchObject({
      enabled: true,
      size: { height: 1080, unit: "px", width: 1440 },
      sizing: { mode: "editable-output" },
      upload: false,
    });
    expect(appSchema.panels.controls?.sections[0]?.title).toBe("Setup");
    expect(appSchema.panels.controls?.sections.map((section) => section.title)).toEqual(
      expect.arrayContaining([
        "Setup",
        "Explore",
        "Editorial Template",
        "Field Equation",
        "Line Form",
        "Color Segments",
        "Line Palette",
        "Editorial Ink",
        "Background",
        "Image Export",
      ]),
    );
    expect(getControlByTarget("composition.shuffle")).toMatchObject({
      actions: [
        expect.objectContaining({
          label: "Shuffle all",
          value: "shuffle-composition",
        }),
      ],
      type: "actions",
    });
    expect(getControlByTarget("composition.preserveColors")).toMatchObject({
      defaultValue: true,
      label: "Preserve colors",
      type: "switch",
    });
    expect(getControlByTarget("pattern.position")).toMatchObject({
      defaultValue: { x: -0.18, y: -0.04 },
      type: "vector",
    });
    expect(getControlByTarget("pattern.preset")).toMatchObject({ type: "select" });
    expect(getControlByTarget("pattern.preset")?.options).toHaveLength(12);
    expect(getControlByTarget("pattern.symmetry")).toMatchObject({
      defaultValue: 15,
      type: "slider",
      variant: "discrete",
    });
    expect(getControlByTarget("pattern.resonance")).toMatchObject({
      defaultValue: 9,
      type: "slider",
      variant: "discrete",
    });
    expect(getControlByTarget("pattern.segmentSize")).toMatchObject({
      defaultValue: 0.5,
      max: 2.5,
      min: 0.35,
      type: "slider",
    });
    expect(getControlByTarget("pattern.paletteActions")).toMatchObject({
      actions: [expect.objectContaining({ label: "Shuffle", value: "shuffle-palette" })],
      type: "actions",
    });
    expect(getControlByTarget("pattern.segments")).toBeUndefined();
    expect(getControlByTarget("editorial.template")).toMatchObject({
      defaultValue: "negative-space",
      options: editorialTemplateOptions,
      type: "select",
    });
    expect(getControlByTarget("editorial.customCopy")).toMatchObject({
      defaultValue: false,
      type: "switch",
    });
    for (const target of [
      "editorial.eyebrow",
      "editorial.headline",
      "editorial.body",
      "editorial.footer",
    ]) {
      expect(getControlByTarget(target)?.visibleWhen).toEqual({
        target: "editorial.customCopy",
        equals: true,
      });
    }
    expect(getControlByTarget("editorial.layout")).toBeUndefined();
    expect(appSchema.panels.layers).toBeUndefined();
    expect(appSchema.panels.timeline).toBeUndefined();
    expect(appPerformance.usesCustomRenderer).toBe(true);
    expect(appPerformance.rendererStrategy).toBe("svg");
  });

  it("uses the imported settings for clean first launches and resets", () => {
    expect(appSchema.canvas.size).toEqual(editorialPatternFirstLaunchDefaults.canvas);

    const schemaDefaults = Object.fromEntries(
      Object.keys(editorialPatternDefaultValues).map((target) => [
        target,
        getControlByTarget(target)?.defaultValue,
      ]),
    );

    expect(schemaDefaults).toEqual(editorialPatternDefaultValues);
    expect(appSchema.persistence).toMatchObject({
      include: ["values", "canvas", "panels"],
      key: "toolcraft:editorial-pattern-studio:state:v3",
      storage: "localStorage",
      version: 3,
    });
  });

  it("keeps all equation systems closed and every shared variable expressive", () => {
    const parameters: EquationParameters = {
      coupling: 48,
      phase: 18,
      resonance: 5,
      symmetry: 7,
      warp: 32,
    };

    expect(equationOptions).toHaveLength(12);

    for (const { value } of equationOptions) {
      const points = sampleEquationPoints(value, parameters, 2400);
      const firstPoint = points[0];
      const lastPoint = points.at(-1);

      expect(firstPoint).toBeDefined();
      expect(lastPoint).toBeDefined();
      expect(points.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y))).toBe(true);
      expect(Math.abs((firstPoint?.[0] ?? 0) - (lastPoint?.[0] ?? 0))).toBeLessThan(0.001);
      expect(Math.abs((firstPoint?.[1] ?? 0) - (lastPoint?.[1] ?? 0))).toBeLessThan(0.001);
      expect(getEquationDisplayLines(value, parameters)[0]).toContain("x(t)=");
      expect(getEquationDisplayLines(value, parameters)[1]).toContain("y(t)=");
    }

    const baseline = pointCloudSignature(
      sampleEquationPoints("coupled-pendulum", parameters, 2400),
    );
    for (const [key, value] of [
      ["symmetry", 11],
      ["resonance", 9],
      ["coupling", 82],
      ["phase", 112],
      ["warp", 77],
    ] as const) {
      expect(
        pointCloudSignature(
          sampleEquationPoints(
            "coupled-pendulum",
            { ...parameters, [key]: value },
            2400,
          ),
        ),
        `${key} should materially change the sampled equation`,
      ).not.toBe(baseline);
    }

    const source = readFileSync(join(appDir, "editorial-pattern-renderer.tsx"), "utf8");
    expect(source).toContain('"Geist Variable", Geist');
    expect(source).not.toContain("Inter Variable");
    expect(editorialTemplates.some(({ text }) => text.some(({ fontSize }) => fontSize >= 0.2))).toBe(true);
  });

  it("builds deterministic short multicolor segments", () => {
    const points = sampleEquationPoints(
      "standing-wave",
      { coupling: 52, phase: 24, resonance: 6, symmetry: 8, warp: 41 },
      6400,
    );
    const defaults = {
      colorSpread: 88,
      randomSeed: 123456,
      randomness: 55,
      segmentSize: 0.5,
    };
    const segments = buildPatternSegments(points, defaults);
    const repeated = buildPatternSegments(points, defaults);
    const shortest = buildPatternSegments(points, { ...defaults, segmentSize: 0.35 });
    const uniform = buildPatternSegments(points, { ...defaults, randomness: 0 });
    const irregular = buildPatternSegments(points, { ...defaults, randomness: 100 });

    expect(segments).toEqual(repeated);
    expect(segments.length).toBeGreaterThan(180);
    expect(shortest.length).toBeGreaterThan(segments.length);
    expect(new Set(segments.map(({ colorIndex }) => colorIndex))).toEqual(new Set([0, 1, 2]));
    expect(new Set(uniform.map(({ points: itemPoints }) => itemPoints.length)).size).toBeLessThanOrEqual(3);
    expect(new Set(irregular.map(({ points: itemPoints }) => itemPoints.length)).size).toBeGreaterThan(5);
    expect(segments[0]?.points[0]).toEqual(points[0]);
    expect(segments.at(-1)?.points.at(-1)).toEqual(points.at(-1));

    const lowResolution = buildPatternSegments(
      sampleEquationPoints(
        "standing-wave",
        { coupling: 52, phase: 24, resonance: 6, symmetry: 8, warp: 41 },
        1200,
      ),
      defaults,
    );
    expect(lowResolution.map(({ colorIndex }) => colorIndex)).toEqual(
      segments.map(({ colorIndex }) => colorIndex),
    );
    expect(lowResolution).toHaveLength(segments.length);
  });

  it("generates deterministic contrast-aware harmony palettes", () => {
    const current = ["#171717", "#FF4F8A", "#4A6CFF"] as const;
    const lightPalette = createHarmoniousPalette(current, "#F3F0E8");
    const repeated = createHarmoniousPalette(current, "#F3F0E8");
    const next = createHarmoniousPalette(lightPalette, "#F3F0E8");
    const darkPalette = createHarmoniousPalette(current, "#10131A");

    expect(lightPalette).toEqual(repeated);
    expect(next).not.toEqual(lightPalette);
    for (const color of [...lightPalette, ...darkPalette]) {
      expect(color).toMatch(/^#[0-9A-F]{6}$/);
    }
    for (const color of lightPalette) {
      expect(contrastRatio(color, "#F3F0E8")).toBeGreaterThan(2.5);
    }
    for (const color of darkPalette) {
      expect(contrastRatio(color, "#10131A")).toBeGreaterThan(2.5);
    }
  });

  it("exports the poster through the standard image helper", () => {
    const source = readFileSync(join(appDir, "editorial-pattern-renderer.tsx"), "utf8");
    expect(source).toContain("createToolcraftPngExportCanvas");
    expect(source).toContain("shouldIncludeToolcraftPreviewBackground");
    expect(source).toContain('state.values["export.image.resolution"]');
    expect(source).toContain('state.values["export.image.format"]');
    expect(getControlByTarget("export.image.resolution")?.options?.map(({ value }) => value)).toEqual([
      "2k",
      "4k",
      "8k",
    ]);
  });

  it("declares persistent product working state", () => {
    expect(appSchema.persistence).toEqual({
      include: ["values", "canvas", "panels"],
      key: "toolcraft:editorial-pattern-studio:state:v3",
      storage: "localStorage",
      version: 3,
    });
  });
});
