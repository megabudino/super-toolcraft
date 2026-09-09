import type {
  DitherAsciiGlyphSet,
  DitherAsciiMode,
  DitherRenderSettings,
} from "../dither-types";
import {
  coordinateNoise,
  getScatterOpacity,
  luminance,
  rgb,
} from "../dither-utils";
import { getCharacterFontSizeForRender, getCharacterStep } from "./plans";
import type { DitherEffectRenderContext } from "./types";

const sharedAsciiPresets: Record<Exclude<DitherAsciiGlyphSet, "custom">, string> = {
  alpha: " tixjzneroaCbdpqgyhkvfwuaBHXMWA",
  blocky: " ░▒▓█■□▪▫",
  brutal: " .:=80",
  cinematic: " .:○◇✦×∆Σ",
  classic: " .,;:+=*%S#@",
  hacker: " .+*x0X#@",
  japanese: "アイウエオカキクケコサシスセソタチツテトナニヌネノ",
  numbers: " 0123456789",
  pixel: " .:+#▖▗▘▙▚▛▜▝▞▟",
  retro: " .,:;|!*0123X",
  tech: " ⠂·:=+-*#⠿⣿░▒01XZ",
  thin: " ·∙∘○◌◍",
};

const asciiPresetsByMode: Record<
  DitherAsciiMode,
  Record<Exclude<DitherAsciiGlyphSet, "custom">, string>
> = {
  dynamic: sharedAsciiPresets,
  filled: sharedAsciiPresets,
  uniform: sharedAsciiPresets,
};

function getAsciiChars(settings: DitherRenderSettings, mode: DitherAsciiMode): string[] {
  const presets = asciiPresetsByMode[mode];
  const glyphs =
    settings.asciiGlyphs === "custom" && settings.asciiCustomGlyphs.trim().length > 0
      ? settings.asciiCustomGlyphs
      : presets[settings.asciiGlyphs === "custom" ? "classic" : settings.asciiGlyphs];
  return glyphs.length > 0 ? Array.from(glyphs) : Array.from(presets.classic);
}

function getAsciiFont(
  settings: DitherRenderSettings,
  luminanceValue: number,
  fontSize: number,
  mode: DitherAsciiMode,
): string {
  let fontFace = '"Geist Mono", "SF Mono", monospace';
  let fontWeight = mode === "uniform" ? "600" : "400";
  let renderSize = fontSize;

  const fontProfiles: Partial<Record<DitherAsciiGlyphSet, {
    face: string;
    size: number;
    weight: string;
  }>> = {
    blocky: {
      face: '"Courier New", "Courier", monospace',
      size: mode === "uniform" ? 1.4 : 1,
      weight: "900",
    },
    brutal: {
      face: '"VT323", monospace',
      size: mode === "uniform" ? 2 : 1,
      weight: "700",
    },
    pixel: {
      face: '"Press Start 2P", monospace',
      size: mode === "uniform" ? 0.7 : 1,
      weight: "400",
    },
    retro: {
      face: '"VT323", monospace',
      size: mode === "uniform" ? 1.8 : 1,
      weight: "400",
    },
    tech: {
      face: '"Share Tech Mono", monospace',
      size: mode === "uniform" ? 1.1 : 1,
      weight: "400",
    },
  };
  const profile = fontProfiles[settings.asciiGlyphs];
  if (profile) {
    fontFace = profile.face;
    fontWeight = profile.weight;
    renderSize = Math.round(fontSize * profile.size);
  } else if (settings.asciiGlyphs === "japanese") {
    fontFace = '"Noto Sans JP", "Yu Gothic", sans-serif';
    fontWeight = mode === "filled" ? (luminanceValue > 0.5 ? "800" : "400") : "700";
  } else if (settings.asciiGlyphs === "thin" && mode === "filled") {
    fontWeight = "500";
  } else if (mode === "filled") {
    fontWeight = luminanceValue > 0.6 ? "700" : luminanceValue > 0.3 ? "500" : "300";
  }

  return `${fontWeight} ${Math.max(4, renderSize)}px ${fontFace}`;
}

function getSampleIndex(
  snapshot: ImageData,
  x: number,
  y: number,
  outputWidth: number,
  outputHeight: number,
): number {
  const sx = Math.min(snapshot.width - 1, Math.floor((x / outputWidth) * snapshot.width));
  const sy = Math.min(snapshot.height - 1, Math.floor((y / outputHeight) * snapshot.height));
  return (sy * snapshot.width + sx) * 4;
}

function renderUniform(renderContext: DitherEffectRenderContext): void {
  const { context, outputHeight, outputWidth, settings, snapshot } = renderContext;
  const chars = getAsciiChars(settings, "uniform");
  const exposureScale = settings.exposure / 100;
  const skipThreshold = 1 - settings.fill / 100;
  const contrast = 1 + (settings.density / 10) * 1.5;
  const fontSize = getCharacterFontSizeForRender(settings.size);
  const step = getCharacterStep(settings.size, settings.density);

  context.textBaseline = "middle";
  context.textAlign = "center";
  context.font = getAsciiFont(settings, 1, fontSize, "uniform");

  for (let y = step / 2; y < outputHeight; y += step) {
    for (let x = step / 2; x < outputWidth; x += step) {
      const index = getSampleIndex(snapshot, x, y, outputWidth, outputHeight);
      const lum = luminance(snapshot.data, index);
      if (lum < skipThreshold) continue;

      const remapped = Math.pow(lum, 1 / contrast);
      const charIndex = Math.min(chars.length - 1, Math.floor((1 - remapped) * chars.length));
      const glyph = chars[charIndex] ?? " ";
      if (glyph.trim().length === 0) continue;

      const boost = 1 + (1 - lum) * 1.5;
      context.fillStyle = rgb(
        Math.min(255, snapshot.data[index] * exposureScale * boost),
        Math.min(255, snapshot.data[index + 1] * exposureScale * boost),
        Math.min(255, snapshot.data[index + 2] * exposureScale * boost),
      );
      context.globalAlpha = getScatterOpacity(settings, x, y, 31);
      context.fillText(glyph, x, y);
    }
  }
}

