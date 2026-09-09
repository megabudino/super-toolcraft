import type {
  DotRingAudioFrame,
  DotRingAudioProfile,
  DotRingSettings,
  DotRingWaveFormula,
} from "./dot-ring-types";

export const TAU = Math.PI * 2;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function hash01(value: number): number {
  const raw = Math.sin(value * 127.1 + 311.7) * 43758.5453123;
  return raw - Math.floor(raw);
}

function angularDistance(a: number, b: number): number {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const ratio = clamp((value - edge0) / Math.max(0.0001, edge1 - edge0), 0, 1);
  return ratio * ratio * (3 - 2 * ratio);
}

function gaussian(value: number, width: number): number {
  return Math.exp(-0.5 * (value / Math.max(0.0001, width)) ** 2);
}

function signedPower(value: number, power: number): number {
  return Math.sign(value) * Math.abs(value) ** power;
}

function periodicNoise(angle: number, row: number, salt: number): number {
  return (
    Math.sin(angle * 7 + row * 0.71 + salt) * 0.5 +
    Math.sin(angle * 13 - row * 0.37 + salt * 1.71) * 0.3 +
    Math.sin(angle * 29 + row * 0.19 - salt * 0.63) * 0.2
  );
}

export function getLoopProgress(
  timeSeconds: number,
  durationSeconds: number,
): number {
  const duration = Math.max(0.001, durationSeconds);
  const normalized = timeSeconds / duration;
  return normalized - Math.floor(normalized);
}

function bandSignal(
  x: number,
  phase: number,
  seed: number,
  bands: readonly (readonly [frequency: number, temporal: number, weight: number])[],
): number {
  const weightTotal = bands.reduce((sum, [, , weight]) => sum + Math.abs(weight), 0);

  if (weightTotal <= 0) {
    return 0;
  }

  const signal = bands.reduce((sum, [frequency, temporal, weight], bandIndex) => {
    const seedPhase = seed * (0.73 + bandIndex * 0.19);
    return sum + Math.sin(x * frequency + phase * temporal + seedPhase) * weight;
  }, 0);

  return signal / weightTotal;
}

const calmBands = [
  [6, -1, 0.34],
  [10, 1, 0.28],
  [16, -1, 0.22],
  [24, 1, 0.12],
] as const;

const activeBands = [
  [12, -1, 0.3],
  [18, 1, 0.25],
  [26, -2, 0.18],
  [34, 2, 0.13],
  [45, -1, 0.08],
] as const;

const turbulentBands = [
  [23, -2, 0.22],
  [37, 3, 0.2],
  [54, -3, 0.18],
  [71, 5, 0.14],
  [96, -4, 0.11],
  [121, 6, 0.08],
] as const;

const pulseBands = [
  [9, -1, 0.36],
  [18, 1, 0.3],
  [27, -1, 0.2],
  [36, 2, 0.1],
] as const;

const complexBands = [
  [7, -1, 0.2],
  [11, 2, 0.18],
  [17, -3, 0.16],
  [25, 4, 0.13],
  [39, -2, 0.1],
  [58, 5, 0.08],
  [83, -4, 0.05],
] as const;

const complexTextureBands = [
  [5, 1, 0.18],
  [13, -2, 0.15],
  [29, 3, 0.12],
  [47, -5, 0.1],
  [76, 4, 0.07],
] as const;

function mix(left: number, right: number, amount: number): number {
  return left + (right - left) * amount;
}

function getSpeedMix(speed: number): number {
  return clamp((speed - 0.2) / 1.4, 0, 1);
}

function getLoopWarp(phase: number, speedMix: number): number {
  return (
    Math.sin(phase) * mix(-0.34, 0.4, speedMix) +
    Math.sin(phase * 2 + 0.7) * mix(0.08, 0.24, speedMix) +
    Math.sin(phase * 3 - 0.3) * mix(0.02, 0.12, speedMix)
  );
}

