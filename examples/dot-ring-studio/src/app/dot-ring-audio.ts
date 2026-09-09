import type {
  ToolcraftFileAsset,
  ToolcraftMediaAsset,
  ToolcraftState,
} from "@/toolcraft/runtime";

import { defaultDotRingAudioProfile } from "./default-audio-profile";
import type { DotRingAudioFrame, DotRingAudioProfile } from "./dot-ring-drawing";

const profileFrameRate = 30;
const maxAnalysisDurationSeconds = 180;

const decodedProfileCache = new Map<string, Promise<DotRingAudioProfile>>();
const resolvedProfileCache = new Map<string, DotRingAudioProfile>();

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function alpha(cutoff: number, sampleRate: number): number {
  return 1 - Math.exp((-2 * Math.PI * cutoff) / sampleRate);
}

function percentile(values: readonly number[], percentileValue: number): number {
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.floor((sorted.length - 1) * percentileValue)),
  );

  return sorted[index] || 1;
}

function normalize(
  value: number,
  scale: number,
  power: number,
): number {
  return clamp01((value / Math.max(0.000001, scale)) ** power);
}

function getMonoSample(channels: readonly Float32Array[], sampleIndex: number): number {
  if (channels.length === 0) {
    return 0;
  }

  if (channels.length === 1) {
    return channels[0]?.[sampleIndex] ?? 0;
  }

  return ((channels[0]?.[sampleIndex] ?? 0) + (channels[1]?.[sampleIndex] ?? 0)) / 2;
}

function smoothFrames(frames: readonly DotRingAudioFrame[]): DotRingAudioFrame[] {
  const [firstFrame] = frames;

  if (!firstFrame) {
    return [];
  }

  const output: DotRingAudioFrame[] = [];
  let previous = firstFrame;

  for (const frame of frames) {
    const attack = frame.energy > previous.energy ? 0.72 : 0.38;
    const current = {
      bass: previous.bass + (frame.bass - previous.bass) * attack,
      centroid: previous.centroid + (frame.centroid - previous.centroid) * 0.5,
      energy: previous.energy + (frame.energy - previous.energy) * attack,
      high: previous.high + (frame.high - previous.high) * attack,
      lowMid: previous.lowMid + (frame.lowMid - previous.lowMid) * attack,
      mid: previous.mid + (frame.mid - previous.mid) * attack,
      transient: Math.max(frame.transient, previous.transient * 0.35),
      wave: previous.wave * 0.18 + frame.wave * 0.82,
    };

    output.push(current);
    previous = current;
  }

  return output;
}

export function isDotRingAudioAsset(
  asset: ToolcraftMediaAsset,
): asset is ToolcraftFileAsset {
  return (
    asset.assetKind === "file" &&
    (
      asset.mimeType.startsWith("audio/") ||
      /\.(aac|aif|aiff|flac|m4a|mp3|ogg|wav|webm)$/i.test(asset.fileName)
    )
  );
}

export function getDotRingAudioAsset(
  state: ToolcraftState,
): ToolcraftFileAsset | undefined {
  return state.mediaAssets.find(isDotRingAudioAsset);
}

export function buildDotRingAudioProfileFromBuffer(
  audioBuffer: AudioBuffer,
  sourceName: string,
): DotRingAudioProfile {
  return buildDotRingAudioProfileFromChannels(
    Array.from(
      { length: Math.min(2, audioBuffer.numberOfChannels) },
      (_, index) => audioBuffer.getChannelData(index),
    ),
    audioBuffer.sampleRate,
    sourceName,
  );
}

