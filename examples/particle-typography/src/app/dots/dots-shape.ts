import type {
  DotParticle,
  DotPlan,
  DotPoint,
  DotsSettings,
} from "./dots-types";
import { createDotMotionProfile } from "./dots-motion";

const planCache = new Map<string, DotPlan>();
const maximumParticleCount = 2_400;

type DotCandidate = Readonly<{
  normal: DotPoint | null;
  point: DotPoint;
  scale: DotPoint;
}>;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function hashUnit(value: number): number {
  const x = Math.sin(value * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function applyTextCase(text: string, textCase: DotsSettings["typography"]["textCase"]): string {
  switch (textCase) {
    case "uppercase":
      return text.toUpperCase();
    case "lowercase":
      return text.toLowerCase();
    case "capitalize":
      return text.replace(/(^|\s)(\S)/g, (_match, prefix: string, letter: string) =>
        `${prefix}${letter.toUpperCase()}`,
      );
    case "titleCase":
      return text
        .toLowerCase()
        .replace(/(^|\s)(\S)/g, (_match, prefix: string, letter: string) =>
          `${prefix}${letter.toUpperCase()}`,
        );
    default:
      return text;
  }
}

const letterSpacingScale = {
  tight: -0.025,
  tighter: -0.05,
  normal: 0,
  wide: 0.025,
  wider: 0.05,
  widest: 0.1,
} as const;

const lineHeightScale = {
  loose: 1.08,
  none: 1,
  normal: 1.04,
  relaxed: 1.06,
  snug: 1.02,
  tight: 0.96,
} as const;

function measureSpacedText(
  context: CanvasRenderingContext2D,
  text: string,
  letterSpacing: number,
): number {
  let width = 0;
  for (let index = 0; index < text.length; index += 1) {
    width += context.measureText(text[index] ?? "").width;
    if (index < text.length - 1) width += letterSpacing;
  }
  return width;
}

function drawSpacedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  letterSpacing: number,
): void {
  let cursor = x;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index] ?? "";
    context.fillText(character, cursor, y);
    cursor += context.measureText(character).width + letterSpacing;
  }
}

function makeMask(settings: DotsSettings): {
  data: Uint8ClampedArray;
  height: number;
  width: number;
} {
  const aspect = settings.canvas.width / settings.canvas.height;
  const maxSide = 560;
  const width = Math.max(320, Math.round(aspect >= 1 ? maxSide : maxSide * aspect));
  const height = Math.max(320, Math.round(aspect >= 1 ? maxSide / aspect : maxSide));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Dot Formation requires a 2D text mask context.");

  const text = applyTextCase(settings.text.trim() || "N", settings.typography.textCase);
  const logicalScale = height / settings.canvas.height;
  let fontSize = Math.max(8, settings.typography.fontSize * logicalScale);
  const family = settings.typography.family.replaceAll('"', "");
  context.font = `${settings.typography.fontWeight} ${fontSize}px "${family}", sans-serif`;
  const spacingRatio = letterSpacingScale[settings.typography.letterSpacing];
  let letterSpacing = fontSize * spacingRatio;
  const availableWidth = width * 0.84;
  const measuredWidth = measureSpacedText(context, text, letterSpacing);
  if (measuredWidth > availableWidth) {
    const fitScale = availableWidth / measuredWidth;
    fontSize *= fitScale;
    letterSpacing *= fitScale;
    context.font = `${settings.typography.fontWeight} ${fontSize}px "${family}", sans-serif`;
  }

  const textWidth = measureSpacedText(context, text, letterSpacing);
  context.fillStyle = "#FFFFFF";
  context.textAlign = "left";
  context.textBaseline = "middle";
  context.save();
  context.translate(width / 2, height / 2);
  context.scale(1, lineHeightScale[settings.typography.lineHeight]);
  drawSpacedText(context, text, -textWidth / 2, 0, letterSpacing);
  context.restore();

  return {
    data: context.getImageData(0, 0, width, height).data,
    height,
    width,
  };
}

