import type { ToolcraftState } from "@/toolcraft/runtime";

import type {
  MicrographElement,
  PosterScene,
  RenderedElement,
} from "./poster-types";
import {
  isMicrographTemplateId,
  micrographTemplateIds,
  templateAspect,
  templateSizeClass,
  templateTier,
  templatesForKit,
  type MicrographKitId,
  type MicrographTemplateId,
} from "./template-catalog";
import { generateTemplateContent } from "./template-content";
import { buildTemplatePrimitives, parseTemplateContent } from "./template-renderers";

export { generateTemplateContent } from "./template-content";

export function seededRandom(seed: number): () => number {
  let value = Math.floor(seed) % 2147483647;
  if (value <= 0) {
    value += 2147483646;
  }

  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function numberValue(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function colorValue(value: unknown, fallback: string): string {
  const candidate =
    typeof value === "object" && value !== null && "hex" in value
      ? (value as { hex?: unknown }).hex
      : value;
  return typeof candidate === "string" && /^#[0-9a-f]{3,8}$/i.test(candidate)
    ? candidate
    : fallback;
}

function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length) % items.length] as T;
}

type SceneConfig = {
  background: string;
  canvasHeight: number;
  canvasWidth: number;
  count: number;
  globalOpacity: number;
  glow: number;
  includeBackground: boolean;
  ink: string;
  kit: MicrographKitId;
  scale: number;
  seed: number;
  templateTier: "both" | "mega" | "simple";
};

function readConfig(state: ToolcraftState): SceneConfig {
  const values = state.values;
  const kitValue = stringValue(values["composition.kit"], "full");
  const templateTierValue = stringValue(
    values["composition.templateTier"],
    "both",
  );

  return {
    background: colorValue(values["appearance.background"], "#141414"),
    canvasHeight: state.canvas.size.height,
    canvasWidth: state.canvas.size.width,
    count: Math.round(clamp(numberValue(values["composition.count"], 8), 3, 16)),
    globalOpacity: clamp(numberValue(values["elements.opacity"], 100), 30, 100) / 100,
    glow: clamp(numberValue(values["ink.glow"], 0), 0, 100) / 100,
    includeBackground: values["export.includeBackground"] !== false,
    ink: colorValue(values["ink.color"], "#FFFFFF"),
    kit: (["data", "full", "minimal", "technical", "typographic"] as const).includes(
      kitValue as MicrographKitId,
    )
      ? (kitValue as MicrographKitId)
      : "full",
    scale: clamp(numberValue(values["elements.scale"], 100), 60, 160),
    seed: Math.round(clamp(numberValue(values["composition.seed"], 137), 1, 999)),
    templateTier: (["both", "mega", "simple"] as const).includes(
      templateTierValue as SceneConfig["templateTier"],
    )
      ? (templateTierValue as SceneConfig["templateTier"])
      : "both",
  };
}

type PlacedRect = { height: number; width: number; x: number; y: number };

function overlapArea(a: PlacedRect, b: PlacedRect, gap: number): number {
  const width =
    Math.min(a.x + a.width + gap, b.x + b.width + gap) - Math.max(a.x - gap, b.x - gap);
  const height =
    Math.min(a.y + a.height + gap, b.y + b.height + gap) - Math.max(a.y - gap, b.y - gap);
  return Math.max(0, width) * Math.max(0, height);
}

function elementSize(
  template: MicrographTemplateId,
  config: SceneConfig,
  rng: () => number,
): { height: number; width: number } {
  const shorter = Math.min(config.canvasWidth, config.canvasHeight);
  const scale = config.scale / 100;
  const sizeClass = templateSizeClass(template);
  const aspect = templateAspect(template);
  const widthFactors: Record<ReturnType<typeof templateSizeClass>, [number, number]> = {
    hero: [0.34, 0.5],
    medium: [0.2, 0.28],
    small: [0.15, 0.21],
    strip: [0.3, 0.44],
    tall: [0.12, 0.16],
  };
  const [minFactor, maxFactor] = widthFactors[sizeClass];
  const width = shorter * (minFactor + rng() * (maxFactor - minFactor)) * scale;
  const height = width / aspect;

  return {
    height: clamp(height, 40, config.canvasHeight * 0.7),
    width: clamp(width, 60, config.canvasWidth * 0.85),
  };
}