function buildDotRingAudioProfileFromChannels(
  channels: readonly Float32Array[],
  sampleRate: number,
  sourceName: string,
): DotRingAudioProfile {
  const availableSamples = Math.max(0, channels[0]?.length ?? 0);
  const sampleCount = Math.min(
    availableSamples,
    Math.floor(sampleRate * maxAnalysisDurationSeconds),
  );
  const frameSamples = Math.max(1, Math.round(sampleRate / profileFrameRate));
  const frameCount = Math.max(1, Math.floor(sampleCount / frameSamples));
  const bassAlpha = alpha(140, sampleRate);
  const lowMidAlpha = alpha(700, sampleRate);
  const midAlpha = alpha(2600, sampleRate);
  let bassLowPass = 0;
  let lowMidLowPass = 0;
  let midLowPass = 0;
  let previousEnergy = 0;
  const rawFrames: (DotRingAudioFrame & { rawTransient: number })[] = [];

  for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
    let bassSquared = 0;
    let lowMidSquared = 0;
    let midSquared = 0;
    let highSquared = 0;
    let energySquared = 0;
    let signedPeak = 0;

    for (let offset = 0; offset < frameSamples; offset += 1) {
      const sample = getMonoSample(channels, frameIndex * frameSamples + offset);

      bassLowPass += bassAlpha * (sample - bassLowPass);
      lowMidLowPass += lowMidAlpha * (sample - lowMidLowPass);
      midLowPass += midAlpha * (sample - midLowPass);

      const bass = bassLowPass;
      const lowMid = lowMidLowPass - bassLowPass;
      const mid = midLowPass - lowMidLowPass;
      const high = sample - midLowPass;

      bassSquared += bass * bass;
      lowMidSquared += lowMid * lowMid;
      midSquared += mid * mid;
      highSquared += high * high;
      energySquared += sample * sample;

      if (Math.abs(sample) > Math.abs(signedPeak)) {
        signedPeak = sample;
      }
    }

    const rms = (sum: number) => Math.sqrt(sum / frameSamples);
    const bass = rms(bassSquared);
    const lowMid = rms(lowMidSquared);
    const mid = rms(midSquared);
    const high = rms(highSquared);
    const energy = rms(energySquared);
    const rawTransient = Math.max(0, energy - previousEnergy * 0.93);
    const centroid =
      (lowMid * 0.22 + mid * 0.56 + high * 0.92) /
      Math.max(0.000001, bass + lowMid + mid + high);

    previousEnergy = energy;
    rawFrames.push({
      bass,
      centroid: clamp01(centroid),
      energy,
      high,
      lowMid,
      mid,
      rawTransient,
      transient: rawTransient,
      wave: Math.sign(signedPeak) * Math.sqrt(Math.min(1, Math.abs(signedPeak) * 1.9)),
    });
  }

  const scales = {
    bass: percentile(rawFrames.map((frame) => frame.bass), 0.96),
    energy: percentile(rawFrames.map((frame) => frame.energy), 0.96),
    high: percentile(rawFrames.map((frame) => frame.high), 0.96),
    lowMid: percentile(rawFrames.map((frame) => frame.lowMid), 0.96),
    mid: percentile(rawFrames.map((frame) => frame.mid), 0.96),
    transient: percentile(rawFrames.map((frame) => frame.rawTransient), 0.985),
  };

  const frames = rawFrames.map((frame) => ({
    bass: normalize(frame.bass, scales.bass, 0.48),
    centroid: frame.centroid,
    energy: normalize(frame.energy, scales.energy, 0.5),
    high: normalize(frame.high, scales.high, 0.62),
    lowMid: normalize(frame.lowMid, scales.lowMid, 0.55),
    mid: normalize(frame.mid, scales.mid, 0.58),
    transient: normalize(frame.rawTransient, scales.transient, 0.45),
    wave: Math.max(-1, Math.min(1, frame.wave)),
  }));

  return {
    durationSeconds: sampleCount / sampleRate,
    frameRate: profileFrameRate,
    frames: smoothFrames(frames),
    sourceName,
  };
}

function readAscii(view: DataView, offset: number, length: number): string {
  let value = "";

  for (let index = 0; index < length; index += 1) {
    value += String.fromCharCode(view.getUint8(offset + index));
  }

  return value;
}

function decodePcmSample(
  view: DataView,
  offset: number,
  bitsPerSample: number,
  audioFormat: number,
): number {
  if (audioFormat === 3 && bitsPerSample === 32) {
    return Math.max(-1, Math.min(1, view.getFloat32(offset, true)));
  }

  if (bitsPerSample === 8) {
    return (view.getUint8(offset) - 128) / 128;
  }

  if (bitsPerSample === 16) {
    return view.getInt16(offset, true) / 32768;
  }

  if (bitsPerSample === 24) {
    const unsigned =
      view.getUint8(offset) |
      (view.getUint8(offset + 1) << 8) |
      (view.getUint8(offset + 2) << 16);
    const signed = unsigned & 0x800000 ? unsigned | 0xff000000 : unsigned;
    return signed / 8388608;
  }

  if (bitsPerSample === 32) {
    return view.getInt32(offset, true) / 2147483648;
  }

  return 0;
}