function collectCandidates(settings: DotsSettings): {
  fill: DotCandidate[];
  interior: DotCandidate[];
  outline: DotCandidate[];
} {
  const { data, height, width } = makeMask(settings);
  const fill: DotCandidate[] = [];
  const interior: DotCandidate[] = [];
  const outline: DotCandidate[] = [];
  const alphaAt = (x: number, y: number): number => {
    if (x < 0 || x >= width || y < 0 || y >= height) return 0;
    return data[(y * width + x) * 4 + 3] ?? 0;
  };
  const step = Math.max(
    1,
    Math.ceil(
      Math.sqrt((width * height) / Math.max(12_000, maximumParticleCount * 12)),
    ),
  );
  const outlineDepthSteps = 5;
  const directions = [
    { x: -1, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: -1 },
    { x: 0, y: 1 },
  ] as const;

  for (let y = 1; y < height - 1; y += step) {
    for (let x = 1; x < width - 1; x += step) {
      if (alphaAt(x, y) < 96) continue;
      const point = { x: (x + 0.5) / width, y: (y + 0.5) / height };
      let normal: DotPoint | null = null;
      const edgeOffset = step * outlineDepthSteps;
      let normalX = 0;
      let normalY = 0;
      let firstTransparent: DotPoint | null = null;
      for (const direction of directions) {
        if (
          alphaAt(
            x + direction.x * edgeOffset,
            y + direction.y * edgeOffset,
          ) >= 80
        ) {
          continue;
        }
        firstTransparent ??= direction;
        normalX += direction.x;
        normalY += direction.y;
      }
      if (firstTransparent) {
        const normalLength = Math.hypot(normalX, normalY);
        normal =
          normalLength > 0.001
            ? { x: normalX / normalLength, y: normalY / normalLength }
            : firstTransparent;
      }
      const candidate = {
        normal,
        point,
        scale: { x: 1 / width, y: 1 / height },
      } as const;
      fill.push(candidate);
      if (normal) {
        outline.push(candidate);
      } else {
        interior.push(candidate);
      }
    }
  }

  if (fill.length === 0) {
    fill.push({
      normal: null,
      point: { x: 0.5, y: 0.5 },
      scale: { x: 1 / width, y: 1 / height },
    });
  }
  if (outline.length === 0) outline.push(...fill);
  if (interior.length === 0) interior.push(...fill);
  return { fill, interior, outline };
}

function greatestCommonDivisor(left: number, right: number): number {
  let a = Math.abs(left);
  let b = Math.abs(right);
  while (b !== 0) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }
  return a;
}

function candidateStride(length: number): number {
  if (length <= 1) return 1;
  let stride = Math.max(1, Math.floor(length * 0.61803398875));
  while (greatestCommonDivisor(stride, length) !== 1) {
    stride += 1;
  }
  return stride;
}

function selectCandidate(
  candidates: readonly DotCandidate[],
  index: number,
  salt: number,
): DotCandidate {
  const length = Math.max(1, candidates.length);
  const stride = candidateStride(length);
  const offset = Math.floor(hashUnit(salt) * length);
  const source = candidates[(offset + index * stride) % length] ?? candidates[0]!;
  const repeat = Math.floor(index / Math.max(1, candidates.length));
  const spread = repeat === 0 ? 0 : 0.0025 * Math.min(4, repeat);
  const angle = hashUnit(index * 3.17 + salt) * Math.PI * 2;
  return {
    ...source,
    point: {
      x: clamp01(source.point.x + Math.cos(angle) * spread),
      y: clamp01(source.point.y + Math.sin(angle) * spread),
    },
  };
}

function applyEdgeSpill(
  candidate: DotCandidate,
  seed: number,
  amount: number,
): DotPoint {
  if (amount <= 0.0001) return candidate.point;
  const { normal, point, scale } = candidate;
  if (!normal) {
    const angle = hashUnit(seed + 151.3) * Math.PI * 2;
    const distance = amount * hashUnit(seed + 167.9) * 2.5;
    return {
      x: clamp01(point.x + Math.cos(angle) * distance * scale.x),
      y: clamp01(point.y + Math.sin(angle) * distance * scale.y),
    };
  }

  const participation = 0.35 + amount * 0.65;
  if (hashUnit(seed + 109.7) > participation) return point;
  const tangent = (hashUnit(seed + 127.1) - 0.5) * 0.9;
  const directionX = normal.x - normal.y * tangent;
  const directionY = normal.y + normal.x * tangent;
  const directionLength = Math.max(0.0001, Math.hypot(directionX, directionY));
  const distance = amount * (5 + hashUnit(seed + 139.3) * 25);
  return {
    x: clamp01(point.x + (directionX / directionLength) * distance * scale.x),
    y: clamp01(point.y + (directionY / directionLength) * distance * scale.y),
  };
}

