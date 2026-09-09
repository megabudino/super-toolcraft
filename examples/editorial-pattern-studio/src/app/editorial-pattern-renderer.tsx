import * as React from "react";

import {
  createToolcraftPngExportCanvas,
  shouldIncludeToolcraftPreviewBackground,
  type ToolcraftState,
} from "@/toolcraft/runtime";
import {
  type ToolcraftPanelActionHandler,
  useToolcraft,
} from "@/toolcraft/runtime/react";

import {
  getEditorialTemplate,
  resolveEditorialCopy,
  type EditorialTemplate,
  type EditorialTextSource,
} from "./editorial-templates";
import { createCompositionShuffle } from "./composition-shuffle";
import { editorialPatternDefaultValues } from "./editorial-pattern-defaults";
import {
  createHarmoniousPalette,
  interpolateHexColor,
} from "./palette-harmonies";
import {
  getEquationDisplayLines,
  isEquationId,
  sampleEquationPoints,
  type EquationId,
  type EquationParameters,
} from "./pattern-equations";
import { useMorphingEquationPoints } from "./pattern-morphing";
import {
  buildPatternSegments,
  createPatternSeed,
  type PatternSegment,
} from "./pattern-segmentation";

type PosterSettings = {
  background: string;
  body: string;
  colorA: string;
  colorB: string;
  colorC: string;
  colorSpread: number;
  coupling: number;
  detail: number;
  detailInk: string;
  eyebrow: string;
  footer: string;
  headline: string;
  headlineInk: string;
  phase: number;
  position: { x: number; y: number };
  preset: EquationId;
  resonance: number;
  ruleInk: string;
  scale: number;
  segmentRandomness: number;
  segmentSize: number;
  stroke: number;
  symmetry: number;
  template: EditorialTemplate;
  customCopy: boolean;
  warp: number;
};

type TextBlock = {
  align?: CanvasTextAlign;
  color: string;
  colorRole: "detail" | "headline";
  fontSize: number;
  fontWeight: number;
  letterSpacing?: number;
  lineHeight: number;
  lines: readonly string[];
  maxWidth: number;
  opacity: number;
  rotation: number;
  testId: string;
  x: number;
  y: number;
};

type RuleLine = {
  color: string;
  kind: "construction" | "editorial";
  opacity: number;
  strokeWidth: number;
  x1: number;
  x2: number;
  y1: number;
  y2: number;
};

type EditorialScene = {
  rules: readonly RuleLine[];
  text: readonly TextBlock[];
};

type PatternAppearance = {
  background: string;
  centerX: number;
  centerY: number;
  colorA: string;
  colorB: string;
  colorC: string;
  colorSpread: number;
  detailInk: string;
  headlineInk: string;
  radius: number;
  ruleInk: string;
  segmentRandomness: number;
  segmentSize: number;
  stroke: number;
};

const fontFamily = '"Geist Variable", Geist, Arial, sans-serif';

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function asColor(value: unknown, fallback: string): string {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object") {
    const hex = (value as { hex?: unknown }).hex;
    if (typeof hex === "string") {
      return hex;
    }
  }

  return fallback;
}

function asNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asPosition(
  value: unknown,
  fallback: { readonly x: number; readonly y: number },
): { x: number; y: number } {
  if (!value || typeof value !== "object") {
    return { x: fallback.x, y: fallback.y };
  }

  const candidate = value as { x?: unknown; y?: unknown };
  return {
    x: asNumber(candidate.x, fallback.x),
    y: asNumber(candidate.y, fallback.y),
  };
}

