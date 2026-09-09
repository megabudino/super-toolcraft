export type VestaboardFlapClick = {
  columnRatio: number;
};

export type VestaboardAudioEngine = {
  createRecorderDestination(): MediaStreamAudioDestinationNode | null;
  dispose(): void;
  playFlapClicks(clicks: readonly VestaboardFlapClick[], volumePercent: number): void;
  resume(): void;
};

type AudioContextConstructor = new () => AudioContext;

const maxClicksPerBurst = 20;
const clickSpreadSeconds = 0.028;

function getAudioContextConstructor(): AudioContextConstructor | null {
  if (typeof window === "undefined") {
    return null;
  }

  const audioWindow = window as Window & {
    AudioContext?: AudioContextConstructor;
    webkitAudioContext?: AudioContextConstructor;
  };

  return audioWindow.AudioContext ?? audioWindow.webkitAudioContext ?? null;
}

function createNoiseBuffer(context: AudioContext): AudioBuffer {
  const length = Math.max(1, Math.floor(context.sampleRate * 0.06));
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const channel = buffer.getChannelData(0);

  for (let index = 0; index < length; index += 1) {
    channel[index] = Math.random() * 2 - 1;
  }

  return buffer;
}

function getMasterGainValue(volumePercent: number): number {
  const normalized = Math.min(100, Math.max(0, volumePercent)) / 100;

  return normalized ** 1.6 * 0.9;
}

export function createVestaboardAudioEngine(
  options: { monitor?: boolean } = {},
): VestaboardAudioEngine {
  const monitor = options.monitor !== false;
  let context: AudioContext | null = null;
  let masterGain: GainNode | null = null;
  let compressor: DynamicsCompressorNode | null = null;
  let noiseBuffer: AudioBuffer | null = null;
  let recorderDestination: MediaStreamAudioDestinationNode | null = null;
  let disposed = false;

  const ensureContext = (): AudioContext | null => {
    if (disposed) {
      return null;
    }

    if (context) {
      return context;
    }

    const AudioContextImpl = getAudioContextConstructor();

    if (!AudioContextImpl) {
      return null;
    }

    context = new AudioContextImpl();
    compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 24;
    compressor.ratio.value = 6;
    compressor.attack.value = 0.002;
    compressor.release.value = 0.08;
    masterGain = context.createGain();
    masterGain.gain.value = getMasterGainValue(60);
    masterGain.connect(compressor);

    if (monitor) {
      compressor.connect(context.destination);
    }

    noiseBuffer = createNoiseBuffer(context);

    return context;
  };

  const scheduleClick = (
    activeContext: AudioContext,
    click: VestaboardFlapClick,
  ): void => {
    if (!masterGain || !noiseBuffer) {
      return;
    }

    const startTime = activeContext.currentTime + Math.random() * clickSpreadSeconds;
    const pan = Math.min(1, Math.max(-1, (click.columnRatio * 2 - 1) * 0.7));
    const panner = activeContext.createStereoPanner();
    panner.pan.value = pan;
    panner.connect(masterGain);

    const clickPeak = 0.1 + Math.random() * 0.09;
    const noiseSource = activeContext.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    const bandpass = activeContext.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.value = 1200 + Math.random() * 1800;
    bandpass.Q.value = 1 + Math.random();
    const clickGain = activeContext.createGain();
    clickGain.gain.setValueAtTime(clickPeak, startTime);
    clickGain.gain.exponentialRampToValueAtTime(
      0.0001,
      startTime + 0.008 + Math.random() * 0.006,
    );
    noiseSource.connect(bandpass);
    bandpass.connect(clickGain);
    clickGain.connect(panner);
    noiseSource.start(startTime);
    noiseSource.stop(startTime + 0.05);

    const thock = activeContext.createOscillator();
    thock.type = "triangle";
    thock.frequency.value = 160 + Math.random() * 90;
    const thockGain = activeContext.createGain();
    thockGain.gain.setValueAtTime(clickPeak * 0.7, startTime);
    thockGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.02);
    thock.connect(thockGain);
    thockGain.connect(panner);
    thock.start(startTime);
    thock.stop(startTime + 0.05);
  };

  return {
    createRecorderDestination: () => {
      const activeContext = ensureContext();

      if (!activeContext || !compressor) {
        return null;
      }

      if (!recorderDestination) {
        recorderDestination = activeContext.createMediaStreamDestination();
        compressor.connect(recorderDestination);
      }

      return recorderDestination;
    },
    dispose: () => {
      disposed = true;
      recorderDestination = null;
      masterGain = null;
      compressor = null;
      noiseBuffer = null;

      if (context && context.state !== "closed") {
        void context.close();
      }

      context = null;
    },
    playFlapClicks: (clicks, volumePercent) => {
      if (clicks.length === 0) {
        return;
      }

      const activeContext = ensureContext();

      if (!activeContext || !masterGain) {
        return;
      }

      masterGain.gain.setTargetAtTime(
        getMasterGainValue(volumePercent),
        activeContext.currentTime,
        0.01,
      );

      const step = Math.max(1, Math.ceil(clicks.length / maxClicksPerBurst));

      for (let index = 0; index < clicks.length; index += step) {
        const click = clicks[index];

        if (click) {
          scheduleClick(activeContext, click);
        }
      }
    },
    resume: () => {
      const activeContext = ensureContext();

      if (activeContext && activeContext.state === "suspended") {
        void activeContext.resume();
      }
    },
  };
}