function mixedCandidateIndex(index: number): {
  localIndex: number;
  source: "interior" | "outline";
} {
  const group = Math.floor(index / 5);
  const remainder = index % 5;
  if (remainder < 2) {
    return { localIndex: group * 2 + remainder, source: "outline" };
  }
  return { localIndex: group * 3 + remainder - 2, source: "interior" };
}

function startPoint(
  index: number,
  count: number,
  seed: number,
  settings: DotsSettings,
): DotPoint {
  if (settings.particles.launch === "scatter") {
    return {
      x: 0.04 + hashUnit(seed + 20) * 0.92,
      y: 0.04 + hashUnit(seed + 40) * 0.92,
    };
  }

  if (settings.particles.launch === "grid") {
    const aspect = settings.canvas.width / settings.canvas.height;
    const columns = Math.max(2, Math.ceil(Math.sqrt(count * aspect)));
    const rows = Math.max(2, Math.ceil(count / columns));
    return {
      x: 0.06 + ((index % columns) / Math.max(1, columns - 1)) * 0.88,
      y: 0.06 + (Math.floor(index / columns) / Math.max(1, rows - 1)) * 0.88,
    };
  }

  const laneCount = Math.max(1, Math.min(4, Math.ceil(count / 600)));
  const lane = index % laneCount;
  const laneIndex = Math.floor(index / laneCount);
  const laneLength = Math.max(1, Math.ceil((count - lane) / laneCount));
  const angle =
    (laneIndex / laneLength) * Math.PI * 2 -
    Math.PI / 2 +
    (lane / laneCount) * 0.012;
  const laneOffset = (lane - (laneCount - 1) / 2) * 0.024;
  const jitter = (hashUnit(seed + 8) - 0.5) * 0.008;
  return {
    x: 0.5 + Math.cos(angle) * (0.43 + laneOffset + jitter),
    y: 0.5 + Math.sin(angle) * (0.44 + laneOffset + jitter),
  };
}

function planKey(settings: DotsSettings): string {
  return JSON.stringify({
    canvas: settings.canvas,
    count: settings.particles.count,
    distribution: settings.particles.distribution,
    edgeSpill: settings.particles.edgeSpill,
    launch: settings.particles.launch,
    text: settings.text,
    typography: settings.typography,
  });
}

export function clearDotPlanCache(): void {
  planCache.clear();
}

export function getDotPlan(settings: DotsSettings): DotPlan {
  const key = planKey(settings);
  const cached = planCache.get(key);
  if (cached) return cached;

  const candidates = collectCandidates(settings);
  const particles: DotParticle[] = [];
  for (let index = 0; index < settings.particles.count; index += 1) {
    const seed = hashUnit(index * 1.618 + 0.013) * 10_000;
    const mixed = mixedCandidateIndex(index);
    const source = settings.particles.distribution === "outline"
      ? candidates.outline
      : settings.particles.distribution === "fill"
        ? candidates.fill
        : candidates[mixed.source];
    const sourceIndex =
      settings.particles.distribution === "mixed" ? mixed.localIndex : index;
    const sourceSalt =
      settings.particles.distribution === "outline"
        ? 11.3
        : settings.particles.distribution === "fill"
          ? 23.7
          : mixed.source === "outline"
            ? 37.1
            : 49.9;
    const candidate = selectCandidate(source, sourceIndex, sourceSalt);
    particles.push({
      index,
      motion: createDotMotionProfile(seed),
      seed,
      start: startPoint(index, settings.particles.count, seed, settings),
      target: applyEdgeSpill(candidate, seed, settings.particles.edgeSpill),
    });
  }
  const plan = { key, particles } as const;
  planCache.set(key, plan);
  if (planCache.size > 12) planCache.delete(planCache.keys().next().value ?? key);
  return plan;
}
