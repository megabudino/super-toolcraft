import {
  blitSampleImage,
  clamp,
  coordinateNoise,
  getScatterOpacity,
  luminance,
  rgb,
  rgba,
} from "../dither-utils";
import type { DitherEffectRenderContext } from "./types";

type GridCell = {
  alpha: number;
  blue: number;
  centerX: number;
  centerY: number;
  green: number;
  red: number;
  sizeX: number;
  sizeY: number;
  tone: number;
  x: number;
  y: number;
};

type GridWalkOptions = {
  columnOffset?: boolean;
  endRow?: number;
  salt?: number;
  startRow?: number;
};

const microCellThreshold = 2.6;
const detailCellThreshold = 10;

function isMicroGrid(renderContext: DitherEffectRenderContext): boolean {
  return (
    Math.min(renderContext.scaleX, renderContext.scaleY) < microCellThreshold
  );
}

function hasDetailedCells(renderContext: DitherEffectRenderContext): boolean {
  const cssCell =
    renderContext.cssWidth / Math.max(1, renderContext.snapshot.width);
  return cssCell >= detailCellThreshold;
}

function exposureScaleOf(renderContext: DitherEffectRenderContext): number {
  return renderContext.settings.exposure / 100;
}

function fillThresholdOf(renderContext: DitherEffectRenderContext): number {
  return 1 - renderContext.settings.fill / 100;
}

function forEachGridCell(
  renderContext: DitherEffectRenderContext,
  callback: (cell: GridCell) => void,
  options: GridWalkOptions = {},
): void {
  const { scaleX, scaleY, settings, snapshot } = renderContext;
  const skipThreshold = fillThresholdOf(renderContext);
  const salt = options.salt ?? 11;
  const startRow = Math.max(0, Math.floor(options.startRow ?? 0));
  const endRow = Math.min(
    snapshot.height,
    Math.max(startRow, Math.ceil(options.endRow ?? snapshot.height)),
  );

  for (let y = startRow; y < endRow; y += 1) {
    for (let x = 0; x < snapshot.width; x += 1) {
      const index = (y * snapshot.width + x) * 4;
      const tone = luminance(snapshot.data, index);
      if (tone < skipThreshold) continue;

      const offsetY = options.columnOffset && x % 2 === 1 ? 0.5 : 0;
      callback({
        alpha: getScatterOpacity(settings, x, y, salt),
        blue: snapshot.data[index + 2],
        centerX: (x + 0.5) * scaleX,
        centerY: (y + 0.5 + offsetY) * scaleY,
        green: snapshot.data[index + 1],
        red: snapshot.data[index],
        sizeX: scaleX,
        sizeY: scaleY,
        tone,
        x,
        y,
      });
    }
  }
}

function renderMicroGrid(
  renderContext: DitherEffectRenderContext,
  colorForCell: (cell: GridCell) => readonly [number, number, number, number],
  options: GridWalkOptions = {},
): void {
  const { context, outputHeight, outputWidth, snapshot } = renderContext;
  const output = context.createImageData(snapshot.width, snapshot.height);
  forEachGridCell(
    renderContext,
    (cell) => {
      const [red, green, blue, alpha] = colorForCell(cell);
      const index = (cell.y * snapshot.width + cell.x) * 4;
      output.data[index] = red;
      output.data[index + 1] = green;
      output.data[index + 2] = blue;
      output.data[index + 3] = alpha;
    },
    options,
  );
  blitSampleImage(context, output, outputWidth, outputHeight);
}

function exposedChannel(value: number, exposureScale: number): number {
  return Math.min(255, value * exposureScale);
}

