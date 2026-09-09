import {
  clamp,
  getGlobalAngularRipple,
  getLoopClosedGlobalPhase,
  getLoopProgress,
  getWaveDisplacement,
  hash01,
  TAU,
} from "./dot-ring-wave";
import type {
  DotRingColorStop,
  DotRingFrameBead,
  DotRingFrameGeometry,
  DotRingFrameGeometryOptions,
  DotRingRenderOptions,
  DotRingSettings,
  DotRingSpatialFrameBead,
  DotRingSpatialFrameGeometry,
} from "./dot-ring-types";

export {
  getDotRingSettingsFromState,
  getDotRingVideoSettingsFromState,
} from "./dot-ring-settings";
export type {
  DotRingAudioFrame,
  DotRingAudioProfile,
  DotRingColorStop,
  DotRingFrameBead,
  DotRingFrameGeometry,
  DotRingFrameGeometryOptions,
  DotRingRenderOptions,
  DotRingSettings,
  DotRingSpatialFrameBead,
  DotRingSpatialFrameGeometry,
  DotRingVideoSettings,
  DotRingWaveFormula,
} from "./dot-ring-types";

type RenderBead = {
  index: number;
  intensity: number;
  targetX: number;
  targetY: number;
  x: number;
  y: number;
};

export function getDotRingBeadExtentScale(glowStrength: number): number {
  return 1 + clamp(glowStrength, 0, 1) * 2.2;
}

export function getDotRingMaxBeadScale(
  settings: Pick<DotRingSettings, "dotSize" | "sizeResponse">,
): number {
  const response = clamp(settings.sizeResponse, 0, 100) / 100;

  return clamp(settings.dotSize * (1 + response * 1.25), 0.3, 3.2);
}

function getDotRingBeadScale(
  settings: Pick<DotRingSettings, "dotSize" | "sizeResponse">,
  intensity: number,
): number {
  const response = clamp(settings.sizeResponse, 0, 100) / 100;

  if (response <= 0) {
    return clamp(settings.dotSize, 0.3, 3.2);
  }

  const shaped = clamp(intensity, 0, 1) ** 0.85;

  return clamp(
    settings.dotSize * (1 - 0.3 * response + 1.55 * response * shaped),
    0.3,
    3.2,
  );
}

function pickFillStyle(
  fillStyles: readonly string[],
  index: number,
  row: number,
  spread: number,
): string {
  if (fillStyles.length === 1 || spread <= 0) {
    return fillStyles[0]!;
  }

  const spreadRatio = spread / 100;
  const randomValue = hash01(index * 17 + row * 91);

  if (randomValue > spreadRatio) {
    return fillStyles[0]!;
  }

  const stopIndex =
    1 +
    Math.floor(
      hash01(index * 47 + row * 131) * (fillStyles.length - 1),
    );
  return fillStyles[stopIndex] ?? fillStyles[0]!;
}

function pickModeFillStyle(
  fillStyles: readonly string[],
  bead: DotRingSpatialFrameBead,
  options: Pick<DotRingFrameGeometryOptions, "height" | "settings" | "width">,
): string {
  const { colorMode, colorSpread } = options.settings;

  if (fillStyles.length === 1) {
    return fillStyles[0]!;
  }

  if (colorMode === "rows") {
    return fillStyles[bead.row % fillStyles.length] ?? fillStyles[0]!;
  }

  if (colorMode === "conic") {
    const angle = Math.atan2(
      bead.y - options.height / 2,
      bead.x - options.width / 2,
    );
    const jitter = (hash01(bead.index * 13 + bead.row * 101) - 0.5) * 0.05;
    const position = angle / TAU + 0.75 + jitter;
    const normalized = position - Math.floor(position);
    const stopIndex = Math.min(
      fillStyles.length - 1,
      Math.floor(normalized * fillStyles.length),
    );

    return fillStyles[stopIndex] ?? fillStyles[0]!;
  }

  if (colorMode === "energy") {
    const jitter = (hash01(bead.index * 23 + bead.row * 57) - 0.5) * 0.24;
    const position = clamp(bead.intensity * 1.06 - 0.03 + jitter, 0, 0.999);
    const stopIndex = Math.floor(position * fillStyles.length);

    return fillStyles[stopIndex] ?? fillStyles[0]!;
  }

  return pickFillStyle(fillStyles, bead.index, bead.row, colorSpread);
}

