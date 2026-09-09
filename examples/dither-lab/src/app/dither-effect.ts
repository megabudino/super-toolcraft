import {
  getDitherEffectDefinition,
  type DitherEffectDefinition,
  type DitherEffectRenderContext,
} from "./dither-effects";
import {
  getDitherExportExtension,
  getDitherExportMimeType,
  getDitherSettingsFromValues,
} from "./dither-settings";
import type {
  DitherRenderSettings,
  DrawDitherOutputOptions,
  RenderDitherImageOptions,
} from "./dither-types";
import {
  coordinateNoise,
  createCanvas,
  ensureCanvasCapacity,
  ensureCanvasSize,
  get2dContext,
  getToneFilter,
  stableSettingsKey,
} from "./dither-utils";

type DitherDrawResult = {
  compositeRevision: number;
  effectRevision: number;
  preparedRevision: number;
};

type DitherEffectRenderSession = {
  contextScaleX: number;
  contextScaleY: number;
  definition: DitherEffectDefinition | null;
  key: string;
  renderContext: DitherEffectRenderContext | null;
  style: DitherRenderSettings["style"];
};

const duotoneColors = {
  "deep-sea": { base: "#031B2D", pixels: "#69F0E5" },
  ember: { base: "#2A0704", pixels: "#FFAB5B" },
  "midnight-gold": { base: "#090A13", pixels: "#F7C66C" },
  "neon-violet": { base: "#17051F", pixels: "#FF7CF2" },
  "royal-cream": { base: "#4B1D73", pixels: "#FFF0C2" },
} as const;

function clearContext(context: CanvasRenderingContext2D, width: number, height: number): void {
  context.save();
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.globalAlpha = 1;
  context.globalCompositeOperation = "source-over";
  context.filter = "none";
  context.clearRect(0, 0, width, height);
  context.restore();
}

function resolveDuotoneColors(settings: DitherRenderSettings): {
  base: string;
  pixels: string;
} | null {
  if (settings.duotonePreset === "off") return null;
  if (settings.duotonePreset === "custom") {
    return { base: settings.duotoneBase, pixels: settings.duotonePixels };
  }
  return duotoneColors[settings.duotonePreset];
}

function hasFinishEffects(settings: DitherRenderSettings): boolean {
  return (
    settings.duotonePreset !== "off" ||
    settings.finishGlow > 0 ||
    settings.finishGrain > 0 ||
    settings.finishNoise > 0 ||
    settings.finishVignette > 0
  );
}

function hasToneEffects(settings: DitherRenderSettings): boolean {
  return (
    settings.toneBrightness !== 100 ||
    settings.toneContrast !== 100 ||
    settings.toneHue !== 0 ||
    settings.toneSaturation !== 100
  );
}

function getCanvasImageSourceSize(
  source: CanvasImageSource,
): { height: number; width: number } | null {
  const candidate = source as {
    displayHeight?: unknown;
    displayWidth?: unknown;
    height?: unknown;
    naturalHeight?: unknown;
    naturalWidth?: unknown;
    videoHeight?: unknown;
    videoWidth?: unknown;
    width?: unknown;
  };
  const width = [
    candidate.naturalWidth,
    candidate.videoWidth,
    candidate.displayWidth,
    candidate.width,
  ].find((value): value is number => typeof value === "number" && value > 0);
  const height = [
    candidate.naturalHeight,
    candidate.videoHeight,
    candidate.displayHeight,
    candidate.height,
  ].find((value): value is number => typeof value === "number" && value > 0);

  return width && height ? { height, width } : null;
}

function writeNoiseTile(canvas: HTMLCanvasElement, seed: number, scale: number): void {
  const context = get2dContext(canvas);
  if (!context) return;
  const image = context.createImageData(canvas.width, canvas.height);

  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      const sampleX = Math.floor(x / scale);
      const sampleY = Math.floor(y / scale);
      const value = Math.round(coordinateNoise(seed, sampleX, sampleY, scale * 73) * 255);
      const index = (y * canvas.width + x) * 4;
      image.data[index] = value;
      image.data[index + 1] = value;
      image.data[index + 2] = value;
      image.data[index + 3] = 255;
    }
  }

  context.putImageData(image, 0, 0);
}