function getLoopSafeOrbitPhase(
  progress: number,
  requestedTurns: number,
  minTurns: number,
  maxTurns: number,
): number {
  const desiredTurns = clamp(requestedTurns, minTurns, maxTurns);

  if (Math.abs(desiredTurns) <= 0.001) {
    return 0;
  }

  let endpointTurns = Math.round(desiredTurns);

  if (endpointTurns === 0) {
    endpointTurns = Math.sign(desiredTurns);
  }

  const correction = progress - Math.sin(TAU * progress) / TAU;
  const correctedTurns =
    desiredTurns * progress + (endpointTurns - desiredTurns) * correction;

  return correctedTurns * TAU;
}

export function getLoopClosedGlobalPhase(
  progress: number,
  amount: number,
): number {
  const magnitude = clamp(Math.abs(amount), 0, 0.5);

  if (magnitude <= 0.001) {
    return 0;
  }

  const direction = Math.sign(amount);
  const phase = progress * TAU;
  const driftTurns =
    Math.sin(phase) * 0.46 +
    Math.sin(phase * 2 - 0.8) * 0.14 +
    Math.sin(phase * 3 + 0.55) * 0.06;

  return direction * magnitude * driftTurns * 0.16;
}

export function getGlobalAngularRipple(
  angle: number,
  row: number,
  progress: number,
  amount: number,
): number {
  const magnitude = clamp(Math.abs(amount), 0, 0.5);

  if (magnitude <= 0.001) {
    return 0;
  }

  const direction = Math.sign(amount);
  const phase = progress * TAU;
  const packetA = angle * 3 - phase * 1.24 + row * 0.2;
  const packetB = angle * 5 - phase * 1.76 - row * 0.14;
  const envelope =
    0.62 +
    0.38 *
      Math.sin(angle * 2 - phase * 0.52 + Math.sin(angle * 4 + phase * 0.25)) **
        2;
  const ripple =
    Math.sin(packetA + Math.sin(packetB) * 0.38) * 0.6 +
    Math.sin(packetB + Math.sin(packetA * 0.7) * 0.24) * 0.27 +
    Math.sin(angle * 9 - phase * 0.7 + row * 0.31) * 0.13;

  return direction * magnitude * 0.36 * envelope * ripple;
}

function getFormulaBands(formula: DotRingWaveFormula) {
  if (formula === "complex") {
    return complexBands;
  }

  if (formula === "pulse") {
    return pulseBands;
  }

  if (formula === "turbulent") {
    return turbulentBands;
  }

  return activeBands;
}

function getFormulaSharpness(formula: DotRingWaveFormula): number {
  if (formula === "complex") {
    return 0.74;
  }

  if (formula === "pulse") {
    return 1.45;
  }

  if (formula === "turbulent") {
    return 0.82;
  }

  return 1;
}

function positiveModulo(value: number, divisor: number): number {
  const safeDivisor = Math.max(0.0001, divisor);
  return ((value % safeDivisor) + safeDivisor) % safeDivisor;
}

function mixAudioFrame(
  left: DotRingAudioFrame,
  right: DotRingAudioFrame,
  amount: number,
): DotRingAudioFrame {
  return {
    bass: mix(left.bass, right.bass, amount),
    centroid: mix(left.centroid, right.centroid, amount),
    energy: mix(left.energy, right.energy, amount),
    high: mix(left.high, right.high, amount),
    lowMid: mix(left.lowMid, right.lowMid, amount),
    mid: mix(left.mid, right.mid, amount),
    transient: mix(left.transient, right.transient, amount),
    wave: mix(left.wave, right.wave, amount),
  };
}

const silentAudioFrame: DotRingAudioFrame = {
  bass: 0,
  centroid: 0,
  energy: 0,
  high: 0,
  lowMid: 0,
  mid: 0,
  transient: 0,
  wave: 0,
};

function sampleAudioFrameAt(
  audioProfile: DotRingAudioProfile,
  seconds: number,
): DotRingAudioFrame {
  const { frames } = audioProfile;

  if (frames.length === 0 || audioProfile.durationSeconds <= 0) {
    return silentAudioFrame;
  }

  const wrappedSeconds = positiveModulo(seconds, audioProfile.durationSeconds);
  const framePosition =
    (wrappedSeconds / audioProfile.durationSeconds) * Math.max(1, frames.length - 1);
  const frameIndex = Math.floor(framePosition);
  const nextIndex = (frameIndex + 1) % frames.length;
  const amount = framePosition - frameIndex;

  return mixAudioFrame(
    frames[frameIndex] ?? silentAudioFrame,
    frames[nextIndex] ?? silentAudioFrame,
    amount,
  );
}

