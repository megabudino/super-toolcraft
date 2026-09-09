import type { HeroMotionRawPixelSample } from "../src/app/hero-motion-pixel-types";

export type HeroMotionPixelPairEvidence = Readonly<{
  meanAbsoluteLumaDelta: number;
  temporalResidualVariance: number;
  temporalResidualNeighborCorrelation: number;
}>;

export type HeroMotionTemporalExcessMatch = Readonly<{
  activeCorrelation: number;
  activeOrdinal: number;
  activeVariance: number;
  controlCorrelation: number;
  controlVariance: number;
  excessAmplitude: number;
  frameDtDelta: number;
  ordinal: number;
  panRateDelta: number;
}>;

export type HeroMotionTemporalExcessSummary = Readonly<{
  matches: readonly HeroMotionTemporalExcessMatch[];
  score: number;
}>;

export type HeroMotionAmountMateriality = Readonly<{
  absoluteMinimum: number;
  absolutePass: boolean;
  passes: boolean;
  relativeMinimum: number;
  relativePass: boolean;
}>;

export type HeroMotionMatchedCorrelationSummary = Readonly<{
  activeCorrelation: number;
  controlCorrelation: number;
  matches: readonly HeroMotionTemporalExcessMatch[];
}>;

export const MAX_HERO_MOTION_FRAME_DT_DELTA = 0.000_001;
export const MAX_HERO_MOTION_PAN_RATE_DELTA = 0.005;

const MINIMUM_AMOUNT_ABSOLUTE_RMS = 0.1;
const MINIMUM_AMOUNT_RELATIVE_MULTIPLIER = 2;

export type HeroMotionSamplePair = Readonly<{
  current: HeroMotionRawPixelSample;
  ordinal: number;
  previous: HeroMotionRawPixelSample;
}>;

type HeroMotionScalarPairMatch = Readonly<{
  activeOrdinal: number;
  frameDtDelta: number;
  ordinal: number;
  panRateDelta: number;
}>;

export type HeroGrainPixelSummary = Readonly<{
  grain: number;
  grainSize: number;
  sampleCount: number;
  temporalMeanDelta: number;
  temporalResidualNeighborCorrelation: number;
}>;

function getLuma(sample: HeroMotionRawPixelSample): Float64Array {
  const luma = new Float64Array(sample.width * sample.height);
  for (let index = 0; index < luma.length; index += 1) {
    const offset = index * 4;
    luma[index] =
      (sample.pixels[offset] ?? 0) * 0.2126 +
      (sample.pixels[offset + 1] ?? 0) * 0.7152 +
      (sample.pixels[offset + 2] ?? 0) * 0.0722;
  }
  return luma;
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((first, second) => first - second);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2
    : (sorted[middle] ?? 0);
}

export function evaluateHeroMotionAmountMateriality(
  lowScore: number,
  highScore: number,
): HeroMotionAmountMateriality {
  const absoluteMinimum = MINIMUM_AMOUNT_ABSOLUTE_RMS;
  const relativeMinimum = lowScore * MINIMUM_AMOUNT_RELATIVE_MULTIPLIER;
  const absolutePass = highScore >= absoluteMinimum;
  const relativePass = highScore >= relativeMinimum;
  return {
    absoluteMinimum,
    absolutePass,
    passes: absolutePass && relativePass,
    relativeMinimum,
    relativePass,
  };
}

function getTemporalResidualSpatialEvidence(
  residual: Float64Array,
  width: number,
  height: number,
): Readonly<{ correlation: number; variance: number }> {
  const residualMean =
    residual.reduce((sum, value) => sum + value, 0) / residual.length;
  let variance = 0;
  for (const value of residual) variance += (value - residualMean) ** 2;
  variance /= residual.length;

  let adjacentProduct = 0;
  let adjacentCount = 0;
  const addPair = (firstIndex: number, secondIndex: number): void => {
    const first = (residual[firstIndex] ?? 0) - residualMean;
    const second = (residual[secondIndex] ?? 0) - residualMean;
    adjacentProduct += first * second;
    adjacentCount += 1;
  };
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      if (x + 1 < width) addPair(index, index + 1);
      if (y + 1 < height) addPair(index, index + width);
    }
  }
  return {
    correlation:
      variance > Number.EPSILON && adjacentCount > 0
        ? adjacentProduct / adjacentCount / variance
        : 0,
    variance,
  };
}