export function readPosterSettings(state: ToolcraftState): PosterSettings {
  const presetValue = state.values["pattern.preset"];
  const template = getEditorialTemplate(
    asString(
      state.values["editorial.template"],
      editorialPatternDefaultValues["editorial.template"],
    ),
  );
  const customCopy = asBoolean(
    state.values["editorial.customCopy"],
    editorialPatternDefaultValues["editorial.customCopy"],
  );
  const copy = resolveEditorialCopy(template, customCopy, {
    body: asString(
      state.values["editorial.body"],
      editorialPatternDefaultValues["editorial.body"],
    ),
    eyebrow: asString(
      state.values["editorial.eyebrow"],
      editorialPatternDefaultValues["editorial.eyebrow"],
    ),
    footer: asString(
      state.values["editorial.footer"],
      editorialPatternDefaultValues["editorial.footer"],
    ),
    headline: asString(
      state.values["editorial.headline"],
      editorialPatternDefaultValues["editorial.headline"],
    ),
  });

  return {
    background: asColor(
      state.values["appearance.background"],
      editorialPatternDefaultValues["appearance.background"],
    ),
    body: copy.body,
    colorA: asColor(
      state.values["pattern.colorA"],
      editorialPatternDefaultValues["pattern.colorA"],
    ),
    colorB: asColor(
      state.values["pattern.colorB"],
      editorialPatternDefaultValues["pattern.colorB"],
    ),
    colorC: asColor(
      state.values["pattern.colorC"],
      editorialPatternDefaultValues["pattern.colorC"],
    ),
    colorSpread: asNumber(
      state.values["pattern.colorSpread"],
      editorialPatternDefaultValues["pattern.colorSpread"],
    ),
    coupling: asNumber(
      state.values["pattern.coupling"],
      editorialPatternDefaultValues["pattern.coupling"],
    ),
    detail: Math.round(
      asNumber(
        state.values["pattern.detail"],
        editorialPatternDefaultValues["pattern.detail"],
      ),
    ),
    detailInk: asColor(
      state.values["appearance.detail"],
      editorialPatternDefaultValues["appearance.detail"],
    ),
    eyebrow: copy.eyebrow,
    footer: copy.footer,
    headline: copy.headline,
    headlineInk: asColor(
      state.values["appearance.headline"],
      editorialPatternDefaultValues["appearance.headline"],
    ),
    customCopy,
    phase: asNumber(
      state.values["pattern.phase"],
      editorialPatternDefaultValues["pattern.phase"],
    ),
    position: asPosition(
      state.values["pattern.position"],
      editorialPatternDefaultValues["pattern.position"],
    ),
    preset: isEquationId(presetValue)
      ? presetValue
      : editorialPatternDefaultValues["pattern.preset"],
    resonance: asNumber(
      state.values["pattern.resonance"],
      editorialPatternDefaultValues["pattern.resonance"],
    ),
    ruleInk: asColor(
      state.values["appearance.rule"],
      editorialPatternDefaultValues["appearance.rule"],
    ),
    scale: asNumber(
      state.values["pattern.scale"],
      editorialPatternDefaultValues["pattern.scale"],
    ),
    segmentRandomness: asNumber(
      state.values["pattern.segmentRandomness"],
      editorialPatternDefaultValues["pattern.segmentRandomness"],
    ),
    segmentSize: asNumber(
      state.values["pattern.segmentSize"],
      editorialPatternDefaultValues["pattern.segmentSize"],
    ),
    stroke: asNumber(
      state.values["pattern.stroke"],
      editorialPatternDefaultValues["pattern.stroke"],
    ),
    symmetry: asNumber(
      state.values["pattern.symmetry"],
      editorialPatternDefaultValues["pattern.symmetry"],
    ),
    template,
    warp: asNumber(
      state.values["pattern.warp"],
      editorialPatternDefaultValues["pattern.warp"],
    ),
  };
}

function getEquationParameters(settings: PosterSettings): EquationParameters {
  return {
    coupling: settings.coupling,
    phase: settings.phase,
    resonance: settings.resonance,
    symmetry: settings.symmetry,
    warp: settings.warp,
  };
}

function getPatternSeed(): number {
  return createPatternSeed(["editorial-pattern-stable-segments"]);
}

function createPosterPatternSegments(settings: PosterSettings): readonly PatternSegment[] {
  const points = sampleEquationPoints(
    settings.preset,
    getEquationParameters(settings),
    settings.detail,
  );

  return buildPatternSegments(points, {
    colorSpread: settings.colorSpread,
    randomSeed: getPatternSeed(),
    randomness: settings.segmentRandomness,
    segmentSize: settings.segmentSize,
  });
}

function wrapText(value: string, maxCharacters: number): string[] {
  const result: string[] = [];

  for (const explicitLine of value.replace(/\r/g, "").split("\n")) {
    const words = explicitLine.trim().split(/\s+/).filter(Boolean);

    if (words.length === 0) {
      result.push("");
      continue;
    }

    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (candidate.length <= maxCharacters || !line) {
        line = candidate;
      } else {
        result.push(line);
        line = word;
      }
    }
    result.push(line);
  }

  return result;
}