function tryBuildDotRingAudioProfileFromWav(
  data: ArrayBuffer,
  sourceName: string,
): DotRingAudioProfile | null {
  const view = new DataView(data);

  if (
    view.byteLength < 44 ||
    readAscii(view, 0, 4) !== "RIFF" ||
    readAscii(view, 8, 4) !== "WAVE"
  ) {
    return null;
  }

  let audioFormat = 0;
  let bitsPerSample = 0;
  let channelCount = 0;
  let sampleRate = 0;
  let dataOffset = 0;
  let dataSize = 0;
  let offset = 12;

  while (offset + 8 <= view.byteLength) {
    const chunkId = readAscii(view, offset, 4);
    const chunkSize = view.getUint32(offset + 4, true);
    const chunkDataOffset = offset + 8;

    if (chunkId === "fmt " && chunkDataOffset + 16 <= view.byteLength) {
      audioFormat = view.getUint16(chunkDataOffset, true);
      channelCount = view.getUint16(chunkDataOffset + 2, true);
      sampleRate = view.getUint32(chunkDataOffset + 4, true);
      bitsPerSample = view.getUint16(chunkDataOffset + 14, true);
    }

    if (chunkId === "data") {
      dataOffset = chunkDataOffset;
      dataSize = chunkSize;
      break;
    }

    offset = chunkDataOffset + chunkSize + (chunkSize % 2);
  }

  if (
    !dataOffset ||
    !dataSize ||
    channelCount <= 0 ||
    sampleRate <= 0 ||
    (audioFormat !== 1 && audioFormat !== 3)
  ) {
    return null;
  }

  const bytesPerSample = bitsPerSample / 8;

  if (!Number.isInteger(bytesPerSample) || bytesPerSample <= 0) {
    return null;
  }

  const sourceChannelCount = Math.min(2, channelCount);
  const sourceFrameCount = Math.floor(
    Math.min(dataSize, view.byteLength - dataOffset) / (bytesPerSample * channelCount),
  );
  const sampleCount = Math.min(
    sourceFrameCount,
    Math.floor(sampleRate * maxAnalysisDurationSeconds),
  );
  const channels = Array.from(
    { length: sourceChannelCount },
    () => new Float32Array(sampleCount),
  );

  for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex += 1) {
    const frameOffset = dataOffset + sampleIndex * bytesPerSample * channelCount;

    for (let channelIndex = 0; channelIndex < sourceChannelCount; channelIndex += 1) {
      channels[channelIndex]![sampleIndex] = decodePcmSample(
        view,
        frameOffset + channelIndex * bytesPerSample,
        bitsPerSample,
        audioFormat,
      );
    }
  }

  return buildDotRingAudioProfileFromChannels(channels, sampleRate, sourceName);
}

export async function decodeDotRingAudioAsset(
  asset: ToolcraftFileAsset,
  sourceUrl: string,
): Promise<DotRingAudioProfile> {
  if (asset.lifecycle === "unavailable") {
    throw new Error("The selected audio source is unavailable.");
  }

  const cached = decodedProfileCache.get(asset.resourceRef);

  if (cached) {
    return cached;
  }

  const promise = (async () => {
    const response = await fetch(sourceUrl);
    const data = await response.arrayBuffer();
    const wavProfile = tryBuildDotRingAudioProfileFromWav(data, asset.fileName);

    if (wavProfile) {
      return wavProfile;
    }

    const AudioContextConstructor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextConstructor) {
      throw new Error("This browser cannot decode audio sources.");
    }

    const context = new AudioContextConstructor();

    try {
      const audioBuffer = await context.decodeAudioData(data.slice(0));
      return buildDotRingAudioProfileFromBuffer(audioBuffer, asset.fileName);
    } finally {
      await context.close().catch(() => undefined);
    }
  })();

  decodedProfileCache.set(asset.resourceRef, promise);
  const profile = await promise;
  resolvedProfileCache.set(asset.resourceRef, profile);
  return profile;
}

export async function getDotRingAudioProfileForState(
  state: ToolcraftState,
  sourceUrl?: string,
): Promise<DotRingAudioProfile> {
  const audioAsset = getDotRingAudioAsset(state);

  if (!audioAsset) {
    return defaultDotRingAudioProfile;
  }

  if (!sourceUrl) {
    return getCachedDotRingAudioProfileForState(state);
  }

  return decodeDotRingAudioAsset(audioAsset, sourceUrl);
}

export function getCachedDotRingAudioProfileForState(
  state: ToolcraftState,
): DotRingAudioProfile {
  const audioAsset = getDotRingAudioAsset(state);

  if (
    !audioAsset ||
    audioAsset.lifecycle === "unavailable"
  ) {
    return defaultDotRingAudioProfile;
  }

  return (
    resolvedProfileCache.get(audioAsset.resourceRef) ?? defaultDotRingAudioProfile
  );
}

export function getDefaultDotRingAudioProfile(): DotRingAudioProfile {
  return defaultDotRingAudioProfile;
}