export class DitherRenderEngine {
  private readonly preparedCanvas = createCanvas();
  private readonly sampleCanvas = createCanvas();
  private overlayCanvas = createCanvas();
  private spareOverlayCanvas = createCanvas();
  private readonly scratchCanvas = createCanvas();
  private readonly noiseTile = createCanvas(64, 64);
  private readonly grainTile = createCanvas(96, 96);
  private preparedKey = "";
  private effectKey = "";
  private spareEffectKey = "";
  private effectStyle: DitherRenderSettings["style"] | null = null;
  private spareEffectStyle: DitherRenderSettings["style"] | null = null;
  private compositeKey = "";
  private preparedRevision = 0;
  private effectRevision = 0;
  private compositeRevision = 0;
  private glowBrightPass: ImageData | null = null;
  private noiseSeed = Number.NaN;
  private sourceImage: CanvasImageSource | null = null;

  private ensureOutputSurfaces(width: number, height: number): void {
    ensureCanvasCapacity(this.overlayCanvas, width, height);
  }

  private prepareSource(
    sourceImage: CanvasImageSource | null,
    settings: DitherRenderSettings,
    width: number,
    height: number,
  ): void {
    const usesTone = hasToneEffects(settings);
    const sourceSize = sourceImage ? getCanvasImageSourceSize(sourceImage) : null;
    const preparedWidth = sourceSize ? Math.min(width, sourceSize.width) : width;
    const preparedHeight = sourceSize ? Math.min(height, sourceSize.height) : height;
    const key = stableSettingsKey([
      usesTone ? preparedWidth : 0,
      usesTone ? preparedHeight : 0,
      settings.toneBrightness,
      settings.toneContrast,
      settings.toneSaturation,
      settings.toneHue,
    ]);
    if (this.sourceImage === sourceImage && this.preparedKey === key) return;

    if (sourceImage && usesTone) {
      ensureCanvasSize(this.preparedCanvas, preparedWidth, preparedHeight);
      const context = get2dContext(this.preparedCanvas);
      if (!context) return;
      clearContext(context, preparedWidth, preparedHeight);
      context.save();
      context.filter = getToneFilter(settings);
      context.drawImage(sourceImage, 0, 0, preparedWidth, preparedHeight);
      context.restore();
    }

    this.sourceImage = sourceImage;
    this.preparedKey = key;
    this.preparedRevision += 1;
    this.effectKey = "";
  }

  private getPreparedSource(settings: DitherRenderSettings): CanvasImageSource | null {
    if (!this.sourceImage) return null;
    return hasToneEffects(settings) ? this.preparedCanvas : this.sourceImage;
  }

  private getEffectKey(
    settings: DitherRenderSettings,
    dimensions: DrawDitherOutputOptions,
  ): string {
    const { cssHeight, cssWidth, pixelHeight, pixelWidth, renderMode = "preview" } = dimensions;
    return stableSettingsKey([
      this.preparedRevision,
      cssHeight,
      cssWidth,
      pixelHeight,
      pixelWidth,
      renderMode,
      settings.style,
      settings.size,
      settings.fill,
      settings.density,
      settings.exposure,
      settings.scatter,
      settings.seed,
      settings.asciiMode,
      settings.asciiGlyphs,
      settings.asciiCustomGlyphs,
    ]);
  }