function sampleLoopedAudioFrame(
  audioProfile: DotRingAudioProfile | null | undefined,
  seconds: number,
  loopWindowSeconds: number,
): DotRingAudioFrame {
  if (!audioProfile || audioProfile.frames.length === 0) {
    return silentAudioFrame;
  }

  const safeLoopWindow = Math.min(
    Math.max(0.2, loopWindowSeconds),
    Math.max(0.2, audioProfile.durationSeconds),
  );
  const localSeconds = positiveModulo(seconds, safeLoopWindow);
  const primary = sampleAudioFrameAt(audioProfile, localSeconds);
  const fadeSeconds = Math.min(0.9, safeLoopWindow * 0.08);

  if (localSeconds > safeLoopWindow - fadeSeconds) {
    const amount = smoothstep(safeLoopWindow - fadeSeconds, safeLoopWindow, localSeconds);
    return mixAudioFrame(primary, sampleAudioFrameAt(audioProfile, 0), amount);
  }

  return primary;
}

function sampleSmoothedLoopedAudioFrame(
  audioProfile: DotRingAudioProfile | null | undefined,
  seconds: number,
  loopWindowSeconds: number,
  spreadSeconds: number,
): DotRingAudioFrame {
  const center = sampleLoopedAudioFrame(audioProfile, seconds, loopWindowSeconds);

  if (!audioProfile || audioProfile.frames.length === 0 || spreadSeconds <= 0) {
    return center;
  }

  const previous = sampleLoopedAudioFrame(
    audioProfile,
    seconds - spreadSeconds,
    loopWindowSeconds,
  );
  const next = sampleLoopedAudioFrame(
    audioProfile,
    seconds + spreadSeconds,
    loopWindowSeconds,
  );
  const shoulder = mixAudioFrame(previous, next, 0.5);

  return mixAudioFrame(shoulder, center, 0.58);
}