function createTextBlock(
  value: string,
  options: Omit<TextBlock, "lines"> & { maxCharacters: number },
): TextBlock {
  const { maxCharacters, ...block } = options;
  return { ...block, lines: wrapText(value, maxCharacters) };
}

const textRoleTestIds: Record<EditorialTextSource, string> = {
  body: "poster-body",
  equation: "poster-equation",
  eyebrow: "poster-eyebrow",
  footer: "poster-footer",
  headline: "poster-headline",
  marker: "poster-marker",
};

function getTextRoleValue(
  source: EditorialTextSource,
  settings: PosterSettings,
  equation: string,
): string {
  switch (source) {
    case "body":
      return settings.body;
    case "equation":
      return equation;
    case "eyebrow":
      return settings.eyebrow;
    case "footer":
      return settings.footer;
    case "headline":
      return settings.headline;
    case "marker":
      return settings.template.copy.marker;
  }
}

function getTextRoleColor(
  source: EditorialTextSource,
  settings: PosterSettings,
): string {
  return source === "headline" || source === "marker"
    ? settings.headlineInk
    : settings.detailInk;
}

function createGridRules(
  template: EditorialTemplate,
  width: number,
  height: number,
  color: string,
): RuleLine[] {
  const rules: RuleLine[] = [];
  const { grid } = template;
  const x1 = width * grid.marginX;
  const x2 = width * (1 - grid.marginX);
  const y1 = height * grid.marginY;
  const y2 = height * (1 - grid.marginY);
  const strokeWidth = Math.max(0.45, width * 0.00065);

  if (grid.showColumns) {
    for (let column = 0; column <= grid.columns; column += 1) {
      const x = x1 + ((x2 - x1) * column) / grid.columns;
      rules.push({ color, kind: "construction", opacity: grid.opacity, strokeWidth, x1: x, x2: x, y1, y2 });
    }
  }

  if (grid.showRows) {
    for (let row = 0; row <= grid.rows; row += 1) {
      const y = y1 + ((y2 - y1) * row) / grid.rows;
      rules.push({ color, kind: "construction", opacity: grid.opacity, strokeWidth, x1, x2, y1: y, y2: y });
    }
  }

  return rules;
}

function getEditorialScene(
  settings: PosterSettings,
  width: number,
  height: number,
): EditorialScene {
  const equation = getEquationDisplayLines(
    settings.preset,
    getEquationParameters(settings),
  ).join("\n");
  const template = settings.template;
  const rules = [
    ...createGridRules(template, width, height, settings.ruleInk),
    ...template.rules.map((rule) => ({
      color: settings.ruleInk,
      kind: "editorial" as const,
      opacity: rule.opacity,
      strokeWidth: Math.max(0.7, width * 0.001 * (rule.weight ?? 1)),
      x1: width * rule.x1,
      x2: width * rule.x2,
      y1: height * rule.y1,
      y2: height * rule.y2,
    })),
  ];
  const text: TextBlock[] = template.text.map((spec) => {
    const fontSize = width * spec.fontSize;
    return createTextBlock(getTextRoleValue(spec.source, settings, equation), {
      align: spec.align ?? "left",
      color: getTextRoleColor(spec.source, settings),
      colorRole:
        spec.source === "headline" || spec.source === "marker" ? "headline" : "detail",
      fontSize,
      fontWeight: spec.fontWeight,
      letterSpacing: fontSize * (spec.letterSpacingEm ?? 0),
      lineHeight: fontSize * spec.lineHeight,
      maxCharacters: spec.maxCharacters,
      maxWidth: width * spec.maxWidth,
      opacity: 1,
      rotation: spec.rotation ?? 0,
      testId: textRoleTestIds[spec.source],
      x: width * spec.x,
      y: height * spec.y,
    });
  });
  template.annotations.forEach((annotation) => {
    const fontSize = width * annotation.fontSize;
    text.push(createTextBlock(annotation.content, {
      align: annotation.align ?? "left",
      color: settings.detailInk,
      colorRole: "detail",
      fontSize,
      fontWeight: annotation.fontWeight,
      letterSpacing: fontSize * (annotation.letterSpacingEm ?? 0),
      lineHeight: fontSize * annotation.lineHeight,
      maxCharacters: annotation.maxCharacters,
      maxWidth: width * annotation.maxWidth,
      opacity: annotation.opacity ?? 0.86,
      rotation: annotation.rotation ?? 0,
      testId: `poster-annotation-${annotation.id}`,
      x: width * annotation.x,
      y: height * annotation.y,
    }));
  });

  return { rules, text };
}