  private beginEffectRender(
    settings: DitherRenderSettings,
    dimensions: DrawDitherOutputOptions,
  ): DitherEffectRenderSession | null {
    const {
      cssHeight,
      cssWidth,
      pixelHeight,
      pixelWidth,
      renderMode = "preview",
    } = dimensions;
    const definition = getDitherEffectDefinition(settings.style);
    const key = this.getEffectKey(settings, dimensions);
    if (this.effectKey === key) return null;

    if (this.spareEffectKey === key) {
      const previousCanvas = this.overlayCanvas;
      const previousKey = this.effectKey;
      const previousStyle = this.effectStyle;
      this.overlayCanvas = this.spareOverlayCanvas;
      this.spareOverlayCanvas = previousCanvas;
      this.effectKey = key;
      this.spareEffectKey = previousKey;
      this.effectStyle = this.spareEffectStyle;
      this.spareEffectStyle = previousStyle;
      this.effectRevision += 1;
      this.compositeKey = "";
      return null;
    }

    const switchesEffectFamily =
      this.effectKey !== "" && this.effectStyle !== settings.style;
    if (switchesEffectFamily) {
      const previousCanvas = this.overlayCanvas;
      this.overlayCanvas = this.spareOverlayCanvas;
      this.spareOverlayCanvas = previousCanvas;
      this.spareEffectKey = this.effectKey;
      this.spareEffectStyle = this.effectStyle;
    }
    ensureCanvasCapacity(this.overlayCanvas, pixelWidth, pixelHeight);

    const overlayContext = get2dContext(this.overlayCanvas);
    if (!overlayContext) return null;
    clearContext(overlayContext, pixelWidth, pixelHeight);

    const preparedSource = this.getPreparedSource(settings);
    if (preparedSource && definition) {
      const plan = definition.createPlan({
        cssHeight,
        cssWidth,
        pixelHeight,
        pixelWidth,
        renderMode,
        settings,
      });
      ensureCanvasSize(this.sampleCanvas, plan.sampleWidth, plan.sampleHeight);
      const sampleContext = get2dContext(this.sampleCanvas, true);
      if (sampleContext) {
        clearContext(sampleContext, plan.sampleWidth, plan.sampleHeight);
        sampleContext.drawImage(preparedSource, 0, 0, plan.sampleWidth, plan.sampleHeight);
        const snapshot = sampleContext.getImageData(0, 0, plan.sampleWidth, plan.sampleHeight);
        return {
          contextScaleX: plan.contextScaleX,
          contextScaleY: plan.contextScaleY,
          definition,
          key,
          renderContext: {
            context: overlayContext,
            cssHeight,
            cssWidth,
            outputHeight: plan.outputHeight,
            outputWidth: plan.outputWidth,
            renderMode,
            scaleX: plan.outputWidth / snapshot.width,
            scaleY: plan.outputHeight / snapshot.height,
            settings: { ...settings, size: plan.renderSize },
            snapshot,
          },
          style: settings.style,
        };
      }
    }

    return {
      contextScaleX: 1,
      contextScaleY: 1,
      definition,
      key,
      renderContext: null,
      style: settings.style,
    };
  }

  private completeEffectRender(session: DitherEffectRenderSession): void {
    this.effectKey = session.key;
    this.effectStyle = session.style;
    this.effectRevision += 1;
    this.compositeKey = "";
  }

  private runEffectRender(
    session: DitherEffectRenderSession,
    render: (context: DitherEffectRenderContext) => void,
  ): void {
    if (!session.renderContext) return;
    const { context } = session.renderContext;
    context.save();
    context.scale(session.contextScaleX, session.contextScaleY);
    render(session.renderContext);
    context.restore();
  }

  private renderEffect(
    settings: DitherRenderSettings,
    dimensions: DrawDitherOutputOptions,
  ): void {
    const session = this.beginEffectRender(settings, dimensions);
    if (!session) return;

    if (session.definition) {
      this.runEffectRender(session, session.definition.render);
    }
    this.completeEffectRender(session);
  }

  createPreviewEffectRenderPhases(
    settings: DitherRenderSettings,
    dimensions: DrawDitherOutputOptions,
  ): ReadonlyArray<() => void> {
    const definition = getDitherEffectDefinition(settings.style);
    const phaseCount = definition?.previewPhaseCount ?? 0;
    if (
      !definition?.renderPreviewPhase ||
      phaseCount < 2 ||
      this.effectKey === this.getEffectKey(settings, dimensions) ||
      this.spareEffectKey === this.getEffectKey(settings, dimensions)
    ) {
      return [() => this.renderEffect(settings, dimensions)];
    }

    let session: DitherEffectRenderSession | null = null;
    return [
      () => {
        session = this.beginEffectRender(settings, dimensions);
      },
      ...Array.from({ length: phaseCount }, (_, phaseIndex) => () => {
        if (!session?.definition?.renderPreviewPhase) return;
        this.runEffectRender(session, (context) => {
          session?.definition?.renderPreviewPhase?.(
            context,
            phaseIndex,
            phaseCount,
          );
        });
      }),
      () => {
        if (session) {
          this.completeEffectRender(session);
        }
      },
    ];
  }

