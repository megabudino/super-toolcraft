import type { DitherEffectPlan, DitherEffectPlanInput } from "./types";

function getCharacterFontSize(size: number): number {
  return Math.max(4, Math.round(2 + size * 0.26));
}

export function getCharacterStep(size: number, density: number): number {
  void density;
  return getCharacterFontSize(size);
}

export function getGridCellCount(size: number): number {
  return Math.max(20, Math.round(75 + (80 - size) * 1.2));
}

export function createCharacterPlan({
  cssHeight,
  cssWidth,
  pixelHeight,
  pixelWidth,
  renderMode,
  settings,
}: DitherEffectPlanInput): DitherEffectPlan {
  if (renderMode === "export") {
    const previewLong = Math.max(cssWidth, cssHeight);
    const exportLong = Math.max(pixelWidth, pixelHeight);
    const resolutionScale = previewLong > 0 ? exportLong / previewLong : 1;

    return {
      contextScaleX: 1,
      contextScaleY: 1,
      outputHeight: pixelHeight,
      outputWidth: pixelWidth,
      renderSize: settings.size * resolutionScale,
      sampleHeight: pixelHeight,
      sampleWidth: pixelWidth,
    };
  }

  const step = getCharacterStep(settings.size, settings.density);
  return {
    contextScaleX: pixelWidth / Math.max(1, cssWidth),
    contextScaleY: pixelHeight / Math.max(1, cssHeight),
    outputHeight: cssHeight,
    outputWidth: cssWidth,
    renderSize: settings.size,
    sampleHeight: Math.max(1, Math.ceil(cssHeight / step)),
    sampleWidth: Math.max(1, Math.ceil(cssWidth / step)),
  };
}

export function createDitherPlan({
  cssHeight,
  cssWidth,
  pixelHeight,
  pixelWidth,
  settings,
}: DitherEffectPlanInput): DitherEffectPlan {
  const cellWidth = Math.max(1, 10 - settings.size * 0.09);
  const sampleWidth = Math.max(1, Math.ceil(cssWidth / cellWidth));
  const sampleHeight = Math.max(1, Math.ceil(cssHeight / cellWidth));

  return {
    contextScaleX: 1,
    contextScaleY: 1,
    outputHeight: pixelHeight,
    outputWidth: pixelWidth,
    renderSize: settings.size,
    sampleHeight,
    sampleWidth,
  };
}

export function createGridPlan({
  cssHeight,
  cssWidth,
  pixelHeight,
  pixelWidth,
  settings,
}: DitherEffectPlanInput): DitherEffectPlan {
  const cellCount = getGridCellCount(settings.size);
  const aspect = cssWidth > 0 ? cssHeight / cssWidth : 1;
  const sampleWidth = Math.max(1, cellCount);
  const sampleHeight = Math.max(1, Math.round(cellCount * aspect));

  return {
    contextScaleX: 1,
    contextScaleY: 1,
    outputHeight: pixelHeight,
    outputWidth: pixelWidth,
    renderSize: settings.size,
    sampleHeight,
    sampleWidth,
  };
}

export function getCharacterFontSizeForRender(size: number): number {
  return getCharacterFontSize(size);
}
