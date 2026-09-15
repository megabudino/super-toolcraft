const CRT_SCANLINE_SPACING = 3;
const CRT_SCANLINE_HEIGHT = 0.9;
const CRT_SCANLINE_ALPHA = 0.09;
const CRT_SCANLINE_ALPHA_VARIANCE = 0.035;
const CRT_FLICKER_ALPHA = 0.02;
const CRT_FLICKER_ALPHA_VARIANCE = 0.035;
const CRT_ROLL_HEIGHT = 56;
const CRT_ROLL_ALPHA = 0.05;
const CRT_ROLL_SPEED = 0.032;
const CRT_SCANLINE_STEP_MS = 90;

export const GLOBE_CRT_EXPORT_PHASE_MS = 1280;

export type GlobeCrtEffectProfile = {
  flickerAlpha: number;
  rollAlpha: number;
  rollY: number;
  scanlineAlpha: number;
  scanlineOffset: number;
};

function clampPhase(phaseMs: number): number {
  return Number.isFinite(phaseMs) ? Math.max(0, phaseMs) : 0;
}

function getIntensityStrength(intensityPercent: number): number {
  if (!Number.isFinite(intensityPercent)) {
    return 0;
  }
  return Math.min(100, Math.max(0, intensityPercent)) / 100;
}

export function getGlobeCrtEffectProfile(
  phaseMs: number,
  frameHeight: number,
  intensityPercent = 100,
): GlobeCrtEffectProfile {
  const phase = clampPhase(phaseMs);
  const height = Math.max(1, frameHeight);
  const strength = getIntensityStrength(intensityPercent);
  const softWave = 0.5 + 0.5 * Math.sin(phase * 0.031);
  const fastWave = 0.5 + 0.5 * Math.sin(phase * 0.083 + 1.7);
  const flickerWave = softWave * 0.75 + fastWave * 0.25;

  return {
    flickerAlpha:
      (CRT_FLICKER_ALPHA + flickerWave * CRT_FLICKER_ALPHA_VARIANCE) *
        strength,
    rollAlpha: CRT_ROLL_ALPHA * strength,
    rollY: (phase * CRT_ROLL_SPEED) % (height + CRT_ROLL_HEIGHT) -
      CRT_ROLL_HEIGHT,
    scanlineAlpha:
      (CRT_SCANLINE_ALPHA + softWave * CRT_SCANLINE_ALPHA_VARIANCE) *
        strength,
    scanlineOffset: Math.floor(phase / CRT_SCANLINE_STEP_MS) %
      CRT_SCANLINE_SPACING,
  };
}

export function applyGlobeCrtEffect(
  context: CanvasRenderingContext2D,
  frameWidth: number,
  frameHeight: number,
  phaseMs: number,
  intensityPercent = 100,
): void {
  if (frameWidth <= 0 || frameHeight <= 0) {
    return;
  }

  const profile = getGlobeCrtEffectProfile(
    phaseMs,
    frameHeight,
    intensityPercent,
  );
  if (
    profile.flickerAlpha <= 0 &&
    profile.scanlineAlpha <= 0 &&
    profile.rollAlpha <= 0
  ) {
    return;
  }

  context.save();
  context.globalCompositeOperation = "source-atop";

  context.fillStyle = `rgba(0, 0, 0, ${profile.flickerAlpha})`;
  context.fillRect(0, 0, frameWidth, frameHeight);

  context.fillStyle = `rgba(0, 0, 0, ${profile.scanlineAlpha})`;
  for (
    let y = profile.scanlineOffset;
    y < frameHeight;
    y += CRT_SCANLINE_SPACING
  ) {
    context.fillRect(0, y, frameWidth, CRT_SCANLINE_HEIGHT);
  }

  const rollStart = profile.rollY;
  const rollEnd = rollStart + CRT_ROLL_HEIGHT;
  if (rollEnd > 0 && rollStart < frameHeight) {
    const rollGradient = context.createLinearGradient(0, rollStart, 0, rollEnd);
    rollGradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    rollGradient.addColorStop(0.5, `rgba(0, 0, 0, ${profile.rollAlpha})`);
    rollGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    context.fillStyle = rollGradient;
    context.fillRect(
      0,
      Math.max(0, rollStart),
      frameWidth,
      Math.min(CRT_ROLL_HEIGHT, frameHeight - rollStart),
    );
  }

  context.restore();
}