function stopToFillStyle(stop: DotRingColorStop): string {
  const alpha = clamp(stop.opacity, 0, 100) / 100;
  const hex = stop.color.replace("#", "");
  const expanded =
    hex.length === 3
      ? hex
          .split("")
          .map((part) => `${part}${part}`)
          .join("")
      : hex.slice(0, 6);
  const numeric = Number.parseInt(expanded, 16);
  const red = (numeric >> 16) & 255;
  const green = (numeric >> 8) & 255;
  const blue = numeric & 255;

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function relaxRingBeads(
  beads: RenderBead[],
  minimumDistance: number,
  iterations: number,
): void {
  if (beads.length < 2 || minimumDistance <= 0) {
    return;
  }

  const minimumDistanceSquared = minimumDistance * minimumDistance;

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    for (let index = 0; index < beads.length; index += 1) {
      const current = beads[index]!;
      const next = beads[(index + 1) % beads.length]!;
      let dx = next.x - current.x;
      let dy = next.y - current.y;
      let distanceSquared = dx * dx + dy * dy;

      if (distanceSquared >= minimumDistanceSquared) {
        continue;
      }

      if (distanceSquared < 0.000001) {
        dx = next.targetX - current.targetX;
        dy = next.targetY - current.targetY;
        distanceSquared = dx * dx + dy * dy || 1;
      }

      const distance = Math.sqrt(distanceSquared);
      const push = ((minimumDistance - distance) / Math.max(0.001, distance)) * 0.5;
      const offsetX = dx * push;
      const offsetY = dy * push;

      current.x -= offsetX;
      current.y -= offsetY;
      next.x += offsetX;
      next.y += offsetY;
    }

    for (const bead of beads) {
      bead.x += (bead.targetX - bead.x) * 0.08;
      bead.y += (bead.targetY - bead.y) * 0.08;
    }
  }
}

function setBeadRadius(
  bead: RenderBead,
  centerX: number,
  centerY: number,
  radius: number,
): void {
  const angle = Math.atan2(bead.targetY - centerY, bead.targetX - centerX);
  const x = centerX + Math.cos(angle) * radius;
  const y = centerY + Math.sin(angle) * radius;

  bead.targetX = x;
  bead.targetY = y;
  bead.x = x;
  bead.y = y;
}

function closeRingSeam(
  beads: RenderBead[],
  centerX: number,
  centerY: number,
): void {
  if (beads.length < 6) return;

  const blendCount = Math.max(
    2,
    Math.min(Math.floor((beads.length - 2) / 2), Math.ceil(beads.length * 0.04)),
  );
  const start = beads[beads.length - blendCount - 1]!;
  const end = beads[blendCount]!;
  const startRadius = Math.hypot(
    start.targetX - centerX,
    start.targetY - centerY,
  );
  const endRadius = Math.hypot(
    end.targetX - centerX,
    end.targetY - centerY,
  );
  const stepCount = blendCount * 2 + 1;

  const applyStep = (bead: RenderBead, step: number): void => {
    const progress = step / stepCount;
    const easedProgress = progress * progress * (3 - 2 * progress);
    setBeadRadius(
      bead,
      centerX,
      centerY,
      startRadius + (endRadius - startRadius) * easedProgress,
    );
  };

  for (let offset = 0; offset < blendCount; offset += 1) {
    applyStep(
      beads[beads.length - blendCount + offset]!,
      offset + 1,
    );
    applyStep(
      beads[offset]!,
      blendCount + offset + 1,
    );
  }
}

function getDotRingFrameMetrics({
  height,
  settings,
  width,
}: Pick<
  DotRingFrameGeometryOptions,
  "height" | "settings" | "width"
>): Readonly<{
  beadRadius: number;
  rowSpacing: number;
  safeRadius: number;
}> {
  const safeRadius = Math.min(
    settings.radius,
    Math.min(width, height) * 0.46,
  );
  const maxDensityRadius =
    (TAU * safeRadius) / Math.max(12, settings.density) * 0.43;
  const beadRadius = clamp(
    Math.min(safeRadius * 0.011, maxDensityRadius),
    1.35,
    4.8,
  );

  return {
    beadRadius,
    rowSpacing: beadRadius * 2.55,
    safeRadius,
  };
}

export function getDotRingBaseOuterRadius(
  options: Pick<
    DotRingFrameGeometryOptions,
    "height" | "settings" | "width"
  >,
): number {
  const { beadRadius, rowSpacing, safeRadius } =
    getDotRingFrameMetrics(options);
  const visualBeadRadius =
    beadRadius *
    getDotRingMaxBeadScale(options.settings) *
    getDotRingBeadExtentScale(options.settings.glow / 100);

  return (
    safeRadius +
    ((options.settings.rows - 1) / 2) * rowSpacing +
    visualBeadRadius
  );
}