function renderDynamic(renderContext: DitherEffectRenderContext): void {
  const { context, outputHeight, outputWidth, settings, snapshot } = renderContext;
  const chars = getAsciiChars(settings, "dynamic");
  const exposureScale = settings.exposure / 100;
  const skipThreshold = 1 - settings.fill / 100;
  const fontSize = getCharacterFontSizeForRender(settings.size);
  const step = getCharacterStep(settings.size, settings.density);

  context.textBaseline = "middle";
  context.textAlign = "center";
  for (let y = step / 2; y < outputHeight; y += step) {
    for (let x = step / 2; x < outputWidth; x += step) {
      const index = getSampleIndex(snapshot, x, y, outputWidth, outputHeight);
      const lum = luminance(snapshot.data, index);
      if (lum < skipThreshold) continue;

      const spread = Math.floor(coordinateNoise(settings.seed, x, y, 41) * 5) - 2;
      const baseIndex = Math.floor((1 - lum) * chars.length);
      const charIndex = Math.min(chars.length - 1, Math.max(0, baseIndex + spread));
      const glyph = chars[charIndex] ?? " ";
      if (glyph.trim().length === 0) continue;

      const charSize = Math.max(4, Math.round(fontSize * (0.4 + lum * 0.8)));
      const minBright = Math.round((1 - lum) * 60);
      const alpha = getScatterOpacity(settings, x, y, 43);
      context.font = getAsciiFont(settings, lum, charSize, "dynamic");
      context.fillStyle = rgb(
        Math.max(minBright, Math.round(snapshot.data[index] * exposureScale)),
        Math.max(minBright, Math.round(snapshot.data[index + 1] * exposureScale)),
        Math.max(minBright, Math.round(snapshot.data[index + 2] * exposureScale)),
      );
      context.globalAlpha = alpha * alpha;
      context.fillText(glyph, x, y);
    }
  }
}

function getFilledOpacity(settings: DitherRenderSettings, gridX: number, gridY: number): number {
  const scatter = settings.scatter / 100;
  if (scatter === 0) return 1;

  const pairChance = Math.max(0, (scatter - 0.4) / 0.6);
  const usePairs = coordinateNoise(settings.seed, gridX, gridY, 51) < pairChance;
  const blockX = usePairs ? Math.floor(gridX / 2) : gridX;
  const value = coordinateNoise(settings.seed, blockX, gridY, 53);
  if (value < 0.3) return 1;
  return value > scatter ? 1 : 0.15;
}

function renderFilled(renderContext: DitherEffectRenderContext): void {
  const { context, outputHeight, outputWidth, settings, snapshot } = renderContext;
  const chars = getAsciiChars(settings, "filled");
  const exposureScale = settings.exposure / 100;
  const fontSize = getCharacterFontSizeForRender(settings.size);
  const step = getCharacterStep(settings.size, settings.density);
  let maxLum = 0;
  for (let index = 0; index < snapshot.data.length; index += 4) {
    maxLum = Math.max(maxLum, luminance(snapshot.data, index));
  }
  maxLum = maxLum || 1;

  context.textBaseline = "middle";
  context.textAlign = "center";
  let activeFont = "";
  let gridX = 0;
  for (let x = step / 2; x < outputWidth; x += step, gridX += 1) {
    let gridY = 0;
    for (let y = step / 2; y < outputHeight; y += step, gridY += 1) {
      const opacity = getFilledOpacity(settings, gridX, gridY);
      const index = getSampleIndex(snapshot, x, y, outputWidth, outputHeight);
      const normalizedLum = luminance(snapshot.data, index) / maxLum;
      const glyph = chars[Math.min(chars.length - 1, Math.floor(normalizedLum * chars.length))] ?? " ";
      if (glyph === " ") continue;

      const boost = Math.pow(normalizedLum, 1.5) * 2;
      const font = getAsciiFont(settings, normalizedLum, fontSize, "filled");
      if (font !== activeFont) {
        context.font = font;
        activeFont = font;
      }
      context.fillStyle = rgb(
        Math.min(255, snapshot.data[index] * boost * exposureScale),
        Math.min(255, snapshot.data[index + 1] * boost * exposureScale),
        Math.min(255, snapshot.data[index + 2] * boost * exposureScale),
      );
      context.globalAlpha = opacity;
      context.fillText(glyph, x, y);
    }
  }
}

export function renderCharacters(renderContext: DitherEffectRenderContext): void {
  if (renderContext.settings.asciiMode === "dynamic") renderDynamic(renderContext);
  else if (renderContext.settings.asciiMode === "filled") renderFilled(renderContext);
  else renderUniform(renderContext);
  renderContext.context.globalAlpha = 1;
}