export function renderHalftone(renderContext: DitherEffectRenderContext): void {
  const { context, outputHeight, outputWidth, settings, snapshot } =
    renderContext;
  const exposureScale = exposureScaleOf(renderContext);
  const skipThreshold = fillThresholdOf(renderContext);
  const densityBoost = settings.density / 10;

  if (isMicroGrid(renderContext)) {
    renderMicroGrid(
      renderContext,
      (cell) => {
        const contrast = 1 + densityBoost * 0.3 * (1 - cell.tone);
        const coverage = Math.min(1, 0.72 * (0.6 + cell.tone * 0.4) * contrast);
        return [
          exposedChannel(cell.red, exposureScale),
          exposedChannel(cell.green, exposureScale),
          exposedChannel(cell.blue, exposureScale),
          255 * coverage * cell.alpha * cell.alpha,
        ];
      },
      { salt: 11 },
    );
    return;
  }

  const cellSize = Math.min(renderContext.scaleX, renderContext.scaleY);
  const halfCell = cellSize / 2;
  const angle = (45 * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const centerX = outputWidth / 2;
  const centerY = outputHeight / 2;
  const reach = Math.ceil(Math.hypot(outputWidth, outputHeight)) + cellSize * 2;

  const drawDiamond = (
    pointX: number,
    pointY: number,
    radius: number,
    fill: string,
  ): void => {
    context.fillStyle = fill;
    context.save();
    context.translate(pointX, pointY);
    context.rotate(Math.PI / 4);
    context.fillRect(-radius * 0.75, -radius * 0.75, radius * 1.5, radius * 1.5);
    context.restore();
  };

  for (let latticeY = -reach; latticeY < reach; latticeY += cellSize) {
    for (let latticeX = -reach; latticeX < reach; latticeX += cellSize) {
      const pointX = latticeX * cos - latticeY * sin + centerX;
      const pointY = latticeX * sin + latticeY * cos + centerY;
      if (
        pointX < 0 ||
        pointX >= outputWidth ||
        pointY < 0 ||
        pointY >= outputHeight
      ) {
        continue;
      }

      const sampleX = Math.min(
        snapshot.width - 1,
        Math.max(0, Math.floor(pointX / renderContext.scaleX)),
      );
      const sampleY = Math.min(
        snapshot.height - 1,
        Math.max(0, Math.floor(pointY / renderContext.scaleY)),
      );
      const index = (sampleY * snapshot.width + sampleX) * 4;
      const tone = luminance(snapshot.data, index);
      if (tone < skipThreshold) continue;

      const contrast = 1 + densityBoost * 0.3 * (1 - tone);
      const radius = halfCell * 0.85 * (0.6 + tone * 0.4) * contrast;
      if (radius < 0.5) continue;

      const alpha = getScatterOpacity(settings, sampleX, sampleY, 11);
      context.globalAlpha = alpha * alpha;
      drawDiamond(
        pointX,
        pointY,
        radius,
        rgb(
          exposedChannel(snapshot.data[index], exposureScale),
          exposedChannel(snapshot.data[index + 1], exposureScale),
          exposedChannel(snapshot.data[index + 2], exposureScale),
        ),
      );
    }
  }
  context.globalAlpha = 1;
}

function renderDotsRows(
  renderContext: DitherEffectRenderContext,
  startRow: number,
  endRow: number,
): void {
  const { context, settings } = renderContext;
  const exposureScale = exposureScaleOf(renderContext);
  const densityBoost = settings.density / 10;
  const detailed = hasDetailedCells(renderContext);

  forEachGridCell(
    renderContext,
    (cell) => {
      const halfCell = (Math.min(cell.sizeX, cell.sizeY) / 2) * 0.85;
      const contrast = 1 + densityBoost * 0.3 * (1 - cell.tone);
      const radius = halfCell * (0.5 + cell.tone * 0.7) * contrast;
      if (radius < 0.5) return;

      const red = exposedChannel(cell.red * 1.5, exposureScale);
      const green = exposedChannel(cell.green * 1.5, exposureScale);
      const blue = exposedChannel(cell.blue * 1.5, exposureScale);
      if (!detailed) {
        context.globalAlpha = cell.alpha * cell.alpha;
        context.beginPath();
        context.arc(cell.centerX, cell.centerY, radius, 0, Math.PI * 2);
        context.fillStyle = rgb(red, green, blue);
        context.fill();
        return;
      }
      const gradient = context.createRadialGradient(
        cell.centerX - radius * 0.3,
        cell.centerY - radius * 0.3,
        radius * 0.05,
        cell.centerX,
        cell.centerY,
        radius,
      );
      gradient.addColorStop(
        0,
        rgba(
          Math.min(255, red + 80),
          Math.min(255, green + 80),
          Math.min(255, blue + 80),
          1,
        ),
      );
      gradient.addColorStop(0.5, rgba(red, green, blue, 1));
      gradient.addColorStop(
        1,
        rgba(Math.max(0, red - 60), Math.max(0, green - 60), Math.max(0, blue - 60), 0.8),
      );
      context.globalAlpha = cell.alpha * cell.alpha;
      context.beginPath();
      context.arc(cell.centerX, cell.centerY, radius, 0, Math.PI * 2);
      context.fillStyle = gradient;
      context.fill();
    },
    { endRow, salt: 11, startRow },
  );
  context.globalAlpha = 1;
}

export function renderDots(renderContext: DitherEffectRenderContext): void {
  const { snapshot } = renderContext;

  if (isMicroGrid(renderContext)) {
    const exposureScale = exposureScaleOf(renderContext);
    renderMicroGrid(
      renderContext,
      (cell) => {
        const scale = 0.5 + cell.tone * 0.7;
        return [
          exposedChannel(cell.red * 1.5, exposureScale),
          exposedChannel(cell.green * 1.5, exposureScale),
          exposedChannel(cell.blue * 1.5, exposureScale),
          255 * Math.min(1, 0.57 * scale * scale) * cell.alpha * cell.alpha,
        ];
      },
      { salt: 11 },
    );
    return;
  }

  renderDotsRows(renderContext, 0, snapshot.height);
}

export function renderDotsPreviewPhase(
  renderContext: DitherEffectRenderContext,
  phaseIndex: number,
  phaseCount: number,
): void {
  if (isMicroGrid(renderContext)) {
    if (phaseIndex === 0) {
      renderDots(renderContext);
    }
    return;
  }

  const { height } = renderContext.snapshot;
  const startRow = Math.floor((height * phaseIndex) / phaseCount);
  const endRow = Math.floor((height * (phaseIndex + 1)) / phaseCount);
  renderDotsRows(renderContext, startRow, endRow);
}

export function renderLego(renderContext: DitherEffectRenderContext): void {
  const { context, settings } = renderContext;
  const exposureScale = exposureScaleOf(renderContext);
  const densityBoost = settings.density / 10;
  const detailed = hasDetailedCells(renderContext);

  if (isMicroGrid(renderContext)) {
    renderMicroGrid(
      renderContext,
      (cell) => {
        const tile = Math.min(1, (0.3 + cell.tone * 0.9) * (1 + densityBoost * (1 - cell.tone)));
        return [
          exposedChannel(cell.red, exposureScale),
          exposedChannel(cell.green, exposureScale),
          exposedChannel(cell.blue, exposureScale),
          255 * Math.min(1, tile * tile) * cell.alpha * cell.alpha,
        ];
      },
      { salt: 13 },
    );
    return;
  }

  forEachGridCell(
    renderContext,
    (cell) => {
      const halfCell = (Math.min(cell.sizeX, cell.sizeY) / 2) * 0.95;
      const contrast = 1 + densityBoost * (1 - cell.tone);
      const tileSize = halfCell * (0.3 + cell.tone * 0.9) * contrast * 2;
      if (tileSize < 0.5) return;

      const red = exposedChannel(cell.red, exposureScale);
      const green = exposedChannel(cell.green, exposureScale);
      const blue = exposedChannel(cell.blue, exposureScale);
      const plateX = cell.centerX - tileSize / 2;
      const plateY = cell.centerY - tileSize / 2;
      const corner = Math.min(tileSize * 0.08, 2);
      const studRadius = tileSize * 0.22;

      context.globalAlpha = cell.alpha * cell.alpha;

      if (!detailed) {
        context.fillStyle = rgb(red, green, blue);
        context.fillRect(plateX, plateY, tileSize, tileSize);
        if (studRadius >= 0.4) {
          context.beginPath();
          context.arc(cell.centerX, cell.centerY, studRadius, 0, Math.PI * 2);
          context.fillStyle = rgb(
            Math.min(255, red + 30),
            Math.min(255, green + 30),
            Math.min(255, blue + 30),
          );
          context.fill();
        }
        return;
      }

      const plate = context.createLinearGradient(
        plateX,
        plateY,
        plateX,
        plateY + tileSize,
      );
      plate.addColorStop(
        0,
        rgb(
          Math.min(255, red * 1.12),
          Math.min(255, green * 1.12),
          Math.min(255, blue * 1.12),
        ),
      );
      plate.addColorStop(0.55, rgb(red, green, blue));
      plate.addColorStop(
        1,
        rgb(red * 0.72, green * 0.72, blue * 0.72),
      );
      context.beginPath();
      context.roundRect(plateX, plateY, tileSize, tileSize, corner);
      context.fillStyle = plate;
      context.fill();

      context.beginPath();
      context.moveTo(plateX + corner, plateY + 0.5);
      context.lineTo(plateX + tileSize - corner, plateY + 0.5);
      context.lineTo(plateX + tileSize - 0.5, plateY + corner);
      context.strokeStyle = "rgba(255,255,255,.20)";
      context.lineWidth = 0.6;
      context.stroke();
      context.beginPath();
      context.moveTo(plateX + tileSize - 0.5, plateY + corner);
      context.lineTo(plateX + tileSize - 0.5, plateY + tileSize - corner);
      context.lineTo(plateX + tileSize - corner, plateY + tileSize - 0.5);
      context.lineTo(plateX + corner, plateY + tileSize - 0.5);
      context.strokeStyle = "rgba(0,0,0,.25)";
      context.stroke();

      if (studRadius >= 0.4) {
        context.beginPath();
        context.arc(
          cell.centerX,
          cell.centerY + studRadius * 0.08,
          studRadius,
          0,
          Math.PI * 2,
        );
        context.fillStyle = "rgba(0,0,0,.10)";
        context.fill();
        context.beginPath();
        context.arc(cell.centerX, cell.centerY, studRadius, 0, Math.PI * 2);
        const stud = context.createRadialGradient(
          cell.centerX - studRadius * 0.3,
          cell.centerY - studRadius * 0.3,
          studRadius * 0.1,
          cell.centerX,
          cell.centerY,
          studRadius,
        );
        stud.addColorStop(
          0,
          rgb(
            Math.min(255, red + 40),
            Math.min(255, green + 40),
            Math.min(255, blue + 40),
          ),
        );
        stud.addColorStop(0.55, rgb(red, green, blue));
        stud.addColorStop(1, rgb(red * 0.7, green * 0.7, blue * 0.7));
        context.fillStyle = stud;
        context.fill();
        context.beginPath();
        context.arc(cell.centerX, cell.centerY, studRadius * 0.9, 0, Math.PI * 2);
        context.strokeStyle = "rgba(0,0,0,.18)";
        context.lineWidth = Math.max(0.5, studRadius * 0.16);
        context.stroke();
        context.beginPath();
        context.arc(
          cell.centerX - studRadius * 0.28,
          cell.centerY - studRadius * 0.28,
          studRadius * 0.18,
          0,
          Math.PI * 2,
        );
        context.fillStyle = "rgba(255,255,255,.42)";
        context.fill();
      }
    },
    { salt: 13 },
  );
  context.globalAlpha = 1;
}

export function renderLed(renderContext: DitherEffectRenderContext): void {
  const { context, settings } = renderContext;
  const exposureScale = exposureScaleOf(renderContext);
  const densityBoost = settings.density / 10;
  const detailed = hasDetailedCells(renderContext);

  if (isMicroGrid(renderContext)) {
    renderMicroGrid(
      renderContext,
      (cell) => [
        exposedChannel(cell.red, exposureScale),
        exposedChannel(cell.green, exposureScale),
        exposedChannel(cell.blue, exposureScale),
        255 * 0.78 * cell.alpha * cell.alpha,
      ],
      { salt: 17 },
    );
    return;
  }

  forEachGridCell(
    renderContext,
    (cell) => {
      const cellSize = Math.min(cell.sizeX, cell.sizeY);
      const contrast = 1 + densityBoost * 0.3 * (1 - cell.tone);
      const ledSize = cellSize * 0.78 * contrast;
      if (ledSize < 0.5) return;

      const red = exposedChannel(cell.red, exposureScale);
      const green = exposedChannel(cell.green, exposureScale);
      const blue = exposedChannel(cell.blue, exposureScale);
      const left = cell.centerX - ledSize / 2;
      const top = cell.centerY - ledSize / 2;
      const corner = Math.min(ledSize * 0.3, 8);

      context.globalAlpha = cell.alpha * cell.alpha;

      if (!detailed) {
        if (cell.tone > 0.3) {
          context.globalAlpha =
            cell.tone * 0.18 * cell.alpha * cell.alpha;
          context.beginPath();
          context.arc(
            cell.centerX,
            cell.centerY,
            ledSize * (0.8 + cell.tone * 1.2) * 0.75,
            0,
            Math.PI * 2,
          );
          context.fillStyle = rgb(red, green, blue);
          context.fill();
          context.globalAlpha = cell.alpha * cell.alpha;
        }
        context.beginPath();
        context.roundRect(left, top, ledSize, ledSize, corner);
        context.fillStyle = rgb(red, green, blue);
        context.fill();
        context.strokeStyle = "rgba(0,0,0,0.82)";
        context.lineWidth = Math.max(0.8, ledSize * 0.06);
        context.stroke();
        return;
      }

      if (cell.tone > 0.3) {
        const glowRadius = ledSize * (0.8 + cell.tone * 1.2);
        const glowAlpha = cell.tone * 0.22 * cell.alpha * cell.alpha;
        const glow = context.createRadialGradient(
          cell.centerX,
          cell.centerY,
          0,
          cell.centerX,
          cell.centerY,
          glowRadius,
        );
        glow.addColorStop(0, rgba(red, green, blue, glowAlpha));
        glow.addColorStop(1, rgba(red, green, blue, 0));
        context.beginPath();
        context.arc(cell.centerX, cell.centerY, glowRadius, 0, Math.PI * 2);
        context.fillStyle = glow;
        context.fill();
      }

      const body = context.createLinearGradient(left, top, left, top + ledSize);
      body.addColorStop(
        0,
        rgb(
          Math.min(255, red + 15),
          Math.min(255, green + 15),
          Math.min(255, blue + 15),
        ),
      );
      body.addColorStop(0.7, rgb(red, green, blue));
      body.addColorStop(
        1,
        rgb(Math.max(0, red - 35), Math.max(0, green - 35), Math.max(0, blue - 35)),
      );
      context.beginPath();
      context.roundRect(left, top, ledSize, ledSize, corner);
      context.fillStyle = body;
      context.fill();
      context.strokeStyle = "rgba(0,0,0,0.82)";
      context.lineWidth = Math.max(0.8, ledSize * 0.06);
      context.stroke();

      if (ledSize >= 5) {
        context.beginPath();
        context.arc(
          left + ledSize * 0.28,
          top + ledSize * 0.22,
          ledSize * 0.12,
          0,
          Math.PI * 2,
        );
        context.fillStyle = "rgba(255,255,255,0.35)";
        context.fill();
      }
    },
    { salt: 17 },
  );
  context.globalAlpha = 1;
}

export function renderPixelArt(renderContext: DitherEffectRenderContext): void {
  const { context, settings } = renderContext;
  const exposureScale = exposureScaleOf(renderContext);
  const densityBoost = settings.density / 10;

  if (isMicroGrid(renderContext)) {
    renderMicroGrid(
      renderContext,
      (cell) => [
        exposedChannel(cell.red, exposureScale),
        exposedChannel(cell.green, exposureScale),
        exposedChannel(cell.blue, exposureScale),
        255 * cell.alpha,
      ],
      { salt: 9 },
    );
    return;
  }

  forEachGridCell(
    renderContext,
    (cell) => {
      const cellSize = Math.min(cell.sizeX, cell.sizeY);
      const gap = Math.max(0.5, densityBoost * cellSize * 0.18);
      const tile = Math.max(1, cellSize - gap);

      context.globalAlpha = cell.alpha;
      context.fillStyle = rgb(
        exposedChannel(cell.red, exposureScale),
        exposedChannel(cell.green, exposureScale),
        exposedChannel(cell.blue, exposureScale),
      );
      context.fillRect(
        cell.centerX - tile / 2,
        cell.centerY - tile / 2,
        tile,
        tile,
      );
    },
    { salt: 9 },
  );
  context.globalAlpha = 1;
}

export function renderCrossStitch(renderContext: DitherEffectRenderContext): void {
  const { context, outputHeight, outputWidth, settings } = renderContext;
  const exposureScale = exposureScaleOf(renderContext);
  const densityBoost = settings.density / 10;
  const detailed = hasDetailedCells(renderContext);

  if (isMicroGrid(renderContext)) {
    renderMicroGrid(
      renderContext,
      (cell) => [
        exposedChannel(cell.red, exposureScale),
        exposedChannel(cell.green, exposureScale),
        exposedChannel(cell.blue, exposureScale),
        255 * (0.5 + cell.tone * 0.24) * cell.alpha,
      ],
      { salt: 15 },
    );
    return;
  }

  const cellSize = Math.min(renderContext.scaleX, renderContext.scaleY);
  context.strokeStyle = "rgba(128,128,128,0.10)";
  context.lineWidth = Math.max(0.4, cellSize * 0.04);
  context.beginPath();
  for (let y = 0; y <= outputHeight; y += renderContext.scaleY) {
    context.moveTo(0, y);
    context.lineTo(outputWidth, y);
  }
  for (let x = 0; x <= outputWidth; x += renderContext.scaleX) {
    context.moveTo(x, 0);
    context.lineTo(x, outputHeight);
  }
  context.stroke();

  const exposeChannel = (value: number): number => {
    const exposed =
      exposureScale <= 1
        ? value * exposureScale
        : value + (255 - value) * (exposureScale - 1);
    return clamp(exposed, 0, 255);
  };

  forEachGridCell(
    renderContext,
    (cell) => {
      const contrast = 1 + densityBoost * 0.3 * (1 - cell.tone);
      const stitchSize = Math.min(cell.sizeX, cell.sizeY) * 0.82 * contrast;
      if (stitchSize < 2) return;

      const threadCount =
        !detailed || cell.tone < 0.3 ? 1 : Math.round(1 + cell.tone * 2);
      const half = stitchSize * 0.42;
      const thickness = Math.max(0.8, stitchSize * 0.16);
      const scatterAmount = settings.scatter / 100;
      const wobble = scatterAmount * stitchSize * 0.15;
      const baseRotation =
        (coordinateNoise(settings.seed, cell.x + cell.y, cell.x - cell.y, 33) - 0.5) *
        0.3 *
        scatterAmount;

      context.globalAlpha = cell.alpha * cell.alpha;
      context.lineCap = "round";

      for (let thread = 0; thread < threadCount; thread += 1) {
        const jx =
          (coordinateNoise(settings.seed, cell.x, cell.y, 29 + thread) - 0.5) *
          (wobble + thread * stitchSize * 0.05);
        const jy =
          (coordinateNoise(settings.seed, cell.y, cell.x, 37 + thread) - 0.5) *
          (wobble + thread * stitchSize * 0.05);
        const vary =
          (coordinateNoise(settings.seed, cell.x, cell.y, 41 + thread) - 0.5) * 24;
        const red = clamp(exposeChannel(cell.red) + vary, 0, 255);
        const green = clamp(exposeChannel(cell.green) + vary, 0, 255);
        const blue = clamp(exposeChannel(cell.blue) + vary, 0, 255);

        context.save();
        context.translate(cell.centerX + jx, cell.centerY + jy);
        context.rotate(baseRotation);
        context.strokeStyle = rgb(red, green, blue);
        context.lineWidth = thickness;
        context.beginPath();
        context.moveTo(-half, -half);
        context.lineTo(half, half);
        context.moveTo(half, -half);
        context.lineTo(-half, half);
        context.stroke();
        context.restore();
      }
    },
    { salt: 15 },
  );
  context.globalAlpha = 1;
}

export function renderVoxel(renderContext: DitherEffectRenderContext): void {
  const { context, settings } = renderContext;
  const exposureScale = exposureScaleOf(renderContext);
  const densityBoost = settings.density / 10;
  const detailed = hasDetailedCells(renderContext);

  if (isMicroGrid(renderContext)) {
    renderMicroGrid(
      renderContext,
      (cell) => [
        exposedChannel(cell.red, exposureScale),
        exposedChannel(cell.green, exposureScale),
        exposedChannel(cell.blue, exposureScale),
        255 * cell.alpha,
      ],
      { salt: 21 },
    );
    return;
  }

  forEachGridCell(
    renderContext,
    (cell) => {
      const cellWidth = cell.sizeX;
      const halfWidth = cellWidth / 2;
      const halfHeight = cellWidth * 0.25;
      const contrast = 1 + densityBoost * (1 - cell.tone);
      const depth =
        (Math.min(cell.sizeX, cell.sizeY) / 2) * (0.15 + cell.tone * 1.1) * contrast;
      if (depth < 0.5) return;

      const red = exposedChannel(cell.red, exposureScale);
      const green = exposedChannel(cell.green, exposureScale);
      const blue = exposedChannel(cell.blue, exposureScale);
      const x = cell.centerX;
      const top = cell.centerY - depth;

      context.globalAlpha = cell.alpha * cell.alpha;

      if (!detailed) {
        context.beginPath();
        context.moveTo(x - halfWidth, top - halfHeight);
        context.lineTo(x, top);
        context.lineTo(x, top + depth);
        context.lineTo(x - halfWidth, top - halfHeight + depth);
        context.closePath();
        context.fillStyle = rgb(
          Math.max(0, red - 22),
          Math.max(0, green - 22),
          Math.max(0, blue - 22),
        );
        context.fill();
        context.beginPath();
        context.moveTo(x, top);
        context.lineTo(x + halfWidth, top - halfHeight);
        context.lineTo(x + halfWidth, top - halfHeight + depth);
        context.lineTo(x, top + depth);
        context.closePath();
        context.fillStyle = rgb(
          Math.max(0, red - 72),
          Math.max(0, green - 72),
          Math.max(0, blue - 72),
        );
        context.fill();
        context.beginPath();
        context.moveTo(x, top - halfHeight * 2);
        context.lineTo(x + halfWidth, top - halfHeight);
        context.lineTo(x, top);
        context.lineTo(x - halfWidth, top - halfHeight);
        context.closePath();
        context.fillStyle = rgb(
          Math.min(255, red + 14),
          Math.min(255, green + 14),
          Math.min(255, blue + 14),
        );
        context.fill();
        return;
      }

      context.beginPath();
      context.moveTo(x - halfWidth, top - halfHeight);
      context.lineTo(x, top);
      context.lineTo(x, top + depth);
      context.lineTo(x - halfWidth, top - halfHeight + depth);
      context.closePath();
      const leftFace = context.createLinearGradient(x - halfWidth, 0, x, 0);
      leftFace.addColorStop(
        0,
        rgb(Math.max(0, red - 30), Math.max(0, green - 30), Math.max(0, blue - 30)),
      );
      leftFace.addColorStop(
        1,
        rgb(Math.max(0, red - 15), Math.max(0, green - 15), Math.max(0, blue - 15)),
      );
      context.fillStyle = leftFace;
      context.fill();
      context.strokeStyle = "rgba(0,0,0,0.12)";
      context.lineWidth = 0.5;
      context.stroke();

      context.beginPath();
      context.moveTo(x, top);
      context.lineTo(x + halfWidth, top - halfHeight);
      context.lineTo(x + halfWidth, top - halfHeight + depth);
      context.lineTo(x, top + depth);
      context.closePath();
      const rightFace = context.createLinearGradient(x, 0, x + halfWidth, 0);
      rightFace.addColorStop(
        0,
        rgb(Math.max(0, red - 65), Math.max(0, green - 65), Math.max(0, blue - 65)),
      );
      rightFace.addColorStop(
        1,
        rgb(Math.max(0, red - 80), Math.max(0, green - 80), Math.max(0, blue - 80)),
      );
      context.fillStyle = rightFace;
      context.fill();
      context.strokeStyle = "rgba(0,0,0,0.18)";
      context.stroke();

      context.beginPath();
      context.moveTo(x, top - halfHeight * 2);
      context.lineTo(x + halfWidth, top - halfHeight);
      context.lineTo(x, top);
      context.lineTo(x - halfWidth, top - halfHeight);
      context.closePath();
      const topFace = context.createLinearGradient(
        x - halfWidth,
        top - halfHeight * 2,
        x + halfWidth,
        top,
      );
      topFace.addColorStop(
        0,
        rgb(
          Math.min(255, red + 28),
          Math.min(255, green + 28),
          Math.min(255, blue + 28),
        ),
      );
      topFace.addColorStop(1, rgb(red, green, blue));
      context.fillStyle = topFace;
      context.fill();
      context.strokeStyle = "rgba(255,255,255,0.18)";
      context.lineWidth = 0.6;
      context.stroke();
    },
    { salt: 21 },
  );
  context.globalAlpha = 1;
}

export function renderLattice(renderContext: DitherEffectRenderContext): void {
  const { context, outputHeight, outputWidth, settings, snapshot } =
    renderContext;
  const exposureScale = exposureScaleOf(renderContext);
  const skipThreshold = fillThresholdOf(renderContext);
  const scatterAmount = settings.scatter / 100;
  const columns = Math.max(14, Math.min(103, Math.round(14 + (100 - settings.size) * 0.9)));
  const rows = Math.max(
    4,
    Math.round(columns * (outputHeight / Math.max(1, outputWidth))),
  );
  const spacingX = outputWidth / columns;
  const spacingY = outputHeight / rows;
  const connectDistance = spacingX * (1 + (settings.density / 10) * 1.6);
  const lineWidth = Math.max(0.4, spacingX * 2 * 0.025);
  const nodeRadius = Math.max(0.8, spacingX * 4 * 0.02);

  type LatticeNode = {
    blue: number;
    green: number;
    lum: number;
    red: number;
    x: number;
    y: number;
  };
  const nodes: (LatticeNode | null)[][] = [];

  for (let row = 0; row <= rows; row += 1) {
    nodes.push([]);
    for (let column = 0; column <= columns; column += 1) {
      const baseX = column * spacingX;
      const baseY = row * spacingY;
      const jitterX =
        scatterAmount > 0
          ? (coordinateNoise(settings.seed, column, row, 61) - 0.5) *
            spacingX *
            scatterAmount *
            0.75
          : 0;
      const jitterY =
        scatterAmount > 0
          ? (coordinateNoise(settings.seed, row, column, 67) - 0.5) *
            spacingY *
            scatterAmount *
            0.75
          : 0;
      const x = clamp(baseX + jitterX, 0, outputWidth);
      const y = clamp(baseY + jitterY, 0, outputHeight);
      const sampleX = Math.min(
        snapshot.width - 1,
        Math.floor((x / outputWidth) * snapshot.width),
      );
      const sampleY = Math.min(
        snapshot.height - 1,
        Math.floor((y / outputHeight) * snapshot.height),
      );
      const index = (sampleY * snapshot.width + sampleX) * 4;
      nodes[row].push({
        blue: snapshot.data[index + 2],
        green: snapshot.data[index + 1],
        lum: luminance(snapshot.data, index),
        red: snapshot.data[index],
        x,
        y,
      });
    }
  }

  const directions = [
    [1, 0],
    [0, 1],
    [1, 1],
    [-1, 1],
  ] as const;

  context.lineWidth = lineWidth;
  for (let row = 0; row <= rows; row += 1) {
    for (let column = 0; column <= columns; column += 1) {
      const node = nodes[row]?.[column];
      if (!node) continue;
      for (const [dx, dy] of directions) {
        const other = nodes[row + dy]?.[column + dx];
        if (!other) continue;
        const distance = Math.hypot(other.x - node.x, other.y - node.y);
        if (distance > connectDistance) continue;
        const midLum = (node.lum + other.lum) / 2;
        if (midLum < skipThreshold * 0.45) continue;

        const alpha = (1 - distance / connectDistance) * midLum * 0.65 * exposureScale;
        if (alpha <= 0.01) continue;
        context.strokeStyle = rgba(
          Math.min(255, ((node.red + other.red) / 2) * exposureScale),
          Math.min(255, ((node.green + other.green) / 2) * exposureScale),
          Math.min(255, ((node.blue + other.blue) / 2) * exposureScale),
          Math.min(1, alpha),
        );
        context.beginPath();
        context.moveTo(node.x, node.y);
        context.lineTo(other.x, other.y);
        context.stroke();
      }
    }
  }

  for (let row = 0; row <= rows; row += 1) {
    for (let column = 0; column <= columns; column += 1) {
      const node = nodes[row]?.[column];
      if (!node || node.lum < skipThreshold) continue;
      context.globalAlpha = Math.min(1, 0.35 + node.lum * 0.65);
      context.beginPath();
      context.arc(node.x, node.y, nodeRadius * (0.6 + node.lum * 0.8), 0, Math.PI * 2);
      context.fillStyle = rgb(
        Math.min(255, node.red * exposureScale * 1.2),
        Math.min(255, node.green * exposureScale * 1.2),
        Math.min(255, node.blue * exposureScale * 1.2),
      );
      context.fill();
    }
  }
  context.globalAlpha = 1;
}

function traceHexagon(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
): void {
  context.beginPath();
  for (let side = 0; side <= 5; side += 1) {
    const angle = (Math.PI / 180) * (60 * side - 30);
    const pointX = centerX + radius * Math.cos(angle);
    const pointY = centerY + radius * Math.sin(angle);
    if (side === 0) context.moveTo(pointX, pointY);
    else context.lineTo(pointX, pointY);
  }
  context.closePath();
}

export function renderHexGrid(renderContext: DitherEffectRenderContext): void {
  const { context, settings } = renderContext;
  const exposureScale = exposureScaleOf(renderContext);
  const densityBoost = settings.density / 10;

  if (isMicroGrid(renderContext)) {
    renderMicroGrid(
      renderContext,
      (cell) => [
        exposedChannel(cell.red, exposureScale),
        exposedChannel(cell.green, exposureScale),
        exposedChannel(cell.blue, exposureScale),
        255 * 0.9 * cell.alpha * cell.alpha,
      ],
      { salt: 25 },
    );
    return;
  }

  const detailed = hasDetailedCells(renderContext);
  const glowCells: GridCell[] = [];
  if (detailed) {
    forEachGridCell(
      renderContext,
      (cell) => {
        if (cell.tone > 0.25) glowCells.push(cell);
      },
      { columnOffset: true, salt: 25 },
    );
  }
  for (const cell of glowCells) {
    const halfCell = Math.min(cell.sizeX, cell.sizeY) / 2;
    const contrast = 1 + densityBoost * 0.3 * (1 - cell.tone);
    const glowRadius = halfCell * 1.6 * contrast * (0.8 + cell.tone * 1.4);
    const glowAlpha = cell.tone * 0.28 * cell.alpha * cell.alpha;
    const red = exposedChannel(cell.red, exposureScale);
    const green = exposedChannel(cell.green, exposureScale);
    const blue = exposedChannel(cell.blue, exposureScale);
    const glow = context.createRadialGradient(
      cell.centerX,
      cell.centerY,
      0,
      cell.centerX,
      cell.centerY,
      glowRadius,
    );
    glow.addColorStop(0, rgba(red, green, blue, glowAlpha));
    glow.addColorStop(0.4, rgba(red, green, blue, glowAlpha * 0.5));
    glow.addColorStop(1, rgba(red, green, blue, 0));
    context.globalAlpha = 1;
    context.beginPath();
    context.arc(cell.centerX, cell.centerY, glowRadius, 0, Math.PI * 2);
    context.fillStyle = glow;
    context.fill();
  }

  forEachGridCell(
    renderContext,
    (cell) => {
      const halfCell = Math.min(cell.sizeX, cell.sizeY) / 2;
      const contrast = 1 + densityBoost * 0.3 * (1 - cell.tone);
      const radius = halfCell * 0.9 * contrast;
      if (radius < 0.5) return;

      const red = exposedChannel(cell.red, exposureScale);
      const green = exposedChannel(cell.green, exposureScale);
      const blue = exposedChannel(cell.blue, exposureScale);

      context.globalAlpha = cell.alpha * cell.alpha;
      if (!detailed) {
        traceHexagon(context, cell.centerX, cell.centerY, radius);
        context.fillStyle = rgb(red, green, blue);
        context.fill();
        return;
      }
      const body = context.createLinearGradient(
        cell.centerX,
        cell.centerY - radius,
        cell.centerX,
        cell.centerY + radius,
      );
      body.addColorStop(
        0,
        rgb(
          Math.min(255, red * 1.12),
          Math.min(255, green * 1.12),
          Math.min(255, blue * 1.12),
        ),
      );
      body.addColorStop(0.55, rgb(red, green, blue));
      body.addColorStop(
        1,
        rgb(red * 0.72, green * 0.72, blue * 0.72),
      );
      traceHexagon(context, cell.centerX, cell.centerY, radius);
      context.fillStyle = body;
      context.fill();

      traceHexagon(context, cell.centerX, cell.centerY, radius * 0.985);
      context.strokeStyle = "rgba(0,0,0,.12)";
      context.lineWidth = 0.8;
      context.stroke();

      if (radius >= 2.5) {
        context.beginPath();
        for (let side = 4; side <= 6; side += 1) {
          const angle = (Math.PI / 180) * (60 * (side % 6) - 30);
          const pointX = cell.centerX + radius * Math.cos(angle);
          const pointY = cell.centerY + radius * Math.sin(angle);
          if (side === 4) context.moveTo(pointX, pointY);
          else context.lineTo(pointX, pointY);
        }
        context.strokeStyle = "rgba(255,255,255,.20)";
        context.lineWidth = 0.6;
        context.stroke();
      }
    },
    { columnOffset: true, salt: 25 },
  );
  context.globalAlpha = 1;
}