  private drawComposite(
    context: CanvasRenderingContext2D,
    settings: DitherRenderSettings,
    width: number,
    height: number,
  ): void {
    const key = stableSettingsKey([
      this.preparedRevision,
      this.effectRevision,
      settings.style,
      settings.layerOpacity,
      settings.blend,
    ]);
    if (this.compositeKey !== key) {
      this.compositeKey = key;
      this.compositeRevision += 1;
    }

    const preparedSource = this.getPreparedSource(settings);
    if (!preparedSource) return;

    context.drawImage(preparedSource, 0, 0, width, height);
    if (settings.style !== "none" && settings.layerOpacity > 0) {
      context.save();
      context.globalAlpha = settings.layerOpacity / 100;
      context.globalCompositeOperation = settings.blend as GlobalCompositeOperation;
      context.drawImage(this.overlayCanvas, 0, 0, width, height, 0, 0, width, height);
      context.restore();
    }
  }

  private applyDuotone(
    context: CanvasRenderingContext2D,
    settings: DitherRenderSettings,
    width: number,
    height: number,
  ): void {
    const colors = resolveDuotoneColors(settings);
    if (!colors) return;

    ensureCanvasSize(this.scratchCanvas, width, height);
    const scratch = get2dContext(this.scratchCanvas);
    if (!scratch) return;
    clearContext(scratch, width, height);
    scratch.save();
    scratch.globalAlpha = 1;
    scratch.globalCompositeOperation = "source-over";
    scratch.filter = "grayscale(1) contrast(1.12)";
    scratch.drawImage(context.canvas, 0, 0);
    scratch.filter = "none";
    scratch.globalCompositeOperation = "multiply";
    scratch.fillStyle = colors.pixels;
    scratch.fillRect(0, 0, width, height);
    scratch.globalCompositeOperation = "screen";
    scratch.fillStyle = colors.base;
    scratch.fillRect(0, 0, width, height);
    scratch.globalCompositeOperation = "destination-in";
    scratch.drawImage(context.canvas, 0, 0, width, height, 0, 0, width, height);
    scratch.restore();

    clearContext(context, width, height);
    context.drawImage(this.scratchCanvas, 0, 0);
  }

  private applyGlow(
    context: CanvasRenderingContext2D,
    amount: number,
    width: number,
    height: number,
    resolutionScale = 1,
  ): void {
    if (amount <= 0) return;

    ensureCanvasSize(this.scratchCanvas, width, height);
    const scratch = get2dContext(this.scratchCanvas, true);
    if (!scratch) {
      context.save();
      context.globalAlpha = amount / 160;
      context.globalCompositeOperation = "screen";
      context.drawImage(context.canvas, 0, 0, width, height, 0, 0, width, height);
      context.restore();
      return;
    }

    const strength = amount / 100;
    const source = context.getImageData(0, 0, width, height);
    if (
      !this.glowBrightPass ||
      this.glowBrightPass.width !== width ||
      this.glowBrightPass.height !== height
    ) {
      this.glowBrightPass = scratch.createImageData(width, height);
    }
    const brightPass = this.glowBrightPass;
    const sourceData = source.data;
    const brightData = brightPass.data;
    for (let index = 0; index < sourceData.length; index += 4) {
      const red = sourceData[index];
      const green = sourceData[index + 1];
      const blue = sourceData[index + 2];
      const lum = red * 0.299 + green * 0.587 + blue * 0.114;
      const weight = Math.max(0, (lum - 102) / 153);
      brightData[index] = red * weight;
      brightData[index + 1] = green * weight;
      brightData[index + 2] = blue * weight;
      brightData[index + 3] = 255;
    }
    clearContext(scratch, width, height);
    scratch.putImageData(brightPass, 0, 0);

    const blurRadius = Math.round(strength * 40 * Math.max(0.5, resolutionScale));
    context.save();
    context.globalCompositeOperation = "screen";
    context.globalAlpha = Math.min(1, strength * 1.5);
    context.filter = `blur(${blurRadius}px)`;
    context.drawImage(this.scratchCanvas, 0, 0, width, height, 0, 0, width, height);
    context.filter = "none";
    context.restore();
  }