function chooseTemplates(
  config: SceneConfig,
  rng: () => number,
): MicrographTemplateId[] {
  const simplePool = templatesForKit(config.kit).filter(
    (id) => templateTier(id) === "simple",
  );
  const megaPool = micrographTemplateIds.filter(
    (id) => templateTier(id) === "mega",
  );
  const pool =
    config.templateTier === "simple"
      ? simplePool
      : config.templateTier === "mega"
        ? megaPool
        : [...simplePool, ...megaPool];
  const heroPool = pool.filter((template) => templateSizeClass(template) === "hero");
  const chosen: MicrographTemplateId[] = [];

  if (
    config.templateTier === "both" &&
    simplePool.length > 0 &&
    megaPool.length > 0 &&
    config.count >= 2
  ) {
    chosen.push(pick(rng, megaPool), pick(rng, simplePool));
  } else if (heroPool.length > 0) {
    chosen.push(pick(rng, heroPool));
  }

  const chosenSet = new Set(chosen);
  const shuffled = pool
    .filter((template) => !chosenSet.has(template))
    .sort(() => rng() - 0.5);
  while (chosen.length < config.count) {
    const next =
      shuffled[(chosen.length - chosenSet.size) % Math.max(1, shuffled.length)];
    chosen.push(next ?? pick(rng, pool));
  }

  return chosen.slice(0, config.count);
}

export function generateElements(state: ToolcraftState): MicrographElement[] {
  const config = readConfig(state);
  const rng = seededRandom(config.seed * 7919 + config.count * 97);
  const templates = chooseTemplates(config, rng);
  const margin = Math.min(config.canvasWidth, config.canvasHeight) * 0.055;
  const placed: PlacedRect[] = [];
  const gap = margin * 0.45;

  const grid = Math.max(8, Math.round(Math.min(config.canvasWidth, config.canvasHeight) / 45));

  return templates.map((template, index) => {
    let { height, width } = elementSize(template, config, rng);
    let best: PlacedRect = { height, width, x: margin, y: margin };
    let bestOverlap = Number.POSITIVE_INFINITY;

    for (let round = 0; round < 3 && bestOverlap > 0; round += 1) {
      if (round > 0) {
        width *= 0.82;
        height *= 0.82;
      }
      const maxX = Math.max(margin, config.canvasWidth - margin - width);
      const maxY = Math.max(margin, config.canvasHeight - margin - height);

      for (let attempt = 0; attempt < 60 && bestOverlap > 0; attempt += 1) {
        const candidate: PlacedRect = {
          height,
          width,
          x: Math.min(maxX, margin + Math.round((rng() * (maxX - margin)) / grid) * grid),
          y: Math.min(maxY, margin + Math.round((rng() * (maxY - margin)) / grid) * grid),
        };
        const overlap = placed.reduce(
          (total, other) => total + overlapArea(candidate, other, gap),
          0,
        );
        if (overlap < bestOverlap) {
          best = candidate;
          bestOverlap = overlap;
        }
      }
    }

    placed.push(best);
    const elementSeed = config.seed * 1009 + index * 131;

    return {
      content: generateTemplateContent(template, elementSeed),
      height: Math.round(best.height),
      id: `gen-${config.seed}-${index + 1}`,
      opacity: 100,
      seed: elementSeed,
      template,
      typeScale: 100,
      width: Math.round(best.width),
      x: Math.round(best.x),
      y: Math.round(best.y),
    };
  });
}