export function getHeroMotionPixelHash(
  sample: HeroMotionRawPixelSample,
): string {
  let hash = 2_166_136_261;
  for (const channel of sample.pixels) {
    hash = Math.imul(hash ^ channel, 16_777_619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function getHeroMotionMeanAbsoluteLumaDelta(
  first: HeroMotionRawPixelSample,
  second: HeroMotionRawPixelSample,
): number {
  if (first.width !== second.width || first.height !== second.height) {
    throw new Error("Motion pixel samples must share one bounded geometry.");
  }
  const firstLuma = getLuma(first);
  const secondLuma = getLuma(second);
  let delta = 0;
  for (let index = 0; index < firstLuma.length; index += 1) {
    delta += Math.abs((secondLuma[index] ?? 0) - (firstLuma[index] ?? 0));
  }
  return delta / firstLuma.length;
}

export function analyzeHeroMotionPixelPair(
  previous: HeroMotionRawPixelSample,
  current: HeroMotionRawPixelSample,
): HeroMotionPixelPairEvidence {
  if (previous.width !== current.width || previous.height !== current.height) {
    throw new Error("Motion pixel samples must share one bounded geometry.");
  }
  const previousLuma = getLuma(previous);
  const currentLuma = getLuma(current);
  const residual = new Float64Array(currentLuma.length);
  let meanAbsoluteLumaDelta = 0;
  for (let index = 0; index < currentLuma.length; index += 1) {
    const value = (currentLuma[index] ?? 0) - (previousLuma[index] ?? 0);
    residual[index] = value;
    meanAbsoluteLumaDelta += Math.abs(value);
  }
  const spatial = getTemporalResidualSpatialEvidence(
    residual,
    current.width,
    current.height,
  );
  return {
    meanAbsoluteLumaDelta: meanAbsoluteLumaDelta / residual.length,
    temporalResidualVariance: spatial.variance,
    temporalResidualNeighborCorrelation: spatial.correlation,
  };
}

export function getHeroMotionSamplePairs(
  samples: readonly HeroMotionRawPixelSample[],
): readonly HeroMotionSamplePair[] {
  return samples.slice(1).map((current, ordinal) => ({
    current,
    ordinal,
    previous: samples[ordinal]!,
  }));
}

export function getHeroMotionScalarPairDelta(
  control: HeroMotionSamplePair,
  active: HeroMotionSamplePair,
): Readonly<{ frameDtDelta: number; panRateDelta: number }> {
  return {
    frameDtDelta: Math.max(
      Math.abs(active.previous.frame.frameDt - control.previous.frame.frameDt),
      Math.abs(active.current.frame.frameDt - control.current.frame.frameDt),
    ),
    panRateDelta: Math.max(
      Math.abs(active.previous.frame.panRate - control.previous.frame.panRate),
      Math.abs(active.current.frame.panRate - control.current.frame.panRate),
    ),
  };
}

export function isHeroMotionScalarPairMatch(
  delta: Readonly<{ frameDtDelta: number; panRateDelta: number }>,
): boolean {
  return (
    delta.frameDtDelta <= MAX_HERO_MOTION_FRAME_DT_DELTA &&
    delta.panRateDelta <= MAX_HERO_MOTION_PAN_RATE_DELTA
  );
}

function compareMatchSets(
  first: readonly HeroMotionScalarPairMatch[],
  second: readonly HeroMotionScalarPairMatch[],
): number {
  if (first.length !== second.length) return second.length - first.length;
  const sum = (
    matches: readonly HeroMotionScalarPairMatch[],
    read: (match: HeroMotionScalarPairMatch) => number,
  ): number => matches.reduce((total, match) => total + read(match), 0);
  const frameDtOrder =
    sum(first, ({ frameDtDelta }) => frameDtDelta) -
    sum(second, ({ frameDtDelta }) => frameDtDelta);
  if (Math.abs(frameDtOrder) > Number.EPSILON) return frameDtOrder;
  const panRateOrder =
    sum(first, ({ panRateDelta }) => panRateDelta) -
    sum(second, ({ panRateDelta }) => panRateDelta);
  if (Math.abs(panRateOrder) > Number.EPSILON) return panRateOrder;
  for (let index = 0; index < first.length; index += 1) {
    const ordinalOrder =
      first[index]!.ordinal - second[index]!.ordinal ||
      first[index]!.activeOrdinal - second[index]!.activeOrdinal;
    if (ordinalOrder !== 0) return ordinalOrder;
  }
  return 0;
}

export function matchHeroMotionPixelPairs(
  control: readonly HeroMotionRawPixelSample[],
  active: readonly HeroMotionRawPixelSample[],
): readonly HeroMotionTemporalExcessMatch[] {
  const controlPairs = getHeroMotionSamplePairs(control);
  const activePairs = getHeroMotionSamplePairs(active);
  const candidates: HeroMotionScalarPairMatch[][] = [];
  const visit = (
    activeIndex: number,
    minimumControlIndex: number,
    matches: readonly HeroMotionScalarPairMatch[],
  ): void => {
    candidates.push([...matches]);
    for (
      let nextActiveIndex = activeIndex;
      nextActiveIndex < activePairs.length;
      nextActiveIndex += 1
    ) {
      const activePair = activePairs[nextActiveIndex]!;
      for (
        let controlIndex = minimumControlIndex;
        controlIndex < controlPairs.length;
        controlIndex += 1
      ) {
        const controlPair = controlPairs[controlIndex]!;
        const { frameDtDelta, panRateDelta } = getHeroMotionScalarPairDelta(
          controlPair,
          activePair,
        );
        if (!isHeroMotionScalarPairMatch({ frameDtDelta, panRateDelta }))
          continue;
        visit(nextActiveIndex + 1, controlIndex + 1, [
          ...matches,
          {
            activeOrdinal: activePair.ordinal,
            frameDtDelta,
            ordinal: controlPair.ordinal,
            panRateDelta,
          },
        ]);
      }
    }
  };
  visit(0, 0, []);
  const selected = [...candidates].sort(compareMatchSets)[0] ?? [];
  return selected.map((match) => {
    const activePair = activePairs[match.activeOrdinal]!;
    const controlPair = controlPairs[match.ordinal]!;
    const activePixel = analyzeHeroMotionPixelPair(
      activePair.previous,
      activePair.current,
    );
    const controlPixel = analyzeHeroMotionPixelPair(
      controlPair.previous,
      controlPair.current,
    );
    return {
      ...match,
      activeCorrelation: activePixel.temporalResidualNeighborCorrelation,
      activeVariance: activePixel.temporalResidualVariance,
      controlCorrelation: controlPixel.temporalResidualNeighborCorrelation,
      controlVariance: controlPixel.temporalResidualVariance,
      excessAmplitude: getHeroMotionEffectOnlyAmplitude(
        controlPair,
        activePair,
      ),
    };
  });
}

export function summarizeHeroMotionMatchedCorrelation(
  control: readonly HeroMotionRawPixelSample[],
  active: readonly HeroMotionRawPixelSample[],
): HeroMotionMatchedCorrelationSummary {
  const matches = matchHeroMotionPixelPairs(control, active);
  return {
    activeCorrelation: median(
      matches.map(({ activeCorrelation }) => activeCorrelation),
    ),
    controlCorrelation: median(
      matches.map(({ controlCorrelation }) => controlCorrelation),
    ),
    matches,
  };
}

function getHeroMotionEffectOnlySpatialEvidence(
  control: HeroMotionSamplePair,
  active: HeroMotionSamplePair,
): Readonly<{ correlation: number; variance: number }> {
  if (
    control.current.width !== active.current.width ||
    control.current.height !== active.current.height
  ) {
    throw new Error("Effect-isolated motion samples must share one geometry.");
  }
  const controlPrevious = getLuma(control.previous);
  const controlCurrent = getLuma(control.current);
  const activePrevious = getLuma(active.previous);
  const activeCurrent = getLuma(active.current);
  const residual = new Float64Array(activeCurrent.length);
  for (let index = 0; index < residual.length; index += 1) {
    residual[index] =
      (activeCurrent[index] ?? 0) -
      (activePrevious[index] ?? 0) -
      ((controlCurrent[index] ?? 0) - (controlPrevious[index] ?? 0));
  }
  return getTemporalResidualSpatialEvidence(
    residual,
    active.current.width,
    active.current.height,
  );
}

export function getHeroMotionEffectOnlyCorrelation(
  control: HeroMotionSamplePair,
  active: HeroMotionSamplePair,
): number {
  return getHeroMotionEffectOnlySpatialEvidence(control, active).correlation;
}

export function getHeroMotionEffectOnlyAmplitude(
  control: HeroMotionSamplePair,
  active: HeroMotionSamplePair,
): number {
  return Math.sqrt(
    getHeroMotionEffectOnlySpatialEvidence(control, active).variance,
  );
}

export function summarizeHeroMotionTemporalExcess(
  control: readonly HeroMotionRawPixelSample[],
  active: readonly HeroMotionRawPixelSample[],
): HeroMotionTemporalExcessSummary {
  const matches = matchHeroMotionPixelPairs(control, active);
  return {
    matches,
    score: median(matches.map(({ excessAmplitude }) => excessAmplitude)),
  };
}

export function summarizeHeroGrainPixelWindow(
  samples: readonly HeroMotionRawPixelSample[],
): HeroGrainPixelSummary | null {
  const pairs = samples.slice(1).flatMap((current, index) => {
    const previous = samples[index];
    if (
      !previous ||
      previous.frame.grain <= 0.0001 ||
      current.frame.grain <= 0.0001 ||
      previous.frame.panRate <= 0 ||
      current.frame.panRate <= 0
    ) {
      return [];
    }
    return [{ current, pixel: analyzeHeroMotionPixelPair(previous, current) }];
  });
  const peakGrain = Math.max(
    0,
    ...pairs.map(({ current }) => current.frame.grain),
  );
  const selected = pairs
    .filter(({ current }) => current.frame.grain >= peakGrain * 0.72)
    .slice(-5);
  if (selected.length < 3) return null;
  const mean = (read: (sample: (typeof selected)[number]) => number): number =>
    selected.reduce((sum, sample) => sum + read(sample), 0) / selected.length;
  return {
    grain: mean(({ current }) => current.frame.grain),
    grainSize: mean(({ current }) => current.frame.grainSize),
    sampleCount: selected.length,
    temporalMeanDelta: mean(({ pixel }) => pixel.meanAbsoluteLumaDelta),
    temporalResidualNeighborCorrelation: median(
      selected.map(({ pixel }) => pixel.temporalResidualNeighborCorrelation),
    ),
  };
}

export function summarizeHeroHeldGrainPixelWindow(
  samples: readonly HeroMotionRawPixelSample[],
  grainSize: number,
): HeroGrainPixelSummary {
  if (samples.length < 4 || samples.length > 6) {
    throw new Error("Held Grain evidence requires four to six samples.");
  }
  for (const [index, sample] of samples.entries()) {
    if (
      sample.frame.grain <= 0.0001 ||
      sample.frame.grainSize !== grainSize ||
      sample.frame.panRate <= 0
    ) {
      throw new Error(
        "Held Grain samples must all be live at the target size.",
      );
    }
    const previous = samples[index - 1];
    if (previous && sample.frame.sequence !== previous.frame.sequence + 1) {
      throw new Error("Held Grain samples must be consecutive post draws.");
    }
  }
  const pairs = samples.slice(1).map((current, index) => ({
    current,
    pixel: analyzeHeroMotionPixelPair(samples[index]!, current),
  }));
  const mean = (read: (sample: (typeof pairs)[number]) => number): number =>
    pairs.reduce((sum, sample) => sum + read(sample), 0) / pairs.length;
  return {
    grain: mean(({ current }) => current.frame.grain),
    grainSize,
    sampleCount: samples.length,
    temporalMeanDelta: mean(({ pixel }) => pixel.meanAbsoluteLumaDelta),
    temporalResidualNeighborCorrelation: median(
      pairs.map(({ pixel }) => pixel.temporalResidualNeighborCorrelation),
    ),
  };
}

export function getMatchedHeroMotionPixelDelta(
  control: readonly HeroMotionRawPixelSample[],
  active: readonly HeroMotionRawPixelSample[],
): number {
  const count = Math.min(control.length, active.length);
  if (count < 1) throw new Error("Matched motion pixels require both windows.");
  let delta = 0;
  for (let index = 0; index < count; index += 1) {
    delta += getHeroMotionMeanAbsoluteLumaDelta(
      control[index]!,
      active[index]!,
    );
  }
  return delta / count;
}