  private ensureNoiseTiles(seed: number): void {
    if (this.noiseSeed === seed) return;
    writeNoiseTile(this.noiseTile, seed, 4);
    writeNoiseTile(this.grainTile, seed + 197, 1);
    this.noiseSeed = seed;
  }

  private applyTexture(
    context: CanvasRenderingContext2D,
    settings: DitherRenderSettings,
    width: number,
    height: number,
  ): void {
    if (settings.finishNoise <= 0 && settings.finishGrain <= 0) return;
    this.ensureNoiseTiles(settings.seed);
    ensureCanvasSize(this.scratchCanvas, width, height);
    const scratch = get2dContext(this.scratchCanvas);
    if (!scratch) return;
    clearContext(scratch, width, height);
    scratch.save();
    scratch.globalAlpha = 1;
    scratch.globalCompositeOperation = "source-over";
    scratch.filter = "none";

    const drawPattern = (tile: HTMLCanvasElement, alpha: number): void => {
      const pattern = scratch.createPattern(tile, "repeat");
      if (!pattern || alpha <= 0) return;
      scratch.save();
      scratch.globalAlpha = alpha;
      scratch.fillStyle = pattern;
      scratch.fillRect(0, 0, width, height);
      scratch.restore();
    };
    drawPattern(this.noiseTile, settings.finishNoise / 150);
    drawPattern(this.grainTile, settings.finishGrain / 220);
    scratch.globalCompositeOperation = "destination-in";
    scratch.drawImage(context.canvas, 0, 0, width, height, 0, 0, width, height);
    scratch.restore();

    context.save();
    context.globalCompositeOperation = "overlay";
    context.drawImage(this.scratchCanvas, 0, 0);
    context.restore();
  }