export function parseElements(value: unknown): MicrographElement[] {
  let candidates: unknown = value;

  if (typeof value === "string") {
    try {
      candidates = JSON.parse(value);
    } catch {
      candidates = [];
    }
  }

  if (!Array.isArray(candidates)) {
    return [];
  }

  return candidates.flatMap((candidate, index) => {
    if (typeof candidate !== "object" || candidate === null) {
      return [];
    }

    const item = candidate as Partial<MicrographElement>;
    const legacyTone = (candidate as { tone?: unknown }).tone;
    if (
      !isMicrographTemplateId(item.template) ||
      !Number.isFinite(item.x) ||
      !Number.isFinite(item.y) ||
      !Number.isFinite(item.width) ||
      !Number.isFinite(item.height)
    ) {
      return [];
    }

    return [
      {
        color:
          typeof item.color === "string" && /^#[0-9a-f]{3,8}$/i.test(item.color)
            ? item.color
            : legacyTone === "dark"
              ? "#0F0F0F"
              : undefined,
        content:
          typeof item.content === "string"
            ? item.content
            : generateTemplateContent(item.template, numberValue(item.seed, index + 1)),
        height: clamp(Number(item.height), 30, 4096),
        id: typeof item.id === "string" ? item.id : `element-${index + 1}`,
        opacity: clamp(numberValue(item.opacity, 100), 10, 100),
        removed: item.removed === true ? true : undefined,
        seed: Math.round(numberValue(item.seed, index + 1)),
        template: item.template,
        typeScale: clamp(numberValue(item.typeScale, 100), 50, 200),
        width: clamp(Number(item.width), 40, 4096),
        x: Number(item.x),
        y: Number(item.y),
      },
    ];
  });
}

function renderElement(element: MicrographElement): RenderedElement {
  const unit = Math.min(element.width, element.height);
  const strokeWidth = clamp(unit * 0.009, 1, 2.2);
  const lines = parseTemplateContent(element.content);
  const rng = seededRandom(element.seed * 6053 + 29);

  return {
    ...element,
    primitives: buildTemplatePrimitives(element.template, {
      height: element.height,
      lines,
      rng,
      stroke: strokeWidth,
      typeScale: element.typeScale / 100,
      width: element.width,
    }),
    strokeWidth,
  };
}

export function buildPosterScene(state: ToolcraftState): PosterScene {
  const config = readConfig(state);
  const authored = parseElements(state.values["composition.layout"]);
  const authoredIds = new Set(authored.map((element) => element.id));
  const generated = generateElements(state).filter(
    (element) => !authoredIds.has(element.id),
  );
  const merged: MicrographElement[] = [
    ...generated,
    ...authored.filter((element) => !element.removed),
  ];

  return {
    background: config.background,
    elements: merged.map(renderElement),
    globalOpacity: config.globalOpacity,
    glow: config.glow,
    includeBackground: config.includeBackground,
    ink: config.ink,
  };
}

export function serializeElements(
  elements: readonly MicrographElement[],
): MicrographElement[] {
  return elements.map(
    ({ color, content, height, id, opacity, removed, seed, template, typeScale, width, x, y }) => ({
      ...(color ? { color } : {}),
      content,
      height,
      id,
      opacity,
      ...(removed ? { removed } : {}),
      seed,
      template,
      typeScale,
      width,
      x,
      y,
    }),
  );
}

export type ContentCellRef = {
  column: number;
  row: number;
};

export function findContentCell(
  content: string,
  text: string,
  occurrence: number,
): ContentCellRef | null {
  const needle = text.trim();
  if (!needle) {
    return null;
  }
  const lines = content.split(/\r?\n/);
  let seen = 0;

  for (let row = 0; row < lines.length; row += 1) {
    const line = lines[row] ?? "";
    if (/^-{3,}$/.test(line.trim())) {
      continue;
    }
    const cells = line.split("|");
    for (let column = 0; column < cells.length; column += 1) {
      if ((cells[column] ?? "").trim() === needle) {
        if (seen === occurrence) {
          return { column, row };
        }
        seen += 1;
      }
    }
    if (cells.length > 1 && cells.map((cell) => cell.trim()).join(" ") === needle) {
      if (seen === occurrence) {
        return { column: -1, row };
      }
      seen += 1;
    }
  }

  return null;
}

export function setContentCell(
  content: string,
  ref: ContentCellRef,
  value: string,
): string {
  const lines = content.split(/\r?\n/);
  while (lines.length <= ref.row) {
    lines.push("");
  }

  if (ref.column < 0) {
    lines[ref.row] = value;
  } else {
    const cells = (lines[ref.row] ?? "").split("|").map((cell) => cell.trim());
    while (cells.length <= ref.column) {
      cells.push("");
    }
    cells[ref.column] = value.trim();
    lines[ref.row] = cells.join(" | ");
  }

  return lines.join("\n");
}

export function elementInk(
  scene: PosterScene,
  element: Pick<MicrographElement, "color">,
): string {
  return element.color ?? scene.ink;
}

export function elementPaper(scene: PosterScene): string {
  return scene.background;
}
