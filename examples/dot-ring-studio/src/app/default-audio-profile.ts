import frames from "./default-audio-frames.json";
import type {
  DotRingAudioFrame,
  DotRingAudioProfile,
} from "./dot-ring-types";

function createFrame(values: readonly number[]): DotRingAudioFrame {
  const [
    energy = 0,
    bass = 0,
    lowMid = 0,
    mid = 0,
    high = 0,
    transient = 0,
    centroid = 0,
    wave = 0,
  ] = values;

  return {
    bass,
    centroid,
    energy,
    high,
    lowMid,
    mid,
    transient,
    wave,
  };
}

export const defaultDotRingAudioProfile: DotRingAudioProfile = {
  durationSeconds: 143.2,
  frameRate: 30,
  frames: frames.map(createFrame),
  sourceName: "Minimal Electro Bass Pulse",
};
