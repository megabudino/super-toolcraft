import type { HeroMotionRawPixelSample } from "../src/app/hero-motion-pixel-types";
import {
  getHeroMotionEffectOnlyCorrelation,
  getHeroMotionSamplePairs,
  getHeroMotionScalarPairDelta,
  isHeroMotionScalarPairMatch,
} from "./hero-motion-pixel-evidence";

export type HeroMotionSizeTripleMatch = Readonly<{
  coarseCorrelation: number;
  coarseFrameDtDelta: number;
  coarseOrdinal: number;
  coarsePanRateDelta: number;
  controlOrdinal: number;
  fineCorrelation: number;
  fineFrameDtDelta: number;
  fineOrdinal: number;
  finePanRateDelta: number;
}>;

export type HeroMotionSizeTripleSummary = Readonly<{
  coarseCorrelation: number;
  fineCorrelation: number;
  matches: readonly HeroMotionSizeTripleMatch[];
}>;

export type HeroMotionSizeCorrelationMateriality = Readonly<{
  absoluteMinimum: number;
  absolutePass: boolean;
  passes: boolean;
  relativeMinimum: number;
  relativePass: boolean;
}>;

const MINIMUM_ABSOLUTE_CORRELATION_DELTA = 0.05;
const MINIMUM_COARSE_CORRELATION = 0.05;
const MINIMUM_CORRELATION_MULTIPLIER = 2;

type HeroMotionScalarTripleMatch = Omit<
  HeroMotionSizeTripleMatch,
  "coarseCorrelation" | "fineCorrelation"
>;

function median(values: readonly number[]): number {
  const sorted = [...values].sort((first, second) => first - second);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2
    : (sorted[middle] ?? 0);
}

export function evaluateHeroMotionSizeCorrelationMateriality(
  summary: Pick<
    HeroMotionSizeTripleSummary,
    "coarseCorrelation" | "fineCorrelation"
  >,
): HeroMotionSizeCorrelationMateriality {
  const absoluteMinimum =
    summary.fineCorrelation + MINIMUM_ABSOLUTE_CORRELATION_DELTA;
  const relativeMinimum = Math.max(
    MINIMUM_COARSE_CORRELATION,
    Math.max(0, summary.fineCorrelation) * MINIMUM_CORRELATION_MULTIPLIER,
  );
  const absolutePass = summary.coarseCorrelation >= absoluteMinimum;
  const relativePass = summary.coarseCorrelation >= relativeMinimum;
  return {
    absoluteMinimum,
    absolutePass,
    passes: absolutePass && relativePass,
    relativeMinimum,
    relativePass,
  };
}

function compareTripleMatchSets(
  first: readonly HeroMotionScalarTripleMatch[],
  second: readonly HeroMotionScalarTripleMatch[],
): number {
  if (first.length !== second.length) return second.length - first.length;
  const sum = (
    matches: readonly HeroMotionScalarTripleMatch[],
    read: (match: HeroMotionScalarTripleMatch) => number,
  ): number => matches.reduce((total, match) => total + read(match), 0);
  const frameDtOrder =
    sum(
      first,
      ({ coarseFrameDtDelta, fineFrameDtDelta }) =>
        coarseFrameDtDelta + fineFrameDtDelta,
    ) -
    sum(
      second,
      ({ coarseFrameDtDelta, fineFrameDtDelta }) =>
        coarseFrameDtDelta + fineFrameDtDelta,
    );
  if (Math.abs(frameDtOrder) > Number.EPSILON) return frameDtOrder;
  const panRateOrder =
    sum(
      first,
      ({ coarsePanRateDelta, finePanRateDelta }) =>
        coarsePanRateDelta + finePanRateDelta,
    ) -
    sum(
      second,
      ({ coarsePanRateDelta, finePanRateDelta }) =>
        coarsePanRateDelta + finePanRateDelta,
    );
  if (Math.abs(panRateOrder) > Number.EPSILON) return panRateOrder;
  for (let index = 0; index < first.length; index += 1) {
    const ordinalOrder =
      first[index]!.controlOrdinal - second[index]!.controlOrdinal ||
      first[index]!.fineOrdinal - second[index]!.fineOrdinal ||
      first[index]!.coarseOrdinal - second[index]!.coarseOrdinal;
    if (ordinalOrder !== 0) return ordinalOrder;
  }
  return 0;
}

export function summarizeHeroMotionSizeTriples(
  control: readonly HeroMotionRawPixelSample[],
  fine: readonly HeroMotionRawPixelSample[],
  coarse: readonly HeroMotionRawPixelSample[],
): HeroMotionSizeTripleSummary {
  const controlPairs = getHeroMotionSamplePairs(control);
  const finePairs = getHeroMotionSamplePairs(fine);
  const coarsePairs = getHeroMotionSamplePairs(coarse);
  const memo = new Map<string, readonly HeroMotionScalarTripleMatch[]>();
  const visit = (
    minimumControl: number,
    minimumFine: number,
    minimumCoarse: number,
  ): readonly HeroMotionScalarTripleMatch[] => {
    const key = `${minimumControl}:${minimumFine}:${minimumCoarse}`;
    const cached = memo.get(key);
    if (cached) return cached;
    let best: readonly HeroMotionScalarTripleMatch[] = [];
    for (
      let controlOrdinal = minimumControl;
      controlOrdinal < controlPairs.length;
      controlOrdinal += 1
    ) {
      const controlPair = controlPairs[controlOrdinal]!;
      for (
        let fineOrdinal = minimumFine;
        fineOrdinal < finePairs.length;
        fineOrdinal += 1
      ) {
        const fineDelta = getHeroMotionScalarPairDelta(
          controlPair,
          finePairs[fineOrdinal]!,
        );
        if (!isHeroMotionScalarPairMatch(fineDelta)) continue;
        for (
          let coarseOrdinal = minimumCoarse;
          coarseOrdinal < coarsePairs.length;
          coarseOrdinal += 1
        ) {
          const coarseDelta = getHeroMotionScalarPairDelta(
            controlPair,
            coarsePairs[coarseOrdinal]!,
          );
          if (!isHeroMotionScalarPairMatch(coarseDelta)) continue;
          const candidate = [
            {
              coarseFrameDtDelta: coarseDelta.frameDtDelta,
              coarseOrdinal,
              coarsePanRateDelta: coarseDelta.panRateDelta,
              controlOrdinal,
              fineFrameDtDelta: fineDelta.frameDtDelta,
              fineOrdinal,
              finePanRateDelta: fineDelta.panRateDelta,
            },
            ...visit(controlOrdinal + 1, fineOrdinal + 1, coarseOrdinal + 1),
          ];
          if (compareTripleMatchSets(candidate, best) < 0) best = candidate;
        }
      }
    }
    memo.set(key, best);
    return best;
  };
  const selected = visit(0, 0, 0);
  const matches = selected.map((match) => {
    const controlPair = controlPairs[match.controlOrdinal]!;
    return {
      ...match,
      coarseCorrelation: getHeroMotionEffectOnlyCorrelation(
        controlPair,
        coarsePairs[match.coarseOrdinal]!,
      ),
      fineCorrelation: getHeroMotionEffectOnlyCorrelation(
        controlPair,
        finePairs[match.fineOrdinal]!,
      ),
    };
  });
  return {
    coarseCorrelation: median(
      matches.map(({ coarseCorrelation }) => coarseCorrelation),
    ),
    fineCorrelation: median(
      matches.map(({ fineCorrelation }) => fineCorrelation),
    ),
    matches,
  };
}