export function getWaveDisplacement(
  angle: number,
  _index: number,
  row: number,
  settings: DotRingSettings,
  audioProfile: DotRingAudioProfile | null | undefined,
  durationSeconds: number,
  progress: number,
  timeSeconds: number,
): number {
  const {
    affectedAmplitude,
    calmAmplitude,
    formula,
    rotationSpeed,
    sectorAngle,
    speed,
  } = settings;
  const phase = progress * TAU;
  const speedMix = getSpeedMix(speed);
  const pulsePhase = phase + getLoopWarp(phase, speedMix);
  const rotationPhase = getLoopSafeOrbitPhase(progress, rotationSpeed, 0, 4);
  const rotationWarp =
    formula === "audio"
      ? Math.sin(phase * 2 + 0.4) * 0.045 + Math.sin(phase * 5 - 1.1) * 0.02
      : Math.sin(phase * 2 + 0.4) * mix(0.04, 0.14, speedMix) +
        Math.sin(phase * 3 - 1.1) * mix(0.01, 0.045, speedMix);
  const sectorCenter = Math.PI + rotationPhase + rotationWarp;
  const sectorWidth = (sectorAngle / 360) * TAU;
  const distance = angularDistance(angle, sectorCenter);
  const distanceAbs = Math.abs(distance);
  const seed = (periodicNoise(angle, row, 0.41) + 1) * Math.PI;
  const softWindow = 1 - smoothstep(sectorWidth * 0.45, sectorWidth * 0.62, distanceAbs);
  const secondaryLeft = angularDistance(angle, sectorCenter - sectorWidth * 0.38);
  const secondaryRight = angularDistance(angle, sectorCenter + sectorWidth * 0.34);
  const activeEnvelope =
    gaussian(distance, sectorWidth * 0.32) * softWindow +
    gaussian(secondaryLeft, sectorWidth * 0.16) *
      (0.22 + 0.08 * Math.sin(phase * 2 + seed * 0.17)) +
    gaussian(secondaryRight, sectorWidth * 0.14) *
      (0.16 + 0.07 * Math.cos(phase * 3 - seed * 0.11));
  const calmTheta =
    angle -
    pulsePhase * mix(0.45, 1.55, speedMix) +
    Math.sin(phase + angle * 2) * 0.035 +
    row * 0.017;
  const calmTravel =
    Math.sin(angle * 8 - pulsePhase * mix(0.9, 1.8, speedMix) + row * 0.2) * 0.32 +
    Math.sin(angle * 13 - pulsePhase * mix(1.2, 2.3, speedMix) + seed * 0.09) * 0.2 +
    Math.sin(angle * 21 - pulsePhase * mix(1.5, 2.8, speedMix) + seed * 0.14) * 0.12;
  const calmSignal =
    calmTravel * 0.68 +
    bandSignal(calmTheta, 0, seed, calmBands) * 0.26 +
    periodicNoise(angle, row, 1.73) * 0.015;
  const formulaBands = getFormulaBands(formula);
  const sharpness = getFormulaSharpness(formula);
  // Polar Gabor packet: a localized active envelope carrying several
  // loop-closed harmonics so the ring reads as an audio waveform, not a spline.
  const packetCarrier = bandSignal(distance, pulsePhase, seed + row * 0.29, formulaBands);
  const packetTexture =
    bandSignal(angle + distance * 0.35, pulsePhase, seed * 1.7, turbulentBands) *
      mix(0.04, 0.18, formula === "turbulent" ? 1 : speedMix) +
    periodicNoise(angle, row, 2.67) *
      0.5 *
      Math.sin(phase * (1 + Math.round(speedMix * 2)) + seed) *
      mix(0.02, 0.06, formula === "turbulent" ? 1 : speedMix);
  const shapedPacket =
    Math.sign(packetCarrier) *
      Math.abs(packetCarrier) ** sharpness *
      (0.62 + Math.abs(packetCarrier) * 0.38) +
    packetTexture;
  const formulaGain =
    formula === "pulse"
      ? 1.05
      : formula === "turbulent"
        ? 0.82
        : formula === "complex"
          ? 1
          : 0.92;

  if (formula === "audio" && audioProfile?.frames.length) {
    const loopWindowSeconds = Math.min(
      audioProfile.durationSeconds,
      Math.max(0.6, durationSeconds * speed),
    );
    const ringTravelSeconds = mix(0.08, 0.42, speedMix);
    const audioSmoothSeconds = mix(0.09, 0.045, speedMix);
    const periodicTravel =
      Math.sin(angle) * 0.72 +
      Math.sin(angle * 2 - 0.65) * 0.2 +
      Math.sin(angle * 3 + 1.1) * 0.08;
    const angleOffsetSeconds =
      -periodicTravel * ringTravelSeconds + row * 0.022;
    const sectorOffsetSeconds =
      (angularDistance(angle, sectorCenter) / Math.max(0.08, sectorWidth)) *
      ringTravelSeconds *
      0.04;
    const audioFrame = sampleLoopedAudioFrame(
      audioProfile,
      timeSeconds * speed + angleOffsetSeconds,
      loopWindowSeconds,
    );
    const activeFrame = sampleSmoothedLoopedAudioFrame(
      audioProfile,
      timeSeconds * speed + angleOffsetSeconds * 0.35 + sectorOffsetSeconds,
      loopWindowSeconds,
      audioSmoothSeconds * 0.72,
    );
    const calmWave = signedPower(audioFrame.wave, 0.78);
    const calmAudioSignal =
      calmWave * (0.46 + audioFrame.energy * 0.24) +
      (audioFrame.energy - 0.5) * 0.28 +
      (audioFrame.lowMid - 0.46) * 0.18 +
      Math.sin(angle * 11 - pulsePhase * 0.22 + seed * 0.04) *
        audioFrame.high *
        0.08;
    const activeEnergy =
      activeFrame.bass * 0.48 +
      activeFrame.energy * 0.36 +
      activeFrame.transient * 0.42 +
      activeFrame.lowMid * 0.14;
    const activeWave = signedPower(activeFrame.wave, 0.68);
    const transientKick = smoothstep(0.22, 0.94, activeFrame.transient);
    const compressedTransient = transientKick / (1 + transientKick * 0.55);
    const connectedRidge = Math.sin(
      distance * mix(4.2, 8.8, activeFrame.centroid) -
        pulsePhase * 0.16 +
        row * 0.18,
    );
    const spikeSign =
      Math.abs(activeWave) > 0.06
        ? Math.sign(activeWave)
        : Math.sign(connectedRidge || 1);
    const signedImpact =
      spikeSign *
      Math.max(0.05, activeEnergy) ** 0.96 *
      (0.22 + compressedTransient * 0.56 + activeFrame.bass * 0.18);
    const audioCarrier =
      activeWave * (0.82 + activeFrame.energy * 0.42) +
      signedImpact +
      connectedRidge * (0.1 + activeFrame.high * 0.12) +
      (activeFrame.bass - 0.5) * 0.18 +
      (activeFrame.mid - 0.38) * 0.12 +
      Math.sin(
        angle * mix(9, 22, activeFrame.centroid) -
          pulsePhase * 0.08 +
          seed * 0.07,
      ) *
        (0.035 + activeFrame.high * 0.09);
    const calmMotion =
      calmAudioSignal * (0.8 + audioFrame.energy * 0.36) +
      calmSignal * 0.06;
    const activeMotion =
      audioCarrier * (0.88 + activeEnergy * 0.92) +
      shapedPacket * (0.025 + compressedTransient * 0.04);
    const focusedEnvelope = Math.min(1.22, activeEnvelope) ** 0.92;

    return (
      calmAmplitude * calmMotion +
      affectedAmplitude * focusedEnvelope * activeMotion
    );
  }

  if (formula === "complex") {
    const warp =
      Math.sin(angle * 3 - pulsePhase * mix(0.7, 1.4, speedMix) + seed * 0.21) *
        0.2 +
      Math.sin(angle * 7 + pulsePhase * mix(1.1, 2.2, speedMix) + seed * 0.43) *
        0.13 +
      Math.sin(distance * 5 - pulsePhase * mix(0.6, 1.1, speedMix) + seed * 0.17) *
        0.16;
    const warpedDistance = distance + warp * (0.48 + activeEnvelope * 0.22);
    const warpedAngle = angle + warp * 0.62;
    const ridgePacket =
      bandSignal(warpedDistance, pulsePhase * 1.19, seed + row * 0.31, complexBands) *
        0.86 +
      bandSignal(
        warpedAngle + warpedDistance * 0.55,
        pulsePhase * 0.83,
        seed * 1.91,
        complexTextureBands,
      ) *
        0.34 +
      Math.sin(
        warpedDistance * 21 -
          pulsePhase * mix(1.3, 2.7, speedMix) +
          Math.sin(warpedAngle * 5 + seed * 0.5) * 0.92,
      ) *
        0.22 +
      Math.sin(warpedAngle * 34 + pulsePhase * mix(0.4, 1.2, speedMix) + seed) *
        0.08;
    const ridgeGate =
      0.72 +
      0.28 *
        Math.sin(angle * 4 - pulsePhase * mix(0.35, 0.9, speedMix) + seed * 0.23);
    const asymmetry =
      0.76 +
      0.24 *
        smoothstep(
          -0.45,
          0.95,
          Math.sin(warpedAngle * 2 + pulsePhase * 0.37 + seed * 0.29),
        );
    const complexMotion =
      Math.tanh(ridgePacket * 1.85) *
      ridgeGate *
      asymmetry *
      (0.76 + Math.min(1.25, activeEnvelope) * 0.24);
    const complexCalm =
      bandSignal(
        angle + Math.sin(angle * 3 + pulsePhase * 0.25) * 0.08,
        pulsePhase * 0.54,
        seed * 0.77,
        complexTextureBands,
      ) * 0.16;

    return (
      calmAmplitude * (calmSignal + complexCalm) +
      affectedAmplitude * formulaGain * Math.min(1.28, activeEnvelope) ** 0.82 * complexMotion
    );
  }

  return (
    calmAmplitude * calmSignal +
    affectedAmplitude * formulaGain * activeEnvelope * shapedPacket
  );
}