export function getDotRingSpatialFrameGeometry({
  audioProfile,
  durationSeconds,
  height,
  settings,
  timeSeconds,
  width,
}: DotRingFrameGeometryOptions): DotRingSpatialFrameGeometry {
  const { density, rows } = settings;
  const centerX = width / 2;
  const centerY = height / 2;
  const { beadRadius, rowSpacing, safeRadius } = getDotRingFrameMetrics({
    height,
    settings,
    width,
  });
  const progress = getLoopProgress(timeSeconds, durationSeconds);
  const globalBreathingPhase = getLoopClosedGlobalPhase(
    progress,
    settings.globalRotationSpeed,
  );
  const intensityScale =
    settings.affectedAmplitude * 1.15 + settings.calmAmplitude * 0.75 + 4;
  const frameBeads: DotRingSpatialFrameBead[] = [];

  for (let row = 0; row < rows; row += 1) {
    const rowOffset = (row - (rows - 1) / 2) * rowSpacing;
    const rowDensity = Math.max(12, Math.round(density * (1 - row * 0.035)));
    const rowTimeSeconds = timeSeconds - row * settings.rowEchoSeconds;
    const rowProgress = getLoopProgress(rowTimeSeconds, durationSeconds);
    const beads: RenderBead[] = [];

    for (let index = 0; index < rowDensity; index += 1) {
      const normalized = index / rowDensity;
      const angle = normalized * TAU;
      const beadIndex = index + row * 997;
      const jitterAngle = (hash01(beadIndex + 29) - 0.5) * 0.012;
      const displacement = getWaveDisplacement(
        angle,
        beadIndex,
        row,
        settings,
        audioProfile,
        durationSeconds,
        rowProgress,
        rowTimeSeconds,
      );
      const currentRadius = safeRadius + rowOffset + displacement;
      const drawAngle =
        angle +
        globalBreathingPhase +
        getGlobalAngularRipple(angle, row, progress, settings.globalRotationSpeed) +
        jitterAngle;
      const x = centerX + Math.cos(drawAngle) * currentRadius;
      const y = centerY + Math.sin(drawAngle) * currentRadius;

      beads.push({
        index,
        intensity: Math.min(1, Math.abs(displacement) / intensityScale),
        targetX: x,
        targetY: y,
        x,
        y,
      });
    }

    closeRingSeam(beads, centerX, centerY);
    relaxRingBeads(beads, beadRadius * 2.08, 3);

    for (const bead of beads) {
      frameBeads.push({
        index: bead.index,
        intensity: bead.intensity,
        row,
        scale: getDotRingBeadScale(settings, bead.intensity),
        x: bead.x,
        y: bead.y,
      });
    }
  }

  return {
    beadRadius,
    beads: frameBeads,
  };
}

export function getDotRingFrameGeometry(
  options: DotRingFrameGeometryOptions,
): DotRingFrameGeometry {
  const geometry = getDotRingSpatialFrameGeometry(options);
  const fillStyles = options.settings.palette.map(stopToFillStyle);
  const frameBeads: DotRingFrameBead[] = geometry.beads.map((bead) => ({
    fillStyle: pickModeFillStyle(fillStyles, bead, options),
    row: bead.row,
    scale: bead.scale,
    x: bead.x,
    y: bead.y,
  }));

  return {
    beadRadius: geometry.beadRadius,
    beads: frameBeads,
    glowStrength: clamp(options.settings.glow, 0, 100) / 100,
  };
}

const GLOW_SPRITE_SIZE = 96;
const GLOW_SPRITE_CACHE_LIMIT = 48;
const glowSpriteCache = new Map<string, HTMLCanvasElement>();

function getGlowSprite(fillStyle: string): HTMLCanvasElement | null {
  const cached = glowSpriteCache.get(fillStyle);

  if (cached) {
    return cached;
  }

  if (typeof document === "undefined") {
    return null;
  }

  const colorMatch = fillStyle.match(
    /rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/,
  );

  if (!colorMatch) {
    return null;
  }

  const sprite = document.createElement("canvas");
  sprite.width = GLOW_SPRITE_SIZE;
  sprite.height = GLOW_SPRITE_SIZE;
  const spriteContext = sprite.getContext("2d");

  if (!spriteContext) {
    return null;
  }

  const [, red, green, blue, alpha] = colorMatch;
  const half = GLOW_SPRITE_SIZE / 2;
  const baseAlpha = Number.parseFloat(alpha ?? "1");
  const gradient = spriteContext.createRadialGradient(
    half,
    half,
    0,
    half,
    half,
    half,
  );
  const stopColor = (opacity: number): string =>
    `rgba(${red}, ${green}, ${blue}, ${(opacity * baseAlpha).toFixed(4)})`;

  gradient.addColorStop(0, stopColor(0.85));
  gradient.addColorStop(0.24, stopColor(0.5));
  gradient.addColorStop(0.55, stopColor(0.16));
  gradient.addColorStop(1, stopColor(0));
  spriteContext.fillStyle = gradient;
  spriteContext.fillRect(0, 0, GLOW_SPRITE_SIZE, GLOW_SPRITE_SIZE);

  if (glowSpriteCache.size >= GLOW_SPRITE_CACHE_LIMIT) {
    glowSpriteCache.clear();
  }

  glowSpriteCache.set(fillStyle, sprite);
  return sprite;
}