function getPatternTransform(settings: PosterSettings, width: number, height: number) {
  const radius = Math.min(width, height) * settings.template.pattern.radius * (settings.scale / 100);
  return {
    centerX: width * (settings.template.pattern.centerX + settings.position.x * 0.32),
    centerY: height * (settings.template.pattern.centerY + settings.position.y * 0.22),
    radius,
  };
}

function interpolateNumber(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

function interpolatePatternAppearance(
  from: PatternAppearance,
  to: PatternAppearance,
  progress: number,
): PatternAppearance {
  const amount = Math.min(1, Math.max(0, progress));
  return {
    background: interpolateHexColor(from.background, to.background, amount),
    centerX: interpolateNumber(from.centerX, to.centerX, amount),
    centerY: interpolateNumber(from.centerY, to.centerY, amount),
    colorA: interpolateHexColor(from.colorA, to.colorA, amount),
    colorB: interpolateHexColor(from.colorB, to.colorB, amount),
    colorC: interpolateHexColor(from.colorC, to.colorC, amount),
    colorSpread: interpolateNumber(from.colorSpread, to.colorSpread, amount),
    detailInk: interpolateHexColor(from.detailInk, to.detailInk, amount),
    headlineInk: interpolateHexColor(from.headlineInk, to.headlineInk, amount),
    radius: interpolateNumber(from.radius, to.radius, amount),
    ruleInk: interpolateHexColor(from.ruleInk, to.ruleInk, amount),
    segmentRandomness: interpolateNumber(
      from.segmentRandomness,
      to.segmentRandomness,
      amount,
    ),
    segmentSize: interpolateNumber(from.segmentSize, to.segmentSize, amount),
    stroke: interpolateNumber(from.stroke, to.stroke, amount),
  };
}

function usePatternAppearanceTransition(
  target: PatternAppearance,
  transitionKey: string,
  morph: { key: string; progress: number },
): PatternAppearance {
  const [transition, setTransition] = React.useState(() => ({
    from: target,
    key: transitionKey,
    to: target,
  }));
  const displayedRef = React.useRef(target);
  const isCurrentTransition = transition.key === transitionKey && morph.key === transitionKey;
  const displayed = isCurrentTransition
    ? interpolatePatternAppearance(
        transition.from,
        transition.to,
        morph.progress < 0.5
          ? 4 * morph.progress ** 3
          : 1 - ((-2 * morph.progress + 2) ** 3) / 2,
      )
    : displayedRef.current;

  React.useLayoutEffect(() => {
    displayedRef.current = displayed;
  }, [displayed]);

  React.useLayoutEffect(() => {
    if (transition.key === transitionKey) {
      return;
    }
    setTransition({
      from: displayedRef.current,
      key: transitionKey,
      to: target,
    });
  }, [target, transition.key, transitionKey]);

  return displayed;
}

function SvgTextBlock({
  block,
  detailInk,
  headlineInk,
}: {
  block: TextBlock;
  detailInk: string;
  headlineInk: string;
}) {
  return (
    <text
      data-toolcraft-product-text=""
      data-testid={block.testId}
      fill={block.colorRole === "headline" ? headlineInk : detailInk}
      fontFamily={fontFamily}
      fontSize={block.fontSize}
      fontWeight={block.fontWeight}
      letterSpacing={block.letterSpacing}
      opacity={block.opacity}
      textAnchor={block.align === "right" ? "end" : block.align === "center" ? "middle" : "start"}
      transform={block.rotation ? `rotate(${block.rotation} ${block.x} ${block.y})` : undefined}
      x={block.x}
      y={block.y}
    >
      {block.lines.map((line, index) => (
        <tspan dy={index === 0 ? 0 : block.lineHeight} key={`${line}-${index}`} x={block.x}>
          {line || " "}
        </tspan>
      ))}
    </text>
  );
}

function drawTextBlock(context: CanvasRenderingContext2D, block: TextBlock) {
  context.save();
  context.globalAlpha = block.opacity;
  context.fillStyle = block.color;
  context.font = `${block.fontWeight} ${block.fontSize}px ${fontFamily}`;
  context.textAlign = block.align ?? "left";
  context.textBaseline = "alphabetic";
  if ("letterSpacing" in context) {
    (context as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${block.letterSpacing ?? 0}px`;
  }
  context.translate(block.x, block.y);
  context.rotate((block.rotation * Math.PI) / 180);
  block.lines.forEach((line, index) => {
    context.fillText(line, 0, index * block.lineHeight, block.maxWidth);
  });
  context.restore();
}

function drawRuleLine(context: CanvasRenderingContext2D, rule: RuleLine) {
  context.save();
  context.globalAlpha = rule.opacity;
  context.strokeStyle = rule.color;
  context.lineWidth = rule.strokeWidth;
  context.beginPath();
  context.moveTo(rule.x1, rule.y1);
  context.lineTo(rule.x2, rule.y2);
  context.stroke();
  context.restore();
}

function renderPosterToCanvas(
  context: CanvasRenderingContext2D,
  settings: PosterSettings,
  width: number,
  height: number,
  includeBackground: boolean,
) {
  if (includeBackground) {
    context.fillStyle = settings.background;
    context.fillRect(0, 0, width, height);
  }

  const scene = getEditorialScene(settings, width, height);
  scene.rules.forEach((rule) => drawRuleLine(context, rule));

  const patternSegments = createPosterPatternSegments(settings);
  const { centerX, centerY, radius } = getPatternTransform(settings, width, height);
  const palette = [settings.colorA, settings.colorB, settings.colorC];
  context.save();
  context.translate(centerX, centerY);
  context.scale(radius, radius);
  context.lineWidth = settings.stroke / radius;
  context.lineJoin = "round";
  context.lineCap = "round";
  patternSegments.forEach((segment) => {
    const first = segment.points[0];
    if (!first) return;
    context.beginPath();
    context.moveTo(first[0], first[1]);
    for (let pointIndex = 1; pointIndex < segment.points.length; pointIndex += 1) {
      const point = segment.points[pointIndex];
      if (point) context.lineTo(point[0], point[1]);
    }
    context.strokeStyle = palette[segment.colorIndex] ?? settings.colorA;
    context.stroke();
  });
  context.restore();
  scene.text.forEach((block) => drawTextBlock(context, block));
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Image export could not encode the poster."));
      },
      mimeType,
      0.94,
    );
  });
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

async function exportPoster({
  reportProgress,
  state,
}: Pick<Parameters<ToolcraftPanelActionHandler>[0], "reportProgress" | "state">) {
  reportProgress(0.08);
  await document.fonts.ready;
  const settings = readPosterSettings(state);
  const includeBackground = shouldIncludeToolcraftPreviewBackground({ state });
  const imageResolution = asString(state.values["export.image.resolution"], "4k");
  const format = asString(state.values["export.image.format"], "png");
  const canvas = createToolcraftPngExportCanvas({
    background: settings.background,
    includeBackground: includeBackground,
    render: ({ context, cssHeight, cssWidth }) => {
      renderPosterToCanvas(
        context,
        settings,
        cssWidth,
        cssHeight,
        false,
      );
    },
    resolution: imageResolution,
    state,
  });
  reportProgress(0.76);
  const isJpg = format === "jpg";
  const blob = await canvasToBlob(canvas, isJpg ? "image/jpeg" : "image/png");
  reportProgress(0.96);
  downloadBlob(blob, `editorial-pattern.${isJpg ? "jpg" : "png"}`);
  reportProgress(1);
}

export const handleEditorialPatternPanelAction: ToolcraftPanelActionHandler = ({
  action,
  dispatch,
  reportProgress,
  state,
}) => {
  if (action.value === "shuffle-composition") {
    const settings = readPosterSettings(state);
    const values = createCompositionShuffle({
      background: settings.background,
      colorA: settings.colorA,
      colorB: settings.colorB,
      colorC: settings.colorC,
      coupling: settings.coupling,
      detailInk: settings.detailInk,
      headlineInk: settings.headlineInk,
      phase: settings.phase,
      preset: settings.preset,
      resonance: settings.resonance,
      ruleInk: settings.ruleInk,
      symmetry: settings.symmetry,
      templateId: settings.template.id,
      warp: settings.warp,
    }, {
      preserveColors: asBoolean(
        state.values["composition.preserveColors"],
        editorialPatternDefaultValues["composition.preserveColors"],
      ),
    });

    Object.entries(values).forEach(([target, value]) => {
      dispatch({
        label: "Shuffle composition",
        target,
        type: "controls.setValue",
        value,
      });
    });
    return;
  }

  if (action.value === "shuffle-palette") {
    const settings = readPosterSettings(state);
    const palette = createHarmoniousPalette(
      [settings.colorA, settings.colorB, settings.colorC],
      settings.background,
    );

    (["pattern.colorA", "pattern.colorB", "pattern.colorC"] as const).forEach(
      (target, index) => {
        dispatch({
          label: "Shuffle line palette",
          target,
          type: "controls.setValue",
          value: palette[index],
        });
      },
    );
    return;
  }

  if (action.value === "export-png") {
    return exportPoster({ reportProgress, state });
  }
};

export function EditorialPatternRenderer(): React.JSX.Element {
  const { state } = useToolcraft();
  const settings = readPosterSettings(state);
  const { width, height } = state.canvas.size;
  const includeBackground = shouldIncludeToolcraftPreviewBackground({ state });
  const targetEquationPoints = React.useMemo(
    () => sampleEquationPoints(
      settings.preset,
      getEquationParameters(settings),
      settings.detail,
    ),
    [
      settings.coupling,
      settings.detail,
      settings.phase,
      settings.preset,
      settings.resonance,
      settings.symmetry,
      settings.warp,
    ],
  );
  const targetTransform = React.useMemo(
    () => getPatternTransform(settings, width, height),
    [
      height,
      settings.position.x,
      settings.position.y,
      settings.scale,
      settings.template,
      width,
    ],
  );
  const targetAppearance = React.useMemo<PatternAppearance>(
    () => ({
      background: settings.background,
      centerX: targetTransform.centerX,
      centerY: targetTransform.centerY,
      colorA: settings.colorA,
      colorB: settings.colorB,
      colorC: settings.colorC,
      colorSpread: settings.colorSpread,
      detailInk: settings.detailInk,
      headlineInk: settings.headlineInk,
      radius: targetTransform.radius,
      ruleInk: settings.ruleInk,
      segmentRandomness: settings.segmentRandomness,
      segmentSize: settings.segmentSize,
      stroke: settings.stroke,
    }),
    [
      settings.background,
      settings.colorA,
      settings.colorB,
      settings.colorC,
      settings.colorSpread,
      settings.detailInk,
      settings.headlineInk,
      settings.ruleInk,
      settings.segmentRandomness,
      settings.segmentSize,
      settings.stroke,
      targetTransform.centerX,
      targetTransform.centerY,
      targetTransform.radius,
    ],
  );
  const transitionKey = React.useMemo(
    () => [
      settings.preset,
      settings.symmetry,
      settings.resonance,
      settings.coupling,
      settings.phase,
      settings.warp,
      settings.detail,
      settings.template.id,
      targetAppearance.centerX,
      targetAppearance.centerY,
      targetAppearance.radius,
      targetAppearance.stroke,
      targetAppearance.segmentSize,
      targetAppearance.segmentRandomness,
      targetAppearance.colorSpread,
      targetAppearance.colorA,
      targetAppearance.colorB,
      targetAppearance.colorC,
      targetAppearance.background,
      targetAppearance.headlineInk,
      targetAppearance.detailInk,
      targetAppearance.ruleInk,
    ].join("|"),
    [
      settings.coupling,
      settings.detail,
      settings.phase,
      settings.preset,
      settings.resonance,
      settings.symmetry,
      settings.template.id,
      settings.warp,
      targetAppearance,
    ],
  );
  const morph = useMorphingEquationPoints(targetEquationPoints, transitionKey, {
    durationMs: 480,
    maxPointCount: 1_200,
  });
  const appearance = usePatternAppearanceTransition(
    targetAppearance,
    transitionKey,
    morph,
  );
  const patternSeed = React.useMemo(() => getPatternSeed(), []);
  const patternSegments = React.useMemo(
    () => buildPatternSegments(morph.points, {
      colorSpread: appearance.colorSpread,
      randomSeed: patternSeed,
      randomness: appearance.segmentRandomness,
      segmentSize: appearance.segmentSize,
    }),
    [
      appearance.colorSpread,
      appearance.segmentRandomness,
      appearance.segmentSize,
      morph.points,
      patternSeed,
    ],
  );
  const scene = React.useMemo(
    () => getEditorialScene(settings, width, height),
    [
      height,
      settings.body,
      settings.coupling,
      settings.detailInk,
      settings.eyebrow,
      settings.footer,
      settings.headline,
      settings.headlineInk,
      settings.phase,
      settings.preset,
      settings.resonance,
      settings.ruleInk,
      settings.symmetry,
      settings.template,
      settings.warp,
      width,
    ],
  );
  const palette = [appearance.colorA, appearance.colorB, appearance.colorC];

  return (
    <svg
      aria-label="Editorial pattern poster"
      className="block size-full"
      data-background-included={includeBackground ? "true" : "false"}
      data-background-color={appearance.background}
      data-detail-color={appearance.detailInk}
      data-editorial-template={settings.template.id}
      data-headline-color={appearance.headlineInk}
      data-layout={settings.template.id}
      data-pattern-color-spread={settings.colorSpread.toFixed(0)}
      data-pattern-coupling={settings.coupling.toFixed(0)}
      data-pattern-phase={settings.phase.toFixed(0)}
      data-pattern-preset={settings.preset}
      data-pattern-morph-progress={morph.progress.toFixed(3)}
      data-pattern-morphing={morph.isMorphing ? "true" : "false"}
      data-pattern-position-x={settings.position.x.toFixed(3)}
      data-pattern-position-y={settings.position.y.toFixed(3)}
      data-pattern-randomness={settings.segmentRandomness.toFixed(0)}
      data-pattern-resonance={settings.resonance.toFixed(0)}
      data-pattern-segment-size={settings.segmentSize.toFixed(2)}
      data-pattern-symmetry={settings.symmetry.toFixed(0)}
      data-pattern-warp={settings.warp.toFixed(0)}
      data-rule-color={appearance.ruleInk}
      data-text-element-count={scene.text.length}
      data-toolcraft-product-output=""
      data-testid="editorial-pattern-output"
      preserveAspectRatio="none"
      role="img"
      viewBox={`0 0 ${width} ${height}`}
    >
      {includeBackground ? (
        <rect data-testid="poster-background" fill={appearance.background} height={height} width={width} />
      ) : null}
      <g data-testid="editorial-grid" fill="none">
        {scene.rules.map((rule, index) => (
          <line
            data-editorial-rule-kind={rule.kind}
            data-testid={index === 0 ? "editorial-rule" : undefined}
            key={`rule-${index}`}
            opacity={rule.opacity}
            stroke={appearance.ruleInk}
            strokeWidth={rule.strokeWidth}
            x1={rule.x1}
            x2={rule.x2}
            y1={rule.y1}
            y2={rule.y2}
          />
        ))}
      </g>
      <g
        data-pattern-transform={`${appearance.centerX.toFixed(3)} ${appearance.centerY.toFixed(3)} ${appearance.radius.toFixed(3)}`}
        data-testid="pattern-layer"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform={`translate(${appearance.centerX} ${appearance.centerY}) scale(${appearance.radius})`}
      >
        {patternSegments.map((segment, index) => (
          <path
            d={segment.d}
            data-pattern-color-index={segment.colorIndex}
            data-pattern-line-color={palette[segment.colorIndex]}
            data-pattern-segment={index}
            key={`segment-${index}`}
            stroke={palette[segment.colorIndex]}
            strokeWidth={appearance.stroke}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>
      {scene.text.map((block) => (
        <SvgTextBlock
          block={block}
          detailInk={appearance.detailInk}
          headlineInk={appearance.headlineInk}
          key={block.testId}
        />
      ))}
    </svg>
  );
}