  private applyVignette(
    context: CanvasRenderingContext2D,
    amount: number,
    width: number,
    height: number,
  ): void {
    if (amount <= 0) return;
    const radius = Math.hypot(width, height) / 2;
    const gradient = context.createRadialGradient(
      width / 2,
      height / 2,
      radius * Math.max(0.05, 0.7 - amount / 180),
      width / 2,
      height / 2,
      radius,
    );
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, `rgba(0,0,0,${Math.min(0.92, amount / 105)})`);
    context.save();
    context.globalCompositeOperation = "source-atop";
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
    context.restore();
  }

  private applyFinish(
    context: CanvasRenderingContext2D,
    settings: DitherRenderSettings,
    width: number,
    height: number,
    resolutionScale = 1,
  ): void {
    if (!hasFinishEffects(settings)) {
      return;
    }

    this.applyDuotone(context, settings, width, height);
    this.applyGlow(context, settings.finishGlow, width, height, resolutionScale);
    this.applyTexture(context, settings, width, height);
    this.applyVignette(context, settings.finishVignette, width, height);
  }

  prepare({
    cssHeight,
    cssWidth,
    pixelHeight,
    pixelWidth,
    renderMode = "preview",
    settings,
    sourceImage = null,
    targetContext,
  }: DrawDitherOutputOptions): void {
    const options = {
      cssHeight,
      cssWidth,
      pixelHeight,
      pixelWidth,
      renderMode,
      settings,
      sourceImage,
      targetContext,
    };
    this.prepareSourcePhase(options);
    this.renderEffectPhase(options);
  }

  prepareSourcePhase({
    pixelHeight,
    pixelWidth,
    settings,
    sourceImage = null,
  }: DrawDitherOutputOptions): void {
    const width = Math.max(1, Math.round(pixelWidth));
    const height = Math.max(1, Math.round(pixelHeight));
    this.ensureOutputSurfaces(width, height);
    this.prepareSource(sourceImage, settings, width, height);
  }

  renderEffectPhase({
    cssHeight,
    cssWidth,
    pixelHeight,
    pixelWidth,
    renderMode = "preview",
    settings,
    sourceImage = null,
    targetContext,
  }: DrawDitherOutputOptions): void {
    const width = Math.max(1, Math.round(pixelWidth));
    const height = Math.max(1, Math.round(pixelHeight));
    this.renderEffect(settings, {
      cssHeight,
      cssWidth,
      pixelHeight: height,
      pixelWidth: width,
      renderMode,
      settings,
      sourceImage,
      targetContext,
    });
  }

  compose({
    pixelHeight,
    pixelWidth,
    settings,
    targetContext,
  }: DrawDitherOutputOptions): void {
    const width = Math.max(1, Math.round(pixelWidth));
    const height = Math.max(1, Math.round(pixelHeight));
    clearContext(targetContext, width, height);
    this.drawComposite(targetContext, settings, width, height);
  }

  finish({
    cssWidth,
    pixelHeight,
    pixelWidth,
    settings,
    targetContext,
  }: DrawDitherOutputOptions): DitherDrawResult {
    const width = Math.max(1, Math.round(pixelWidth));
    const height = Math.max(1, Math.round(pixelHeight));
    this.applyFinish(
      targetContext,
      settings,
      width,
      height,
      cssWidth > 0 ? width / cssWidth : 1,
    );
    if (settings.includeBackground) {
      targetContext.save();
      targetContext.globalCompositeOperation = "destination-over";
      targetContext.fillStyle = settings.background;
      targetContext.fillRect(0, 0, width, height);
      targetContext.restore();
    }
    return {
      compositeRevision: this.compositeRevision,
      effectRevision: this.effectRevision,
      preparedRevision: this.preparedRevision,
    };
  }

  draw(options: DrawDitherOutputOptions): DitherDrawResult {
    this.prepare(options);
    this.compose(options);
    return this.finish(options);
  }
}

export function* createDitherPreviewRenderPhases({
  engine = new DitherRenderEngine(),
  target,
  ...options
}: RenderDitherImageOptions): Generator<() => void> {
  let drawOptions: DrawDitherOutputOptions | null = null;

  yield () => {
    ensureCanvasSize(target, options.pixelWidth, options.pixelHeight);
    const targetContext = get2dContext(target);
    drawOptions = targetContext ? { ...options, targetContext } : null;
  };
  yield () => {
    if (drawOptions) engine.prepareSourcePhase(drawOptions);
  };
  const effectOptions = drawOptions as DrawDitherOutputOptions | null;
  if (effectOptions) {
    yield* engine.createPreviewEffectRenderPhases(
      effectOptions.settings,
      effectOptions,
    );
  }
  yield () => {
    if (drawOptions) engine.compose(drawOptions);
  };
  yield () => {
    if (drawOptions) engine.finish(drawOptions);
  };
}

export function renderDitherImageToCanvas({
  engine = new DitherRenderEngine(),
  target,
  ...options
}: RenderDitherImageOptions): void {
  ensureCanvasSize(target, options.pixelWidth, options.pixelHeight);
  const context = get2dContext(target);
  if (!context) return;
  engine.draw({ ...options, targetContext: context });
}

export function drawDitherOutput(options: DrawDitherOutputOptions): void {
  new DitherRenderEngine().draw(options);
}

export {
  getDitherExportExtension,
  getDitherExportMimeType,
  getDitherSettingsFromValues,
};
export type {
  DitherAsciiGlyphSet,
  DitherAsciiMode,
  DitherBlendMode,
  DitherDuotonePreset,
  DitherEffectStyle,
  DitherImageExportFormat,
  DitherRenderSettings,
} from "./dither-types";