function drawDotRingGeometryRange({
  context,
  endIndex,
  geometry,
  startIndex,
}: {
  context: CanvasRenderingContext2D;
  endIndex: number;
  geometry: DotRingFrameGeometry;
  startIndex: number;
}): void {
  const beadsByFill = new Map<string, DotRingFrameBead[]>();

  for (let index = startIndex; index < endIndex; index += 1) {
    const bead = geometry.beads[index]!;
    const matchingBeads = beadsByFill.get(bead.fillStyle);

    if (matchingBeads) {
      matchingBeads.push(bead);
    } else {
      beadsByFill.set(bead.fillStyle, [bead]);
    }
  }

  if (geometry.glowStrength > 0) {
    const extentScale = getDotRingBeadExtentScale(geometry.glowStrength);

    context.save();
    context.globalCompositeOperation = "lighter";
    context.globalAlpha = Math.min(1, 0.18 + geometry.glowStrength * 0.62);

    for (const [fillStyle, beads] of beadsByFill) {
      const sprite = getGlowSprite(fillStyle);

      if (!sprite) continue;

      for (const bead of beads) {
        const glowRadius = geometry.beadRadius * bead.scale * extentScale;

        context.drawImage(
          sprite,
          bead.x - glowRadius,
          bead.y - glowRadius,
          glowRadius * 2,
          glowRadius * 2,
        );
      }
    }

    context.restore();
  }

  for (const [fillStyle, beads] of beadsByFill) {
    context.fillStyle = fillStyle;
    context.beginPath();

    for (const bead of beads) {
      const beadRadius = geometry.beadRadius * bead.scale;

      context.moveTo(bead.x + beadRadius, bead.y);
      context.arc(bead.x, bead.y, beadRadius, 0, TAU);
    }

    context.fill();
  }
}

export function drawDotRingGeometryRow({
  context,
  geometry,
  row,
}: {
  context: CanvasRenderingContext2D;
  geometry: DotRingFrameGeometry;
  row: number;
}): void {
  const startIndex = geometry.beads.findIndex((bead) => bead.row === row);

  if (startIndex < 0) return;

  let endIndex = startIndex + 1;
  while (
    endIndex < geometry.beads.length &&
    geometry.beads[endIndex]!.row === row
  ) {
    endIndex += 1;
  }

  drawDotRingGeometryRange({
    context,
    endIndex,
    geometry,
    startIndex,
  });
}

export function drawDotRingGeometry({
  context,
  geometry,
}: {
  context: CanvasRenderingContext2D;
  geometry: DotRingFrameGeometry;
}): void {
  for (let rowStart = 0; rowStart < geometry.beads.length; ) {
    const row = geometry.beads[rowStart]!.row;
    let rowEnd = rowStart + 1;

    while (
      rowEnd < geometry.beads.length &&
      geometry.beads[rowEnd]!.row === row
    ) {
      rowEnd += 1;
    }

    drawDotRingGeometryRange({
      context,
      endIndex: rowEnd,
      geometry,
      startIndex: rowStart,
    });
    rowStart = rowEnd;
  }
}

export function drawDotRingFrame({
  audioProfile,
  clearCanvas = true,
  context,
  drawBackground,
  durationSeconds,
  height,
  settings,
  timeSeconds,
  width,
}: DotRingRenderOptions): void {
  const geometry = getDotRingFrameGeometry({
    audioProfile,
    durationSeconds,
    height,
    settings,
    timeSeconds,
    width,
  });

  if (clearCanvas) {
    context.clearRect(0, 0, width, height);
  }

  if (drawBackground) {
    context.fillStyle = settings.background;
    context.fillRect(0, 0, width, height);
  }

  drawDotRingGeometry({ context, geometry });
}
